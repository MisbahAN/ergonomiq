# Hardware How-To-Run

## FastAPI Backend (`hardware/api`)

1. **Navigate to Backend Directory**
   ```bash
   cd hardware/api
   ```
   This folder contains `main.py`, `requirements.txt`, and the other backend files.

2. **Create & Activate Virtual Environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate        # Linux/macOS
   # or .venv\Scripts\activate      # Windows
   ```
   Keeping dependencies inside `.venv` prevents pollution of your global Python install. You will see `(.venv)` in your prompt when it’s active.

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip list   # optional sanity check
   ```
   This installs FastAPI, Uvicorn, and the other libraries the shim needs.

4. **Confirm Entry Point**
   Ensure `main.py` exposes a FastAPI app named `app`:
   ```python
   from fastapi import FastAPI

   app = FastAPI()

   @app.get("/health")
   def health():
       return {"status": "ready"}
   ```
   With this in place Uvicorn can target `main:app`.

5. **Run Development Server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The API is now available at `http://localhost:8000`. Leave the terminal running while you develop; use `Ctrl+C` to stop and `deactivate` when you’re done.

## Simulated Data (`hardware/debug.py`)

To stream fake data instead of connecting to a device:

1. Open a new terminal (keep the API running if needed).
2. Run the debug script from the hardware root:
   ```bash
   cd hardware
   python debug.py
   ```
   This feeds simulated telemetry, which is useful for UI work when no hardware is attached.
