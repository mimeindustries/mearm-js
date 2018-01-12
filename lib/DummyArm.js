var Servo = require('./DummyServo.js').DummyServo;
const EventEmitter = require('events').EventEmitter;
const util = require('util');

var DummyArm = function(){
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
    servos.base.moveToAngle(msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveLowerTo = function(msg, cb){
    servos.lower.moveToAngle(msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveUpperTo = function(msg, cb){
    servos.upper.moveToAngle(msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
  }

  this.moveGripTo = function(msg, cb){
    servos.grip.moveToAngle(msg.arg, function(){
      if(cb) cb('complete');
    });
    if(cb) cb('accepted');
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

  this.moveByPercent = function(servo, percent){
    servos[servo].moveByPercent(percent);
  }

  this.init = function(){
    servos.base = new Servo({name: 'Base', pin: 4, min: 530, max: 2400, minAngle: -90, maxAngle: 90});
    servos.lower = new Servo({name: 'Lower', pin: 17, min: 135, max: 2400, minAngle: 135, maxAngle: 0});
    servos.upper = new Servo({name: 'Upper', pin: 22, min: 530, max: 2000, minAngle: 0, maxAngle: 135});
    servos.grip = new Servo({name: 'Grip', pin: 10, min: 1400, max: 2400, minAngle: 0, maxAngle: 90});
    for(servo in servos){
      servos[servo].on('change', function(){ self.servoChange() });
    }
    this.moveToCentres();
  }

  this.init();
}

util.inherits(DummyArm, EventEmitter);

exports.DummyArm = DummyArm;
