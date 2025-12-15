from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router

__version__ = "1.0.0"

app = FastAPI(
    title="Open Alpha API",
    description="Enterprise-Grade Quantitative Factor Analysis Platform",
    version=__version__,
)

# CORS
origins = [
    "*", # Allow all for local dev convenience to avoid port issues
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
