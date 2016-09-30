var Gpio = require('pigpio').Gpio;

var MeArmPi = function(){
  var self = this;

  this.base = new Gpio(4, {mode: Gpio.OUTPUT});
  this.lower = new Gpio(17, {mode: Gpio.OUTPUT});
  this.upper = new Gpio(18, {mode: Gpio.OUTPUT});
  this.grip = new Gpio(22, {mode: Gpio.OUTPUT});

  var servoConfig = {
    base:  {min: 600, max: 2500, minAngle: -85, maxAngle: 85},
    lower: {min: 1000, max: 2300, minAngle: 0, maxAngle: 135},
    upper: {min: 1600, max: 2500, minAngle: 0, maxAngle: 90},
    grip:  {min: 800, max: 2100, minAngle: 0, maxAngle: 180}
  }

  this.moveToCentres = function(){
    for(var servo in servoConfig){
      if(servoConfig.hasOwnProperty(servo)){
        var centre = Math.floor(servoConfig[servo].minAngle + (servoConfig[servo].maxAngle - servoConfig[servo].minAngle)/2);
        this.moveServo(servo, centre);
      }
    }
  }

  var calculatePulseWidth = function(angle, type){
    return Math.floor(servoConfig[type].max - (((angle - servoConfig[type].minAngle) / (servoConfig[type].maxAngle - servoConfig[type].minAngle)) * (servoConfig[type].max - servoConfig[type].min)));
  }

  this.version = function(msg, cb){
    cb('complete', '0.0.1');
  }

  this.stop = function(msg, cb){
    cb('complete');
  }

  this.pause = function(msg, cb){
    cb('complete');
  }

  this.resume = function(msg, cb){
    cb('complete');
  }

  this.moveServo = function(servo, angle, cb){
    console.log("Moving " + servo + " to " + angle);
    // half a second to move 180 degrees, with 0 as 500ms and 180 as 2400ms
    var newMs = calculatePulseWidth(angle, servo);
    var diff = 0;
    try{
      diff = Math.abs(this[servo].getServoPulseWidth() - newMs);
    }catch(e){
    }
    var duration = (diff/1900) * 500
    this[servo].servoWrite(newMs);
    if(cb) setTimeout(cb, duration);
  }

  this.openGrip = function(msg, cb){
    this.moveServo('grip', 90, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.closeGrip = function(msg, cb){
    this.moveServo('grip', 0, function(){
     if(cb)  cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveBaseTo = function(msg, cb){
    this.moveServo('base', msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveLowerTo = function(msg, cb){
    this.moveServo('lower', msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveUpperTo = function(msg, cb){
    this.moveServo('upper', msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveGripTo = function(msg, cb){
    this.moveServo('grip', msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.init = function(){
    this.moveToCentres();
  }

  this.init();
}

exports.MeArmPi = MeArmPi;
