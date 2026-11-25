'use strict';
const childProcess = require('child_process');
const os = require('os');

// Drives the RGB status LED on the MeArm Pi HAT:
//   blue = wired network up, green = WiFi up, red = no network.
//
// Uses the kernel GPIO character device through the `gpiod` command line tools
// (apt install gpiod), which work on every Raspberry Pi model including the Pi 5,
// with both libgpiod 1.x (Bookworm) and 2.x (Trixie). The old /sys/class/gpio
// interface is deprecated and its pin numbers are offset on current kernels.

// BCM GPIO offsets on the header's GPIO chip
const PINS = {blue: 7, red: 8, green: 11};

// Labels of the GPIO chip that drives the 40-pin header on each Pi generation
const HEADER_CHIP_LABELS = ['pinctrl-rp1', 'pinctrl-bcm2712', 'pinctrl-bcm2711', 'pinctrl-bcm2835'];

// Parse `gpiodetect` output, e.g. "gpiochip0 [pinctrl-bcm2711] (58 lines)"
function findHeaderChip(gpiodetectOutput){
  const chips = gpiodetectOutput.split('\n').map((line) => {
    const m = line.match(/^(gpiochip\d+)\s+\[([^\]]+)\]/);
    return m ? {name: m[1], label: m[2]} : null;
  }).filter(Boolean);
  for(const label of HEADER_CHIP_LABELS){
    const chip = chips.find((c) => c.label === label);
    if(chip) return chip.name;
  }
  return null;
}

// "gpioset (libgpiod) v1.6.3" -> 1, "gpioset (libgpiod) v2.1" -> 2
function parseMajorVersion(versionOutput){
  const m = versionOutput.match(/v(\d+)\./);
  return m ? Number(m[1]) : null;
}

// gpioset holds the lines until it exits, so it's run as a long-lived process
function gpiosetArgs(version, chip, leds){
  const values = Object.keys(PINS).map((colour) => PINS[colour] + '=' + (leds[colour] ? 1 : 0));
  return version >= 2
    ? ['-c', chip].concat(values)                 // v2 holds the lines by default
    : ['--mode=signal', chip].concat(values);     // v1 needs to be told to wait
}

function getIPs(networkInterfaces){
  const addr = {eth0: {}, wlan0: {}};
  const ifaces = networkInterfaces();
  for(const name of Object.keys(addr)){
    for(const a of (ifaces[name] || [])){
      if((a.family === 'IPv4' || a.family === 4) && !a.internal){
        addr[name] = {ip: a.address, mac: a.mac};
      }
    }
  }
  return addr;
}

function ledsForNetwork(ips){
  const leds = {red: 0, green: ips.wlan0.ip ? 1 : 0, blue: ips.eth0.ip ? 1 : 0};
  leds.red = (leds.blue || leds.green) ? 0 : 1;
  return leds;
}

class StatusLed {
  constructor(opts){
    opts = opts || {};
    this.execFileSync = opts.execFileSync || childProcess.execFileSync;
    this.spawn = opts.spawn || childProcess.spawn;
    this.networkInterfaces = opts.networkInterfaces || os.networkInterfaces;
    this.chip = opts.chip || process.env.MEARM_GPIO_CHIP;
    this.child = null;
    this.current = null;
    this.timers = [];
  }

  // Work out which gpiod version and chip to use. Throws if the tools aren't available.
  detect(){
    const run = (cmd, args) => this.execFileSync(cmd, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
    this.version = parseMajorVersion(run('gpioset', ['--version']));
    if(!this.version) throw new Error('could not determine gpioset version');
    if(!this.chip){
      this.chip = findHeaderChip(run('gpiodetect', []));
      if(!this.chip) throw new Error('no Raspberry Pi GPIO chip found (set MEARM_GPIO_CHIP to override)');
    }
  }

  setLEDs(leds){
    const key = JSON.stringify(leds);
    if(key === this.current && this.child) return;
    this.current = key;
    this.release();
    const child = this.spawn('gpioset', gpiosetArgs(this.version, this.chip, leds), {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    if(child.stderr) child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => console.error('Status LED: ' + err.message));
    child.on('exit', (code, signal) => {
      if(this.child === child) this.child = null;
      if(code && !signal) console.error('Status LED: gpioset exited with code ' + code + (stderr ? ': ' + stderr.trim() : ''));
    });
    this.child = child;
  }

  checkStatus(){
    this.setLEDs(ledsForNetwork(getIPs(this.networkInterfaces)));
  }

  getIPs(cb){
    const ips = getIPs(this.networkInterfaces);
    if(cb) cb(ips);
    return ips;
  }

  start(interval){
    if(this.timers.length) return;
    this.detect();
    console.log('Starting up LEDs on ' + this.chip + ' (libgpiod v' + this.version + ')');
    const sequence = [
      {red: 1, green: 0, blue: 0},
      {red: 1, green: 1, blue: 0},
      {red: 0, green: 1, blue: 0},
      {red: 0, green: 0, blue: 0}
    ];
    const step = (i) => {
      if(i < sequence.length){
        this.setLEDs(sequence[i]);
        this.timers.push(setTimeout(() => step(i + 1), 1000));
      }else{
        this.checkStatus();
        this.timers.push(setInterval(() => this.checkStatus(), interval || 5000));
      }
    };
    step(0);
    // Turn the LEDs off (and free the GPIO lines) when the process exits
    process.once('exit', () => this.release());
  }

  release(){
    if(this.child){
      this.child.kill('SIGTERM');
      this.child = null;
    }
  }

  stop(){
    this.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    this.timers = [];
    this.current = null;
    this.release();
  }
}

module.exports = new StatusLed();
module.exports.StatusLed = StatusLed;
module.exports.findHeaderChip = findHeaderChip;
module.exports.parseMajorVersion = parseMajorVersion;
module.exports.gpiosetArgs = gpiosetArgs;
module.exports.ledsForNetwork = ledsForNetwork;
