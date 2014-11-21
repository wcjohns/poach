import time

#See http://www.reuk.co.uk/DS18B20-Temperature-Sensor-with-Raspberry-Pi.htm
#You will have to change the device serial number to your device.


while 1:
        tempfile = open("/sys/bus/w1/devices/28-00044a3bbbff/w1_slave")
        thetext = tempfile.read()
        tempfile.close()
        tempdata = thetext.split("\n")[1].split(" ")[9]
        temperature = float(tempdata[2:])
        temperature = temperature / 1000
        print temperature

        time.sleep(1)

