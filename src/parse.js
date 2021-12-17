import {
  JSLispCond,
  JSLispExport,
  JSLispFn,
  JSLispDef,
  JSLispForm,
  JSLispVar,
  interpret,
  globalScope,
} from "./core.js";

const Node = "__$NODE__";
const Closing = "__$CLOSING__";
const ClosingArray = "__$CLOSING_ARRAY__";

function tokenizer(source) {
  const singleTokens = "()[]{}".split("");

  const tokens = [];
  let word = "";
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (char === '"') {
      word += char;
      i += 1;
      let nextChar = source[i];
      while (nextChar !== '"' && source[i - 1] !== "\\") {
        word += nextChar;
        i += 1;
        nextChar = source[i];
      }
      word += nextChar;
      tokens.push(word);
      word = "";
    } else if (singleTokens.includes(char) && source[i - 1] !== "\\") {
      if (word.length > 0) {
        tokens.push(word);
        word = "";
      }
      tokens.push(char);
    } else if (char === " " || char === "\n") {
      if (word.length > 0) {
        tokens.push(word);
        word = "";
      }
    } else {
      word += char;
    }

    ++i;
  }
  return tokens;
}

export function jslisp(source) {
  return interpret(globalScope, parseL2(source));
}

function parseL2(source) {
  const tokens = tokenizer(source);
  const progArray = [];
  let i = 0;
  let parsed;
  while (i < tokens.length) {
    parsed = parseLF2(tokens, i);
    if (parsed.nextIndex < tokens.length) {
      progArray.push(parsed.value);
    }
    i = parsed.nextIndex;
  }
  progArray.push(parsed.value);
  return [JSLispForm, JSLispForm, ...progArray];
}

function parseLF2(tokens, index) {
  let i = index;
  const token = tokens[i];

  if (token === ")") {
    return { type: Closing, nextIndex: i + 1 };
  }
  if (token === "]") {
    return { type: ClosingArray, nextIndex: i + 1 };
  }

  if (token === "(") {
    const args = [];
    const funcName = tokens[i + 1];
    i += 1;

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
  } else if (token === "[") {
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
  } else if (token === "true" || token === "false") {
    return { nextIndex: i + 1, value: token === "true" ? true : false };
  } else if (token.match(/[0-9\-\+\.]+/)) {
    return { nextIndex: i + 1, value: parseFloat(token) };
  } else {
    return { nextIndex: i + 1, value: [JSLispForm, JSLispVar, token] };
  }
}

function getSymbolName(funcName) {
  switch (funcName) {
    case "cond":
      return JSLispCond;
    case "def":
      return JSLispDef;
    case "defn":
      return JSLispFn;
    case "export":
      return JSLispExport;
    default:
      return JSLispForm;
  }
}
