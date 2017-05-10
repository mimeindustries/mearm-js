var HttpServer  = require('./lib/HttpServer.js').HttpServer,
    WebSocket   = require('ws'),
    WsServer    = WebSocket.Server,
    MiroComms   = require('./lib/MiroComms.js').MiroComms;

try{
  var MeArmPi   = require('./lib/MeArmPi.js').MeArmPi,
    PiJoysticks = require('./lib/PiJoysticks.js').PiJoysticks,
    arm         = new MeArmPi();
    joysticks   = new PiJoysticks(arm),
  console.log("Booting on Raspberry Pi");
}catch(e){
  var DummyArm = require('./lib/DummyArm.js').DummyArm,
      arm      = new DummyArm();
  console.log("Booting with dummy arm");
}

var comms = new MiroComms(arm);

if(process.argv.indexOf('--no-ui') < 0){
  // Set up the http server for serving out our static UI
  var port = process.argv.length >= 3 ? process.argv[2] : 80
  var httpd = new HttpServer('./web-ui', port);
}

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


