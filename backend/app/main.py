from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import health, chat, documents

app = FastAPI(
    title="LetzAiLegally API",
    description=(
        "LetzAiLegally is an AI-powered legal assistant designed to help users understand "
        "legal information, analyze legal documents, ask legal questions, and find supporting legal sources."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = settings.parsed_allowed_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router Modules
app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "description": settings.APP_DESCRIPTION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
