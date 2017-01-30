const EventEmitter = require('events').EventEmitter;
const util = require('util');

var DummyServo = function(conf){

  var self = this;
  this.currentAngle = 0;
  var releaseTimeout = undefined;
  var lastPulseWidth = 0;

  this.moveToAngle = function(angle, cb){
    this.setCurrentAngle(angle, cb);
  }

  this.release = function(){
  }

  this.setCurrentAngle = function(angle, cb){
    angle = Number(angle);
    console.log("Moving servo " + conf.name + " to " + angle + ' degrees');
    if(angle < conf.minAngle){
      self.currentAngle = conf.minAngle;
    }else if(angle > conf.maxAngle){
      self.currentAngle = conf.maxAngle;
    }else{
      self.currentAngle = angle;
    }
    if(cb) setTimeout(cb, 500);
    this.emit('change');
  }

  this.moveByDegrees = function(angle, cb){
    this.setCurrentAngle(self.currentAngle + angle, cb);
  }

  this.moveByPercent = function(percent, cb){
    this.setCurrentAngle(self.currentAngle + (((conf.maxAngle - conf.minAngle) / 100 ) * percent), cb);
  }

  this.moveToCentre = function(){
    var centre = Math.floor(conf.minAngle + (conf.maxAngle - conf.minAngle)/2);
    this.moveToAngle(centre);
  }

}

util.inherits(DummyServo, EventEmitter);

exports.DummyServo = DummyServo
