const EventEmitter = require('events').EventEmitter;
const util = require('util');

// Stand-in for Servo when there's no Raspberry Pi / pigpio available
var DummyServo = function(conf){
  EventEmitter.call(this);
  this.currentAngle = 0;
  this.sleeping = false;
  this.moveDuration = 500;

  this.moveToAngle = function(angle, cb){
    this.setCurrentAngle(angle, cb);
  };

  this.sleep = function(){ this.sleeping = true; };
  this.wake = function(){ this.sleeping = false; };

  this.setCurrentAngle = function(angle, cb){
    angle = Number(angle);
    if(!isFinite(angle)){
      if(cb) setImmediate(cb);
      return;
    }
    this.currentAngle = Math.min(conf.maxAngle, Math.max(conf.minAngle, angle));
    if(process.env.MEARM_DEBUG) console.log('Moving servo ' + conf.name + ' to ' + this.currentAngle + ' degrees');
    if(cb) setTimeout(cb, this.moveDuration);
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

util.inherits(DummyServo, EventEmitter);

exports.DummyServo = DummyServo;
