
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
    'use strict';

    const createAssistWorker = () => {
        // 收集所有的worker脚本执行凭证
        const workers = [];
        // 收集所有脚本需要的变量
        const variables = new Map();
        // 收集所有脚本需要的方法
        const functions = new Map();
        // 信息接收器
        let onMessage;
        // 是否是转让数值，可以做到零拷贝
        const isTransferables = (value) => value instanceof ArrayBuffer ||
            value instanceof MessagePort ||
            (self.ImageBitmap && value instanceof ImageBitmap);
        const create = (func) => {
            // 核心脚本
            const majorScript = func.toString();
            // 组合成worker脚本
            const workerScript = `
      /** 注册数据源 */
      $data={};

      /** 注册函数 */
      ${Object.entries(Object.fromEntries(functions)).reduce((apiScript, [key, funcStr], index, arr) => {
            return (apiScript +
                `${key}=${funcStr};${index !== arr.length - 1 ? "\n" : ""}`);
        }, "")}

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
            worker.postMessage({ action: "init", variables: variablesObject }, Object.values(variablesObject).filter(isTransferables));
            // 监听接收worker线程发的消息
            worker.onmessage = function (e) {
                const data = e.data;
                if (data.action === "message") {
                    if (onMessage)
                        onMessage.call(onMessage, data.message);
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
                                if (error)
                                    reject(error);
                                else
                                    resolve(result);
                            },
                        });
                        worker.postMessage({ action: "execute", index, arguments: args }, args.filter(isTransferables));
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
            };
        };
        const worker = {
            collect: (data) => {
                for (let key in data) {
                    const value = data[key];
                    const type = typeof value;
                    if (type === "function")
                        functions.set(key, value.toString());
                    else
                        variables.set(key, value);
                }
                return worker;
            },
            onMessage: (handler) => {
                onMessage = handler;
                return worker;
            },
            create,
        };
        return worker;
    };
    var assistWorker = createAssistWorker();

    // /** main.js */
    // const numbers = [0, 1, 0, 2];
    // // ① 创建一个worker
    // const worker = new Worker('./worker.js');
    // worker.onmessage = function(event){
    //   const { type, value } = event.data;
    //   if (type === 'sum') console.log(value)
    //   if (type === 'zero-index') console.log(value)
    // };
    // // ② 传递`初始值`和`数值列表`进worker
    // worker.postMessage({ initial: 10, numbers });
    // /** worker.js */
    // onmessage = function(event){
    //   const { initial, numbers } = event.data;
    //   // ③ 算出`数值和`
    //   let sum = initial;
    //   for (let i = 0, len = numbers.length; i < len; i++) {
    //     const num = numbers[i];
    //     sum += num;
    //     // ④ 遍历列表时每次遇到`数值0`时向主线程抛出其所在索引
    //     if (num === 0) postMessage({ type: 'zero-index', value: i });
    //   }
    //   postMessage({ type: 'sum', value: sum });
    // };
    const main = async function () {
        // const worker = assistWorker
        //   .collect({ a, b, c })
        //   .listen(message => {
        //     console.log(message)
        //   })
        //   .script((postMessage, prefix: string) => {
        //     Array.from({ length: 20 }).forEach((i, index) => {
        //       postMessage({ message: '信息', index });
        //     })
        //     return prefix + c('_suffix');
        //   })
        // console.log(await worker('prefix_'));
        // const numbers = [0, 1, 0, 2];
        // // ① 使用封装方法创建worker，无需引用外部文件
        // const worker = assistWorker
        //   // 接收并处理worker线程先主线程发送的数据
        //   .onMessage((message) => console.log(message))
        //   // 收集worker线程中需要用到静态数据整合对象
        //   .collect({ numbers })
        //   // 创建worker，最后一个参数是worker内部可用方法，除此都是动态参数
        //   .create((initial, { postMessage, close }) => {
        //     // ③ 算出数值和
        //     let sum = initial;
        //     for (let i = 0, len = numbers.length; i < len; i++) {
        //       const num = numbers[i];
        //       sum += num;
        //       // ④ 遍历列表时每次遇到数值0时向主线程抛出其所在索引
        //       if (num === 0) postMessage({ type: 'zero-index', value: i });
        //     }
        //     return { type: 'sum', value: sum };
        //   });
        // console.log(await worker.run(/* initial */ 10));
        // console.log(await worker.run(/* initial */ 20));
        // console.log(await worker.run(/* initial */ 30));
        // const worker = assistWorker
        //   .create(async (postMessage, username ) => {
        //     let url = `https://api.github.com/users/${username}`
        //     let res = await fetch(url)
        //     let profile = await res.json()
        //     return profile.name
        //   });
        // console.log(await worker.run('developit'));
        // const sum = (a, b) => a + b;
        // const worker = greenlet(async (sum, a, b) => {
        //     sum(a, b)
        // });
        // console.log(await worker(sum, 1, 2))
        // const worker = assistWorker.create((a, b, { close }) => {
        //   close();
        //   const sum = (a, b) => a + b;
        //   return sum(a, b)
        // });
        // console.log(await worker.run(1, 2))
        // console.log(await worker.run(2, 5))
        const numbers = [1, 2, 3, 4, 5];
        const sum = (arr) => arr.reduce((total, i) => total + i, 0);
        const job = () => {
            console.log(sum(numbers));
        };
        const worker = assistWorker.collect({ numbers, sum }).create(job);
        await worker.run();
    };
    main();

})();
