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
