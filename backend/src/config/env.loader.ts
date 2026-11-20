import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

export const ENV_FILE_PATHS = ['.env.local', '.env'];

/** CLI entry points share Nest's file precedence without bootstrapping the app. */
export function loadEnvironment(): Record<string, string | undefined> {
  let fileValues: Record<string, string> = {};
  for (const path of [...ENV_FILE_PATHS].reverse()) {
    try {
      fileValues = { ...fileValues, ...parse(readFileSync(path)) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  return { ...fileValues, ...process.env };
}
