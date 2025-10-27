// Runtime config for the React app. Modify or replace this file in the deployed
// `public` folder to change API endpoints without rebuilding.

(function (global) {
  try {
    global.ENV = global.ENV || {};
    // Default value; replace in your deployment as needed
    global.ENV.REACT_APP_API_URL = global.ENV.REACT_APP_API_URL || 'http://localhost:8000';
  } catch (e) {
    // ignore
  }
})(window);
