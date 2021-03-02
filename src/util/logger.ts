import * as winston from "winston";
import * as os from "os";
import { debug } from "winston";

export class logger {
  static logger: winston.Logger;

  static getLogger(): winston.Logger {
    if (!this.logger) {
      this.logger = winston.createLogger({
        transports: [
          new winston.transports.Console({
            level: "debug",
            eol: os.EOL,
            format: winston.format.json(),
          }),
        ],
      });
      this.logger.info("Winston logger setup");
    }
    return this.logger;
  }
}
