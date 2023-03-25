import baseBuild from './build/base.build.js';
import webBuild from './build/web.build.js';

/**
 * 打包队列
 */
const buildQueue = [baseBuild];

if (process.env.NODE_ENV === 'development') buildQueue.push(webBuild);

export default buildQueue;
