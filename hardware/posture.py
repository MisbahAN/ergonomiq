from flask import Flask, request
import pyfirmata
import time
import sys

app = Flask(__name__)

BAUD_RATE = 9600  # Standard baud rate for Arduino
PIN_13 = 13



@app.route('/vibrate', methods=['GET', 'POST', 'OPTIONS'])
def vibrate():
    body = request.get_data(as_text=True)
    json_body = request.get_json(silent=True)
    print("Setting pin 13 HIGH", file=sys.stdout)
    pin13.write(1)  # Set HIGH
    time.sleep(2)  # Optional: keep it on for half second
    pin13.write(0)  # Se t LOW
    return "Pin 13 activated", 200

if __name__ == '__main__':
    try:
        print("six sevennnn", file=sys.stdout)
        # On Mac, port is typically /dev/cu.usbmodem* 
        board = pyfirmata.ArduinoMega('/dev/cu.usbmodem1201', baudrate=BAUD_RATE)
        print("break1!", file=sys.stdout)   

        it = pyfirmata.util.Iterator(board)
        it.start()
        print("connected!", file=sys.stdout)   
        # Configure pin 13 as output
        pin13 = board.get_pin('d:13:o')  # digital:pin13:output
        app.run(host='127.0.0.1', port=8000, debug=True)
    except Exception as e:
        print(f"Error: {e}", file=sys.stdout)
        exit()
    finally:
        board.exit()
