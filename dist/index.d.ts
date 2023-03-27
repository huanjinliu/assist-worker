/**
 * Web Workers辅助者，提供极少API使你能更灵活地在编码中使用Web Workers
 */
type AssistWorker = {
    /**
     * 收集worker线程内需要用到的主线程数据，数据的字段名需和线程中用到的名称保持一致
     * @param {object} sourceData worker线程内用到的主线程数据
     * @returns {object} Web Workers API封装对象
     */
    collect: (data: Record<string, any>) => AssistWorker;
    /**
     * 接收并处理worker线程向主线程发送的信息
     * @param {function(message):void} callback worker线程向主线程发送信息的监听回调
     * @returns {object} Web Workers API封装对象
     */
    onMessage: (handler: (message: any) => void) => AssistWorker;
    /**
     * 创建和初始化worker线程
     * @param {function(...dynamicParameters, workerMethods):any} job 需要放入worker线程执行的工作流程函数
     * @returns {object} 用于控制工作流程执行和线程关闭的对象
     */
    create: <T extends (...args: any) => any>(job: T) => {
        run: (...args: Parameters<T> extends [...infer P, infer Q] ? P : never) => Promise<ReturnType<T>>;
        terminate: () => void;
    };
};
declare const _default: AssistWorker;
export default _default;
