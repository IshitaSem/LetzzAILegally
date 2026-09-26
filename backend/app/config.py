import os
from pathlib import Path
from typing import Optional
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

    # Proxy Configuration (for environments requiring outbound proxy like PythonAnywhere free tier)
    HTTP_PROXY: Optional[str] = os.getenv("HTTP_PROXY", None)
    HTTPS_PROXY: Optional[str] = os.getenv("HTTPS_PROXY", None)

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

    @property
    def effective_proxy(self) -> Optional[str]:
        """Detect outbound proxy URL from config, environment, or PythonAnywhere environment."""
        proxy = (
            self.HTTPS_PROXY
            or self.HTTP_PROXY
            or os.environ.get("https_proxy")
            or os.environ.get("http_proxy")
            or os.environ.get("HTTPS_PROXY")
            or os.environ.get("HTTP_PROXY")
        )
        if not proxy:
            # Auto-detect PythonAnywhere environment (free tier outbound proxy)
            is_pythonanywhere = (
                os.environ.get("PYTHONANYWHERE_SITE")
                or os.environ.get("PYTHONANYWHERE_DOMAIN")
                or "pythonanywhere" in os.environ.get("HOSTNAME", "").lower()
                or "pythonanywhere" in str(BASE_DIR).lower()
                or os.path.exists("/var/log/pythonanywhere")
                or os.path.exists("/etc/pythonanywhere")
            )
            if is_pythonanywhere:
                proxy = "http://proxy.server:3128"
        return proxy

settings = Settings()

# If proxy is configured or detected, populate standard environment variables
if settings.effective_proxy:
    for var in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY"):
        os.environ.setdefault(var, settings.effective_proxy)

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
