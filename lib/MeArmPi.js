var Gpio = require('pigpio').Gpio;

var MeArmPi = function(){
  var self = this;

  this.base = new Gpio(4, {mode: Gpio.OUTPUT});
  this.lower = new Gpio(17, {mode: Gpio.OUTPUT});
  this.upper = new Gpio(18, {mode: Gpio.OUTPUT});
  this.grip = new Gpio(22, {mode: Gpio.OUTPUT});
  
  this.version = function(msg, resp){
    resp.complete("2.0.9");
  }
  
  this.stop = function(msg, resp){
    resp.complete();
  }
  
  this.pause = function(msg, resp){
    resp.complete();
  }
  
  this.resume = function(msg, resp){
    resp.complete();
  }
  
  this.openGrip = function(msg, resp){
    this.grip.servoWrite(800);
    resp.complete();
  }
  
  this.closeGrip = function(msg, resp){
    this.grip.servoWrite(2100);
    resp.complete();
  }
  
  this.moveBaseTo = function(msg, resp){
    resp.complete();
  }
  
  this.moveLowerTo = function(msg, resp){
    resp.complete();
  }
  
  this.moveUpperTo = function(msg, resp){
    resp.complete();
  }
  
  this.moveGripTo = function(msg, resp){
    resp.complete();
  }
  
  
}

exports.MeArmPi = MeArmPi;