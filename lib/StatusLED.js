var exec = require('child_process').exec;
var ifconfig = require('wireless-tools/ifconfig');

var StatusLed = function(){
  var self = this;

  this.getIPs= function(cb){
    ifconfig.status((err, res) => {
      var addr = {'eth0':{}, 'wlan0': {}};
      for(var i=0; i< res.length; i++){
        if(res[i].interface === 'eth0' || res[i].interface === 'wlan0'){
          addr[res[i].interface] = {ip: res[i].ipv4_address, mac: res[i].address}
        }
      }
      cb(addr);
    });
  }

  var setLEDs = function(leds){
    exec('echo ' + leds.blue + ' > /sys/class/gpio/gpio7/value && echo ' + leds.red + ' > /sys/class/gpio/gpio8/value && echo ' + leds.green + ' > /sys/class/gpio/gpio11/value', (err) => {
      if(err) console.log(err);
    });
  }

  var startup = function(step){
    switch(step){
      case 0:
        setLEDs({red:1, green:0, blue:0});
        setTimeout(() => { startup(step+1) }, 1000);
        break;
      case 1:
        setLEDs({red:1, green:1, blue:0});
        setTimeout(() => { startup(step+1) }, 1000);
        break;
      case 2:
        setLEDs({red:0, green:1, blue:0});
        setTimeout(() => { startup(step+1) }, 1000);
        break;
      case 3:
        setLEDs({red:0, green:0, blue:0});
        setTimeout(() => { startup(step+1) }, 1000);
        break;
      case 4:
        setLEDs({red:0, green:0, blue:0});
        checkStatus();
        setInterval(checkStatus, self.interval);
        break;
    }
  }

  var checkStatus = function(){
    var leds = {red: 0, green: 0, blue: 0}
    self.getIPs((ips) => {
      if(ips.eth0 && ips.eth0.ip) leds.blue = 1;
      if(ips.wlan0 && ips.wlan0.ip) leds.green = 1;
      leds.red = (leds.blue || leds.green ? 0 : 1);
      setLEDs(leds);
    });
  }

  self.start = function(interval){
    self.interval = interval;
    console.log("Starting up LEDs");
    exec('echo "7" > /sys/class/gpio/export && echo "8" > /sys/class/gpio/export && echo "11" > /sys/class/gpio/export && echo "out" > /sys/class/gpio/gpio7/direction && echo "out" > /sys/class/gpio/gpio8/direction && echo "out" > /sys/class/gpio/gpio11/direction');
    startup(0);
  }
}

module.exports = new StatusLed();
