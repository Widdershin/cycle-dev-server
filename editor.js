import {run} from '@cycle/core';
import {makeDOMDriver, div, textarea} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

import {Observable as O} from 'rx';

const babel = require('babel-core');
import es2015 from 'babel-preset-es2015';

import vm from 'vm';

import initialCode from './initial-code';

function subAppDriver (code$) {
  function compile (code) {
    return babel.transform(code, {presets: [es2015]}).code;
  }

  function execute (compiledCode) {
    const exports = {}
    const context = {require, console, exports};

    console.log(compiledCode);

    const result = vm.runInNewContext(compiledCode, context);

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
  DOM: makeDOMDriver('.editor'),
  HTTP: makeHTTPDriver({eager: true}),
  SubApp: subAppDriver
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

function main ({DOM, HTTP}) {
  const editorChange$ = DOM
    .select('.editor-form')
    .events('input')
    .map(event => ({code: event.target.value, err: ''}));

  const serverCode$ = HTTP
    .filter(response$ => response$.request.method === 'GET')
    .mergeAll()
    .map(response => JSON.parse(response.text));

  const code$ = O.merge(
    serverCode$,
    editorChange$
  );

  return {
    DOM: code$.map(({code}) =>
      textarea('.editor-form', code)
    ),

    SubApp: code$.pluck('code'),

    HTTP: code$.debounce(500).map(updateServer).startWith(requestApp())
  };
}

run(main, drivers);

