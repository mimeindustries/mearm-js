const EventEmitter = require('events').EventEmitter;
const util = require('util');

// Servo calibration for the MeArm. Pins are BCM GPIO numbers on the MeArm Pi HAT.
const SERVO_CONFIG = {
  base:  {name: 'Base',  pin: 4,  min: 530,  max: 2400, minAngle: -90, maxAngle: 90},
  lower: {name: 'Lower', pin: 17, min: 1300, max: 2400, minAngle: 0,   maxAngle: 135},
  upper: {name: 'Upper', pin: 22, min: 530,  max: 2000, minAngle: 0,   maxAngle: 135},
  grip:  {name: 'Grip',  pin: 10, min: 1400, max: 2400, minAngle: 0,   maxAngle: 90}
};

// Turns the servo signals off after a period of inactivity so they don't buzz
// and overheat, and turns them back on as soon as anything moves.
var ServoSleep = function(timeout, servos){
  var timer;

  this.reset = function(){
    if(timer) clearTimeout(timer);
    servos.forEach(function(s){ s.wake(); });
    timer = setTimeout(function(){
      servos.forEach(function(s){ s.sleep(); });
    }, timeout);
    // Don't keep the process alive just for this timer
    if(timer.unref) timer.unref();
  };
};

// Pull a finite numeric angle out of either a WebSocket message ({arg: ...})
// or a bare number. Returns NaN for anything unusable.
var parseAngle = function(msg){
  var value = (msg !== null && typeof msg === 'object') ? msg.arg : msg;
  if(typeof value === 'string' && value.trim() === '') return NaN;
  if(typeof value !== 'number' && typeof value !== 'string') return NaN;
  return Number(value);
};

// Generic MeArm. `ServoClass` is either the real pigpio-backed Servo or the DummyServo.
var Arm = function(ServoClass, opts){
  EventEmitter.call(this);
  opts = opts || {};
  var self = this;
  var servos = {};
  var sleeper;

  var moveServoTo = function(name, msg, cb){
    var angle = parseAngle(msg);
    if(!isFinite(angle)){
      if(cb) cb('error', 'Invalid angle');
      return;
    }
    if(cb) cb('accepted');
    servos[name].moveToAngle(angle, function(){
      if(cb) cb('complete');
    });
  };

  this.moveToCentres = function(){
    for(var name in servos){
      servos[name].moveToCentre();
    }
  };

  this.version = function(msg, cb){
    cb('complete', '0.0.1');
  };

  this.ping = function(msg, cb){
    cb('complete');
  };

  this.stop = function(msg, cb){
    cb('complete');
  };

  this.pause = function(msg, cb){
    cb('complete');
  };

  this.resume = function(msg, cb){
    cb('complete');
  };

  this.openGrip = function(msg, cb){
    if(typeof msg === 'function'){ cb = msg; }
    moveServoTo('grip', SERVO_CONFIG.grip.maxAngle, cb);
  };

  this.closeGrip = function(msg, cb){
    if(typeof msg === 'function'){ cb = msg; }
    moveServoTo('grip', SERVO_CONFIG.grip.minAngle, cb);
  };

  this.moveBaseTo  = function(msg, cb){ moveServoTo('base',  msg, cb); };
  this.moveLowerTo = function(msg, cb){ moveServoTo('lower', msg, cb); };
  this.moveUpperTo = function(msg, cb){ moveServoTo('upper', msg, cb); };
  this.moveGripTo  = function(msg, cb){ moveServoTo('grip',  msg, cb); };

  // Used by the joysticks for continuous relative movement
  this.moveByPercent = function(name, percent){
    if(!servos.hasOwnProperty(name) || !isFinite(percent)) return;
    servos[name].moveByPercent(percent);
  };

  this.servoState = function(){
    return {
      base: servos.base.currentAngle,
      lower: servos.lower.currentAngle,
      upper: servos.upper.currentAngle,
      grip: servos.grip.currentAngle
    };
  };

  this.getServoState = function(msg, cb){
    cb('complete', self.servoState());
  };

  var servoChange = function(){
    if(sleeper) sleeper.reset();
    self.emit('msg', self.servoState());
  };

  var init = function(){
    Object.keys(SERVO_CONFIG).forEach(function(name){
      servos[name] = new ServoClass(SERVO_CONFIG[name]);
      servos[name].on('change', servoChange);
    });
    if(opts.sleepTimeout){
      sleeper = new ServoSleep(opts.sleepTimeout, Object.keys(servos).map(function(n){ return servos[n]; }));
    }
    self.moveToCentres();
  };

  init();
};

util.inherits(Arm, EventEmitter);

exports.Arm = Arm;
exports.SERVO_CONFIG = SERVO_CONFIG;
exports.parseAngle = parseAngle;
