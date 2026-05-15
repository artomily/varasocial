const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel =
  LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

const fmt = (level, msg, data) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase().padEnd(5)}] ${msg}`;
  return data !== undefined ? `${base} ${JSON.stringify(data)}` : base;
};

export const logger = {
  debug: (msg, data) =>
    currentLevel <= LEVELS.debug && console.debug(fmt("debug", msg, data)),
  info: (msg, data) =>
    currentLevel <= LEVELS.info && console.log(fmt("info", msg, data)),
  warn: (msg, data) =>
    currentLevel <= LEVELS.warn && console.warn(fmt("warn", msg, data)),
  error: (msg, data) =>
    currentLevel <= LEVELS.error && console.error(fmt("error", msg, data)),
};
