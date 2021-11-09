const Key = Symbol("key");
const JSLispForm = Symbol("jslispForm");

const globalScope = new Map();
const funcScope = new Map();

const applyForm = (scope, form) => {
  return typeof form === "object" && form.type === JSLispForm
    ? applyForm(scope, form.data[0])(
        scope,
        ...form.data.slice(1).map((x) => applyForm(scope, x))
      )
    : form;
};

const lf = (...data) => ({
  type: JSLispForm,
  data,
  scope: new Map(),
});

const applyForms = (scope, forms) => {
  for (let i = 0; i < forms.length; i++) {
    if (i === forms.length - 1) return applyForm(scope, forms[i]);
    else applyForm(scope, forms[i]);
  }
};

const l = (...forms) => applyForms(globalScope, forms);

// arithmetic ops
const add = (scope, ...args) => args.reduce((acc, x) => acc + x);
const sub = (scope, ...args) => args.reduce((acc, x) => acc - x);
const mult = (scope, ...args) => args.reduce((acc, x) => acc * x);
const div = (scope, ...args) => args.reduce((acc, x) => acc / x);
const pow = (scope, a, b) => Math.pow(a, b);
const sqrt = (scope, a) => Math.sqrt(a);

// string ops
const str = (scope, ...args) => args.reduce((acc, x) => acc + x);
const split = (scope, str, expr) => str.split(expr);

// array ops
const map = (scope, collection, lambda) =>
  collection.map((...args) => lambda(...args));

// variables
const def = (scope, key, a) => scope.set(key, a);
const defg = (_, key, a) => globalScope.set(key, a);
const v = (scope, key) => scope.get(key);
const g = (_, key) => globalScope.get(key);

// io
const print = (scope, ...args) => console.log(args);

// functions
const defn = (_, key, args, forms) =>
  funcScope.set(key, (_, ...argList) => {
    const scope = new Map();
    args.forEach((x, i) => scope.set(x, argList[i]));
    return applyForms(scope, forms);
  });

const lambda = (scope, args, forms) => {
  return (...argList) => {
    args.forEach((x, i) => scope.set(x, argList[i]));
    return applyForms(scope, forms);
  };
};
const f = (_, key) => funcScope.get(key);

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
