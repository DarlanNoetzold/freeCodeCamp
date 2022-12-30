/**
 * Alternate Server GraceFull Shutdown packages
 * https://github.com/sebhildebrandt/http-graceful-shutdown
 * https://github.com/godaddy/terminus
 * https://github.com/hunterloftis/stoppable
 */

function terminate(server, options = { coredump: false, timeout: 500 }) {
  // Exit function
  const exit = (code) => {
    options.coredump ? process.abort() : process.exit(code);
  };

  return (code, reason) => (err, promise) => {
    if (err && err instanceof Error) {
      // Log error information, use a proper logging library here :)
      console.error("SERVER ERROR: ", err.message, err.stack);
    }

    // Attempt a graceful shutdown
    server.close(exit);
    setTimeout(exit, options.timeout).unref();
  };
}

module.exports = terminate;
