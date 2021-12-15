import { debugLog, infoLog } from "./Logger.js";
export const JSLispForm = Symbol("jslispForm");
export const JSLispFormResult = Symbol("jslispFormResult");
export const JSLispExport = Symbol("JSLispExport");

export const globalScope = new Map();
export const funcScope = new Map();

export function applyForm(scope, form) {
  debugLog("_____________");
  if (typeof form === "object" && form?.type === JSLispFormResult) {
    debugLog("Returning plain value", form.value);
    return form.value;
  } else if (typeof form === "object" && form?.type === JSLispForm) {
    debugLog("FORM: ", form);
    const appliedForm = applyForm(scope, form.data[0]);
    const fn = appliedForm.value ?? appliedForm;

    if (typeof fn !== "function") {
      debugLog("not a fn, returning: ", fn.data);
      return fn;
    } else if (
      typeof appliedForm === "object" &&
      appliedForm?.type === JSLispExport
    ) {
      infoLog("Returning an export", appliedForm.value);
      return appliedForm.value;
    } else if (fn === cond) {
      infoLog("Calling cond with args", form.data.slice(1));
      return cond(scope, ...form.data.slice(1));
    }

    infoLog("this is a function: ", form.data[0]);
    const args = form.data.slice(1).map((x) => {
      const appliedItem = applyForm(scope, x);
      return appliedItem.type === JSLispFormResult
        ? appliedItem.value
        : appliedItem;
    });

    infoLog("ARGS: ", args);
    const value = fn(scope, ...args);

    return {
      value,
      type: JSLispFormResult,
    };
  } else {
    debugLog("Else returning: ", form);
    return form;
  }
}

export const lf = (...data) => ({
  type: JSLispForm,
  data,
  scope: new Map(),
});

// Could this just check the first element? Reduce O by n
function isArrayOfForms(forms) {
  return (
    Array.isArray(forms) && forms.length > 0 && forms[0].type === JSLispForm
  ); // forms.every((x) => x.type === JSLispForm);
}

export function applyForms(scope, forms) {
  if (typeof forms !== "object" || !isArrayOfForms(forms)) return forms;
  debugLog("applyForms", forms);

  for (let i = 0; i < forms.length; i++) {
    let formResult = null;

    if (isArrayOfForms(forms[i]) && forms[i].length > 0) {
      formResult = applyForms(scope, forms[i]);
    } else if (forms[i].type === JSLispForm) {
      const formData = forms[i].data.map((item) => {
        const appliedItem = applyForms(scope, item);
        return appliedItem.type === JSLispFormResult
          ? appliedItem.value
          : appliedItem;
      });
      formResult = applyForm(scope, { ...forms[i], data: formData });
    } else {
      debugLog("ELSE formResult: ", forms[i]);
      formResult = forms[i];
    }

    if (i === forms.length - 1) {
      infoLog("returning form result: ", formResult);
      return formResult;
    }
  }
  infoLog("Returning null");
  return null;
}

export const l = (...forms) => applyForms(globalScope, forms);

// arithmetic ops

export const add = (scope, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum += args[i];
  }
  return sum;
};
export const sub = (scope, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum -= args[i];
  }
  return sum;
};
export const mult = (scope, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum *= args[i];
  }
  return sum;
};
export const div = (scope, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum /= args[i];
  }
  return sum;
};
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

// export
export const exportf = (scope, key) => ({
  type: JSLispExport,
  value: (...args) => {
    const val = funcScope.get(key)(scope, ...args); // unwrap from formResult when exporting
    if (val.type === JSLispFormResult || val.type === JSLispExport) {
      return val.value;
    } else return val;
  },
});

export const exportv = (scope, key) => ({
  type: JSLispExport,
  value: scope.get(key),
});

// io
export const print = (scope, ...args) => console.log(...args);

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

export function cond(scope, ...forms) {
  const test = applyForm(scope, forms[0]);

  if (forms.length !== 3)
    throw new SyntaxError(
      "Wrong number of arguments to function <cond>. It requires 3 arguments. You provided: " +
        forms.length
    );

  const testValue = test.type === JSLispFormResult ? test.value : test;
  if (testValue) {
    const res = applyForm(scope, forms[1]);
    if (res.type === JSLispFormResult || res.type === JSLispExport) {
      return res.value;
    } else return res;
  } else {
    const res = applyForm(scope, forms[2]);
    if (res.type === JSLispFormResult || res.type === JSLispExport) {
      return res.value;
    } else return res;
  }
}

export const equals = (scope, ...forms) => {
  const [a, b] = forms;
  const appliedA = applyForms(scope, a);
  const appliedAValue =
    appliedA.type === JSLispFormResult ? appliedA.value : appliedA;
  const appliedB = applyForms(scope, b);
  const appliedBValue =
    appliedB.type === JSLispFormResult ? appliedB.value : appliedB;

  return appliedAValue === appliedBValue;
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
funcScope.set("defn", defn);
funcScope.set("defg", defg);
funcScope.set("exportf", exportf);
funcScope.set("exportv", exportv);
funcScope.set("v", v);
funcScope.set("g", g);
funcScope.set("str", str);
funcScope.set("split", split);
funcScope.set("print", print);
funcScope.set("cond", cond);
funcScope.set("equals", equals);
funcScope.set("=", equals);

export const f = (_, key) => funcScope.get(key);
