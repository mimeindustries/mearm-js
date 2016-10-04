var Servo = require('./Servo.js').Servo;

var MeArmPi = function(){
  var self = this;

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

  this.moveByPercent = function(servo, percent){
    servos[servo].moveByPercent(percent);
  }

  var servos = {};
  this.init = function(){
    servos.base = new Servo({pin: 4, min: 530, max: 2400, minAngle: -90, maxAngle: 90});
    servos.lower = new Servo({pin: 17, min: 1000, max: 2300, minAngle: 0, maxAngle: 135});
    servos.upper = new Servo({pin: 22, min: 1600, max: 2500, minAngle: 0, maxAngle: 90});
    servos.grip = new Servo({pin: 10, min: 600, max: 2100, minAngle: -90, maxAngle: 90});
    this.moveToCentres();

  }

  this.init();
}

exports.MeArmPi = MeArmPi;
