import { ObjectLiteral, Repository } from "typeorm";
// import { convertDateFields } from '../../utils/responseHelper';

function filterUpdateFields<T>(
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

export class BaseCrudService<T extends ObjectLiteral> {
  // 子类需实现 repository
  get repo(): any {
    throw new Error("子类需实现 repo getter");
  }

  async getRepo(): Promise<Repository<T>> {
    return this.repo;
  }

  /** 创建数据 */
  async add(data: Partial<T>) {
    // console.log('新增', data, this.repo);
    const entity = this.repo.create(data);
    const res = await this.repo.save(entity);
    return { data: res };
  }

  /** 根据 ID 更新数据 */
  async update(id: number, data: Partial<T>) {
    const filtered = filterUpdateFields(data, ["createdAt", "updatedAt"]);

    // 更推荐 update：性能高
    (filtered as any).updatedAt = new Date(); // 手动更新时间（除非你用 @UpdateDateColumn）
    await this.repo.update(id, filtered);
    return { code: 0 };
  }

  /** 根据 ID 删除数据 */
  async del(body: { ids: number[] | string[] }) {
    await this.repo.delete(body.ids);
    return { code: 0 };
  }

  /** 根据 ID 获取详情 */
  async info(id: number) {
    return this.repo.findOneBy({ id });
  }

  /** 查询全部 */
  async all(query: any) {
    return this.repo.find({ where: query });
  }

  async findOne(data: any) {
    return this.repo.findOne(data);
  }

  /** 分页查询，支持条件 */
  async list(query: Record<string, any>) {
    const rawPage = parseInt(query.page, 10);
    const rawSize = parseInt(query.size, 10);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const size = Number.isInteger(rawSize) && rawSize > 0 ? rawSize : 10;

    const sortKey = query.sortkey || "id";
    const sortValue = (query.sortvalue || "desc").toUpperCase();

    // 构造排序对象
    const order: Record<string, "ASC" | "DESC"> = {
      [sortKey]: sortValue === "ASC" ? "ASC" : "DESC",
    };

    // 构造 where 条件（排除已知分页与排序字段）
    const where: Record<string, any> = {};
    const excludeKeys = ["page", "size", "sortkey", "sortvalue"];

    for (const key in query) {
      if (!excludeKeys.includes(key)) {
        where[key] = query[key];
      }
    }

    const [data, count] = await this.repo.findAndCount({
      where,
      order,
      skip: (page - 1) * size,
      take: size,
    });

    const totalPages = Math.ceil(count / size);

    // const list = convertDateFields(data, {
    //   convertDates: true,
    //   timezone: 'Asia/Shanghai',
    //   dateFields: ['createdAt', 'updatedAt'],
    // });

    return { data: data, count, totalPages };
  }
}
