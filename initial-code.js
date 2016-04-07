const initialCode = `
import {makeDOMDriver, div, textarea} from '@cycle/dom';

import {Observable as O} from 'rx';

const drivers = {
  DOM: makeDOMDriver('.app')
};

function main ({DOM}) {
  return {
    DOM: O.just(
      div('.hello-world', 'Hello World')
    )
  };
}

export {main, drivers};
`;

export default initialCode;
