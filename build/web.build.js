import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const config = {
  input: 'src/web/index.ts',
  output: [
    {
      file: 'public/index.js',
      format: 'iife'
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      declaration: false
    }),
    babel({
      babelHelpers: 'bundled'
    }),
    serve({
      open: true,
      contentBase: 'public/',
      port: 8080,
      verbose: false
    }),
    livereload({
      watch: ['public'],
      verbose: false
    })
  ]
};

export default config;
