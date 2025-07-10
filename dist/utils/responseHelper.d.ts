interface OkOptions {
    data?: any;
    msg?: string;
    code?: number;
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
}
interface ConvertOptions {
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
}
export declare function convertDateFields(input: any, { convertDates, timezone, dateFields, }?: ConvertOptions): any;
export declare function ok(input?: string | OkOptions, options?: ConvertOptions): any;
export declare function clearOkCache(): void;
export declare function fail(input: string | {
    msg?: string;
    code?: number;
    data?: any;
}): any;
export {};
