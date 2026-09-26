import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "LetzAiLegally"
    APP_DESCRIPTION: str = (
        "LetzAiLegally is an AI-powered legal assistant designed to help users understand "
        "legal information, analyze legal documents, ask legal questions, and find supporting legal sources."
    )
    ENV: str = os.getenv("ENV", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "mock")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # Document Uploads
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".txt", ".docx"]

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:8443,http://127.0.0.1:5173,http://127.0.0.1:8443,https://letzz-ai-legally.vercel.app"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def parsed_allowed_origins(self) -> list[str]:
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
