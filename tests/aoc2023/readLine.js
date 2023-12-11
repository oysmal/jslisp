import fs from "fs";
import readline from "readline";
import events from "events";

export async function readLineByLine(file, handler, onComplete) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  });

  rl.on("line", handler);

  await events.once(rl, "close");
  console.log("Done");
  onComplete();
}

/* TEMPLATE

import { jslisp } from "../../../src/parse.js";

jslisp(`
(use readLineModule "../tests/aoc2023/readLine.js"
  (progn
    (def readLine (get :readLineByLine readLineModule))
    (defn handleLine [line]
        (progn))
    (defn onComplete []
        (progn))
    (readLine "./input.txt" handleLine onComplete)))
`);

 */
