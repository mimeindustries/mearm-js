var path = require('path');
var WebSocket = require('ws');
var HttpServer = require('./HttpServer.js').HttpServer;
var MiroComms = require('./MiroComms.js').MiroComms;

var DEFAULT_WS_PORT = 8899;
var MAX_PAYLOAD = 64 * 1024;

// Create the arm, preferring real hardware and falling back to a dummy arm
var createArm = function(opts){
  if(!opts.dummy){
    try{
      var MeArmPi = require('./MeArmPi.js').MeArmPi;
      var arm = new MeArmPi();
      console.log('Booting on Raspberry Pi');
      return {arm: arm, hardware: true};
    }catch(e){
      console.log('Raspberry Pi hardware not available (' + e.message + ')');
    }
  }
  var DummyArm = require('./DummyArm.js').DummyArm;
  console.log('Booting with dummy arm');
  return {arm: new DummyArm(), hardware: false};
};

// Joysticks and LEDs are optional extras: failures shouldn't stop the arm working
var startPeripherals = function(arm){
  try{
    var PiJoysticks = require('./PiJoysticks.js').PiJoysticks;
    new PiJoysticks(arm);
  }catch(e){
    console.log('Joysticks not available (' + e.message + ')');
  }
  try{
    require('./StatusLED.js').start(5000);
  }catch(e){
    console.log('Status LED not available (' + e.message + ')');
  }
};

var parseArgs = function(argv){
  var opts = {ui: true, httpPort: 80, wsPort: DEFAULT_WS_PORT};
  argv.forEach(function(arg){
    if(arg === '--no-ui') opts.ui = false;
    else if(arg === '--dummy') opts.dummy = true;
    else if(/^--ws-port=\d+$/.test(arg)) opts.wsPort = Number(arg.split('=')[1]);
    else if(/^\d+$/.test(arg)) opts.httpPort = Number(arg);
    else console.log('Ignoring unknown argument: ' + arg);
  });
  return opts;
};

var start = function(opts){
  opts = opts || {};
  var created = opts.arm ? {arm: opts.arm, hardware: false} : createArm(opts);
  var arm = created.arm;
  if(created.hardware) startPeripherals(arm);

  var comms = new MiroComms(arm);
  var result = {arm: arm, comms: comms};

  if(opts.ui !== false){
    result.httpd = new HttpServer(path.join(__dirname, '..', 'web-ui'), opts.httpPort === undefined ? 80 : opts.httpPort, opts.host);
  }

  var wss = new WebSocket.Server({
    port: opts.wsPort === undefined ? DEFAULT_WS_PORT : opts.wsPort,
    host: opts.host,
    maxPayload: MAX_PAYLOAD
  });
  wss.on('error', function(err){
    console.error('WebSocket server error: ' + err.message);
  });
  wss.on('connection', function(ws){
    console.log('New WebSocket connection');
    ws.on('error', function(err){
      console.error('WebSocket client error: ' + err.message);
    });
    ws.on('message', function(data){
      var msg;
      try{
        msg = JSON.parse(data.toString());
      }catch(e){
        ws.send(JSON.stringify({status: 'error', msg: 'Invalid JSON'}));
        return;
      }
      comms.handle_msg(msg);
    });
  });
  result.wss = wss;

  comms.on('msg', function(msg){
    var data = JSON.stringify(msg);
    wss.clients.forEach(function(client){
      if(client.readyState === WebSocket.OPEN){
        client.send(data);
      }
    });
  });

  result.close = function(cb){
    var pending = result.httpd ? 2 : 1;
    var done = function(){ if(--pending === 0 && cb) cb(); };
    wss.clients.forEach(function(c){ c.terminate(); });
    wss.close(done);
    if(result.httpd) result.httpd.close(done);
  };

  return result;
};

exports.start = start;
exports.parseArgs = parseArgs;
