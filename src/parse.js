import { l, lf, f, def, v, add } from "./core.js";

const Node = "__$NODE__";
const Closing = "__$CLOSING__";

function tokenizer(source) {
  const singleTokens = "()[]{}".split("");

  const tokens = [];
  let word = "";
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (singleTokens.includes(char)) {
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

// console.log(
//   tokenizer(`
// (lambda calc [a b]
//  (def res (add a b))
//  (add res b))
// (mult
//  3
//  (calc 2 3)
//  (mult
//   (add 5))
//  10)`)
// );

export function parse(source) {
  const stack = [];

  const sourceCode = source.replace(/\n/g, " ").replace(/\s+/g, " ");
  let i = 0;
  let current = null;
  while (i < sourceCode.length) {
    let nextSpaceIndex = sourceCode.indexOf(" ", i);
    if (nextSpaceIndex === -1) nextSpaceIndex = sourceCode.length;

    const word = sourceCode.slice(i, nextSpaceIndex);

    if (word.charAt(0) === "(") {
      stack.push(current);
      current = {
        type: Node,
        func: word.slice(1),
        args: [],
      };

      if (word.charAt(word.length - 1) === ")") {
        const prevStackItem = stack.pop();
        prevStackItem.args.push(current);
        current = prevStackItem;
      }
      i = nextSpaceIndex + 1; // increment i
      continue;
    }

    if (word.charAt(word.length - 1) === ")") {
      current.args.push(word.slice(0, word.length - 1));
      const prevStackItem = stack.pop();
      prevStackItem.args.push(current);
      current = prevStackItem;
      i = nextSpaceIndex + 1; // increment i
      continue;
    }

    if (word.charAt(0) === '"') {
      let closingQuoteIndex = sourceCode.indexOf('"', i);
      while (sourceCode[closingQuoteIndex - 1] === "\\") {
        const index = sourceCode.indexOf('"', i);
        if (index !== -1) closingQuoteIndex = index;
      }
      current.args.push(sourceCode.slice(i, closingQuoteIndex));
      i = closingQuoteIndex + 1; // increment i
      continue;
    }

    if (word.match(/[0-9\-\+\.]+/)) {
      current.args.push(parseFloat(word));
      i = nextSpaceIndex + 1; // increment i
      continue;
    }

    current.args.push(word);
    i = nextSpaceIndex + 1; // increment i
  }

  // console.log(current);
}

// console.log(
//   parse(`(add
//            1
//            2
//            (mult
//              4 5))`)
// );

export function parseL(source) {
  const sourceCode = source.replace(/\n/g, " ").replace(/\s+/g, " ");
  return () => l(parseLF(sourceCode, 0)[1]);
}

export function parseLF(sourceCode, index) {
  let i = index;
  let nextSpaceIndex = sourceCode.indexOf(" ", i);
  if (nextSpaceIndex === index) nextSpaceIndex = sourceCode.indexOf(" ", i + 1);
  if (nextSpaceIndex === -1) nextSpaceIndex = sourceCode.length;

  const word = sourceCode.slice(i, nextSpaceIndex).trim();

  if (word.charAt(0) === "(") {
    const args = [];
    let j = nextSpaceIndex + 1;
    let [nextIndex, res] = parseLF(sourceCode, j);

    while (typeof res !== "object" || res.type !== Closing) {
      args.push(res);
      [nextIndex, res] = parseLF(sourceCode, nextIndex);
    }

    if (res.type === Closing) {
      if (res.value !== undefined) {
        args.push(res.value);
      }
    } else {
      args.push(res);
    }

    return [nextIndex, lf(lf(f, word.slice(1)), ...args)];
  } else if (word.charAt(0) === ")") {
    return [index + 1, { type: Closing }];
  } else if (word.charAt(word.length - 1) === ")") {
    let firstClosingParens = word.length - 1;
    while (word.charAt(firstClosingParens - 1) === ")") firstClosingParens -= 1;
    const parsedWord = word.slice(0, firstClosingParens);

    if (word.charAt(0) === '"') {
      return [
        index + firstClosingParens + 1,
        { type: Closing, value: word.slice(1, firstClosingParens - 1) },
      ];
    } else if (parsedWord.match(/[0-9\-\+\.]+/)) {
      return [
        index + firstClosingParens + 1,
        { type: Closing, value: parseFloat(parsedWord) },
      ];
    } else {
      return [
        index + firstClosingParens + 1,
        { type: Closing, value: parsedWord },
      ];
    }
  } else if (word.charAt(0) === '"') {
    let closingQuoteIndex = sourceCode.indexOf('"', i + 1);

    while (sourceCode[closingQuoteIndex - 1] === "\\") {
      const index = sourceCode.indexOf('"', i);
      if (index !== -1) closingQuoteIndex = index;
    }

    return [nextSpaceIndex + 1, sourceCode.slice(i + 1, closingQuoteIndex)];
  } else if (word.match(/[0-9\-\+\.]+/)) {
    return [nextSpaceIndex + 1, parseFloat(word)];
  }

  return [nextSpaceIndex + 1, word];
}

// WORKS:
// console.log(parseL(`(add 1 2 (mult 3 4) 5)`)());
// console.log(parseL(`(mult 3 2 (mult (add 5)) 10)`)());

// console.log(
//   parseL(`
// (+ 1 2 3)
// `)()
// );

function parseL2(source) {
  const tokens = tokenizer(source);
}

function parseLF2(tokens, index) {
  let i = index;
  const token = tokens[i];

  if (token === ")") {
    return { type: Closing, nextIndex: i + 1 };
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
  } else if (token.charAt(0) === '"') {
    return { nextIndex: i + 1, value: token };
  } else if (token === "true" || token === "false") {
    return { nextIndex: i + 1, value: token === "true" ? true : false };
  } else if (token.match(/[0-9\-\+\.]+/)) {
    return { nextIndex: i + 1, value: parseFloat(token) };
  } else {
    return { nextIndex: i + 1, value: token };
  }
}

function logDFS(node) {
  if (node?.type && node?.data) {
    node.data.forEach(logDFS);
  }
  console.log(node);
}

// logDFS(
//   parseLF2(
//     tokenizer(`
// (mult
//  3
//  (mult
//   (add 5)
//   2)
//  10)`),
//     0
//   ).value
// );

// console.log(
//   "Exection result: ",
//   l(
//     parseLF2(
//       tokenizer(`
// (mult
//  3
//  (mult
//   (add 5)
//   2)
//  10)`),
//       0
//     ).value
//   )
// );

// console.log("Without parsing: ", l(lf(def, "a", 2), lf(add, lf(v, "a"), 5)));

// console.log(
//   "Exection result 2: ",
//   l(parseLF2(tokenizer(`(mult 10 (add 5 2) 10 10)`), 0).value)
// );

// console.log("tokens: ", tokenizer(`((def a 2) (add (2 5))`));
console.log(
  "RESULT: ",
  l(parseLF2(tokenizer(`((defg a 2) (add (g a) 2))`), 0).value)
);

console.log(
  "RESULT: ",
  l(
    parseLF2(
      tokenizer(`
(
  (def a
    (cond 
      (= 1 1)
      (* (+ 4 1 (- 2 1)) 3)
      (+ 1 1)))
  (+ (v a) 2)
)`),
      0
    ).value
  )
);
