export const JSLispForm = Symbol("jslispForm");
export const JSLispFormResult = Symbol("jslispFormResult");
export const JSLispExport = Symbol("JSLispExport");
export const JSLispFn = Symbol("JSLispFn");
export const JSLispCond = Symbol("JSLispCond");
export const JSLispDef = Symbol("JSLispDef");
export const JSLispVar = Symbol("JSLispVar");
export const JSLispJS = Symbol("JSLispJS");
export const JSLispSymbol = Symbol("JSLispSymbol");
export const JSLispImport = Symbol("JSLispImport");

export const globalScope = newChildScope(null);

// Scoping
// p = parent, c = current
// call with null to create root scope
function newChildScope(curScope) {
  return { p: curScope, c: new Map() };
}

// Recursively search through all scopes from innermost up to root scope
function findInScope(curScope, key) {
  let scope = curScope;
  while (scope.p) {
    if (scope.c.has(key)) return scope.c.get(key);
    scope = scope.p;
  }
  return scope.c.get(key);
}

// Interpreter
export function interpret(scope, forms) {
  if (forms === null || forms === undefined || forms[0] !== JSLispForm)
    return forms;

  switch (forms[1]) {
    case JSLispVar:
      return findInScope(scope, forms[2]);
    case JSLispDef:
      return interpretDefine(scope, forms);
    case JSLispCond:
      return interpretCond(scope, forms);
    case JSLispFn:
      return interpretFn(scope, forms);
    case JSLispExport:
      return interpretExport(scope, forms);
    case JSLispJS:
      return interpretJS(scope, forms);
    case JSLispSymbol:
      return forms[2];
    case JSLispImport:
      return interpretImport(scope, forms);
    default:
      return interpretForm(scope, forms);
  }
}

function interpretDefine(scope, forms) {
  if (forms[4] && forms[4][0] === JSLispForm) {
    scope.c.set(forms[3][2], interpret(scope, forms[4]));
  } else {
    scope.c.set(forms[3][2], forms[4]);
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
  surroundingScope.c.set(forms[3][2], (_, ...argList) => {
    const scope = newChildScope(surroundingScope);
    for (let i = 0; i < forms[4].length; i++) {
      scope.c.set(forms[4][i][2], interpret(surroundingScope, argList[i]));
    }
    return interpret(scope, [JSLispForm, JSLispForm, ...forms.slice(3)]);
  });
}

function interpretExport(scope, forms) {
  if (findInScope(scope, forms[3][2]))
    return (...args) => findInScope(scope, forms[3][2])(scope, ...args);
  else return findInScope(scope, forms[3][2]);
}

function interpretForm(scope, forms) {
  if (!forms || forms[0] !== JSLispForm) {
    return forms;
  } else if (forms[1] === JSLispForm && forms[2][0] === JSLispForm) {
    for (let i = 2; i < forms.length; i++) {
      if (i !== forms.length - 1) interpret(scope, forms[i]);
    }
    return interpret(scope, forms[forms.length - 1]);
  } else {
    const fn = findInScope(scope, forms[2]);
    if (fn) {
      return fn(scope, ...forms.slice(3).map(interpret.bind(null, scope)));
    } else {
      console.error("ERROR! Function not found in scope");
      console.log(forms);
    }
  }
}

function interpretJS(scope, forms) {
  const funcPath = forms[3].split(".");
  const args = forms.slice(4).map((x) => interpret(scope, x));
  let func =
    globalScope.c.get("jsDeps") && globalScope.c.get("jsDeps")[funcPath[0]]
      ? globalScope.c.get("jsDeps")[funcPath[0]]
      : eval(funcPath[0]);

  for (let i = 1; i < funcPath.length; i++) {
    func = func[funcPath[i]];
  }
  if (!(func instanceof Function)) return func;
  return func(...args);
}

// imports
export function interpretImport(scope, forms) {
  for (let i = 3; i < forms.length - 1; i += 2) {
    const varName = forms[i][2];
    console.log("varname", varName);
    console.log("import path", forms[i + 1]);
    import(forms[i + 1]).then((val) => {
      console.log("IMPORT");
      console.log("Imported", val);
      scope.c.set(varName, val);
    });
  }
}

/// STDLIB

// arithmetic ops
export const add = (_, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum += args[i];
  }
  return sum;
};

export const sub = (_, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum -= args[i];
  }
  return sum;
};

export const mult = (_, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum *= args[i];
  }
  return sum;
};

export const div = (_, ...args) => {
  let sum = args[0];
  for (let i = 1; i < args.length; i++) {
    sum /= args[i];
  }
  return sum;
};
export const pow = (_, a, b) => Math.pow(a, b);
export const sqrt = (_, a) => Math.sqrt(a);

// string ops
export const str = (_, ...args) => args.reduce((acc, x) => acc + x);
export const split = (_, str, expr) => str.split(expr);

// array ops
export const map = (_, collection, lambda) =>
  collection.map((...args) => lambda(...args));

// variables
export const defg = (_, key, a) => globalScope.c.set(key, a);
export const g = (_, key) => globalScope.c.get(key);

// io
export const print = (_, ...args) => console.log(...args);

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
    const scope = newChildScope(surroundingScope);
    forms[4].forEach((x, i) =>
      scope.c.set(x[2], interpret(surroundingScope, argList[i])),
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

// Objects
export const get = (scope, ...forms) => {
  const key = forms[0].charAt(0) === ":" ? forms[0].slice(1) : forms[0];
  return interpret(scope, forms[1])[key];
};

globalScope.c.set("progn", progn);
globalScope.c.set("add", add);
globalScope.c.set("+", add);
globalScope.c.set("mult", mult);
globalScope.c.set("*", mult);
globalScope.c.set("sub", sub);
globalScope.c.set("-", sub);
globalScope.c.set("div", div);
globalScope.c.set("/", div);
globalScope.c.set("pow", pow);
globalScope.c.set("sqrt", sqrt);
globalScope.c.set("defg", defg);
globalScope.c.set("g", g);
globalScope.c.set("str", str);
globalScope.c.set("split", split);
globalScope.c.set("print", print);
globalScope.c.set("equals", equals);
globalScope.c.set("=", equals);
globalScope.c.set("<", lessThan);
globalScope.c.set("<=", lessThanEquals);
globalScope.c.set(">", greaterThan);
globalScope.c.set(">=", greaterThanEquals);
globalScope.c.set("get", get);
globalScope.c.set("lambda", lambda);
