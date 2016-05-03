const EventEmitter = require('events');
const util = require('util');

var ResponseObject = function(comms, id){
  var self = this;
  this.comms = comms;
  this.id = id;
  
  this.accepted = function(){
    self.emitMsg('complete');
  }
  this.complete = function(text){
    self.emitMsg('complete', text);
  }
  this.error = function(text){
    self.emitMsg('error', text);
  }
  this.emitMsg = function(status, text){
    var msg = {status: status}
    if(typeof text !== 'undefined') msg.msg = text;
    if(typeof this.id !== 'undefined') msg.id = this.id;
    this.comms.emit('msg', msg);
  }
}

var MiroComms = function(controller){
  var self = this;
  this.controller = controller
  
  this.handle_msg = function(msg){
    var o = new ResponseObject(self, msg.id);
    // Handle the message
    if(typeof this.controller[msg.cmd] !== 'undefined'){
      this.controller[msg.cmd](msg, o);
    }else{
      var resp = {status: "error", msg: "Unknown command"};
      if(typeof msg.id !== 'undefined') resp.id = msg.id;
      self.emit('msg', resp);
    }
  }
}

util.inherits(MiroComms, EventEmitter);

exports.MiroComms = MiroComms;