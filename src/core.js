export const JSLispForm = Symbol("jslispForm");
export const JSLispFormResult = Symbol("jslispFormResult");

export const globalScope = new Map();
export const funcScope = new Map();

export function applyForm(scope, form) {
  if (typeof form === "object" && form?.type === JSLispFormResult) {
    return form.value;
  } else if (typeof form === "object" && form?.type === JSLispForm) {
    const appliedForm = applyForm(scope, form.data[0]);
    const fn = appliedForm.value ?? appliedForm;

    if (typeof fn !== "function") return fn;

    const args = form.data.slice(1).map((x) => {
      const appliedItem = applyForm(scope, x);
      return appliedItem.type === JSLispFormResult
        ? appliedItem.value
        : appliedItem;
    });

    const value = fn(scope, ...args);

    return {
      value,
      type: JSLispFormResult,
    };
  } else {
    return form;
  }
}

export const lf = (...data) => ({
  type: JSLispForm,
  data,
  scope: new Map(),
});

export function applyForms(scope, forms) {
  if (!Array.isArray(forms)) return forms;

  for (let i = 0; i < forms.length; i++) {
    let formResult = null;

    if (Array.isArray(forms[i]) && forms[i].length > 0) {
      formResult = applyForms(scope, forms[i]);
    } else {
      const formData = forms[i].data.map((item) => {
        const appliedItem = applyForms(scope, item);
        return appliedItem.type === JSLispFormResult
          ? appliedItem.value
          : appliedItem;
      });
      formResult = applyForm(scope, { ...forms[i], data: formData });
    }

    if (i === forms.length - 1) {
      return formResult;
    }
  }
  return null;
}

export const l = (...forms) => applyForms(globalScope, forms);

// arithmetic ops
export const add = (scope, ...args) => args.reduce((acc, x) => acc + x, 0);
export const sub = (scope, ...args) =>
  args.slice(1).reduce((acc, x) => acc - x, args[0]);
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

export function lif(scope, ...forms) {
  const result = applyForm(scope, forms);
  if (result.length !== 3)
    throw new SyntaxError(
      "Wrong number of arguments to function <lif>. It requires 3 arguments. You provided: " +
        forms.length
    );
  const equalityExpr = result[0];

  if (
    equalityExpr.type === JSLispFormResult ? equalityExpr.value : equalityExpr
  ) {
    return result[1];
  } else {
    return result[2];
  }
}

export const equals = (scope, ...forms) => {
  return forms
    .map((item) => {
      const appliedItem = applyForms(scope, item);
      const val =
        appliedItem.type === JSLispFormResult ? appliedItem.value : appliedItem;
      return val;
    })
    .reduce((acc, item) => acc && item, true);
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
funcScope.set("defg", defg);
funcScope.set("v", v);
funcScope.set("g", g);
funcScope.set("str", str);
funcScope.set("split", split);
funcScope.set("print", print);
funcScope.set("cond", lif);
funcScope.set("equals", equals);
funcScope.set("=", equals);

export const f = (_, key) => funcScope.get(key);
