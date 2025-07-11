import { Repository, ObjectLiteral, FindOptionsOrder } from "typeorm";

export async function crudAdd<T extends ObjectLiteral>(
  repo: Repository<T>,
  data: any
): Promise<{ data: T; code: number }> {
  const entity = repo.create(data);
  const res: any = await repo.save(entity);
  return { data: res, code: 0 };
}

export async function crudUpdate<T extends ObjectLiteral>(
  repo: Repository<T>,
  id: number,
  data: Partial<T>
): Promise<{ code: number }> {
  await repo.update(id, data);
  return { code: 0 };
}

export async function crudDel<T extends ObjectLiteral>(
  repo: Repository<T>,
  ids: number[] | string[]
): Promise<{ code: 0 }> {
  await repo.delete(ids);
  return { code: 0 };
}

export async function crudInfo<T extends ObjectLiteral>(
  repo: Repository<T>,
  id: number
): Promise<{ data: T | null; code: number }> {
  const data = await repo.findOneBy({ id } as any);
  return { data, code: 0 };
}

export async function crudAll<T extends ObjectLiteral>(
  repo: Repository<T>,
  query: any
): Promise<{ data: T[]; code: number }> {
  const data = await repo.find({ where: query });
  return { data, code: 0 };
}

export async function crudFindOne<T extends ObjectLiteral>(
  repo: Repository<T>,
  query: any
): Promise<{ data: T | null; code: number }> {
  const data = await repo.findOne(query);
  return { data, code: 0 };
}

export async function crudList<T extends ObjectLiteral>(
  repo: Repository<T>,
  query: Record<string, any>
): Promise<{ data: T[]; count: number; totalPages: number; code: number }> {
  const rawPage = parseInt(query.page, 10);
  const rawSize = parseInt(query.size, 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const size = Number.isInteger(rawSize) && rawSize > 0 ? rawSize : 10;

  const sortKey = query.sortKey || "id";
  const sortValue = (query.sortValue || "desc").toUpperCase();

  const order = {
    [sortKey]: sortValue === "ASC" ? "ASC" : "DESC",
  } as FindOptionsOrder<any>;

  const excludeKeys = ["page", "size", "sortKey", "sortValue"];
  const where: Record<string, any> = {};
  for (const key in query) {
    if (!excludeKeys.includes(key)) {
      where[key] = query[key];
    }
  }

  const [data, count] = await repo.findAndCount({
    where,
    order,
    skip: (page - 1) * size,
    take: size,
  });

  return { data, count, totalPages: Math.ceil(count / size), code: 0 };
}
