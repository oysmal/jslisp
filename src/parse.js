import { l, lf, f } from "./core.js";

const Node = "__$NODE__";
const Closing = "__$CLOSING__";

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

  console.log(current);
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

console.log(
  parseL(`
(+ 1 2 3)
`)()
);
