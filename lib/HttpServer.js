var http = require('http');
var fs = require("fs");

// This is a simple static web server using only the built-in libraries

// General function
var walk = function (dir) {
  var out = [];
  // Read the directory
  fs.readdirSync(dir).forEach(function (f) {
    // Don't get dotfiles
    if(f.startsWith('.')) return;
    // Build the full path of the file
    var path = dir + "/" + f;
    // Get the file's stats
    var stat = fs.statSync(path);
    // If the file is a directory
    if (stat && stat.isDirectory()){
      // walk the directory
      out = out.concat(walk(path));
    }else{
      // Record the file
      out.push(path);
    };
  });
  return out;
};

var HttpServer = function(baseDir, port){
  var self = this;
  this.baseDir = baseDir;
  
  function handleRequest(request, response){
    var path = self.baseDir + request.url;
    if(path.slice(-1) === '/') path += 'index.html'
    if(self.files.indexOf(path) >= 0){
      // Return the file
      fs.readFile(path, function (err, data) {
        if (err) throw err;
        response.end(data);
      });
    }else{
      // Return a 404
      response.statusCode = 404;
      response.end("File not found");
    }
  }  
  
  this.init = function(){
    //Create and start the web server
    var server = http.createServer(handleRequest);
    server.listen(port, function(){
      // server is successfully listening
      console.log("Web server listening on: http://localhost:%s", port);
    });
    this.files = walk(this.baseDir);
  }
  
  this.init();  
}

exports.HttpServer = HttpServer;
