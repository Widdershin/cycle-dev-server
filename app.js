import {makeDOMDriver, div, textarea} from '@cycle/dom';

import {Observable as O} from 'rx';

const drivers = {
  DOM: makeDOMDriver('.app')
};

function main ({DOM}) {
  return {
    DOM: O.interval(1000).map(i =>
      div('.hello-world', 'Hello')
    )
  };
}

export {main, drivers};
