from flask import Flask, request
import pyfirmata
import time

app = Flask(__name__)

BAUD_RATE = 57600  # Standard baud rate for Arduino
PIN_13 = 13

# Initialize serial connection
try:
    # On Mac, port is typically /dev/cu.usbmodem* 
    board = pyfirmata.ArduinoMega('/dev/cu.usbmodem1101', baudrate=BAUD_RATE)
    it = pyfirmata.util.Iterator(board)
    it.start()
    
    # Configure pin 13 as output
    pin13 = board.get_pin('d:13:o')  # digital:pin13:output
except Exception as e:
    print(f"Error: {e}")
    exit()

@app.route('/vibrate', methods=['GET'])
def vibrate():
    body = request.get_data(as_text=True)
    json_body = request.get_json(silent=True)
    if request.args or body or json_body:
        print("Setting pin 13 HIGH")
        pin13.write(1)  # Set HIGH
        time.sleep(0.5)  # Optional: keep it on for half second
        pin13.write(0)  # Set LOW
        return "Pin 13 activated", 200
    return "no data sent", 204

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=8000, debug=True)
    finally:
        board.exit()