import { ObjectLiteral, Repository } from 'typeorm';

import {
  crudAdd,
  crudAll,
  crudDel,
  crudInfo,
  crudList,
  crudUpdate,
} from '../utils/crudOps';

export class BaseCrudService<T extends ObjectLiteral> {
  // 子类需实现 repository
  // get repo(): any {
  //   throw new Error('子类需实现 repo getter');
  // }

  private _repo: Repository<T>;

  get repo(): Repository<T> {
    if (!this._repo) {
      throw new Error('Repository not initialized');
    }
    return this._repo;
  }

  set repo(repository: Repository<T>) {
    this._repo = repository;
  }

  async getRepo(): Promise<Repository<T>> {
    return this.repo;
  }

  async add(data: any) {
    return await crudAdd(this.repo, data);
  }

  async update(id: number, data: Partial<T>) {
    return await crudUpdate(this.repo, id, data);
  }

  async del(body: { ids: number[] | string[] }) {
    return await crudDel(this.repo, body.ids);
  }

  async info(id: number) {
    return await crudInfo(this.repo, id);
  }

  async all(query: any) {
    return await crudAll(this.repo, query);
  }

  async list(query: Record<string, any>) {
    return await crudList(this.repo, query);
  }
}
