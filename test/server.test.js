const test = require('node:test');
var assert = require('assert');
var http = require('http');
var WebSocket = require('ws');
var server = require('../lib/server.js');

var get = function(port, p, cb){
  http.get({host: '127.0.0.1', port: port, path: p}, function(res){
    var body = '';
    res.on('data', function(d){ body += d; });
    res.on('end', function(){ cb(res, body); });
  });
};

var startServer = function(cb){
  var s = server.start({dummy: true, httpPort: 0, wsPort: 0, host: '127.0.0.1'});
  var ready = 0;
  var check = function(){ if(++ready === 2) cb(s, s.httpd.server.address().port, s.wss.address().port); };
  s.httpd.server.once('listening', check);
  s.wss.once('listening', check);
};

test('parseArgs', function(){
  assert.deepStrictEqual(server.parseArgs(['8080', '--no-ui']), {ui: false, httpPort: 8080, wsPort: 8899});
  assert.deepStrictEqual(server.parseArgs([]), {ui: true, httpPort: 80, wsPort: 8899});
});

test('static server serves UI files with content types and blocks traversal', function(t, done){
  startServer(function(s, httpPort){
    get(httpPort, '/', function(res, body){
      assert.strictEqual(res.statusCode, 200);
      assert.ok(/text\/html/.test(res.headers['content-type']));
      assert.ok(body.indexOf('MeArm') >= 0);
      get(httpPort, '/assets/js/mearm.js?x=1', function(res2){
        assert.strictEqual(res2.statusCode, 200);
        assert.ok(/javascript/.test(res2.headers['content-type']));
        get(httpPort, '/../package.json', function(res3){
          assert.strictEqual(res3.statusCode, 404);
          get(httpPort, '/%2e%2e/package.json', function(res4){
            assert.strictEqual(res4.statusCode, 404);
            get(httpPort, '/%E0%A4%A', function(res5){
              assert.strictEqual(res5.statusCode, 400);
              get(httpPort, '/snap', function(res6){
                assert.strictEqual(res6.statusCode, 301);
                assert.strictEqual(res6.headers.location, '/snap/');
                s.close(function(){ done(); });
              });
            });
          });
        });
      });
    });
  });
});

test('websocket survives bad JSON and handles commands', function(t, done){
  startServer(function(s, httpPort, wsPort){
    var ws = new WebSocket('ws://127.0.0.1:' + wsPort);
    var got = [];
    ws.on('message', function(data){
      var m = JSON.parse(data.toString());
      if(m.id === 'notify') return;
      got.push(m);
      if(got.length === 1){
        assert.deepStrictEqual(m, {status: 'error', msg: 'Invalid JSON'});
        ws.send(JSON.stringify({cmd: 'version', id: 'v'}));
      }else if(got.length === 2){
        assert.deepStrictEqual(m, {status: 'complete', msg: '0.0.1', id: 'v'});
        ws.send(JSON.stringify({cmd: 'removeAllListeners', id: 'r'}));
      }else if(got.length === 3){
        assert.strictEqual(m.msg, 'Unknown command');
        ws.close();
        s.close(function(){ done(); });
      }
    });
    ws.on('open', function(){ ws.send('{not json'); });
  });
});
