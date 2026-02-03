# LexiBridge Intelligence - Backend

FastAPI backend for the LexiBridge Intelligence system.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

Then edit `.env` and add your credentials:
```
GROQ_API_KEY=your_key_here
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=lexibridge
```

3. Run the server:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
