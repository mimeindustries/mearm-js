const test = require('node:test');
var assert = require('assert');
var DummyArm = require('../lib/DummyArm.js').DummyArm;
var MiroComms = require('../lib/MiroComms.js').MiroComms;

var setup = function(){
  var arm = new DummyArm();
  var comms = new MiroComms(arm);
  var out = [];
  comms.on('msg', function(m){ if(m.id !== 'notify') out.push(m); });
  return {arm: arm, comms: comms, out: out};
};

test('rejects commands that are not on the whitelist', function(){
  var s = setup();
  ['removeAllListeners', 'emit', 'on', 'constructor', '__proto__', 'toString', 'moveByPercent', 'servoState', 'moveToCentres', 'hasOwnProperty'].forEach(function(cmd, i){
    s.comms.handle_msg({cmd: cmd, id: String(i)});
  });
  assert.strictEqual(s.out.length, 10);
  s.out.forEach(function(m){ assert.deepStrictEqual([m.status, m.msg], ['error', 'Unknown command']); });
  // Arm notifications still work
  assert.strictEqual(s.arm.listenerCount('msg'), 1);
});

test('rejects non-object messages', function(){
  var s = setup();
  [null, 1, 'x', [], true].forEach(function(m){ s.comms.handle_msg(m); });
  assert.strictEqual(s.out.length, 5);
  s.out.forEach(function(m){ assert.strictEqual(m.msg, 'Invalid message'); });
});

test('a move goes accepted then complete and blocks other moves meanwhile', function(t, done){
  var s = setup();
  s.comms.handle_msg({cmd: 'moveBaseTo', arg: '20', id: 'a'});
  s.comms.handle_msg({cmd: 'moveLowerTo', arg: '20', id: 'b'});
  s.comms.handle_msg({cmd: 'getServoState', id: 'c'});
  s.comms.handle_msg({cmd: 'stop', id: 'd'});
  s.comms.handle_msg({cmd: 'ping', id: 'e'});
  assert.deepStrictEqual(s.out.map(function(m){ return m.id + ':' + m.status; }),
    ['a:accepted', 'b:error', 'c:complete', 'd:complete', 'e:complete']);
  assert.strictEqual(s.comms.inProgress, true);
  setTimeout(function(){
    assert.strictEqual(s.out[5].id + ':' + s.out[5].status, 'a:complete');
    assert.strictEqual(s.comms.inProgress, false);
    done();
  }, 600);
});

test('an invalid move does not leave the arm stuck in progress', function(){
  var s = setup();
  s.comms.handle_msg({cmd: 'moveBaseTo', arg: 'abc', id: 'a'});
  assert.deepStrictEqual(s.out[0], {status: 'error', msg: 'Invalid angle', id: 'a'});
  assert.strictEqual(s.comms.inProgress, false);
});

test('servo changes are broadcast as notifications', function(){
  var arm = new DummyArm();
  var comms = new MiroComms(arm);
  var notes = [];
  comms.on('msg', function(m){ if(m.id === 'notify') notes.push(m); });
  arm.moveBaseTo(10);
  assert.strictEqual(notes.length, 1);
  assert.strictEqual(notes[0].status, 'servoChange');
  assert.strictEqual(notes[0].msg.base, 10);
});
