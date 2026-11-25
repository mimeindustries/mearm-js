var http = require('http');
var fs = require('fs');
var path = require('path');

// A simple static web server using only the built-in libraries.
// Only files that exist under baseDir at startup are served.

var MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Recursively list all (non-dot) files under dir, as paths relative to it using '/'
var walk = function(dir, prefix){
  var out = [];
  prefix = prefix || '';
  fs.readdirSync(dir).forEach(function(f){
    if(f.indexOf('.') === 0) return;
    var full = path.join(dir, f);
    var rel = prefix + '/' + f;
    var stat = fs.statSync(full);
    if(stat.isDirectory()){
      out = out.concat(walk(full, rel));
    }else if(stat.isFile()){
      out.push(rel);
    }
  });
  return out;
};

var HttpServer = function(baseDir, port, host){
  var self = this;
  this.baseDir = path.resolve(baseDir);
  this.files = new Set(walk(this.baseDir));

  var send = function(response, code, text){
    response.statusCode = code;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end(text);
  };

  var handleRequest = function(request, response){
    if(request.method !== 'GET' && request.method !== 'HEAD'){
      response.setHeader('Allow', 'GET, HEAD');
      return send(response, 405, 'Method not allowed');
    }
    var urlPath;
    try{
      urlPath = decodeURIComponent(request.url.split('?')[0].split('#')[0]);
    }catch(e){
      return send(response, 400, 'Bad request');
    }
    if(urlPath.slice(-1) === '/') urlPath += 'index.html';
    if(!self.files.has(urlPath)){
      // Redirect directory requests without a trailing slash
      if(self.files.has(urlPath + '/index.html')){
        response.statusCode = 301;
        response.setHeader('Location', encodeURI(urlPath + '/'));
        return response.end();
      }
      return send(response, 404, 'File not found');
    }
    var filePath = path.join(self.baseDir, urlPath);
    fs.readFile(filePath, function(err, data){
      if(err){
        console.error('Error reading ' + filePath + ':', err.message);
        return send(response, 500, 'Internal server error');
      }
      response.statusCode = 200;
      response.setHeader('Content-Type', MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end(request.method === 'HEAD' ? undefined : data);
    });
  };

  this.server = http.createServer(handleRequest);
  this.server.on('error', function(err){
    console.error('Web server error: ' + err.message);
  });
  this.server.listen(port, host, function(){
    console.log('Web server listening on port %s', self.server.address().port);
  });
};

HttpServer.prototype.close = function(cb){
  this.server.close(cb);
};

exports.HttpServer = HttpServer;
