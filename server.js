var HttpServer  = require('./lib/HttpServer.js').HttpServer,
    WsServer    = require('ws').Server,
    MiroComms   = require('./lib/MiroComms.js').MiroComms,
    MeArmPi     = require('./lib/MeArmPi.js').MeArmPi,
    PiJoysticks = require('./lib/PiJoysticks.js').PiJoysticks,
    arm         = new MeArmPi(),
    joysticks   = new PiJoysticks(arm);

// Set up the http server for serving out our static UI
var httpd = new HttpServer('./web-ui', 8080);

// Set up the WebSocket server
var s = new WsServer({port: 8899});
s.on('connection', function(ws) {
  console.log("New WebSocket Connection");
  var comms = new MiroComms(arm);
  comms.on('msg', function(msg){
    ws.send(JSON.stringify(msg));
  });
  ws.on('message', function(data, flags) {
    msg = JSON.parse(data)
    comms.handle_msg(msg);
  });
});


