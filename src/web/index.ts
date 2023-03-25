import assistWorker from '../index';

const main = function () {
  const a = 'a_Value';
  const b = 'b_Value';
  const c = 'c_Value';
  const d = (suffix: string) => {
    console.log('d_Value');
    return c + suffix;
  };

  const worker = assistWorker
    .collect({ a, b })
    .request({ d })
    .execute(() => {
      console.log(globalThis);
      console.log(a);
      console.log(b);
      console.log(d('_suffix'));
    })

  console.log(worker());
}

main();
