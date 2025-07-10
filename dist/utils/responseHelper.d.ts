interface OkOptions {
    data?: any;
    msg?: string;
    code?: number;
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
}
export declare function convertDateFields(input: any, { convertDates, timezone, dateFields, }?: {
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
}): any;
export declare function ok(input: string | OkOptions, options?: {
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
}): any;
export declare function clearOkCache(): void;
export declare function fail(input: string | {
    msg?: string;
    code?: number;
    data?: any;
}): any;
export {};
