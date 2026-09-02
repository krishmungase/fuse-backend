/**
 * Process entrypoint: instantiates the Express App and starts the HTTP server.
 */
import App from "./app";

const serverApp = new App();
serverApp.start();

export default serverApp.getApp();
