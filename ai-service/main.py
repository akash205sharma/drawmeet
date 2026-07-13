from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pathlib import Path

from routes import router 

app = FastAPI(
    title="DrawMeet AI Service",
    version="1.0.0"
)

app.include_router(router)


@app.get("/", response_class=HTMLResponse)
async def home():
    html = Path("entry.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html)