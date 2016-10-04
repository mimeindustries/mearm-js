var Gpio = require('pigpio').Gpio;

var MeArmPi = function(){
  var self = this;

  this.base = new Gpio(4, {mode: Gpio.OUTPUT});
  this.lower = new Gpio(17, {mode: Gpio.OUTPUT});
  this.upper = new Gpio(22, {mode: Gpio.OUTPUT});
  this.grip = new Gpio(10, {mode: Gpio.OUTPUT});

  var servoConfig = {
    base:  {min: 600, max: 2500, minAngle: -85, maxAngle: 85},
    lower: {min: 1000, max: 2300, minAngle: 0, maxAngle: 135},
    upper: {min: 1600, max: 2500, minAngle: 0, maxAngle: 90},
    grip:  {min: 600, max: 2100, minAngle: 0, maxAngle: 90}
  }

  this.move = function(servo, ms){
    this[servo].servoWrite(ms);
  }

}

mearm = new MeArmPi()
var level = 580;
var diff = -20;

setInterval(function(){
  console.log(level);
  mearm.move('lower', level);
  if(level >= 2400){
    diff = -diff;
  }
  if(level <= 580){
    diff = -diff;
  }
  level += diff;
  //mearm.move('grip', 580);
  //mearm.move('grip', 2400);
}, 100);
