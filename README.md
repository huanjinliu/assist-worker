## AssistWorker

> providing minimal APIs to allow you to use Web Workers more flexibly in your code.

### Installation

```shell
npm i -S assist-worker
```

### Usage

#### [create(job)](https://github.com/huanjinliu/assist-worker#assist-worker)

create and initialize `worker` threads。

`@param {function} job - the function that needs to be put into the worker thread to execute`

`@returns {object} the object used to control worker thread execution and thread shutdown`

**Example**

```js
import assistWorker from "assist-worker";

const job = (param, workerMethods) => {
  console.log(param); // PARAM TO WORKER
};

const worker = assistWorker.create(job);

// execute the job in the worker thread
await worker.run('PARAM TO WORKER');

// shutdown worker thread
await worker.terminate();
```

#### [onMessage(callback)](https://github.com/huanjinliu/assist-worker#assist-worker)

receive and process the message sent by the worker thread。

`@param {function} callback - the callback for the worker thread to send information to the main thread`

`@returns {object} assistWorker`

**Example**

```js
import assistWorker from "assist-worker";

const job = (workerMethods) => {
  // take out the method in the object containing the worker thread internal control method
  const { postMessage } = workerMethods;
  // send message to the main thread
  postMessage('MESSAGE TO MAIN')
};

const worker = assistWorker
  // the main thread receives and processes message
  .onMessage((message) => {
      console.log(message); // MESSAGE TO MAIN
  })
  .create(job);

await worker.run();
```

#### [collect(data)](https://github.com/huanjinliu/assist-worker#assist-worker)

collect the main thread data that needs to be used in the worker thread. 

the field name of the data must be consistent with the name used in the worker hread.

`@param {object} data - the main thread data used in the worker thread`

`@returns {object} assistWorker`

**Example**

```js
import assistWorker from "assist-worker";

const numbers = [1, 2, 3, 4, 5];
const sum = (arr) => arr.reduce((total, i) => total + i, 0);

const worker = assistWorker
  .collect({ numbers, sum })
  .create(() => {
    console.log(sum(numbers)); // 15
  });

await worker.run();
```

**❗Caveat**

the data collected here only supports [serializable data](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) limited by `web workers` itself。

However, functions are supported here, but it is necessary to ensure that the main thread variables referenced in the function body are also collected, for example:

```js
...
const id = 1;

const test = () => {
  console.log(id);
});

assistWorker.collect({ test })     // ✖️ ReferenceError: id is not defined
assistWorker.collect({ id, test }) // ✔️
...
```
