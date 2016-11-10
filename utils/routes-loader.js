'use strict';

/**
 * React Static Boilerplate
 * https://github.com/kriasoft/react-static-boilerplate
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

var toRegExp = require('path-to-regexp');

function escape(text) {
  return text.replace('\'', '\\\'').replace('\\', '\\\\');
}

/**
 * Converts application routes from JSON to JavaScript. For example, a route like
 *
 *   {
 *     "path": "/about",
 *     "page": "./pages/about"
 *   }
 *
 * becomes
 *
 *   {
 *     path: '/about',
 *     pattern: /^\\/about(?:\/(?=$))?$/i,
 *     keys: [],
 *     page: './pages/about',
 *     load: function () { return new Promise(resolve => require(['./pages/about'], resolve)); }
 *   }
 */
module.exports = function routesLoader(source) {
  this.cacheable();

  var output = ['[\n'];
  var routes = JSON.parse(source);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var route = _step.value;

      var keys = [];
      var pattern = toRegExp(route.path, keys);
      var require = route.chunk && route.chunk === 'main' ? function (module) {
        return 'Promise.resolve(require(\'' + escape(module) + '\').default)';
      } : function (module) {
        return 'new Promise(function (resolve, reject) {\n        try {\n          require.ensure([\'' + escape(module) + '\'], function (require) {\n            resolve(require(\'' + escape(module) + '\').default);\n          }' + (typeof route.chunk === 'string' ? ', \'' + escape(route.chunk) + '\'' : '') + ');\n        } catch (err) {\n          reject(err);\n        }\n      })';
      };
      output.push('  {\n');
      output.push('    path: \'' + escape(route.path) + '\',\n');
      output.push('    pattern: ' + pattern.toString() + ',\n');
      output.push('    keys: ' + JSON.stringify(keys) + ',\n');
      output.push('    page: \'' + escape(route.page) + '\',\n');
      if (route.data) {
        output.push('    data: ' + JSON.stringify(route.data) + ',\n');
      }
      output.push('    load() {\n      return ' + require(route.page) + ';\n    },\n');
      output.push('  },\n');
    };

    for (var _iterator = routes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  output.push(']');

  return 'module.exports = ' + output.join('') + ';';
};