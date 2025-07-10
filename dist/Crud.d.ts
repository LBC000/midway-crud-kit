import { Context } from "@midwayjs/koa";
import { Repository } from "typeorm";
type ApiName = "add" | "del" | "update" | "info" | "all" | "list" | "always";
type BeforeFunction = (ctx: Context, service: Repository<any>, methodName: string) => Promise<any>;
type BeforeOption = BeforeFunction | Partial<Record<ApiName, BeforeFunction>>;
export interface CrudOptions {
    api: Array<"add" | "del" | "update" | "info" | "all" | "list">;
    basePath: string;
    entity: any;
    service: new (...args: any[]) => any;
    before?: BeforeOption;
}
export declare function Crud(options: CrudOptions): ClassDecorator;
export {};
