## midway-helper
```js
pnpm add midway-helper


 

import { BaseCrudService } from 'midway-helper';
@Provide()
export class RoleService extends BaseCrudService<Role> {
  @InjectEntityModel(Role)
  roleRepository: Repository<Role>;

  get repo() {
    return this.roleRepository;
  }
}



@Crud({
  api: ['add', 'update', 'del', 'info', 'all', 'list'], // 只注册这两个接口
  basePath: `${process.env.API_PREFIX}/role`,
  entity: Role,
  service: RoleService,
  before: {
    del: async (ctx, repo) => {
      const { ids } = ctx.request.body as any;
      // const user = ctx.state.user as User;

      const super_admin_role = await repo.findOne({
        where: { code: 'super_admin' },
      });

      if (ids && ids?.length == 0) {
        throwError('ids', -1, 400, 'required'); // 自定义错误
      }

      const hasSuperAdmin = ids?.some(id => id == super_admin_role.id);

      if (hasSuperAdmin) {
        throwError('不能删除超级管理员');
      }
    },
  },

  transform: {
    list: async (result, ctx) => {
      const { data, count, totalPages } = result;
      console.log(data, count, totalPages, '结果');
      return { list: data };
    },
  },
  dateTransform: {
    convertDates: true,
    timezone: 'America/New_York',
    dateFields: ['createdAt', 'updatedAt'],
  },
})
export class RoleController extends BaseController {
  @InjectEntityModel(Role)
  roleRepo: Repository<Role>;
}
```
