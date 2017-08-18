## babel-plugin-webpack-named-dynamic-imports [![Build Status][1]][2]

[1]: https://travis-ci.org/jakwuh/babel-plugin-extract-dependency-definitions.svg?branch=master
[2]: https://travis-ci.org/jakwuh/babel-plugin-extract-dependency-definitions

A babel plugin which implements a better syntax for `webpack@2+` dynamic imports.

### Usage

Install the package:

```bash
npm i babel-plugin-webpack-named-dynamic-imports --save
```

And enable it in a babel config:

```js
{
    "plugins": [
        "webpack-named-dynamic-imports"
    ]
}
```

Now you can use the following syntax to dynamically import modules:

```js
// unnamed chunk w/ exactly 1 module
importModules('./a.js');

// named chunk w/ exactly 1 module
importModules('./a.js', 'named-chunk-1')

// unnamed chunk containing multiple modules
importModules([
    './a.js',
    './b.js'
])

// named chunk containing multiple modules
importModules([
    './a.js',
    './b.js'
], 'named-chunk-2')
```

The code above will be transpiled to the following:

```js
import("./a.js");

import( /* webpackChunkName: "named-chunk-1" */"./a.js");

Promise.all([
    import("./a.js"),
    import("./b.js")
]);

Promise.all([
    import( /* webpackChunkName: "named-chunk-2" */"./a.js"),
    import( /* webpackChunkName: "named-chunk-2" */"./b.js")
]);
```
