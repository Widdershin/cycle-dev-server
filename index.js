// Start a server
// Serve an html file with a div.app
// Include a javascript file that
//  displays an editor (collapsable)
//  has a basic cycle.js app inside
//  sends changes back to server to be written to disk
//  restarts the cycle.js app on code changes
//  automatically installs node modules when imported

import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/editor.js', function (req, res) {
  res.sendFile(__dirname + '/editor.bundle.js');
});

app.get('/styles.css', function (req, res) {
  res.sendFile(__dirname + '/styles.css');
});

app.get('/code/app.js', function (req, res) {
  res.send(JSON.stringify({code: fs.readFileSync('./app.js', 'utf-8')}));
});

app.put('/code/app.js', function (req, res) {
  fs.writeFileSync('./app.js', req.body.code);
  res.sendStatus(200);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
