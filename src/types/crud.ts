type CrudAction = 'add' | 'del' | 'update' | 'info' | 'all' | 'list';

interface CrudResultBase<A extends CrudAction> {
  code: number;
  action: A;
}

export interface CrudResultData<T, A extends CrudAction = CrudAction>
  extends CrudResultBase<A> {
  data: T;
}

export interface CrudResultList<T> extends CrudResultBase<'list'> {
  data: T[];
  count: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CrudResultNoData<
  A extends Exclude<CrudAction, 'add' | 'info' | 'all' | 'list'>
> extends CrudResultBase<A> {}

export type AnyCrudResultList = CrudResultList<any>;
