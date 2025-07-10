## midway-helper

### 安装
```sh 
pnpm add midway-helper
```

### 错误处理
```js
import { ErrorMiddleware } from 'midway-helper';
this.app.useMiddleware([
  JwtMiddleware, // 鉴权：第一道关卡，未登录直接拦截
  ReportMiddleware, // 日志或统计：记录用户行为
  ErrorMiddleware, // 错误处理：必须放最后才能捕获前面抛出的错误
]);

import { throwError } from 'midway-helper';
throwError('ids', -1, 400, 'required'); // 自定义错误 ids is required
throwError('不能删除超级管理员');
throwError('不能删除超级管理员', -2, 500);

// 预设返回信息
const errorMessages = {
  required: (field: string) => `${field} is required`,
  invalid: (field: string) => `${field} is invalid`,
  notFound: (field: string) => `${field} not found`,
  alreadyExists: (field: string) => `${field} already exists`,
  unauthorized: () => `Unauthorized`,
  forbidden: () => `Forbidden`,
};
```

### crud 基础操作

```js
// 创建服务
import { BaseCrudService } from 'midway-helper';
@Provide()
export class RoleService extends BaseCrudService<Role> {
  @InjectEntityModel(Role)
  roleRepository: Repository<Role>;

  get repo() {
    return this.roleRepository;
  }
}

// 使用
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

// 获取服务实例
const serviceInstance = await ctx.requestContext.getAsync(RoleService);
```
