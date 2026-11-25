// Quick manual hardware check: moves the lower arm and opens/closes the gripper.
var MeArmPi = require('./lib/MeArmPi.js').MeArmPi,
    arm     = new MeArmPi();

var whenComplete = function(next){
  return function(res){ if(res === 'complete') next(); };
};

arm.moveLowerTo(90, whenComplete(function(){
  arm.moveLowerTo(40, whenComplete(function(){
    arm.openGrip(null, whenComplete(function(){
      arm.closeGrip(null, whenComplete(function(){
        console.log('done');
        process.exit(0);
      }));
    }));
  }));
}));
