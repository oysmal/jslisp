import { l, lf, f, def, v, add } from "./core.js";

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
  return l(parseL2(source).value);
}
function parseL2(source) {
  const tokens = tokenizer(source);
  return parseLF2(tokens, 0);
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
    if (tokens[i + 1] === "(") {
      const args = [];

      let cur = parseLF2(tokens, i + 1);
      while (cur?.type !== Closing) {
        args.push(cur.value);
        i = cur.nextIndex;
        cur = parseLF2(tokens, i);
      }

      i = cur.nextIndex;
      return { nextIndex: i, value: lf(args) };
    } else {
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
        value: lf(lf(f, funcName), ...args),
      };
    }
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
    return { nextIndex: i + 1, value: token };
  }
}
