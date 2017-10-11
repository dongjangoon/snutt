import * as path from 'path';
export function getLogFilePath(filename: string) {
    return path.resolve(__dirname, filename)
}