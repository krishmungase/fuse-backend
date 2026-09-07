import morgan from "morgan";

import env from "../config/env.config";
import logger from "../logger/winston.logger";

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => {
  return env.app.isProd;
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status - :response-time ms",
  { stream, skip },
);

export default morganMiddleware;
