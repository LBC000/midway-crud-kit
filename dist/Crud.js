"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crud = Crud;
const core_1 = require("@midwayjs/core");
function Crud(options) {
    return (target) => {
        (0, core_1.Controller)(options.basePath)(target);
        const proto = target.prototype;
        const handlerMap = {
            add: { methodName: "add", decorator: (0, core_1.Post)("/") },
            update: { methodName: "update", decorator: (0, core_1.Put)("/:id") },
            del: { methodName: "del", decorator: (0, core_1.Del)("/") },
            info: { methodName: "info", decorator: (0, core_1.Get)("/:id") },
            all: { methodName: "all", decorator: (0, core_1.Get)("/all") },
            list: { methodName: "list", decorator: (0, core_1.Get)("/list") },
        };
        // 参数解析函数：根据方法提取对应的参数列表
        function getArgs(method, ctx) {
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
                proto[methodName] = async function (ctx) {
                    const serviceInstance = await ctx.requestContext.getAsync(options.service);
                    // 统一 before 调用逻辑
                    if (options.before) {
                        if (typeof options.before === "function") {
                            // 直接调用函数
                            await options.before(ctx, serviceInstance, methodName);
                        }
                        else if (typeof options.before === "object") {
                            // 先调用 always
                            if (typeof options.before.always === "function") {
                                await options.before.always(ctx, serviceInstance, methodName);
                            }
                            // 再调用对应方法的钩子，比如 list、add 等
                            if (typeof options.before[methodName] === "function") {
                                await options.before[methodName](ctx, serviceInstance, methodName);
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
