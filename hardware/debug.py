import requests
import time

API_ENDPOINT = "http://localhost:8000/rsi"

while True:
    try:
        payload = {
            "event_type": "detection",
            "time": 1234,
            "mean_envelope": 1234
        }
        requests.post(API_ENDPOINT, json=payload)
        print("Sent 1!")
    except requests.exceptions.RequestException as e:
        print(f"Failed to send detection event: {e}")

    time.sleep(2)

    try:
        payload = {
            "event_type": "rsi_interval",
            "elapsed_time": 67,
            "total_time": 67
        }
        requests.post(API_ENDPOINT, json=payload)
        print("Sent 2!")
    except requests.exceptions.RequestException as e:
        print(f"Failed to send RSI Interval event: {e}")
