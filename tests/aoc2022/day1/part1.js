import { jslisp } from '../../../src/parse.js';
// import { readLineByLine } from "../utils/readFile.js";

// let longest = 0;
// let list = [];

// function handleLine(line) {
//   if (line.length === 0) {
//     const cals = list.reduce((acc, cur) => acc + cur, 0);
//     list = [];
//     if (cals > longest) longest = cals;
//   } else {
//     console.log(parseInt(line));
//     list.push(parseInt(line));
//   }
// }

// function onComplete() {
//   console.log("Longest: ", longest);
// }

// readLineByLine("./input.txt", handleLine, onComplete);

jslisp(`
(use readLineModule "../tests/aoc2022/readLine.js"
  (progn 
    (def readLine (get :readLineByLine readLineModule))
    (defg longest 0)
    (defg list [])
    (defn handleLine [line]
        (progn
          (cond (= (length line) 0)
            (progn
              (def cals (reduce list 0 (lambda [acc cur] (+ acc cur))))
              (defg list [])
              (cond (> cals (g longest))
                (defg longest cals)
                (defg longest (g longest))))
            (progn 
              (defg list (concat list (parseInt line)))))))
    (defn onComplete []
        (progn 
          (handleLine "")
          (print "Longest: " (g longest))))
    (readLine "./calories.txt" handleLine onComplete)))
`)

