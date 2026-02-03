from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
import os
from dotenv import load_dotenv
from groq import Groq
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
import asyncio
import secrets
import jwt
from passlib.context import CryptContext

load_dotenv()

app = FastAPI(title="LexiBridge Intelligence API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "lexibridge")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Groq API client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is required")

groq_client = Groq(api_key=GROQ_API_KEY)

# Authentication
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["_id"] = str(user["_id"])
    return user

# Request/Response models
class DocumentRequest(BaseModel):
    text: str
    document_type: Optional[str] = "land_document"

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LegalEntity(BaseModel):
    survey_numbers: List[str]
    ownership_details: Dict
    land_extents: Dict
    encumbrances: List[str]
    risks: List[str]
    missing_data: List[str]
    notable_clauses: List[str]

class DocumentResponse(BaseModel):
    document_id: str
    simplified_summary: List[str]
    legal_entities: LegalEntity
    processed_at: str

# AI Prompt for document analysis
ANALYSIS_PROMPT = """You are a legal document analysis AI specialized in land and property documents from Andhra Pradesh, India.

Analyze the following document text and extract key information. Provide your response in JSON format with the following structure:

{{
    "simplified_summary": [
        "Bullet point 1: Key finding in simple language",
        "Bullet point 2: Another important point",
        ...
    ],
    "legal_entities": {{
        "survey_numbers": ["survey number 1", "survey number 2", ...],
        "ownership_details": {{
            "owner_name": "name if found",
            "co_owners": ["name1", "name2", ...],
            "ownership_type": "individual/joint/company/etc",
            "transfer_history": "brief description if mentioned"
        }},
        "land_extents": {{
            "total_area": "area in acres/hectares",
            "area_breakdown": "detailed breakdown if available",
            "location": "village/mandal/district details"
        }},
        "encumbrances": [
            "Any mortgages, liens, or legal claims mentioned",
            ...
        ],
        "risks": [
            "Potential legal risks or concerns identified",
            ...
        ],
        "missing_data": [
        "Important information that appears to be missing",
        ...
        ],
        "notable_clauses": [
            "Important clauses or conditions mentioned",
            ...
        ]
    }}
}}

Document text to analyze:
{text}

IMPORTANT: 
- Respond ONLY with valid JSON, no additional text
- Use simple, non-legal language in simplified_summary
- If information is not found, use empty arrays or null values
- Focus on Andhra Pradesh land document formats
- Identify regional language terms and translate them to English"""

async def analyze_document_with_ai(text: str) -> Dict:
    """Use Groq API to analyze the document"""
    try:
        prompt = ANALYSIS_PROMPT.format(text=text[:8000])  # Limit text length
        
        # Try with JSON mode first, fallback to regular if not supported
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a legal document analysis expert. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-70b-versatile",
                temperature=0.3,
                response_format={"type": "json_object"}
            )
        except Exception:
            # Fallback if JSON mode not supported
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a legal document analysis expert. Always respond with valid JSON only, no markdown, no code blocks."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-70b-versatile",
                temperature=0.3
            )
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

async def simulate_progress():
    """Simulate progress updates for real-time feedback"""
    progress_steps = [
        {"step": "reading", "message": "Reading document...", "progress": 10},
        {"step": "extracting", "message": "Extracting legal entities...", "progress": 25},
        {"step": "analyzing", "message": "Analyzing ownership details...", "progress": 40},
        {"step": "identifying", "message": "Identifying survey numbers...", "progress": 55},
        {"step": "checking", "message": "Checking for encumbrances...", "progress": 70},
        {"step": "assessing", "message": "Assessing potential risks...", "progress": 85},
        {"step": "generating", "message": "Generating simplified summary...", "progress": 95},
    ]
    
    for step_data in progress_steps:
        yield f"data: {json.dumps(step_data)}\n\n"
        await asyncio.sleep(0.3)

@app.post("/api/analyze", response_model=DocumentResponse)
async def analyze_document(
    request: DocumentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Main endpoint to analyze a legal document"""
    try:
        # Analyze document with AI
        analysis_result = await analyze_document_with_ai(request.text)
        
        # Store in MongoDB with user_id
        document_record = {
            "user_id": current_user["_id"],
            "original_text": request.text,
            "document_type": request.document_type,
            "analysis_result": analysis_result,
            "processed_at": datetime.now(timezone.utc),
            "simplified_summary": analysis_result.get("simplified_summary", []),
            "legal_entities": analysis_result.get("legal_entities", {})
        }
        
        # Update user document count
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$inc": {"document_count": 1}}
        )
        
        result = await db.documents.insert_one(document_record)
        document_id = str(result.inserted_id)
        
        # Format response
        legal_entities = analysis_result.get("legal_entities", {})
        
        return DocumentResponse(
            document_id=document_id,
            simplified_summary=analysis_result.get("simplified_summary", []),
            legal_entities=LegalEntity(
                survey_numbers=legal_entities.get("survey_numbers", []),
                ownership_details=legal_entities.get("ownership_details", {}),
                land_extents=legal_entities.get("land_extents", {}),
                encumbrances=legal_entities.get("encumbrances", []),
                risks=legal_entities.get("risks", []),
                missing_data=legal_entities.get("missing_data", []),
                notable_clauses=legal_entities.get("notable_clauses", [])
            ),
            processed_at=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

@app.get("/api/analyze/stream")
async def analyze_document_stream(text: str):
    """Streaming endpoint for real-time progress updates"""
    async def generate():
        async for progress in simulate_progress():
            yield progress
        # After progress, send the actual analysis
        try:
            analysis_result = await analyze_document_with_ai(text)
            yield f"data: {json.dumps({'step': 'complete', 'result': analysis_result})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/api/documents/{document_id}")
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve a previously analyzed document"""
    try:
        document = await db.documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": current_user["_id"]
        })
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document["_id"] = str(document["_id"])
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")

@app.delete("/api/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a document"""
    try:
        result = await db.documents.delete_one({
            "_id": ObjectId(document_id),
            "user_id": current_user["_id"]
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Decrement document count
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$inc": {"document_count": -1}}
        )
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(request.password)
    user_data = {
        "name": request.name,
        "email": request.email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "phone": "",
        "address": "",
        "document_count": 0
    }
    
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Create token
    token = create_access_token(data={"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": request.name,
            "email": request.email,
            "created_at": user_data["created_at"].isoformat()
        }
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"].isoformat() if "created_at" in user else None
        }
    }

@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": current_user["_id"],
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "phone": current_user.get("phone", ""),
        "address": current_user.get("address", ""),
        "created_at": current_user.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(current_user.get("created_at"), datetime) else current_user.get("created_at"),
        "document_count": current_user.get("document_count", 0)
    }

@app.put("/api/user/profile")
async def update_profile(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {}
    if "name" in request:
        update_data["name"] = request["name"]
    if "phone" in request:
        update_data["phone"] = request["phone"]
    if "address" in request:
        update_data["address"] = request["address"]
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    updated_user["_id"] = str(updated_user["_id"])
    return updated_user

@app.get("/api/user/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard data"""
    user_id = current_user["_id"]
    
    # Get document count
    total_docs = await db.documents.count_documents({"user_id": user_id})
    
    # Get recent documents
    recent_docs = await db.documents.find(
        {"user_id": user_id}
    ).sort("processed_at", -1).limit(5).to_list(length=5)
    
    for doc in recent_docs:
        doc["_id"] = str(doc["_id"])
    
    return {
        "totalDocuments": total_docs,
        "recentDocuments": recent_docs
    }

@app.get("/api/user/documents")
async def get_user_documents(
    filter: str = "all",
    current_user: dict = Depends(get_current_user)
):
    """Get user documents"""
    user_id = current_user["_id"]
    query = {"user_id": user_id}
    
    if filter == "recent":
        # Last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        query["processed_at"] = {"$gte": thirty_days_ago}
    elif filter == "land_document":
        query["document_type"] = "land_document"
    
    documents = await db.documents.find(query).sort("processed_at", -1).to_list(length=100)
    
    for doc in documents:
        doc["_id"] = str(doc["_id"])
    
    return {"documents": documents}

@app.put("/api/user/settings")
async def update_settings(
    settings: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings"""
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"settings": settings}}
    )
    return {"message": "Settings updated"}

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(request.password)
    user_data = {
        "name": request.name,
        "email": request.email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "phone": "",
        "address": "",
        "document_count": 0
    }
    
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    token = create_access_token(data={"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": request.name,
            "email": request.email,
            "created_at": user_data["created_at"].isoformat()
        }
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"].isoformat() if "created_at" in user else None
        }
    }

@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": current_user["_id"],
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "phone": current_user.get("phone", ""),
        "address": current_user.get("address", ""),
        "created_at": current_user.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(current_user.get("created_at"), datetime) else current_user.get("created_at"),
        "document_count": current_user.get("document_count", 0)
    }

@app.put("/api/user/profile")
async def update_profile(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {}
    if "name" in request:
        update_data["name"] = request["name"]
    if "phone" in request:
        update_data["phone"] = request["phone"]
    if "address" in request:
        update_data["address"] = request["address"]
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    updated_user["_id"] = str(updated_user["_id"])
    return updated_user

@app.get("/api/user/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard data"""
    user_id = current_user["_id"]
    total_docs = await db.documents.count_documents({"user_id": user_id})
    recent_docs = await db.documents.find(
        {"user_id": user_id}
    ).sort("processed_at", -1).limit(5).to_list(length=5)
    
    for doc in recent_docs:
        doc["_id"] = str(doc["_id"])
    
    return {
        "totalDocuments": total_docs,
        "recentDocuments": recent_docs
    }

@app.get("/api/user/documents")
async def get_user_documents(
    filter: str = "all",
    current_user: dict = Depends(get_current_user)
):
    """Get user documents"""
    user_id = current_user["_id"]
    query = {"user_id": user_id}
    
    if filter == "recent":
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        query["processed_at"] = {"$gte": thirty_days_ago}
    elif filter == "land_document":
        query["document_type"] = "land_document"
    
    documents = await db.documents.find(query).sort("processed_at", -1).to_list(length=100)
    
    for doc in documents:
        doc["_id"] = str(doc["_id"])
    
    return {"documents": documents}

@app.put("/api/user/settings")
async def update_settings(
    settings: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings"""
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"settings": settings}}
    )
    return {"message": "Settings updated"}

@app.get("/")
async def root():
    """Root endpoint - redirects to API docs"""
    return {
        "message": "LexiBridge Intelligence API",
        "docs": "/docs",
        "health": "/api/health",
        "status": "running"
    }

@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint"""
    # Return a simple empty response or a basic icon
    # You can replace this with an actual favicon file if needed
    return Response(content="", media_type="image/x-icon")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "LexiBridge Intelligence API",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
