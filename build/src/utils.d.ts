/** Excludes `{}` from a `Partial` type */
export type AtLeastOne<T, U = {
    [K in keyof T]: Pick<T, K>;
}> = Partial<T> & U[keyof U];
/** Excludes `{}` from a union type */
export type ExcludeEmpty<T> = T extends AtLeastOne<T> ? T : never;
/**
 * Can be used as a type guard to check if a value is of a specific type.
 * @param value The value to check
 * @param test A function that takes the value as an argument and returns a whether it is of the correct type
 * @returns Whether the value is of the correct type
 */
export declare function checkType<T>(value: unknown, test: (value: unknown) => boolean): value is T;
/** Shorthand to log a value in the debug logs of the action run */
export declare function debug(item: unknown): void;
/** Generates a CSV string from an array of values */
export declare function stringifyCSVArray(values: (string | number | boolean | undefined)[]): string;
/** Parses a CSV string containing one row into an array of strings */
export declare function parseCSVArray(csv: string): string[];
