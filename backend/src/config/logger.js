import pino from "pino";
import { env, isProd } from "./env.js";

export const logger = pino({
    level: env.logLevel,
    transport: isProd
        ? undefined
        : {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
              },
          },
});
