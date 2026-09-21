import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Industrio Server")

SAVES_DIR = os.path.join(os.path.dirname(__file__), "saves")
os.makedirs(SAVES_DIR, exist_ok=True)

class SaveData(BaseModel):
    filename: str
    data: dict

@app.get("/api/saves")
def list_saves():
    files = [f for f in os.listdir(SAVES_DIR) if f.endswith(".json")]
    return {"saves": files}

@app.post("/api/save")
def save_game(payload: SaveData):
    filename = payload.filename.strip()
    if not filename.endswith(".json"):
        filename += ".json"

    # Sanitize filename
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(SAVES_DIR, safe_filename)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload.data, f, indent=2)
        return {"status": "success", "filename": safe_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/load/{filename}")
def load_game(filename: str):
    safe_filename = os.path.basename(filename)
    if not safe_filename.endswith(".json"):
        safe_filename += ".json"
    filepath = os.path.join(SAVES_DIR, safe_filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Save file not found")

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"status": "success", "filename": safe_filename, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve static frontend files if built in dist
DIST_DIR = os.path.join(os.path.dirname(__file__), "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        target = os.path.join(DIST_DIR, full_path)
        if os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
