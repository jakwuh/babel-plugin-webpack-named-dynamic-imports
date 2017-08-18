
const babel = require('babel-core');
const assert = require('assert');
const diff =  require('diff');
const chalk = require('chalk');

const input = `
importModules('./a.js');

importModules('./a.js', 'named-chunk-1');

importModules(['./a.js', './b.js']);

importModules(['./a.js', './b.js'], 'named-chunk-2');
`

const output = `
import("./a.js");

import( /* webpackChunkName: "named-chunk-1" */"./a.js");

Promise.all([import("./a.js"), import("./b.js")]);

Promise.all([import( /* webpackChunkName: "named-chunk-2" */"./a.js"), import( /* webpackChunkName: "named-chunk-2" */"./b.js")]);
`;

const transformedCode = babel.transform(input, {
    plugins: [
        './'
    ]
}).code;

const diffArr = diff.diffChars(transformedCode, output);

let failed = false;
for (let {removed, added, value} of diffArr) {
    let color = removed ? 'red': (added ? 'green' : 'white');
    process.stdout.write(chalk[color](value));
    failed = failed || removed;
}

if (failed) {
    console.error(chalk.bold.red('\nTest failed.\n'));
    process.exit(1);
} else {
    console.info(chalk.bold.green('\nTest passed.\n'));
    process.exit(0);
}
