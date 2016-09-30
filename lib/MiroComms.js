const EventEmitter = require('events').EventEmitter;
const util = require('util');

var MiroComms = function(controller){
  var self = this;
  this.controller = controller
  this.inProgress = false;

  this.handle_msg = function(msg){
    var msgId = msg.id;
    // Handle the message
    if(typeof this.controller[msg.cmd] === 'undefined'){
      self.emitResponse('error', 'Unknown command', msg.id);
    }else if(self.inProgress){
      self.emitResponse('error', 'Command already in operation', msg.id);
    }else{
      this.controller[msg.cmd](msg, function(status, msgText){
        self.emitResponse(status, msgText, msgId);
        self.inProgress = (status === 'accepted');
      });
    }
  }

  this.emitResponse = function(status, text, msgId){
    var msg = {status: status}
    if(typeof text !== 'undefined') msg.msg = text;
    if(typeof msgId !== 'undefined') msg.id = msgId;
    this.emit('msg', msg);
  }
}

util.inherits(MiroComms, EventEmitter);

exports.MiroComms = MiroComms;

