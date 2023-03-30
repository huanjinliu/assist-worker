
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
  'use strict';

  // 获取函数的参数
  const getParameters = (fn) => {
      if (typeof fn !== 'function')
          return [];
      // 获取代码片段
      const fnStr = fn
          .toString()
          // 移除注释
          .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '')
          .trim();
      // 根据函数类型（普通/箭头）使用不同的匹配方法匹配参数配置片段
      const args = fnStr.match(fnStr.startsWith('function')
          // 普通函数
          ? /^function.*?\(([^)]*)\)/
          // 箭头函数
          : /^\(?([^)]*)\)?.*?=>/);
      if (!args)
          return [];
      return args[1]
          .split(',')
          .map((arg) => arg.replace(/\/\*.*\*\//, '').trim())
          .filter(Boolean);
  };
  const createWorker = (creator) => {
      const [assistName] = getParameters(creator);
      console.log(assistName);
  };

  const main = async function () {
      const numbers = [0, 1, 0, 2];
      // // ① 使用封装方法创建worker，无需引用外部文件
      // const worker = assistWorker
      //   // 接收并处理worker线程先主线程发送的数据
      //   .onMessage((message: any) => console.log(message))
      //   // 收集worker线程中需要用到静态数据整合对象
      //   .collect({ numbers })
      //   // 创建worker，最后一个参数是worker内部可用方法，除此都是动态参数
      //   .create(async (initial: number, { postMessage, close }) => {
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
      createWorker(function (assist) {
          // assist.collect({ numbers });
          // assist.onMessage = (message: any) => console.log(message);
          return async (initial) => {
              // ③ 算出数值和
              let sum = initial;
              for (let i = 0, len = numbers.length; i < len; i++) {
                  const num = numbers[i];
                  sum += num;
                  // ④ 遍历列表时每次遇到数值0时向主线程抛出其所在索引
                  // if (num === 0) assist.postMessage({ type: 'zero-index', value: i });
              }
              return { type: 'sum', value: sum };
          };
      });
      // worker.run(/* initial */ 10);
  };
  main();

})();
