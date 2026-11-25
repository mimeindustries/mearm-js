const test = require('node:test');
var assert = require('assert');
var DummyArm = require('../lib/DummyArm.js').DummyArm;
var parseAngle = require('../lib/Arm.js').parseAngle;

var fastArm = function(){
  var arm = new DummyArm();
  return arm;
};

test('arm starts centred', function(){
  var arm = fastArm();
  assert.deepStrictEqual(arm.servoState(), {base: 0, lower: 67, upper: 67, grip: 45});
});

test('move accepts message objects, numbers and numeric strings', function(t, done){
  var arm = fastArm();
  arm.moveBaseTo({arg: '30'});
  arm.moveLowerTo(100);
  arm.moveUpperTo({arg: 10}, function(status){
    if(status !== 'complete') return;
    assert.deepStrictEqual(arm.servoState(), {base: 30, lower: 100, upper: 10, grip: 45});
    done();
  });
});

test('angles are clamped to the servo range', function(){
  var arm = fastArm();
  arm.moveBaseTo(500);
  arm.moveGripTo(-20);
  assert.strictEqual(arm.servoState().base, 90);
  assert.strictEqual(arm.servoState().grip, 0);
});

test('invalid angles are rejected and leave the servo alone', function(){
  var arm = fastArm();
  [undefined, null, '', 'abc', {}, [], NaN, Infinity, {arg: {}}].forEach(function(bad){
    var statuses = [];
    arm.moveBaseTo(bad === undefined ? {} : {arg: bad}, function(s, m){ statuses.push(s + ':' + m); });
    assert.deepStrictEqual(statuses, ['error:Invalid angle'], 'for ' + JSON.stringify(bad));
  });
  assert.strictEqual(arm.servoState().base, 0);
  assert.ok(isNaN(parseAngle(true)));
});

test('openGrip/closeGrip accept a bare callback', function(t, done){
  var arm = fastArm();
  arm.openGrip(function(status){
    if(status !== 'complete') return;
    assert.strictEqual(arm.servoState().grip, 90);
    arm.closeGrip(null, function(s){
      if(s !== 'complete') return;
      assert.strictEqual(arm.servoState().grip, 0);
      done();
    });
  });
});

test('moveByPercent ignores unknown servos', function(){
  var arm = fastArm();
  arm.moveByPercent('nope', 10);
  arm.moveByPercent('__proto__', 10);
  arm.moveByPercent('base', 10);
  assert.strictEqual(arm.servoState().base, 18);
});
