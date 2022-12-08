import {
  JSLispCond,
  JSLispExport,
  JSLispFn,
  JSLispDef,
  JSLispForm,
  JSLispVar,
  JSLispJS,
  JSLispSymbol,
  interpret,
  globalScope,
  JSLispImport,
} from './core.js';

const Node = '__$NODE__';
const Closing = '__$CLOSING__';
const ClosingArray = '__$CLOSING_ARRAY__';

function tokenizer(source) {
  const singleTokens = '()[]{}'.split('');

  const tokens = [];
  let word = '';
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (char === '"') {
      word += char;
      i += 1;
      let nextChar = source[i];
      while (nextChar !== '"' && source[i - 1] !== '\\') {
        word += nextChar;
        i += 1;
        nextChar = source[i];
      }
      word += nextChar;
      tokens.push(word);
      word = '';
    } else if (singleTokens.includes(char) && source[i - 1] !== '\\') {
      if (word.length > 0) {
        tokens.push(word);
        word = '';
      }
      tokens.push(char);
    } else if (char === ' ' || char === '\n') {
      if (word.length > 0) {
        tokens.push(word);
        word = '';
      }
    } else {
      word += char;
    }

    ++i;
  }
  return tokens;
}

export function jslisp(source, jsDeps) {
  globalScope.c.set('jsDeps', jsDeps);
  return interpret(globalScope, parseL2(source));
}

function parseL2(source) {
  const tokens = tokenizer(source);
  console.log('LEN: ', tokens.length);
  const progArray = [];
  let i = 0;
  let parsed;
  try {
    while (i < tokens.length) {
      parsed = parseLF2(tokens, i);
      if (parsed.nextIndex < tokens.length) {
        progArray.push(parsed.value);
      }
      i = parsed.nextIndex;
    }
  } catch (e) {
    handleSyntaxError(e, source);
  }
  progArray.push(parsed.value);
  return [JSLispForm, JSLispForm, ...progArray];
}

function parseLF2(tokens, index) {
  let i = index;
  const token = tokens[i];

  if (token === ')') {
    return { type: Closing, nextIndex: i + 1 };
  }
  if (token === ']') {
    return { type: ClosingArray, nextIndex: i + 1 };
  }

  if (token === '(') {
    const args = [];
    i += 1;
    const funcName = tokens[i];

    if (funcName === '(') {
      throw new SyntaxError(`Syntax error. You have a ... ( ... where a function was expected`, i);
    }

    // When the funcName is js, we know the next
    // form entry is the js construct, so we should not parse it
    // (as it will not be a string or a symbol)
    if (funcName === 'js') {
      i += 1;
      args.push(tokens[i]);
    }

    let cur = parseLF2(tokens, i + 1);
    while (cur?.type !== Closing) {
      args.push(cur.value);
      i = cur.nextIndex;
      cur = parseLF2(tokens, i);
    }

    if (cur.value !== undefined) {
      args.push(cur.value);
    }

    i = cur.nextIndex;

    return {
      nextIndex: i,
      value: [JSLispForm, getSymbolName(funcName), funcName, ...args],
    };
  } else if (token === '[') {
    const array = [];
    let cur = parseLF2(tokens, i + 1);
    while (cur?.type !== ClosingArray) {
      array.push(cur.value);
      i = cur.nextIndex;
      cur = parseLF2(tokens, i);
    }

    if (cur.value !== undefined) {
      array.push(cur.value);
    }

    i = cur.nextIndex;

    return {
      nextIndex: i,
      value: array,
    };
  } else if (token.charAt(0) === '"') {
    return { nextIndex: i + 1, value: token.slice(1, token.length - 1) };
  } else if (token === 'true' || token === 'false') {
    return { nextIndex: i + 1, value: token === 'true' ? true : false };
  } else if (token.match(/[0-9\-\+\.]+/)) {
    return { nextIndex: i + 1, value: parseFloat(token) };
  } else if (token.charAt(0) === ':') {
    return { nextIndex: i + 1, value: [JSLispForm, JSLispSymbol, token] };
  } else {
    return { nextIndex: i + 1, value: [JSLispForm, JSLispVar, token] };
  }
}

function getSymbolName(funcName) {
  switch (funcName) {
    case 'cond':
      return JSLispCond;
    case 'def':
      return JSLispDef;
    case 'defn':
      return JSLispFn;
    case 'export':
      return JSLispExport;
    case 'js':
      return JSLispJS;
    case 'use':
      return JSLispImport;
    default:
      return JSLispForm;
  }
}

class SyntaxError extends Error {
  constructor(message, tokenIndex) {
    super(message);
    this.tokenIndex = tokenIndex;
  }
}

function handleSyntaxError(e, source) {
    // replace "\n" with " \n", so that the tokenizer can still delimit things correctly (getting correct number of tokens)
    const sourceLines = source.replaceAll('\n', ' \n').split('\n');
    let tokenCounter = 0;
    for (let j = 0; j < sourceLines.length; j++) {
      const tokenized = tokenizer(sourceLines[j]);
      if (tokenCounter + tokenized.length > e.tokenIndex) {
        let column = 0;
        let curToken = 0;
        while (column > -1 && column < sourceLines[j].length && curToken < tokenized.length) {
          const nextToken = tokenized[curToken];
          column += 1 + sourceLines[j].slice(column).indexOf(nextToken);

          if (tokenCounter + curToken === e.tokenIndex) break;
          ++curToken;
        }
        throw new Error(`${e.message}. [At line ${j + 1}, column ${column}]`);
      }
      tokenCounter += tokenized.length;
    }
}