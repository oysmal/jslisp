import { jslisp } from "../../../src/parse.js";

// TODO: Allow last part of one number to be start of next

jslisp(`
(use readLineModule "../tests/aoc2023/readLine.js"
  (progn
    (def readLine (get :readLineByLine readLineModule))
    (def numbers ["one" "two" "three" "four" "five" "six" "seven" "eight" "nine"])

    (defn isNumber [str]
        (some numbers (lambda [item] (progn (= item str)))))

    (defn isNumberPrefix [str]
        (def sliced (map numbers
            (lambda [item] (progn
                (slice item 0 (length str))))))
        (some sliced (lambda [item] (progn (= item str)))))

    (defg arr [])

    (defn setNumber [obj item]
        (def num (cond (= (length item) 1) (parseInt item) (parseInt (+ (findIndex numbers (lambda [n] (progn (= n item)))) 1))))
        (cond (= (get :first obj) nil)
            (set :first obj num))
        (set :second obj num))

    (defn handleLine [line]
        (progn
            (def obj
                (reduce (split line "") (object :temp nil :first nil :second nil) (lambda [acc item] (progn
                    (cond (>= (parseInt item) 0)
                        (progn (setNumber acc item))
                        (progn
                            (cond (exists (get :temp acc))
                                (set :temp acc (str (get :temp acc) item))
                                (cond (isNumberPrefix item) (set :temp acc item)))
                            (progn
                                (cond (isNumber (get :temp acc))
                                    (progn
                                        (setNumber acc (get :temp acc))
                                        (set :temp acc nil)))
                                (cond
                                    (and
                                        (exists (get :temp acc))
                                        (= (isNumberPrefix (get :temp acc)) false))
                                    (set :temp acc nil)))))
                    acc))))
            (def num (parseInt (str "" (get :first obj) (get :second obj))))
            (defg arr (concat arr num))))
    (defn onComplete []
        (progn
            (def total (reduce arr 0 (lambda [acc item] (progn
                (+ acc item)))))
            (print "Total: " total)))
    (readLine "./input2.txt" handleLine onComplete)))
`);
