import * as logform from "logform";

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
require('winston-daily-rotate-file');

const logFormatter = printf((info: logform.TransformableInfo & { timestamp: string }) => {
    return `[${info.timestamp}]${info.message}`;
});

export const getLogger = (name: string) => {
    const logger = createLogger({
        format: combine(
            label({ label: name }),
            timestamp(),
            logFormatter
        ),
        transports: [
            new transports.Console(),
            new (transports.DailyRotateFile)({
                filename: `${name}-err-%DATE%.log`,
                dirname: 'logs',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                level: 'error',
                maxSize: '20m',
                maxFiles: '180d'
            }),
            new (transports.DailyRotateFile)({
                filename: `${name}-%DATE%.log`,
                dirname: 'logs',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '180d'
            })
        ]
    })

    console.log = function () {
        logger.info.apply(null, arguments);
    }
    
    console.error = function () {
        logger.error.apply(null, arguments);
    }

    return logger
}

//  console.log = function (message?: any, ...optionalParams: any[]) {
//      logger.info.call(null, message, ...optionalParams);
//  };
//  console.log = function (...data: any[]) {
//    logger.info.call(null, ...data);
//  };

