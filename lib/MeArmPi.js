const util = require('util');
const Arm = require('./Arm.js').Arm;
// Throws if pigpio isn't available (e.g. not on a Raspberry Pi)
const Servo = require('./Servo.js').Servo;

var MeArmPi = function(){
  Arm.call(this, Servo, {sleepTimeout: 30000});
};

util.inherits(MeArmPi, Arm);

exports.MeArmPi = MeArmPi;
