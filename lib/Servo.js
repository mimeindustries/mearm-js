var Gpio = require('pigpio').Gpio;
const EventEmitter = require('events').EventEmitter;
const util = require('util');

var Servo = function(conf){

  this.currentAngle = 0;
  var releaseTimeout = undefined;
  var lastPulseWidth = 0;
  this.sleeping = false;

  var pin = new Gpio(conf.pin, {mode: Gpio.OUTPUT});

  this.moveToAngle = function(angle, cb){
    this.setCurrentAngle(angle, cb);
  }

  this.sleep = function(){
    pin.digitalWrite(0);
    this.sleeping = true;
  }

  this.wake = function(){
    if(this.sleeping){
      this.updateServo();
      this.sleeping = false;
    }
  }

  this.updateServo = function(cb){
    // half a second to move 180 degrees, with 0 as 500ms and 180 as 2400ms
    var newPulseWidth = calculatePulseWidth(this.currentAngle);
    var diff = Math.abs(lastPulseWidth - newPulseWidth);
    lastPulseWidth = newPulseWidth;
    var duration = (diff/1900) * 500
    pin.servoWrite(newPulseWidth);
    if(cb) setTimeout(cb, duration);
  }

  this.setCurrentAngle = function(angle, cb){
    angle = Number(angle);
    if(angle < conf.minAngle){
      this.currentAngle = conf.minAngle;
    }else if(angle > conf.maxAngle){
      this.currentAngle = conf.maxAngle;
    }else{
      this.currentAngle = angle;
    }
    this.updateServo(cb);
    this.emit('change');
  }

  this.moveByDegrees = function(angle, cb){
    this.setCurrentAngle(this.currentAngle + angle, cb);
  }

  this.moveByPercent = function(percent, cb){
    this.setCurrentAngle(this.currentAngle + (((conf.maxAngle - conf.minAngle) / 100 ) * percent), cb);
  }

  var calculatePulseWidth = function(angle){
    return Math.floor(conf.max - (((angle - conf.minAngle) / (conf.maxAngle - conf.minAngle)) * (conf.max - conf.min)));
  }


  this.moveToCentre = function(){
    var centre = Math.floor(conf.minAngle + (conf.maxAngle - conf.minAngle)/2);
    this.moveToAngle(centre);
  }

}

util.inherits(Servo, EventEmitter);

exports.Servo = Servo
