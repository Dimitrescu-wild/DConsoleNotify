// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const entryFileName = "DConsoleNotify.ts"
// const entryFileName = "index.ts"

module.exports = {
	mode: "production",
	devtool: 'source-map',
	watchOptions: {
		aggregateTimeout: 600,
		ignored: /node_modules/,
		poll: true, // Check for changes every second
		stdin: true,
	},
	entry: './src/scripts/' + entryFileName, // Ваш основной файл TypeScript
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'), // Папка для сгенерированного JavaScript-кода
		library: 'DConsoleNotify',
		libraryTarget: 'umd', // универсальное определение модуля
		umdNamedDefine: true,
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					// Creates `style` nodes from JS strings
					"style-loader",
					// Translates CSS into CommonJS
					"css-loader",
					// Compiles Sass to CSS
					{
						loader: "sass-loader",
						options: {
							// Prefer `dart-sass`
							implementation: require.resolve("sass"),
							sassOptions: {
								includePaths: ['./node_modules'],
							},
						},
					},
				],
			},
		]
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	devServer: {
		hot: true,
		static: {
			directory: path.join(__dirname), // Папка, из которой будет обслуживаться сервер
			alias: {
				"@": path.resolve(__dirname, 'src/'),
			},
		},
		client: {
			progress: true,
		},
		compress: true,
		port: 8354
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: {
						comments: false, // Убираем комментарии
					},
				},
			}),
		],
	},
};