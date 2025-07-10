import { Controller, Get, Post, Put, Del } from "@midwayjs/core";
import { Context } from "@midwayjs/koa";
import { Repository } from "typeorm";

type ApiName = "add" | "del" | "update" | "info" | "all" | "list" | "always";
type BeforeFunction = (
  ctx: Context,
  service: Repository<any>,
  methodName: string
) => Promise<any>;
type BeforeOption = BeforeFunction | Partial<Record<ApiName, BeforeFunction>>;

type CrudApi = Exclude<ApiName, "always">;

export interface CrudOptions {
  api: Array<"add" | "del" | "update" | "info" | "all" | "list">;
  basePath: string;
  entity: any;
  service: new (...args: any[]) => any;
  before?: BeforeOption;
}

export function Crud(options: CrudOptions): ClassDecorator {
  return (target: any) => {
    Controller(options.basePath)(target);
    const proto = target.prototype;

    const handlerMap: Record<
      CrudApi,
      { methodName: CrudApi; decorator: MethodDecorator }
    > = {
      add: { methodName: "add", decorator: Post("/") },
      update: { methodName: "update", decorator: Put("/:id") },
      del: { methodName: "del", decorator: Del("/") },
      info: { methodName: "info", decorator: Get("/:id") },
      all: { methodName: "all", decorator: Get("/all") },
      list: { methodName: "list", decorator: Get("/list") },
    };

    // 参数解析函数：根据方法提取对应的参数列表
    function getArgs(method: string, ctx: any): any[] {
      switch (method) {
        case "add":
          return [ctx.request.body];
        case "update":
          return [ctx.params.id, ctx.request.body];
        case "del":
          // 支持批量删除，接受数组 ID（从 body 中传）
          return [ctx.request.body]; // 例如: { ids: [1, 2, 3] }
        case "info":
          return [ctx.params.id];
        case "all":
        case "list":
          return [ctx.query];
        default:
          return [ctx];
      }
    }

    for (const apiName of options.api) {
      const { methodName, decorator } = handlerMap[apiName];

      // 支持方法重写（如果控制器里没写才自动生成）
      if (!proto[methodName]) {
        proto[methodName] = async function (ctx: any) {
          const serviceInstance = await ctx.requestContext.getAsync(
            options.service
          );

          // 统一 before 调用逻辑
          if (options.before) {
            if (typeof options.before === "function") {
              // 直接调用函数
              await options.before(ctx, serviceInstance, methodName);
            } else if (typeof options.before === "object") {
              // 先调用 always
              if (typeof options.before.always === "function") {
                await options.before.always(ctx, serviceInstance, methodName);
              }
              // 再调用对应方法的钩子，比如 list、add 等
              if (typeof options.before[methodName] === "function") {
                await options.before[methodName](
                  ctx,
                  serviceInstance,
                  methodName
                );
              }
            }
          }

          const args = getArgs(methodName, ctx);
          return serviceInstance[methodName](...args);
        };
      }

      const descriptor = Object.getOwnPropertyDescriptor(proto, methodName);
      if (descriptor) {
        decorator(proto, methodName, descriptor);
      }
    }
  };
}
