import buildConfigs from './build/build.configs.js';
import devBuildConfigs from './build/dev.configs.js';

/**
 * 打包队列
 */
const buildQueue = [buildConfigs];

if (process.env.NODE_ENV === 'development') buildQueue.push(devBuildConfigs);

export default buildQueue;
