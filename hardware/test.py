import pyfirmata
import time

board = pyfirmata.ArduinoMega('COM17', baudrate=9600)

pwm_pin = board.get_pin('d:13:o')  # 'd' for digital, '9' for pin number, 'p' for PWM

while True:
    pwm_pin.write(0.0)  # Full duty cycle (100% HIGH)
    time.sleep(1)
    pwm_pin.write(0.0)
    time.sleep(1)

#pwm_pin.write(0.5)  # 50% duty cycle
#time.sleep(2)

#pwm_pin.write(0.0)  # OFF