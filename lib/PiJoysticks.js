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

  var readADC = function(){
    var resp = new Buffer(24);
    i2c1.readI2cBlock(72, 4, 6, resp, function(){
      processReading({leftX: resp[2], leftY: resp[3], rightX: resp[4], rightY: resp[5]});
    });
  }

  var init = function(){
    setInterval(readADC, 20);
  }

  init();
}

exports.PiJoysticks = PiJoysticks;
