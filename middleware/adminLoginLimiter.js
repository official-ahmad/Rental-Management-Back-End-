const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 3;
const attempts = new Map();

const getKey = (req) => req.ip || req.socket.remoteAddress || "unknown";

const getStatus = (req) => {
  const key = getKey(req);
  const entry = attempts.get(key);
  if (!entry || entry.lockedUntil <= Date.now()) {
    if (entry) attempts.delete(key);
    return { locked: false, failures: 0 };
  }

  return {
    locked: entry.failures >= MAX_FAILURES,
    failures: entry.failures,
    retryAfterSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1000),
  };
};

const recordFailure = (req) => {
  const key = getKey(req);
  const current = attempts.get(key);
  const now = Date.now();
  const entry =
    current && current.lockedUntil > now
      ? current
      : { failures: 0, lockedUntil: now + WINDOW_MS };

  entry.failures += 1;
  entry.lockedUntil = now + WINDOW_MS;
  attempts.set(key, entry);
  return getStatus(req);
};

const clearFailures = (req) => {
  attempts.delete(getKey(req));
};

module.exports = {
  MAX_FAILURES,
  getStatus,
  recordFailure,
  clearFailures,
};
