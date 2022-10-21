import * as util from 'util';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { Arguments } from '../util';
import { getFormatter } from './formatters';
import { LogLevel, resolveLevelName } from "./levels";
import { tracing as _tracing } from './trace';
import { getConsoleTransport, getFileTransport, isConsoleTransport } from './transports';

export type LoggerConfig = {
    level?: LogLevel;
    file?: {
        logfile: string;
    };
    console?: {
        label?: string;
    };
};

export interface ILogger {
    transports: unknown[];
    levels: winston.config.AbstractConfigSetLevels;
    log(level: string, message: string): void;
}

// Create a logger just the way we like it.
export function createLogger(config?: LoggerConfig) {
    const logger = winston.createLogger({
        // We would also set "levels" here.
        exitOnError: false // Do not exit extension host if there is an exception.
    });
    if (config) {
        configureLogger(logger, config);
    }
    return logger;
}

interface IConfigurableLogger {
    level: string;
    add(transport: Transport): void;
}

// Set up a logger just the way we like it.
export function configureLogger(logger: IConfigurableLogger, config: LoggerConfig) {
    if (config.level) {
        const levelName = resolveLevelName(config.level);
        if (levelName) {
            logger.level = levelName;
        }
    }

    if (config.file) {
        const formatter = getFormatter();
        const transport = getFileTransport(config.file.logfile, formatter);
        logger.add(transport);
    }
    if (config.console) {
        const formatter = getFormatter({ label: config.console.label });
        const transport = getConsoleTransport(formatter);
        logger.add(transport);
    }
}

// Emit a log message derived from the args to all enabled transports.
export function logToAll(loggers: ILogger[], logLevel: LogLevel, args: Arguments) {
    const message = args.length === 0 ? '' : util.format(args[0], ...args.slice(1));
    for (const logger of loggers) {
        if (logger.transports.length > 0) {
            const levelName = getLevelName(logLevel, logger.levels, isConsoleLogger(logger));
            logger.log(levelName, message);
        }
    }
}
function isConsoleLogger(logger: ILogger): boolean {
    for (const transport of logger.transports) {
        if (isConsoleTransport(transport)) {
            return true;
        }
    }
    return false;
}

function getLevelName(level: LogLevel, levels: winston.config.AbstractConfigSetLevels, isConsole?: boolean): string {
    const levelName = resolveLevelName(level, levels);
    if (levelName) {
        return levelName;
    } else if (isConsole) {
        // XXX Hard-coding this is fragile:
        return 'silly';
    } else {
        return resolveLevelName(LogLevel.Info, levels) || 'info';
    }
}