import { Controller, Get, Post, Put, Del } from "@midwayjs/core";
import { Context } from "@midwayjs/koa";
import { Repository } from "typeorm";
import { convertDateFields } from "../utils/responseHelper";
import { TypeORMDataSourceManager } from "@midwayjs/typeorm";
import * as crudOps from "../utils/crudOps"; // ✅ 导入通用 crud 函数

type ApiName = "add" | "del" | "update" | "info" | "all" | "list" | "always";
type CrudApi = Exclude<ApiName, "always">;

type BeforeFunction = (
  ctx: Context,
  repo: Repository<any>,
  methodName: CrudApi
) => Promise<any>;

type BeforeOption = BeforeFunction | Partial<Record<ApiName, BeforeFunction>>;

type TransformFunction = (result: any, ctx: Context) => Promise<any> | any;
type TransformOption = Partial<Record<CrudApi, TransformFunction>>;

type DateTransformOptions = {
  convertDates?: boolean;
  timezone?: string;
  dateFields?: string[];
};

export interface CrudOptions {
  api: CrudApi[];
  basePath: string;
  entity: any;
  service?: new (...args: any[]) => any;
  before?: BeforeOption;
  transform?: TransformOption;
  dateTransform?: DateTransformOptions;
}

function getArgs(method: CrudApi, ctx: Context): any[] {
  switch (method) {
    case "add":
      return [ctx.request.body];
    case "update":
      return [ctx.params.id, ctx.request.body];
    case "del": {
      const body = ctx.request.body as { ids: number[] | string[] };
      return [body.ids || []];
    }
    case "info":
      return [ctx.params.id];
    case "all":
    case "list":
      return [ctx.query];
    default:
      return [ctx];
  }
}

async function runBeforeHooks(
  ctx: Context,
  repo: Repository<any>,
  methodName: CrudApi,
  before?: BeforeOption
) {
  if (!before) return;
  if (typeof before === "function") {
    await before(ctx, repo, methodName);
  } else if (typeof before === "object") {
    if (typeof before.always === "function") {
      await before.always(ctx, repo, methodName);
    }
    if (typeof before[methodName] === "function") {
      await before[methodName]!(ctx, repo, methodName);
    }
  }
}

async function runTransform(
  result: any,
  ctx: Context,
  methodName: CrudApi,
  transform?: TransformOption
) {
  if (transform && typeof transform[methodName] === "function") {
    return await transform[methodName]!(result, ctx);
  }
  return result;
}

function convertDatesIfNeeded(
  result: any,
  dateTransform?: DateTransformOptions
) {
  const convertDates = dateTransform?.convertDates !== false;
  if (!convertDates) return result;

  const timezone = dateTransform?.timezone || "Asia/Shanghai";
  const dateFields = dateTransform?.dateFields || ["createdAt", "updatedAt"];

  return convertDateFields(result, {
    convertDates: true,
    timezone,
    dateFields,
  });
}

function bindDecorator(
  proto: any,
  methodName: CrudApi,
  decorator: MethodDecorator
) {
  const descriptor = Object.getOwnPropertyDescriptor(proto, methodName);
  if (descriptor) {
    decorator(proto, methodName, descriptor);
  }
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

    for (const apiName of options.api) {
      const { methodName, decorator } = handlerMap[apiName];

      if (!proto[methodName]) {
        proto[methodName] = async function (ctx: Context) {
          const dataSourceManager = await ctx.requestContext.getAsync(
            TypeORMDataSourceManager
          );
          const dataSource = dataSourceManager.getDataSource("default");
          const repo = dataSource.getRepository(options.entity);

          // before hook
          await runBeforeHooks(ctx, repo, methodName, options.before);

          // 参数
          const args = getArgs(methodName, ctx);

          let result: any;

          if (options.service) {
            const serviceInstance = await ctx.requestContext.getAsync(
              options.service
            );
            if (typeof serviceInstance[methodName] !== "function") {
              throw new Error(`Service method "${methodName}" not found`);
            }
            result = await serviceInstance[methodName](...args);
          } else {
            // 使用 crudOps fallback
            const crudFunc = (crudOps as any)[`crud${capitalize(methodName)}`];
            if (typeof crudFunc !== "function") {
              throw new Error(
                `Function crud${capitalize(methodName)} not found in crudOps`
              );
            }
            result = await crudFunc(repo, ...args);
          }

          result = await runTransform(
            result,
            ctx,
            methodName,
            options.transform
          );
          result = convertDatesIfNeeded(result, options.dateTransform);

          return result;
        };
      }

      bindDecorator(proto, methodName, decorator);
    }
  };
}

// 工具函数：首字母大写
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
