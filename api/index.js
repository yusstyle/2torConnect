let app;
let appLoadError;

function loadApp() {
  if (app || appLoadError) {
    return;
  }

  try {
    const mod = require("./app.cjs");
    app = mod.default ?? mod;
  } catch (err) {
    appLoadError = err instanceof Error ? err : new Error(String(err));
    console.error("Failed to load API app bundle:", appLoadError);
  }
}

module.exports = function handler(req, res) {
  loadApp();

  if (appLoadError) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(`Backend failed to start: ${appLoadError.message}`);
    return;
  }

  try {
    return app(req, res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
};
