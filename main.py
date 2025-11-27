"""
Main entry point for the backend server
"""
import uvicorn
from backend.server import app
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    print("🚀 Starting AI Debugging Sandbox Server...")
    print("📡 API Documentation: http://localhost:8000/docs")
    print("🔧 Backend running on: http://localhost:8000")
    
    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
