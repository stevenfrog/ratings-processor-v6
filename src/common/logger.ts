/**
 * This module contains the winston logger configuration.
 */
import config from "config";
import util from "util";
import winston, { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: config.get("LOG_LEVEL"),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.splat(),
        format.simple(),
      ),
    }),
  ],
});

/**
 * Log error details with signature
 * @param err the error
 * @param signature The signature
 */
logger.error = (err: any, signature?: string): winston.Logger => {
  if (!err) {
    return logger;
  }

  let signatureMessage = "";
  if (signature) {
    signatureMessage = `Error happened in ${signature}`;
  }

  // Check if error is a string or an object
  if (typeof err === "string") {
    return logger.log("error", `${signatureMessage} ${err}`);
  } else if (err instanceof Error) {
    // If it's an Error object, inspect it
    return logger.log("error", `${signatureMessage}\n${util.inspect(err)}`);
  } else {
    // For other object types
    return logger.log("error", `${signatureMessage}\n${util.inspect(err)}`);
  }
};

export default logger;
