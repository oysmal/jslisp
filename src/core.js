import process from "process";
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

const STDLIB = new Set();

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
  if (forms === null || forms === undefined || forms[0] !== JSLispForm) {
    return forms;
  }

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
      if (fn.lazyEval) return fn(scope, ...forms);
      const args = forms.slice(3).map((form) => interpret(scope, form));
      if (STDLIB.has(fn)) {
        return fn(scope, ...args);
      } else {
        const scopeExtractedArgs = args.map((arg) =>
          arg instanceof Function ? (...args) => arg(scope, ...args) : arg
        );
        console.log("fn ", fn, " args ", scopeExtractedArgs);
        return fn(scope, ...scopeExtractedArgs);
      }
    } else {
      console.error("ERROR! Function not found in scope", forms[2]);
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
  const body = forms.slice(forms.length - 1)[0];
  const items = forms.slice(3, forms.length - 1);
  const pairedItems = items.reduce((acc, cur, i) => {
    if (i % 2 !== 0) {
      acc.push([items[i - 1], cur]);
    }
    return acc;
  }, []);
  Promise.all(
    pairedItems.map(async ([varNameForm, importForm]) => {
      const varName = varNameForm[2];
      console.log("Importing from", process.cwd());
      const val = await import(importForm);
      scope.c.set(varName, val);
    })
  ).then(() => {
    interpret(scope, body);
  });
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
export const slice = (_, str, start, end) => str.slice(start, end);
export const join = (_, arr, str) => {
  console.log("ARR", arr);
  return arr.join(str);
};

// array ops
export const concat = (scope, list, ...items) => {
  const listcpy = interpret(scope, list);
  const itemscpy = items.map((i) => interpret(scope, i));
  return [...listcpy, ...itemscpy];
};
export const head = (_, list) => list[0];
export const tail = (_, list) => list.slice(1);
export const sort = (_, list, fn) => list.slice().sort(fn);
export const reverse = (_, list, fn) => list.slice().reverse(fn);

export const map = (_, collection, lambda) =>
  collection.map((...args) => lambda(_, ...args));

export const reduce = (_, collection, initialValue, lambda) => {
  return collection.reduce((...args) => lambda(_, ...args), initialValue);
};

export const some = (_, collection, lambda) =>
  collection.some((...args) => lambda(_, ...args));

export const every = (_, collection, lambda) =>
  collection.some((...args) => lambda(_, ...args));

export const findIndex = (_, collection, lambda) =>
  collection.findIndex((...args) => lambda(_, ...args));

export const length = (_, arg) => arg.length;

// variables
export const defg = (scope, ...forms) => {
  const key = forms[3][2];
  const value = interpret(scope, forms[4]);
  return globalScope.c.set(key, value);
};
defg.lazyEval = true;

export const g = (_, ...forms) => {
  const key = forms[3][2];
  return globalScope.c.get(key);
};
g.lazyEval = true;

// io
export const print = (_, ...args) => console.log(...args);

// comparators
export const equals = (scope, ...forms) => {
  return interpret(scope, forms[0]) === interpret(scope, forms[1]);
};

export const not = (scope, ...forms) => {
  return !interpret(scope, forms[0]);
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

// processing
export const parseInteger = (_, arg) => parseInt(arg);
export const parseFloatingPoint = (_, arg) => parseFloat(arg);
export const regexMatch = (_, regex, arg) => arg.match(regex);

// dates
export const date = (_, ...args) => new Date(...args);
export const getTime = (_, arg) => arg.getTime();
export const getYear = (_, arg) => arg.getYear();
export const getMonth = (_, arg) => arg.getMonth();
export const getDate = (_, arg) => arg.getDate();

// conditionals

export const cond = (scope, ...forms) => {
  const test = forms[3];
  const caseTrue = forms[4];
  const caseFalse = forms[5];

  const value = interpret(scope, test);
  if (value) {
    return interpret(scope, caseTrue);
  } else {
    return interpret(scope, caseFalse);
  }
};
cond.lazyEval = true;

export const and = (scope, ...forms) => {
  const left = interpret(scope, forms[3]);
  console.log("LEFT", left);
  if (left) {
    console.log("RIGHT", forms[4]);
    const right = interpret(scope, forms[4]);
    console.log("RIGHT", right);
    return right;
  }
  return false;
};
and.lazyEval = true;

export const or = (scope, ...forms) => {
  const left = interpret(scope, forms[3]);
  const right = interpret(scope, forms[4]);
  return left || right;
};
or.lazyEval = true;

export const exists = (scope, ...forms) => {
  const value = interpret(scope, forms[3]);
  console.log("VALUE", value);
  return value !== undefined && value !== null;
};
exists.lazyEval = true;

// code, execution
export const lambda = (surroundingScope, ...forms) => {
  return (_, ...argList) => {
    const scope = newChildScope(surroundingScope);
    forms[3].forEach((x, i) => {
      const arg = interpret(surroundingScope, argList[i]);
      scope.c.set(x[2], arg);
    });
    return interpret(scope, forms[4]);
  };
};
lambda.lazyEval = true;

export const progn = (scope, ...forms) => {
  for (let i = 0; i < forms.length - 1; i++) {
    interpret(scope, forms[i]);
  }
  return interpret(scope, forms[forms.length - 1]);
};

// Objects
export const get = (scope, ...forms) => {
  const key = forms[0].charAt(0) === ":" ? forms[0].slice(1) : forms[0];
  const obj = interpret(scope, forms[1]);
  let val = obj[key];
  if (val instanceof Function) {
    val = (_, ...args) => obj[key](...args);
  }
  return val;
};

export const set = (scope, ...forms) => {
  const key = forms[0].charAt(0) === ":" ? forms[0].slice(1) : forms[0];
  const obj = interpret(scope, forms[1]);
  const val = interpret(scope, forms[2]);
  obj[key] = val;
  return val;
};

export const createObject = (scope, ...forms) => {
  const obj = {};
  for (let i = 0; i < forms.length; i += 2) {
    const key =
      typeof forms[i] === "string" && forms[i].charAt(0) === ":"
        ? forms[i].slice(1)
        : interpret(scope, forms[i]);
    const val = interpret(scope, forms[i + 1]);
    obj[key] = val;
  }
  return obj;
};

[
  progn,
  cond,
  add,
  mult,
  sub,
  div,
  pow,
  sqrt,
  defg,
  g,
  str,
  split,
  join,
  slice,
  print,
  equals,
  and,
  or,
  exists,
  lessThan,
  lessThanEquals,
  greaterThan,
  greaterThanEquals,
  get,
  set,
  createObject,
  lambda,
  map,
  reduce,
  some,
  every,
  findIndex,
  length,
  parseInteger,
  parseFloatingPoint,
  regexMatch,
  date,
  getTime,
  getYear,
  getMonth,
  getDate,
  concat,
  head,
  tail,
  sort,
  reverse,
].forEach((item) => STDLIB.add(item));

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
globalScope.c.set("join", join);
globalScope.c.set("slice", slice);
globalScope.c.set("print", print);
globalScope.c.set("equals", equals);
globalScope.c.set("not", not);
globalScope.c.set("=", equals);
globalScope.c.set("<", lessThan);
globalScope.c.set("<=", lessThanEquals);
globalScope.c.set(">", greaterThan);
globalScope.c.set(">=", greaterThanEquals);
globalScope.c.set("and", and);
globalScope.c.set("or", or);
globalScope.c.set("exists", exists);
globalScope.c.set("cond", cond);
globalScope.c.set("get", get);
globalScope.c.set("set", set);
globalScope.c.set("object", createObject);
globalScope.c.set("map", map);
globalScope.c.set("some", some);
globalScope.c.set("every", every);
globalScope.c.set("findIndex", findIndex);
globalScope.c.set("reduce", reduce);
globalScope.c.set("lambda", lambda);
globalScope.c.set("length", length);
globalScope.c.set("parseInt", parseInteger);
globalScope.c.set("parseFloat", parseFloatingPoint);
globalScope.c.set("regexMatch", regexMatch);
globalScope.c.set("date", date);
globalScope.c.set("getTime", getTime);
globalScope.c.set("getYear", getYear);
globalScope.c.set("getMonth", getMonth);
globalScope.c.set("getDate", getDate);
globalScope.c.set("concat", concat);
globalScope.c.set("head", head);
globalScope.c.set("tail", tail);
globalScope.c.set("sort", sort);
globalScope.c.set("reverse", reverse);
