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
            [t.arrayExpression(args)]
        );
    }

    return {
        visitor: {
            CallExpression(path) {
                let {node} = path;

                if (t.isIdentifier(node.callee, {name: 'importModules'})) {
                    let elements,
                        [modules, chunkName] = node.arguments;

                    if (t.isArrayExpression(modules)) {
                        elements = modules.elements;
                    } else if (t.isStringLiteral(modules)) {
                        elements = [modules];
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
