export const JSLispForm = Symbol("jslispForm");

export const globalScope = new Map();
export const funcScope = new Map();

export const applyForm = (scope, form) => {
  return typeof form === "object" && form.type === JSLispForm
    ? applyForm(scope, form.data[0])(
        scope,
        ...form.data.slice(1).map((x) => applyForm(scope, x))
      )
    : form;
};

export const lf = (...data) => ({
  type: JSLispForm,
  data,
  scope: new Map(),
});

export const applyForms = (scope, forms) => {
  for (let i = 0; i < forms.length; i++) {
    if (i === forms.length - 1) return applyForm(scope, forms[i]);
    else applyForm(scope, forms[i]);
  }
};

export const l = (...forms) => applyForms(globalScope, forms);

// arithmetic ops
export const add = (scope, ...args) => args.reduce((acc, x) => acc + x, 0);
export const sub = (scope, ...args) => args.reduce((acc, x) => acc - x, 0);
export const mult = (scope, ...args) => args.reduce((acc, x) => acc * x, 1);
export const div = (scope, ...args) =>
  args.slice(1).reduce((acc, x) => acc / x, args[0]);
export const pow = (scope, a, b) => Math.pow(a, b);
export const sqrt = (scope, a) => Math.sqrt(a);

// string ops
export const str = (scope, ...args) => args.reduce((acc, x) => acc + x);
export const split = (scope, str, expr) => str.split(expr);

// array ops
export const map = (scope, collection, lambda) =>
  collection.map((...args) => lambda(...args));

// variables
export const def = (scope, key, a) => scope.set(key, a);
export const defg = (_, key, a) => globalScope.set(key, a);
export const v = (scope, key) => scope.get(key);
export const g = (_, key) => globalScope.get(key);

// io
export const print = (scope, ...args) => console.log(args);

// functions
export const defn = (_, key, args, forms) =>
  funcScope.set(key, (_, ...argList) => {
    const scope = new Map();
    args.forEach((x, i) => scope.set(x, argList[i]));
    return applyForms(scope, forms);
  });

export const lambda = (scope, args, forms) => {
  return (...argList) => {
    args.forEach((x, i) => scope.set(x, argList[i]));
    return applyForms(scope, forms);
  };
};

funcScope.set("add", add);
funcScope.set("+", add);
funcScope.set("mult", mult);
funcScope.set("*", mult);
funcScope.set("sub", sub);
funcScope.set("-", sub);
funcScope.set("div", div);
funcScope.set("/", div);
funcScope.set("pow", pow);
funcScope.set("sqrt", sqrt);
funcScope.set("def", def);
funcScope.set("str", str);
funcScope.set("split", split);
funcScope.set("print", print);

export const f = (_, key) => funcScope.get(key);
