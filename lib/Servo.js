var Gpio = require('pigpio').Gpio;
const EventEmitter = require('events').EventEmitter;
const util = require('util');

var Servo = function(conf){
  EventEmitter.call(this);
  var self = this;

  this.currentAngle = 0;
  this.sleeping = false;
  var lastPulseWidth = 0;

  var pin = new Gpio(conf.pin, {mode: Gpio.OUTPUT});

  var clamp = function(angle){
    return Math.min(conf.maxAngle, Math.max(conf.minAngle, angle));
  };

  var calculatePulseWidth = function(angle){
    return Math.round(conf.max - (((angle - conf.minAngle) / (conf.maxAngle - conf.minAngle)) * (conf.max - conf.min)));
  };

  this.moveToAngle = function(angle, cb){
    this.setCurrentAngle(angle, cb);
  };

  this.sleep = function(){
    pin.servoWrite(0); // 0 stops the servo pulses
    this.sleeping = true;
  };

  this.wake = function(){
    if(this.sleeping){
      this.sleeping = false;
      this.updateServo();
    }
  };

  this.updateServo = function(cb){
    var newPulseWidth = calculatePulseWidth(this.currentAngle);
    // Roughly half a second to sweep the full pulse width range
    var diff = Math.abs(lastPulseWidth - newPulseWidth);
    lastPulseWidth = newPulseWidth;
    var duration = Math.min(500, (diff / 1900) * 500);
    this.sleeping = false;
    pin.servoWrite(newPulseWidth);
    if(cb) setTimeout(cb, duration);
  };

  this.setCurrentAngle = function(angle, cb){
    angle = Number(angle);
    if(!isFinite(angle)){
      if(cb) setImmediate(cb);
      return;
    }
    this.currentAngle = clamp(angle);
    this.updateServo(cb);
    this.emit('change');
  };

  this.moveByDegrees = function(angle, cb){
    this.setCurrentAngle(this.currentAngle + angle, cb);
  };

  this.moveByPercent = function(percent, cb){
    this.setCurrentAngle(this.currentAngle + (((conf.maxAngle - conf.minAngle) / 100) * percent), cb);
  };

  this.moveToCentre = function(){
    this.moveToAngle(Math.floor(conf.minAngle + (conf.maxAngle - conf.minAngle) / 2));
  };
};

util.inherits(Servo, EventEmitter);

exports.Servo = Servo;
