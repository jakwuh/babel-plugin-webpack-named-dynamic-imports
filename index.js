const generate = require('babel-generator').default;
const {parse} = require('babylon');

module.exports = function ({types: t}) {
    function generateImportString(path, chunkName) {
        if (chunkName) {
            return `i(/* webpackChunkName: "${chunkName.value}" */ "${path.value}")`;
        } else {
            return `i("${path.value}")`;
        }
    }

    function generateImport(path, chunkName) {
        let ast = parse(generateImportString(path, chunkName));
        let callExpression = ast.program.body[0].expression;
        let args = callExpression.arguments;

        return t.callExpression(t.import(), args);
    }

    function generateImportsString(paths, chunkName) {
        return `Promise.all([
            ${paths.map(path => generateImportString(path, chunkName))}
        ])`;
    }

    function generateImports(paths, chunkName) {
        let ast = parse(generateImportsString(paths, chunkName));
        let callExpression = ast.program.body[0].expression;
        let promises = callExpression.arguments[0].elements;

        let args = promises.map(promise => t.callExpression(t.import(), promise.arguments))

        return t.callExpression(
            t.memberExpression(
                t.identifier('Promise'),
                t.identifier('all')
            ),
            args
        );
    }

    return {
        visitor: {
            CallExpression(path) {
                let {node} = path;

                if (t.isIdentifier(node.callee, {name: 'importModules'})) {
                    let [modules, chunkName] = node.arguments;

                    if (t.isArrayExpression(modules)) {
                        path.replaceWith(generateImports(modules.elements, chunkName));
                        console.log(generate(generateImports(modules.elements, chunkName)).code);
                    } else if (t.isStringLiteral(modules)) {
                        path.replaceWith(generateImport(modules, chunkName));
                    } else {
                        throw new Error('Invalid importModules() syntax');
                    }
                }

            }
        }
    }

}
;
