import {
  l,
  lf,
  defn,
  defg,
  def,
  add,
  v,
  f,
  map,
  lambda,
  split,
  str,
  mult,
  sub,
} from "../src/core.js";

// prettier-ignore
const ftest = l(
  lf(
    defn,
    "fntest",
    ["a", "b"],
      [
          lf(def, "c", 7),
          lf(add,
             lf(v, "a"),
             lf(v, "b"),
             lf(v, "c"))]));

l(lf(defg, "c", 5));

// prettier-ignore
console.log("TEST: ", l(lf(lf(f, "fntest"),
                           10,
                           10)));

// prettier-ignore
const res = l(
    lf(map,
       lf(split,
          lf(str, "1", ",", "2", ",", "3", ",", "4"),
          ","),
       lf(lambda,
          ["x"],
          [
              lf(def, "a",
                 lf(str,
                    "Number: ",
                    lf(v, "x"))),
              lf(v, "a")])));

console.log("Lambda: ", res);

console.log(l(lf(def, "test", 5), lf(v, "test")));
const test = l(
  lf(def, "myVar", 2),
  lf(mult, lf(add, 1, lf(v, "myVar")), lf(sub, 5, 3))
);

console.log(test);
