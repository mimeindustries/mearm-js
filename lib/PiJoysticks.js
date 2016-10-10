var i2c = require('i2c-bus'),
   i2c1 = i2c.openSync(1);

var PiJoysticks = function(arm){
  var self = this;
  var maxADC = 255;
  var minADC = 0;
  var centreLevel = 127.5;
  var centreThreshold = 20;
  var ADCThreshold = maxADC - centreLevel - centreThreshold;

  var axisConfig = {
    leftX: {servo: 'base', percent: -1},
    leftY: {servo: 'lower', percent: -0.5},
    rightX: {servo: 'grip', percent: -1},
    rightY: {servo: 'upper', percent: -0.5}
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
    var len = 5
    var resp = new Buffer(len);
    var offset = 1;

    i2c1.readI2cBlock(72, 0x04, len, resp, function(){
      processReading({leftX: resp[offset], leftY: resp[offset+1], rightX: resp[offset+2], rightY: resp[offset+3]});
    });
  }

  var init = function(){
    setInterval(readADC, 20);
  }

  init();
}

exports.PiJoysticks = PiJoysticks;
