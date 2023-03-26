const createAssistWorker = () => {
  // 收集所有的worker脚本执行凭证
  const workers: {
    done: (error?: Error, result?: any) => void;
  }[] = [];
  // 收集所有脚本需要的变量
  const variables: Map<string, any> = new Map();
  // 收集所有脚本需要的方法
  const functions: Map<string, string> = new Map();
  // 信息接收器
  let onMessage: ((message: any) => void) | undefined;

  // 是否是转让数值，可以做到零拷贝
  const isTransferables  = (value: any) =>
    value instanceof ArrayBuffer ||
    value instanceof MessagePort ||
    (self.ImageBitmap && value instanceof ImageBitmap)

  const create = (func: any) => {
    // 核心脚本
    const majorScript = func.toString();

    // 组合成worker脚本
    const workerScript = `
      /** 注册数据源 */
      $data={};

      /** 注册函数 */
      ${Object.entries(Object.fromEntries(functions)).reduce(
        (apiScript, [key, funcStr], index, arr) => {
          return (
            apiScript +
            `${key}=${funcStr};${index !== arr.length - 1 ? "\n" : ""}`
          );
        },
        ""
      )}

      /** 注册判断是否是转让值函数 */
      $isTransferables = ${isTransferables}

      /** 执行核心脚本 */
      $script=${majorScript};
      onmessage=e=>{
        const action = e.data.action;
        if (action === 'init') {
          $data = e.data.variables;

          // 设置数据源getter响应
          for (let variable in $data) {
            Object.defineProperty(globalThis, variable, {
              get() { return $data[variable]; }
            });
          }
        }

        if (action === 'execute') {
          const { index, arguments } = e.data;
          const result = $script.apply($script, arguments.concat([{
            postMessage: (message) => postMessage({ action: 'message', message }),
            close: self.close,
          }]));
          const isPromise = typeof result === 'object' && 'then' in result;
          
          if (isPromise) {
            result
              .then((asyncResult) => postMessage({ action: 'callback', index, value: asyncResult }, [asyncResult].filter($isTransferables)))
              .catch((error) => postMessage({ action: 'callback', index, value: undefined, error }))
          }
          else postMessage({ action: 'callback', index, value: result }, [result].filter($isTransferables))
        }
      }
    `;

    const workerURL = URL.createObjectURL(new Blob([workerScript]));

    // 主线程下创建worker线程
    const worker = new Worker(workerURL);

    // 初始worker线程内的变量
    const variablesObject = Object.fromEntries(variables);
    worker.postMessage(
      { action: "init", variables: variablesObject },
      Object.values(variablesObject).filter(isTransferables)
    );

    // 监听接收worker线程发的消息
    worker.onmessage = function (e) {
      const data = e.data as
        | {
            action: "callback";
            index: number;
            value: any;
            error: any;
          }
        | {
            action: "message";
            message: any;
          };

      if (data.action === "message") {
        if (onMessage) onMessage.call(onMessage, data.message);
      }

      if (data.action === "callback") {
        const { done } = workers[data.index];

        done(data.error, data.value);
      }
    };

    return {
      run: (...args) => {
        return new Promise((resolve, reject) => {
          const index = workers.length;
          workers.push({
            done: (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          });
          worker.postMessage(
            { action: "execute", index, arguments: args },
            args.filter(isTransferables)
          );
        });
      },
      terminate: () => {
        worker.terminate();
        URL.revokeObjectURL(workerURL);

        // 清空数据
        workers.length = 0;
        variables.clear();
        functions.clear();
        onMessage = undefined;
      }
    }
  };

  const worker = {
    collect: (data: Record<string, any>) => {
      for (let key in data) {
        const value = data[key];
        const type = typeof value;

        if (type === "function") functions.set(key, value.toString());
        else variables.set(key, value);
      }
      return worker;
    },
    onMessage: (handler: (message: any) => void) => {
      onMessage = handler;
      return worker;
    },
    create,
  };

  return worker;
};

export default createAssistWorker();
