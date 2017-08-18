const generate = require('babel-generator').default;
const parse = require('babylon').parse;

module.exports = function (options) {
    const t = options.types;

    function generateImportString(path, chunkName) {
        if (chunkName) {
            return `i(/* webpackChunkName: "${chunkName.value}" */ "${path.value}")`;
        } else {
            return `i("${path.value}")`;
        }
    }

    function generateImport(path, chunkName) {
        const ast = parse(generateImportString(path, chunkName));
        const callExpression = ast.program.body[0].expression;
        const args = callExpression.arguments;

        return t.callExpression(t.import(), args);
    }

    function generateImportsString(paths, chunkName) {
        return `Promise.all([
            ${paths.map(path => generateImportString(path, chunkName))}
        ])`;
    }

    function generateImports(paths, chunkName) {
        const ast = parse(generateImportsString(paths, chunkName));
        const callExpression = ast.program.body[0].expression;
        const promises = callExpression.arguments[0].elements;

        const args = promises.map(promise => t.callExpression(t.import(), promise.arguments))

        return t.callExpression(
            t.memberExpression(
                t.identifier('Promise'),
                t.identifier('all')
            ),
            [t.arrayExpression(args)]
        );
    }

    return {
        visitor: {
            CallExpression(path) {
                const node = path.node;

                if (t.isIdentifier(node.callee, {name: 'importModules'})) {
                    const elements = [],
                        modules = node.arguments[0],
                        chunkName = node.arguments[1];

                    if (t.isArrayExpression(modules)) {
                        modules.elements.forEach(el => elements.push(el));
                    } else if (t.isStringLiteral(modules)) {
                        elements.push(modules);
                    } else {
                        throw new Error('Invalid importModules() syntax');
                    }

                    if (elements.length === 0) {
                        path.remove();
                    } else if (elements.length === 1) {
                        path.replaceWith(generateImport(elements[0], chunkName));
                    } else {
                        path.replaceWith(generateImports(elements, chunkName));
                    }
                }

            }
        }
    }

}
;
