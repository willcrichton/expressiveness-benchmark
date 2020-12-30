const path = require('path');
const version = require('./package.json').version;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Custom webpack rules
const rules = (ts_dir) => [
  { test: /\.tsx?$/, use: [{
    loader: 'ts-loader', options: {compilerOptions: {outDir: ts_dir}}}]},
  { test: /\.js$/, loader: 'source-map-loader' },
  { test: /\.css$/, use:
    ts_dir != 'lib' ? [MiniCssExtractPlugin.loader, 'css-loader']
      : ['style-loader', 'css-loader']},
  { test: /\.ttf$/, use: ['file-loader'] }
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = ['@jupyter-widgets/base'];

const resolve = {
  // Add '.ts' and '.tsx' as resolvable extensions.
  extensions: [".webpack.js", ".web.js", ".ts", ".js", ".tsx"]
};

module.exports = [
  /**
   * Notebook extension
   *
   * This bundle only contains the part of the JavaScript that is run on load of
   * the notebook.
   */
  {
    entry: './src/extension.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'code_widget', 'nbextension', 'static'),
      libraryTarget: 'amd'
    },
    module: {
      rules: rules('lib')
    },
    devtool: 'source-map',
    externals,
    resolve,
  },

  {
    entry: './src/editor.tsx',
    output: {
      filename: 'editor.js',
      path: path.resolve(__dirname, '..', 'components', 'editor'),
      libraryTarget: 'commonjs'
    },
    module: { rules: rules('../components/editor') },
    devtool: 'source-map',
    externals: {
      'react': 'react',
      'lodash': 'lodash',
    },
    plugins: [new MiniCssExtractPlugin()],
    resolve
  }

  /**
   * Embeddable code_widget bundle
   *
   * This bundle is almost identical to the notebook extension bundle. The only
   * difference is in the configuration of the webpack public path for the
   * static assets.
   *
   * The target bundle is always `dist/index.js`, which is the path required by
   * the custom widget embedder.
   */
  /* {
    entry: './src/index.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'amd',
      library: "code_widget",
      publicPath: 'https://unpkg.com/code_widget@' + version + '/dist/'
    },
    devtool: 'source-map',
    module: {
      rules: rules
    },
    externals,
    resolve,
  }, */


  /**
   * Documentation widget bundle
   *
   * This bundle is used to embed widgets in the package documentation.
   */
  /* {
    entry: './src/index.ts',
    output: {
      filename: 'embed-bundle.js',
      path: path.resolve(__dirname, 'docs', 'source', '_static'),
      library: "code_widget",
      libraryTarget: 'amd'
    },
    module: {
      rules: rules
    },
    devtool: 'source-map',
    externals,
    resolve,
  } */

];
