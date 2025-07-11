export function filterUpdateFields<T>(
  data: Partial<T>,
  blockedFields: string[]
): Partial<T> {
  // 将数组转换为 Set，查找性能从 O(n) 提升到 O(1)
  const blockedSet = new Set(blockedFields);
  const result = {} as Partial<T>;

  for (const key in data) {
    if (!blockedSet.has(key)) {
      result[key] = data[key];
    }
  }

  return result;
}
