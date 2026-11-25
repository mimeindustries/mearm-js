// Minimal dependency-free test runner (works on Node >= 10)
var fs = require('fs');
var path = require('path');

var tests = [];
global.test = function(name, fn){ tests.push({name: name, fn: fn}); };

fs.readdirSync(__dirname).filter(function(f){ return /\.test\.js$/.test(f); }).sort().forEach(function(f){
  require(path.join(__dirname, f));
});

var failed = 0;
var runNext = function(i){
  if(i >= tests.length){
    console.log('\n' + (tests.length - failed) + '/' + tests.length + ' passed');
    process.exit(failed ? 1 : 0);
  }
  var t = tests[i];
  var finished = false;
  var finish = function(err){
    if(finished) return;
    finished = true;
    clearTimeout(timer);
    if(err){ failed++; console.log('not ok - ' + t.name + '\n  ' + (err.stack || err)); }
    else console.log('ok - ' + t.name);
    runNext(i + 1);
  };
  var timer = setTimeout(function(){ finish(new Error('timeout')); }, 5000);
  try{
    var r = t.fn(finish);
    if(t.fn.length === 0){
      if(r && typeof r.then === 'function') r.then(function(){ finish(); }, finish);
      else finish();
    }
  }catch(e){ finish(e); }
};
runNext(0);
