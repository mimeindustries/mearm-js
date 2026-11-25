MeArm JS
========

This is a library and standalone app to control a MeArm (http://mearm.com) from a Raspberry Pi or other devices.

## Requirements

 - A Raspberry Pi running a current Raspberry Pi OS (Bookworm or Trixie, 32 or 64-bit)
 - Node.js 22 or newer. The `nodejs` package in Raspberry Pi OS's own repositories is older than this, so install Node.js from [NodeSource](https://github.com/nodesource/distributions) or [nodejs.org](https://nodejs.org/en/download) instead.

> **Note:** servo control currently uses `pigpio`, which does not support the Raspberry Pi 5. On a Pi 5 the server falls back to a simulated arm.

## Manual Install
All commands need running from the command line, either from the terminal on screen directly or over SSH.

 - Update the system:

```bash
sudo apt-get update && sudo apt-get full-upgrade -y
```

 - Install Node.js 22 or newer (see Requirements above), then check the version:

```bash
node --version
```

 - Install the other packages we need (`gpiod` drives the status LED; the rest are for building the native npm modules)

```bash
sudo apt-get install -y git gpiod build-essential python3
```

 - Install pigpio, which is needed for servo control until it is replaced. It may not be packaged for every OS release; if it isn't, the server runs with a simulated arm.

```bash
sudo apt-get install -y pigpio
```

 - Clone the MeArm JS repository and move into it

```bash
git clone https://github.com/mimeindustries/mearm-js.git
cd mearm-js
```

 - Install the npm modules

```bash
npm ci --omit=dev
```

 - Enable I2C: run `sudo raspi-config`, select "Interface Options" then "I2C", and enable it

 - Run the server

```bash
sudo node ./server.js
```

 - Use it! You should now be able to use the joysticks on the Pi HAT to control the arm. You can also load the apps via your web browser if you browse to the IP address of your Raspberry Pi.

## Building the Debian package

Run `bin/build-deb` on a Raspberry Pi with Node.js 22+ and `debhelper` installed. It builds for the Pi's own architecture, so build on 64-bit Raspberry Pi OS for `arm64` and on 32-bit for `armhf`. `bin/push-deb` uploads the result to packagecloud (see the script for the environment variables it needs).

## Options

`server.js` (and the packaged `mearm-control`) accept:

 - a port number for the web UI, e.g. `sudo node ./server.js 8080` (default `80`)
 - `--no-ui` to skip serving the web UI
 - `--ws-port=NNNN` to change the WebSocket port (default `8899`)
 - `--dummy` to run with a simulated arm (also used automatically when the Pi hardware isn't available)

## Development

`npm test` runs the test suite against the simulated arm, so it works on any machine.

## Security note

The web UI and WebSocket control port are unauthenticated and listen on all network interfaces. Anyone on the same network can move the arm, so only run it on networks you trust.
