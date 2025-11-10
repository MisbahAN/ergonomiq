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
