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


  var checkStatus = function(){
    var red= 0, green = 0, blue = 0;
    self.getIPs((ips) => {
      if(ips.eth0 && ips.eth0.ip) blue = 1;
      if(ips.wlan0 && ips.wlan0.ip) green = 1;
      red = (blue || green ? 0 : 1);
      exec('gpio -g write 7 ' + blue + ' && gpio -g write 8 ' + red + ' && gpio -g write 11 ' + green, (err) => {
        if(err) console.log(err);
      });
    });
  }

  self.start = function(interval){
    exec("gpio -g mode 7 out && gpio -g mode 8 out && gpio -g mode 11 out");
    checkStatus();
    setInterval(checkStatus, interval);
  }
}

module.exports = new StatusLed();
