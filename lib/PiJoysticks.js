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

  var axisConfig = {
    leftX: {servo: 'base', percent: -2.5},
    leftY: {servo: 'lower', percent: -2.5},
    rightX: {servo: 'grip', percent: -2.5},
    rightY: {servo: 'upper', percent: -2.5}
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
    var resp = new Buffer(5);

    i2c1.readI2cBlock(0x48, 0x44, 5, resp, function(){
      processReading({leftX: resp[1], leftY: resp[2], rightX: resp[3], rightY: resp[4]});
    });
  }

  var init = function(){
    setInterval(readADC, 50);
  }

  init();
}

exports.PiJoysticks = PiJoysticks;
