const util = require('util');
const Arm = require('./Arm.js').Arm;
const DummyServo = require('./DummyServo.js').DummyServo;

var DummyArm = function(opts){
  Arm.call(this, DummyServo, opts);
};

util.inherits(DummyArm, Arm);

exports.DummyArm = DummyArm;
