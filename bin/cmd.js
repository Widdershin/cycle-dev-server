var fs = require('fs');
var process = require('process');
var cwd = process.cwd;
var path = require('path');
var spawn = require('child_process').spawn;

// If app.js doesn't exists
//  create app.js
// Run dev server
// Spawn child process for budo "server.js"
// Spawn child process for code updates "index.js"
// Tell the user that we're observing on port 9000
// 

function main () {
  var filePath = path.join(cwd(), 'app.js');
  if (fs.existsSync(filePath)) {
    var babelNodePath = path.join(__dirname, '..', 'node_modules' , 'babel-cli', 'bin', 'babel-node.js');
    var devServerPath = path.join(__dirname, '..', 'server.js');
    var cwdPath = path.join(__dirname, 'node_modules', 'cycle-dev-server');

    spawn('node', [ babelNodePath, devServerPath ], { stdio: 'inherit', cwd: cwdPath } );
  } else {
    throw new Error('File doesn\'t exsists');
  }
}

main();