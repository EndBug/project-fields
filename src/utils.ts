import * as core from '@actions/core';
import {parse as csvParse} from 'csv/sync';
import {stringify as csvStringify} from 'csv/sync';

/** Excludes `{}` from a `Partial` type */
export type AtLeastOne<T, U = {[K in keyof T]: Pick<T, K>}> = Partial<T> &
  U[keyof U];

/** Excludes `{}` from a union type */
export type ExcludeEmpty<T> = T extends AtLeastOne<T> ? T : never;

/**
 * Can be used as a type guard to check if a value is of a specific type.
 * @param value The value to check
 * @param test A function that takes the value as an argument and returns a whether it is of the correct type
 * @returns Whether the value is of the correct type
 */
export function checkType<T>(
  value: unknown,
  test: (value: unknown) => boolean
): value is T {
  return test(value);
}

/** Shorthand to log a value in the debug logs of the action run */
export function debug(item: unknown) {
  core.debug(JSON.stringify(item, null, 2));
}

/** Generates a CSV string from an array of values */
export function stringifyCSVArray(
  values: (string | number | boolean | undefined)[]
): string {
  return csvStringify([values]).trim();
}

/** Parses a CSV string containing one row into an array of strings */
export function parseCSVArray(csv: string): string[] {
  const data = csvParse(csv);

  if (!(data instanceof Array)) throw new Error('Could not parse CSV');

  if (data.length !== 1) throw new Error('CSV must have exactly one row');

  if (!(data[0] instanceof Array) || data[0].some(x => typeof x !== 'string'))
    throw new Error('CSV must have exactly one row of strings');

  return data[0];
}
