import { jslisp } from "../../../src/parse.js";

jslisp(`
(use readLineModule "../tests/aoc2023/readLine.js"
  (progn
    (def readLine (get :readLineByLine readLineModule))
    (defg arr [])
    (defn handleLine [line]
        (progn
            (def obj
                (reduce (split line "") (object) (lambda [acc item] (progn
                    (cond (>= (parseInt item) 0) (progn
                        (cond (= (get :first acc) nil)
                            (set :first acc (parseInt item)))
                        (set :second acc (parseInt item))))
                    acc))))
            (def num (parseInt (str "" (get :first obj) (get :second obj))))
            (defg arr (concat arr num))))
    (defn onComplete []
        (progn
            (def total (reduce arr 0 (lambda [acc item] (progn
                (+ acc item)))))
            (print "Total: " total)))
    (readLine "./input.txt" handleLine onComplete)))
`);
