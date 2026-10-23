const { waitUntil } = require('@vercel/functions');

// Run fire-and-forget work (e.g. EventLog writes) that may finish after the response is sent.
// On Vercel the function can be frozen once the response ends, so the work is registered
// with waitUntil to keep it alive. Elsewhere (local, tests, Railway) it simply runs.
// Errors are swallowed: logging must never fail a request.
function runInBackground(work) {
  const settled = Promise.resolve(work).catch(() => {});
  if (process.env.VERCEL) waitUntil(settled);
  return settled;
}

module.exports = { runInBackground };
