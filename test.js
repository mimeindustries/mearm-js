var MeArmPi   = require('./lib/MeArmPi.js').MeArmPi,
    arm       = new MeArmPi();

arm.moveLowerTo(90, function(res){
  if(res === 'complete'){
    arm.moveLowerTo(40, function(res2){
      if(res2 === 'complete'){
        arm.openGrip(function(res3){
          if(res3 === 'complete'){
            arm.closeGrip(function(res4){
              if(res4 === 'complete'){
              console.log('done');
              }
            });
          }
        });
      }
    });
  }
});
