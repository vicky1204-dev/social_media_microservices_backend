import winston, {format} from "winston"

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: format.combine(
        format.timestamp(),
        format.errors({stack: true}),
        format.splat(), //enables support for message templating
        format.json() //formatting all logs in json for structural logging
),
    defaultMeta: {service: "identity-service"},
    transports: [                          // transport defines the destination for our logs
        new winston.transports.Console({                // this ensures logs appear on our console
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }),
        new winston.transports.File({filename:  "error.log", level: "error"}),
        new winston.transports.File({filename:  "combined.log"}),
    ]
})