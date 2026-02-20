import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/glass-cards.ts',
  output: {
    file: 'dist/glass-cards.js',
    format: 'es',
    sourcemap: !production,
  },
  plugins: [
    resolve(),
    typescript(),
    production && terser({
      format: { comments: false },
    }),
  ],
};
