const EventEmitter = require('events').EventEmitter;
const util = require('util');

// Commands a client may invoke on the arm. Anything else is rejected, so a
// client can't call arbitrary methods (e.g. EventEmitter's removeAllListeners).
const COMMANDS = [
  'version', 'ping', 'stop', 'pause', 'resume', 'getServoState',
  'openGrip', 'closeGrip', 'moveBaseTo', 'moveLowerTo', 'moveUpperTo', 'moveGripTo'
];

// Commands that respond immediately and may be sent while a move is running
const IMMEDIATE_COMMANDS = ['version', 'ping', 'stop', 'pause', 'resume', 'getServoState'];

var MiroComms = function(arm){
  EventEmitter.call(this);
  var self = this;
  this.arm = arm;
  this.inProgress = false;

  this.arm.on('msg', function(msg){
    self.emit('msg', {id: 'notify', status: 'servoChange', msg: msg});
  });

  this.handle_msg = function(msg){
    if(msg === null || typeof msg !== 'object' || Array.isArray(msg)){
      return self.emitResponse('error', 'Invalid message');
    }
    var msgId = msg.id;
    var cmd = msg.cmd;

    if(typeof cmd !== 'string' || COMMANDS.indexOf(cmd) < 0 || typeof self.arm[cmd] !== 'function'){
      return self.emitResponse('error', 'Unknown command', msgId);
    }
    var immediate = IMMEDIATE_COMMANDS.indexOf(cmd) >= 0;
    if(self.inProgress && !immediate){
      return self.emitResponse('error', 'Command already in operation', msgId);
    }

    try{
      self.arm[cmd](msg, function(status, msgText){
        if(!immediate) self.inProgress = (status === 'accepted');
        self.emitResponse(status, msgText, msgId);
      });
    }catch(e){
      if(!immediate) self.inProgress = false;
      console.error('Error handling command ' + cmd + ':', e);
      self.emitResponse('error', 'Internal error', msgId);
    }
  };

  this.emitResponse = function(status, text, msgId){
    var msg = {status: status};
    if(typeof text !== 'undefined') msg.msg = text;
    if(typeof msgId !== 'undefined') msg.id = msgId;
    self.emit('msg', msg);
  };
};

util.inherits(MiroComms, EventEmitter);

exports.MiroComms = MiroComms;
exports.COMMANDS = COMMANDS;
