import {run} from '@cycle/core';
import {makeDOMDriver, div, textarea} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

import {Observable as O, ReplaySubject} from 'rx';

const babel = require('babel-core');
import es2015 from 'babel-preset-es2015';

import vm from 'vm';

import ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/keybinding/vim';

function aceDriver (code$) {
  const editor = ace.edit('editor');
  const codeChange$ = new ReplaySubject();

  editor.getSession().setMode('ace/mode/javascript');
  editor.setTheme('ace/theme/monokai');

  editor.getSession().setOptions({
    tabSize: 2
  });

  code$.subscribe(code => {
    editor.setValue(code);

    editor.clearSelection();
  });

  editor.on('input', sendCodeToSource);

  function sendCodeToSource () {
    codeChange$.onNext({code: editor.getSession().getValue()});
  }

  return {code$: codeChange$};
}

function subAppDriver (code$) {
  function compile (code) {
    return babel.transform(code, {presets: [es2015]}).code;
  }

  function execute (compiledCode) {
    const exports = {};
    const context = {require, console, exports};

    console.log(compiledCode);

    vm.runInNewContext(compiledCode, context);

    return exports;
  }

  let sources, sinks;

  return code$.subscribe(code => {
    if (sources) {
      sources.dispose();
      sinks.dispose();
    }

    const subApp = execute(compile(code));

    const state = run(subApp.main, subApp.drivers);

    sources = state.sources;
    sinks = state.sinks;
  });
}

const drivers = {
  HTTP: makeHTTPDriver({eager: true}),
  SubApp: subAppDriver,
  Ace: aceDriver
};

function updateServer ({code}) {
  return {
    url: '/code/app.js',
    method: 'PUT',
    send: {code}
  };
}

function requestApp () {
  return {
    url: '/code/app.js',
    method: 'GET'
  };
}

function main ({Ace, HTTP}) {
  const serverCode$ = HTTP
    .filter(response$ => response$.request.method === 'GET')
    .mergeAll()
    .map(response => JSON.parse(response.text));

  const code$ = O.merge(
    serverCode$,
    Ace.code$
  );

  return {
    Ace: code$.pluck('code').take(1),

    SubApp: code$.pluck('code'),

    HTTP: code$.debounce(500).map(updateServer).startWith(requestApp())
  };
}

run(main, drivers);

