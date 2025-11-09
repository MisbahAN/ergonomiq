# Posture & Eye Strain Monitor

This folder holds the standalone webcam utility (`Posture.py`) that analyzes your posture and blinking rate using OpenCV + MediaPipe. The script can emit on-screen feedback and (optionally) play `alert.mp3` when bad posture is detected.

## Requirements

- Python 3.10 – 3.12 (3.12 tested)
- A webcam accessible by the OS
- The Python packages listed in `requirements.txt`
- (Optional) `playsound` if you want the audible alert

## macOS Setup

```bash
cd /path/to/777777/model
python3.12 -m venv .venv          # or any 3.10+ interpreter
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
# Optional sound alert support:
# pip install playsound==1.3.0
python Posture.py
```

Notes:
- When macOS prompts for Camera access, grant it so the script can read your webcam.
- If you hit Matplotlib cache permission warnings, set `export MPLCONFIGDIR="$PWD/.mplcache"` before running.

## Windows Setup

```powershell
cd path\to\777777\model
py -3.11 -m venv .venv            # any Python 3.10+ works
.\.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
# Optional sound alert support (may require VC build tools):
# pip install playsound==1.3.0
python Posture.py
```

Notes:
- Allow the application to use the Camera when Windows Security prompts.
- If OpenCV fails to open the webcam, ensure no other app is using it and that the correct camera is selected in system settings.

## Usage Tips

- Sit upright for the first ~3 seconds so the calibration bar reaches 30/30.
- Tap `q` while the OpenCV window is focused to exit gracefully.
- `alert.mp3` must remain alongside `Posture.py` if you enable sound alerts.
