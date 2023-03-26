import greenlet from "greenlet";
import assistWorker from "../index";

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
  const a = "a_Value";
  const b = (firstSuffix: string) => {
    return a + firstSuffix;
  };
  const c = (secondSuffix: string) => {
    // @ts-ignore
    importScripts(
      "https://cdnjs.cloudflare.com/ajax/libs/memoizejs/0.1.1/memoize.min.js"
    );
    return b("_suffix") + secondSuffix;
  };

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
