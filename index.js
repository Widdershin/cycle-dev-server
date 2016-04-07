// Start a server
// Serve an html file with a div.app
// Include a javascript file that
//  displays an editor (collapsable)
//  has a basic cycle.js app inside
//  sends changes back to server to be written to disk
//  restarts the cycle.js app on code changes
//  automatically installs node modules when imported

import express from 'express';

const app = express();

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
