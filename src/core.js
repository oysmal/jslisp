import { debugLog, infoLog } from "./Logger.js";

export const JSLispForm = Symbol("jslispForm");
export const JSLispFormResult = Symbol("jslispFormResult");
export const JSLispExport = Symbol("JSLispExport");
export const JSLispFn = Symbol("JSLispFn");
export const JSLispCond = Symbol("JSLispCond");
export const JSLispDef = Symbol("JSLispDef");
export const JSLispVar = Symbol("JSLispVar");

export const globalScope = new Map();
export const funcScope = new Map();

export function interpret(scope, forms) {
  if (forms === null || forms === undefined || forms[0] !== JSLispForm)
    return forms;

  switch (forms[1]) {
    case JSLispVar:
      return scope.get(forms[2]);
    case JSLispDef:
      return interpretDefine(scope, forms);
    case JSLispCond:
      return interpretCond(scope, forms);
    case JSLispFn:
      return interpretFn(scope, forms);
    case JSLispExport:
      return interpretExport(scope, forms);
    default:
      return interpretForm(scope, forms);
  }
}

function interpretDefine(scope, forms) {
  if (forms[4] && forms[4][0] === JSLispForm) {
    scope.set(forms[3][2], interpret(scope, forms[3]));
  } else {
    scope.set(forms[3][2], forms[4]);
  }
  return null;
}

function interpretCond(scope, forms) {
  const test = interpret(scope, forms[3]);

  if (test) {
    return interpret(scope, forms[4]);
  } else {
    return interpret(scope, forms[5]);
  }
}

function interpretFn(surroundingScope, forms) {
  funcScope.set(forms[3][2], (_, ...argList) => {
    const scope = new Map();
    for (let i = 0; i < forms[4].length; i++) {
      scope.set(forms[4][i][2], interpret(surroundingScope, argList[i]));
    }
    return interpret(scope, [JSLispForm, JSLispForm, ...forms.slice(3)]);
  });
}

function interpretExport(scope, forms) {
  if (funcScope.has(forms[3][2]))
    return (...args) => funcScope.get(forms[3][2])(scope, ...args);
  else return scope.get(forms[3][2]);
}

function interpretForm(scope, forms) {
  if (!forms || !Array.isArray(forms) || forms[0] !== JSLispForm) {
    return forms;
  } else if (
    forms[1] === JSLispForm &&
    forms[2] &&
    forms[2][0] === JSLispForm
  ) {
    for (let i = 2; i < forms.length; i++) {
      if (i !== forms.length - 1) interpret(scope, forms[i]);
    }
    return interpret(scope, forms[forms.length - 1]);
  } else {
    return funcScope.get(forms[2])(
      scope,
      ...forms.slice(3).map(interpret.bind(null, scope))
    );
  }
}

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
export const defg = (_, key, a) => globalScope.set(key, a);
export const g = (_, key) => globalScope.get(key);

// io
export const print = (scope, ...args) => console.log(...args);

// comparators
export const equals = (scope, ...forms) => {
  return interpret(scope, forms[0]) === interpret(scope, forms[1]);
};
export const lessThan = (scope, ...forms) => {
  return interpret(scope, forms[0]) < interpret(scope, forms[1]);
};
export const lessThanEquals = (scope, ...forms) => {
  return interpret(scope, forms[0]) <= interpret(scope, forms[1]);
};
export const greaterThan = (scope, ...forms) => {
  return interpret(scope, forms[0]) > interpret(scope, forms[1]);
};
export const greaterThanEquals = (scope, ...forms) => {
  return interpret(scope, forms[0]) >= interpret(scope, forms[1]);
};

// code, execution
export const lambda = (surroundingScope, forms) => {
  return (...argList) => {
    const scope = new Map();
    forms[4].forEach((x, i) =>
      scope.set(x[2], interpret(surroundingScope, argList[i]))
    );
    return interpret(scope, [JSLispForm, JSLispForm, ...forms.slice(3)]);
  };
};
export const progn = (scope, ...forms) => {
  for (let i = 0; i < forms.length - 1; i++) {
    interpret(scope, forms[i]);
  }
  return interpret(scope, forms[forms.length - 1]);
};

funcScope.set("progn", progn);
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
funcScope.set("defg", defg);
funcScope.set("g", g);
funcScope.set("str", str);
funcScope.set("split", split);
funcScope.set("print", print);
funcScope.set("equals", equals);
funcScope.set("=", equals);
funcScope.set("<", lessThan);
funcScope.set("<=", lessThanEquals);
funcScope.set(">", greaterThan);
funcScope.set(">=", greaterThanEquals);

export const f = (_, key) => funcScope.get(key);
