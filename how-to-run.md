# How to Run the BioAmp Wrist + Posture Stack

These steps spin up both the FastAPI-based hardware shim and the React/Vite frontend on the same machine. Follow them from the repo root.

## 1. Requirements

- Python 3.9 (matches teammate setup; other 3.9.x builds are fine)
- Node.js 18+ (or the version used previously with Vite)
- npm (bundled with Node)
- A working serial device or the mocked `/dev/cu.usbmodem11301`

## 2. One-time setup

### Hardware API virtualenv

```bash
cd hardware/api
python3.9 -m venv .venv
source .venv/bin/activate            # On Windows use: .\.venv\Scripts\activate
pip install -r requirements.txt
deactivate
```

This installs FastAPI, Uvicorn, and PySerial without touching your system Python. Any edits inside `hardware/api` that you add must be tagged with `# Misbah added`.

### Frontend dependencies

```bash
cd frontend
npm install
```

## 3. Running everything locally

The `npm run dev` script already launches both the Vite dev server (port 8080) and Uvicorn (port 8000) via `concurrently`. It assumes the `python3` it finds has the API dependencies; if it doesn’t, you’ll see `No module named uvicorn`.

### Recommended flow (activate venv first)

```bash
cd hardware/api
source .venv/bin/activate
cd ../../frontend
VITE_HARDWARE_API_URL=http://localhost:8000 npm run dev
```

- Activating the venv ensures `${PYTHON:-python3}` inside `npm run dev` points to `.venv/bin/python`, which already has Uvicorn.
- `VITE_HARDWARE_API_URL` lets the wrist UI call the local API; change it if you host the shim elsewhere.

Press `Ctrl+C` once to stop the frontend and once more (if needed) to stop Uvicorn, then `deactivate` to leave the venv.

### Alternative flow (override PYTHON env var)

If you don’t want to activate the venv in your shell, point the script at it:

```bash
cd frontend
PYTHON=../hardware/api/.venv/bin/python \
VITE_HARDWARE_API_URL=http://localhost:8000 \
npm run dev
```

Now `npm run dev` uses the specified interpreter even if your default `python3` comes from Anaconda/Homebrew.

## 4. Verifying the API

After the dev server starts you can hit the shim directly:

```bash
curl http://localhost:8000/connect | jq
curl -X POST http://localhost:8000/start | jq
curl http://localhost:8000/stream | jq
curl -X POST http://localhost:8000/rsi -H "content-type: application/json" \
  -d '{"event_type":"rsi_interval","elapsed_time":5.5,"total_time":5.5}' | jq
```

If you see `No module named uvicorn`, install the deps inside whichever Python you’re using (`python3 -m pip install fastapi uvicorn[standard] pyserial`) or follow the venv method above.

## 5. Deployments / hosted builds

- Vercel deployments don’t run the Python shim, so the wrist page will display “Device not connected” unless `VITE_HARDWARE_API_URL` points to a reachable API.
- For hardware testing on another machine, set `VITE_HARDWARE_API_URL` to that host’s URL before running `npm run dev`.
