import os
import sys
from pathlib import Path
from typing import Any, Optional
from pydantic import field_validator
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

    # AI Configuration - Centralized Model Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "mock")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_FALLBACK_MODELS: list[str] = [
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
    ]

    @staticmethod
    def _is_obsolete_model(model_name: str) -> bool:
        """Check if a model name belongs to a retired generation (1.5, 2.0, 1.0, etc.)."""
        name = str(model_name).lower().strip()
        return (
            "1.5" in name
            or "2.0" in name
            or "1.0" in name
            or name in ("gemini-pro", "gemini-flash")
        )

    @field_validator("GEMINI_MODEL", mode="after")
    @classmethod
    def sanitize_gemini_model(cls, v: str) -> str:
        """Ensure obsolete 1.5, 2.0, and retired models are automatically upgraded to current 2.5-flash."""
        if not v or cls._is_obsolete_model(v):
            return "gemini-2.5-flash"
        return v.strip()

    @field_validator("GEMINI_FALLBACK_MODELS", mode="before")
    @classmethod
    def parse_fallback_models(cls, v: Any) -> list[str]:
        """Safely parse fallback models and filter obsolete versions."""
        defaults = [
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
        ]
        if isinstance(v, str):
            parts = [p.strip() for p in v.split(",") if p.strip()]
            valid = [p for p in parts if not cls._is_obsolete_model(p)]
            return valid if valid else defaults
        if isinstance(v, (list, tuple)):
            valid = [
                str(p).strip()
                for p in v
                if str(p).strip() and not cls._is_obsolete_model(str(p))
            ]
            return valid if valid else defaults
        return defaults

    @property
    def candidate_gemini_models(self) -> list[str]:
        """Return unique ordered list of active candidate Gemini models."""
        models: list[str] = []
        for m in [self.GEMINI_MODEL] + self.GEMINI_FALLBACK_MODELS:
            if m and m not in models and not self._is_obsolete_model(m):
                models.append(m)
        return models

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
            # Checks Uvicorn DOMAIN_SOCKET, CLI arguments, environment values, and paths
            is_pythonanywhere = (
                os.environ.get("PYTHONANYWHERE_SITE")
                or os.environ.get("PYTHONANYWHERE_DOMAIN")
                or "pythonanywhere" in os.environ.get("DOMAIN_SOCKET", "").lower()
                or any("pythonanywhere" in str(arg).lower() for arg in sys.argv)
                or any("pythonanywhere" in str(v).lower() for v in os.environ.values())
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
        os.environ[var] = settings.effective_proxy

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
