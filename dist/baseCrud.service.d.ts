export declare class BaseCrudService<T> {
    get repo(): any;
    /** 创建数据 */
    add(data: Partial<T>): Promise<{
        data: any;
    }>;
    /** 根据 ID 更新数据 */
    update(id: number, data: Partial<T>): Promise<{
        code: number;
    }>;
    /** 根据 ID 删除数据 */
    del(body: {
        ids: number[] | string[];
    }): Promise<{
        code: number;
    }>;
    /** 根据 ID 获取详情 */
    info(id: number): Promise<any>;
    /** 查询全部 */
    all(query: any): Promise<any>;
    findOne(data: any): Promise<any>;
    /** 分页查询，支持条件 */
    list(query: Record<string, any>): Promise<{
        data: any;
        count: any;
        totalPages: number;
    }>;
}
