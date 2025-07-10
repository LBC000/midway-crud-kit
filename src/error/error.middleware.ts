// src/common/error/error.middleware.ts
import { IMiddleware, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { ThrowError } from './throw.error';

@Middleware()
export class ErrorMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      try {
        await next();
      } catch (err) {
        if (err instanceof ThrowError) {
          ctx.status = err.status;
          ctx.body = {
            code: err.code,
            message: err.message,
          };
        } else {
          ctx.status = 500;
          ctx.body = {
            code: -1,
            message: '服务器内部错误',
          };
          ctx.logger.error('未处理错误: ', err);
        }
      }
    };
  }

  static getName(): string {
    return 'error'; // 中间件名称
  }
}
