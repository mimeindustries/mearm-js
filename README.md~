MeArm JS
========

This is a library and standalone app to control a MeArm (http://mearm.com) from a RaspBerry Pi or other devices.

## Manual Install
The steps to manually install MeArm JS on to a fresh Raspberry Pi (running Stretch or later) running Raspbian are as follows. All commands need running from the command line, either from the terminal on screen directly or over SSH.

 - Update the system:

`sudo apt-get update`

 - Install packages we'll need to run the software

`sudo apt-get install -y git pigpio nodejs npm`

 - Symlink node to nodejs (required to make some packages work properly)

`sudo ln -sf /usr/bin/nodejs /usr/bin/node`

 - Clone the MeArm JS repository

`git clone https://github.com/mimeindustries/mearm-js.git`

 - Move into the repository

`cd mearm-js`

 - Install the npm modules

`npm install`

 - Enable I2C

`sudo raspi-config`

   Select "Interfacing Options" then select "I2C" and enable the interface

 - Run the server

`sudo nodejs ./server.js`

 - Use it! You should now be able to use the joysticks on the Pi HAT to control the arm. You can also load the apps via your web browser if you browse to the IP address of your Raspberry Pi.
