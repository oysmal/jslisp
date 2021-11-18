const Node = Symbol("Node");

export function parse(source) {
  const stack = [];

  const sourceCode = source.replace(/\n/g, " ").replace(/\s+/g, " ");
  let i = 0;
  let current = null;
  while (i < sourceCode.length) {
    let nextSpaceIndex = sourceCode.indexOf(" ", i);
    if (nextSpaceIndex === -1) nextSpaceIndex = sourceCode.length;

    const word = sourceCode.slice(i, nextSpaceIndex);

    if (word.charAt(0) === "(") {
      stack.push(current);
      current = {
        type: Node,
        func: word.slice(1),
        args: [],
      };

      if (word.charAt(word.length - 1) === ")") {
        const prevStackItem = stack.pop();
        prevStackItem.args.push(current);
        current = prevStackItem;
      }
      i = nextSpaceIndex + 1; // increment i
      continue;
    }

    if (word.charAt(word.length - 1) === ")") {
      current.args.push(word.slice(0, word.length - 1));
      const prevStackItem = stack.pop();
      prevStackItem.args.push(current);
      current = prevStackItem;
      i = nextSpaceIndex + 1; // increment i
      continue;
    }

    if (word.charAt(0) === '"') {
      let closingQuoteIndex = sourceCode.indexOf('"', i);
      while (sourceCode[closingQuoteIndex - 1] === "\\") {
        const index = sourceCode.indexOf('"', i);
        if (index !== -1) closingQuoteIndex = index;
      }
      current.args.push(sourceCode.slice(i, closingQuoteIndex));
      i = closingQuoteIndex + 1; // increment i
      continue;
    }

    if (word.match(/[0-9\-\+\.]+/)) {
      current.args.push(parseFloat(word));
      i = nextSpaceIndex + 1; // increment i
      continue;
    }

    current.args.push(word);
    i = nextSpaceIndex + 1; // increment i
  }

  console.log(current);
}

console.log(
  parse(`(add
           1
           2
           (mult
             4 5))`)
);
