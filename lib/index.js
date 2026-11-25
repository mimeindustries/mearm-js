exports.Arm = require('./Arm.js').Arm;
exports.DummyArm = require('./DummyArm.js').DummyArm;
exports.MiroComms = require('./MiroComms.js').MiroComms;
exports.HttpServer = require('./HttpServer.js').HttpServer;
exports.server = require('./server.js');

// Only available on a Raspberry Pi with pigpio installed
Object.defineProperty(exports, 'MeArmPi', {
  enumerable: true,
  get: function(){ return require('./MeArmPi.js').MeArmPi; }
});
