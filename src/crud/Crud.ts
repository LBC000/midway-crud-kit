import { Controller, Get, Post, Put, Del } from "@midwayjs/core";
import { Context } from "@midwayjs/koa";
import { Repository } from "typeorm";
import { convertDateFields } from "../utils/responseHelper";

type ApiName = "add" | "del" | "update" | "info" | "all" | "list" | "always";
type CrudApi = Exclude<ApiName, "always">;

type BeforeFunction = (
  ctx: Context,
  service: Repository<any>,
  methodName: CrudApi
) => Promise<any>;

type BeforeOption = BeforeFunction | Partial<Record<ApiName, BeforeFunction>>;

type TransformFunction = (result: any, ctx: Context) => Promise<any> | any;
type TransformOption = Partial<Record<CrudApi, TransformFunction>>;

type DateTransformOptions = {
  convertDates?: boolean; // 是否启用转换，默认 true
  timezone?: string; // 时区，默认 'Asia/Shanghai'
  dateFields?: string[]; // 需要转换的字段名，默认 ['createdAt', 'updatedAt']
};

export interface CrudOptions {
  api: CrudApi[];
  basePath: string;
  entity: any;
  service: new (...args: any[]) => any;
  before?: BeforeOption;
  transform?: TransformOption;
  dateTransform?: DateTransformOptions;
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

    function getArgs(method: CrudApi, ctx: any): any[] {
      switch (method) {
        case "add":
          return [ctx.request.body];
        case "update":
          return [ctx.params.id, ctx.request.body];
        case "del":
          return [ctx.request.body]; // 支持批量删除，{ ids: [...] }
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

      if (!proto[methodName]) {
        proto[methodName] = async function (ctx: any) {
          const serviceInstance = await ctx.requestContext.getAsync(
            options.service
          );
          const repo = await serviceInstance.getRepo();

          // before 钩子
          if (options.before) {
            if (typeof options.before === "function") {
              await options.before(ctx, repo, methodName);
            } else if (typeof options.before === "object") {
              if (typeof options.before.always === "function") {
                await options.before.always(ctx, repo, methodName);
              }
              if (typeof options.before[methodName] === "function") {
                await options.before[methodName](ctx, repo, methodName);
              }
            }
          }

          const args = getArgs(methodName, ctx);
          let result = await serviceInstance[methodName](...args);

          // transform 处理
          if (
            options.transform &&
            typeof options.transform[methodName] === "function"
          ) {
            result = await options.transform[methodName]!(result, ctx);
          }

          // 日期转换配置，默认开启
          const dt = options.dateTransform || {};
          const convertDates = dt.convertDates !== false; // 默认 true
          if (convertDates) {
            const timezone = dt.timezone || "Asia/Shanghai";
            const dateFields = dt.dateFields || ["createdAt", "updatedAt"];

            // 假设你有一个 convertDateFields 工具，返回转换后的数据
            const res = convertDateFields(result, {
              convertDates: true,
              timezone,
              dateFields,
            });

            return res;
          }

          return result;
        };
      }

      const descriptor = Object.getOwnPropertyDescriptor(proto, methodName);
      if (descriptor) {
        decorator(proto, methodName, descriptor);
      }
    }
  };
}
