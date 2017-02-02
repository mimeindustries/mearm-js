var Servo = require('./Servo.js').Servo;
const EventEmitter = require('events').EventEmitter;
const util = require('util');

var MeArmPi = function(){
  var self = this;
  var servos = {};

  this.moveToCentres = function(){
    for(var servo in servos){
      servos[servo].moveToCentre();
    }
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

  this.openGrip = function(msg, cb){
    console.log("Open grip");
    servos.grip.moveToAngle(90, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.closeGrip = function(msg, cb){
    servos.grip.moveToAngle(0, function(){
     if(cb)  cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveBaseTo = function(msg, cb){
    angle = (typeof msg === 'object') ? msg.arg : msg;
    servos.base.moveToAngle(angle, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveLowerTo = function(msg, cb){
    angle = (typeof msg === 'object') ? msg.arg : msg;
    servos.lower.moveToAngle(angle, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveUpperTo = function(msg, cb){
    angle = (typeof msg === 'object') ? msg.arg : msg;
    servos.upper.moveToAngle(angle, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveGripTo = function(msg, cb){
    angle = (typeof msg === 'object') ? msg.arg : msg;
    servos.grip.moveToAngle(angle, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveByPercent = function(servo, percent){
    servos[servo].moveByPercent(percent);
  }

  this.servoState = function(){
    return {base: servos.base.currentAngle, lower: servos.lower.currentAngle, upper: servos.upper.currentAngle, grip: servos.grip.currentAngle};
  }

  this.servoChange = function(){
    self.emit('msg', self.servoState());
  }

  this.getServoState = function(msg, cb){
    cb('complete', this.servoState());
  }

  this.init = function(){
    servos.base = new Servo({pin: 4, min: 530, max: 2400, minAngle: -90, maxAngle: 90});
    servos.lower = new Servo({pin: 17, min: 530, max: 1450, minAngle: 0, maxAngle: 90});
    servos.upper = new Servo({pin: 22, min: 530, max: 2000, minAngle: 0, maxAngle: 135});
    servos.grip = new Servo({pin: 10, min: 1400, max: 2400, minAngle: 0, maxAngle: 90});
    for(servo in servos){
      servos[servo].on('change', function(){ self.servoChange() });
    }
    this.moveToCentres();

  }

  this.init();
}

util.inherits(MeArmPi, EventEmitter);

exports.MeArmPi = MeArmPi;
