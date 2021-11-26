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

function jslisp(source) {
  return parseL2(source);
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

    console.log(array);
    return {
      nextIndex: i,
      value: array,
    };
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
// console.log(
//   "RESULT: ",
//   l(parseLF2(tokenizer(`((defg a 2) (add (g a) 2))`), 0).value)
// );

// console.log(
//   "RESULT: ",
//   l(
//     parseLF2(
//       tokenizer(`
// (
//   (def a
//     (cond
//       (= 1 1)
//       (* (+ 4 1 (- 2 1)) 3)
//       (+ 1 1)))
//   (+ (v a) 2)
// )`),
//       0
//     ).value
//   )
// );

console.log(
  "RESULT: ",
  l(
    parseLF2(
      tokenizer(`((defn my/func [a b] ((pow (v a) (v b)))) (my/func 2 3))`),
      0
    ).value
  )
);

const programRes = jslisp(`(
(defn my/test [a] (
  (str "Hello, " (v a))))

(my/test "Øystein Malt"))`);

console.log(programRes.value);
