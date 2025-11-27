"""
Configuration file for the AI Debugging Sandbox
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    # CORS Settings
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    
    # LLM Settings
    llm_model: str = "codellama:7b"
    llm_temperature: float = 0.1
    ollama_base_url: str = "http://localhost:11434"
    
    # Debugging Settings
    max_iterations: int = 10
    execution_timeout: int = 10  # seconds
    
    # Docker Settings
    sandbox_container: str = "sandbox-container"
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
