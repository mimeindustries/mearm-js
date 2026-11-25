var fs = require('fs');
var os = require('os');

// Drives the RGB status LED on the MeArm Pi HAT:
//   blue = wired network up, green = WiFi up, red = no network.
var PINS = {blue: 7, red: 8, green: 11};
var GPIO_PATH = '/sys/class/gpio';

var StatusLed = function(){
  var self = this;
  var statusTimer;

  var write = function(file, value){
    try{
      fs.writeFileSync(file, String(value));
      return true;
    }catch(e){
      return false;
    }
  };

  var exportPins = function(){
    Object.keys(PINS).forEach(function(colour){
      var pin = PINS[colour];
      // Exporting fails with EBUSY if already exported (e.g. after a restart); that's fine
      if(!fs.existsSync(GPIO_PATH + '/gpio' + pin)) write(GPIO_PATH + '/export', pin);
      write(GPIO_PATH + '/gpio' + pin + '/direction', 'out');
    });
  };

  var setLEDs = function(leds){
    Object.keys(PINS).forEach(function(colour){
      write(GPIO_PATH + '/gpio' + PINS[colour] + '/value', leds[colour] ? 1 : 0);
    });
  };

  // Returns {eth0: {ip, mac}, wlan0: {ip, mac}} for interfaces that have an IPv4 address
  this.getIPs = function(cb){
    var addr = {eth0: {}, wlan0: {}};
    var ifaces = os.networkInterfaces();
    ['eth0', 'wlan0'].forEach(function(name){
      (ifaces[name] || []).forEach(function(a){
        if((a.family === 'IPv4' || a.family === 4) && !a.internal){
          addr[name] = {ip: a.address, mac: a.mac};
        }
      });
    });
    cb(addr);
  };

  var checkStatus = function(){
    self.getIPs(function(ips){
      var leds = {red: 0, green: 0, blue: 0};
      if(ips.eth0.ip) leds.blue = 1;
      if(ips.wlan0.ip) leds.green = 1;
      leds.red = (leds.blue || leds.green) ? 0 : 1;
      setLEDs(leds);
    });
  };

  var startupSequence = [
    {red: 1, green: 0, blue: 0},
    {red: 1, green: 1, blue: 0},
    {red: 0, green: 1, blue: 0},
    {red: 0, green: 0, blue: 0}
  ];

  var startup = function(step){
    if(step < startupSequence.length){
      setLEDs(startupSequence[step]);
      setTimeout(function(){ startup(step + 1); }, 1000);
    }else{
      checkStatus();
      statusTimer = setInterval(checkStatus, self.interval);
    }
  };

  this.start = function(interval){
    if(statusTimer) return;
    self.interval = interval || 5000;
    console.log('Starting up LEDs');
    exportPins();
    startup(0);
  };
};

module.exports = new StatusLed();
