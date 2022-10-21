import * as winston from 'winston';
import { isCI } from '../constants';
import { IOutputChannel } from '../types';
import { Arguments } from '../util';
import { CallInfo } from '../utils/decorators';
import { getFormatter } from './formatters';
import { LogLevel, resolveLevelName } from "./levels";
import { createLogger, logToAll } from "./logger";
import { createTracingDecorator, LogInfo, TraceOptions, tracing as _tracing } from "./trace";
import { getProjectQOutputChannelTransport } from './transports';
const globalLogger = createLogger();

// Set the logging level the extension logs at.
export function setLoggingLevel(level: LogLevel | 'off') {
    if (level === 'off') {
        // For now we disable all logging. One alternative would be
        // to only disable logging to the output channel (by removing
        // the transport from the logger).
        globalLogger.clear();
    } else {
        const levelName = resolveLevelName(level, winston.config.npm.levels);
        if (levelName) {
            globalLogger.level = levelName;
        }
    }
}
// Register the output channel transport the logger will log into.
export function addOutputChannelLogging(channel: IOutputChannel) {
    const formatter = getFormatter();
    const transport = getProjectQOutputChannelTransport(channel, formatter);
    globalLogger.add(transport);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logError(...args: any[]) {
    log(LogLevel.Error, ...args);
}

// Emit a log message derived from the args to all enabled transports.
export function log(logLevel: LogLevel, ...args: Arguments) {
    logToAll([globalLogger], logLevel, args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logErrorIf(condition: boolean, ...args: any[]) {
    if (condition) {
        log(LogLevel.Error, ...args);
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logWarning(...args: any[]) {
    log(LogLevel.Warn, ...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logInfo(...args: any[]) {
    log(LogLevel.Info, ...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logInfoOnCI(...args: any[]) {
    if (isCI) {
        log(LogLevel.Info, ...args);
    }
}

// This is like a "context manager" that logs tracing info.
export function tracing<T>(info: LogInfo, run: () => T, call?: CallInfo): T {
    return _tracing([globalLogger], info, run, call);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logVerbose(...args: any[]) {
    log(LogLevel.Trace, ...args);
}

export namespace traceDecorators {
    const DEFAULT_OPTS: TraceOptions = TraceOptions.BeforeCall | TraceOptions.Arguments | TraceOptions.ReturnValue;

    export function verbose(message: string, opts: TraceOptions = DEFAULT_OPTS) {
        return createTracingDecorator([globalLogger], { message, opts, level: LogLevel.Trace });
    }
    export function error(message: string) {
        const opts = DEFAULT_OPTS;
        const level = LogLevel.Error;
        return createTracingDecorator([globalLogger], { message, opts, level });
    }
    export function info(message: string) {
        const opts = TraceOptions.None;
        return createTracingDecorator([globalLogger], { message, opts, level: LogLevel.Info });
    }
    export function warn(message: string) {
        const opts = DEFAULT_OPTS;
        const level = LogLevel.Warn;
        return createTracingDecorator([globalLogger], { message, opts, level });
    }
}