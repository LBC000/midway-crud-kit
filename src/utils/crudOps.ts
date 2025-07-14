import { Repository, FindOptionsOrder, ObjectLiteral } from "typeorm";
import { filterUpdateFields } from "./common";
import {
  CrudResultData,
  CrudResultList,
  CrudResultNoData,
} from "../types/crud";

export async function crudAdd<T extends ObjectLiteral>(
  repo: Repository<T>,
  data: T
): Promise<CrudResultData<T, "add">> {
  const entity = repo.create(data);
  const res = await repo.save(entity);
  return { code: 0, action: "add", data: res };
}

export async function crudUpdate<T extends ObjectLiteral>(
  repo: Repository<T>,
  id: number,
  data: Partial<T>
): Promise<CrudResultNoData<"update">> {
  const filtered: any = filterUpdateFields(data, ["createdAt", "updatedAt"]);
  filtered.updatedAt = new Date();
  await repo.update(id, filtered);
  return { code: 0, action: "update" };
}

export async function crudDel<T extends ObjectLiteral>(
  repo: Repository<T>,
  ids: number[] | string[]
): Promise<CrudResultNoData<"del">> {
  await repo.delete(ids);
  return { code: 0, action: "del" };
}

export async function crudInfo<T extends ObjectLiteral>(
  repo: Repository<T>,
  id: number
): Promise<CrudResultData<T | null, "info">> {
  const data = await repo.findOneBy({ id } as any);
  return { code: 0, action: "info", data };
}

export async function crudAll<T extends ObjectLiteral>(
  repo: Repository<T>,
  query: any
): Promise<CrudResultData<T[], "all">> {
  const data = await repo.find({ where: query });
  return { code: 0, action: "all", data };
}

export async function crudList<T extends ObjectLiteral>(
  repo: Repository<T>,
  query: Record<string, any>
): Promise<CrudResultList<T>> {
  const rawPage = parseInt(query.page, 10);
  const rawSize = parseInt(query.size, 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const size = Number.isInteger(rawSize) && rawSize > 0 ? rawSize : 10;

  const sortKey = query.sortKey || "id";
  const sortValue = (query.sortValue || "desc").toUpperCase();

  const order = {
    [sortKey]: sortValue === "ASC" ? "ASC" : "DESC",
  } as FindOptionsOrder<any>;

  const where: Record<string, any> = {};
  const excludeKeys = ["page", "size", "sortKey", "sortValue"];

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

  const totalPages = Math.ceil(count / size);

  return {
    code: 0,
    action: "list",
    data,
    count,
    totalPages,
    page,
    size,
  };
}
