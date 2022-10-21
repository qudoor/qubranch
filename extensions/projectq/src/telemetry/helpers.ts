import * as hashjs from 'hash.js';
import { traceError } from '../common/logger';
/**
 * Safe way to send data in telemetry (obfuscate PII).
 */
export function getTelemetrySafeHashedString(data: string) {
    return hashjs.sha256().update(data).digest('hex');
}

export function getTelemetrySafeVersion(version: string): string | undefined {
    try {
        // Split by `.` & take only the first 3 numbers.
        // Suffix with '.', so we know we'll always have 3 items in the array.
        const [major, minor, patch] = `${version.trim()}...`.split('.').map((item) => parseInt(item, 10));
        if (isNaN(major)) {
            return;
        } else if (isNaN(minor)) {
            return major.toString();
        } else if (isNaN(patch)) {
            return `${major}.${minor}`;
        }
        return `${major}.${minor}.${patch}`;
    } catch (ex) {
        traceError(`Failed to parse version ${version}`, ex);
    }
}