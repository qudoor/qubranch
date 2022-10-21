/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const withDefaults = require('../shared.webpack.config');

module.exports = withDefaults({
	context: __dirname,
	entry: {
		extension: './src/extension.ts',
	},
	output: {
		filename: 'extension.js',
	},
	externals: {
		fsevents: "require('fsevents')"
	},
	resolve: {
		mainFields: ['module', 'main'],
		extensions: ['.ts', '.js'] // support ts-files and js-files
	}
});