const LogLevel = {
  NONE: 0,
  ERROR: 1,
  INFO: 2,
  DEBUG: 3,
};

let logLevel = LogLevel.NONE;
if (process?.env?.LOG_LEVEL) {
  logLevel = parseInt(process.env.LOG_LEVEL);
}

export function debugLog(msg, ...args) {
  if (logLevel >= LogLevel.DEBUG) {
    console.log(msg, ...args);
  }
}

export function infoLog(msg, ...args) {
  if (logLevel >= LogLevel.INFO) {
    console.log(msg, ...args);
  }
}

export function errorLog(msg, ...args) {
  if (logLevel >= LogLevel.ERROR) {
    console.error(msg, ...args);
  }
}
