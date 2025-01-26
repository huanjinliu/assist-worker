(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.assistWorker = {}));
})(this, (function (exports) { 'use strict';

  const WORKER_MESSAGE = 'WORKER_MESSAGE';
  const JOB_RESULT = 'JOB_RESULT';
  /**
   * 判断值是否是可转移的对象，在使用中可以使用快速且高效的零拷贝操作
   * @param {any} value 待判断的值
   * @returns {boolean} 是否是可转移的对象
   */
  const isTransferables = (value) => value instanceof ArrayBuffer ||
      value instanceof MessagePort ||
      (self.ImageBitmap && value instanceof ImageBitmap);
  /**
   * 创建一个Web Workers API封装对象
   * @returns {object} Web Workers API封装对象
   */
  const createAssistWorker = () => {
      // 记录所有的工作流程的执行凭证
      const jobs = [];
      // 收集所有worker线程需要用到的主线程数据
      let collections = new Map();
      // 记录主线程设置的信息接收器
      let onMessage;
      // Web Workers API封装对象
      const assistWorker = {
          collect: (data) => {
              for (let key in data) {
                  collections.set(key, data[key]);
              }
              return assistWorker;
          },
          onMessage: (handler) => {
              onMessage = handler;
              return assistWorker;
          },
          create: (job) => {
              // 核心工作流程脚本
              const majorScript = job.toString();
              // 组合成worker脚本
              const workerScript = `
        // 将收集到的变量声明和定义加入脚本字符串，后面函数执行的时候便不会出现not defined的错误了
        ${Object.entries(Object.fromEntries(collections)).reduce((variablesStr, [key, value]) => {
                let variable = typeof value === 'function'
                    ? `${key}=${value};`
                    : `${key}=JSON.parse(\`${JSON.stringify(value)}\`);`;
                return variablesStr + variable;
            }, '')}
  
        // 声明定义用于判断是否是可转移对象的函数
        $isTransferables = ${isTransferables}
  
        // 在脚本中声明并定义一个包含工作流程的函数体
        $job=${majorScript};
  
        // 给worker线程添加消息监听，等待主线程的发号施令
        onmessage=e=>{
          const { index, args } = e.data;
  
          Promise.resolve(
            $job.apply($job, args.concat([{
              postMessage: (message) => postMessage({ type: '${WORKER_MESSAGE}', message }),
              close: self.close,
            }]))
          ).then(result => {
            postMessage({ type: '${JOB_RESULT}', message: { index, result } }, [result].filter($isTransferables))
          }).catch(error => {
            postMessage({ type: '${JOB_RESULT}', message: { index, error } })
          })
        }
      `;
              // 主线程下创建worker线程
              const workerURL = URL.createObjectURL(new Blob([workerScript], { type: 'text/javascript' }));
              const worker = new Worker(workerURL);
              // 监听接收worker线程发的消息
              worker.onmessage = function (e) {
                  const data = e.data;
                  if (data.type === WORKER_MESSAGE)
                      if (onMessage)
                          onMessage.call(onMessage, data.message);
                  if (data.type === JOB_RESULT) {
                      const { index, result, error } = data.message;
                      const { done } = jobs[index];
                      done(error, result);
                  }
              };
              /**
               * 执行工作流程
               * @param {...any} args 动态参数
               * @returns {Promise<any>} 工作流程执行结果
               */
              const run = (...args) => {
                  return new Promise((resolve, reject) => {
                      const index = jobs.length;
                      jobs.push({
                          done: (error, result) => {
                              if (error)
                                  reject(error);
                              else
                                  resolve(result);
                          },
                      });
                      worker.postMessage({ index, args }, args.filter(isTransferables));
                  });
              };
              /**
               * 终止worker线程
               */
              const terminate = () => {
                  worker.terminate();
                  URL.revokeObjectURL(workerURL);
                  jobs.length = 0;
                  collections.clear();
                  onMessage = undefined;
              };
              return { run, terminate };
          },
      };
      return assistWorker;
  };

  exports.createAssistWorker = createAssistWorker;

}));
