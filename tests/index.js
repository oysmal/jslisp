import { jslisp } from "../src/parse.js";

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
//  3 //  (mult
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

// console.log(
//   "RESULT: ",
//   l(
//     parseLF2(
//       tokenizer(`((defn my/func [a b] ((pow (v a) (v b)))) (my/func 2 3))`),
//       0
//     ).value
//   )
// );

// const programRes1 = jslisp(`(
// (add 1 2)
// )`);

// console.log("ONE: ", programRes1);

// const programRes = jslisp(`(
// (defn my/test [a] (
//   (str "Hello, " (v a))))

// (my/test "Øystein Malt"))`);

// console.log(programRes);

// const myfn = jslisp(`(
// (defn my/test [a] (
//   (str "Hello, " (v a))))
// (exportf my/test))`);

// const myAdd = jslisp(`(
// (defn my/add [a b] (
//   (add (v a) (v b))))
// (exportf my/add))`);

const fib = jslisp(`
(defn my/fib [n last current]
    (cond (= n 2)
      current
      (my/fib (- n 1) current (+ last current))))
(export my/fib)`);

const s1 = Date.now();
const x = fib(1000, 1, 1);
const s2 = Date.now() - s1;
console.log("jslisp time: ", s2, ", value: " + x);

function fib2(n, last, current) {
  if (n === 2) return current;
  return fib2(n - 1, current, last + current);
}

function slowFib(n) {
  switch (n) {
    case 0:
    case 1:
      return n;
    default:
      return fibbo(n - 1) + fibbo(n - 2);
  }
}

const s3 = Date.now();
const x1 = fib2(500, 1, 1);
const s4 = Date.now() - s3;

console.log("pure js time: ", s4, ", value: " + x1);

const s5 = Date.now();
let current = 0;
let last = 0;

for (let i = 1; i <= 150000; i++) {
  if (i == 1) {
    current = 1;
    last = 0;
    continue;
  }
  const nextcalc = last + current;
  last = current;
  current = nextcalc;
}

const s6 = Date.now() - s5;

console.log("JS loop time: ", s6, ", value: ", current);
