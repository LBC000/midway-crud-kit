// src/utils/responseHelper.ts

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface OkOptions {
  data?: any;
  msg?: string;
  code?: number;
  convertDates?: boolean;
  timezone?: string;
  dateFields?: string[];
}

// 缓存日期字段集合，提高 Set 查找性能
const dateFieldsCache = new Map<string, Set<string>>();

// 判断是否为纯对象（兼容 Object.create(null) 和 TypeORM 实例）
function isPlainObject(obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

// 性能转换函数（支持 TypeORM Entity）
export function convertDateFields(
  input: any,
  {
    convertDates = true,
    timezone = 'Asia/Shanghai',
    dateFields = ['createdAt', 'updatedAt'],
  }: {
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
  } = {}
): any {
  if (!convertDates || input === null || input === undefined) return input;

  const cacheKey = dateFields.join(',');
  let dateFieldsSet = dateFieldsCache.get(cacheKey);
  if (!dateFieldsSet) {
    dateFieldsSet = new Set(dateFields);
    dateFieldsCache.set(cacheKey, dateFieldsSet);
  }

  const isRootArray = Array.isArray(input);

  if (!isRootArray && typeof input !== 'object') return input;

  const visited = new WeakMap();
  const stack: Array<{ source: any; target: any; key: string | number }> = [];
  const result = isRootArray ? new Array(input.length) : {};

  visited.set(input, result);

  if (isRootArray) {
    for (let i = 0; i < input.length; i++) {
      stack.push({ source: input[i], target: result, key: i });
    }
  } else {
    for (const key of Object.keys(input)) {
      stack.push({ source: input[key], target: result, key });
    }
  }

  while (stack.length > 0) {
    const { source, target, key } = stack.pop()!;

    if (source && typeof source === 'object') {
      if (visited.has(source)) {
        target[key] = visited.get(source);
        continue;
      }

      const isArr = Array.isArray(source);
      const isPlain = isPlainObject(source);

      // 非纯对象或类实例：尝试转换为普通对象（TypeORM）
      if (!isArr && !isPlain) {
        if (typeof source.toJSON === 'function') {
          target[key] = source.toJSON();
        } else {
          target[key] = source;
        }
        continue;
      }

     const newTarget: Record<string, any> = isArr ? new Array(source.length) : {};
      target[key] = newTarget;
      visited.set(source, newTarget);

      for (const k of Object.keys(source)) {
        const v = source[k];

        if (dateFieldsSet.has(k) && v) {
          if (
            typeof v === 'string' ||
            typeof v === 'number' ||
            v instanceof Date
          ) {
            const parsed = dayjs(v);
            if (parsed.isValid()) {
              newTarget[k] = parsed.tz(timezone).format('YYYY-MM-DD HH:mm:ss');
              continue;
            }
          }
        }

        if (v && typeof v === 'object') {
          stack.push({ source: v, target: newTarget, key: k });
        } else {
          newTarget[k] = v;
        }
      }
    } else {
      target[key] = source;
    }
  }

  return result;
}

export function ok(
  input: string | OkOptions,
  options?: {
    convertDates?: boolean;
    timezone?: string;
    dateFields?: string[];
  }
) {
  let msg = 'success';
  let code = 0;
  let data = null;
  let convertDates = true;
  let tz = 'Asia/Shanghai';
  let dateFields = ['createdAt', 'updatedAt'];

  if (typeof input === 'string') {
    msg = input;
    if (options) {
      convertDates = options.convertDates ?? true;
      tz = options.timezone ?? 'Asia/Shanghai';
      dateFields = options.dateFields ?? ['createdAt', 'updatedAt'];
    }
  } else {
    ({
      msg = 'success',
      code = 0,
      data = null,
      convertDates = true,
      timezone: tz = 'Asia/Shanghai',
      dateFields = ['createdAt', 'updatedAt'],
    } = input);
  }

  const res: any = { msg, code };
  if (data !== null && data !== undefined) {
    res.data = convertDateFields(data, {
      convertDates,
      timezone: tz,
      dateFields,
    });
  }

  return res;
}

export function clearOkCache() {
  dateFieldsCache.clear();
}

export function fail(
  input: string | { msg?: string; code?: number; data?: any }
) {
  let msg = 'fail';
  let code = 400;
  let data = null;

  if (typeof input === 'string') {
    msg = input;
  } else {
    ({ msg = 'fail', code = 400, data = null } = input);
  }

  const res: any = { code, msg };
  if (data !== null && data !== undefined) {
    res.data = data;
  }
  return res;
}
