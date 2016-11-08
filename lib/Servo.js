var Gpio = require('pigpio').Gpio;

var Servo = function(conf){

  var currentAngle = 0;
  var releaseTimeout = undefined;
  var lastPulseWidth = 0;

  var pin = new Gpio(conf.pin, {mode: Gpio.OUTPUT});

  this.moveToAngle = function(angle, cb){
    this.setCurrentAngle(angle, cb);
  }

  this.release = function(){
    if(typeof releaseTimeout === 'object'){
      clearTimeout(releaseTimeout);
    }
    releaseTimeout = setTimeout(function(){
      console.log("releasing servo");
      pin.digitalWrite(0);
    }, 5000);
  }

  this.updateServo = function(cb){
    // half a second to move 180 degrees, with 0 as 500ms and 180 as 2400ms
    var newPulseWidth = calculatePulseWidth(currentAngle);
    var diff = Math.abs(lastPulseWidth - newPulseWidth);
    lastPulseWidth = newPulseWidth;
    var duration = (diff/1900) * 500
    pin.servoWrite(newPulseWidth);
    if(cb) setTimeout(cb, duration);
  }

  this.setCurrentAngle = function(angle, cb){
    if(angle < conf.minAngle){
      currentAngle = conf.minAngle;
    }else if(angle > conf.maxAngle){
      currentAngle = conf.maxAngle;
    }else{
      currentAngle = angle;
    }
    this.updateServo(cb);
  }

  this.moveByDegrees = function(angle, cb){
    this.setCurrentAngle(currentAngle + angle, cb);
  }

  this.moveByPercent = function(percent, cb){
    this.setCurrentAngle(currentAngle + (((conf.maxAngle - conf.minAngle) / 100 ) * percent), cb);
  }

  var calculatePulseWidth = function(angle){
    return Math.floor(conf.max - (((angle - conf.minAngle) / (conf.maxAngle - conf.minAngle)) * (conf.max - conf.min)));
  }


  this.moveToCentre = function(){
    var centre = Math.floor(conf.minAngle + (conf.maxAngle - conf.minAngle)/2);
    this.moveToAngle(centre);
  }

}

exports.Servo = Servo
