import { parse } from 'acorn';

/**
 * 查找一段脚本所有变量
 * @param script 脚本
 * @returns 所有变量
 */
const findAllVariables = (script: string) => {
  const ast = parse(script, { ecmaVersion: 6 });
  const variables = new Set<string>();
  const traverse = (node: any) => {
    if (!node) return;
    if ('type' in node && node.type === 'Identifier') {
      variables.add(node.name);
    }
    for (let key in node) {
      if (typeof node[key] !== 'object') continue;

      if (Array.isArray(node[key])) {
        node[key].forEach(traverse);
      } else traverse(node[key]);
    }
  };
  traverse(ast);

  return Array.from(variables);
};

const createAssistWorker = () => {
  // 收集所有的worker脚本
  const workers: {
    worker: Worker;
    scriptBlobURL: string;
    done: (error?: Error, result?: any) => void;
  }[] = [];
  // 收集所有脚本需要的变量
  const variables: Map<string, { type: string; value: any }> = new Map();
  // 收集所有脚本需要的方法
  const functions: Map<string, string> = new Map();

  const execute = (func: any) => {
    // 核心脚本
    const majorScript = func.toString();

    // 组合成worker脚本
    const workerScript = `
      /** 注册数据源 */
      $data=JSON.parse('${JSON.stringify(Object.fromEntries(variables))}');

      /** 注册方法 */
      ${Object.entries(Object.fromEntries(functions)).reduce(
        (apiScript, [key, funcStr], index, arr) => {
          return apiScript + `${key}=${funcStr};${index !== arr.length - 1 ? '\n' : ''}`;
        },
        ''
      )}

      /** 设置数据源getter响应 */
      for (let variable in $data) {
        Object.defineProperty(globalThis, variable, {
          get() {
            const { type, value } = $data[variable];

            if (type === 'function') return (...args) => {
              postMessage({ action: 'request', id: variable, arguments: args })
            }

            return value;
          }
        });
      }

      /** 执行核心脚本 */
      $script=${majorScript};
      onmessage=e=>{
        if (e.data.action === 'init') {
          const { id, arguments } = e.data;
          const result = $script.apply($script, arguments);
          const isPromise = typeof result === 'object' && 'then' in result;
          if (isPromise) {
            result
              .then((asyncResult) => postMessage({ action: 'callback', id, value: asyncResult }))
              .catch((error) => postMessage({ action: 'callback', id, value: undefined, error }))
          }
          else postMessage({ action: 'callback', id, value: result })
        }
      }
    `;

    const workerURL = URL.createObjectURL(new Blob([workerScript]));

    // 主线程下创建worker线程
    const worker = new Worker(workerURL);

    // 监听接收worker线程发的消息
    worker.onmessage = function (e) {
      const data = e.data as
        | {
            action: 'callback';
            id: number;
            value: any;
            error: any;
          }
        | {
            action: 'request';
            id: string;
            arguments: any[];
          };

      switch (data.action) {
        case 'request': {
          const func = variables.get(data.id)?.value;

          if (func) {
            const result = func.apply(func, data.arguments);
            worker.postMessage({
              type: data.action,
              id: data.id,
              value: result
            });
          }
          break;
        }
        case 'callback': {
          const { worker, done, scriptBlobURL } = workers[data.id];

          done(data.error, data.value);
          worker.terminate();
          URL.revokeObjectURL(scriptBlobURL);
        }
      }
    };

    return (...args) => {
      return new Promise((resolve, reject) => {
        const id = workers.length;
        workers.push({
          worker,
          scriptBlobURL: workerURL,
          done: (error, result) => {
            if (error) reject(error);
            if (result) resolve(result);
          }
        });
        worker.postMessage({ id, action: 'init', arguments: args });
      });
    };
  };

  const worker = {
    collect: (data: Record<string, any>) => {
      for (let key in data) {
        const value = data[key];
        const type = typeof value;

        if (type === 'function') functions.set(key, value.toString());
        else variables.set(key, { type, value });
      }
      return worker;
    },
    request: (data: Record<string, any>) => {
      for (let key in data) {
        const value = data[key];
        const type = typeof value;
        variables.set(key, { type, value });
      }
      return worker;
    },
    execute
  };

  return worker;
};

export default createAssistWorker();
