var HttpServer  = require('./lib/HttpServer.js').HttpServer,
    WebSocket   = require('ws'),
    WsServer    = WebSocket.Server,
    MiroComms   = require('./lib/MiroComms.js').MiroComms;
    
try{
  var MeArmPi   = require('./lib/MeArmPi.js').MeArmPi,
    PiJoysticks = require('./lib/PiJoysticks.js').PiJoysticks,
    joysticks   = new PiJoysticks(arm),
    arm         = new MeArmPi();
}catch(e){
  var DummyArm = require('./lib/DummyArm.js').DummyArm,
      arm      = new DummyArm();
}

var comms = new MiroComms(arm);

// Set up the http server for serving out our static UI
var httpd = new HttpServer('./web-ui', 80);

// Set up the WebSocket server
var s = new WsServer({port: 8899});
s.on('connection', function(ws) {
  console.log("New WebSocket Connection");
  ws.on('message', function(data, flags) {
    msg = JSON.parse(data)
    comms.handle_msg(msg);
  });
});

comms.on('msg', function(msg){
  s.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
});


