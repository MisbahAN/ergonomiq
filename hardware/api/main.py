# Misbah added
import asyncio  # Misbah added
import glob  # Misbah added
import os  # Misbah added
import sys  # Misbah added
import time  # Misbah added
from datetime import datetime, timezone  # Misbah added
from typing import Literal, Optional  # Misbah added
from uuid import uuid4  # Misbah added
import sys
import pyfirmata  # Misbah added
from fastapi import FastAPI, HTTPException  # Misbah added
from fastapi.middleware.cors import CORSMiddleware  # Misbah added
from pydantic import BaseModel, Field  # Misbah added


# Misbah added
class RsiPayload(BaseModel):  # Misbah added
  event_type: Literal["detection", "rsi_interval"] = Field(..., description="Incoming telemetry classification")  # Misbah added
  time: Optional[float] = Field(None, description="Seconds since session start reported by firmware")  # Misbah added
  mean_envelope: Optional[float] = Field(None, description="Mean envelope reported for detections")  # Misbah added
  elapsed_time: Optional[float] = Field(None, description="Duration (seconds) of the recently finished RSI interval")  # Misbah added
  total_time: Optional[float] = Field(None, description="Total accumulated RSI time reported by firmware")  # Misbah added


# Misbah added
class RsiSession(BaseModel):  # Misbah added
  id: str  # Misbah added
  recordedAt: datetime  # Misbah added
  durationSeconds: float  # Misbah added
  cumulativeRiskSeconds: float  # Misbah added
  meanEnvelope: Optional[float]  # Misbah added


# Misbah added
class RsiDetection(BaseModel):  # Misbah added
  id: str  # Misbah added
  recordedAt: datetime  # Misbah added
  timecodeSeconds: Optional[float]  # Misbah added
  meanEnvelope: Optional[float]  # Misbah added


# Misbah added
class RsiSummary(BaseModel):  # Misbah added
  totalSessions: int  # Misbah added
  averageSessionSeconds: float  # Misbah added
  longestSessionSeconds: float  # Misbah added
  totalRiskSeconds: float  # Misbah added


# Misbah added
class RsiResponse(BaseModel):  # Misbah added
  summary: RsiSummary  # Misbah added
  sessions: list[RsiSession]  # Misbah added
  detections: list[RsiDetection]  # Misbah added


# Misbah added
app = FastAPI(title="BioAmp Wrist API", description="Receives on-device RSI telemetry and exposes session analytics.", version="0.1.0")  # Misbah added


# Misbah added
app.add_middleware(  # Misbah added
  CORSMiddleware,  # Misbah added
  allow_origins=["*"],  # Misbah added
  allow_credentials=True,  # Misbah added
  allow_methods=["*"],  # Misbah added
  allow_headers=["*"],  # Misbah added
)  # Misbah added


# Misbah added
BAUD_RATE = int(os.environ.get("FIRMATA_BAUD", "57600"))  # Misbah added
PIN_13 = 13  # Misbah added
PORT_ENV_VAR = "FIRMATA_PORT"  # Misbah added
# Misbah added
PORT_CANDIDATES = [  # Misbah added
  "/dev/cu.usbmodem1201",  # Misbah added
  "/dev/cu.usbmodem1101",  # Misbah added
  "/dev/cu.usbserial-1410",  # Misbah added
  "/dev/ttyACM0",  # Misbah added
  "/dev/ttyACM1",  # Misbah added
  "/dev/ttyUSB0",  # Misbah added
  "COM3",  # Misbah added
  "COM4",  # Misbah added
]  # Misbah added
PORT_PATTERNS = [  # Misbah added
  "/dev/cu.usbmodem*",  # Misbah added
  "/dev/cu.usbserial*",  # Misbah added
  "/dev/ttyACM*",  # Misbah added
  "/dev/ttyUSB*",  # Misbah added
]  # Misbah added
MAX_INIT_ATTEMPTS = int(os.environ.get("FIRMATA_MAX_ATTEMPTS", "3"))  # Misbah added
RETRY_DELAY_SECONDS = float(os.environ.get("FIRMATA_RETRY_DELAY", "1.5"))  # Misbah added
BOARD_WAKE_DELAY_SECONDS = float(os.environ.get("FIRMATA_WAKE_DELAY", "1.5"))  # Misbah added
VIBRATION_DURATION_SECONDS = float(os.environ.get("VIBRATION_DURATION", "0.5"))  # Misbah added


# Misbah added
board = None  # Misbah added
board_iterator = None  # Misbah added
pin13 = None  # Misbah added
init_lock = asyncio.Lock()  # Misbah added
vibration_lock = asyncio.Lock()  # Misbah added


# Misbah added
MAX_TRACKED_SESSIONS = 200  # Misbah added
MAX_TRACKED_DETECTIONS = 400  # Misbah added
_sessions: list[RsiSession] = []  # Misbah added
_detections: list[RsiDetection] = []  # Misbah added


# Misbah added
def _summary() -> RsiSummary:  # Misbah added
  durations = [session.durationSeconds for session in _sessions]  # Misbah added
  total_sessions = len(durations)  # Misbah added
  total_time = float(sum(durations))  # Misbah added
  longest = max(durations) if durations else 0.0  # Misbah added
  average = (total_time / total_sessions) if total_sessions else 0.0  # Misbah added
  cumulative_risk = _sessions[-1].cumulativeRiskSeconds if _sessions else 0.0  # Misbah added
  return RsiSummary(  # Misbah added
    totalSessions=total_sessions,  # Misbah added
    averageSessionSeconds=round(average, 2),  # Misbah added
    longestSessionSeconds=round(longest, 2),  # Misbah added
    totalRiskSeconds=round(cumulative_risk, 2),  # Misbah added
  )  # Misbah added


# Misbah added
def _append_session(duration: float, cumulative_risk: float, mean_envelope: Optional[float]) -> RsiSession:  # Misbah added
  session = RsiSession(  # Misbah added
    id=str(uuid4()),  # Misbah added
    recordedAt=datetime.now(timezone.utc),  # Misbah added
    durationSeconds=round(duration, 2),  # Misbah added
    cumulativeRiskSeconds=round(cumulative_risk, 2),  # Misbah added
    meanEnvelope=mean_envelope,  # Misbah added
  )  # Misbah added
  _sessions.append(session)  # Misbah added
  if len(_sessions) > MAX_TRACKED_SESSIONS:  # Misbah added
    del _sessions[0 : len(_sessions) - MAX_TRACKED_SESSIONS]  # Misbah added
  return session  # Misbah added


# Misbah added
def _append_detection(timecode: Optional[float], mean_envelope: Optional[float]) -> RsiDetection:  # Misbah added
  detection = RsiDetection(  # Misbah added
    id=str(uuid4()),  # Misbah added
    recordedAt=datetime.now(timezone.utc),  # Misbah added
    timecodeSeconds=timecode,  # Misbah added
    meanEnvelope=mean_envelope,  # Misbah added
  )  # Misbah added
  _detections.append(detection)  # Misbah added
  if len(_detections) > MAX_TRACKED_DETECTIONS:  # Misbah added
    del _detections[0 : len(_detections) - MAX_TRACKED_DETECTIONS]  # Misbah added
  return detection  # Misbah added


# Misbah added
def iter_serial_port_candidates():  # Misbah added
  seen: set[str] = set()  # Misbah added
  env_port = os.environ.get(PORT_ENV_VAR)  # Misbah added
  if env_port:  # Misbah added
    yield env_port  # Misbah added
    seen.add(env_port)  # Misbah added

  for port in PORT_CANDIDATES:  # Misbah added
    if port and port not in seen:  # Misbah added
      seen.add(port)  # Misbah added
      yield port  # Misbah added

  for pattern in PORT_PATTERNS:  # Misbah added
    for match in sorted(glob.glob(pattern)):  # Misbah added
      if match not in seen:  # Misbah added
        seen.add(match)  # Misbah added
        yield match  # Misbah added


# Misbah added
BOARD_FACTORIES = (pyfirmata.ArduinoMega, pyfirmata.Arduino)  # Misbah added


# Misbah added
def _attempt_board_initialization():  # Misbah added
  last_error: Exception | None = None  # Misbah added
  attempt = 1  # Misbah added
  while MAX_INIT_ATTEMPTS == 0 or attempt <= MAX_INIT_ATTEMPTS:  # Misbah added
    for port in iter_serial_port_candidates():  # Misbah added
      for factory in BOARD_FACTORIES:  # Misbah added
        new_board = None  # Misbah added
        try:  # Misbah added
          print(sys.version_info, file=sys.stdout)

          print(f"[FIRMATA] Attempt {attempt}: connecting to {port} as {factory.__name__}", file=sys.stdout)  # Misbah added
          new_board = factory(port, baudrate=BAUD_RATE)  # Misbah added
          iterator = pyfirmata.util.Iterator(new_board)  # Misbah added
          iterator.start()  # Misbah added
          time.sleep(BOARD_WAKE_DELAY_SECONDS)  # Misbah added
          pin = new_board.get_pin(f'd:{PIN_13}:o')  # Misbah added
          if pin is None:  # Misbah added
            raise RuntimeError(f"Pin lookup failed on {port}")  # Misbah added
          print(f"[FIRMATA] Connected on {port} using {factory.__name__}", file=sys.stdout)  # Misbah added
          return new_board, iterator, pin  # Misbah added
        except Exception as exc:  # Misbah added
          last_error = exc  # Misbah added
          print(f"[FIRMATA] Failed on {port} with {factory.__name__}: {exc}", file=sys.stdout)  # Misbah added
          if new_board is not None:  # Misbah added
            try:  # Misbah added
              new_board.exit()  # Misbah added
            except Exception:  # Misbah added
              pass  # Misbah added
          time.sleep(RETRY_DELAY_SECONDS)  # Misbah added
    attempt += 1  # Misbah added

  raise RuntimeError(f"Unable to initialize board: {last_error}")  # Misbah added


# Misbah added
async def ensure_board_ready() -> bool:  # Misbah added
  global board, board_iterator, pin13  # Misbah added
  if pin13 is not None:  # Misbah added
    return True  # Misbah added
  async with init_lock:  # Misbah added
    if pin13 is not None:  # Misbah added
      return True  # Misbah added
    loop = asyncio.get_running_loop()  # Misbah added
    try:  # Misbah added
      board, board_iterator, pin13 = await loop.run_in_executor(None, _attempt_board_initialization)  # Misbah added
      return True  # Misbah added
    except Exception as exc:  # Misbah added
      print(f"[FIRMATA] Initialization failed: {exc}", file=sys.stdout)  # Misbah added
      return False  # Misbah added


# Misbah added
@app.on_event("startup")  # Misbah added
async def startup_event():  # Misbah added
  await ensure_board_ready()  # Misbah added


# Misbah added
@app.on_event("shutdown")  # Misbah added
async def shutdown_event():  # Misbah added
  global board, board_iterator, pin13  # Misbah added
  if board is not None:  # Misbah added
    try:  # Misbah added
      board.exit()  # Misbah added
    finally:  # Misbah added
      board = None  # Misbah added
      board_iterator = None  # Misbah added
      pin13 = None  # Misbah added


# Misbah added
@app.api_route("/vibrate", methods=["GET", "POST"])  # Misbah added
async def vibrate(reason: Optional[str] = None):  # Misbah added
  ready = await ensure_board_ready()  # Misbah added
  if not ready or pin13 is None:  # Misbah added
    raise HTTPException(status_code=503, detail="Board not initialized")  # Misbah added
  async with vibration_lock:  # Misbah added
    pin13.write(1)  # Misbah added
    await asyncio.sleep(VIBRATION_DURATION_SECONDS)  # Misbah added
    pin13.write(0)  # Misbah added
  return {"status": "ok", "reason": reason}  # Misbah added


# Misbah added
@app.get("/rsi", response_model=RsiResponse)  # Misbah added
async def get_rsi() -> RsiResponse:  # Misbah added
  return RsiResponse(summary=_summary(), sessions=list(_sessions), detections=list(_detections))  # Misbah added


# Misbah added
@app.post("/rsi", response_model=RsiResponse)  # Misbah added
async def post_rsi(payload: RsiPayload) -> RsiResponse:  # Misbah added
  if payload.event_type == "detection":  # Misbah added
    _append_detection(payload.time, payload.mean_envelope)  # Misbah added
  elif payload.event_type == "rsi_interval":  # Misbah added
    if payload.elapsed_time is None or payload.elapsed_time <= 0:  # Misbah added
      raise HTTPException(status_code=400, detail="elapsed_time must be positive for rsi_interval events")  # Misbah added
    cumulative = payload.total_time or payload.elapsed_time  # Misbah added
    _append_session(payload.elapsed_time, cumulative, payload.mean_envelope)  # Misbah added
  else:  # Misbah added
    raise HTTPException(status_code=400, detail="Unsupported event_type")  # Misbah added

  return await get_rsi()  # Misbah added
