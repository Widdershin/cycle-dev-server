import {run} from '@cycle/core';
import {makeDOMDriver, div, pre} from '@cycle/dom';
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
  let editor;

  code$.take(1).subscribe(code => {
    editor = ace.edit('editor-inner');
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/monokai');

    editor.getSession().setOptions({
      tabSize: 2
    });

    editor.on('input', sendCodeToSource);
  })

  const codeChange$ = new ReplaySubject(1);

  code$.subscribe(code => {
    editor.setValue(code);

    editor.clearSelection();
  });

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

  const error$ = new ReplaySubject(1);

  code$.subscribe(code => {
    if (sources) {
      sources.dispose();
      sinks.dispose();
    }

    try {
      const subApp = execute(compile(code));

      const state = run(subApp.main, subApp.drivers);

      sources = state.sources;
      sinks = state.sinks;

      error$.onNext({message: ''});
    } catch (e) {
      error$.onNext(e);
    }
  });

  return {error$: error$.startWith({message: ''})};
}

const drivers = {
  DOM: makeDOMDriver('.tools'),
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

function main ({DOM, Ace, HTTP, SubApp}) {
  const serverCode$ = HTTP
    .filter(response$ => response$.request.method === 'GET')
    .mergeAll()
    .map(response => JSON.parse(response.text));

  const code$ = O.merge(
    serverCode$,
    Ace.code$
  );

  return {
    DOM: SubApp.error$.map(error =>
      div('.editor', [
        div({key: 1, id: 'editor-inner', style: {height: error.message === '' ? '100%' : '80%'}}),
        pre('.message-panel', {key: 2, style: {height: error.message === '' ? '0%' : '20%'}}, error.message)
      ])
    ),

    Ace: code$.pluck('code').take(1),

    SubApp: code$.pluck('code'),

    HTTP: code$.debounce(500).map(updateServer).startWith(requestApp())
  };
}

run(main, drivers);

