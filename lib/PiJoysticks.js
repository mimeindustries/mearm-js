var i2c = require('i2c-bus');

// Reads the two analogue joysticks on the MeArm Pi HAT via the PCF8591 ADC
// at I2C address 0x48 and nudges the servos accordingly.
var PiJoysticks = function(arm, opts){
  opts = opts || {};
  var bus = i2c.openSync(opts.bus || 1);
  var maxADC = 255;
  var centreLevel = 127.5;
  var centreThreshold = 20;
  var ADCThreshold = maxADC - centreLevel - centreThreshold;
  var reading = false;
  var lastError;

  var axisConfig = {
    leftX: {servo: 'base', percent: -2.5},
    leftY: {servo: 'lower', percent: -2.5},
    rightX: {servo: 'grip', percent: -2.5},
    rightY: {servo: 'upper', percent: -2.5}
  };

  var processAxis = function(axis, value){
    var centred = value - centreLevel;
    if(Math.abs(centred) >= centreThreshold){
      var dir = (centred > 0) ? 1 : -1;
      var rate = dir * ((Math.abs(centred) - centreThreshold) / ADCThreshold);
      arm.moveByPercent(axisConfig[axis].servo, axisConfig[axis].percent * rate);
    }
  };

  var readADC = function(){
    if(reading) return; // don't pile up requests if the bus is slow
    reading = true;
    var resp = Buffer.alloc(5);
    // 0x44 = auto-increment through all four channels. The first byte is the previous conversion.
    bus.readI2cBlock(0x48, 0x44, 5, resp, function(err, bytesRead){
      reading = false;
      if(err || bytesRead !== 5){
        var text = err ? err.message : 'short read';
        if(text !== lastError) console.error('Joystick read failed: ' + text);
        lastError = text;
        return;
      }
      lastError = undefined;
      processAxis('leftX', resp[1]);
      processAxis('leftY', resp[2]);
      processAxis('rightX', resp[3]);
      processAxis('rightY', resp[4]);
    });
  };

  var timer = setInterval(readADC, 50);

  this.stop = function(){
    clearInterval(timer);
    bus.closeSync();
  };
};

exports.PiJoysticks = PiJoysticks;
