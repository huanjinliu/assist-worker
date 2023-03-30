import { createWorker } from '../index';

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

  const worker = createWorker(function(assist) {
    // assist.collect({ numbers });

    // assist.onMessage = (message: any) => console.log(message);

    return async (initial: number) => {
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
