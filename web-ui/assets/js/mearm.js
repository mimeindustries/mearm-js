var Mearm = function(url){
  this.url = url;
  if(url) this.connect();
  this.cbs = {};
  this.listeners = [];
}

Mearm.prototype = {

  connected: false,
  error: false,
  timeoutTimer: undefined,
  devices: {},

  connect: function(url){
    if(url) this.url = url;
    if(!this.connected && !this.error && this.url){
      var self = this;
      this.has_connected = false;
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = function(ws_msg){self.handle_msg(ws_msg)};
      this.ws.onopen = function(){
        self.connected = true;
        self.version(function(){
          self.setConnectedState(true);
        });
      }
      this.ws.onerror = function(err){self.handleError(err)}
      this.ws.onclose = function(err){self.handleError(err)}
      this.connTimeout = window.setTimeout(function(){
        if(!self.connected){
          self.ws.close();
        }
      }, 1000);
    }
  },
  
  fetchDevices: function(cb){
    var self = this;
    var req = new XMLHttpRequest();
    req.addEventListener("load", function(){
      var resp = JSON.parse(this.responseText);
      if(resp.devices && resp.devices.length > 0){
        for(var i = 0; i< resp.devices.length; i++){
          self.devices[resp.devices[i].address] = resp.devices[i];
        }
        cb(self.devices);
      }
    });
    req.addEventListener("error", function(e){
      console.log('Error fetching devices list');
      console.log(e);
    });
    req.open("GET", "http://local.mirobot.io/devices.json");
    req.send();
  },

  disconnect: function(){
    this.connected = false;
    this.error = false
    this.ws.onerror = function(){};
    this.ws.onclose = function(){};
    this.ws.close();
  },

  setConnectedState: function(state){
    var self = this;
    clearTimeout(self.connTimeout);
    self.connected = state;
    if(state){ self.has_connected = true; }
    setTimeout(function(){
      self.emitEvent('readyStateChange', {state: (self.ready() ? 'ready' : 'notReady')});
      self.emitEvent('connectedStateChange', {state: (self.connected ? 'connected' : 'disconnected')});
    }, 500);
    // Try to auto reconnect if disconnected
    if(state){
      if(self.reconnectTimer){
        clearTimeout(self.reconnectTimer);
        self.reconnectTimer = undefined;
      }
    }else{
      if(!self.reconnectTimer){
        self.reconnectTimer = setTimeout(function(){
          self.reconnectTimer = undefined;
          self.connect();
        }, 5000);
      }
    }
  },

  ready: function(){
    return this.connected || this.simulating;
  },
  
  emitEvent: function(event, msg){
    if(typeof this.listeners[event] !== 'undefined'){
      for(var i = 0; i< this.listeners[event].length; i++){
        this.listeners[event][i](msg);
      }
    }
  },

  addEventListener: function(event, listener){
    this.listeners[event] =  this.listeners[event] || [];
    this.listeners[event].push(listener);
  },

  handleError: function(err){
    if(err instanceof CloseEvent || err === 'Timeout'){
      if(this.ws.readyState === WebSocket.OPEN){
        this.ws.close();
      }
      this.msg_stack = [];
    }else{
      console.log(err);
    }
    this.setConnectedState(false);
  },

  openGrip: function(cb){
    this.send({cmd:'openGrip'}, cb);
  },

  closeGrip: function(cb){
    this.send({cmd:'closeGrip'}, cb);
  },

  moveBaseTo: function(angle, cb){
    this.send({cmd:'moveBaseTo', arg: angle}, cb);
  },

  moveLowerTo: function(angle, cb){
    this.send({cmd:'moveLowerTo', arg: angle}, cb);
  },

  moveUpperTo: function(angle, cb){
    this.send({cmd:'moveUpperTo', arg: angle}, cb);
  },

  moveGripTo: function(angle, cb){
    this.send({cmd:'moveGripTo', arg: angle}, cb);
  },

  getServoState: function(cb){
    this.send({cmd:'getServoState'}, cb);
  },

  stop: function(cb){
    var self = this;
    this.send({cmd:'stop'}, function(state, msg, recursion){
      if(state === 'complete' && !recursion){
        for(var i in self.cbs){
          self.cbs[i]('complete', undefined, true);
        }
        self.emitEvent('programComplete');
        self.robot_state = 'idle';
        self.msg_stack = [];
        self.cbs = {};
        if(cb){ cb(state); }
      }
    });
  },
  
  pause: function(cb){
    this.send({cmd:'pause'}, cb);
  },
  
  resume: function(cb){
    this.send({cmd:'resume'}, cb);
  },
  
  ping: function(cb){
    this.send({cmd:'ping'}, cb);
  },

  version: function(cb){
    this.send({cmd:'version'}, cb);
  },

  send: function(msg, cb){
    msg.id = Math.random().toString(36).substr(2, 10)
    if(cb){
      this.cbs[msg.id] = cb;
    }
    if(msg.arg){ msg.arg = msg.arg.toString(); }
    if(['stop', 'pause', 'resume', 'ping', 'version', 'getServoState'].indexOf(msg.cmd) >= 0){
      this.send_msg(msg);
    }else{
      if(this.msg_stack.length === 0){
        this.emitEvent('programStart');
      }
      this.msg_stack.push(msg);
      this.process_msg_queue();
    }
  },
  
  send_msg: function(msg){
    var self = this;
    console.log(msg);
    if(this.simulating && this.sim){
      this.sim.send(msg, function(msg){ self.handle_msg(msg) });
    }else if(this.connected){
      this.ws.send(JSON.stringify(msg));
      if(this.timeoutTimer) clearTimeout(this.timeoutTimer);
      this.timeoutTimer = window.setTimeout(function(){ self.handleError("Timeout") }, 3000);
    }
  },
  
  process_msg_queue: function(){
    if(this.robot_state === 'idle' && this.msg_stack.length > 0){
      this.robot_state = 'receiving';
      this.send_msg(this.msg_stack[0]);
    }
  },
  
  handle_msg: function(msg){
    if(typeof msg === 'object' && typeof msg.data === 'string') msg = JSON.parse(msg.data);
    console.log(msg);
    clearTimeout(this.timeoutTimer);
    if(msg.id === 'notify'){
      this.emitEvent(msg.status, msg.msg);
      return;
    }
    if(this.msg_stack.length > 0 && this.msg_stack[0].id == msg.id){
      if(msg.status === 'accepted'){
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('started', msg);
        }
        this.robot_state = 'running';
      }else if(msg.status === 'complete'){
        if(this.cbs[msg.id]){
          this.cbs[msg.id]('complete', msg);
          delete this.cbs[msg.id];
        }
        this.msg_stack.shift();
        if(this.msg_stack.length === 0){
          this.emitEvent('programComplete');
        }
        this.robot_state = 'idle';
        this.process_msg_queue();
      }
    }else{
      if(this.cbs[msg.id]){
        this.cbs[msg.id]('complete', msg);
        delete this.cbs[msg.id];
      }
    }
    if(msg.status && msg.status === 'error' && msg.msg === 'Too many connections'){
      this.error = true;
      this.emitEvent('error');
    }
  },
  
  robot_state: 'idle',
  msg_stack: []
}
