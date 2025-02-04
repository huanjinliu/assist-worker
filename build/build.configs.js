import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import pkg from '../package.json' assert { type: 'json' };

const config = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.brower,
      format: 'umd',
      name: 'assistWorker',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    clear({
      targets: ['dist'],
      watch: process.env.ROLLUP_WATCH === 'true',
    }),
    resolve(),
    commonjs(),
    typescript({
      exclude: ['src/example/**/*'],
    }),
    babel({
      babelHelpers: 'bundled',
    }),
    terser(),
  ],
};

export default config;
