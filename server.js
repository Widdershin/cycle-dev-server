import budo from 'budo';
import babelify from 'babelify';
import hotModuleReloading from 'browserify-hmr';
import path from 'path';

const EDITOR_PATH = path.join(__dirname, 'editor.js');

budo(EDITOR_PATH, {
  serve: 'bundle.js',
  live: '*.{css,html}',
  port: 8000,
  stream: process.stdout,
  browserify: {
    transform: babelify,
    plugin: hotModuleReloading
  }
});
