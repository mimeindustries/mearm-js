var i2c = require('i2c-bus'),
   i2c1 = i2c.openSync(1);

var fs = require('fs');

var PiJoysticks = function(arm){
  var self = this;
  var maxADC = 255;
  var minADC = 0;
  var centreLevel = 127.5;
  var centreThreshold = 20;
  var ADCThreshold = maxADC - centreLevel - centreThreshold;
  var piZeroVersions = ['900092', '900093', '0x9000C1'];
  var offset = 1;

  var axisConfig = {
    leftX: {servo: 'base', percent: -1},
    leftY: {servo: 'lower', percent: -1},
    rightX: {servo: 'grip', percent: -1},
    rightY: {servo: 'upper', percent: -1}
  }

  var processReading = function(reading){
    for(var axis in reading){
      processAxis(axis, reading[axis]);
    }
  }

  var processAxis = function(axis, value){
    var centred = value - centreLevel;
    if(Math.abs(centred) >= centreThreshold){
      var dir = (centred > 0) ? 1 : -1;
      centred = Math.abs(centred) - centreThreshold;
      var rate = dir * (centred / ADCThreshold);
      // Move arm by amount
      arm.moveByPercent(axisConfig[axis].servo, axisConfig[axis].percent * rate);
    }
  }


  var readSingleADC = function(channel, cb){
    i2c1.sendByte(72, channel, function(){
      i2c1.receiveByte(72, function(err, dummy){
        i2c1.receiveByte(72, function(err, res){
          cb(res);
        });
      });
    });
  }

  var readADC = function(){
    var resp = new Buffer(offset+4);

    i2c1.readI2cBlock(72, 0x04, offset+4, resp, function(){
      processReading({leftX: resp[offset], leftY: resp[offset+1], rightX: resp[offset+2], rightY: resp[offset+3]});
    });
  }

  var detectPiVersion = function(cb){
    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream('/proc/cpuinfo')
    });
    lineReader.on('line', function (line) {
      var regex = /^Revision\s+:\s+(.*)$/;
      var res = line.match(regex);
      if(res){
        if(piZeroVersions.indexOf(res[1]) > 0){
          console.log("Running on Pi Zero Variant");
          offset = 2;
        }else{
          console.log("Running on model B Pi Variant");
        }
      }
    });
    lineReader.on('close', cb);
  }

  var init = function(){
    detectPiVersion(() => {
      setInterval(readADC, 20);
    });
  }

  init();
}

exports.PiJoysticks = PiJoysticks;
