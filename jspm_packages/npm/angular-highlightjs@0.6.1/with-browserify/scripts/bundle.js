/* */ 
"format cjs";
(function(Buffer, process) {
  (function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == "function" && require;
          if (!u && a)
            return a(o, !0);
          if (i)
            return i(o, !0);
          var f = new Error("Cannot find module '" + o + "'");
          throw f.code = "MODULE_NOT_FOUND", f;
        }
        var l = n[o] = {exports: {}};
        t[o][0].call(l.exports, function(e) {
          var n = t[o][1][e];
          return s(n ? n : e);
        }, l, l.exports, e, t, n, r);
      }
      return n[o].exports;
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++)
      s(r[o]);
    return s;
  })({
    1: [function(require, module, exports) {
      (function(root, factory) {
        if (typeof exports === "object" || (typeof module === "object" && module.exports)) {
          module.exports = factory(require('angular'), require('highlight.js'));
        } else if (typeof define === "function" && define.amd) {
          define(["angular", "hljs"], factory);
        } else {
          root.returnExports = factory(root.angular, root.hljs);
        }
      }(this, function(angular, hljs) {
        function shouldHighlightStatics(attrs) {
          var should = true;
          angular.forEach(['source', 'include'], function(name) {
            if (attrs[name]) {
              should = false;
            }
          });
          return should;
        }
        var ngModule = angular.module('hljs', []);
        ngModule.provider('hljsService', function() {
          var _hljsOptions = {};
          return {
            setOptions: function(options) {
              angular.extend(_hljsOptions, options);
            },
            getOptions: function() {
              return angular.copy(_hljsOptions);
            },
            $get: function() {
              (hljs.configure || angular.noop)(_hljsOptions);
              return hljs;
            }
          };
        });
        ngModule.factory('hljsCache', ['$cacheFactory', function($cacheFactory) {
          return $cacheFactory('hljsCache');
        }]);
        ngModule.controller('HljsCtrl', ['hljsCache', 'hljsService', function HljsCtrl(hljsCache, hljsService) {
          var ctrl = this;
          var _elm = null,
              _lang = null,
              _code = null,
              _hlCb = null;
          ctrl.init = function(codeElm) {
            _elm = codeElm;
          };
          ctrl.setLanguage = function(lang) {
            _lang = lang;
            if (_code) {
              ctrl.highlight(_code);
            }
          };
          ctrl.highlightCallback = function(cb) {
            _hlCb = cb;
          };
          ctrl.highlight = function(code) {
            if (!_elm) {
              return;
            }
            var res,
                cacheKey;
            _code = code;
            if (_lang) {
              cacheKey = ctrl._cacheKey(_lang, _code);
              res = hljsCache.get(cacheKey);
              if (!res) {
                res = hljsService.highlight(_lang, hljsService.fixMarkup(_code), true);
                hljsCache.put(cacheKey, res);
              }
            } else {
              cacheKey = ctrl._cacheKey(_code);
              res = hljsCache.get(cacheKey);
              if (!res) {
                res = hljsService.highlightAuto(hljsService.fixMarkup(_code));
                hljsCache.put(cacheKey, res);
              }
            }
            _elm.html(res.value);
            _elm.addClass(res.language);
            if (_hlCb !== null && angular.isFunction(_hlCb)) {
              _hlCb();
            }
          };
          ctrl.clear = function() {
            if (!_elm) {
              return;
            }
            _code = null;
            _elm.text('');
          };
          ctrl.release = function() {
            _elm = null;
          };
          ctrl._cacheKey = function() {
            var args = Array.prototype.slice.call(arguments),
                glue = "!angular-highlightjs!";
            return args.join(glue);
          };
        }]);
        var hljsDir,
            languageDirFactory,
            sourceDirFactory,
            includeDirFactory;
        hljsDir = ['$compile', '$parse', function($compile, $parse) {
          return {
            restrict: 'EA',
            controller: 'HljsCtrl',
            compile: function(tElm, tAttrs, transclude) {
              var staticHTML = tElm[0].innerHTML.replace(/^(\r\n|\r|\n)/m, ''),
                  staticText = tElm[0].textContent.replace(/^(\r\n|\r|\n)/m, '');
              tElm.html('<pre><code class="hljs"></code></pre>');
              return function postLink(scope, iElm, iAttrs, ctrl) {
                var compileCheck,
                    escapeCheck;
                if (angular.isDefined(iAttrs.compile)) {
                  compileCheck = $parse(iAttrs.compile);
                }
                if (angular.isDefined(iAttrs.escape)) {
                  escapeCheck = $parse(iAttrs.escape);
                } else if (angular.isDefined(iAttrs.noEscape)) {
                  escapeCheck = $parse('false');
                }
                ctrl.init(iElm.find('code'));
                if (iAttrs.onhighlight) {
                  ctrl.highlightCallback(function() {
                    scope.$eval(iAttrs.onhighlight);
                  });
                }
                if ((staticHTML || staticText) && shouldHighlightStatics(iAttrs)) {
                  var code;
                  if (escapeCheck && !escapeCheck(scope)) {
                    code = staticText;
                  } else {
                    code = staticHTML;
                  }
                  ctrl.highlight(code);
                  if (compileCheck && compileCheck(scope)) {
                    $compile(iElm.find('code').contents())(scope);
                  }
                }
                scope.$on('$destroy', function() {
                  ctrl.release();
                });
              };
            }
          };
        }];
        languageDirFactory = function(dirName) {
          return [function() {
            return {
              require: '?hljs',
              restrict: 'A',
              link: function(scope, iElm, iAttrs, ctrl) {
                if (!ctrl) {
                  return;
                }
                iAttrs.$observe(dirName, function(lang) {
                  if (angular.isDefined(lang)) {
                    ctrl.setLanguage(lang);
                  }
                });
              }
            };
          }];
        };
        sourceDirFactory = function(dirName) {
          return ['$compile', '$parse', function($compile, $parse) {
            return {
              require: '?hljs',
              restrict: 'A',
              link: function(scope, iElm, iAttrs, ctrl) {
                var compileCheck;
                if (!ctrl) {
                  return;
                }
                if (angular.isDefined(iAttrs.compile)) {
                  compileCheck = $parse(iAttrs.compile);
                }
                scope.$watch(iAttrs[dirName], function(newCode, oldCode) {
                  if (newCode) {
                    ctrl.highlight(newCode);
                    if (compileCheck && compileCheck(scope)) {
                      $compile(iElm.find('code').contents())(scope);
                    }
                  } else {
                    ctrl.clear();
                  }
                });
              }
            };
          }];
        };
        includeDirFactory = function(dirName) {
          return ['$http', '$templateCache', '$q', '$compile', '$parse', function($http, $templateCache, $q, $compile, $parse) {
            return {
              require: '?hljs',
              restrict: 'A',
              compile: function(tElm, tAttrs, transclude) {
                var srcExpr = tAttrs[dirName];
                return function postLink(scope, iElm, iAttrs, ctrl) {
                  var changeCounter = 0,
                      compileCheck;
                  if (!ctrl) {
                    return;
                  }
                  if (angular.isDefined(iAttrs.compile)) {
                    compileCheck = $parse(iAttrs.compile);
                  }
                  scope.$watch(srcExpr, function(src) {
                    var thisChangeId = ++changeCounter;
                    if (src && angular.isString(src)) {
                      var templateCachePromise,
                          dfd;
                      templateCachePromise = $templateCache.get(src);
                      if (!templateCachePromise) {
                        dfd = $q.defer();
                        $http.get(src, {
                          cache: $templateCache,
                          transformResponse: function(data, headersGetter) {
                            return data;
                          }
                        }).success(function(code) {
                          if (thisChangeId !== changeCounter) {
                            return;
                          }
                          dfd.resolve(code);
                        }).error(function() {
                          if (thisChangeId === changeCounter) {
                            ctrl.clear();
                          }
                          dfd.resolve();
                        });
                        templateCachePromise = dfd.promise;
                      }
                      $q.when(templateCachePromise).then(function(code) {
                        if (!code) {
                          return;
                        }
                        if (angular.isArray(code)) {
                          code = code[1];
                        } else if (angular.isObject(code)) {
                          code = code.data;
                        }
                        code = code.replace(/^(\r\n|\r|\n)/m, '');
                        ctrl.highlight(code);
                        if (compileCheck && compileCheck(scope)) {
                          $compile(iElm.find('code').contents())(scope);
                        }
                      });
                    } else {
                      ctrl.clear();
                    }
                  });
                };
              }
            };
          }];
        };
        ngModule.directive('hljs', hljsDir).directive('language', languageDirFactory('language')).directive('source', sourceDirFactory('source')).directive('include', includeDirFactory('include'));
        return "hljs";
      }));
    }, {
      "angular": 3,
      "highlight.js": 5
    }],
    2: [function(require, module, exports) {
      (function(window, document, undefined) {
        'use strict';
        function minErr(module, ErrorConstructor) {
          ErrorConstructor = ErrorConstructor || Error;
          return function() {
            var SKIP_INDEXES = 2;
            var templateArgs = arguments,
                code = templateArgs[0],
                message = '[' + (module ? module + ':' : '') + code + '] ',
                template = templateArgs[1],
                paramPrefix,
                i;
            message += template.replace(/\{\d+\}/g, function(match) {
              var index = +match.slice(1, -1),
                  shiftedIndex = index + SKIP_INDEXES;
              if (shiftedIndex < templateArgs.length) {
                return toDebugString(templateArgs[shiftedIndex]);
              }
              return match;
            });
            message += '\nhttp://errors.angularjs.org/1.4.3/' + (module ? module + '/' : '') + code;
            for (i = SKIP_INDEXES, paramPrefix = '?'; i < templateArgs.length; i++, paramPrefix = '&') {
              message += paramPrefix + 'p' + (i - SKIP_INDEXES) + '=' + encodeURIComponent(toDebugString(templateArgs[i]));
            }
            return new ErrorConstructor(message);
          };
        }
        var REGEX_STRING_REGEXP = /^\/(.+)\/([a-z]*)$/;
        var VALIDITY_STATE_PROPERTY = 'validity';
        var lowercase = function(string) {
          return isString(string) ? string.toLowerCase() : string;
        };
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var uppercase = function(string) {
          return isString(string) ? string.toUpperCase() : string;
        };
        var manualLowercase = function(s) {
          return isString(s) ? s.replace(/[A-Z]/g, function(ch) {
            return String.fromCharCode(ch.charCodeAt(0) | 32);
          }) : s;
        };
        var manualUppercase = function(s) {
          return isString(s) ? s.replace(/[a-z]/g, function(ch) {
            return String.fromCharCode(ch.charCodeAt(0) & ~32);
          }) : s;
        };
        if ('i' !== 'I'.toLowerCase()) {
          lowercase = manualLowercase;
          uppercase = manualUppercase;
        }
        var msie,
            jqLite,
            jQuery,
            slice = [].slice,
            splice = [].splice,
            push = [].push,
            toString = Object.prototype.toString,
            getPrototypeOf = Object.getPrototypeOf,
            ngMinErr = minErr('ng'),
            angular = window.angular || (window.angular = {}),
            angularModule,
            uid = 0;
        msie = document.documentMode;
        function isArrayLike(obj) {
          if (obj == null || isWindow(obj)) {
            return false;
          }
          var length = "length" in Object(obj) && obj.length;
          if (obj.nodeType === NODE_TYPE_ELEMENT && length) {
            return true;
          }
          return isString(obj) || isArray(obj) || length === 0 || typeof length === 'number' && length > 0 && (length - 1) in obj;
        }
        function forEach(obj, iterator, context) {
          var key,
              length;
          if (obj) {
            if (isFunction(obj)) {
              for (key in obj) {
                if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
                  iterator.call(context, obj[key], key, obj);
                }
              }
            } else if (isArray(obj) || isArrayLike(obj)) {
              var isPrimitive = typeof obj !== 'object';
              for (key = 0, length = obj.length; key < length; key++) {
                if (isPrimitive || key in obj) {
                  iterator.call(context, obj[key], key, obj);
                }
              }
            } else if (obj.forEach && obj.forEach !== forEach) {
              obj.forEach(iterator, context, obj);
            } else if (isBlankObject(obj)) {
              for (key in obj) {
                iterator.call(context, obj[key], key, obj);
              }
            } else if (typeof obj.hasOwnProperty === 'function') {
              for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                  iterator.call(context, obj[key], key, obj);
                }
              }
            } else {
              for (key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                  iterator.call(context, obj[key], key, obj);
                }
              }
            }
          }
          return obj;
        }
        function forEachSorted(obj, iterator, context) {
          var keys = Object.keys(obj).sort();
          for (var i = 0; i < keys.length; i++) {
            iterator.call(context, obj[keys[i]], keys[i]);
          }
          return keys;
        }
        function reverseParams(iteratorFn) {
          return function(value, key) {
            iteratorFn(key, value);
          };
        }
        function nextUid() {
          return ++uid;
        }
        function setHashKey(obj, h) {
          if (h) {
            obj.$$hashKey = h;
          } else {
            delete obj.$$hashKey;
          }
        }
        function baseExtend(dst, objs, deep) {
          var h = dst.$$hashKey;
          for (var i = 0,
              ii = objs.length; i < ii; ++i) {
            var obj = objs[i];
            if (!isObject(obj) && !isFunction(obj))
              continue;
            var keys = Object.keys(obj);
            for (var j = 0,
                jj = keys.length; j < jj; j++) {
              var key = keys[j];
              var src = obj[key];
              if (deep && isObject(src)) {
                if (isDate(src)) {
                  dst[key] = new Date(src.valueOf());
                } else {
                  if (!isObject(dst[key]))
                    dst[key] = isArray(src) ? [] : {};
                  baseExtend(dst[key], [src], true);
                }
              } else {
                dst[key] = src;
              }
            }
          }
          setHashKey(dst, h);
          return dst;
        }
        function extend(dst) {
          return baseExtend(dst, slice.call(arguments, 1), false);
        }
        function merge(dst) {
          return baseExtend(dst, slice.call(arguments, 1), true);
        }
        function toInt(str) {
          return parseInt(str, 10);
        }
        function inherit(parent, extra) {
          return extend(Object.create(parent), extra);
        }
        function noop() {}
        noop.$inject = [];
        function identity($) {
          return $;
        }
        identity.$inject = [];
        function valueFn(value) {
          return function() {
            return value;
          };
        }
        function hasCustomToString(obj) {
          return isFunction(obj.toString) && obj.toString !== Object.prototype.toString;
        }
        function isUndefined(value) {
          return typeof value === 'undefined';
        }
        function isDefined(value) {
          return typeof value !== 'undefined';
        }
        function isObject(value) {
          return value !== null && typeof value === 'object';
        }
        function isBlankObject(value) {
          return value !== null && typeof value === 'object' && !getPrototypeOf(value);
        }
        function isString(value) {
          return typeof value === 'string';
        }
        function isNumber(value) {
          return typeof value === 'number';
        }
        function isDate(value) {
          return toString.call(value) === '[object Date]';
        }
        var isArray = Array.isArray;
        function isFunction(value) {
          return typeof value === 'function';
        }
        function isRegExp(value) {
          return toString.call(value) === '[object RegExp]';
        }
        function isWindow(obj) {
          return obj && obj.window === obj;
        }
        function isScope(obj) {
          return obj && obj.$evalAsync && obj.$watch;
        }
        function isFile(obj) {
          return toString.call(obj) === '[object File]';
        }
        function isFormData(obj) {
          return toString.call(obj) === '[object FormData]';
        }
        function isBlob(obj) {
          return toString.call(obj) === '[object Blob]';
        }
        function isBoolean(value) {
          return typeof value === 'boolean';
        }
        function isPromiseLike(obj) {
          return obj && isFunction(obj.then);
        }
        var TYPED_ARRAY_REGEXP = /^\[object (Uint8(Clamped)?)|(Uint16)|(Uint32)|(Int8)|(Int16)|(Int32)|(Float(32)|(64))Array\]$/;
        function isTypedArray(value) {
          return TYPED_ARRAY_REGEXP.test(toString.call(value));
        }
        var trim = function(value) {
          return isString(value) ? value.trim() : value;
        };
        var escapeForRegexp = function(s) {
          return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
        };
        function isElement(node) {
          return !!(node && (node.nodeName || (node.prop && node.attr && node.find)));
        }
        function makeMap(str) {
          var obj = {},
              items = str.split(","),
              i;
          for (i = 0; i < items.length; i++) {
            obj[items[i]] = true;
          }
          return obj;
        }
        function nodeName_(element) {
          return lowercase(element.nodeName || (element[0] && element[0].nodeName));
        }
        function includes(array, obj) {
          return Array.prototype.indexOf.call(array, obj) != -1;
        }
        function arrayRemove(array, value) {
          var index = array.indexOf(value);
          if (index >= 0) {
            array.splice(index, 1);
          }
          return index;
        }
        function copy(source, destination, stackSource, stackDest) {
          if (isWindow(source) || isScope(source)) {
            throw ngMinErr('cpws', "Can't copy! Making copies of Window or Scope instances is not supported.");
          }
          if (isTypedArray(destination)) {
            throw ngMinErr('cpta', "Can't copy! TypedArray destination cannot be mutated.");
          }
          if (!destination) {
            destination = source;
            if (isObject(source)) {
              var index;
              if (stackSource && (index = stackSource.indexOf(source)) !== -1) {
                return stackDest[index];
              }
              if (isArray(source)) {
                return copy(source, [], stackSource, stackDest);
              } else if (isTypedArray(source)) {
                destination = new source.constructor(source);
              } else if (isDate(source)) {
                destination = new Date(source.getTime());
              } else if (isRegExp(source)) {
                destination = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
                destination.lastIndex = source.lastIndex;
              } else {
                var emptyObject = Object.create(getPrototypeOf(source));
                return copy(source, emptyObject, stackSource, stackDest);
              }
              if (stackDest) {
                stackSource.push(source);
                stackDest.push(destination);
              }
            }
          } else {
            if (source === destination)
              throw ngMinErr('cpi', "Can't copy! Source and destination are identical.");
            stackSource = stackSource || [];
            stackDest = stackDest || [];
            if (isObject(source)) {
              stackSource.push(source);
              stackDest.push(destination);
            }
            var result,
                key;
            if (isArray(source)) {
              destination.length = 0;
              for (var i = 0; i < source.length; i++) {
                destination.push(copy(source[i], null, stackSource, stackDest));
              }
            } else {
              var h = destination.$$hashKey;
              if (isArray(destination)) {
                destination.length = 0;
              } else {
                forEach(destination, function(value, key) {
                  delete destination[key];
                });
              }
              if (isBlankObject(source)) {
                for (key in source) {
                  destination[key] = copy(source[key], null, stackSource, stackDest);
                }
              } else if (source && typeof source.hasOwnProperty === 'function') {
                for (key in source) {
                  if (source.hasOwnProperty(key)) {
                    destination[key] = copy(source[key], null, stackSource, stackDest);
                  }
                }
              } else {
                for (key in source) {
                  if (hasOwnProperty.call(source, key)) {
                    destination[key] = copy(source[key], null, stackSource, stackDest);
                  }
                }
              }
              setHashKey(destination, h);
            }
          }
          return destination;
        }
        function shallowCopy(src, dst) {
          if (isArray(src)) {
            dst = dst || [];
            for (var i = 0,
                ii = src.length; i < ii; i++) {
              dst[i] = src[i];
            }
          } else if (isObject(src)) {
            dst = dst || {};
            for (var key in src) {
              if (!(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                dst[key] = src[key];
              }
            }
          }
          return dst || src;
        }
        function equals(o1, o2) {
          if (o1 === o2)
            return true;
          if (o1 === null || o2 === null)
            return false;
          if (o1 !== o1 && o2 !== o2)
            return true;
          var t1 = typeof o1,
              t2 = typeof o2,
              length,
              key,
              keySet;
          if (t1 == t2) {
            if (t1 == 'object') {
              if (isArray(o1)) {
                if (!isArray(o2))
                  return false;
                if ((length = o1.length) == o2.length) {
                  for (key = 0; key < length; key++) {
                    if (!equals(o1[key], o2[key]))
                      return false;
                  }
                  return true;
                }
              } else if (isDate(o1)) {
                if (!isDate(o2))
                  return false;
                return equals(o1.getTime(), o2.getTime());
              } else if (isRegExp(o1)) {
                return isRegExp(o2) ? o1.toString() == o2.toString() : false;
              } else {
                if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) || isArray(o2) || isDate(o2) || isRegExp(o2))
                  return false;
                keySet = createMap();
                for (key in o1) {
                  if (key.charAt(0) === '$' || isFunction(o1[key]))
                    continue;
                  if (!equals(o1[key], o2[key]))
                    return false;
                  keySet[key] = true;
                }
                for (key in o2) {
                  if (!(key in keySet) && key.charAt(0) !== '$' && o2[key] !== undefined && !isFunction(o2[key]))
                    return false;
                }
                return true;
              }
            }
          }
          return false;
        }
        var csp = function() {
          if (isDefined(csp.isActive_))
            return csp.isActive_;
          var active = !!(document.querySelector('[ng-csp]') || document.querySelector('[data-ng-csp]'));
          if (!active) {
            try {
              new Function('');
            } catch (e) {
              active = true;
            }
          }
          return (csp.isActive_ = active);
        };
        var jq = function() {
          if (isDefined(jq.name_))
            return jq.name_;
          var el;
          var i,
              ii = ngAttrPrefixes.length,
              prefix,
              name;
          for (i = 0; i < ii; ++i) {
            prefix = ngAttrPrefixes[i];
            if (el = document.querySelector('[' + prefix.replace(':', '\\:') + 'jq]')) {
              name = el.getAttribute(prefix + 'jq');
              break;
            }
          }
          return (jq.name_ = name);
        };
        function concat(array1, array2, index) {
          return array1.concat(slice.call(array2, index));
        }
        function sliceArgs(args, startIndex) {
          return slice.call(args, startIndex || 0);
        }
        function bind(self, fn) {
          var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
          if (isFunction(fn) && !(fn instanceof RegExp)) {
            return curryArgs.length ? function() {
              return arguments.length ? fn.apply(self, concat(curryArgs, arguments, 0)) : fn.apply(self, curryArgs);
            } : function() {
              return arguments.length ? fn.apply(self, arguments) : fn.call(self);
            };
          } else {
            return fn;
          }
        }
        function toJsonReplacer(key, value) {
          var val = value;
          if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
            val = undefined;
          } else if (isWindow(value)) {
            val = '$WINDOW';
          } else if (value && document === value) {
            val = '$DOCUMENT';
          } else if (isScope(value)) {
            val = '$SCOPE';
          }
          return val;
        }
        function toJson(obj, pretty) {
          if (typeof obj === 'undefined')
            return undefined;
          if (!isNumber(pretty)) {
            pretty = pretty ? 2 : null;
          }
          return JSON.stringify(obj, toJsonReplacer, pretty);
        }
        function fromJson(json) {
          return isString(json) ? JSON.parse(json) : json;
        }
        function timezoneToOffset(timezone, fallback) {
          var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
          return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
        }
        function addDateMinutes(date, minutes) {
          date = new Date(date.getTime());
          date.setMinutes(date.getMinutes() + minutes);
          return date;
        }
        function convertTimezoneToLocal(date, timezone, reverse) {
          reverse = reverse ? -1 : 1;
          var timezoneOffset = timezoneToOffset(timezone, date.getTimezoneOffset());
          return addDateMinutes(date, reverse * (timezoneOffset - date.getTimezoneOffset()));
        }
        function startingTag(element) {
          element = jqLite(element).clone();
          try {
            element.empty();
          } catch (e) {}
          var elemHtml = jqLite('<div>').append(element).html();
          try {
            return element[0].nodeType === NODE_TYPE_TEXT ? lowercase(elemHtml) : elemHtml.match(/^(<[^>]+>)/)[1].replace(/^<([\w\-]+)/, function(match, nodeName) {
              return '<' + lowercase(nodeName);
            });
          } catch (e) {
            return lowercase(elemHtml);
          }
        }
        function tryDecodeURIComponent(value) {
          try {
            return decodeURIComponent(value);
          } catch (e) {}
        }
        function parseKeyValue(keyValue) {
          var obj = {},
              key_value,
              key;
          forEach((keyValue || "").split('&'), function(keyValue) {
            if (keyValue) {
              key_value = keyValue.replace(/\+/g, '%20').split('=');
              key = tryDecodeURIComponent(key_value[0]);
              if (isDefined(key)) {
                var val = isDefined(key_value[1]) ? tryDecodeURIComponent(key_value[1]) : true;
                if (!hasOwnProperty.call(obj, key)) {
                  obj[key] = val;
                } else if (isArray(obj[key])) {
                  obj[key].push(val);
                } else {
                  obj[key] = [obj[key], val];
                }
              }
            }
          });
          return obj;
        }
        function toKeyValue(obj) {
          var parts = [];
          forEach(obj, function(value, key) {
            if (isArray(value)) {
              forEach(value, function(arrayValue) {
                parts.push(encodeUriQuery(key, true) + (arrayValue === true ? '' : '=' + encodeUriQuery(arrayValue, true)));
              });
            } else {
              parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
            }
          });
          return parts.length ? parts.join('&') : '';
        }
        function encodeUriSegment(val) {
          return encodeUriQuery(val, true).replace(/%26/gi, '&').replace(/%3D/gi, '=').replace(/%2B/gi, '+');
        }
        function encodeUriQuery(val, pctEncodeSpaces) {
          return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%3B/gi, ';').replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
        }
        var ngAttrPrefixes = ['ng-', 'data-ng-', 'ng:', 'x-ng-'];
        function getNgAttribute(element, ngAttr) {
          var attr,
              i,
              ii = ngAttrPrefixes.length;
          for (i = 0; i < ii; ++i) {
            attr = ngAttrPrefixes[i] + ngAttr;
            if (isString(attr = element.getAttribute(attr))) {
              return attr;
            }
          }
          return null;
        }
        function angularInit(element, bootstrap) {
          var appElement,
              module,
              config = {};
          forEach(ngAttrPrefixes, function(prefix) {
            var name = prefix + 'app';
            if (!appElement && element.hasAttribute && element.hasAttribute(name)) {
              appElement = element;
              module = element.getAttribute(name);
            }
          });
          forEach(ngAttrPrefixes, function(prefix) {
            var name = prefix + 'app';
            var candidate;
            if (!appElement && (candidate = element.querySelector('[' + name.replace(':', '\\:') + ']'))) {
              appElement = candidate;
              module = candidate.getAttribute(name);
            }
          });
          if (appElement) {
            config.strictDi = getNgAttribute(appElement, "strict-di") !== null;
            bootstrap(appElement, module ? [module] : [], config);
          }
        }
        function bootstrap(element, modules, config) {
          if (!isObject(config))
            config = {};
          var defaultConfig = {strictDi: false};
          config = extend(defaultConfig, config);
          var doBootstrap = function() {
            element = jqLite(element);
            if (element.injector()) {
              var tag = (element[0] === document) ? 'document' : startingTag(element);
              throw ngMinErr('btstrpd', "App Already Bootstrapped with this Element '{0}'", tag.replace(/</, '&lt;').replace(/>/, '&gt;'));
            }
            modules = modules || [];
            modules.unshift(['$provide', function($provide) {
              $provide.value('$rootElement', element);
            }]);
            if (config.debugInfoEnabled) {
              modules.push(['$compileProvider', function($compileProvider) {
                $compileProvider.debugInfoEnabled(true);
              }]);
            }
            modules.unshift('ng');
            var injector = createInjector(modules, config.strictDi);
            injector.invoke(['$rootScope', '$rootElement', '$compile', '$injector', function bootstrapApply(scope, element, compile, injector) {
              scope.$apply(function() {
                element.data('$injector', injector);
                compile(element)(scope);
              });
            }]);
            return injector;
          };
          var NG_ENABLE_DEBUG_INFO = /^NG_ENABLE_DEBUG_INFO!/;
          var NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;
          if (window && NG_ENABLE_DEBUG_INFO.test(window.name)) {
            config.debugInfoEnabled = true;
            window.name = window.name.replace(NG_ENABLE_DEBUG_INFO, '');
          }
          if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
            return doBootstrap();
          }
          window.name = window.name.replace(NG_DEFER_BOOTSTRAP, '');
          angular.resumeBootstrap = function(extraModules) {
            forEach(extraModules, function(module) {
              modules.push(module);
            });
            return doBootstrap();
          };
          if (isFunction(angular.resumeDeferredBootstrap)) {
            angular.resumeDeferredBootstrap();
          }
        }
        function reloadWithDebugInfo() {
          window.name = 'NG_ENABLE_DEBUG_INFO!' + window.name;
          window.location.reload();
        }
        function getTestability(rootElement) {
          var injector = angular.element(rootElement).injector();
          if (!injector) {
            throw ngMinErr('test', 'no injector found for element argument to getTestability');
          }
          return injector.get('$$testability');
        }
        var SNAKE_CASE_REGEXP = /[A-Z]/g;
        function snake_case(name, separator) {
          separator = separator || '_';
          return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
            return (pos ? separator : '') + letter.toLowerCase();
          });
        }
        var bindJQueryFired = false;
        var skipDestroyOnNextJQueryCleanData;
        function bindJQuery() {
          var originalCleanData;
          if (bindJQueryFired) {
            return;
          }
          var jqName = jq();
          jQuery = window.jQuery;
          if (isDefined(jqName)) {
            jQuery = jqName === null ? undefined : window[jqName];
          }
          if (jQuery && jQuery.fn.on) {
            jqLite = jQuery;
            extend(jQuery.fn, {
              scope: JQLitePrototype.scope,
              isolateScope: JQLitePrototype.isolateScope,
              controller: JQLitePrototype.controller,
              injector: JQLitePrototype.injector,
              inheritedData: JQLitePrototype.inheritedData
            });
            originalCleanData = jQuery.cleanData;
            jQuery.cleanData = function(elems) {
              var events;
              if (!skipDestroyOnNextJQueryCleanData) {
                for (var i = 0,
                    elem; (elem = elems[i]) != null; i++) {
                  events = jQuery._data(elem, "events");
                  if (events && events.$destroy) {
                    jQuery(elem).triggerHandler('$destroy');
                  }
                }
              } else {
                skipDestroyOnNextJQueryCleanData = false;
              }
              originalCleanData(elems);
            };
          } else {
            jqLite = JQLite;
          }
          angular.element = jqLite;
          bindJQueryFired = true;
        }
        function assertArg(arg, name, reason) {
          if (!arg) {
            throw ngMinErr('areq', "Argument '{0}' is {1}", (name || '?'), (reason || "required"));
          }
          return arg;
        }
        function assertArgFn(arg, name, acceptArrayAnnotation) {
          if (acceptArrayAnnotation && isArray(arg)) {
            arg = arg[arg.length - 1];
          }
          assertArg(isFunction(arg), name, 'not a function, got ' + (arg && typeof arg === 'object' ? arg.constructor.name || 'Object' : typeof arg));
          return arg;
        }
        function assertNotHasOwnProperty(name, context) {
          if (name === 'hasOwnProperty') {
            throw ngMinErr('badname', "hasOwnProperty is not a valid {0} name", context);
          }
        }
        function getter(obj, path, bindFnToScope) {
          if (!path)
            return obj;
          var keys = path.split('.');
          var key;
          var lastInstance = obj;
          var len = keys.length;
          for (var i = 0; i < len; i++) {
            key = keys[i];
            if (obj) {
              obj = (lastInstance = obj)[key];
            }
          }
          if (!bindFnToScope && isFunction(obj)) {
            return bind(lastInstance, obj);
          }
          return obj;
        }
        function getBlockNodes(nodes) {
          var node = nodes[0];
          var endNode = nodes[nodes.length - 1];
          var blockNodes = [node];
          do {
            node = node.nextSibling;
            if (!node)
              break;
            blockNodes.push(node);
          } while (node !== endNode);
          return jqLite(blockNodes);
        }
        function createMap() {
          return Object.create(null);
        }
        var NODE_TYPE_ELEMENT = 1;
        var NODE_TYPE_ATTRIBUTE = 2;
        var NODE_TYPE_TEXT = 3;
        var NODE_TYPE_COMMENT = 8;
        var NODE_TYPE_DOCUMENT = 9;
        var NODE_TYPE_DOCUMENT_FRAGMENT = 11;
        function setupModuleLoader(window) {
          var $injectorMinErr = minErr('$injector');
          var ngMinErr = minErr('ng');
          function ensure(obj, name, factory) {
            return obj[name] || (obj[name] = factory());
          }
          var angular = ensure(window, 'angular', Object);
          angular.$$minErr = angular.$$minErr || minErr;
          return ensure(angular, 'module', function() {
            var modules = {};
            return function module(name, requires, configFn) {
              var assertNotHasOwnProperty = function(name, context) {
                if (name === 'hasOwnProperty') {
                  throw ngMinErr('badname', 'hasOwnProperty is not a valid {0} name', context);
                }
              };
              assertNotHasOwnProperty(name, 'module');
              if (requires && modules.hasOwnProperty(name)) {
                modules[name] = null;
              }
              return ensure(modules, name, function() {
                if (!requires) {
                  throw $injectorMinErr('nomod', "Module '{0}' is not available! You either misspelled " + "the module name or forgot to load it. If registering a module ensure that you " + "specify the dependencies as the second argument.", name);
                }
                var invokeQueue = [];
                var configBlocks = [];
                var runBlocks = [];
                var config = invokeLater('$injector', 'invoke', 'push', configBlocks);
                var moduleInstance = {
                  _invokeQueue: invokeQueue,
                  _configBlocks: configBlocks,
                  _runBlocks: runBlocks,
                  requires: requires,
                  name: name,
                  provider: invokeLaterAndSetModuleName('$provide', 'provider'),
                  factory: invokeLaterAndSetModuleName('$provide', 'factory'),
                  service: invokeLaterAndSetModuleName('$provide', 'service'),
                  value: invokeLater('$provide', 'value'),
                  constant: invokeLater('$provide', 'constant', 'unshift'),
                  decorator: invokeLaterAndSetModuleName('$provide', 'decorator'),
                  animation: invokeLaterAndSetModuleName('$animateProvider', 'register'),
                  filter: invokeLaterAndSetModuleName('$filterProvider', 'register'),
                  controller: invokeLaterAndSetModuleName('$controllerProvider', 'register'),
                  directive: invokeLaterAndSetModuleName('$compileProvider', 'directive'),
                  config: config,
                  run: function(block) {
                    runBlocks.push(block);
                    return this;
                  }
                };
                if (configFn) {
                  config(configFn);
                }
                return moduleInstance;
                function invokeLater(provider, method, insertMethod, queue) {
                  if (!queue)
                    queue = invokeQueue;
                  return function() {
                    queue[insertMethod || 'push']([provider, method, arguments]);
                    return moduleInstance;
                  };
                }
                function invokeLaterAndSetModuleName(provider, method) {
                  return function(recipeName, factoryFunction) {
                    if (factoryFunction && isFunction(factoryFunction))
                      factoryFunction.$$moduleName = name;
                    invokeQueue.push([provider, method, arguments]);
                    return moduleInstance;
                  };
                }
              });
            };
          });
        }
        function serializeObject(obj) {
          var seen = [];
          return JSON.stringify(obj, function(key, val) {
            val = toJsonReplacer(key, val);
            if (isObject(val)) {
              if (seen.indexOf(val) >= 0)
                return '<<already seen>>';
              seen.push(val);
            }
            return val;
          });
        }
        function toDebugString(obj) {
          if (typeof obj === 'function') {
            return obj.toString().replace(/ \{[\s\S]*$/, '');
          } else if (typeof obj === 'undefined') {
            return 'undefined';
          } else if (typeof obj !== 'string') {
            return serializeObject(obj);
          }
          return obj;
        }
        var version = {
          full: '1.4.3',
          major: 1,
          minor: 4,
          dot: 3,
          codeName: 'foam-acceleration'
        };
        function publishExternalAPI(angular) {
          extend(angular, {
            'bootstrap': bootstrap,
            'copy': copy,
            'extend': extend,
            'merge': merge,
            'equals': equals,
            'element': jqLite,
            'forEach': forEach,
            'injector': createInjector,
            'noop': noop,
            'bind': bind,
            'toJson': toJson,
            'fromJson': fromJson,
            'identity': identity,
            'isUndefined': isUndefined,
            'isDefined': isDefined,
            'isString': isString,
            'isFunction': isFunction,
            'isObject': isObject,
            'isNumber': isNumber,
            'isElement': isElement,
            'isArray': isArray,
            'version': version,
            'isDate': isDate,
            'lowercase': lowercase,
            'uppercase': uppercase,
            'callbacks': {counter: 0},
            'getTestability': getTestability,
            '$$minErr': minErr,
            '$$csp': csp,
            'reloadWithDebugInfo': reloadWithDebugInfo
          });
          angularModule = setupModuleLoader(window);
          try {
            angularModule('ngLocale');
          } catch (e) {
            angularModule('ngLocale', []).provider('$locale', $LocaleProvider);
          }
          angularModule('ng', ['ngLocale'], ['$provide', function ngModule($provide) {
            $provide.provider({$$sanitizeUri: $$SanitizeUriProvider});
            $provide.provider('$compile', $CompileProvider).directive({
              a: htmlAnchorDirective,
              input: inputDirective,
              textarea: inputDirective,
              form: formDirective,
              script: scriptDirective,
              select: selectDirective,
              style: styleDirective,
              option: optionDirective,
              ngBind: ngBindDirective,
              ngBindHtml: ngBindHtmlDirective,
              ngBindTemplate: ngBindTemplateDirective,
              ngClass: ngClassDirective,
              ngClassEven: ngClassEvenDirective,
              ngClassOdd: ngClassOddDirective,
              ngCloak: ngCloakDirective,
              ngController: ngControllerDirective,
              ngForm: ngFormDirective,
              ngHide: ngHideDirective,
              ngIf: ngIfDirective,
              ngInclude: ngIncludeDirective,
              ngInit: ngInitDirective,
              ngNonBindable: ngNonBindableDirective,
              ngPluralize: ngPluralizeDirective,
              ngRepeat: ngRepeatDirective,
              ngShow: ngShowDirective,
              ngStyle: ngStyleDirective,
              ngSwitch: ngSwitchDirective,
              ngSwitchWhen: ngSwitchWhenDirective,
              ngSwitchDefault: ngSwitchDefaultDirective,
              ngOptions: ngOptionsDirective,
              ngTransclude: ngTranscludeDirective,
              ngModel: ngModelDirective,
              ngList: ngListDirective,
              ngChange: ngChangeDirective,
              pattern: patternDirective,
              ngPattern: patternDirective,
              required: requiredDirective,
              ngRequired: requiredDirective,
              minlength: minlengthDirective,
              ngMinlength: minlengthDirective,
              maxlength: maxlengthDirective,
              ngMaxlength: maxlengthDirective,
              ngValue: ngValueDirective,
              ngModelOptions: ngModelOptionsDirective
            }).directive({ngInclude: ngIncludeFillContentDirective}).directive(ngAttributeAliasDirectives).directive(ngEventDirectives);
            $provide.provider({
              $anchorScroll: $AnchorScrollProvider,
              $animate: $AnimateProvider,
              $$animateQueue: $$CoreAnimateQueueProvider,
              $$AnimateRunner: $$CoreAnimateRunnerProvider,
              $browser: $BrowserProvider,
              $cacheFactory: $CacheFactoryProvider,
              $controller: $ControllerProvider,
              $document: $DocumentProvider,
              $exceptionHandler: $ExceptionHandlerProvider,
              $filter: $FilterProvider,
              $interpolate: $InterpolateProvider,
              $interval: $IntervalProvider,
              $http: $HttpProvider,
              $httpParamSerializer: $HttpParamSerializerProvider,
              $httpParamSerializerJQLike: $HttpParamSerializerJQLikeProvider,
              $httpBackend: $HttpBackendProvider,
              $location: $LocationProvider,
              $log: $LogProvider,
              $parse: $ParseProvider,
              $rootScope: $RootScopeProvider,
              $q: $QProvider,
              $$q: $$QProvider,
              $sce: $SceProvider,
              $sceDelegate: $SceDelegateProvider,
              $sniffer: $SnifferProvider,
              $templateCache: $TemplateCacheProvider,
              $templateRequest: $TemplateRequestProvider,
              $$testability: $$TestabilityProvider,
              $timeout: $TimeoutProvider,
              $window: $WindowProvider,
              $$rAF: $$RAFProvider,
              $$jqLite: $$jqLiteProvider,
              $$HashMap: $$HashMapProvider,
              $$cookieReader: $$CookieReaderProvider
            });
          }]);
        }
        JQLite.expando = 'ng339';
        var jqCache = JQLite.cache = {},
            jqId = 1,
            addEventListenerFn = function(element, type, fn) {
              element.addEventListener(type, fn, false);
            },
            removeEventListenerFn = function(element, type, fn) {
              element.removeEventListener(type, fn, false);
            };
        JQLite._data = function(node) {
          return this.cache[node[this.expando]] || {};
        };
        function jqNextId() {
          return ++jqId;
        }
        var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
        var MOZ_HACK_REGEXP = /^moz([A-Z])/;
        var MOUSE_EVENT_MAP = {
          mouseleave: "mouseout",
          mouseenter: "mouseover"
        };
        var jqLiteMinErr = minErr('jqLite');
        function camelCase(name) {
          return name.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
            return offset ? letter.toUpperCase() : letter;
          }).replace(MOZ_HACK_REGEXP, 'Moz$1');
        }
        var SINGLE_TAG_REGEXP = /^<(\w+)\s*\/?>(?:<\/\1>|)$/;
        var HTML_REGEXP = /<|&#?\w+;/;
        var TAG_NAME_REGEXP = /<([\w:]+)/;
        var XHTML_TAG_REGEXP = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi;
        var wrapMap = {
          'option': [1, '<select multiple="multiple">', '</select>'],
          'thead': [1, '<table>', '</table>'],
          'col': [2, '<table><colgroup>', '</colgroup></table>'],
          'tr': [2, '<table><tbody>', '</tbody></table>'],
          'td': [3, '<table><tbody><tr>', '</tr></tbody></table>'],
          '_default': [0, "", ""]
        };
        wrapMap.optgroup = wrapMap.option;
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        function jqLiteIsTextNode(html) {
          return !HTML_REGEXP.test(html);
        }
        function jqLiteAcceptsData(node) {
          var nodeType = node.nodeType;
          return nodeType === NODE_TYPE_ELEMENT || !nodeType || nodeType === NODE_TYPE_DOCUMENT;
        }
        function jqLiteHasData(node) {
          for (var key in jqCache[node.ng339]) {
            return true;
          }
          return false;
        }
        function jqLiteBuildFragment(html, context) {
          var tmp,
              tag,
              wrap,
              fragment = context.createDocumentFragment(),
              nodes = [],
              i;
          if (jqLiteIsTextNode(html)) {
            nodes.push(context.createTextNode(html));
          } else {
            tmp = tmp || fragment.appendChild(context.createElement("div"));
            tag = (TAG_NAME_REGEXP.exec(html) || ["", ""])[1].toLowerCase();
            wrap = wrapMap[tag] || wrapMap._default;
            tmp.innerHTML = wrap[1] + html.replace(XHTML_TAG_REGEXP, "<$1></$2>") + wrap[2];
            i = wrap[0];
            while (i--) {
              tmp = tmp.lastChild;
            }
            nodes = concat(nodes, tmp.childNodes);
            tmp = fragment.firstChild;
            tmp.textContent = "";
          }
          fragment.textContent = "";
          fragment.innerHTML = "";
          forEach(nodes, function(node) {
            fragment.appendChild(node);
          });
          return fragment;
        }
        function jqLiteParseHTML(html, context) {
          context = context || document;
          var parsed;
          if ((parsed = SINGLE_TAG_REGEXP.exec(html))) {
            return [context.createElement(parsed[1])];
          }
          if ((parsed = jqLiteBuildFragment(html, context))) {
            return parsed.childNodes;
          }
          return [];
        }
        function JQLite(element) {
          if (element instanceof JQLite) {
            return element;
          }
          var argIsString;
          if (isString(element)) {
            element = trim(element);
            argIsString = true;
          }
          if (!(this instanceof JQLite)) {
            if (argIsString && element.charAt(0) != '<') {
              throw jqLiteMinErr('nosel', 'Looking up elements via selectors is not supported by jqLite! See: http://docs.angularjs.org/api/angular.element');
            }
            return new JQLite(element);
          }
          if (argIsString) {
            jqLiteAddNodes(this, jqLiteParseHTML(element));
          } else {
            jqLiteAddNodes(this, element);
          }
        }
        function jqLiteClone(element) {
          return element.cloneNode(true);
        }
        function jqLiteDealoc(element, onlyDescendants) {
          if (!onlyDescendants)
            jqLiteRemoveData(element);
          if (element.querySelectorAll) {
            var descendants = element.querySelectorAll('*');
            for (var i = 0,
                l = descendants.length; i < l; i++) {
              jqLiteRemoveData(descendants[i]);
            }
          }
        }
        function jqLiteOff(element, type, fn, unsupported) {
          if (isDefined(unsupported))
            throw jqLiteMinErr('offargs', 'jqLite#off() does not support the `selector` argument');
          var expandoStore = jqLiteExpandoStore(element);
          var events = expandoStore && expandoStore.events;
          var handle = expandoStore && expandoStore.handle;
          if (!handle)
            return;
          if (!type) {
            for (type in events) {
              if (type !== '$destroy') {
                removeEventListenerFn(element, type, handle);
              }
              delete events[type];
            }
          } else {
            forEach(type.split(' '), function(type) {
              if (isDefined(fn)) {
                var listenerFns = events[type];
                arrayRemove(listenerFns || [], fn);
                if (listenerFns && listenerFns.length > 0) {
                  return;
                }
              }
              removeEventListenerFn(element, type, handle);
              delete events[type];
            });
          }
        }
        function jqLiteRemoveData(element, name) {
          var expandoId = element.ng339;
          var expandoStore = expandoId && jqCache[expandoId];
          if (expandoStore) {
            if (name) {
              delete expandoStore.data[name];
              return;
            }
            if (expandoStore.handle) {
              if (expandoStore.events.$destroy) {
                expandoStore.handle({}, '$destroy');
              }
              jqLiteOff(element);
            }
            delete jqCache[expandoId];
            element.ng339 = undefined;
          }
        }
        function jqLiteExpandoStore(element, createIfNecessary) {
          var expandoId = element.ng339,
              expandoStore = expandoId && jqCache[expandoId];
          if (createIfNecessary && !expandoStore) {
            element.ng339 = expandoId = jqNextId();
            expandoStore = jqCache[expandoId] = {
              events: {},
              data: {},
              handle: undefined
            };
          }
          return expandoStore;
        }
        function jqLiteData(element, key, value) {
          if (jqLiteAcceptsData(element)) {
            var isSimpleSetter = isDefined(value);
            var isSimpleGetter = !isSimpleSetter && key && !isObject(key);
            var massGetter = !key;
            var expandoStore = jqLiteExpandoStore(element, !isSimpleGetter);
            var data = expandoStore && expandoStore.data;
            if (isSimpleSetter) {
              data[key] = value;
            } else {
              if (massGetter) {
                return data;
              } else {
                if (isSimpleGetter) {
                  return data && data[key];
                } else {
                  extend(data, key);
                }
              }
            }
          }
        }
        function jqLiteHasClass(element, selector) {
          if (!element.getAttribute)
            return false;
          return ((" " + (element.getAttribute('class') || '') + " ").replace(/[\n\t]/g, " ").indexOf(" " + selector + " ") > -1);
        }
        function jqLiteRemoveClass(element, cssClasses) {
          if (cssClasses && element.setAttribute) {
            forEach(cssClasses.split(' '), function(cssClass) {
              element.setAttribute('class', trim((" " + (element.getAttribute('class') || '') + " ").replace(/[\n\t]/g, " ").replace(" " + trim(cssClass) + " ", " ")));
            });
          }
        }
        function jqLiteAddClass(element, cssClasses) {
          if (cssClasses && element.setAttribute) {
            var existingClasses = (' ' + (element.getAttribute('class') || '') + ' ').replace(/[\n\t]/g, " ");
            forEach(cssClasses.split(' '), function(cssClass) {
              cssClass = trim(cssClass);
              if (existingClasses.indexOf(' ' + cssClass + ' ') === -1) {
                existingClasses += cssClass + ' ';
              }
            });
            element.setAttribute('class', trim(existingClasses));
          }
        }
        function jqLiteAddNodes(root, elements) {
          if (elements) {
            if (elements.nodeType) {
              root[root.length++] = elements;
            } else {
              var length = elements.length;
              if (typeof length === 'number' && elements.window !== elements) {
                if (length) {
                  for (var i = 0; i < length; i++) {
                    root[root.length++] = elements[i];
                  }
                }
              } else {
                root[root.length++] = elements;
              }
            }
          }
        }
        function jqLiteController(element, name) {
          return jqLiteInheritedData(element, '$' + (name || 'ngController') + 'Controller');
        }
        function jqLiteInheritedData(element, name, value) {
          if (element.nodeType == NODE_TYPE_DOCUMENT) {
            element = element.documentElement;
          }
          var names = isArray(name) ? name : [name];
          while (element) {
            for (var i = 0,
                ii = names.length; i < ii; i++) {
              if ((value = jqLite.data(element, names[i])) !== undefined)
                return value;
            }
            element = element.parentNode || (element.nodeType === NODE_TYPE_DOCUMENT_FRAGMENT && element.host);
          }
        }
        function jqLiteEmpty(element) {
          jqLiteDealoc(element, true);
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
        }
        function jqLiteRemove(element, keepData) {
          if (!keepData)
            jqLiteDealoc(element);
          var parent = element.parentNode;
          if (parent)
            parent.removeChild(element);
        }
        function jqLiteDocumentLoaded(action, win) {
          win = win || window;
          if (win.document.readyState === 'complete') {
            win.setTimeout(action);
          } else {
            jqLite(win).on('load', action);
          }
        }
        var JQLitePrototype = JQLite.prototype = {
          ready: function(fn) {
            var fired = false;
            function trigger() {
              if (fired)
                return;
              fired = true;
              fn();
            }
            if (document.readyState === 'complete') {
              setTimeout(trigger);
            } else {
              this.on('DOMContentLoaded', trigger);
              JQLite(window).on('load', trigger);
            }
          },
          toString: function() {
            var value = [];
            forEach(this, function(e) {
              value.push('' + e);
            });
            return '[' + value.join(', ') + ']';
          },
          eq: function(index) {
            return (index >= 0) ? jqLite(this[index]) : jqLite(this[this.length + index]);
          },
          length: 0,
          push: push,
          sort: [].sort,
          splice: [].splice
        };
        var BOOLEAN_ATTR = {};
        forEach('multiple,selected,checked,disabled,readOnly,required,open'.split(','), function(value) {
          BOOLEAN_ATTR[lowercase(value)] = value;
        });
        var BOOLEAN_ELEMENTS = {};
        forEach('input,select,option,textarea,button,form,details'.split(','), function(value) {
          BOOLEAN_ELEMENTS[value] = true;
        });
        var ALIASED_ATTR = {
          'ngMinlength': 'minlength',
          'ngMaxlength': 'maxlength',
          'ngMin': 'min',
          'ngMax': 'max',
          'ngPattern': 'pattern'
        };
        function getBooleanAttrName(element, name) {
          var booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];
          return booleanAttr && BOOLEAN_ELEMENTS[nodeName_(element)] && booleanAttr;
        }
        function getAliasedAttrName(element, name) {
          var nodeName = element.nodeName;
          return (nodeName === 'INPUT' || nodeName === 'TEXTAREA') && ALIASED_ATTR[name];
        }
        forEach({
          data: jqLiteData,
          removeData: jqLiteRemoveData,
          hasData: jqLiteHasData
        }, function(fn, name) {
          JQLite[name] = fn;
        });
        forEach({
          data: jqLiteData,
          inheritedData: jqLiteInheritedData,
          scope: function(element) {
            return jqLite.data(element, '$scope') || jqLiteInheritedData(element.parentNode || element, ['$isolateScope', '$scope']);
          },
          isolateScope: function(element) {
            return jqLite.data(element, '$isolateScope') || jqLite.data(element, '$isolateScopeNoTemplate');
          },
          controller: jqLiteController,
          injector: function(element) {
            return jqLiteInheritedData(element, '$injector');
          },
          removeAttr: function(element, name) {
            element.removeAttribute(name);
          },
          hasClass: jqLiteHasClass,
          css: function(element, name, value) {
            name = camelCase(name);
            if (isDefined(value)) {
              element.style[name] = value;
            } else {
              return element.style[name];
            }
          },
          attr: function(element, name, value) {
            var nodeType = element.nodeType;
            if (nodeType === NODE_TYPE_TEXT || nodeType === NODE_TYPE_ATTRIBUTE || nodeType === NODE_TYPE_COMMENT) {
              return;
            }
            var lowercasedName = lowercase(name);
            if (BOOLEAN_ATTR[lowercasedName]) {
              if (isDefined(value)) {
                if (!!value) {
                  element[name] = true;
                  element.setAttribute(name, lowercasedName);
                } else {
                  element[name] = false;
                  element.removeAttribute(lowercasedName);
                }
              } else {
                return (element[name] || (element.attributes.getNamedItem(name) || noop).specified) ? lowercasedName : undefined;
              }
            } else if (isDefined(value)) {
              element.setAttribute(name, value);
            } else if (element.getAttribute) {
              var ret = element.getAttribute(name, 2);
              return ret === null ? undefined : ret;
            }
          },
          prop: function(element, name, value) {
            if (isDefined(value)) {
              element[name] = value;
            } else {
              return element[name];
            }
          },
          text: (function() {
            getText.$dv = '';
            return getText;
            function getText(element, value) {
              if (isUndefined(value)) {
                var nodeType = element.nodeType;
                return (nodeType === NODE_TYPE_ELEMENT || nodeType === NODE_TYPE_TEXT) ? element.textContent : '';
              }
              element.textContent = value;
            }
          })(),
          val: function(element, value) {
            if (isUndefined(value)) {
              if (element.multiple && nodeName_(element) === 'select') {
                var result = [];
                forEach(element.options, function(option) {
                  if (option.selected) {
                    result.push(option.value || option.text);
                  }
                });
                return result.length === 0 ? null : result;
              }
              return element.value;
            }
            element.value = value;
          },
          html: function(element, value) {
            if (isUndefined(value)) {
              return element.innerHTML;
            }
            jqLiteDealoc(element, true);
            element.innerHTML = value;
          },
          empty: jqLiteEmpty
        }, function(fn, name) {
          JQLite.prototype[name] = function(arg1, arg2) {
            var i,
                key;
            var nodeCount = this.length;
            if (fn !== jqLiteEmpty && (((fn.length == 2 && (fn !== jqLiteHasClass && fn !== jqLiteController)) ? arg1 : arg2) === undefined)) {
              if (isObject(arg1)) {
                for (i = 0; i < nodeCount; i++) {
                  if (fn === jqLiteData) {
                    fn(this[i], arg1);
                  } else {
                    for (key in arg1) {
                      fn(this[i], key, arg1[key]);
                    }
                  }
                }
                return this;
              } else {
                var value = fn.$dv;
                var jj = (value === undefined) ? Math.min(nodeCount, 1) : nodeCount;
                for (var j = 0; j < jj; j++) {
                  var nodeValue = fn(this[j], arg1, arg2);
                  value = value ? value + nodeValue : nodeValue;
                }
                return value;
              }
            } else {
              for (i = 0; i < nodeCount; i++) {
                fn(this[i], arg1, arg2);
              }
              return this;
            }
          };
        });
        function createEventHandler(element, events) {
          var eventHandler = function(event, type) {
            event.isDefaultPrevented = function() {
              return event.defaultPrevented;
            };
            var eventFns = events[type || event.type];
            var eventFnsLength = eventFns ? eventFns.length : 0;
            if (!eventFnsLength)
              return;
            if (isUndefined(event.immediatePropagationStopped)) {
              var originalStopImmediatePropagation = event.stopImmediatePropagation;
              event.stopImmediatePropagation = function() {
                event.immediatePropagationStopped = true;
                if (event.stopPropagation) {
                  event.stopPropagation();
                }
                if (originalStopImmediatePropagation) {
                  originalStopImmediatePropagation.call(event);
                }
              };
            }
            event.isImmediatePropagationStopped = function() {
              return event.immediatePropagationStopped === true;
            };
            if ((eventFnsLength > 1)) {
              eventFns = shallowCopy(eventFns);
            }
            for (var i = 0; i < eventFnsLength; i++) {
              if (!event.isImmediatePropagationStopped()) {
                eventFns[i].call(element, event);
              }
            }
          };
          eventHandler.elem = element;
          return eventHandler;
        }
        forEach({
          removeData: jqLiteRemoveData,
          on: function jqLiteOn(element, type, fn, unsupported) {
            if (isDefined(unsupported))
              throw jqLiteMinErr('onargs', 'jqLite#on() does not support the `selector` or `eventData` parameters');
            if (!jqLiteAcceptsData(element)) {
              return;
            }
            var expandoStore = jqLiteExpandoStore(element, true);
            var events = expandoStore.events;
            var handle = expandoStore.handle;
            if (!handle) {
              handle = expandoStore.handle = createEventHandler(element, events);
            }
            var types = type.indexOf(' ') >= 0 ? type.split(' ') : [type];
            var i = types.length;
            while (i--) {
              type = types[i];
              var eventFns = events[type];
              if (!eventFns) {
                events[type] = [];
                if (type === 'mouseenter' || type === 'mouseleave') {
                  jqLiteOn(element, MOUSE_EVENT_MAP[type], function(event) {
                    var target = this,
                        related = event.relatedTarget;
                    if (!related || (related !== target && !target.contains(related))) {
                      handle(event, type);
                    }
                  });
                } else {
                  if (type !== '$destroy') {
                    addEventListenerFn(element, type, handle);
                  }
                }
                eventFns = events[type];
              }
              eventFns.push(fn);
            }
          },
          off: jqLiteOff,
          one: function(element, type, fn) {
            element = jqLite(element);
            element.on(type, function onFn() {
              element.off(type, fn);
              element.off(type, onFn);
            });
            element.on(type, fn);
          },
          replaceWith: function(element, replaceNode) {
            var index,
                parent = element.parentNode;
            jqLiteDealoc(element);
            forEach(new JQLite(replaceNode), function(node) {
              if (index) {
                parent.insertBefore(node, index.nextSibling);
              } else {
                parent.replaceChild(node, element);
              }
              index = node;
            });
          },
          children: function(element) {
            var children = [];
            forEach(element.childNodes, function(element) {
              if (element.nodeType === NODE_TYPE_ELEMENT) {
                children.push(element);
              }
            });
            return children;
          },
          contents: function(element) {
            return element.contentDocument || element.childNodes || [];
          },
          append: function(element, node) {
            var nodeType = element.nodeType;
            if (nodeType !== NODE_TYPE_ELEMENT && nodeType !== NODE_TYPE_DOCUMENT_FRAGMENT)
              return;
            node = new JQLite(node);
            for (var i = 0,
                ii = node.length; i < ii; i++) {
              var child = node[i];
              element.appendChild(child);
            }
          },
          prepend: function(element, node) {
            if (element.nodeType === NODE_TYPE_ELEMENT) {
              var index = element.firstChild;
              forEach(new JQLite(node), function(child) {
                element.insertBefore(child, index);
              });
            }
          },
          wrap: function(element, wrapNode) {
            wrapNode = jqLite(wrapNode).eq(0).clone()[0];
            var parent = element.parentNode;
            if (parent) {
              parent.replaceChild(wrapNode, element);
            }
            wrapNode.appendChild(element);
          },
          remove: jqLiteRemove,
          detach: function(element) {
            jqLiteRemove(element, true);
          },
          after: function(element, newElement) {
            var index = element,
                parent = element.parentNode;
            newElement = new JQLite(newElement);
            for (var i = 0,
                ii = newElement.length; i < ii; i++) {
              var node = newElement[i];
              parent.insertBefore(node, index.nextSibling);
              index = node;
            }
          },
          addClass: jqLiteAddClass,
          removeClass: jqLiteRemoveClass,
          toggleClass: function(element, selector, condition) {
            if (selector) {
              forEach(selector.split(' '), function(className) {
                var classCondition = condition;
                if (isUndefined(classCondition)) {
                  classCondition = !jqLiteHasClass(element, className);
                }
                (classCondition ? jqLiteAddClass : jqLiteRemoveClass)(element, className);
              });
            }
          },
          parent: function(element) {
            var parent = element.parentNode;
            return parent && parent.nodeType !== NODE_TYPE_DOCUMENT_FRAGMENT ? parent : null;
          },
          next: function(element) {
            return element.nextElementSibling;
          },
          find: function(element, selector) {
            if (element.getElementsByTagName) {
              return element.getElementsByTagName(selector);
            } else {
              return [];
            }
          },
          clone: jqLiteClone,
          triggerHandler: function(element, event, extraParameters) {
            var dummyEvent,
                eventFnsCopy,
                handlerArgs;
            var eventName = event.type || event;
            var expandoStore = jqLiteExpandoStore(element);
            var events = expandoStore && expandoStore.events;
            var eventFns = events && events[eventName];
            if (eventFns) {
              dummyEvent = {
                preventDefault: function() {
                  this.defaultPrevented = true;
                },
                isDefaultPrevented: function() {
                  return this.defaultPrevented === true;
                },
                stopImmediatePropagation: function() {
                  this.immediatePropagationStopped = true;
                },
                isImmediatePropagationStopped: function() {
                  return this.immediatePropagationStopped === true;
                },
                stopPropagation: noop,
                type: eventName,
                target: element
              };
              if (event.type) {
                dummyEvent = extend(dummyEvent, event);
              }
              eventFnsCopy = shallowCopy(eventFns);
              handlerArgs = extraParameters ? [dummyEvent].concat(extraParameters) : [dummyEvent];
              forEach(eventFnsCopy, function(fn) {
                if (!dummyEvent.isImmediatePropagationStopped()) {
                  fn.apply(element, handlerArgs);
                }
              });
            }
          }
        }, function(fn, name) {
          JQLite.prototype[name] = function(arg1, arg2, arg3) {
            var value;
            for (var i = 0,
                ii = this.length; i < ii; i++) {
              if (isUndefined(value)) {
                value = fn(this[i], arg1, arg2, arg3);
                if (isDefined(value)) {
                  value = jqLite(value);
                }
              } else {
                jqLiteAddNodes(value, fn(this[i], arg1, arg2, arg3));
              }
            }
            return isDefined(value) ? value : this;
          };
          JQLite.prototype.bind = JQLite.prototype.on;
          JQLite.prototype.unbind = JQLite.prototype.off;
        });
        function $$jqLiteProvider() {
          this.$get = function $$jqLite() {
            return extend(JQLite, {
              hasClass: function(node, classes) {
                if (node.attr)
                  node = node[0];
                return jqLiteHasClass(node, classes);
              },
              addClass: function(node, classes) {
                if (node.attr)
                  node = node[0];
                return jqLiteAddClass(node, classes);
              },
              removeClass: function(node, classes) {
                if (node.attr)
                  node = node[0];
                return jqLiteRemoveClass(node, classes);
              }
            });
          };
        }
        function hashKey(obj, nextUidFn) {
          var key = obj && obj.$$hashKey;
          if (key) {
            if (typeof key === 'function') {
              key = obj.$$hashKey();
            }
            return key;
          }
          var objType = typeof obj;
          if (objType == 'function' || (objType == 'object' && obj !== null)) {
            key = obj.$$hashKey = objType + ':' + (nextUidFn || nextUid)();
          } else {
            key = objType + ':' + obj;
          }
          return key;
        }
        function HashMap(array, isolatedUid) {
          if (isolatedUid) {
            var uid = 0;
            this.nextUid = function() {
              return ++uid;
            };
          }
          forEach(array, this.put, this);
        }
        HashMap.prototype = {
          put: function(key, value) {
            this[hashKey(key, this.nextUid)] = value;
          },
          get: function(key) {
            return this[hashKey(key, this.nextUid)];
          },
          remove: function(key) {
            var value = this[key = hashKey(key, this.nextUid)];
            delete this[key];
            return value;
          }
        };
        var $$HashMapProvider = [function() {
          this.$get = [function() {
            return HashMap;
          }];
        }];
        var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        var FN_ARG_SPLIT = /,/;
        var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        var $injectorMinErr = minErr('$injector');
        function anonFn(fn) {
          var fnText = fn.toString().replace(STRIP_COMMENTS, ''),
              args = fnText.match(FN_ARGS);
          if (args) {
            return 'function(' + (args[1] || '').replace(/[\s\r\n]+/, ' ') + ')';
          }
          return 'fn';
        }
        function annotate(fn, strictDi, name) {
          var $inject,
              fnText,
              argDecl,
              last;
          if (typeof fn === 'function') {
            if (!($inject = fn.$inject)) {
              $inject = [];
              if (fn.length) {
                if (strictDi) {
                  if (!isString(name) || !name) {
                    name = fn.name || anonFn(fn);
                  }
                  throw $injectorMinErr('strictdi', '{0} is not using explicit annotation and cannot be invoked in strict mode', name);
                }
                fnText = fn.toString().replace(STRIP_COMMENTS, '');
                argDecl = fnText.match(FN_ARGS);
                forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
                  arg.replace(FN_ARG, function(all, underscore, name) {
                    $inject.push(name);
                  });
                });
              }
              fn.$inject = $inject;
            }
          } else if (isArray(fn)) {
            last = fn.length - 1;
            assertArgFn(fn[last], 'fn');
            $inject = fn.slice(0, last);
          } else {
            assertArgFn(fn, 'fn', true);
          }
          return $inject;
        }
        function createInjector(modulesToLoad, strictDi) {
          strictDi = (strictDi === true);
          var INSTANTIATING = {},
              providerSuffix = 'Provider',
              path = [],
              loadedModules = new HashMap([], true),
              providerCache = {$provide: {
                  provider: supportObject(provider),
                  factory: supportObject(factory),
                  service: supportObject(service),
                  value: supportObject(value),
                  constant: supportObject(constant),
                  decorator: decorator
                }},
              providerInjector = (providerCache.$injector = createInternalInjector(providerCache, function(serviceName, caller) {
                if (angular.isString(caller)) {
                  path.push(caller);
                }
                throw $injectorMinErr('unpr', "Unknown provider: {0}", path.join(' <- '));
              })),
              instanceCache = {},
              instanceInjector = (instanceCache.$injector = createInternalInjector(instanceCache, function(serviceName, caller) {
                var provider = providerInjector.get(serviceName + providerSuffix, caller);
                return instanceInjector.invoke(provider.$get, provider, undefined, serviceName);
              }));
          forEach(loadModules(modulesToLoad), function(fn) {
            if (fn)
              instanceInjector.invoke(fn);
          });
          return instanceInjector;
          function supportObject(delegate) {
            return function(key, value) {
              if (isObject(key)) {
                forEach(key, reverseParams(delegate));
              } else {
                return delegate(key, value);
              }
            };
          }
          function provider(name, provider_) {
            assertNotHasOwnProperty(name, 'service');
            if (isFunction(provider_) || isArray(provider_)) {
              provider_ = providerInjector.instantiate(provider_);
            }
            if (!provider_.$get) {
              throw $injectorMinErr('pget', "Provider '{0}' must define $get factory method.", name);
            }
            return providerCache[name + providerSuffix] = provider_;
          }
          function enforceReturnValue(name, factory) {
            return function enforcedReturnValue() {
              var result = instanceInjector.invoke(factory, this);
              if (isUndefined(result)) {
                throw $injectorMinErr('undef', "Provider '{0}' must return a value from $get factory method.", name);
              }
              return result;
            };
          }
          function factory(name, factoryFn, enforce) {
            return provider(name, {$get: enforce !== false ? enforceReturnValue(name, factoryFn) : factoryFn});
          }
          function service(name, constructor) {
            return factory(name, ['$injector', function($injector) {
              return $injector.instantiate(constructor);
            }]);
          }
          function value(name, val) {
            return factory(name, valueFn(val), false);
          }
          function constant(name, value) {
            assertNotHasOwnProperty(name, 'constant');
            providerCache[name] = value;
            instanceCache[name] = value;
          }
          function decorator(serviceName, decorFn) {
            var origProvider = providerInjector.get(serviceName + providerSuffix),
                orig$get = origProvider.$get;
            origProvider.$get = function() {
              var origInstance = instanceInjector.invoke(orig$get, origProvider);
              return instanceInjector.invoke(decorFn, null, {$delegate: origInstance});
            };
          }
          function loadModules(modulesToLoad) {
            var runBlocks = [],
                moduleFn;
            forEach(modulesToLoad, function(module) {
              if (loadedModules.get(module))
                return;
              loadedModules.put(module, true);
              function runInvokeQueue(queue) {
                var i,
                    ii;
                for (i = 0, ii = queue.length; i < ii; i++) {
                  var invokeArgs = queue[i],
                      provider = providerInjector.get(invokeArgs[0]);
                  provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
                }
              }
              try {
                if (isString(module)) {
                  moduleFn = angularModule(module);
                  runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks);
                  runInvokeQueue(moduleFn._invokeQueue);
                  runInvokeQueue(moduleFn._configBlocks);
                } else if (isFunction(module)) {
                  runBlocks.push(providerInjector.invoke(module));
                } else if (isArray(module)) {
                  runBlocks.push(providerInjector.invoke(module));
                } else {
                  assertArgFn(module, 'module');
                }
              } catch (e) {
                if (isArray(module)) {
                  module = module[module.length - 1];
                }
                if (e.message && e.stack && e.stack.indexOf(e.message) == -1) {
                  e = e.message + '\n' + e.stack;
                }
                throw $injectorMinErr('modulerr', "Failed to instantiate module {0} due to:\n{1}", module, e.stack || e.message || e);
              }
            });
            return runBlocks;
          }
          function createInternalInjector(cache, factory) {
            function getService(serviceName, caller) {
              if (cache.hasOwnProperty(serviceName)) {
                if (cache[serviceName] === INSTANTIATING) {
                  throw $injectorMinErr('cdep', 'Circular dependency found: {0}', serviceName + ' <- ' + path.join(' <- '));
                }
                return cache[serviceName];
              } else {
                try {
                  path.unshift(serviceName);
                  cache[serviceName] = INSTANTIATING;
                  return cache[serviceName] = factory(serviceName, caller);
                } catch (err) {
                  if (cache[serviceName] === INSTANTIATING) {
                    delete cache[serviceName];
                  }
                  throw err;
                } finally {
                  path.shift();
                }
              }
            }
            function invoke(fn, self, locals, serviceName) {
              if (typeof locals === 'string') {
                serviceName = locals;
                locals = null;
              }
              var args = [],
                  $inject = createInjector.$$annotate(fn, strictDi, serviceName),
                  length,
                  i,
                  key;
              for (i = 0, length = $inject.length; i < length; i++) {
                key = $inject[i];
                if (typeof key !== 'string') {
                  throw $injectorMinErr('itkn', 'Incorrect injection token! Expected service name as string, got {0}', key);
                }
                args.push(locals && locals.hasOwnProperty(key) ? locals[key] : getService(key, serviceName));
              }
              if (isArray(fn)) {
                fn = fn[length];
              }
              return fn.apply(self, args);
            }
            function instantiate(Type, locals, serviceName) {
              var instance = Object.create((isArray(Type) ? Type[Type.length - 1] : Type).prototype || null);
              var returnedValue = invoke(Type, instance, locals, serviceName);
              return isObject(returnedValue) || isFunction(returnedValue) ? returnedValue : instance;
            }
            return {
              invoke: invoke,
              instantiate: instantiate,
              get: getService,
              annotate: createInjector.$$annotate,
              has: function(name) {
                return providerCache.hasOwnProperty(name + providerSuffix) || cache.hasOwnProperty(name);
              }
            };
          }
        }
        createInjector.$$annotate = annotate;
        function $AnchorScrollProvider() {
          var autoScrollingEnabled = true;
          this.disableAutoScrolling = function() {
            autoScrollingEnabled = false;
          };
          this.$get = ['$window', '$location', '$rootScope', function($window, $location, $rootScope) {
            var document = $window.document;
            function getFirstAnchor(list) {
              var result = null;
              Array.prototype.some.call(list, function(element) {
                if (nodeName_(element) === 'a') {
                  result = element;
                  return true;
                }
              });
              return result;
            }
            function getYOffset() {
              var offset = scroll.yOffset;
              if (isFunction(offset)) {
                offset = offset();
              } else if (isElement(offset)) {
                var elem = offset[0];
                var style = $window.getComputedStyle(elem);
                if (style.position !== 'fixed') {
                  offset = 0;
                } else {
                  offset = elem.getBoundingClientRect().bottom;
                }
              } else if (!isNumber(offset)) {
                offset = 0;
              }
              return offset;
            }
            function scrollTo(elem) {
              if (elem) {
                elem.scrollIntoView();
                var offset = getYOffset();
                if (offset) {
                  var elemTop = elem.getBoundingClientRect().top;
                  $window.scrollBy(0, elemTop - offset);
                }
              } else {
                $window.scrollTo(0, 0);
              }
            }
            function scroll(hash) {
              hash = isString(hash) ? hash : $location.hash();
              var elm;
              if (!hash)
                scrollTo(null);
              else if ((elm = document.getElementById(hash)))
                scrollTo(elm);
              else if ((elm = getFirstAnchor(document.getElementsByName(hash))))
                scrollTo(elm);
              else if (hash === 'top')
                scrollTo(null);
            }
            if (autoScrollingEnabled) {
              $rootScope.$watch(function autoScrollWatch() {
                return $location.hash();
              }, function autoScrollWatchAction(newVal, oldVal) {
                if (newVal === oldVal && newVal === '')
                  return;
                jqLiteDocumentLoaded(function() {
                  $rootScope.$evalAsync(scroll);
                });
              });
            }
            return scroll;
          }];
        }
        var $animateMinErr = minErr('$animate');
        var ELEMENT_NODE = 1;
        var NG_ANIMATE_CLASSNAME = 'ng-animate';
        function mergeClasses(a, b) {
          if (!a && !b)
            return '';
          if (!a)
            return b;
          if (!b)
            return a;
          if (isArray(a))
            a = a.join(' ');
          if (isArray(b))
            b = b.join(' ');
          return a + ' ' + b;
        }
        function extractElementNode(element) {
          for (var i = 0; i < element.length; i++) {
            var elm = element[i];
            if (elm.nodeType === ELEMENT_NODE) {
              return elm;
            }
          }
        }
        function splitClasses(classes) {
          if (isString(classes)) {
            classes = classes.split(' ');
          }
          var obj = createMap();
          forEach(classes, function(klass) {
            if (klass.length) {
              obj[klass] = true;
            }
          });
          return obj;
        }
        function prepareAnimateOptions(options) {
          return isObject(options) ? options : {};
        }
        var $$CoreAnimateRunnerProvider = function() {
          this.$get = ['$q', '$$rAF', function($q, $$rAF) {
            function AnimateRunner() {}
            AnimateRunner.all = noop;
            AnimateRunner.chain = noop;
            AnimateRunner.prototype = {
              end: noop,
              cancel: noop,
              resume: noop,
              pause: noop,
              complete: noop,
              then: function(pass, fail) {
                return $q(function(resolve) {
                  $$rAF(function() {
                    resolve();
                  });
                }).then(pass, fail);
              }
            };
            return AnimateRunner;
          }];
        };
        var $$CoreAnimateQueueProvider = function() {
          var postDigestQueue = new HashMap();
          var postDigestElements = [];
          this.$get = ['$$AnimateRunner', '$rootScope', function($$AnimateRunner, $rootScope) {
            return {
              enabled: noop,
              on: noop,
              off: noop,
              pin: noop,
              push: function(element, event, options, domOperation) {
                domOperation && domOperation();
                options = options || {};
                options.from && element.css(options.from);
                options.to && element.css(options.to);
                if (options.addClass || options.removeClass) {
                  addRemoveClassesPostDigest(element, options.addClass, options.removeClass);
                }
                return new $$AnimateRunner();
              }
            };
            function addRemoveClassesPostDigest(element, add, remove) {
              var data = postDigestQueue.get(element);
              var classVal;
              if (!data) {
                postDigestQueue.put(element, data = {});
                postDigestElements.push(element);
              }
              if (add) {
                forEach(add.split(' '), function(className) {
                  if (className) {
                    data[className] = true;
                  }
                });
              }
              if (remove) {
                forEach(remove.split(' '), function(className) {
                  if (className) {
                    data[className] = false;
                  }
                });
              }
              if (postDigestElements.length > 1)
                return;
              $rootScope.$$postDigest(function() {
                forEach(postDigestElements, function(element) {
                  var data = postDigestQueue.get(element);
                  if (data) {
                    var existing = splitClasses(element.attr('class'));
                    var toAdd = '';
                    var toRemove = '';
                    forEach(data, function(status, className) {
                      var hasClass = !!existing[className];
                      if (status !== hasClass) {
                        if (status) {
                          toAdd += (toAdd.length ? ' ' : '') + className;
                        } else {
                          toRemove += (toRemove.length ? ' ' : '') + className;
                        }
                      }
                    });
                    forEach(element, function(elm) {
                      toAdd && jqLiteAddClass(elm, toAdd);
                      toRemove && jqLiteRemoveClass(elm, toRemove);
                    });
                    postDigestQueue.remove(element);
                  }
                });
                postDigestElements.length = 0;
              });
            }
          }];
        };
        var $AnimateProvider = ['$provide', function($provide) {
          var provider = this;
          this.$$registeredAnimations = Object.create(null);
          this.register = function(name, factory) {
            if (name && name.charAt(0) !== '.') {
              throw $animateMinErr('notcsel', "Expecting class selector starting with '.' got '{0}'.", name);
            }
            var key = name + '-animation';
            provider.$$registeredAnimations[name.substr(1)] = key;
            $provide.factory(key, factory);
          };
          this.classNameFilter = function(expression) {
            if (arguments.length === 1) {
              this.$$classNameFilter = (expression instanceof RegExp) ? expression : null;
              if (this.$$classNameFilter) {
                var reservedRegex = new RegExp("(\\s+|\\/)" + NG_ANIMATE_CLASSNAME + "(\\s+|\\/)");
                if (reservedRegex.test(this.$$classNameFilter.toString())) {
                  throw $animateMinErr('nongcls', '$animateProvider.classNameFilter(regex) prohibits accepting a regex value which matches/contains the "{0}" CSS class.', NG_ANIMATE_CLASSNAME);
                }
              }
            }
            return this.$$classNameFilter;
          };
          this.$get = ['$$animateQueue', function($$animateQueue) {
            function domInsert(element, parentElement, afterElement) {
              if (afterElement) {
                var afterNode = extractElementNode(afterElement);
                if (afterNode && !afterNode.parentNode && !afterNode.previousElementSibling) {
                  afterElement = null;
                }
              }
              afterElement ? afterElement.after(element) : parentElement.prepend(element);
            }
            return {
              on: $$animateQueue.on,
              off: $$animateQueue.off,
              pin: $$animateQueue.pin,
              enabled: $$animateQueue.enabled,
              cancel: function(runner) {
                runner.end && runner.end();
              },
              enter: function(element, parent, after, options) {
                parent = parent && jqLite(parent);
                after = after && jqLite(after);
                parent = parent || after.parent();
                domInsert(element, parent, after);
                return $$animateQueue.push(element, 'enter', prepareAnimateOptions(options));
              },
              move: function(element, parent, after, options) {
                parent = parent && jqLite(parent);
                after = after && jqLite(after);
                parent = parent || after.parent();
                domInsert(element, parent, after);
                return $$animateQueue.push(element, 'move', prepareAnimateOptions(options));
              },
              leave: function(element, options) {
                return $$animateQueue.push(element, 'leave', prepareAnimateOptions(options), function() {
                  element.remove();
                });
              },
              addClass: function(element, className, options) {
                options = prepareAnimateOptions(options);
                options.addClass = mergeClasses(options.addclass, className);
                return $$animateQueue.push(element, 'addClass', options);
              },
              removeClass: function(element, className, options) {
                options = prepareAnimateOptions(options);
                options.removeClass = mergeClasses(options.removeClass, className);
                return $$animateQueue.push(element, 'removeClass', options);
              },
              setClass: function(element, add, remove, options) {
                options = prepareAnimateOptions(options);
                options.addClass = mergeClasses(options.addClass, add);
                options.removeClass = mergeClasses(options.removeClass, remove);
                return $$animateQueue.push(element, 'setClass', options);
              },
              animate: function(element, from, to, className, options) {
                options = prepareAnimateOptions(options);
                options.from = options.from ? extend(options.from, from) : from;
                options.to = options.to ? extend(options.to, to) : to;
                className = className || 'ng-inline-animate';
                options.tempClasses = mergeClasses(options.tempClasses, className);
                return $$animateQueue.push(element, 'animate', options);
              }
            };
          }];
        }];
        function $$AsyncCallbackProvider() {
          this.$get = ['$$rAF', '$timeout', function($$rAF, $timeout) {
            return $$rAF.supported ? function(fn) {
              return $$rAF(fn);
            } : function(fn) {
              return $timeout(fn, 0, false);
            };
          }];
        }
        function Browser(window, document, $log, $sniffer) {
          var self = this,
              rawDocument = document[0],
              location = window.location,
              history = window.history,
              setTimeout = window.setTimeout,
              clearTimeout = window.clearTimeout,
              pendingDeferIds = {};
          self.isMock = false;
          var outstandingRequestCount = 0;
          var outstandingRequestCallbacks = [];
          self.$$completeOutstandingRequest = completeOutstandingRequest;
          self.$$incOutstandingRequestCount = function() {
            outstandingRequestCount++;
          };
          function completeOutstandingRequest(fn) {
            try {
              fn.apply(null, sliceArgs(arguments, 1));
            } finally {
              outstandingRequestCount--;
              if (outstandingRequestCount === 0) {
                while (outstandingRequestCallbacks.length) {
                  try {
                    outstandingRequestCallbacks.pop()();
                  } catch (e) {
                    $log.error(e);
                  }
                }
              }
            }
          }
          function getHash(url) {
            var index = url.indexOf('#');
            return index === -1 ? '' : url.substr(index);
          }
          self.notifyWhenNoOutstandingRequests = function(callback) {
            if (outstandingRequestCount === 0) {
              callback();
            } else {
              outstandingRequestCallbacks.push(callback);
            }
          };
          var cachedState,
              lastHistoryState,
              lastBrowserUrl = location.href,
              baseElement = document.find('base'),
              reloadLocation = null;
          cacheState();
          lastHistoryState = cachedState;
          self.url = function(url, replace, state) {
            if (isUndefined(state)) {
              state = null;
            }
            if (location !== window.location)
              location = window.location;
            if (history !== window.history)
              history = window.history;
            if (url) {
              var sameState = lastHistoryState === state;
              if (lastBrowserUrl === url && (!$sniffer.history || sameState)) {
                return self;
              }
              var sameBase = lastBrowserUrl && stripHash(lastBrowserUrl) === stripHash(url);
              lastBrowserUrl = url;
              lastHistoryState = state;
              if ($sniffer.history && (!sameBase || !sameState)) {
                history[replace ? 'replaceState' : 'pushState'](state, '', url);
                cacheState();
                lastHistoryState = cachedState;
              } else {
                if (!sameBase || reloadLocation) {
                  reloadLocation = url;
                }
                if (replace) {
                  location.replace(url);
                } else if (!sameBase) {
                  location.href = url;
                } else {
                  location.hash = getHash(url);
                }
              }
              return self;
            } else {
              return reloadLocation || location.href.replace(/%27/g, "'");
            }
          };
          self.state = function() {
            return cachedState;
          };
          var urlChangeListeners = [],
              urlChangeInit = false;
          function cacheStateAndFireUrlChange() {
            cacheState();
            fireUrlChange();
          }
          function getCurrentState() {
            try {
              return history.state;
            } catch (e) {}
          }
          var lastCachedState = null;
          function cacheState() {
            cachedState = getCurrentState();
            cachedState = isUndefined(cachedState) ? null : cachedState;
            if (equals(cachedState, lastCachedState)) {
              cachedState = lastCachedState;
            }
            lastCachedState = cachedState;
          }
          function fireUrlChange() {
            if (lastBrowserUrl === self.url() && lastHistoryState === cachedState) {
              return;
            }
            lastBrowserUrl = self.url();
            lastHistoryState = cachedState;
            forEach(urlChangeListeners, function(listener) {
              listener(self.url(), cachedState);
            });
          }
          self.onUrlChange = function(callback) {
            if (!urlChangeInit) {
              if ($sniffer.history)
                jqLite(window).on('popstate', cacheStateAndFireUrlChange);
              jqLite(window).on('hashchange', cacheStateAndFireUrlChange);
              urlChangeInit = true;
            }
            urlChangeListeners.push(callback);
            return callback;
          };
          self.$$applicationDestroyed = function() {
            jqLite(window).off('hashchange popstate', cacheStateAndFireUrlChange);
          };
          self.$$checkUrlChange = fireUrlChange;
          self.baseHref = function() {
            var href = baseElement.attr('href');
            return href ? href.replace(/^(https?\:)?\/\/[^\/]*/, '') : '';
          };
          self.defer = function(fn, delay) {
            var timeoutId;
            outstandingRequestCount++;
            timeoutId = setTimeout(function() {
              delete pendingDeferIds[timeoutId];
              completeOutstandingRequest(fn);
            }, delay || 0);
            pendingDeferIds[timeoutId] = true;
            return timeoutId;
          };
          self.defer.cancel = function(deferId) {
            if (pendingDeferIds[deferId]) {
              delete pendingDeferIds[deferId];
              clearTimeout(deferId);
              completeOutstandingRequest(noop);
              return true;
            }
            return false;
          };
        }
        function $BrowserProvider() {
          this.$get = ['$window', '$log', '$sniffer', '$document', function($window, $log, $sniffer, $document) {
            return new Browser($window, $document, $log, $sniffer);
          }];
        }
        function $CacheFactoryProvider() {
          this.$get = function() {
            var caches = {};
            function cacheFactory(cacheId, options) {
              if (cacheId in caches) {
                throw minErr('$cacheFactory')('iid', "CacheId '{0}' is already taken!", cacheId);
              }
              var size = 0,
                  stats = extend({}, options, {id: cacheId}),
                  data = {},
                  capacity = (options && options.capacity) || Number.MAX_VALUE,
                  lruHash = {},
                  freshEnd = null,
                  staleEnd = null;
              return caches[cacheId] = {
                put: function(key, value) {
                  if (isUndefined(value))
                    return;
                  if (capacity < Number.MAX_VALUE) {
                    var lruEntry = lruHash[key] || (lruHash[key] = {key: key});
                    refresh(lruEntry);
                  }
                  if (!(key in data))
                    size++;
                  data[key] = value;
                  if (size > capacity) {
                    this.remove(staleEnd.key);
                  }
                  return value;
                },
                get: function(key) {
                  if (capacity < Number.MAX_VALUE) {
                    var lruEntry = lruHash[key];
                    if (!lruEntry)
                      return;
                    refresh(lruEntry);
                  }
                  return data[key];
                },
                remove: function(key) {
                  if (capacity < Number.MAX_VALUE) {
                    var lruEntry = lruHash[key];
                    if (!lruEntry)
                      return;
                    if (lruEntry == freshEnd)
                      freshEnd = lruEntry.p;
                    if (lruEntry == staleEnd)
                      staleEnd = lruEntry.n;
                    link(lruEntry.n, lruEntry.p);
                    delete lruHash[key];
                  }
                  delete data[key];
                  size--;
                },
                removeAll: function() {
                  data = {};
                  size = 0;
                  lruHash = {};
                  freshEnd = staleEnd = null;
                },
                destroy: function() {
                  data = null;
                  stats = null;
                  lruHash = null;
                  delete caches[cacheId];
                },
                info: function() {
                  return extend({}, stats, {size: size});
                }
              };
              function refresh(entry) {
                if (entry != freshEnd) {
                  if (!staleEnd) {
                    staleEnd = entry;
                  } else if (staleEnd == entry) {
                    staleEnd = entry.n;
                  }
                  link(entry.n, entry.p);
                  link(entry, freshEnd);
                  freshEnd = entry;
                  freshEnd.n = null;
                }
              }
              function link(nextEntry, prevEntry) {
                if (nextEntry != prevEntry) {
                  if (nextEntry)
                    nextEntry.p = prevEntry;
                  if (prevEntry)
                    prevEntry.n = nextEntry;
                }
              }
            }
            cacheFactory.info = function() {
              var info = {};
              forEach(caches, function(cache, cacheId) {
                info[cacheId] = cache.info();
              });
              return info;
            };
            cacheFactory.get = function(cacheId) {
              return caches[cacheId];
            };
            return cacheFactory;
          };
        }
        function $TemplateCacheProvider() {
          this.$get = ['$cacheFactory', function($cacheFactory) {
            return $cacheFactory('templates');
          }];
        }
        var $compileMinErr = minErr('$compile');
        $CompileProvider.$inject = ['$provide', '$$sanitizeUriProvider'];
        function $CompileProvider($provide, $$sanitizeUriProvider) {
          var hasDirectives = {},
              Suffix = 'Directive',
              COMMENT_DIRECTIVE_REGEXP = /^\s*directive\:\s*([\w\-]+)\s+(.*)$/,
              CLASS_DIRECTIVE_REGEXP = /(([\w\-]+)(?:\:([^;]+))?;?)/,
              ALL_OR_NOTHING_ATTRS = makeMap('ngSrc,ngSrcset,src,srcset'),
              REQUIRE_PREFIX_REGEXP = /^(?:(\^\^?)?(\?)?(\^\^?)?)?/;
          var EVENT_HANDLER_ATTR_REGEXP = /^(on[a-z]+|formaction)$/;
          function parseIsolateBindings(scope, directiveName, isController) {
            var LOCAL_REGEXP = /^\s*([@&]|=(\*?))(\??)\s*(\w*)\s*$/;
            var bindings = {};
            forEach(scope, function(definition, scopeName) {
              var match = definition.match(LOCAL_REGEXP);
              if (!match) {
                throw $compileMinErr('iscp', "Invalid {3} for directive '{0}'." + " Definition: {... {1}: '{2}' ...}", directiveName, scopeName, definition, (isController ? "controller bindings definition" : "isolate scope definition"));
              }
              bindings[scopeName] = {
                mode: match[1][0],
                collection: match[2] === '*',
                optional: match[3] === '?',
                attrName: match[4] || scopeName
              };
            });
            return bindings;
          }
          function parseDirectiveBindings(directive, directiveName) {
            var bindings = {
              isolateScope: null,
              bindToController: null
            };
            if (isObject(directive.scope)) {
              if (directive.bindToController === true) {
                bindings.bindToController = parseIsolateBindings(directive.scope, directiveName, true);
                bindings.isolateScope = {};
              } else {
                bindings.isolateScope = parseIsolateBindings(directive.scope, directiveName, false);
              }
            }
            if (isObject(directive.bindToController)) {
              bindings.bindToController = parseIsolateBindings(directive.bindToController, directiveName, true);
            }
            if (isObject(bindings.bindToController)) {
              var controller = directive.controller;
              var controllerAs = directive.controllerAs;
              if (!controller) {
                throw $compileMinErr('noctrl', "Cannot bind to controller without directive '{0}'s controller.", directiveName);
              } else if (!identifierForController(controller, controllerAs)) {
                throw $compileMinErr('noident', "Cannot bind to controller without identifier for directive '{0}'.", directiveName);
              }
            }
            return bindings;
          }
          function assertValidDirectiveName(name) {
            var letter = name.charAt(0);
            if (!letter || letter !== lowercase(letter)) {
              throw $compileMinErr('baddir', "Directive name '{0}' is invalid. The first character must be a lowercase letter", name);
            }
            if (name !== name.trim()) {
              throw $compileMinErr('baddir', "Directive name '{0}' is invalid. The name should not contain leading or trailing whitespaces", name);
            }
          }
          this.directive = function registerDirective(name, directiveFactory) {
            assertNotHasOwnProperty(name, 'directive');
            if (isString(name)) {
              assertValidDirectiveName(name);
              assertArg(directiveFactory, 'directiveFactory');
              if (!hasDirectives.hasOwnProperty(name)) {
                hasDirectives[name] = [];
                $provide.factory(name + Suffix, ['$injector', '$exceptionHandler', function($injector, $exceptionHandler) {
                  var directives = [];
                  forEach(hasDirectives[name], function(directiveFactory, index) {
                    try {
                      var directive = $injector.invoke(directiveFactory);
                      if (isFunction(directive)) {
                        directive = {compile: valueFn(directive)};
                      } else if (!directive.compile && directive.link) {
                        directive.compile = valueFn(directive.link);
                      }
                      directive.priority = directive.priority || 0;
                      directive.index = index;
                      directive.name = directive.name || name;
                      directive.require = directive.require || (directive.controller && directive.name);
                      directive.restrict = directive.restrict || 'EA';
                      var bindings = directive.$$bindings = parseDirectiveBindings(directive, directive.name);
                      if (isObject(bindings.isolateScope)) {
                        directive.$$isolateBindings = bindings.isolateScope;
                      }
                      directive.$$moduleName = directiveFactory.$$moduleName;
                      directives.push(directive);
                    } catch (e) {
                      $exceptionHandler(e);
                    }
                  });
                  return directives;
                }]);
              }
              hasDirectives[name].push(directiveFactory);
            } else {
              forEach(name, reverseParams(registerDirective));
            }
            return this;
          };
          this.aHrefSanitizationWhitelist = function(regexp) {
            if (isDefined(regexp)) {
              $$sanitizeUriProvider.aHrefSanitizationWhitelist(regexp);
              return this;
            } else {
              return $$sanitizeUriProvider.aHrefSanitizationWhitelist();
            }
          };
          this.imgSrcSanitizationWhitelist = function(regexp) {
            if (isDefined(regexp)) {
              $$sanitizeUriProvider.imgSrcSanitizationWhitelist(regexp);
              return this;
            } else {
              return $$sanitizeUriProvider.imgSrcSanitizationWhitelist();
            }
          };
          var debugInfoEnabled = true;
          this.debugInfoEnabled = function(enabled) {
            if (isDefined(enabled)) {
              debugInfoEnabled = enabled;
              return this;
            }
            return debugInfoEnabled;
          };
          this.$get = ['$injector', '$interpolate', '$exceptionHandler', '$templateRequest', '$parse', '$controller', '$rootScope', '$document', '$sce', '$animate', '$$sanitizeUri', function($injector, $interpolate, $exceptionHandler, $templateRequest, $parse, $controller, $rootScope, $document, $sce, $animate, $$sanitizeUri) {
            var Attributes = function(element, attributesToCopy) {
              if (attributesToCopy) {
                var keys = Object.keys(attributesToCopy);
                var i,
                    l,
                    key;
                for (i = 0, l = keys.length; i < l; i++) {
                  key = keys[i];
                  this[key] = attributesToCopy[key];
                }
              } else {
                this.$attr = {};
              }
              this.$$element = element;
            };
            Attributes.prototype = {
              $normalize: directiveNormalize,
              $addClass: function(classVal) {
                if (classVal && classVal.length > 0) {
                  $animate.addClass(this.$$element, classVal);
                }
              },
              $removeClass: function(classVal) {
                if (classVal && classVal.length > 0) {
                  $animate.removeClass(this.$$element, classVal);
                }
              },
              $updateClass: function(newClasses, oldClasses) {
                var toAdd = tokenDifference(newClasses, oldClasses);
                if (toAdd && toAdd.length) {
                  $animate.addClass(this.$$element, toAdd);
                }
                var toRemove = tokenDifference(oldClasses, newClasses);
                if (toRemove && toRemove.length) {
                  $animate.removeClass(this.$$element, toRemove);
                }
              },
              $set: function(key, value, writeAttr, attrName) {
                var node = this.$$element[0],
                    booleanKey = getBooleanAttrName(node, key),
                    aliasedKey = getAliasedAttrName(node, key),
                    observer = key,
                    nodeName;
                if (booleanKey) {
                  this.$$element.prop(key, value);
                  attrName = booleanKey;
                } else if (aliasedKey) {
                  this[aliasedKey] = value;
                  observer = aliasedKey;
                }
                this[key] = value;
                if (attrName) {
                  this.$attr[key] = attrName;
                } else {
                  attrName = this.$attr[key];
                  if (!attrName) {
                    this.$attr[key] = attrName = snake_case(key, '-');
                  }
                }
                nodeName = nodeName_(this.$$element);
                if ((nodeName === 'a' && key === 'href') || (nodeName === 'img' && key === 'src')) {
                  this[key] = value = $$sanitizeUri(value, key === 'src');
                } else if (nodeName === 'img' && key === 'srcset') {
                  var result = "";
                  var trimmedSrcset = trim(value);
                  var srcPattern = /(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/;
                  var pattern = /\s/.test(trimmedSrcset) ? srcPattern : /(,)/;
                  var rawUris = trimmedSrcset.split(pattern);
                  var nbrUrisWith2parts = Math.floor(rawUris.length / 2);
                  for (var i = 0; i < nbrUrisWith2parts; i++) {
                    var innerIdx = i * 2;
                    result += $$sanitizeUri(trim(rawUris[innerIdx]), true);
                    result += (" " + trim(rawUris[innerIdx + 1]));
                  }
                  var lastTuple = trim(rawUris[i * 2]).split(/\s/);
                  result += $$sanitizeUri(trim(lastTuple[0]), true);
                  if (lastTuple.length === 2) {
                    result += (" " + trim(lastTuple[1]));
                  }
                  this[key] = value = result;
                }
                if (writeAttr !== false) {
                  if (value === null || value === undefined) {
                    this.$$element.removeAttr(attrName);
                  } else {
                    this.$$element.attr(attrName, value);
                  }
                }
                var $$observers = this.$$observers;
                $$observers && forEach($$observers[observer], function(fn) {
                  try {
                    fn(value);
                  } catch (e) {
                    $exceptionHandler(e);
                  }
                });
              },
              $observe: function(key, fn) {
                var attrs = this,
                    $$observers = (attrs.$$observers || (attrs.$$observers = createMap())),
                    listeners = ($$observers[key] || ($$observers[key] = []));
                listeners.push(fn);
                $rootScope.$evalAsync(function() {
                  if (!listeners.$$inter && attrs.hasOwnProperty(key)) {
                    fn(attrs[key]);
                  }
                });
                return function() {
                  arrayRemove(listeners, fn);
                };
              }
            };
            function safeAddClass($element, className) {
              try {
                $element.addClass(className);
              } catch (e) {}
            }
            var startSymbol = $interpolate.startSymbol(),
                endSymbol = $interpolate.endSymbol(),
                denormalizeTemplate = (startSymbol == '{{' || endSymbol == '}}') ? identity : function denormalizeTemplate(template) {
                  return template.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol);
                },
                NG_ATTR_BINDING = /^ngAttr[A-Z]/;
            compile.$$addBindingInfo = debugInfoEnabled ? function $$addBindingInfo($element, binding) {
              var bindings = $element.data('$binding') || [];
              if (isArray(binding)) {
                bindings = bindings.concat(binding);
              } else {
                bindings.push(binding);
              }
              $element.data('$binding', bindings);
            } : noop;
            compile.$$addBindingClass = debugInfoEnabled ? function $$addBindingClass($element) {
              safeAddClass($element, 'ng-binding');
            } : noop;
            compile.$$addScopeInfo = debugInfoEnabled ? function $$addScopeInfo($element, scope, isolated, noTemplate) {
              var dataName = isolated ? (noTemplate ? '$isolateScopeNoTemplate' : '$isolateScope') : '$scope';
              $element.data(dataName, scope);
            } : noop;
            compile.$$addScopeClass = debugInfoEnabled ? function $$addScopeClass($element, isolated) {
              safeAddClass($element, isolated ? 'ng-isolate-scope' : 'ng-scope');
            } : noop;
            return compile;
            function compile($compileNodes, transcludeFn, maxPriority, ignoreDirective, previousCompileContext) {
              if (!($compileNodes instanceof jqLite)) {
                $compileNodes = jqLite($compileNodes);
              }
              forEach($compileNodes, function(node, index) {
                if (node.nodeType == NODE_TYPE_TEXT && node.nodeValue.match(/\S+/)) {
                  $compileNodes[index] = jqLite(node).wrap('<span></span>').parent()[0];
                }
              });
              var compositeLinkFn = compileNodes($compileNodes, transcludeFn, $compileNodes, maxPriority, ignoreDirective, previousCompileContext);
              compile.$$addScopeClass($compileNodes);
              var namespace = null;
              return function publicLinkFn(scope, cloneConnectFn, options) {
                assertArg(scope, 'scope');
                options = options || {};
                var parentBoundTranscludeFn = options.parentBoundTranscludeFn,
                    transcludeControllers = options.transcludeControllers,
                    futureParentElement = options.futureParentElement;
                if (parentBoundTranscludeFn && parentBoundTranscludeFn.$$boundTransclude) {
                  parentBoundTranscludeFn = parentBoundTranscludeFn.$$boundTransclude;
                }
                if (!namespace) {
                  namespace = detectNamespaceForChildElements(futureParentElement);
                }
                var $linkNode;
                if (namespace !== 'html') {
                  $linkNode = jqLite(wrapTemplate(namespace, jqLite('<div>').append($compileNodes).html()));
                } else if (cloneConnectFn) {
                  $linkNode = JQLitePrototype.clone.call($compileNodes);
                } else {
                  $linkNode = $compileNodes;
                }
                if (transcludeControllers) {
                  for (var controllerName in transcludeControllers) {
                    $linkNode.data('$' + controllerName + 'Controller', transcludeControllers[controllerName].instance);
                  }
                }
                compile.$$addScopeInfo($linkNode, scope);
                if (cloneConnectFn)
                  cloneConnectFn($linkNode, scope);
                if (compositeLinkFn)
                  compositeLinkFn(scope, $linkNode, $linkNode, parentBoundTranscludeFn);
                return $linkNode;
              };
            }
            function detectNamespaceForChildElements(parentElement) {
              var node = parentElement && parentElement[0];
              if (!node) {
                return 'html';
              } else {
                return nodeName_(node) !== 'foreignobject' && node.toString().match(/SVG/) ? 'svg' : 'html';
              }
            }
            function compileNodes(nodeList, transcludeFn, $rootElement, maxPriority, ignoreDirective, previousCompileContext) {
              var linkFns = [],
                  attrs,
                  directives,
                  nodeLinkFn,
                  childNodes,
                  childLinkFn,
                  linkFnFound,
                  nodeLinkFnFound;
              for (var i = 0; i < nodeList.length; i++) {
                attrs = new Attributes();
                directives = collectDirectives(nodeList[i], [], attrs, i === 0 ? maxPriority : undefined, ignoreDirective);
                nodeLinkFn = (directives.length) ? applyDirectivesToNode(directives, nodeList[i], attrs, transcludeFn, $rootElement, null, [], [], previousCompileContext) : null;
                if (nodeLinkFn && nodeLinkFn.scope) {
                  compile.$$addScopeClass(attrs.$$element);
                }
                childLinkFn = (nodeLinkFn && nodeLinkFn.terminal || !(childNodes = nodeList[i].childNodes) || !childNodes.length) ? null : compileNodes(childNodes, nodeLinkFn ? ((nodeLinkFn.transcludeOnThisElement || !nodeLinkFn.templateOnThisElement) && nodeLinkFn.transclude) : transcludeFn);
                if (nodeLinkFn || childLinkFn) {
                  linkFns.push(i, nodeLinkFn, childLinkFn);
                  linkFnFound = true;
                  nodeLinkFnFound = nodeLinkFnFound || nodeLinkFn;
                }
                previousCompileContext = null;
              }
              return linkFnFound ? compositeLinkFn : null;
              function compositeLinkFn(scope, nodeList, $rootElement, parentBoundTranscludeFn) {
                var nodeLinkFn,
                    childLinkFn,
                    node,
                    childScope,
                    i,
                    ii,
                    idx,
                    childBoundTranscludeFn;
                var stableNodeList;
                if (nodeLinkFnFound) {
                  var nodeListLength = nodeList.length;
                  stableNodeList = new Array(nodeListLength);
                  for (i = 0; i < linkFns.length; i += 3) {
                    idx = linkFns[i];
                    stableNodeList[idx] = nodeList[idx];
                  }
                } else {
                  stableNodeList = nodeList;
                }
                for (i = 0, ii = linkFns.length; i < ii; ) {
                  node = stableNodeList[linkFns[i++]];
                  nodeLinkFn = linkFns[i++];
                  childLinkFn = linkFns[i++];
                  if (nodeLinkFn) {
                    if (nodeLinkFn.scope) {
                      childScope = scope.$new();
                      compile.$$addScopeInfo(jqLite(node), childScope);
                      var destroyBindings = nodeLinkFn.$$destroyBindings;
                      if (destroyBindings) {
                        nodeLinkFn.$$destroyBindings = null;
                        childScope.$on('$destroyed', destroyBindings);
                      }
                    } else {
                      childScope = scope;
                    }
                    if (nodeLinkFn.transcludeOnThisElement) {
                      childBoundTranscludeFn = createBoundTranscludeFn(scope, nodeLinkFn.transclude, parentBoundTranscludeFn);
                    } else if (!nodeLinkFn.templateOnThisElement && parentBoundTranscludeFn) {
                      childBoundTranscludeFn = parentBoundTranscludeFn;
                    } else if (!parentBoundTranscludeFn && transcludeFn) {
                      childBoundTranscludeFn = createBoundTranscludeFn(scope, transcludeFn);
                    } else {
                      childBoundTranscludeFn = null;
                    }
                    nodeLinkFn(childLinkFn, childScope, node, $rootElement, childBoundTranscludeFn, nodeLinkFn);
                  } else if (childLinkFn) {
                    childLinkFn(scope, node.childNodes, undefined, parentBoundTranscludeFn);
                  }
                }
              }
            }
            function createBoundTranscludeFn(scope, transcludeFn, previousBoundTranscludeFn) {
              var boundTranscludeFn = function(transcludedScope, cloneFn, controllers, futureParentElement, containingScope) {
                if (!transcludedScope) {
                  transcludedScope = scope.$new(false, containingScope);
                  transcludedScope.$$transcluded = true;
                }
                return transcludeFn(transcludedScope, cloneFn, {
                  parentBoundTranscludeFn: previousBoundTranscludeFn,
                  transcludeControllers: controllers,
                  futureParentElement: futureParentElement
                });
              };
              return boundTranscludeFn;
            }
            function collectDirectives(node, directives, attrs, maxPriority, ignoreDirective) {
              var nodeType = node.nodeType,
                  attrsMap = attrs.$attr,
                  match,
                  className;
              switch (nodeType) {
                case NODE_TYPE_ELEMENT:
                  addDirective(directives, directiveNormalize(nodeName_(node)), 'E', maxPriority, ignoreDirective);
                  for (var attr,
                      name,
                      nName,
                      ngAttrName,
                      value,
                      isNgAttr,
                      nAttrs = node.attributes,
                      j = 0,
                      jj = nAttrs && nAttrs.length; j < jj; j++) {
                    var attrStartName = false;
                    var attrEndName = false;
                    attr = nAttrs[j];
                    name = attr.name;
                    value = trim(attr.value);
                    ngAttrName = directiveNormalize(name);
                    if (isNgAttr = NG_ATTR_BINDING.test(ngAttrName)) {
                      name = name.replace(PREFIX_REGEXP, '').substr(8).replace(/_(.)/g, function(match, letter) {
                        return letter.toUpperCase();
                      });
                    }
                    var directiveNName = ngAttrName.replace(/(Start|End)$/, '');
                    if (directiveIsMultiElement(directiveNName)) {
                      if (ngAttrName === directiveNName + 'Start') {
                        attrStartName = name;
                        attrEndName = name.substr(0, name.length - 5) + 'end';
                        name = name.substr(0, name.length - 6);
                      }
                    }
                    nName = directiveNormalize(name.toLowerCase());
                    attrsMap[nName] = name;
                    if (isNgAttr || !attrs.hasOwnProperty(nName)) {
                      attrs[nName] = value;
                      if (getBooleanAttrName(node, nName)) {
                        attrs[nName] = true;
                      }
                    }
                    addAttrInterpolateDirective(node, directives, value, nName, isNgAttr);
                    addDirective(directives, nName, 'A', maxPriority, ignoreDirective, attrStartName, attrEndName);
                  }
                  className = node.className;
                  if (isObject(className)) {
                    className = className.animVal;
                  }
                  if (isString(className) && className !== '') {
                    while (match = CLASS_DIRECTIVE_REGEXP.exec(className)) {
                      nName = directiveNormalize(match[2]);
                      if (addDirective(directives, nName, 'C', maxPriority, ignoreDirective)) {
                        attrs[nName] = trim(match[3]);
                      }
                      className = className.substr(match.index + match[0].length);
                    }
                  }
                  break;
                case NODE_TYPE_TEXT:
                  if (msie === 11) {
                    while (node.parentNode && node.nextSibling && node.nextSibling.nodeType === NODE_TYPE_TEXT) {
                      node.nodeValue = node.nodeValue + node.nextSibling.nodeValue;
                      node.parentNode.removeChild(node.nextSibling);
                    }
                  }
                  addTextInterpolateDirective(directives, node.nodeValue);
                  break;
                case NODE_TYPE_COMMENT:
                  try {
                    match = COMMENT_DIRECTIVE_REGEXP.exec(node.nodeValue);
                    if (match) {
                      nName = directiveNormalize(match[1]);
                      if (addDirective(directives, nName, 'M', maxPriority, ignoreDirective)) {
                        attrs[nName] = trim(match[2]);
                      }
                    }
                  } catch (e) {}
                  break;
              }
              directives.sort(byPriority);
              return directives;
            }
            function groupScan(node, attrStart, attrEnd) {
              var nodes = [];
              var depth = 0;
              if (attrStart && node.hasAttribute && node.hasAttribute(attrStart)) {
                do {
                  if (!node) {
                    throw $compileMinErr('uterdir', "Unterminated attribute, found '{0}' but no matching '{1}' found.", attrStart, attrEnd);
                  }
                  if (node.nodeType == NODE_TYPE_ELEMENT) {
                    if (node.hasAttribute(attrStart))
                      depth++;
                    if (node.hasAttribute(attrEnd))
                      depth--;
                  }
                  nodes.push(node);
                  node = node.nextSibling;
                } while (depth > 0);
              } else {
                nodes.push(node);
              }
              return jqLite(nodes);
            }
            function groupElementsLinkFnWrapper(linkFn, attrStart, attrEnd) {
              return function(scope, element, attrs, controllers, transcludeFn) {
                element = groupScan(element[0], attrStart, attrEnd);
                return linkFn(scope, element, attrs, controllers, transcludeFn);
              };
            }
            function applyDirectivesToNode(directives, compileNode, templateAttrs, transcludeFn, jqCollection, originalReplaceDirective, preLinkFns, postLinkFns, previousCompileContext) {
              previousCompileContext = previousCompileContext || {};
              var terminalPriority = -Number.MAX_VALUE,
                  newScopeDirective = previousCompileContext.newScopeDirective,
                  controllerDirectives = previousCompileContext.controllerDirectives,
                  newIsolateScopeDirective = previousCompileContext.newIsolateScopeDirective,
                  templateDirective = previousCompileContext.templateDirective,
                  nonTlbTranscludeDirective = previousCompileContext.nonTlbTranscludeDirective,
                  hasTranscludeDirective = false,
                  hasTemplate = false,
                  hasElementTranscludeDirective = previousCompileContext.hasElementTranscludeDirective,
                  $compileNode = templateAttrs.$$element = jqLite(compileNode),
                  directive,
                  directiveName,
                  $template,
                  replaceDirective = originalReplaceDirective,
                  childTranscludeFn = transcludeFn,
                  linkFn,
                  directiveValue;
              for (var i = 0,
                  ii = directives.length; i < ii; i++) {
                directive = directives[i];
                var attrStart = directive.$$start;
                var attrEnd = directive.$$end;
                if (attrStart) {
                  $compileNode = groupScan(compileNode, attrStart, attrEnd);
                }
                $template = undefined;
                if (terminalPriority > directive.priority) {
                  break;
                }
                if (directiveValue = directive.scope) {
                  if (!directive.templateUrl) {
                    if (isObject(directiveValue)) {
                      assertNoDuplicate('new/isolated scope', newIsolateScopeDirective || newScopeDirective, directive, $compileNode);
                      newIsolateScopeDirective = directive;
                    } else {
                      assertNoDuplicate('new/isolated scope', newIsolateScopeDirective, directive, $compileNode);
                    }
                  }
                  newScopeDirective = newScopeDirective || directive;
                }
                directiveName = directive.name;
                if (!directive.templateUrl && directive.controller) {
                  directiveValue = directive.controller;
                  controllerDirectives = controllerDirectives || createMap();
                  assertNoDuplicate("'" + directiveName + "' controller", controllerDirectives[directiveName], directive, $compileNode);
                  controllerDirectives[directiveName] = directive;
                }
                if (directiveValue = directive.transclude) {
                  hasTranscludeDirective = true;
                  if (!directive.$$tlb) {
                    assertNoDuplicate('transclusion', nonTlbTranscludeDirective, directive, $compileNode);
                    nonTlbTranscludeDirective = directive;
                  }
                  if (directiveValue == 'element') {
                    hasElementTranscludeDirective = true;
                    terminalPriority = directive.priority;
                    $template = $compileNode;
                    $compileNode = templateAttrs.$$element = jqLite(document.createComment(' ' + directiveName + ': ' + templateAttrs[directiveName] + ' '));
                    compileNode = $compileNode[0];
                    replaceWith(jqCollection, sliceArgs($template), compileNode);
                    childTranscludeFn = compile($template, transcludeFn, terminalPriority, replaceDirective && replaceDirective.name, {nonTlbTranscludeDirective: nonTlbTranscludeDirective});
                  } else {
                    $template = jqLite(jqLiteClone(compileNode)).contents();
                    $compileNode.empty();
                    childTranscludeFn = compile($template, transcludeFn);
                  }
                }
                if (directive.template) {
                  hasTemplate = true;
                  assertNoDuplicate('template', templateDirective, directive, $compileNode);
                  templateDirective = directive;
                  directiveValue = (isFunction(directive.template)) ? directive.template($compileNode, templateAttrs) : directive.template;
                  directiveValue = denormalizeTemplate(directiveValue);
                  if (directive.replace) {
                    replaceDirective = directive;
                    if (jqLiteIsTextNode(directiveValue)) {
                      $template = [];
                    } else {
                      $template = removeComments(wrapTemplate(directive.templateNamespace, trim(directiveValue)));
                    }
                    compileNode = $template[0];
                    if ($template.length != 1 || compileNode.nodeType !== NODE_TYPE_ELEMENT) {
                      throw $compileMinErr('tplrt', "Template for directive '{0}' must have exactly one root element. {1}", directiveName, '');
                    }
                    replaceWith(jqCollection, $compileNode, compileNode);
                    var newTemplateAttrs = {$attr: {}};
                    var templateDirectives = collectDirectives(compileNode, [], newTemplateAttrs);
                    var unprocessedDirectives = directives.splice(i + 1, directives.length - (i + 1));
                    if (newIsolateScopeDirective) {
                      markDirectivesAsIsolate(templateDirectives);
                    }
                    directives = directives.concat(templateDirectives).concat(unprocessedDirectives);
                    mergeTemplateAttributes(templateAttrs, newTemplateAttrs);
                    ii = directives.length;
                  } else {
                    $compileNode.html(directiveValue);
                  }
                }
                if (directive.templateUrl) {
                  hasTemplate = true;
                  assertNoDuplicate('template', templateDirective, directive, $compileNode);
                  templateDirective = directive;
                  if (directive.replace) {
                    replaceDirective = directive;
                  }
                  nodeLinkFn = compileTemplateUrl(directives.splice(i, directives.length - i), $compileNode, templateAttrs, jqCollection, hasTranscludeDirective && childTranscludeFn, preLinkFns, postLinkFns, {
                    controllerDirectives: controllerDirectives,
                    newScopeDirective: (newScopeDirective !== directive) && newScopeDirective,
                    newIsolateScopeDirective: newIsolateScopeDirective,
                    templateDirective: templateDirective,
                    nonTlbTranscludeDirective: nonTlbTranscludeDirective
                  });
                  ii = directives.length;
                } else if (directive.compile) {
                  try {
                    linkFn = directive.compile($compileNode, templateAttrs, childTranscludeFn);
                    if (isFunction(linkFn)) {
                      addLinkFns(null, linkFn, attrStart, attrEnd);
                    } else if (linkFn) {
                      addLinkFns(linkFn.pre, linkFn.post, attrStart, attrEnd);
                    }
                  } catch (e) {
                    $exceptionHandler(e, startingTag($compileNode));
                  }
                }
                if (directive.terminal) {
                  nodeLinkFn.terminal = true;
                  terminalPriority = Math.max(terminalPriority, directive.priority);
                }
              }
              nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope === true;
              nodeLinkFn.transcludeOnThisElement = hasTranscludeDirective;
              nodeLinkFn.templateOnThisElement = hasTemplate;
              nodeLinkFn.transclude = childTranscludeFn;
              previousCompileContext.hasElementTranscludeDirective = hasElementTranscludeDirective;
              return nodeLinkFn;
              function addLinkFns(pre, post, attrStart, attrEnd) {
                if (pre) {
                  if (attrStart)
                    pre = groupElementsLinkFnWrapper(pre, attrStart, attrEnd);
                  pre.require = directive.require;
                  pre.directiveName = directiveName;
                  if (newIsolateScopeDirective === directive || directive.$$isolateScope) {
                    pre = cloneAndAnnotateFn(pre, {isolateScope: true});
                  }
                  preLinkFns.push(pre);
                }
                if (post) {
                  if (attrStart)
                    post = groupElementsLinkFnWrapper(post, attrStart, attrEnd);
                  post.require = directive.require;
                  post.directiveName = directiveName;
                  if (newIsolateScopeDirective === directive || directive.$$isolateScope) {
                    post = cloneAndAnnotateFn(post, {isolateScope: true});
                  }
                  postLinkFns.push(post);
                }
              }
              function getControllers(directiveName, require, $element, elementControllers) {
                var value;
                if (isString(require)) {
                  var match = require.match(REQUIRE_PREFIX_REGEXP);
                  var name = require.substring(match[0].length);
                  var inheritType = match[1] || match[3];
                  var optional = match[2] === '?';
                  if (inheritType === '^^') {
                    $element = $element.parent();
                  } else {
                    value = elementControllers && elementControllers[name];
                    value = value && value.instance;
                  }
                  if (!value) {
                    var dataName = '$' + name + 'Controller';
                    value = inheritType ? $element.inheritedData(dataName) : $element.data(dataName);
                  }
                  if (!value && !optional) {
                    throw $compileMinErr('ctreq', "Controller '{0}', required by directive '{1}', can't be found!", name, directiveName);
                  }
                } else if (isArray(require)) {
                  value = [];
                  for (var i = 0,
                      ii = require.length; i < ii; i++) {
                    value[i] = getControllers(directiveName, require[i], $element, elementControllers);
                  }
                }
                return value || null;
              }
              function setupControllers($element, attrs, transcludeFn, controllerDirectives, isolateScope, scope) {
                var elementControllers = createMap();
                for (var controllerKey in controllerDirectives) {
                  var directive = controllerDirectives[controllerKey];
                  var locals = {
                    $scope: directive === newIsolateScopeDirective || directive.$$isolateScope ? isolateScope : scope,
                    $element: $element,
                    $attrs: attrs,
                    $transclude: transcludeFn
                  };
                  var controller = directive.controller;
                  if (controller == '@') {
                    controller = attrs[directive.name];
                  }
                  var controllerInstance = $controller(controller, locals, true, directive.controllerAs);
                  elementControllers[directive.name] = controllerInstance;
                  if (!hasElementTranscludeDirective) {
                    $element.data('$' + directive.name + 'Controller', controllerInstance.instance);
                  }
                }
                return elementControllers;
              }
              function nodeLinkFn(childLinkFn, scope, linkNode, $rootElement, boundTranscludeFn, thisLinkFn) {
                var i,
                    ii,
                    linkFn,
                    controller,
                    isolateScope,
                    elementControllers,
                    transcludeFn,
                    $element,
                    attrs;
                if (compileNode === linkNode) {
                  attrs = templateAttrs;
                  $element = templateAttrs.$$element;
                } else {
                  $element = jqLite(linkNode);
                  attrs = new Attributes($element, templateAttrs);
                }
                if (newIsolateScopeDirective) {
                  isolateScope = scope.$new(true);
                }
                if (boundTranscludeFn) {
                  transcludeFn = controllersBoundTransclude;
                  transcludeFn.$$boundTransclude = boundTranscludeFn;
                }
                if (controllerDirectives) {
                  elementControllers = setupControllers($element, attrs, transcludeFn, controllerDirectives, isolateScope, scope);
                }
                if (newIsolateScopeDirective) {
                  compile.$$addScopeInfo($element, isolateScope, true, !(templateDirective && (templateDirective === newIsolateScopeDirective || templateDirective === newIsolateScopeDirective.$$originalDirective)));
                  compile.$$addScopeClass($element, true);
                  isolateScope.$$isolateBindings = newIsolateScopeDirective.$$isolateBindings;
                  initializeDirectiveBindings(scope, attrs, isolateScope, isolateScope.$$isolateBindings, newIsolateScopeDirective, isolateScope);
                }
                if (elementControllers) {
                  var scopeDirective = newIsolateScopeDirective || newScopeDirective;
                  var bindings;
                  var controllerForBindings;
                  if (scopeDirective && elementControllers[scopeDirective.name]) {
                    bindings = scopeDirective.$$bindings.bindToController;
                    controller = elementControllers[scopeDirective.name];
                    if (controller && controller.identifier && bindings) {
                      controllerForBindings = controller;
                      thisLinkFn.$$destroyBindings = initializeDirectiveBindings(scope, attrs, controller.instance, bindings, scopeDirective);
                    }
                  }
                  for (i in elementControllers) {
                    controller = elementControllers[i];
                    var controllerResult = controller();
                    if (controllerResult !== controller.instance) {
                      controller.instance = controllerResult;
                      $element.data('$' + i + 'Controller', controllerResult);
                      if (controller === controllerForBindings) {
                        thisLinkFn.$$destroyBindings();
                        thisLinkFn.$$destroyBindings = initializeDirectiveBindings(scope, attrs, controllerResult, bindings, scopeDirective);
                      }
                    }
                  }
                }
                for (i = 0, ii = preLinkFns.length; i < ii; i++) {
                  linkFn = preLinkFns[i];
                  invokeLinkFn(linkFn, linkFn.isolateScope ? isolateScope : scope, $element, attrs, linkFn.require && getControllers(linkFn.directiveName, linkFn.require, $element, elementControllers), transcludeFn);
                }
                var scopeToChild = scope;
                if (newIsolateScopeDirective && (newIsolateScopeDirective.template || newIsolateScopeDirective.templateUrl === null)) {
                  scopeToChild = isolateScope;
                }
                childLinkFn && childLinkFn(scopeToChild, linkNode.childNodes, undefined, boundTranscludeFn);
                for (i = postLinkFns.length - 1; i >= 0; i--) {
                  linkFn = postLinkFns[i];
                  invokeLinkFn(linkFn, linkFn.isolateScope ? isolateScope : scope, $element, attrs, linkFn.require && getControllers(linkFn.directiveName, linkFn.require, $element, elementControllers), transcludeFn);
                }
                function controllersBoundTransclude(scope, cloneAttachFn, futureParentElement) {
                  var transcludeControllers;
                  if (!isScope(scope)) {
                    futureParentElement = cloneAttachFn;
                    cloneAttachFn = scope;
                    scope = undefined;
                  }
                  if (hasElementTranscludeDirective) {
                    transcludeControllers = elementControllers;
                  }
                  if (!futureParentElement) {
                    futureParentElement = hasElementTranscludeDirective ? $element.parent() : $element;
                  }
                  return boundTranscludeFn(scope, cloneAttachFn, transcludeControllers, futureParentElement, scopeToChild);
                }
              }
            }
            function markDirectivesAsIsolate(directives) {
              for (var j = 0,
                  jj = directives.length; j < jj; j++) {
                directives[j] = inherit(directives[j], {$$isolateScope: true});
              }
            }
            function addDirective(tDirectives, name, location, maxPriority, ignoreDirective, startAttrName, endAttrName) {
              if (name === ignoreDirective)
                return null;
              var match = null;
              if (hasDirectives.hasOwnProperty(name)) {
                for (var directive,
                    directives = $injector.get(name + Suffix),
                    i = 0,
                    ii = directives.length; i < ii; i++) {
                  try {
                    directive = directives[i];
                    if ((maxPriority === undefined || maxPriority > directive.priority) && directive.restrict.indexOf(location) != -1) {
                      if (startAttrName) {
                        directive = inherit(directive, {
                          $$start: startAttrName,
                          $$end: endAttrName
                        });
                      }
                      tDirectives.push(directive);
                      match = directive;
                    }
                  } catch (e) {
                    $exceptionHandler(e);
                  }
                }
              }
              return match;
            }
            function directiveIsMultiElement(name) {
              if (hasDirectives.hasOwnProperty(name)) {
                for (var directive,
                    directives = $injector.get(name + Suffix),
                    i = 0,
                    ii = directives.length; i < ii; i++) {
                  directive = directives[i];
                  if (directive.multiElement) {
                    return true;
                  }
                }
              }
              return false;
            }
            function mergeTemplateAttributes(dst, src) {
              var srcAttr = src.$attr,
                  dstAttr = dst.$attr,
                  $element = dst.$$element;
              forEach(dst, function(value, key) {
                if (key.charAt(0) != '$') {
                  if (src[key] && src[key] !== value) {
                    value += (key === 'style' ? ';' : ' ') + src[key];
                  }
                  dst.$set(key, value, true, srcAttr[key]);
                }
              });
              forEach(src, function(value, key) {
                if (key == 'class') {
                  safeAddClass($element, value);
                  dst['class'] = (dst['class'] ? dst['class'] + ' ' : '') + value;
                } else if (key == 'style') {
                  $element.attr('style', $element.attr('style') + ';' + value);
                  dst['style'] = (dst['style'] ? dst['style'] + ';' : '') + value;
                } else if (key.charAt(0) != '$' && !dst.hasOwnProperty(key)) {
                  dst[key] = value;
                  dstAttr[key] = srcAttr[key];
                }
              });
            }
            function compileTemplateUrl(directives, $compileNode, tAttrs, $rootElement, childTranscludeFn, preLinkFns, postLinkFns, previousCompileContext) {
              var linkQueue = [],
                  afterTemplateNodeLinkFn,
                  afterTemplateChildLinkFn,
                  beforeTemplateCompileNode = $compileNode[0],
                  origAsyncDirective = directives.shift(),
                  derivedSyncDirective = inherit(origAsyncDirective, {
                    templateUrl: null,
                    transclude: null,
                    replace: null,
                    $$originalDirective: origAsyncDirective
                  }),
                  templateUrl = (isFunction(origAsyncDirective.templateUrl)) ? origAsyncDirective.templateUrl($compileNode, tAttrs) : origAsyncDirective.templateUrl,
                  templateNamespace = origAsyncDirective.templateNamespace;
              $compileNode.empty();
              $templateRequest(templateUrl).then(function(content) {
                var compileNode,
                    tempTemplateAttrs,
                    $template,
                    childBoundTranscludeFn;
                content = denormalizeTemplate(content);
                if (origAsyncDirective.replace) {
                  if (jqLiteIsTextNode(content)) {
                    $template = [];
                  } else {
                    $template = removeComments(wrapTemplate(templateNamespace, trim(content)));
                  }
                  compileNode = $template[0];
                  if ($template.length != 1 || compileNode.nodeType !== NODE_TYPE_ELEMENT) {
                    throw $compileMinErr('tplrt', "Template for directive '{0}' must have exactly one root element. {1}", origAsyncDirective.name, templateUrl);
                  }
                  tempTemplateAttrs = {$attr: {}};
                  replaceWith($rootElement, $compileNode, compileNode);
                  var templateDirectives = collectDirectives(compileNode, [], tempTemplateAttrs);
                  if (isObject(origAsyncDirective.scope)) {
                    markDirectivesAsIsolate(templateDirectives);
                  }
                  directives = templateDirectives.concat(directives);
                  mergeTemplateAttributes(tAttrs, tempTemplateAttrs);
                } else {
                  compileNode = beforeTemplateCompileNode;
                  $compileNode.html(content);
                }
                directives.unshift(derivedSyncDirective);
                afterTemplateNodeLinkFn = applyDirectivesToNode(directives, compileNode, tAttrs, childTranscludeFn, $compileNode, origAsyncDirective, preLinkFns, postLinkFns, previousCompileContext);
                forEach($rootElement, function(node, i) {
                  if (node == compileNode) {
                    $rootElement[i] = $compileNode[0];
                  }
                });
                afterTemplateChildLinkFn = compileNodes($compileNode[0].childNodes, childTranscludeFn);
                while (linkQueue.length) {
                  var scope = linkQueue.shift(),
                      beforeTemplateLinkNode = linkQueue.shift(),
                      linkRootElement = linkQueue.shift(),
                      boundTranscludeFn = linkQueue.shift(),
                      linkNode = $compileNode[0];
                  if (scope.$$destroyed)
                    continue;
                  if (beforeTemplateLinkNode !== beforeTemplateCompileNode) {
                    var oldClasses = beforeTemplateLinkNode.className;
                    if (!(previousCompileContext.hasElementTranscludeDirective && origAsyncDirective.replace)) {
                      linkNode = jqLiteClone(compileNode);
                    }
                    replaceWith(linkRootElement, jqLite(beforeTemplateLinkNode), linkNode);
                    safeAddClass(jqLite(linkNode), oldClasses);
                  }
                  if (afterTemplateNodeLinkFn.transcludeOnThisElement) {
                    childBoundTranscludeFn = createBoundTranscludeFn(scope, afterTemplateNodeLinkFn.transclude, boundTranscludeFn);
                  } else {
                    childBoundTranscludeFn = boundTranscludeFn;
                  }
                  afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, linkNode, $rootElement, childBoundTranscludeFn, afterTemplateNodeLinkFn);
                }
                linkQueue = null;
              });
              return function delayedNodeLinkFn(ignoreChildLinkFn, scope, node, rootElement, boundTranscludeFn) {
                var childBoundTranscludeFn = boundTranscludeFn;
                if (scope.$$destroyed)
                  return;
                if (linkQueue) {
                  linkQueue.push(scope, node, rootElement, childBoundTranscludeFn);
                } else {
                  if (afterTemplateNodeLinkFn.transcludeOnThisElement) {
                    childBoundTranscludeFn = createBoundTranscludeFn(scope, afterTemplateNodeLinkFn.transclude, boundTranscludeFn);
                  }
                  afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, node, rootElement, childBoundTranscludeFn, afterTemplateNodeLinkFn);
                }
              };
            }
            function byPriority(a, b) {
              var diff = b.priority - a.priority;
              if (diff !== 0)
                return diff;
              if (a.name !== b.name)
                return (a.name < b.name) ? -1 : 1;
              return a.index - b.index;
            }
            function assertNoDuplicate(what, previousDirective, directive, element) {
              function wrapModuleNameIfDefined(moduleName) {
                return moduleName ? (' (module: ' + moduleName + ')') : '';
              }
              if (previousDirective) {
                throw $compileMinErr('multidir', 'Multiple directives [{0}{1}, {2}{3}] asking for {4} on: {5}', previousDirective.name, wrapModuleNameIfDefined(previousDirective.$$moduleName), directive.name, wrapModuleNameIfDefined(directive.$$moduleName), what, startingTag(element));
              }
            }
            function addTextInterpolateDirective(directives, text) {
              var interpolateFn = $interpolate(text, true);
              if (interpolateFn) {
                directives.push({
                  priority: 0,
                  compile: function textInterpolateCompileFn(templateNode) {
                    var templateNodeParent = templateNode.parent(),
                        hasCompileParent = !!templateNodeParent.length;
                    if (hasCompileParent)
                      compile.$$addBindingClass(templateNodeParent);
                    return function textInterpolateLinkFn(scope, node) {
                      var parent = node.parent();
                      if (!hasCompileParent)
                        compile.$$addBindingClass(parent);
                      compile.$$addBindingInfo(parent, interpolateFn.expressions);
                      scope.$watch(interpolateFn, function interpolateFnWatchAction(value) {
                        node[0].nodeValue = value;
                      });
                    };
                  }
                });
              }
            }
            function wrapTemplate(type, template) {
              type = lowercase(type || 'html');
              switch (type) {
                case 'svg':
                case 'math':
                  var wrapper = document.createElement('div');
                  wrapper.innerHTML = '<' + type + '>' + template + '</' + type + '>';
                  return wrapper.childNodes[0].childNodes;
                default:
                  return template;
              }
            }
            function getTrustedContext(node, attrNormalizedName) {
              if (attrNormalizedName == "srcdoc") {
                return $sce.HTML;
              }
              var tag = nodeName_(node);
              if (attrNormalizedName == "xlinkHref" || (tag == "form" && attrNormalizedName == "action") || (tag != "img" && (attrNormalizedName == "src" || attrNormalizedName == "ngSrc"))) {
                return $sce.RESOURCE_URL;
              }
            }
            function addAttrInterpolateDirective(node, directives, value, name, allOrNothing) {
              var trustedContext = getTrustedContext(node, name);
              allOrNothing = ALL_OR_NOTHING_ATTRS[name] || allOrNothing;
              var interpolateFn = $interpolate(value, true, trustedContext, allOrNothing);
              if (!interpolateFn)
                return;
              if (name === "multiple" && nodeName_(node) === "select") {
                throw $compileMinErr("selmulti", "Binding to the 'multiple' attribute is not supported. Element: {0}", startingTag(node));
              }
              directives.push({
                priority: 100,
                compile: function() {
                  return {pre: function attrInterpolatePreLinkFn(scope, element, attr) {
                      var $$observers = (attr.$$observers || (attr.$$observers = {}));
                      if (EVENT_HANDLER_ATTR_REGEXP.test(name)) {
                        throw $compileMinErr('nodomevents', "Interpolations for HTML DOM event attributes are disallowed.  Please use the " + "ng- versions (such as ng-click instead of onclick) instead.");
                      }
                      var newValue = attr[name];
                      if (newValue !== value) {
                        interpolateFn = newValue && $interpolate(newValue, true, trustedContext, allOrNothing);
                        value = newValue;
                      }
                      if (!interpolateFn)
                        return;
                      attr[name] = interpolateFn(scope);
                      ($$observers[name] || ($$observers[name] = [])).$$inter = true;
                      (attr.$$observers && attr.$$observers[name].$$scope || scope).$watch(interpolateFn, function interpolateFnWatchAction(newValue, oldValue) {
                        if (name === 'class' && newValue != oldValue) {
                          attr.$updateClass(newValue, oldValue);
                        } else {
                          attr.$set(name, newValue);
                        }
                      });
                    }};
                }
              });
            }
            function replaceWith($rootElement, elementsToRemove, newNode) {
              var firstElementToRemove = elementsToRemove[0],
                  removeCount = elementsToRemove.length,
                  parent = firstElementToRemove.parentNode,
                  i,
                  ii;
              if ($rootElement) {
                for (i = 0, ii = $rootElement.length; i < ii; i++) {
                  if ($rootElement[i] == firstElementToRemove) {
                    $rootElement[i++] = newNode;
                    for (var j = i,
                        j2 = j + removeCount - 1,
                        jj = $rootElement.length; j < jj; j++, j2++) {
                      if (j2 < jj) {
                        $rootElement[j] = $rootElement[j2];
                      } else {
                        delete $rootElement[j];
                      }
                    }
                    $rootElement.length -= removeCount - 1;
                    if ($rootElement.context === firstElementToRemove) {
                      $rootElement.context = newNode;
                    }
                    break;
                  }
                }
              }
              if (parent) {
                parent.replaceChild(newNode, firstElementToRemove);
              }
              var fragment = document.createDocumentFragment();
              fragment.appendChild(firstElementToRemove);
              if (jqLite.hasData(firstElementToRemove)) {
                jqLite(newNode).data(jqLite(firstElementToRemove).data());
                if (!jQuery) {
                  delete jqLite.cache[firstElementToRemove[jqLite.expando]];
                } else {
                  skipDestroyOnNextJQueryCleanData = true;
                  jQuery.cleanData([firstElementToRemove]);
                }
              }
              for (var k = 1,
                  kk = elementsToRemove.length; k < kk; k++) {
                var element = elementsToRemove[k];
                jqLite(element).remove();
                fragment.appendChild(element);
                delete elementsToRemove[k];
              }
              elementsToRemove[0] = newNode;
              elementsToRemove.length = 1;
            }
            function cloneAndAnnotateFn(fn, annotation) {
              return extend(function() {
                return fn.apply(null, arguments);
              }, fn, annotation);
            }
            function invokeLinkFn(linkFn, scope, $element, attrs, controllers, transcludeFn) {
              try {
                linkFn(scope, $element, attrs, controllers, transcludeFn);
              } catch (e) {
                $exceptionHandler(e, startingTag($element));
              }
            }
            function initializeDirectiveBindings(scope, attrs, destination, bindings, directive, newScope) {
              var onNewScopeDestroyed;
              forEach(bindings, function(definition, scopeName) {
                var attrName = definition.attrName,
                    optional = definition.optional,
                    mode = definition.mode,
                    lastValue,
                    parentGet,
                    parentSet,
                    compare;
                if (!hasOwnProperty.call(attrs, attrName)) {
                  attrs[attrName] = undefined;
                }
                switch (mode) {
                  case '@':
                    if (!attrs[attrName] && !optional) {
                      destination[scopeName] = undefined;
                    }
                    attrs.$observe(attrName, function(value) {
                      destination[scopeName] = value;
                    });
                    attrs.$$observers[attrName].$$scope = scope;
                    if (attrs[attrName]) {
                      destination[scopeName] = $interpolate(attrs[attrName])(scope);
                    }
                    break;
                  case '=':
                    if (optional && !attrs[attrName]) {
                      return;
                    }
                    parentGet = $parse(attrs[attrName]);
                    if (parentGet.literal) {
                      compare = equals;
                    } else {
                      compare = function(a, b) {
                        return a === b || (a !== a && b !== b);
                      };
                    }
                    parentSet = parentGet.assign || function() {
                      lastValue = destination[scopeName] = parentGet(scope);
                      throw $compileMinErr('nonassign', "Expression '{0}' used with directive '{1}' is non-assignable!", attrs[attrName], directive.name);
                    };
                    lastValue = destination[scopeName] = parentGet(scope);
                    var parentValueWatch = function parentValueWatch(parentValue) {
                      if (!compare(parentValue, destination[scopeName])) {
                        if (!compare(parentValue, lastValue)) {
                          destination[scopeName] = parentValue;
                        } else {
                          parentSet(scope, parentValue = destination[scopeName]);
                        }
                      }
                      return lastValue = parentValue;
                    };
                    parentValueWatch.$stateful = true;
                    var unwatch;
                    if (definition.collection) {
                      unwatch = scope.$watchCollection(attrs[attrName], parentValueWatch);
                    } else {
                      unwatch = scope.$watch($parse(attrs[attrName], parentValueWatch), null, parentGet.literal);
                    }
                    onNewScopeDestroyed = (onNewScopeDestroyed || []);
                    onNewScopeDestroyed.push(unwatch);
                    break;
                  case '&':
                    parentGet = $parse(attrs[attrName]);
                    if (parentGet === noop && optional)
                      break;
                    destination[scopeName] = function(locals) {
                      return parentGet(scope, locals);
                    };
                    break;
                }
              });
              var destroyBindings = onNewScopeDestroyed ? function destroyBindings() {
                for (var i = 0,
                    ii = onNewScopeDestroyed.length; i < ii; ++i) {
                  onNewScopeDestroyed[i]();
                }
              } : noop;
              if (newScope && destroyBindings !== noop) {
                newScope.$on('$destroy', destroyBindings);
                return noop;
              }
              return destroyBindings;
            }
          }];
        }
        var PREFIX_REGEXP = /^((?:x|data)[\:\-_])/i;
        function directiveNormalize(name) {
          return camelCase(name.replace(PREFIX_REGEXP, ''));
        }
        function nodesetLinkingFn(scope, nodeList, rootElement, boundTranscludeFn) {}
        function directiveLinkingFn(nodesetLinkingFn, scope, node, rootElement, boundTranscludeFn) {}
        function tokenDifference(str1, str2) {
          var values = '',
              tokens1 = str1.split(/\s+/),
              tokens2 = str2.split(/\s+/);
          outer: for (var i = 0; i < tokens1.length; i++) {
            var token = tokens1[i];
            for (var j = 0; j < tokens2.length; j++) {
              if (token == tokens2[j])
                continue outer;
            }
            values += (values.length > 0 ? ' ' : '') + token;
          }
          return values;
        }
        function removeComments(jqNodes) {
          jqNodes = jqLite(jqNodes);
          var i = jqNodes.length;
          if (i <= 1) {
            return jqNodes;
          }
          while (i--) {
            var node = jqNodes[i];
            if (node.nodeType === NODE_TYPE_COMMENT) {
              splice.call(jqNodes, i, 1);
            }
          }
          return jqNodes;
        }
        var $controllerMinErr = minErr('$controller');
        var CNTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;
        function identifierForController(controller, ident) {
          if (ident && isString(ident))
            return ident;
          if (isString(controller)) {
            var match = CNTRL_REG.exec(controller);
            if (match)
              return match[3];
          }
        }
        function $ControllerProvider() {
          var controllers = {},
              globals = false;
          this.register = function(name, constructor) {
            assertNotHasOwnProperty(name, 'controller');
            if (isObject(name)) {
              extend(controllers, name);
            } else {
              controllers[name] = constructor;
            }
          };
          this.allowGlobals = function() {
            globals = true;
          };
          this.$get = ['$injector', '$window', function($injector, $window) {
            return function(expression, locals, later, ident) {
              var instance,
                  match,
                  constructor,
                  identifier;
              later = later === true;
              if (ident && isString(ident)) {
                identifier = ident;
              }
              if (isString(expression)) {
                match = expression.match(CNTRL_REG);
                if (!match) {
                  throw $controllerMinErr('ctrlfmt', "Badly formed controller string '{0}'. " + "Must match `__name__ as __id__` or `__name__`.", expression);
                }
                constructor = match[1], identifier = identifier || match[3];
                expression = controllers.hasOwnProperty(constructor) ? controllers[constructor] : getter(locals.$scope, constructor, true) || (globals ? getter($window, constructor, true) : undefined);
                assertArgFn(expression, constructor, true);
              }
              if (later) {
                var controllerPrototype = (isArray(expression) ? expression[expression.length - 1] : expression).prototype;
                instance = Object.create(controllerPrototype || null);
                if (identifier) {
                  addIdentifier(locals, identifier, instance, constructor || expression.name);
                }
                var instantiate;
                return instantiate = extend(function() {
                  var result = $injector.invoke(expression, instance, locals, constructor);
                  if (result !== instance && (isObject(result) || isFunction(result))) {
                    instance = result;
                    if (identifier) {
                      addIdentifier(locals, identifier, instance, constructor || expression.name);
                    }
                  }
                  return instance;
                }, {
                  instance: instance,
                  identifier: identifier
                });
              }
              instance = $injector.instantiate(expression, locals, constructor);
              if (identifier) {
                addIdentifier(locals, identifier, instance, constructor || expression.name);
              }
              return instance;
            };
            function addIdentifier(locals, identifier, instance, name) {
              if (!(locals && isObject(locals.$scope))) {
                throw minErr('$controller')('noscp', "Cannot export controller '{0}' as '{1}'! No $scope object provided via `locals`.", name, identifier);
              }
              locals.$scope[identifier] = instance;
            }
          }];
        }
        function $DocumentProvider() {
          this.$get = ['$window', function(window) {
            return jqLite(window.document);
          }];
        }
        function $ExceptionHandlerProvider() {
          this.$get = ['$log', function($log) {
            return function(exception, cause) {
              $log.error.apply($log, arguments);
            };
          }];
        }
        var APPLICATION_JSON = 'application/json';
        var CONTENT_TYPE_APPLICATION_JSON = {'Content-Type': APPLICATION_JSON + ';charset=utf-8'};
        var JSON_START = /^\[|^\{(?!\{)/;
        var JSON_ENDS = {
          '[': /]$/,
          '{': /}$/
        };
        var JSON_PROTECTION_PREFIX = /^\)\]\}',?\n/;
        function serializeValue(v) {
          if (isObject(v)) {
            return isDate(v) ? v.toISOString() : toJson(v);
          }
          return v;
        }
        function $HttpParamSerializerProvider() {
          this.$get = function() {
            return function ngParamSerializer(params) {
              if (!params)
                return '';
              var parts = [];
              forEachSorted(params, function(value, key) {
                if (value === null || isUndefined(value))
                  return;
                if (isArray(value)) {
                  forEach(value, function(v, k) {
                    parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(serializeValue(v)));
                  });
                } else {
                  parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(serializeValue(value)));
                }
              });
              return parts.join('&');
            };
          };
        }
        function $HttpParamSerializerJQLikeProvider() {
          this.$get = function() {
            return function jQueryLikeParamSerializer(params) {
              if (!params)
                return '';
              var parts = [];
              serialize(params, '', true);
              return parts.join('&');
              function serialize(toSerialize, prefix, topLevel) {
                if (toSerialize === null || isUndefined(toSerialize))
                  return;
                if (isArray(toSerialize)) {
                  forEach(toSerialize, function(value) {
                    serialize(value, prefix + '[]');
                  });
                } else if (isObject(toSerialize) && !isDate(toSerialize)) {
                  forEachSorted(toSerialize, function(value, key) {
                    serialize(value, prefix + (topLevel ? '' : '[') + key + (topLevel ? '' : ']'));
                  });
                } else {
                  parts.push(encodeUriQuery(prefix) + '=' + encodeUriQuery(serializeValue(toSerialize)));
                }
              }
            };
          };
        }
        function defaultHttpResponseTransform(data, headers) {
          if (isString(data)) {
            var tempData = data.replace(JSON_PROTECTION_PREFIX, '').trim();
            if (tempData) {
              var contentType = headers('Content-Type');
              if ((contentType && (contentType.indexOf(APPLICATION_JSON) === 0)) || isJsonLike(tempData)) {
                data = fromJson(tempData);
              }
            }
          }
          return data;
        }
        function isJsonLike(str) {
          var jsonStart = str.match(JSON_START);
          return jsonStart && JSON_ENDS[jsonStart[0]].test(str);
        }
        function parseHeaders(headers) {
          var parsed = createMap(),
              i;
          function fillInParsed(key, val) {
            if (key) {
              parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
            }
          }
          if (isString(headers)) {
            forEach(headers.split('\n'), function(line) {
              i = line.indexOf(':');
              fillInParsed(lowercase(trim(line.substr(0, i))), trim(line.substr(i + 1)));
            });
          } else if (isObject(headers)) {
            forEach(headers, function(headerVal, headerKey) {
              fillInParsed(lowercase(headerKey), trim(headerVal));
            });
          }
          return parsed;
        }
        function headersGetter(headers) {
          var headersObj;
          return function(name) {
            if (!headersObj)
              headersObj = parseHeaders(headers);
            if (name) {
              var value = headersObj[lowercase(name)];
              if (value === void 0) {
                value = null;
              }
              return value;
            }
            return headersObj;
          };
        }
        function transformData(data, headers, status, fns) {
          if (isFunction(fns)) {
            return fns(data, headers, status);
          }
          forEach(fns, function(fn) {
            data = fn(data, headers, status);
          });
          return data;
        }
        function isSuccess(status) {
          return 200 <= status && status < 300;
        }
        function $HttpProvider() {
          var defaults = this.defaults = {
            transformResponse: [defaultHttpResponseTransform],
            transformRequest: [function(d) {
              return isObject(d) && !isFile(d) && !isBlob(d) && !isFormData(d) ? toJson(d) : d;
            }],
            headers: {
              common: {'Accept': 'application/json, text/plain, */*'},
              post: shallowCopy(CONTENT_TYPE_APPLICATION_JSON),
              put: shallowCopy(CONTENT_TYPE_APPLICATION_JSON),
              patch: shallowCopy(CONTENT_TYPE_APPLICATION_JSON)
            },
            xsrfCookieName: 'XSRF-TOKEN',
            xsrfHeaderName: 'X-XSRF-TOKEN',
            paramSerializer: '$httpParamSerializer'
          };
          var useApplyAsync = false;
          this.useApplyAsync = function(value) {
            if (isDefined(value)) {
              useApplyAsync = !!value;
              return this;
            }
            return useApplyAsync;
          };
          var interceptorFactories = this.interceptors = [];
          this.$get = ['$httpBackend', '$$cookieReader', '$cacheFactory', '$rootScope', '$q', '$injector', function($httpBackend, $$cookieReader, $cacheFactory, $rootScope, $q, $injector) {
            var defaultCache = $cacheFactory('$http');
            defaults.paramSerializer = isString(defaults.paramSerializer) ? $injector.get(defaults.paramSerializer) : defaults.paramSerializer;
            var reversedInterceptors = [];
            forEach(interceptorFactories, function(interceptorFactory) {
              reversedInterceptors.unshift(isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
            });
            function $http(requestConfig) {
              if (!angular.isObject(requestConfig)) {
                throw minErr('$http')('badreq', 'Http request configuration must be an object.  Received: {0}', requestConfig);
              }
              var config = extend({
                method: 'get',
                transformRequest: defaults.transformRequest,
                transformResponse: defaults.transformResponse,
                paramSerializer: defaults.paramSerializer
              }, requestConfig);
              config.headers = mergeHeaders(requestConfig);
              config.method = uppercase(config.method);
              config.paramSerializer = isString(config.paramSerializer) ? $injector.get(config.paramSerializer) : config.paramSerializer;
              var serverRequest = function(config) {
                var headers = config.headers;
                var reqData = transformData(config.data, headersGetter(headers), undefined, config.transformRequest);
                if (isUndefined(reqData)) {
                  forEach(headers, function(value, header) {
                    if (lowercase(header) === 'content-type') {
                      delete headers[header];
                    }
                  });
                }
                if (isUndefined(config.withCredentials) && !isUndefined(defaults.withCredentials)) {
                  config.withCredentials = defaults.withCredentials;
                }
                return sendReq(config, reqData).then(transformResponse, transformResponse);
              };
              var chain = [serverRequest, undefined];
              var promise = $q.when(config);
              forEach(reversedInterceptors, function(interceptor) {
                if (interceptor.request || interceptor.requestError) {
                  chain.unshift(interceptor.request, interceptor.requestError);
                }
                if (interceptor.response || interceptor.responseError) {
                  chain.push(interceptor.response, interceptor.responseError);
                }
              });
              while (chain.length) {
                var thenFn = chain.shift();
                var rejectFn = chain.shift();
                promise = promise.then(thenFn, rejectFn);
              }
              promise.success = function(fn) {
                assertArgFn(fn, 'fn');
                promise.then(function(response) {
                  fn(response.data, response.status, response.headers, config);
                });
                return promise;
              };
              promise.error = function(fn) {
                assertArgFn(fn, 'fn');
                promise.then(null, function(response) {
                  fn(response.data, response.status, response.headers, config);
                });
                return promise;
              };
              return promise;
              function transformResponse(response) {
                var resp = extend({}, response);
                if (!response.data) {
                  resp.data = response.data;
                } else {
                  resp.data = transformData(response.data, response.headers, response.status, config.transformResponse);
                }
                return (isSuccess(response.status)) ? resp : $q.reject(resp);
              }
              function executeHeaderFns(headers, config) {
                var headerContent,
                    processedHeaders = {};
                forEach(headers, function(headerFn, header) {
                  if (isFunction(headerFn)) {
                    headerContent = headerFn(config);
                    if (headerContent != null) {
                      processedHeaders[header] = headerContent;
                    }
                  } else {
                    processedHeaders[header] = headerFn;
                  }
                });
                return processedHeaders;
              }
              function mergeHeaders(config) {
                var defHeaders = defaults.headers,
                    reqHeaders = extend({}, config.headers),
                    defHeaderName,
                    lowercaseDefHeaderName,
                    reqHeaderName;
                defHeaders = extend({}, defHeaders.common, defHeaders[lowercase(config.method)]);
                defaultHeadersIteration: for (defHeaderName in defHeaders) {
                  lowercaseDefHeaderName = lowercase(defHeaderName);
                  for (reqHeaderName in reqHeaders) {
                    if (lowercase(reqHeaderName) === lowercaseDefHeaderName) {
                      continue defaultHeadersIteration;
                    }
                  }
                  reqHeaders[defHeaderName] = defHeaders[defHeaderName];
                }
                return executeHeaderFns(reqHeaders, shallowCopy(config));
              }
            }
            $http.pendingRequests = [];
            createShortMethods('get', 'delete', 'head', 'jsonp');
            createShortMethodsWithData('post', 'put', 'patch');
            $http.defaults = defaults;
            return $http;
            function createShortMethods(names) {
              forEach(arguments, function(name) {
                $http[name] = function(url, config) {
                  return $http(extend({}, config || {}, {
                    method: name,
                    url: url
                  }));
                };
              });
            }
            function createShortMethodsWithData(name) {
              forEach(arguments, function(name) {
                $http[name] = function(url, data, config) {
                  return $http(extend({}, config || {}, {
                    method: name,
                    url: url,
                    data: data
                  }));
                };
              });
            }
            function sendReq(config, reqData) {
              var deferred = $q.defer(),
                  promise = deferred.promise,
                  cache,
                  cachedResp,
                  reqHeaders = config.headers,
                  url = buildUrl(config.url, config.paramSerializer(config.params));
              $http.pendingRequests.push(config);
              promise.then(removePendingReq, removePendingReq);
              if ((config.cache || defaults.cache) && config.cache !== false && (config.method === 'GET' || config.method === 'JSONP')) {
                cache = isObject(config.cache) ? config.cache : isObject(defaults.cache) ? defaults.cache : defaultCache;
              }
              if (cache) {
                cachedResp = cache.get(url);
                if (isDefined(cachedResp)) {
                  if (isPromiseLike(cachedResp)) {
                    cachedResp.then(resolvePromiseWithResult, resolvePromiseWithResult);
                  } else {
                    if (isArray(cachedResp)) {
                      resolvePromise(cachedResp[1], cachedResp[0], shallowCopy(cachedResp[2]), cachedResp[3]);
                    } else {
                      resolvePromise(cachedResp, 200, {}, 'OK');
                    }
                  }
                } else {
                  cache.put(url, promise);
                }
              }
              if (isUndefined(cachedResp)) {
                var xsrfValue = urlIsSameOrigin(config.url) ? $$cookieReader()[config.xsrfCookieName || defaults.xsrfCookieName] : undefined;
                if (xsrfValue) {
                  reqHeaders[(config.xsrfHeaderName || defaults.xsrfHeaderName)] = xsrfValue;
                }
                $httpBackend(config.method, url, reqData, done, reqHeaders, config.timeout, config.withCredentials, config.responseType);
              }
              return promise;
              function done(status, response, headersString, statusText) {
                if (cache) {
                  if (isSuccess(status)) {
                    cache.put(url, [status, response, parseHeaders(headersString), statusText]);
                  } else {
                    cache.remove(url);
                  }
                }
                function resolveHttpPromise() {
                  resolvePromise(response, status, headersString, statusText);
                }
                if (useApplyAsync) {
                  $rootScope.$applyAsync(resolveHttpPromise);
                } else {
                  resolveHttpPromise();
                  if (!$rootScope.$$phase)
                    $rootScope.$apply();
                }
              }
              function resolvePromise(response, status, headers, statusText) {
                status = Math.max(status, 0);
                (isSuccess(status) ? deferred.resolve : deferred.reject)({
                  data: response,
                  status: status,
                  headers: headersGetter(headers),
                  config: config,
                  statusText: statusText
                });
              }
              function resolvePromiseWithResult(result) {
                resolvePromise(result.data, result.status, shallowCopy(result.headers()), result.statusText);
              }
              function removePendingReq() {
                var idx = $http.pendingRequests.indexOf(config);
                if (idx !== -1)
                  $http.pendingRequests.splice(idx, 1);
              }
            }
            function buildUrl(url, serializedParams) {
              if (serializedParams.length > 0) {
                url += ((url.indexOf('?') == -1) ? '?' : '&') + serializedParams;
              }
              return url;
            }
          }];
        }
        function createXhr() {
          return new window.XMLHttpRequest();
        }
        function $HttpBackendProvider() {
          this.$get = ['$browser', '$window', '$document', function($browser, $window, $document) {
            return createHttpBackend($browser, createXhr, $browser.defer, $window.angular.callbacks, $document[0]);
          }];
        }
        function createHttpBackend($browser, createXhr, $browserDefer, callbacks, rawDocument) {
          return function(method, url, post, callback, headers, timeout, withCredentials, responseType) {
            $browser.$$incOutstandingRequestCount();
            url = url || $browser.url();
            if (lowercase(method) == 'jsonp') {
              var callbackId = '_' + (callbacks.counter++).toString(36);
              callbacks[callbackId] = function(data) {
                callbacks[callbackId].data = data;
                callbacks[callbackId].called = true;
              };
              var jsonpDone = jsonpReq(url.replace('JSON_CALLBACK', 'angular.callbacks.' + callbackId), callbackId, function(status, text) {
                completeRequest(callback, status, callbacks[callbackId].data, "", text);
                callbacks[callbackId] = noop;
              });
            } else {
              var xhr = createXhr();
              xhr.open(method, url, true);
              forEach(headers, function(value, key) {
                if (isDefined(value)) {
                  xhr.setRequestHeader(key, value);
                }
              });
              xhr.onload = function requestLoaded() {
                var statusText = xhr.statusText || '';
                var response = ('response' in xhr) ? xhr.response : xhr.responseText;
                var status = xhr.status === 1223 ? 204 : xhr.status;
                if (status === 0) {
                  status = response ? 200 : urlResolve(url).protocol == 'file' ? 404 : 0;
                }
                completeRequest(callback, status, response, xhr.getAllResponseHeaders(), statusText);
              };
              var requestError = function() {
                completeRequest(callback, -1, null, null, '');
              };
              xhr.onerror = requestError;
              xhr.onabort = requestError;
              if (withCredentials) {
                xhr.withCredentials = true;
              }
              if (responseType) {
                try {
                  xhr.responseType = responseType;
                } catch (e) {
                  if (responseType !== 'json') {
                    throw e;
                  }
                }
              }
              xhr.send(post);
            }
            if (timeout > 0) {
              var timeoutId = $browserDefer(timeoutRequest, timeout);
            } else if (isPromiseLike(timeout)) {
              timeout.then(timeoutRequest);
            }
            function timeoutRequest() {
              jsonpDone && jsonpDone();
              xhr && xhr.abort();
            }
            function completeRequest(callback, status, response, headersString, statusText) {
              if (timeoutId !== undefined) {
                $browserDefer.cancel(timeoutId);
              }
              jsonpDone = xhr = null;
              callback(status, response, headersString, statusText);
              $browser.$$completeOutstandingRequest(noop);
            }
          };
          function jsonpReq(url, callbackId, done) {
            var script = rawDocument.createElement('script'),
                callback = null;
            script.type = "text/javascript";
            script.src = url;
            script.async = true;
            callback = function(event) {
              removeEventListenerFn(script, "load", callback);
              removeEventListenerFn(script, "error", callback);
              rawDocument.body.removeChild(script);
              script = null;
              var status = -1;
              var text = "unknown";
              if (event) {
                if (event.type === "load" && !callbacks[callbackId].called) {
                  event = {type: "error"};
                }
                text = event.type;
                status = event.type === "error" ? 404 : 200;
              }
              if (done) {
                done(status, text);
              }
            };
            addEventListenerFn(script, "load", callback);
            addEventListenerFn(script, "error", callback);
            rawDocument.body.appendChild(script);
            return callback;
          }
        }
        var $interpolateMinErr = angular.$interpolateMinErr = minErr('$interpolate');
        $interpolateMinErr.throwNoconcat = function(text) {
          throw $interpolateMinErr('noconcat', "Error while interpolating: {0}\nStrict Contextual Escaping disallows " + "interpolations that concatenate multiple expressions when a trusted value is " + "required.  See http://docs.angularjs.org/api/ng.$sce", text);
        };
        $interpolateMinErr.interr = function(text, err) {
          return $interpolateMinErr('interr', "Can't interpolate: {0}\n{1}", text, err.toString());
        };
        function $InterpolateProvider() {
          var startSymbol = '{{';
          var endSymbol = '}}';
          this.startSymbol = function(value) {
            if (value) {
              startSymbol = value;
              return this;
            } else {
              return startSymbol;
            }
          };
          this.endSymbol = function(value) {
            if (value) {
              endSymbol = value;
              return this;
            } else {
              return endSymbol;
            }
          };
          this.$get = ['$parse', '$exceptionHandler', '$sce', function($parse, $exceptionHandler, $sce) {
            var startSymbolLength = startSymbol.length,
                endSymbolLength = endSymbol.length,
                escapedStartRegexp = new RegExp(startSymbol.replace(/./g, escape), 'g'),
                escapedEndRegexp = new RegExp(endSymbol.replace(/./g, escape), 'g');
            function escape(ch) {
              return '\\\\\\' + ch;
            }
            function unescapeText(text) {
              return text.replace(escapedStartRegexp, startSymbol).replace(escapedEndRegexp, endSymbol);
            }
            function stringify(value) {
              if (value == null) {
                return '';
              }
              switch (typeof value) {
                case 'string':
                  break;
                case 'number':
                  value = '' + value;
                  break;
                default:
                  value = toJson(value);
              }
              return value;
            }
            function $interpolate(text, mustHaveExpression, trustedContext, allOrNothing) {
              allOrNothing = !!allOrNothing;
              var startIndex,
                  endIndex,
                  index = 0,
                  expressions = [],
                  parseFns = [],
                  textLength = text.length,
                  exp,
                  concat = [],
                  expressionPositions = [];
              while (index < textLength) {
                if (((startIndex = text.indexOf(startSymbol, index)) != -1) && ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1)) {
                  if (index !== startIndex) {
                    concat.push(unescapeText(text.substring(index, startIndex)));
                  }
                  exp = text.substring(startIndex + startSymbolLength, endIndex);
                  expressions.push(exp);
                  parseFns.push($parse(exp, parseStringifyInterceptor));
                  index = endIndex + endSymbolLength;
                  expressionPositions.push(concat.length);
                  concat.push('');
                } else {
                  if (index !== textLength) {
                    concat.push(unescapeText(text.substring(index)));
                  }
                  break;
                }
              }
              if (trustedContext && concat.length > 1) {
                $interpolateMinErr.throwNoconcat(text);
              }
              if (!mustHaveExpression || expressions.length) {
                var compute = function(values) {
                  for (var i = 0,
                      ii = expressions.length; i < ii; i++) {
                    if (allOrNothing && isUndefined(values[i]))
                      return;
                    concat[expressionPositions[i]] = values[i];
                  }
                  return concat.join('');
                };
                var getValue = function(value) {
                  return trustedContext ? $sce.getTrusted(trustedContext, value) : $sce.valueOf(value);
                };
                return extend(function interpolationFn(context) {
                  var i = 0;
                  var ii = expressions.length;
                  var values = new Array(ii);
                  try {
                    for (; i < ii; i++) {
                      values[i] = parseFns[i](context);
                    }
                    return compute(values);
                  } catch (err) {
                    $exceptionHandler($interpolateMinErr.interr(text, err));
                  }
                }, {
                  exp: text,
                  expressions: expressions,
                  $$watchDelegate: function(scope, listener) {
                    var lastValue;
                    return scope.$watchGroup(parseFns, function interpolateFnWatcher(values, oldValues) {
                      var currValue = compute(values);
                      if (isFunction(listener)) {
                        listener.call(this, currValue, values !== oldValues ? lastValue : currValue, scope);
                      }
                      lastValue = currValue;
                    });
                  }
                });
              }
              function parseStringifyInterceptor(value) {
                try {
                  value = getValue(value);
                  return allOrNothing && !isDefined(value) ? value : stringify(value);
                } catch (err) {
                  $exceptionHandler($interpolateMinErr.interr(text, err));
                }
              }
            }
            $interpolate.startSymbol = function() {
              return startSymbol;
            };
            $interpolate.endSymbol = function() {
              return endSymbol;
            };
            return $interpolate;
          }];
        }
        function $IntervalProvider() {
          this.$get = ['$rootScope', '$window', '$q', '$$q', function($rootScope, $window, $q, $$q) {
            var intervals = {};
            function interval(fn, delay, count, invokeApply) {
              var hasParams = arguments.length > 4,
                  args = hasParams ? sliceArgs(arguments, 4) : [],
                  setInterval = $window.setInterval,
                  clearInterval = $window.clearInterval,
                  iteration = 0,
                  skipApply = (isDefined(invokeApply) && !invokeApply),
                  deferred = (skipApply ? $$q : $q).defer(),
                  promise = deferred.promise;
              count = isDefined(count) ? count : 0;
              promise.then(null, null, (!hasParams) ? fn : function() {
                fn.apply(null, args);
              });
              promise.$$intervalId = setInterval(function tick() {
                deferred.notify(iteration++);
                if (count > 0 && iteration >= count) {
                  deferred.resolve(iteration);
                  clearInterval(promise.$$intervalId);
                  delete intervals[promise.$$intervalId];
                }
                if (!skipApply)
                  $rootScope.$apply();
              }, delay);
              intervals[promise.$$intervalId] = deferred;
              return promise;
            }
            interval.cancel = function(promise) {
              if (promise && promise.$$intervalId in intervals) {
                intervals[promise.$$intervalId].reject('canceled');
                $window.clearInterval(promise.$$intervalId);
                delete intervals[promise.$$intervalId];
                return true;
              }
              return false;
            };
            return interval;
          }];
        }
        function $LocaleProvider() {
          this.$get = function() {
            return {
              id: 'en-us',
              NUMBER_FORMATS: {
                DECIMAL_SEP: '.',
                GROUP_SEP: ',',
                PATTERNS: [{
                  minInt: 1,
                  minFrac: 0,
                  maxFrac: 3,
                  posPre: '',
                  posSuf: '',
                  negPre: '-',
                  negSuf: '',
                  gSize: 3,
                  lgSize: 3
                }, {
                  minInt: 1,
                  minFrac: 2,
                  maxFrac: 2,
                  posPre: '\u00A4',
                  posSuf: '',
                  negPre: '(\u00A4',
                  negSuf: ')',
                  gSize: 3,
                  lgSize: 3
                }],
                CURRENCY_SYM: '$'
              },
              DATETIME_FORMATS: {
                MONTH: 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
                SHORTMONTH: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
                DAY: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
                SHORTDAY: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(','),
                AMPMS: ['AM', 'PM'],
                medium: 'MMM d, y h:mm:ss a',
                'short': 'M/d/yy h:mm a',
                fullDate: 'EEEE, MMMM d, y',
                longDate: 'MMMM d, y',
                mediumDate: 'MMM d, y',
                shortDate: 'M/d/yy',
                mediumTime: 'h:mm:ss a',
                shortTime: 'h:mm a',
                ERANAMES: ["Before Christ", "Anno Domini"],
                ERAS: ["BC", "AD"]
              },
              pluralCat: function(num) {
                if (num === 1) {
                  return 'one';
                }
                return 'other';
              }
            };
          };
        }
        var PATH_MATCH = /^([^\?#]*)(\?([^#]*))?(#(.*))?$/,
            DEFAULT_PORTS = {
              'http': 80,
              'https': 443,
              'ftp': 21
            };
        var $locationMinErr = minErr('$location');
        function encodePath(path) {
          var segments = path.split('/'),
              i = segments.length;
          while (i--) {
            segments[i] = encodeUriSegment(segments[i]);
          }
          return segments.join('/');
        }
        function parseAbsoluteUrl(absoluteUrl, locationObj) {
          var parsedUrl = urlResolve(absoluteUrl);
          locationObj.$$protocol = parsedUrl.protocol;
          locationObj.$$host = parsedUrl.hostname;
          locationObj.$$port = toInt(parsedUrl.port) || DEFAULT_PORTS[parsedUrl.protocol] || null;
        }
        function parseAppUrl(relativeUrl, locationObj) {
          var prefixed = (relativeUrl.charAt(0) !== '/');
          if (prefixed) {
            relativeUrl = '/' + relativeUrl;
          }
          var match = urlResolve(relativeUrl);
          locationObj.$$path = decodeURIComponent(prefixed && match.pathname.charAt(0) === '/' ? match.pathname.substring(1) : match.pathname);
          locationObj.$$search = parseKeyValue(match.search);
          locationObj.$$hash = decodeURIComponent(match.hash);
          if (locationObj.$$path && locationObj.$$path.charAt(0) != '/') {
            locationObj.$$path = '/' + locationObj.$$path;
          }
        }
        function beginsWith(begin, whole) {
          if (whole.indexOf(begin) === 0) {
            return whole.substr(begin.length);
          }
        }
        function stripHash(url) {
          var index = url.indexOf('#');
          return index == -1 ? url : url.substr(0, index);
        }
        function trimEmptyHash(url) {
          return url.replace(/(#.+)|#$/, '$1');
        }
        function stripFile(url) {
          return url.substr(0, stripHash(url).lastIndexOf('/') + 1);
        }
        function serverBase(url) {
          return url.substring(0, url.indexOf('/', url.indexOf('//') + 2));
        }
        function LocationHtml5Url(appBase, basePrefix) {
          this.$$html5 = true;
          basePrefix = basePrefix || '';
          var appBaseNoFile = stripFile(appBase);
          parseAbsoluteUrl(appBase, this);
          this.$$parse = function(url) {
            var pathUrl = beginsWith(appBaseNoFile, url);
            if (!isString(pathUrl)) {
              throw $locationMinErr('ipthprfx', 'Invalid url "{0}", missing path prefix "{1}".', url, appBaseNoFile);
            }
            parseAppUrl(pathUrl, this);
            if (!this.$$path) {
              this.$$path = '/';
            }
            this.$$compose();
          };
          this.$$compose = function() {
            var search = toKeyValue(this.$$search),
                hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';
            this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
            this.$$absUrl = appBaseNoFile + this.$$url.substr(1);
          };
          this.$$parseLinkUrl = function(url, relHref) {
            if (relHref && relHref[0] === '#') {
              this.hash(relHref.slice(1));
              return true;
            }
            var appUrl,
                prevAppUrl;
            var rewrittenUrl;
            if ((appUrl = beginsWith(appBase, url)) !== undefined) {
              prevAppUrl = appUrl;
              if ((appUrl = beginsWith(basePrefix, appUrl)) !== undefined) {
                rewrittenUrl = appBaseNoFile + (beginsWith('/', appUrl) || appUrl);
              } else {
                rewrittenUrl = appBase + prevAppUrl;
              }
            } else if ((appUrl = beginsWith(appBaseNoFile, url)) !== undefined) {
              rewrittenUrl = appBaseNoFile + appUrl;
            } else if (appBaseNoFile == url + '/') {
              rewrittenUrl = appBaseNoFile;
            }
            if (rewrittenUrl) {
              this.$$parse(rewrittenUrl);
            }
            return !!rewrittenUrl;
          };
        }
        function LocationHashbangUrl(appBase, hashPrefix) {
          var appBaseNoFile = stripFile(appBase);
          parseAbsoluteUrl(appBase, this);
          this.$$parse = function(url) {
            var withoutBaseUrl = beginsWith(appBase, url) || beginsWith(appBaseNoFile, url);
            var withoutHashUrl;
            if (!isUndefined(withoutBaseUrl) && withoutBaseUrl.charAt(0) === '#') {
              withoutHashUrl = beginsWith(hashPrefix, withoutBaseUrl);
              if (isUndefined(withoutHashUrl)) {
                withoutHashUrl = withoutBaseUrl;
              }
            } else {
              if (this.$$html5) {
                withoutHashUrl = withoutBaseUrl;
              } else {
                withoutHashUrl = '';
                if (isUndefined(withoutBaseUrl)) {
                  appBase = url;
                  this.replace();
                }
              }
            }
            parseAppUrl(withoutHashUrl, this);
            this.$$path = removeWindowsDriveName(this.$$path, withoutHashUrl, appBase);
            this.$$compose();
            function removeWindowsDriveName(path, url, base) {
              var windowsFilePathExp = /^\/[A-Z]:(\/.*)/;
              var firstPathSegmentMatch;
              if (url.indexOf(base) === 0) {
                url = url.replace(base, '');
              }
              if (windowsFilePathExp.exec(url)) {
                return path;
              }
              firstPathSegmentMatch = windowsFilePathExp.exec(path);
              return firstPathSegmentMatch ? firstPathSegmentMatch[1] : path;
            }
          };
          this.$$compose = function() {
            var search = toKeyValue(this.$$search),
                hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';
            this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
            this.$$absUrl = appBase + (this.$$url ? hashPrefix + this.$$url : '');
          };
          this.$$parseLinkUrl = function(url, relHref) {
            if (stripHash(appBase) == stripHash(url)) {
              this.$$parse(url);
              return true;
            }
            return false;
          };
        }
        function LocationHashbangInHtml5Url(appBase, hashPrefix) {
          this.$$html5 = true;
          LocationHashbangUrl.apply(this, arguments);
          var appBaseNoFile = stripFile(appBase);
          this.$$parseLinkUrl = function(url, relHref) {
            if (relHref && relHref[0] === '#') {
              this.hash(relHref.slice(1));
              return true;
            }
            var rewrittenUrl;
            var appUrl;
            if (appBase == stripHash(url)) {
              rewrittenUrl = url;
            } else if ((appUrl = beginsWith(appBaseNoFile, url))) {
              rewrittenUrl = appBase + hashPrefix + appUrl;
            } else if (appBaseNoFile === url + '/') {
              rewrittenUrl = appBaseNoFile;
            }
            if (rewrittenUrl) {
              this.$$parse(rewrittenUrl);
            }
            return !!rewrittenUrl;
          };
          this.$$compose = function() {
            var search = toKeyValue(this.$$search),
                hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';
            this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
            this.$$absUrl = appBase + hashPrefix + this.$$url;
          };
        }
        var locationPrototype = {
          $$html5: false,
          $$replace: false,
          absUrl: locationGetter('$$absUrl'),
          url: function(url) {
            if (isUndefined(url)) {
              return this.$$url;
            }
            var match = PATH_MATCH.exec(url);
            if (match[1] || url === '')
              this.path(decodeURIComponent(match[1]));
            if (match[2] || match[1] || url === '')
              this.search(match[3] || '');
            this.hash(match[5] || '');
            return this;
          },
          protocol: locationGetter('$$protocol'),
          host: locationGetter('$$host'),
          port: locationGetter('$$port'),
          path: locationGetterSetter('$$path', function(path) {
            path = path !== null ? path.toString() : '';
            return path.charAt(0) == '/' ? path : '/' + path;
          }),
          search: function(search, paramValue) {
            switch (arguments.length) {
              case 0:
                return this.$$search;
              case 1:
                if (isString(search) || isNumber(search)) {
                  search = search.toString();
                  this.$$search = parseKeyValue(search);
                } else if (isObject(search)) {
                  search = copy(search, {});
                  forEach(search, function(value, key) {
                    if (value == null)
                      delete search[key];
                  });
                  this.$$search = search;
                } else {
                  throw $locationMinErr('isrcharg', 'The first argument of the `$location#search()` call must be a string or an object.');
                }
                break;
              default:
                if (isUndefined(paramValue) || paramValue === null) {
                  delete this.$$search[search];
                } else {
                  this.$$search[search] = paramValue;
                }
            }
            this.$$compose();
            return this;
          },
          hash: locationGetterSetter('$$hash', function(hash) {
            return hash !== null ? hash.toString() : '';
          }),
          replace: function() {
            this.$$replace = true;
            return this;
          }
        };
        forEach([LocationHashbangInHtml5Url, LocationHashbangUrl, LocationHtml5Url], function(Location) {
          Location.prototype = Object.create(locationPrototype);
          Location.prototype.state = function(state) {
            if (!arguments.length) {
              return this.$$state;
            }
            if (Location !== LocationHtml5Url || !this.$$html5) {
              throw $locationMinErr('nostate', 'History API state support is available only ' + 'in HTML5 mode and only in browsers supporting HTML5 History API');
            }
            this.$$state = isUndefined(state) ? null : state;
            return this;
          };
        });
        function locationGetter(property) {
          return function() {
            return this[property];
          };
        }
        function locationGetterSetter(property, preprocess) {
          return function(value) {
            if (isUndefined(value)) {
              return this[property];
            }
            this[property] = preprocess(value);
            this.$$compose();
            return this;
          };
        }
        function $LocationProvider() {
          var hashPrefix = '',
              html5Mode = {
                enabled: false,
                requireBase: true,
                rewriteLinks: true
              };
          this.hashPrefix = function(prefix) {
            if (isDefined(prefix)) {
              hashPrefix = prefix;
              return this;
            } else {
              return hashPrefix;
            }
          };
          this.html5Mode = function(mode) {
            if (isBoolean(mode)) {
              html5Mode.enabled = mode;
              return this;
            } else if (isObject(mode)) {
              if (isBoolean(mode.enabled)) {
                html5Mode.enabled = mode.enabled;
              }
              if (isBoolean(mode.requireBase)) {
                html5Mode.requireBase = mode.requireBase;
              }
              if (isBoolean(mode.rewriteLinks)) {
                html5Mode.rewriteLinks = mode.rewriteLinks;
              }
              return this;
            } else {
              return html5Mode;
            }
          };
          this.$get = ['$rootScope', '$browser', '$sniffer', '$rootElement', '$window', function($rootScope, $browser, $sniffer, $rootElement, $window) {
            var $location,
                LocationMode,
                baseHref = $browser.baseHref(),
                initialUrl = $browser.url(),
                appBase;
            if (html5Mode.enabled) {
              if (!baseHref && html5Mode.requireBase) {
                throw $locationMinErr('nobase', "$location in HTML5 mode requires a <base> tag to be present!");
              }
              appBase = serverBase(initialUrl) + (baseHref || '/');
              LocationMode = $sniffer.history ? LocationHtml5Url : LocationHashbangInHtml5Url;
            } else {
              appBase = stripHash(initialUrl);
              LocationMode = LocationHashbangUrl;
            }
            $location = new LocationMode(appBase, '#' + hashPrefix);
            $location.$$parseLinkUrl(initialUrl, initialUrl);
            $location.$$state = $browser.state();
            var IGNORE_URI_REGEXP = /^\s*(javascript|mailto):/i;
            function setBrowserUrlWithFallback(url, replace, state) {
              var oldUrl = $location.url();
              var oldState = $location.$$state;
              try {
                $browser.url(url, replace, state);
                $location.$$state = $browser.state();
              } catch (e) {
                $location.url(oldUrl);
                $location.$$state = oldState;
                throw e;
              }
            }
            $rootElement.on('click', function(event) {
              if (!html5Mode.rewriteLinks || event.ctrlKey || event.metaKey || event.shiftKey || event.which == 2 || event.button == 2)
                return;
              var elm = jqLite(event.target);
              while (nodeName_(elm[0]) !== 'a') {
                if (elm[0] === $rootElement[0] || !(elm = elm.parent())[0])
                  return;
              }
              var absHref = elm.prop('href');
              var relHref = elm.attr('href') || elm.attr('xlink:href');
              if (isObject(absHref) && absHref.toString() === '[object SVGAnimatedString]') {
                absHref = urlResolve(absHref.animVal).href;
              }
              if (IGNORE_URI_REGEXP.test(absHref))
                return;
              if (absHref && !elm.attr('target') && !event.isDefaultPrevented()) {
                if ($location.$$parseLinkUrl(absHref, relHref)) {
                  event.preventDefault();
                  if ($location.absUrl() != $browser.url()) {
                    $rootScope.$apply();
                    $window.angular['ff-684208-preventDefault'] = true;
                  }
                }
              }
            });
            if (trimEmptyHash($location.absUrl()) != trimEmptyHash(initialUrl)) {
              $browser.url($location.absUrl(), true);
            }
            var initializing = true;
            $browser.onUrlChange(function(newUrl, newState) {
              $rootScope.$evalAsync(function() {
                var oldUrl = $location.absUrl();
                var oldState = $location.$$state;
                var defaultPrevented;
                $location.$$parse(newUrl);
                $location.$$state = newState;
                defaultPrevented = $rootScope.$broadcast('$locationChangeStart', newUrl, oldUrl, newState, oldState).defaultPrevented;
                if ($location.absUrl() !== newUrl)
                  return;
                if (defaultPrevented) {
                  $location.$$parse(oldUrl);
                  $location.$$state = oldState;
                  setBrowserUrlWithFallback(oldUrl, false, oldState);
                } else {
                  initializing = false;
                  afterLocationChange(oldUrl, oldState);
                }
              });
              if (!$rootScope.$$phase)
                $rootScope.$digest();
            });
            $rootScope.$watch(function $locationWatch() {
              var oldUrl = trimEmptyHash($browser.url());
              var newUrl = trimEmptyHash($location.absUrl());
              var oldState = $browser.state();
              var currentReplace = $location.$$replace;
              var urlOrStateChanged = oldUrl !== newUrl || ($location.$$html5 && $sniffer.history && oldState !== $location.$$state);
              if (initializing || urlOrStateChanged) {
                initializing = false;
                $rootScope.$evalAsync(function() {
                  var newUrl = $location.absUrl();
                  var defaultPrevented = $rootScope.$broadcast('$locationChangeStart', newUrl, oldUrl, $location.$$state, oldState).defaultPrevented;
                  if ($location.absUrl() !== newUrl)
                    return;
                  if (defaultPrevented) {
                    $location.$$parse(oldUrl);
                    $location.$$state = oldState;
                  } else {
                    if (urlOrStateChanged) {
                      setBrowserUrlWithFallback(newUrl, currentReplace, oldState === $location.$$state ? null : $location.$$state);
                    }
                    afterLocationChange(oldUrl, oldState);
                  }
                });
              }
              $location.$$replace = false;
            });
            return $location;
            function afterLocationChange(oldUrl, oldState) {
              $rootScope.$broadcast('$locationChangeSuccess', $location.absUrl(), oldUrl, $location.$$state, oldState);
            }
          }];
        }
        function $LogProvider() {
          var debug = true,
              self = this;
          this.debugEnabled = function(flag) {
            if (isDefined(flag)) {
              debug = flag;
              return this;
            } else {
              return debug;
            }
          };
          this.$get = ['$window', function($window) {
            return {
              log: consoleLog('log'),
              info: consoleLog('info'),
              warn: consoleLog('warn'),
              error: consoleLog('error'),
              debug: (function() {
                var fn = consoleLog('debug');
                return function() {
                  if (debug) {
                    fn.apply(self, arguments);
                  }
                };
              }())
            };
            function formatError(arg) {
              if (arg instanceof Error) {
                if (arg.stack) {
                  arg = (arg.message && arg.stack.indexOf(arg.message) === -1) ? 'Error: ' + arg.message + '\n' + arg.stack : arg.stack;
                } else if (arg.sourceURL) {
                  arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
                }
              }
              return arg;
            }
            function consoleLog(type) {
              var console = $window.console || {},
                  logFn = console[type] || console.log || noop,
                  hasApply = false;
              try {
                hasApply = !!logFn.apply;
              } catch (e) {}
              if (hasApply) {
                return function() {
                  var args = [];
                  forEach(arguments, function(arg) {
                    args.push(formatError(arg));
                  });
                  return logFn.apply(console, args);
                };
              }
              return function(arg1, arg2) {
                logFn(arg1, arg2 == null ? '' : arg2);
              };
            }
          }];
        }
        var $parseMinErr = minErr('$parse');
        function ensureSafeMemberName(name, fullExpression) {
          if (name === "__defineGetter__" || name === "__defineSetter__" || name === "__lookupGetter__" || name === "__lookupSetter__" || name === "__proto__") {
            throw $parseMinErr('isecfld', 'Attempting to access a disallowed field in Angular expressions! ' + 'Expression: {0}', fullExpression);
          }
          return name;
        }
        function ensureSafeObject(obj, fullExpression) {
          if (obj) {
            if (obj.constructor === obj) {
              throw $parseMinErr('isecfn', 'Referencing Function in Angular expressions is disallowed! Expression: {0}', fullExpression);
            } else if (obj.window === obj) {
              throw $parseMinErr('isecwindow', 'Referencing the Window in Angular expressions is disallowed! Expression: {0}', fullExpression);
            } else if (obj.children && (obj.nodeName || (obj.prop && obj.attr && obj.find))) {
              throw $parseMinErr('isecdom', 'Referencing DOM nodes in Angular expressions is disallowed! Expression: {0}', fullExpression);
            } else if (obj === Object) {
              throw $parseMinErr('isecobj', 'Referencing Object in Angular expressions is disallowed! Expression: {0}', fullExpression);
            }
          }
          return obj;
        }
        var CALL = Function.prototype.call;
        var APPLY = Function.prototype.apply;
        var BIND = Function.prototype.bind;
        function ensureSafeFunction(obj, fullExpression) {
          if (obj) {
            if (obj.constructor === obj) {
              throw $parseMinErr('isecfn', 'Referencing Function in Angular expressions is disallowed! Expression: {0}', fullExpression);
            } else if (obj === CALL || obj === APPLY || obj === BIND) {
              throw $parseMinErr('isecff', 'Referencing call, apply or bind in Angular expressions is disallowed! Expression: {0}', fullExpression);
            }
          }
        }
        var OPERATORS = createMap();
        forEach('+ - * / % === !== == != < > <= >= && || ! = |'.split(' '), function(operator) {
          OPERATORS[operator] = true;
        });
        var ESCAPE = {
          "n": "\n",
          "f": "\f",
          "r": "\r",
          "t": "\t",
          "v": "\v",
          "'": "'",
          '"': '"'
        };
        var Lexer = function(options) {
          this.options = options;
        };
        Lexer.prototype = {
          constructor: Lexer,
          lex: function(text) {
            this.text = text;
            this.index = 0;
            this.tokens = [];
            while (this.index < this.text.length) {
              var ch = this.text.charAt(this.index);
              if (ch === '"' || ch === "'") {
                this.readString(ch);
              } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek())) {
                this.readNumber();
              } else if (this.isIdent(ch)) {
                this.readIdent();
              } else if (this.is(ch, '(){}[].,;:?')) {
                this.tokens.push({
                  index: this.index,
                  text: ch
                });
                this.index++;
              } else if (this.isWhitespace(ch)) {
                this.index++;
              } else {
                var ch2 = ch + this.peek();
                var ch3 = ch2 + this.peek(2);
                var op1 = OPERATORS[ch];
                var op2 = OPERATORS[ch2];
                var op3 = OPERATORS[ch3];
                if (op1 || op2 || op3) {
                  var token = op3 ? ch3 : (op2 ? ch2 : ch);
                  this.tokens.push({
                    index: this.index,
                    text: token,
                    operator: true
                  });
                  this.index += token.length;
                } else {
                  this.throwError('Unexpected next character ', this.index, this.index + 1);
                }
              }
            }
            return this.tokens;
          },
          is: function(ch, chars) {
            return chars.indexOf(ch) !== -1;
          },
          peek: function(i) {
            var num = i || 1;
            return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
          },
          isNumber: function(ch) {
            return ('0' <= ch && ch <= '9') && typeof ch === "string";
          },
          isWhitespace: function(ch) {
            return (ch === ' ' || ch === '\r' || ch === '\t' || ch === '\n' || ch === '\v' || ch === '\u00A0');
          },
          isIdent: function(ch) {
            return ('a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || '_' === ch || ch === '$');
          },
          isExpOperator: function(ch) {
            return (ch === '-' || ch === '+' || this.isNumber(ch));
          },
          throwError: function(error, start, end) {
            end = end || this.index;
            var colStr = (isDefined(start) ? 's ' + start + '-' + this.index + ' [' + this.text.substring(start, end) + ']' : ' ' + end);
            throw $parseMinErr('lexerr', 'Lexer Error: {0} at column{1} in expression [{2}].', error, colStr, this.text);
          },
          readNumber: function() {
            var number = '';
            var start = this.index;
            while (this.index < this.text.length) {
              var ch = lowercase(this.text.charAt(this.index));
              if (ch == '.' || this.isNumber(ch)) {
                number += ch;
              } else {
                var peekCh = this.peek();
                if (ch == 'e' && this.isExpOperator(peekCh)) {
                  number += ch;
                } else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && number.charAt(number.length - 1) == 'e') {
                  number += ch;
                } else if (this.isExpOperator(ch) && (!peekCh || !this.isNumber(peekCh)) && number.charAt(number.length - 1) == 'e') {
                  this.throwError('Invalid exponent');
                } else {
                  break;
                }
              }
              this.index++;
            }
            this.tokens.push({
              index: start,
              text: number,
              constant: true,
              value: Number(number)
            });
          },
          readIdent: function() {
            var start = this.index;
            while (this.index < this.text.length) {
              var ch = this.text.charAt(this.index);
              if (!(this.isIdent(ch) || this.isNumber(ch))) {
                break;
              }
              this.index++;
            }
            this.tokens.push({
              index: start,
              text: this.text.slice(start, this.index),
              identifier: true
            });
          },
          readString: function(quote) {
            var start = this.index;
            this.index++;
            var string = '';
            var rawString = quote;
            var escape = false;
            while (this.index < this.text.length) {
              var ch = this.text.charAt(this.index);
              rawString += ch;
              if (escape) {
                if (ch === 'u') {
                  var hex = this.text.substring(this.index + 1, this.index + 5);
                  if (!hex.match(/[\da-f]{4}/i)) {
                    this.throwError('Invalid unicode escape [\\u' + hex + ']');
                  }
                  this.index += 4;
                  string += String.fromCharCode(parseInt(hex, 16));
                } else {
                  var rep = ESCAPE[ch];
                  string = string + (rep || ch);
                }
                escape = false;
              } else if (ch === '\\') {
                escape = true;
              } else if (ch === quote) {
                this.index++;
                this.tokens.push({
                  index: start,
                  text: rawString,
                  constant: true,
                  value: string
                });
                return;
              } else {
                string += ch;
              }
              this.index++;
            }
            this.throwError('Unterminated quote', start);
          }
        };
        var AST = function(lexer, options) {
          this.lexer = lexer;
          this.options = options;
        };
        AST.Program = 'Program';
        AST.ExpressionStatement = 'ExpressionStatement';
        AST.AssignmentExpression = 'AssignmentExpression';
        AST.ConditionalExpression = 'ConditionalExpression';
        AST.LogicalExpression = 'LogicalExpression';
        AST.BinaryExpression = 'BinaryExpression';
        AST.UnaryExpression = 'UnaryExpression';
        AST.CallExpression = 'CallExpression';
        AST.MemberExpression = 'MemberExpression';
        AST.Identifier = 'Identifier';
        AST.Literal = 'Literal';
        AST.ArrayExpression = 'ArrayExpression';
        AST.Property = 'Property';
        AST.ObjectExpression = 'ObjectExpression';
        AST.ThisExpression = 'ThisExpression';
        AST.NGValueParameter = 'NGValueParameter';
        AST.prototype = {
          ast: function(text) {
            this.text = text;
            this.tokens = this.lexer.lex(text);
            var value = this.program();
            if (this.tokens.length !== 0) {
              this.throwError('is an unexpected token', this.tokens[0]);
            }
            return value;
          },
          program: function() {
            var body = [];
            while (true) {
              if (this.tokens.length > 0 && !this.peek('}', ')', ';', ']'))
                body.push(this.expressionStatement());
              if (!this.expect(';')) {
                return {
                  type: AST.Program,
                  body: body
                };
              }
            }
          },
          expressionStatement: function() {
            return {
              type: AST.ExpressionStatement,
              expression: this.filterChain()
            };
          },
          filterChain: function() {
            var left = this.expression();
            var token;
            while ((token = this.expect('|'))) {
              left = this.filter(left);
            }
            return left;
          },
          expression: function() {
            return this.assignment();
          },
          assignment: function() {
            var result = this.ternary();
            if (this.expect('=')) {
              result = {
                type: AST.AssignmentExpression,
                left: result,
                right: this.assignment(),
                operator: '='
              };
            }
            return result;
          },
          ternary: function() {
            var test = this.logicalOR();
            var alternate;
            var consequent;
            if (this.expect('?')) {
              alternate = this.expression();
              if (this.consume(':')) {
                consequent = this.expression();
                return {
                  type: AST.ConditionalExpression,
                  test: test,
                  alternate: alternate,
                  consequent: consequent
                };
              }
            }
            return test;
          },
          logicalOR: function() {
            var left = this.logicalAND();
            while (this.expect('||')) {
              left = {
                type: AST.LogicalExpression,
                operator: '||',
                left: left,
                right: this.logicalAND()
              };
            }
            return left;
          },
          logicalAND: function() {
            var left = this.equality();
            while (this.expect('&&')) {
              left = {
                type: AST.LogicalExpression,
                operator: '&&',
                left: left,
                right: this.equality()
              };
            }
            return left;
          },
          equality: function() {
            var left = this.relational();
            var token;
            while ((token = this.expect('==', '!=', '===', '!=='))) {
              left = {
                type: AST.BinaryExpression,
                operator: token.text,
                left: left,
                right: this.relational()
              };
            }
            return left;
          },
          relational: function() {
            var left = this.additive();
            var token;
            while ((token = this.expect('<', '>', '<=', '>='))) {
              left = {
                type: AST.BinaryExpression,
                operator: token.text,
                left: left,
                right: this.additive()
              };
            }
            return left;
          },
          additive: function() {
            var left = this.multiplicative();
            var token;
            while ((token = this.expect('+', '-'))) {
              left = {
                type: AST.BinaryExpression,
                operator: token.text,
                left: left,
                right: this.multiplicative()
              };
            }
            return left;
          },
          multiplicative: function() {
            var left = this.unary();
            var token;
            while ((token = this.expect('*', '/', '%'))) {
              left = {
                type: AST.BinaryExpression,
                operator: token.text,
                left: left,
                right: this.unary()
              };
            }
            return left;
          },
          unary: function() {
            var token;
            if ((token = this.expect('+', '-', '!'))) {
              return {
                type: AST.UnaryExpression,
                operator: token.text,
                prefix: true,
                argument: this.unary()
              };
            } else {
              return this.primary();
            }
          },
          primary: function() {
            var primary;
            if (this.expect('(')) {
              primary = this.filterChain();
              this.consume(')');
            } else if (this.expect('[')) {
              primary = this.arrayDeclaration();
            } else if (this.expect('{')) {
              primary = this.object();
            } else if (this.constants.hasOwnProperty(this.peek().text)) {
              primary = copy(this.constants[this.consume().text]);
            } else if (this.peek().identifier) {
              primary = this.identifier();
            } else if (this.peek().constant) {
              primary = this.constant();
            } else {
              this.throwError('not a primary expression', this.peek());
            }
            var next;
            while ((next = this.expect('(', '[', '.'))) {
              if (next.text === '(') {
                primary = {
                  type: AST.CallExpression,
                  callee: primary,
                  arguments: this.parseArguments()
                };
                this.consume(')');
              } else if (next.text === '[') {
                primary = {
                  type: AST.MemberExpression,
                  object: primary,
                  property: this.expression(),
                  computed: true
                };
                this.consume(']');
              } else if (next.text === '.') {
                primary = {
                  type: AST.MemberExpression,
                  object: primary,
                  property: this.identifier(),
                  computed: false
                };
              } else {
                this.throwError('IMPOSSIBLE');
              }
            }
            return primary;
          },
          filter: function(baseExpression) {
            var args = [baseExpression];
            var result = {
              type: AST.CallExpression,
              callee: this.identifier(),
              arguments: args,
              filter: true
            };
            while (this.expect(':')) {
              args.push(this.expression());
            }
            return result;
          },
          parseArguments: function() {
            var args = [];
            if (this.peekToken().text !== ')') {
              do {
                args.push(this.expression());
              } while (this.expect(','));
            }
            return args;
          },
          identifier: function() {
            var token = this.consume();
            if (!token.identifier) {
              this.throwError('is not a valid identifier', token);
            }
            return {
              type: AST.Identifier,
              name: token.text
            };
          },
          constant: function() {
            return {
              type: AST.Literal,
              value: this.consume().value
            };
          },
          arrayDeclaration: function() {
            var elements = [];
            if (this.peekToken().text !== ']') {
              do {
                if (this.peek(']')) {
                  break;
                }
                elements.push(this.expression());
              } while (this.expect(','));
            }
            this.consume(']');
            return {
              type: AST.ArrayExpression,
              elements: elements
            };
          },
          object: function() {
            var properties = [],
                property;
            if (this.peekToken().text !== '}') {
              do {
                if (this.peek('}')) {
                  break;
                }
                property = {
                  type: AST.Property,
                  kind: 'init'
                };
                if (this.peek().constant) {
                  property.key = this.constant();
                } else if (this.peek().identifier) {
                  property.key = this.identifier();
                } else {
                  this.throwError("invalid key", this.peek());
                }
                this.consume(':');
                property.value = this.expression();
                properties.push(property);
              } while (this.expect(','));
            }
            this.consume('}');
            return {
              type: AST.ObjectExpression,
              properties: properties
            };
          },
          throwError: function(msg, token) {
            throw $parseMinErr('syntax', 'Syntax Error: Token \'{0}\' {1} at column {2} of the expression [{3}] starting at [{4}].', token.text, msg, (token.index + 1), this.text, this.text.substring(token.index));
          },
          consume: function(e1) {
            if (this.tokens.length === 0) {
              throw $parseMinErr('ueoe', 'Unexpected end of expression: {0}', this.text);
            }
            var token = this.expect(e1);
            if (!token) {
              this.throwError('is unexpected, expecting [' + e1 + ']', this.peek());
            }
            return token;
          },
          peekToken: function() {
            if (this.tokens.length === 0) {
              throw $parseMinErr('ueoe', 'Unexpected end of expression: {0}', this.text);
            }
            return this.tokens[0];
          },
          peek: function(e1, e2, e3, e4) {
            return this.peekAhead(0, e1, e2, e3, e4);
          },
          peekAhead: function(i, e1, e2, e3, e4) {
            if (this.tokens.length > i) {
              var token = this.tokens[i];
              var t = token.text;
              if (t === e1 || t === e2 || t === e3 || t === e4 || (!e1 && !e2 && !e3 && !e4)) {
                return token;
              }
            }
            return false;
          },
          expect: function(e1, e2, e3, e4) {
            var token = this.peek(e1, e2, e3, e4);
            if (token) {
              this.tokens.shift();
              return token;
            }
            return false;
          },
          constants: {
            'true': {
              type: AST.Literal,
              value: true
            },
            'false': {
              type: AST.Literal,
              value: false
            },
            'null': {
              type: AST.Literal,
              value: null
            },
            'undefined': {
              type: AST.Literal,
              value: undefined
            },
            'this': {type: AST.ThisExpression}
          }
        };
        function ifDefined(v, d) {
          return typeof v !== 'undefined' ? v : d;
        }
        function plusFn(l, r) {
          if (typeof l === 'undefined')
            return r;
          if (typeof r === 'undefined')
            return l;
          return l + r;
        }
        function isStateless($filter, filterName) {
          var fn = $filter(filterName);
          return !fn.$stateful;
        }
        function findConstantAndWatchExpressions(ast, $filter) {
          var allConstants;
          var argsToWatch;
          switch (ast.type) {
            case AST.Program:
              allConstants = true;
              forEach(ast.body, function(expr) {
                findConstantAndWatchExpressions(expr.expression, $filter);
                allConstants = allConstants && expr.expression.constant;
              });
              ast.constant = allConstants;
              break;
            case AST.Literal:
              ast.constant = true;
              ast.toWatch = [];
              break;
            case AST.UnaryExpression:
              findConstantAndWatchExpressions(ast.argument, $filter);
              ast.constant = ast.argument.constant;
              ast.toWatch = ast.argument.toWatch;
              break;
            case AST.BinaryExpression:
              findConstantAndWatchExpressions(ast.left, $filter);
              findConstantAndWatchExpressions(ast.right, $filter);
              ast.constant = ast.left.constant && ast.right.constant;
              ast.toWatch = ast.left.toWatch.concat(ast.right.toWatch);
              break;
            case AST.LogicalExpression:
              findConstantAndWatchExpressions(ast.left, $filter);
              findConstantAndWatchExpressions(ast.right, $filter);
              ast.constant = ast.left.constant && ast.right.constant;
              ast.toWatch = ast.constant ? [] : [ast];
              break;
            case AST.ConditionalExpression:
              findConstantAndWatchExpressions(ast.test, $filter);
              findConstantAndWatchExpressions(ast.alternate, $filter);
              findConstantAndWatchExpressions(ast.consequent, $filter);
              ast.constant = ast.test.constant && ast.alternate.constant && ast.consequent.constant;
              ast.toWatch = ast.constant ? [] : [ast];
              break;
            case AST.Identifier:
              ast.constant = false;
              ast.toWatch = [ast];
              break;
            case AST.MemberExpression:
              findConstantAndWatchExpressions(ast.object, $filter);
              if (ast.computed) {
                findConstantAndWatchExpressions(ast.property, $filter);
              }
              ast.constant = ast.object.constant && (!ast.computed || ast.property.constant);
              ast.toWatch = [ast];
              break;
            case AST.CallExpression:
              allConstants = ast.filter ? isStateless($filter, ast.callee.name) : false;
              argsToWatch = [];
              forEach(ast.arguments, function(expr) {
                findConstantAndWatchExpressions(expr, $filter);
                allConstants = allConstants && expr.constant;
                if (!expr.constant) {
                  argsToWatch.push.apply(argsToWatch, expr.toWatch);
                }
              });
              ast.constant = allConstants;
              ast.toWatch = ast.filter && isStateless($filter, ast.callee.name) ? argsToWatch : [ast];
              break;
            case AST.AssignmentExpression:
              findConstantAndWatchExpressions(ast.left, $filter);
              findConstantAndWatchExpressions(ast.right, $filter);
              ast.constant = ast.left.constant && ast.right.constant;
              ast.toWatch = [ast];
              break;
            case AST.ArrayExpression:
              allConstants = true;
              argsToWatch = [];
              forEach(ast.elements, function(expr) {
                findConstantAndWatchExpressions(expr, $filter);
                allConstants = allConstants && expr.constant;
                if (!expr.constant) {
                  argsToWatch.push.apply(argsToWatch, expr.toWatch);
                }
              });
              ast.constant = allConstants;
              ast.toWatch = argsToWatch;
              break;
            case AST.ObjectExpression:
              allConstants = true;
              argsToWatch = [];
              forEach(ast.properties, function(property) {
                findConstantAndWatchExpressions(property.value, $filter);
                allConstants = allConstants && property.value.constant;
                if (!property.value.constant) {
                  argsToWatch.push.apply(argsToWatch, property.value.toWatch);
                }
              });
              ast.constant = allConstants;
              ast.toWatch = argsToWatch;
              break;
            case AST.ThisExpression:
              ast.constant = false;
              ast.toWatch = [];
              break;
          }
        }
        function getInputs(body) {
          if (body.length != 1)
            return;
          var lastExpression = body[0].expression;
          var candidate = lastExpression.toWatch;
          if (candidate.length !== 1)
            return candidate;
          return candidate[0] !== lastExpression ? candidate : undefined;
        }
        function isAssignable(ast) {
          return ast.type === AST.Identifier || ast.type === AST.MemberExpression;
        }
        function assignableAST(ast) {
          if (ast.body.length === 1 && isAssignable(ast.body[0].expression)) {
            return {
              type: AST.AssignmentExpression,
              left: ast.body[0].expression,
              right: {type: AST.NGValueParameter},
              operator: '='
            };
          }
        }
        function isLiteral(ast) {
          return ast.body.length === 0 || ast.body.length === 1 && (ast.body[0].expression.type === AST.Literal || ast.body[0].expression.type === AST.ArrayExpression || ast.body[0].expression.type === AST.ObjectExpression);
        }
        function isConstant(ast) {
          return ast.constant;
        }
        function ASTCompiler(astBuilder, $filter) {
          this.astBuilder = astBuilder;
          this.$filter = $filter;
        }
        ASTCompiler.prototype = {
          compile: function(expression, expensiveChecks) {
            var self = this;
            var ast = this.astBuilder.ast(expression);
            this.state = {
              nextId: 0,
              filters: {},
              expensiveChecks: expensiveChecks,
              fn: {
                vars: [],
                body: [],
                own: {}
              },
              assign: {
                vars: [],
                body: [],
                own: {}
              },
              inputs: []
            };
            findConstantAndWatchExpressions(ast, self.$filter);
            var extra = '';
            var assignable;
            this.stage = 'assign';
            if ((assignable = assignableAST(ast))) {
              this.state.computing = 'assign';
              var result = this.nextId();
              this.recurse(assignable, result);
              extra = 'fn.assign=' + this.generateFunction('assign', 's,v,l');
            }
            var toWatch = getInputs(ast.body);
            self.stage = 'inputs';
            forEach(toWatch, function(watch, key) {
              var fnKey = 'fn' + key;
              self.state[fnKey] = {
                vars: [],
                body: [],
                own: {}
              };
              self.state.computing = fnKey;
              var intoId = self.nextId();
              self.recurse(watch, intoId);
              self.return_(intoId);
              self.state.inputs.push(fnKey);
              watch.watchId = key;
            });
            this.state.computing = 'fn';
            this.stage = 'main';
            this.recurse(ast);
            var fnString = '"' + this.USE + ' ' + this.STRICT + '";\n' + this.filterPrefix() + 'var fn=' + this.generateFunction('fn', 's,l,a,i') + extra + this.watchFns() + 'return fn;';
            var fn = (new Function('$filter', 'ensureSafeMemberName', 'ensureSafeObject', 'ensureSafeFunction', 'ifDefined', 'plus', 'text', fnString))(this.$filter, ensureSafeMemberName, ensureSafeObject, ensureSafeFunction, ifDefined, plusFn, expression);
            this.state = this.stage = undefined;
            fn.literal = isLiteral(ast);
            fn.constant = isConstant(ast);
            return fn;
          },
          USE: 'use',
          STRICT: 'strict',
          watchFns: function() {
            var result = [];
            var fns = this.state.inputs;
            var self = this;
            forEach(fns, function(name) {
              result.push('var ' + name + '=' + self.generateFunction(name, 's'));
            });
            if (fns.length) {
              result.push('fn.inputs=[' + fns.join(',') + '];');
            }
            return result.join('');
          },
          generateFunction: function(name, params) {
            return 'function(' + params + '){' + this.varsPrefix(name) + this.body(name) + '};';
          },
          filterPrefix: function() {
            var parts = [];
            var self = this;
            forEach(this.state.filters, function(id, filter) {
              parts.push(id + '=$filter(' + self.escape(filter) + ')');
            });
            if (parts.length)
              return 'var ' + parts.join(',') + ';';
            return '';
          },
          varsPrefix: function(section) {
            return this.state[section].vars.length ? 'var ' + this.state[section].vars.join(',') + ';' : '';
          },
          body: function(section) {
            return this.state[section].body.join('');
          },
          recurse: function(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck) {
            var left,
                right,
                self = this,
                args,
                expression;
            recursionFn = recursionFn || noop;
            if (!skipWatchIdCheck && isDefined(ast.watchId)) {
              intoId = intoId || this.nextId();
              this.if_('i', this.lazyAssign(intoId, this.computedMember('i', ast.watchId)), this.lazyRecurse(ast, intoId, nameId, recursionFn, create, true));
              return;
            }
            switch (ast.type) {
              case AST.Program:
                forEach(ast.body, function(expression, pos) {
                  self.recurse(expression.expression, undefined, undefined, function(expr) {
                    right = expr;
                  });
                  if (pos !== ast.body.length - 1) {
                    self.current().body.push(right, ';');
                  } else {
                    self.return_(right);
                  }
                });
                break;
              case AST.Literal:
                expression = this.escape(ast.value);
                this.assign(intoId, expression);
                recursionFn(expression);
                break;
              case AST.UnaryExpression:
                this.recurse(ast.argument, undefined, undefined, function(expr) {
                  right = expr;
                });
                expression = ast.operator + '(' + this.ifDefined(right, 0) + ')';
                this.assign(intoId, expression);
                recursionFn(expression);
                break;
              case AST.BinaryExpression:
                this.recurse(ast.left, undefined, undefined, function(expr) {
                  left = expr;
                });
                this.recurse(ast.right, undefined, undefined, function(expr) {
                  right = expr;
                });
                if (ast.operator === '+') {
                  expression = this.plus(left, right);
                } else if (ast.operator === '-') {
                  expression = this.ifDefined(left, 0) + ast.operator + this.ifDefined(right, 0);
                } else {
                  expression = '(' + left + ')' + ast.operator + '(' + right + ')';
                }
                this.assign(intoId, expression);
                recursionFn(expression);
                break;
              case AST.LogicalExpression:
                intoId = intoId || this.nextId();
                self.recurse(ast.left, intoId);
                self.if_(ast.operator === '&&' ? intoId : self.not(intoId), self.lazyRecurse(ast.right, intoId));
                recursionFn(intoId);
                break;
              case AST.ConditionalExpression:
                intoId = intoId || this.nextId();
                self.recurse(ast.test, intoId);
                self.if_(intoId, self.lazyRecurse(ast.alternate, intoId), self.lazyRecurse(ast.consequent, intoId));
                recursionFn(intoId);
                break;
              case AST.Identifier:
                intoId = intoId || this.nextId();
                if (nameId) {
                  nameId.context = self.stage === 'inputs' ? 's' : this.assign(this.nextId(), this.getHasOwnProperty('l', ast.name) + '?l:s');
                  nameId.computed = false;
                  nameId.name = ast.name;
                }
                ensureSafeMemberName(ast.name);
                self.if_(self.stage === 'inputs' || self.not(self.getHasOwnProperty('l', ast.name)), function() {
                  self.if_(self.stage === 'inputs' || 's', function() {
                    if (create && create !== 1) {
                      self.if_(self.not(self.nonComputedMember('s', ast.name)), self.lazyAssign(self.nonComputedMember('s', ast.name), '{}'));
                    }
                    self.assign(intoId, self.nonComputedMember('s', ast.name));
                  });
                }, intoId && self.lazyAssign(intoId, self.nonComputedMember('l', ast.name)));
                if (self.state.expensiveChecks || isPossiblyDangerousMemberName(ast.name)) {
                  self.addEnsureSafeObject(intoId);
                }
                recursionFn(intoId);
                break;
              case AST.MemberExpression:
                left = nameId && (nameId.context = this.nextId()) || this.nextId();
                intoId = intoId || this.nextId();
                self.recurse(ast.object, left, undefined, function() {
                  self.if_(self.notNull(left), function() {
                    if (ast.computed) {
                      right = self.nextId();
                      self.recurse(ast.property, right);
                      self.addEnsureSafeMemberName(right);
                      if (create && create !== 1) {
                        self.if_(self.not(self.computedMember(left, right)), self.lazyAssign(self.computedMember(left, right), '{}'));
                      }
                      expression = self.ensureSafeObject(self.computedMember(left, right));
                      self.assign(intoId, expression);
                      if (nameId) {
                        nameId.computed = true;
                        nameId.name = right;
                      }
                    } else {
                      ensureSafeMemberName(ast.property.name);
                      if (create && create !== 1) {
                        self.if_(self.not(self.nonComputedMember(left, ast.property.name)), self.lazyAssign(self.nonComputedMember(left, ast.property.name), '{}'));
                      }
                      expression = self.nonComputedMember(left, ast.property.name);
                      if (self.state.expensiveChecks || isPossiblyDangerousMemberName(ast.property.name)) {
                        expression = self.ensureSafeObject(expression);
                      }
                      self.assign(intoId, expression);
                      if (nameId) {
                        nameId.computed = false;
                        nameId.name = ast.property.name;
                      }
                    }
                  }, function() {
                    self.assign(intoId, 'undefined');
                  });
                  recursionFn(intoId);
                }, !!create);
                break;
              case AST.CallExpression:
                intoId = intoId || this.nextId();
                if (ast.filter) {
                  right = self.filter(ast.callee.name);
                  args = [];
                  forEach(ast.arguments, function(expr) {
                    var argument = self.nextId();
                    self.recurse(expr, argument);
                    args.push(argument);
                  });
                  expression = right + '(' + args.join(',') + ')';
                  self.assign(intoId, expression);
                  recursionFn(intoId);
                } else {
                  right = self.nextId();
                  left = {};
                  args = [];
                  self.recurse(ast.callee, right, left, function() {
                    self.if_(self.notNull(right), function() {
                      self.addEnsureSafeFunction(right);
                      forEach(ast.arguments, function(expr) {
                        self.recurse(expr, self.nextId(), undefined, function(argument) {
                          args.push(self.ensureSafeObject(argument));
                        });
                      });
                      if (left.name) {
                        if (!self.state.expensiveChecks) {
                          self.addEnsureSafeObject(left.context);
                        }
                        expression = self.member(left.context, left.name, left.computed) + '(' + args.join(',') + ')';
                      } else {
                        expression = right + '(' + args.join(',') + ')';
                      }
                      expression = self.ensureSafeObject(expression);
                      self.assign(intoId, expression);
                    }, function() {
                      self.assign(intoId, 'undefined');
                    });
                    recursionFn(intoId);
                  });
                }
                break;
              case AST.AssignmentExpression:
                right = this.nextId();
                left = {};
                if (!isAssignable(ast.left)) {
                  throw $parseMinErr('lval', 'Trying to assing a value to a non l-value');
                }
                this.recurse(ast.left, undefined, left, function() {
                  self.if_(self.notNull(left.context), function() {
                    self.recurse(ast.right, right);
                    self.addEnsureSafeObject(self.member(left.context, left.name, left.computed));
                    expression = self.member(left.context, left.name, left.computed) + ast.operator + right;
                    self.assign(intoId, expression);
                    recursionFn(intoId || expression);
                  });
                }, 1);
                break;
              case AST.ArrayExpression:
                args = [];
                forEach(ast.elements, function(expr) {
                  self.recurse(expr, self.nextId(), undefined, function(argument) {
                    args.push(argument);
                  });
                });
                expression = '[' + args.join(',') + ']';
                this.assign(intoId, expression);
                recursionFn(expression);
                break;
              case AST.ObjectExpression:
                args = [];
                forEach(ast.properties, function(property) {
                  self.recurse(property.value, self.nextId(), undefined, function(expr) {
                    args.push(self.escape(property.key.type === AST.Identifier ? property.key.name : ('' + property.key.value)) + ':' + expr);
                  });
                });
                expression = '{' + args.join(',') + '}';
                this.assign(intoId, expression);
                recursionFn(expression);
                break;
              case AST.ThisExpression:
                this.assign(intoId, 's');
                recursionFn('s');
                break;
              case AST.NGValueParameter:
                this.assign(intoId, 'v');
                recursionFn('v');
                break;
            }
          },
          getHasOwnProperty: function(element, property) {
            var key = element + '.' + property;
            var own = this.current().own;
            if (!own.hasOwnProperty(key)) {
              own[key] = this.nextId(false, element + '&&(' + this.escape(property) + ' in ' + element + ')');
            }
            return own[key];
          },
          assign: function(id, value) {
            if (!id)
              return;
            this.current().body.push(id, '=', value, ';');
            return id;
          },
          filter: function(filterName) {
            if (!this.state.filters.hasOwnProperty(filterName)) {
              this.state.filters[filterName] = this.nextId(true);
            }
            return this.state.filters[filterName];
          },
          ifDefined: function(id, defaultValue) {
            return 'ifDefined(' + id + ',' + this.escape(defaultValue) + ')';
          },
          plus: function(left, right) {
            return 'plus(' + left + ',' + right + ')';
          },
          return_: function(id) {
            this.current().body.push('return ', id, ';');
          },
          if_: function(test, alternate, consequent) {
            if (test === true) {
              alternate();
            } else {
              var body = this.current().body;
              body.push('if(', test, '){');
              alternate();
              body.push('}');
              if (consequent) {
                body.push('else{');
                consequent();
                body.push('}');
              }
            }
          },
          not: function(expression) {
            return '!(' + expression + ')';
          },
          notNull: function(expression) {
            return expression + '!=null';
          },
          nonComputedMember: function(left, right) {
            return left + '.' + right;
          },
          computedMember: function(left, right) {
            return left + '[' + right + ']';
          },
          member: function(left, right, computed) {
            if (computed)
              return this.computedMember(left, right);
            return this.nonComputedMember(left, right);
          },
          addEnsureSafeObject: function(item) {
            this.current().body.push(this.ensureSafeObject(item), ';');
          },
          addEnsureSafeMemberName: function(item) {
            this.current().body.push(this.ensureSafeMemberName(item), ';');
          },
          addEnsureSafeFunction: function(item) {
            this.current().body.push(this.ensureSafeFunction(item), ';');
          },
          ensureSafeObject: function(item) {
            return 'ensureSafeObject(' + item + ',text)';
          },
          ensureSafeMemberName: function(item) {
            return 'ensureSafeMemberName(' + item + ',text)';
          },
          ensureSafeFunction: function(item) {
            return 'ensureSafeFunction(' + item + ',text)';
          },
          lazyRecurse: function(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck) {
            var self = this;
            return function() {
              self.recurse(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck);
            };
          },
          lazyAssign: function(id, value) {
            var self = this;
            return function() {
              self.assign(id, value);
            };
          },
          stringEscapeRegex: /[^ a-zA-Z0-9]/g,
          stringEscapeFn: function(c) {
            return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
          },
          escape: function(value) {
            if (isString(value))
              return "'" + value.replace(this.stringEscapeRegex, this.stringEscapeFn) + "'";
            if (isNumber(value))
              return value.toString();
            if (value === true)
              return 'true';
            if (value === false)
              return 'false';
            if (value === null)
              return 'null';
            if (typeof value === 'undefined')
              return 'undefined';
            throw $parseMinErr('esc', 'IMPOSSIBLE');
          },
          nextId: function(skip, init) {
            var id = 'v' + (this.state.nextId++);
            if (!skip) {
              this.current().vars.push(id + (init ? '=' + init : ''));
            }
            return id;
          },
          current: function() {
            return this.state[this.state.computing];
          }
        };
        function ASTInterpreter(astBuilder, $filter) {
          this.astBuilder = astBuilder;
          this.$filter = $filter;
        }
        ASTInterpreter.prototype = {
          compile: function(expression, expensiveChecks) {
            var self = this;
            var ast = this.astBuilder.ast(expression);
            this.expression = expression;
            this.expensiveChecks = expensiveChecks;
            findConstantAndWatchExpressions(ast, self.$filter);
            var assignable;
            var assign;
            if ((assignable = assignableAST(ast))) {
              assign = this.recurse(assignable);
            }
            var toWatch = getInputs(ast.body);
            var inputs;
            if (toWatch) {
              inputs = [];
              forEach(toWatch, function(watch, key) {
                var input = self.recurse(watch);
                watch.input = input;
                inputs.push(input);
                watch.watchId = key;
              });
            }
            var expressions = [];
            forEach(ast.body, function(expression) {
              expressions.push(self.recurse(expression.expression));
            });
            var fn = ast.body.length === 0 ? function() {} : ast.body.length === 1 ? expressions[0] : function(scope, locals) {
              var lastValue;
              forEach(expressions, function(exp) {
                lastValue = exp(scope, locals);
              });
              return lastValue;
            };
            if (assign) {
              fn.assign = function(scope, value, locals) {
                return assign(scope, locals, value);
              };
            }
            if (inputs) {
              fn.inputs = inputs;
            }
            fn.literal = isLiteral(ast);
            fn.constant = isConstant(ast);
            return fn;
          },
          recurse: function(ast, context, create) {
            var left,
                right,
                self = this,
                args,
                expression;
            if (ast.input) {
              return this.inputs(ast.input, ast.watchId);
            }
            switch (ast.type) {
              case AST.Literal:
                return this.value(ast.value, context);
              case AST.UnaryExpression:
                right = this.recurse(ast.argument);
                return this['unary' + ast.operator](right, context);
              case AST.BinaryExpression:
                left = this.recurse(ast.left);
                right = this.recurse(ast.right);
                return this['binary' + ast.operator](left, right, context);
              case AST.LogicalExpression:
                left = this.recurse(ast.left);
                right = this.recurse(ast.right);
                return this['binary' + ast.operator](left, right, context);
              case AST.ConditionalExpression:
                return this['ternary?:'](this.recurse(ast.test), this.recurse(ast.alternate), this.recurse(ast.consequent), context);
              case AST.Identifier:
                ensureSafeMemberName(ast.name, self.expression);
                return self.identifier(ast.name, self.expensiveChecks || isPossiblyDangerousMemberName(ast.name), context, create, self.expression);
              case AST.MemberExpression:
                left = this.recurse(ast.object, false, !!create);
                if (!ast.computed) {
                  ensureSafeMemberName(ast.property.name, self.expression);
                  right = ast.property.name;
                }
                if (ast.computed)
                  right = this.recurse(ast.property);
                return ast.computed ? this.computedMember(left, right, context, create, self.expression) : this.nonComputedMember(left, right, self.expensiveChecks, context, create, self.expression);
              case AST.CallExpression:
                args = [];
                forEach(ast.arguments, function(expr) {
                  args.push(self.recurse(expr));
                });
                if (ast.filter)
                  right = this.$filter(ast.callee.name);
                if (!ast.filter)
                  right = this.recurse(ast.callee, true);
                return ast.filter ? function(scope, locals, assign, inputs) {
                  var values = [];
                  for (var i = 0; i < args.length; ++i) {
                    values.push(args[i](scope, locals, assign, inputs));
                  }
                  var value = right.apply(undefined, values, inputs);
                  return context ? {
                    context: undefined,
                    name: undefined,
                    value: value
                  } : value;
                } : function(scope, locals, assign, inputs) {
                  var rhs = right(scope, locals, assign, inputs);
                  var value;
                  if (rhs.value != null) {
                    ensureSafeObject(rhs.context, self.expression);
                    ensureSafeFunction(rhs.value, self.expression);
                    var values = [];
                    for (var i = 0; i < args.length; ++i) {
                      values.push(ensureSafeObject(args[i](scope, locals, assign, inputs), self.expression));
                    }
                    value = ensureSafeObject(rhs.value.apply(rhs.context, values), self.expression);
                  }
                  return context ? {value: value} : value;
                };
              case AST.AssignmentExpression:
                left = this.recurse(ast.left, true, 1);
                right = this.recurse(ast.right);
                return function(scope, locals, assign, inputs) {
                  var lhs = left(scope, locals, assign, inputs);
                  var rhs = right(scope, locals, assign, inputs);
                  ensureSafeObject(lhs.value, self.expression);
                  lhs.context[lhs.name] = rhs;
                  return context ? {value: rhs} : rhs;
                };
              case AST.ArrayExpression:
                args = [];
                forEach(ast.elements, function(expr) {
                  args.push(self.recurse(expr));
                });
                return function(scope, locals, assign, inputs) {
                  var value = [];
                  for (var i = 0; i < args.length; ++i) {
                    value.push(args[i](scope, locals, assign, inputs));
                  }
                  return context ? {value: value} : value;
                };
              case AST.ObjectExpression:
                args = [];
                forEach(ast.properties, function(property) {
                  args.push({
                    key: property.key.type === AST.Identifier ? property.key.name : ('' + property.key.value),
                    value: self.recurse(property.value)
                  });
                });
                return function(scope, locals, assign, inputs) {
                  var value = {};
                  for (var i = 0; i < args.length; ++i) {
                    value[args[i].key] = args[i].value(scope, locals, assign, inputs);
                  }
                  return context ? {value: value} : value;
                };
              case AST.ThisExpression:
                return function(scope) {
                  return context ? {value: scope} : scope;
                };
              case AST.NGValueParameter:
                return function(scope, locals, assign, inputs) {
                  return context ? {value: assign} : assign;
                };
            }
          },
          'unary+': function(argument, context) {
            return function(scope, locals, assign, inputs) {
              var arg = argument(scope, locals, assign, inputs);
              if (isDefined(arg)) {
                arg = +arg;
              } else {
                arg = 0;
              }
              return context ? {value: arg} : arg;
            };
          },
          'unary-': function(argument, context) {
            return function(scope, locals, assign, inputs) {
              var arg = argument(scope, locals, assign, inputs);
              if (isDefined(arg)) {
                arg = -arg;
              } else {
                arg = 0;
              }
              return context ? {value: arg} : arg;
            };
          },
          'unary!': function(argument, context) {
            return function(scope, locals, assign, inputs) {
              var arg = !argument(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary+': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var lhs = left(scope, locals, assign, inputs);
              var rhs = right(scope, locals, assign, inputs);
              var arg = plusFn(lhs, rhs);
              return context ? {value: arg} : arg;
            };
          },
          'binary-': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var lhs = left(scope, locals, assign, inputs);
              var rhs = right(scope, locals, assign, inputs);
              var arg = (isDefined(lhs) ? lhs : 0) - (isDefined(rhs) ? rhs : 0);
              return context ? {value: arg} : arg;
            };
          },
          'binary*': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) * right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary/': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) / right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary%': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) % right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary===': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) === right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary!==': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) !== right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary==': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) == right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary!=': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) != right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary<': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) < right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary>': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) > right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary<=': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) <= right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary>=': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) >= right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary&&': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) && right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'binary||': function(left, right, context) {
            return function(scope, locals, assign, inputs) {
              var arg = left(scope, locals, assign, inputs) || right(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          'ternary?:': function(test, alternate, consequent, context) {
            return function(scope, locals, assign, inputs) {
              var arg = test(scope, locals, assign, inputs) ? alternate(scope, locals, assign, inputs) : consequent(scope, locals, assign, inputs);
              return context ? {value: arg} : arg;
            };
          },
          value: function(value, context) {
            return function() {
              return context ? {
                context: undefined,
                name: undefined,
                value: value
              } : value;
            };
          },
          identifier: function(name, expensiveChecks, context, create, expression) {
            return function(scope, locals, assign, inputs) {
              var base = locals && (name in locals) ? locals : scope;
              if (create && create !== 1 && base && !(base[name])) {
                base[name] = {};
              }
              var value = base ? base[name] : undefined;
              if (expensiveChecks) {
                ensureSafeObject(value, expression);
              }
              if (context) {
                return {
                  context: base,
                  name: name,
                  value: value
                };
              } else {
                return value;
              }
            };
          },
          computedMember: function(left, right, context, create, expression) {
            return function(scope, locals, assign, inputs) {
              var lhs = left(scope, locals, assign, inputs);
              var rhs;
              var value;
              if (lhs != null) {
                rhs = right(scope, locals, assign, inputs);
                ensureSafeMemberName(rhs, expression);
                if (create && create !== 1 && lhs && !(lhs[rhs])) {
                  lhs[rhs] = {};
                }
                value = lhs[rhs];
                ensureSafeObject(value, expression);
              }
              if (context) {
                return {
                  context: lhs,
                  name: rhs,
                  value: value
                };
              } else {
                return value;
              }
            };
          },
          nonComputedMember: function(left, right, expensiveChecks, context, create, expression) {
            return function(scope, locals, assign, inputs) {
              var lhs = left(scope, locals, assign, inputs);
              if (create && create !== 1 && lhs && !(lhs[right])) {
                lhs[right] = {};
              }
              var value = lhs != null ? lhs[right] : undefined;
              if (expensiveChecks || isPossiblyDangerousMemberName(right)) {
                ensureSafeObject(value, expression);
              }
              if (context) {
                return {
                  context: lhs,
                  name: right,
                  value: value
                };
              } else {
                return value;
              }
            };
          },
          inputs: function(input, watchId) {
            return function(scope, value, locals, inputs) {
              if (inputs)
                return inputs[watchId];
              return input(scope, value, locals);
            };
          }
        };
        var Parser = function(lexer, $filter, options) {
          this.lexer = lexer;
          this.$filter = $filter;
          this.options = options;
          this.ast = new AST(this.lexer);
          this.astCompiler = options.csp ? new ASTInterpreter(this.ast, $filter) : new ASTCompiler(this.ast, $filter);
        };
        Parser.prototype = {
          constructor: Parser,
          parse: function(text) {
            return this.astCompiler.compile(text, this.options.expensiveChecks);
          }
        };
        function setter(obj, path, setValue, fullExp) {
          ensureSafeObject(obj, fullExp);
          var element = path.split('.'),
              key;
          for (var i = 0; element.length > 1; i++) {
            key = ensureSafeMemberName(element.shift(), fullExp);
            var propertyObj = ensureSafeObject(obj[key], fullExp);
            if (!propertyObj) {
              propertyObj = {};
              obj[key] = propertyObj;
            }
            obj = propertyObj;
          }
          key = ensureSafeMemberName(element.shift(), fullExp);
          ensureSafeObject(obj[key], fullExp);
          obj[key] = setValue;
          return setValue;
        }
        var getterFnCacheDefault = createMap();
        var getterFnCacheExpensive = createMap();
        function isPossiblyDangerousMemberName(name) {
          return name == 'constructor';
        }
        var objectValueOf = Object.prototype.valueOf;
        function getValueOf(value) {
          return isFunction(value.valueOf) ? value.valueOf() : objectValueOf.call(value);
        }
        function $ParseProvider() {
          var cacheDefault = createMap();
          var cacheExpensive = createMap();
          this.$get = ['$filter', '$sniffer', function($filter, $sniffer) {
            var $parseOptions = {
              csp: $sniffer.csp,
              expensiveChecks: false
            },
                $parseOptionsExpensive = {
                  csp: $sniffer.csp,
                  expensiveChecks: true
                };
            return function $parse(exp, interceptorFn, expensiveChecks) {
              var parsedExpression,
                  oneTime,
                  cacheKey;
              switch (typeof exp) {
                case 'string':
                  exp = exp.trim();
                  cacheKey = exp;
                  var cache = (expensiveChecks ? cacheExpensive : cacheDefault);
                  parsedExpression = cache[cacheKey];
                  if (!parsedExpression) {
                    if (exp.charAt(0) === ':' && exp.charAt(1) === ':') {
                      oneTime = true;
                      exp = exp.substring(2);
                    }
                    var parseOptions = expensiveChecks ? $parseOptionsExpensive : $parseOptions;
                    var lexer = new Lexer(parseOptions);
                    var parser = new Parser(lexer, $filter, parseOptions);
                    parsedExpression = parser.parse(exp);
                    if (parsedExpression.constant) {
                      parsedExpression.$$watchDelegate = constantWatchDelegate;
                    } else if (oneTime) {
                      parsedExpression.$$watchDelegate = parsedExpression.literal ? oneTimeLiteralWatchDelegate : oneTimeWatchDelegate;
                    } else if (parsedExpression.inputs) {
                      parsedExpression.$$watchDelegate = inputsWatchDelegate;
                    }
                    cache[cacheKey] = parsedExpression;
                  }
                  return addInterceptor(parsedExpression, interceptorFn);
                case 'function':
                  return addInterceptor(exp, interceptorFn);
                default:
                  return noop;
              }
            };
            function expressionInputDirtyCheck(newValue, oldValueOfValue) {
              if (newValue == null || oldValueOfValue == null) {
                return newValue === oldValueOfValue;
              }
              if (typeof newValue === 'object') {
                newValue = getValueOf(newValue);
                if (typeof newValue === 'object') {
                  return false;
                }
              }
              return newValue === oldValueOfValue || (newValue !== newValue && oldValueOfValue !== oldValueOfValue);
            }
            function inputsWatchDelegate(scope, listener, objectEquality, parsedExpression, prettyPrintExpression) {
              var inputExpressions = parsedExpression.inputs;
              var lastResult;
              if (inputExpressions.length === 1) {
                var oldInputValueOf = expressionInputDirtyCheck;
                inputExpressions = inputExpressions[0];
                return scope.$watch(function expressionInputWatch(scope) {
                  var newInputValue = inputExpressions(scope);
                  if (!expressionInputDirtyCheck(newInputValue, oldInputValueOf)) {
                    lastResult = parsedExpression(scope, undefined, undefined, [newInputValue]);
                    oldInputValueOf = newInputValue && getValueOf(newInputValue);
                  }
                  return lastResult;
                }, listener, objectEquality, prettyPrintExpression);
              }
              var oldInputValueOfValues = [];
              var oldInputValues = [];
              for (var i = 0,
                  ii = inputExpressions.length; i < ii; i++) {
                oldInputValueOfValues[i] = expressionInputDirtyCheck;
                oldInputValues[i] = null;
              }
              return scope.$watch(function expressionInputsWatch(scope) {
                var changed = false;
                for (var i = 0,
                    ii = inputExpressions.length; i < ii; i++) {
                  var newInputValue = inputExpressions[i](scope);
                  if (changed || (changed = !expressionInputDirtyCheck(newInputValue, oldInputValueOfValues[i]))) {
                    oldInputValues[i] = newInputValue;
                    oldInputValueOfValues[i] = newInputValue && getValueOf(newInputValue);
                  }
                }
                if (changed) {
                  lastResult = parsedExpression(scope, undefined, undefined, oldInputValues);
                }
                return lastResult;
              }, listener, objectEquality, prettyPrintExpression);
            }
            function oneTimeWatchDelegate(scope, listener, objectEquality, parsedExpression) {
              var unwatch,
                  lastValue;
              return unwatch = scope.$watch(function oneTimeWatch(scope) {
                return parsedExpression(scope);
              }, function oneTimeListener(value, old, scope) {
                lastValue = value;
                if (isFunction(listener)) {
                  listener.apply(this, arguments);
                }
                if (isDefined(value)) {
                  scope.$$postDigest(function() {
                    if (isDefined(lastValue)) {
                      unwatch();
                    }
                  });
                }
              }, objectEquality);
            }
            function oneTimeLiteralWatchDelegate(scope, listener, objectEquality, parsedExpression) {
              var unwatch,
                  lastValue;
              return unwatch = scope.$watch(function oneTimeWatch(scope) {
                return parsedExpression(scope);
              }, function oneTimeListener(value, old, scope) {
                lastValue = value;
                if (isFunction(listener)) {
                  listener.call(this, value, old, scope);
                }
                if (isAllDefined(value)) {
                  scope.$$postDigest(function() {
                    if (isAllDefined(lastValue))
                      unwatch();
                  });
                }
              }, objectEquality);
              function isAllDefined(value) {
                var allDefined = true;
                forEach(value, function(val) {
                  if (!isDefined(val))
                    allDefined = false;
                });
                return allDefined;
              }
            }
            function constantWatchDelegate(scope, listener, objectEquality, parsedExpression) {
              var unwatch;
              return unwatch = scope.$watch(function constantWatch(scope) {
                return parsedExpression(scope);
              }, function constantListener(value, old, scope) {
                if (isFunction(listener)) {
                  listener.apply(this, arguments);
                }
                unwatch();
              }, objectEquality);
            }
            function addInterceptor(parsedExpression, interceptorFn) {
              if (!interceptorFn)
                return parsedExpression;
              var watchDelegate = parsedExpression.$$watchDelegate;
              var regularWatch = watchDelegate !== oneTimeLiteralWatchDelegate && watchDelegate !== oneTimeWatchDelegate;
              var fn = regularWatch ? function regularInterceptedExpression(scope, locals, assign, inputs) {
                var value = parsedExpression(scope, locals, assign, inputs);
                return interceptorFn(value, scope, locals);
              } : function oneTimeInterceptedExpression(scope, locals, assign, inputs) {
                var value = parsedExpression(scope, locals, assign, inputs);
                var result = interceptorFn(value, scope, locals);
                return isDefined(value) ? result : value;
              };
              if (parsedExpression.$$watchDelegate && parsedExpression.$$watchDelegate !== inputsWatchDelegate) {
                fn.$$watchDelegate = parsedExpression.$$watchDelegate;
              } else if (!interceptorFn.$stateful) {
                fn.$$watchDelegate = inputsWatchDelegate;
                fn.inputs = parsedExpression.inputs ? parsedExpression.inputs : [parsedExpression];
              }
              return fn;
            }
          }];
        }
        function $QProvider() {
          this.$get = ['$rootScope', '$exceptionHandler', function($rootScope, $exceptionHandler) {
            return qFactory(function(callback) {
              $rootScope.$evalAsync(callback);
            }, $exceptionHandler);
          }];
        }
        function $$QProvider() {
          this.$get = ['$browser', '$exceptionHandler', function($browser, $exceptionHandler) {
            return qFactory(function(callback) {
              $browser.defer(callback);
            }, $exceptionHandler);
          }];
        }
        function qFactory(nextTick, exceptionHandler) {
          var $qMinErr = minErr('$q', TypeError);
          function callOnce(self, resolveFn, rejectFn) {
            var called = false;
            function wrap(fn) {
              return function(value) {
                if (called)
                  return;
                called = true;
                fn.call(self, value);
              };
            }
            return [wrap(resolveFn), wrap(rejectFn)];
          }
          var defer = function() {
            return new Deferred();
          };
          function Promise() {
            this.$$state = {status: 0};
          }
          Promise.prototype = {
            then: function(onFulfilled, onRejected, progressBack) {
              var result = new Deferred();
              this.$$state.pending = this.$$state.pending || [];
              this.$$state.pending.push([result, onFulfilled, onRejected, progressBack]);
              if (this.$$state.status > 0)
                scheduleProcessQueue(this.$$state);
              return result.promise;
            },
            "catch": function(callback) {
              return this.then(null, callback);
            },
            "finally": function(callback, progressBack) {
              return this.then(function(value) {
                return handleCallback(value, true, callback);
              }, function(error) {
                return handleCallback(error, false, callback);
              }, progressBack);
            }
          };
          function simpleBind(context, fn) {
            return function(value) {
              fn.call(context, value);
            };
          }
          function processQueue(state) {
            var fn,
                deferred,
                pending;
            pending = state.pending;
            state.processScheduled = false;
            state.pending = undefined;
            for (var i = 0,
                ii = pending.length; i < ii; ++i) {
              deferred = pending[i][0];
              fn = pending[i][state.status];
              try {
                if (isFunction(fn)) {
                  deferred.resolve(fn(state.value));
                } else if (state.status === 1) {
                  deferred.resolve(state.value);
                } else {
                  deferred.reject(state.value);
                }
              } catch (e) {
                deferred.reject(e);
                exceptionHandler(e);
              }
            }
          }
          function scheduleProcessQueue(state) {
            if (state.processScheduled || !state.pending)
              return;
            state.processScheduled = true;
            nextTick(function() {
              processQueue(state);
            });
          }
          function Deferred() {
            this.promise = new Promise();
            this.resolve = simpleBind(this, this.resolve);
            this.reject = simpleBind(this, this.reject);
            this.notify = simpleBind(this, this.notify);
          }
          Deferred.prototype = {
            resolve: function(val) {
              if (this.promise.$$state.status)
                return;
              if (val === this.promise) {
                this.$$reject($qMinErr('qcycle', "Expected promise to be resolved with value other than itself '{0}'", val));
              } else {
                this.$$resolve(val);
              }
            },
            $$resolve: function(val) {
              var then,
                  fns;
              fns = callOnce(this, this.$$resolve, this.$$reject);
              try {
                if ((isObject(val) || isFunction(val)))
                  then = val && val.then;
                if (isFunction(then)) {
                  this.promise.$$state.status = -1;
                  then.call(val, fns[0], fns[1], this.notify);
                } else {
                  this.promise.$$state.value = val;
                  this.promise.$$state.status = 1;
                  scheduleProcessQueue(this.promise.$$state);
                }
              } catch (e) {
                fns[1](e);
                exceptionHandler(e);
              }
            },
            reject: function(reason) {
              if (this.promise.$$state.status)
                return;
              this.$$reject(reason);
            },
            $$reject: function(reason) {
              this.promise.$$state.value = reason;
              this.promise.$$state.status = 2;
              scheduleProcessQueue(this.promise.$$state);
            },
            notify: function(progress) {
              var callbacks = this.promise.$$state.pending;
              if ((this.promise.$$state.status <= 0) && callbacks && callbacks.length) {
                nextTick(function() {
                  var callback,
                      result;
                  for (var i = 0,
                      ii = callbacks.length; i < ii; i++) {
                    result = callbacks[i][0];
                    callback = callbacks[i][3];
                    try {
                      result.notify(isFunction(callback) ? callback(progress) : progress);
                    } catch (e) {
                      exceptionHandler(e);
                    }
                  }
                });
              }
            }
          };
          var reject = function(reason) {
            var result = new Deferred();
            result.reject(reason);
            return result.promise;
          };
          var makePromise = function makePromise(value, resolved) {
            var result = new Deferred();
            if (resolved) {
              result.resolve(value);
            } else {
              result.reject(value);
            }
            return result.promise;
          };
          var handleCallback = function handleCallback(value, isResolved, callback) {
            var callbackOutput = null;
            try {
              if (isFunction(callback))
                callbackOutput = callback();
            } catch (e) {
              return makePromise(e, false);
            }
            if (isPromiseLike(callbackOutput)) {
              return callbackOutput.then(function() {
                return makePromise(value, isResolved);
              }, function(error) {
                return makePromise(error, false);
              });
            } else {
              return makePromise(value, isResolved);
            }
          };
          var when = function(value, callback, errback, progressBack) {
            var result = new Deferred();
            result.resolve(value);
            return result.promise.then(callback, errback, progressBack);
          };
          var resolve = when;
          function all(promises) {
            var deferred = new Deferred(),
                counter = 0,
                results = isArray(promises) ? [] : {};
            forEach(promises, function(promise, key) {
              counter++;
              when(promise).then(function(value) {
                if (results.hasOwnProperty(key))
                  return;
                results[key] = value;
                if (!(--counter))
                  deferred.resolve(results);
              }, function(reason) {
                if (results.hasOwnProperty(key))
                  return;
                deferred.reject(reason);
              });
            });
            if (counter === 0) {
              deferred.resolve(results);
            }
            return deferred.promise;
          }
          var $Q = function Q(resolver) {
            if (!isFunction(resolver)) {
              throw $qMinErr('norslvr', "Expected resolverFn, got '{0}'", resolver);
            }
            if (!(this instanceof Q)) {
              return new Q(resolver);
            }
            var deferred = new Deferred();
            function resolveFn(value) {
              deferred.resolve(value);
            }
            function rejectFn(reason) {
              deferred.reject(reason);
            }
            resolver(resolveFn, rejectFn);
            return deferred.promise;
          };
          $Q.defer = defer;
          $Q.reject = reject;
          $Q.when = when;
          $Q.resolve = resolve;
          $Q.all = all;
          return $Q;
        }
        function $$RAFProvider() {
          this.$get = ['$window', '$timeout', function($window, $timeout) {
            var requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame;
            var cancelAnimationFrame = $window.cancelAnimationFrame || $window.webkitCancelAnimationFrame || $window.webkitCancelRequestAnimationFrame;
            var rafSupported = !!requestAnimationFrame;
            var rafFn = rafSupported ? function(fn) {
              var id = requestAnimationFrame(fn);
              return function() {
                cancelAnimationFrame(id);
              };
            } : function(fn) {
              var timer = $timeout(fn, 16.66, false);
              return function() {
                $timeout.cancel(timer);
              };
            };
            queueFn.supported = rafSupported;
            var cancelLastRAF;
            var taskCount = 0;
            var taskQueue = [];
            return queueFn;
            function flush() {
              for (var i = 0; i < taskQueue.length; i++) {
                var task = taskQueue[i];
                if (task) {
                  taskQueue[i] = null;
                  task();
                }
              }
              taskCount = taskQueue.length = 0;
            }
            function queueFn(asyncFn) {
              var index = taskQueue.length;
              taskCount++;
              taskQueue.push(asyncFn);
              if (index === 0) {
                cancelLastRAF = rafFn(flush);
              }
              return function cancelQueueFn() {
                if (index >= 0) {
                  taskQueue[index] = null;
                  index = null;
                  if (--taskCount === 0 && cancelLastRAF) {
                    cancelLastRAF();
                    cancelLastRAF = null;
                    taskQueue.length = 0;
                  }
                }
              };
            }
          }];
        }
        function $RootScopeProvider() {
          var TTL = 10;
          var $rootScopeMinErr = minErr('$rootScope');
          var lastDirtyWatch = null;
          var applyAsyncId = null;
          this.digestTtl = function(value) {
            if (arguments.length) {
              TTL = value;
            }
            return TTL;
          };
          function createChildScopeClass(parent) {
            function ChildScope() {
              this.$$watchers = this.$$nextSibling = this.$$childHead = this.$$childTail = null;
              this.$$listeners = {};
              this.$$listenerCount = {};
              this.$$watchersCount = 0;
              this.$id = nextUid();
              this.$$ChildScope = null;
            }
            ChildScope.prototype = parent;
            return ChildScope;
          }
          this.$get = ['$injector', '$exceptionHandler', '$parse', '$browser', function($injector, $exceptionHandler, $parse, $browser) {
            function destroyChildScope($event) {
              $event.currentScope.$$destroyed = true;
            }
            function Scope() {
              this.$id = nextUid();
              this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;
              this.$root = this;
              this.$$destroyed = false;
              this.$$listeners = {};
              this.$$listenerCount = {};
              this.$$watchersCount = 0;
              this.$$isolateBindings = null;
            }
            Scope.prototype = {
              constructor: Scope,
              $new: function(isolate, parent) {
                var child;
                parent = parent || this;
                if (isolate) {
                  child = new Scope();
                  child.$root = this.$root;
                } else {
                  if (!this.$$ChildScope) {
                    this.$$ChildScope = createChildScopeClass(this);
                  }
                  child = new this.$$ChildScope();
                }
                child.$parent = parent;
                child.$$prevSibling = parent.$$childTail;
                if (parent.$$childHead) {
                  parent.$$childTail.$$nextSibling = child;
                  parent.$$childTail = child;
                } else {
                  parent.$$childHead = parent.$$childTail = child;
                }
                if (isolate || parent != this)
                  child.$on('$destroy', destroyChildScope);
                return child;
              },
              $watch: function(watchExp, listener, objectEquality, prettyPrintExpression) {
                var get = $parse(watchExp);
                if (get.$$watchDelegate) {
                  return get.$$watchDelegate(this, listener, objectEquality, get, watchExp);
                }
                var scope = this,
                    array = scope.$$watchers,
                    watcher = {
                      fn: listener,
                      last: initWatchVal,
                      get: get,
                      exp: prettyPrintExpression || watchExp,
                      eq: !!objectEquality
                    };
                lastDirtyWatch = null;
                if (!isFunction(listener)) {
                  watcher.fn = noop;
                }
                if (!array) {
                  array = scope.$$watchers = [];
                }
                array.unshift(watcher);
                incrementWatchersCount(this, 1);
                return function deregisterWatch() {
                  if (arrayRemove(array, watcher) >= 0) {
                    incrementWatchersCount(scope, -1);
                  }
                  lastDirtyWatch = null;
                };
              },
              $watchGroup: function(watchExpressions, listener) {
                var oldValues = new Array(watchExpressions.length);
                var newValues = new Array(watchExpressions.length);
                var deregisterFns = [];
                var self = this;
                var changeReactionScheduled = false;
                var firstRun = true;
                if (!watchExpressions.length) {
                  var shouldCall = true;
                  self.$evalAsync(function() {
                    if (shouldCall)
                      listener(newValues, newValues, self);
                  });
                  return function deregisterWatchGroup() {
                    shouldCall = false;
                  };
                }
                if (watchExpressions.length === 1) {
                  return this.$watch(watchExpressions[0], function watchGroupAction(value, oldValue, scope) {
                    newValues[0] = value;
                    oldValues[0] = oldValue;
                    listener(newValues, (value === oldValue) ? newValues : oldValues, scope);
                  });
                }
                forEach(watchExpressions, function(expr, i) {
                  var unwatchFn = self.$watch(expr, function watchGroupSubAction(value, oldValue) {
                    newValues[i] = value;
                    oldValues[i] = oldValue;
                    if (!changeReactionScheduled) {
                      changeReactionScheduled = true;
                      self.$evalAsync(watchGroupAction);
                    }
                  });
                  deregisterFns.push(unwatchFn);
                });
                function watchGroupAction() {
                  changeReactionScheduled = false;
                  if (firstRun) {
                    firstRun = false;
                    listener(newValues, newValues, self);
                  } else {
                    listener(newValues, oldValues, self);
                  }
                }
                return function deregisterWatchGroup() {
                  while (deregisterFns.length) {
                    deregisterFns.shift()();
                  }
                };
              },
              $watchCollection: function(obj, listener) {
                $watchCollectionInterceptor.$stateful = true;
                var self = this;
                var newValue;
                var oldValue;
                var veryOldValue;
                var trackVeryOldValue = (listener.length > 1);
                var changeDetected = 0;
                var changeDetector = $parse(obj, $watchCollectionInterceptor);
                var internalArray = [];
                var internalObject = {};
                var initRun = true;
                var oldLength = 0;
                function $watchCollectionInterceptor(_value) {
                  newValue = _value;
                  var newLength,
                      key,
                      bothNaN,
                      newItem,
                      oldItem;
                  if (isUndefined(newValue))
                    return;
                  if (!isObject(newValue)) {
                    if (oldValue !== newValue) {
                      oldValue = newValue;
                      changeDetected++;
                    }
                  } else if (isArrayLike(newValue)) {
                    if (oldValue !== internalArray) {
                      oldValue = internalArray;
                      oldLength = oldValue.length = 0;
                      changeDetected++;
                    }
                    newLength = newValue.length;
                    if (oldLength !== newLength) {
                      changeDetected++;
                      oldValue.length = oldLength = newLength;
                    }
                    for (var i = 0; i < newLength; i++) {
                      oldItem = oldValue[i];
                      newItem = newValue[i];
                      bothNaN = (oldItem !== oldItem) && (newItem !== newItem);
                      if (!bothNaN && (oldItem !== newItem)) {
                        changeDetected++;
                        oldValue[i] = newItem;
                      }
                    }
                  } else {
                    if (oldValue !== internalObject) {
                      oldValue = internalObject = {};
                      oldLength = 0;
                      changeDetected++;
                    }
                    newLength = 0;
                    for (key in newValue) {
                      if (newValue.hasOwnProperty(key)) {
                        newLength++;
                        newItem = newValue[key];
                        oldItem = oldValue[key];
                        if (key in oldValue) {
                          bothNaN = (oldItem !== oldItem) && (newItem !== newItem);
                          if (!bothNaN && (oldItem !== newItem)) {
                            changeDetected++;
                            oldValue[key] = newItem;
                          }
                        } else {
                          oldLength++;
                          oldValue[key] = newItem;
                          changeDetected++;
                        }
                      }
                    }
                    if (oldLength > newLength) {
                      changeDetected++;
                      for (key in oldValue) {
                        if (!newValue.hasOwnProperty(key)) {
                          oldLength--;
                          delete oldValue[key];
                        }
                      }
                    }
                  }
                  return changeDetected;
                }
                function $watchCollectionAction() {
                  if (initRun) {
                    initRun = false;
                    listener(newValue, newValue, self);
                  } else {
                    listener(newValue, veryOldValue, self);
                  }
                  if (trackVeryOldValue) {
                    if (!isObject(newValue)) {
                      veryOldValue = newValue;
                    } else if (isArrayLike(newValue)) {
                      veryOldValue = new Array(newValue.length);
                      for (var i = 0; i < newValue.length; i++) {
                        veryOldValue[i] = newValue[i];
                      }
                    } else {
                      veryOldValue = {};
                      for (var key in newValue) {
                        if (hasOwnProperty.call(newValue, key)) {
                          veryOldValue[key] = newValue[key];
                        }
                      }
                    }
                  }
                }
                return this.$watch(changeDetector, $watchCollectionAction);
              },
              $digest: function() {
                var watch,
                    value,
                    last,
                    watchers,
                    length,
                    dirty,
                    ttl = TTL,
                    next,
                    current,
                    target = this,
                    watchLog = [],
                    logIdx,
                    logMsg,
                    asyncTask;
                beginPhase('$digest');
                $browser.$$checkUrlChange();
                if (this === $rootScope && applyAsyncId !== null) {
                  $browser.defer.cancel(applyAsyncId);
                  flushApplyAsync();
                }
                lastDirtyWatch = null;
                do {
                  dirty = false;
                  current = target;
                  while (asyncQueue.length) {
                    try {
                      asyncTask = asyncQueue.shift();
                      asyncTask.scope.$eval(asyncTask.expression, asyncTask.locals);
                    } catch (e) {
                      $exceptionHandler(e);
                    }
                    lastDirtyWatch = null;
                  }
                  traverseScopesLoop: do {
                    if ((watchers = current.$$watchers)) {
                      length = watchers.length;
                      while (length--) {
                        try {
                          watch = watchers[length];
                          if (watch) {
                            if ((value = watch.get(current)) !== (last = watch.last) && !(watch.eq ? equals(value, last) : (typeof value === 'number' && typeof last === 'number' && isNaN(value) && isNaN(last)))) {
                              dirty = true;
                              lastDirtyWatch = watch;
                              watch.last = watch.eq ? copy(value, null) : value;
                              watch.fn(value, ((last === initWatchVal) ? value : last), current);
                              if (ttl < 5) {
                                logIdx = 4 - ttl;
                                if (!watchLog[logIdx])
                                  watchLog[logIdx] = [];
                                watchLog[logIdx].push({
                                  msg: isFunction(watch.exp) ? 'fn: ' + (watch.exp.name || watch.exp.toString()) : watch.exp,
                                  newVal: value,
                                  oldVal: last
                                });
                              }
                            } else if (watch === lastDirtyWatch) {
                              dirty = false;
                              break traverseScopesLoop;
                            }
                          }
                        } catch (e) {
                          $exceptionHandler(e);
                        }
                      }
                    }
                    if (!(next = ((current.$$watchersCount && current.$$childHead) || (current !== target && current.$$nextSibling)))) {
                      while (current !== target && !(next = current.$$nextSibling)) {
                        current = current.$parent;
                      }
                    }
                  } while ((current = next));
                  if ((dirty || asyncQueue.length) && !(ttl--)) {
                    clearPhase();
                    throw $rootScopeMinErr('infdig', '{0} $digest() iterations reached. Aborting!\n' + 'Watchers fired in the last 5 iterations: {1}', TTL, watchLog);
                  }
                } while (dirty || asyncQueue.length);
                clearPhase();
                while (postDigestQueue.length) {
                  try {
                    postDigestQueue.shift()();
                  } catch (e) {
                    $exceptionHandler(e);
                  }
                }
              },
              $destroy: function() {
                if (this.$$destroyed)
                  return;
                var parent = this.$parent;
                this.$broadcast('$destroy');
                this.$$destroyed = true;
                if (this === $rootScope) {
                  $browser.$$applicationDestroyed();
                }
                incrementWatchersCount(this, -this.$$watchersCount);
                for (var eventName in this.$$listenerCount) {
                  decrementListenerCount(this, this.$$listenerCount[eventName], eventName);
                }
                if (parent && parent.$$childHead == this)
                  parent.$$childHead = this.$$nextSibling;
                if (parent && parent.$$childTail == this)
                  parent.$$childTail = this.$$prevSibling;
                if (this.$$prevSibling)
                  this.$$prevSibling.$$nextSibling = this.$$nextSibling;
                if (this.$$nextSibling)
                  this.$$nextSibling.$$prevSibling = this.$$prevSibling;
                this.$destroy = this.$digest = this.$apply = this.$evalAsync = this.$applyAsync = noop;
                this.$on = this.$watch = this.$watchGroup = function() {
                  return noop;
                };
                this.$$listeners = {};
                this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = this.$root = this.$$watchers = null;
              },
              $eval: function(expr, locals) {
                return $parse(expr)(this, locals);
              },
              $evalAsync: function(expr, locals) {
                if (!$rootScope.$$phase && !asyncQueue.length) {
                  $browser.defer(function() {
                    if (asyncQueue.length) {
                      $rootScope.$digest();
                    }
                  });
                }
                asyncQueue.push({
                  scope: this,
                  expression: expr,
                  locals: locals
                });
              },
              $$postDigest: function(fn) {
                postDigestQueue.push(fn);
              },
              $apply: function(expr) {
                try {
                  beginPhase('$apply');
                  return this.$eval(expr);
                } catch (e) {
                  $exceptionHandler(e);
                } finally {
                  clearPhase();
                  try {
                    $rootScope.$digest();
                  } catch (e) {
                    $exceptionHandler(e);
                    throw e;
                  }
                }
              },
              $applyAsync: function(expr) {
                var scope = this;
                expr && applyAsyncQueue.push($applyAsyncExpression);
                scheduleApplyAsync();
                function $applyAsyncExpression() {
                  scope.$eval(expr);
                }
              },
              $on: function(name, listener) {
                var namedListeners = this.$$listeners[name];
                if (!namedListeners) {
                  this.$$listeners[name] = namedListeners = [];
                }
                namedListeners.push(listener);
                var current = this;
                do {
                  if (!current.$$listenerCount[name]) {
                    current.$$listenerCount[name] = 0;
                  }
                  current.$$listenerCount[name]++;
                } while ((current = current.$parent));
                var self = this;
                return function() {
                  var indexOfListener = namedListeners.indexOf(listener);
                  if (indexOfListener !== -1) {
                    namedListeners[indexOfListener] = null;
                    decrementListenerCount(self, 1, name);
                  }
                };
              },
              $emit: function(name, args) {
                var empty = [],
                    namedListeners,
                    scope = this,
                    stopPropagation = false,
                    event = {
                      name: name,
                      targetScope: scope,
                      stopPropagation: function() {
                        stopPropagation = true;
                      },
                      preventDefault: function() {
                        event.defaultPrevented = true;
                      },
                      defaultPrevented: false
                    },
                    listenerArgs = concat([event], arguments, 1),
                    i,
                    length;
                do {
                  namedListeners = scope.$$listeners[name] || empty;
                  event.currentScope = scope;
                  for (i = 0, length = namedListeners.length; i < length; i++) {
                    if (!namedListeners[i]) {
                      namedListeners.splice(i, 1);
                      i--;
                      length--;
                      continue;
                    }
                    try {
                      namedListeners[i].apply(null, listenerArgs);
                    } catch (e) {
                      $exceptionHandler(e);
                    }
                  }
                  if (stopPropagation) {
                    event.currentScope = null;
                    return event;
                  }
                  scope = scope.$parent;
                } while (scope);
                event.currentScope = null;
                return event;
              },
              $broadcast: function(name, args) {
                var target = this,
                    current = target,
                    next = target,
                    event = {
                      name: name,
                      targetScope: target,
                      preventDefault: function() {
                        event.defaultPrevented = true;
                      },
                      defaultPrevented: false
                    };
                if (!target.$$listenerCount[name])
                  return event;
                var listenerArgs = concat([event], arguments, 1),
                    listeners,
                    i,
                    length;
                while ((current = next)) {
                  event.currentScope = current;
                  listeners = current.$$listeners[name] || [];
                  for (i = 0, length = listeners.length; i < length; i++) {
                    if (!listeners[i]) {
                      listeners.splice(i, 1);
                      i--;
                      length--;
                      continue;
                    }
                    try {
                      listeners[i].apply(null, listenerArgs);
                    } catch (e) {
                      $exceptionHandler(e);
                    }
                  }
                  if (!(next = ((current.$$listenerCount[name] && current.$$childHead) || (current !== target && current.$$nextSibling)))) {
                    while (current !== target && !(next = current.$$nextSibling)) {
                      current = current.$parent;
                    }
                  }
                }
                event.currentScope = null;
                return event;
              }
            };
            var $rootScope = new Scope();
            var asyncQueue = $rootScope.$$asyncQueue = [];
            var postDigestQueue = $rootScope.$$postDigestQueue = [];
            var applyAsyncQueue = $rootScope.$$applyAsyncQueue = [];
            return $rootScope;
            function beginPhase(phase) {
              if ($rootScope.$$phase) {
                throw $rootScopeMinErr('inprog', '{0} already in progress', $rootScope.$$phase);
              }
              $rootScope.$$phase = phase;
            }
            function clearPhase() {
              $rootScope.$$phase = null;
            }
            function incrementWatchersCount(current, count) {
              do {
                current.$$watchersCount += count;
              } while ((current = current.$parent));
            }
            function decrementListenerCount(current, count, name) {
              do {
                current.$$listenerCount[name] -= count;
                if (current.$$listenerCount[name] === 0) {
                  delete current.$$listenerCount[name];
                }
              } while ((current = current.$parent));
            }
            function initWatchVal() {}
            function flushApplyAsync() {
              while (applyAsyncQueue.length) {
                try {
                  applyAsyncQueue.shift()();
                } catch (e) {
                  $exceptionHandler(e);
                }
              }
              applyAsyncId = null;
            }
            function scheduleApplyAsync() {
              if (applyAsyncId === null) {
                applyAsyncId = $browser.defer(function() {
                  $rootScope.$apply(flushApplyAsync);
                });
              }
            }
          }];
        }
        function $$SanitizeUriProvider() {
          var aHrefSanitizationWhitelist = /^\s*(https?|ftp|mailto|tel|file):/,
              imgSrcSanitizationWhitelist = /^\s*((https?|ftp|file|blob):|data:image\/)/;
          this.aHrefSanitizationWhitelist = function(regexp) {
            if (isDefined(regexp)) {
              aHrefSanitizationWhitelist = regexp;
              return this;
            }
            return aHrefSanitizationWhitelist;
          };
          this.imgSrcSanitizationWhitelist = function(regexp) {
            if (isDefined(regexp)) {
              imgSrcSanitizationWhitelist = regexp;
              return this;
            }
            return imgSrcSanitizationWhitelist;
          };
          this.$get = function() {
            return function sanitizeUri(uri, isImage) {
              var regex = isImage ? imgSrcSanitizationWhitelist : aHrefSanitizationWhitelist;
              var normalizedVal;
              normalizedVal = urlResolve(uri).href;
              if (normalizedVal !== '' && !normalizedVal.match(regex)) {
                return 'unsafe:' + normalizedVal;
              }
              return uri;
            };
          };
        }
        var $sceMinErr = minErr('$sce');
        var SCE_CONTEXTS = {
          HTML: 'html',
          CSS: 'css',
          URL: 'url',
          RESOURCE_URL: 'resourceUrl',
          JS: 'js'
        };
        function adjustMatcher(matcher) {
          if (matcher === 'self') {
            return matcher;
          } else if (isString(matcher)) {
            if (matcher.indexOf('***') > -1) {
              throw $sceMinErr('iwcard', 'Illegal sequence *** in string matcher.  String: {0}', matcher);
            }
            matcher = escapeForRegexp(matcher).replace('\\*\\*', '.*').replace('\\*', '[^:/.?&;]*');
            return new RegExp('^' + matcher + '$');
          } else if (isRegExp(matcher)) {
            return new RegExp('^' + matcher.source + '$');
          } else {
            throw $sceMinErr('imatcher', 'Matchers may only be "self", string patterns or RegExp objects');
          }
        }
        function adjustMatchers(matchers) {
          var adjustedMatchers = [];
          if (isDefined(matchers)) {
            forEach(matchers, function(matcher) {
              adjustedMatchers.push(adjustMatcher(matcher));
            });
          }
          return adjustedMatchers;
        }
        function $SceDelegateProvider() {
          this.SCE_CONTEXTS = SCE_CONTEXTS;
          var resourceUrlWhitelist = ['self'],
              resourceUrlBlacklist = [];
          this.resourceUrlWhitelist = function(value) {
            if (arguments.length) {
              resourceUrlWhitelist = adjustMatchers(value);
            }
            return resourceUrlWhitelist;
          };
          this.resourceUrlBlacklist = function(value) {
            if (arguments.length) {
              resourceUrlBlacklist = adjustMatchers(value);
            }
            return resourceUrlBlacklist;
          };
          this.$get = ['$injector', function($injector) {
            var htmlSanitizer = function htmlSanitizer(html) {
              throw $sceMinErr('unsafe', 'Attempting to use an unsafe value in a safe context.');
            };
            if ($injector.has('$sanitize')) {
              htmlSanitizer = $injector.get('$sanitize');
            }
            function matchUrl(matcher, parsedUrl) {
              if (matcher === 'self') {
                return urlIsSameOrigin(parsedUrl);
              } else {
                return !!matcher.exec(parsedUrl.href);
              }
            }
            function isResourceUrlAllowedByPolicy(url) {
              var parsedUrl = urlResolve(url.toString());
              var i,
                  n,
                  allowed = false;
              for (i = 0, n = resourceUrlWhitelist.length; i < n; i++) {
                if (matchUrl(resourceUrlWhitelist[i], parsedUrl)) {
                  allowed = true;
                  break;
                }
              }
              if (allowed) {
                for (i = 0, n = resourceUrlBlacklist.length; i < n; i++) {
                  if (matchUrl(resourceUrlBlacklist[i], parsedUrl)) {
                    allowed = false;
                    break;
                  }
                }
              }
              return allowed;
            }
            function generateHolderType(Base) {
              var holderType = function TrustedValueHolderType(trustedValue) {
                this.$$unwrapTrustedValue = function() {
                  return trustedValue;
                };
              };
              if (Base) {
                holderType.prototype = new Base();
              }
              holderType.prototype.valueOf = function sceValueOf() {
                return this.$$unwrapTrustedValue();
              };
              holderType.prototype.toString = function sceToString() {
                return this.$$unwrapTrustedValue().toString();
              };
              return holderType;
            }
            var trustedValueHolderBase = generateHolderType(),
                byType = {};
            byType[SCE_CONTEXTS.HTML] = generateHolderType(trustedValueHolderBase);
            byType[SCE_CONTEXTS.CSS] = generateHolderType(trustedValueHolderBase);
            byType[SCE_CONTEXTS.URL] = generateHolderType(trustedValueHolderBase);
            byType[SCE_CONTEXTS.JS] = generateHolderType(trustedValueHolderBase);
            byType[SCE_CONTEXTS.RESOURCE_URL] = generateHolderType(byType[SCE_CONTEXTS.URL]);
            function trustAs(type, trustedValue) {
              var Constructor = (byType.hasOwnProperty(type) ? byType[type] : null);
              if (!Constructor) {
                throw $sceMinErr('icontext', 'Attempted to trust a value in invalid context. Context: {0}; Value: {1}', type, trustedValue);
              }
              if (trustedValue === null || trustedValue === undefined || trustedValue === '') {
                return trustedValue;
              }
              if (typeof trustedValue !== 'string') {
                throw $sceMinErr('itype', 'Attempted to trust a non-string value in a content requiring a string: Context: {0}', type);
              }
              return new Constructor(trustedValue);
            }
            function valueOf(maybeTrusted) {
              if (maybeTrusted instanceof trustedValueHolderBase) {
                return maybeTrusted.$$unwrapTrustedValue();
              } else {
                return maybeTrusted;
              }
            }
            function getTrusted(type, maybeTrusted) {
              if (maybeTrusted === null || maybeTrusted === undefined || maybeTrusted === '') {
                return maybeTrusted;
              }
              var constructor = (byType.hasOwnProperty(type) ? byType[type] : null);
              if (constructor && maybeTrusted instanceof constructor) {
                return maybeTrusted.$$unwrapTrustedValue();
              }
              if (type === SCE_CONTEXTS.RESOURCE_URL) {
                if (isResourceUrlAllowedByPolicy(maybeTrusted)) {
                  return maybeTrusted;
                } else {
                  throw $sceMinErr('insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: {0}', maybeTrusted.toString());
                }
              } else if (type === SCE_CONTEXTS.HTML) {
                return htmlSanitizer(maybeTrusted);
              }
              throw $sceMinErr('unsafe', 'Attempting to use an unsafe value in a safe context.');
            }
            return {
              trustAs: trustAs,
              getTrusted: getTrusted,
              valueOf: valueOf
            };
          }];
        }
        function $SceProvider() {
          var enabled = true;
          this.enabled = function(value) {
            if (arguments.length) {
              enabled = !!value;
            }
            return enabled;
          };
          this.$get = ['$parse', '$sceDelegate', function($parse, $sceDelegate) {
            if (enabled && msie < 8) {
              throw $sceMinErr('iequirks', 'Strict Contextual Escaping does not support Internet Explorer version < 11 in quirks ' + 'mode.  You can fix this by adding the text <!doctype html> to the top of your HTML ' + 'document.  See http://docs.angularjs.org/api/ng.$sce for more information.');
            }
            var sce = shallowCopy(SCE_CONTEXTS);
            sce.isEnabled = function() {
              return enabled;
            };
            sce.trustAs = $sceDelegate.trustAs;
            sce.getTrusted = $sceDelegate.getTrusted;
            sce.valueOf = $sceDelegate.valueOf;
            if (!enabled) {
              sce.trustAs = sce.getTrusted = function(type, value) {
                return value;
              };
              sce.valueOf = identity;
            }
            sce.parseAs = function sceParseAs(type, expr) {
              var parsed = $parse(expr);
              if (parsed.literal && parsed.constant) {
                return parsed;
              } else {
                return $parse(expr, function(value) {
                  return sce.getTrusted(type, value);
                });
              }
            };
            var parse = sce.parseAs,
                getTrusted = sce.getTrusted,
                trustAs = sce.trustAs;
            forEach(SCE_CONTEXTS, function(enumValue, name) {
              var lName = lowercase(name);
              sce[camelCase("parse_as_" + lName)] = function(expr) {
                return parse(enumValue, expr);
              };
              sce[camelCase("get_trusted_" + lName)] = function(value) {
                return getTrusted(enumValue, value);
              };
              sce[camelCase("trust_as_" + lName)] = function(value) {
                return trustAs(enumValue, value);
              };
            });
            return sce;
          }];
        }
        function $SnifferProvider() {
          this.$get = ['$window', '$document', function($window, $document) {
            var eventSupport = {},
                android = toInt((/android (\d+)/.exec(lowercase(($window.navigator || {}).userAgent)) || [])[1]),
                boxee = /Boxee/i.test(($window.navigator || {}).userAgent),
                document = $document[0] || {},
                vendorPrefix,
                vendorRegex = /^(Moz|webkit|ms)(?=[A-Z])/,
                bodyStyle = document.body && document.body.style,
                transitions = false,
                animations = false,
                match;
            if (bodyStyle) {
              for (var prop in bodyStyle) {
                if (match = vendorRegex.exec(prop)) {
                  vendorPrefix = match[0];
                  vendorPrefix = vendorPrefix.substr(0, 1).toUpperCase() + vendorPrefix.substr(1);
                  break;
                }
              }
              if (!vendorPrefix) {
                vendorPrefix = ('WebkitOpacity' in bodyStyle) && 'webkit';
              }
              transitions = !!(('transition' in bodyStyle) || (vendorPrefix + 'Transition' in bodyStyle));
              animations = !!(('animation' in bodyStyle) || (vendorPrefix + 'Animation' in bodyStyle));
              if (android && (!transitions || !animations)) {
                transitions = isString(bodyStyle.webkitTransition);
                animations = isString(bodyStyle.webkitAnimation);
              }
            }
            return {
              history: !!($window.history && $window.history.pushState && !(android < 4) && !boxee),
              hasEvent: function(event) {
                if (event === 'input' && msie <= 11)
                  return false;
                if (isUndefined(eventSupport[event])) {
                  var divElm = document.createElement('div');
                  eventSupport[event] = 'on' + event in divElm;
                }
                return eventSupport[event];
              },
              csp: csp(),
              vendorPrefix: vendorPrefix,
              transitions: transitions,
              animations: animations,
              android: android
            };
          }];
        }
        var $compileMinErr = minErr('$compile');
        function $TemplateRequestProvider() {
          this.$get = ['$templateCache', '$http', '$q', '$sce', function($templateCache, $http, $q, $sce) {
            function handleRequestFn(tpl, ignoreRequestError) {
              handleRequestFn.totalPendingRequests++;
              if (!isString(tpl) || !$templateCache.get(tpl)) {
                tpl = $sce.getTrustedResourceUrl(tpl);
              }
              var transformResponse = $http.defaults && $http.defaults.transformResponse;
              if (isArray(transformResponse)) {
                transformResponse = transformResponse.filter(function(transformer) {
                  return transformer !== defaultHttpResponseTransform;
                });
              } else if (transformResponse === defaultHttpResponseTransform) {
                transformResponse = null;
              }
              var httpOptions = {
                cache: $templateCache,
                transformResponse: transformResponse
              };
              return $http.get(tpl, httpOptions)['finally'](function() {
                handleRequestFn.totalPendingRequests--;
              }).then(function(response) {
                $templateCache.put(tpl, response.data);
                return response.data;
              }, handleError);
              function handleError(resp) {
                if (!ignoreRequestError) {
                  throw $compileMinErr('tpload', 'Failed to load template: {0} (HTTP status: {1} {2})', tpl, resp.status, resp.statusText);
                }
                return $q.reject(resp);
              }
            }
            handleRequestFn.totalPendingRequests = 0;
            return handleRequestFn;
          }];
        }
        function $$TestabilityProvider() {
          this.$get = ['$rootScope', '$browser', '$location', function($rootScope, $browser, $location) {
            var testability = {};
            testability.findBindings = function(element, expression, opt_exactMatch) {
              var bindings = element.getElementsByClassName('ng-binding');
              var matches = [];
              forEach(bindings, function(binding) {
                var dataBinding = angular.element(binding).data('$binding');
                if (dataBinding) {
                  forEach(dataBinding, function(bindingName) {
                    if (opt_exactMatch) {
                      var matcher = new RegExp('(^|\\s)' + escapeForRegexp(expression) + '(\\s|\\||$)');
                      if (matcher.test(bindingName)) {
                        matches.push(binding);
                      }
                    } else {
                      if (bindingName.indexOf(expression) != -1) {
                        matches.push(binding);
                      }
                    }
                  });
                }
              });
              return matches;
            };
            testability.findModels = function(element, expression, opt_exactMatch) {
              var prefixes = ['ng-', 'data-ng-', 'ng\\:'];
              for (var p = 0; p < prefixes.length; ++p) {
                var attributeEquals = opt_exactMatch ? '=' : '*=';
                var selector = '[' + prefixes[p] + 'model' + attributeEquals + '"' + expression + '"]';
                var elements = element.querySelectorAll(selector);
                if (elements.length) {
                  return elements;
                }
              }
            };
            testability.getLocation = function() {
              return $location.url();
            };
            testability.setLocation = function(url) {
              if (url !== $location.url()) {
                $location.url(url);
                $rootScope.$digest();
              }
            };
            testability.whenStable = function(callback) {
              $browser.notifyWhenNoOutstandingRequests(callback);
            };
            return testability;
          }];
        }
        function $TimeoutProvider() {
          this.$get = ['$rootScope', '$browser', '$q', '$$q', '$exceptionHandler', function($rootScope, $browser, $q, $$q, $exceptionHandler) {
            var deferreds = {};
            function timeout(fn, delay, invokeApply) {
              if (!isFunction(fn)) {
                invokeApply = delay;
                delay = fn;
                fn = noop;
              }
              var args = sliceArgs(arguments, 3),
                  skipApply = (isDefined(invokeApply) && !invokeApply),
                  deferred = (skipApply ? $$q : $q).defer(),
                  promise = deferred.promise,
                  timeoutId;
              timeoutId = $browser.defer(function() {
                try {
                  deferred.resolve(fn.apply(null, args));
                } catch (e) {
                  deferred.reject(e);
                  $exceptionHandler(e);
                } finally {
                  delete deferreds[promise.$$timeoutId];
                }
                if (!skipApply)
                  $rootScope.$apply();
              }, delay);
              promise.$$timeoutId = timeoutId;
              deferreds[timeoutId] = deferred;
              return promise;
            }
            timeout.cancel = function(promise) {
              if (promise && promise.$$timeoutId in deferreds) {
                deferreds[promise.$$timeoutId].reject('canceled');
                delete deferreds[promise.$$timeoutId];
                return $browser.defer.cancel(promise.$$timeoutId);
              }
              return false;
            };
            return timeout;
          }];
        }
        var urlParsingNode = document.createElement("a");
        var originUrl = urlResolve(window.location.href);
        function urlResolve(url) {
          var href = url;
          if (msie) {
            urlParsingNode.setAttribute("href", href);
            href = urlParsingNode.href;
          }
          urlParsingNode.setAttribute('href', href);
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ? urlParsingNode.pathname : '/' + urlParsingNode.pathname
          };
        }
        function urlIsSameOrigin(requestUrl) {
          var parsed = (isString(requestUrl)) ? urlResolve(requestUrl) : requestUrl;
          return (parsed.protocol === originUrl.protocol && parsed.host === originUrl.host);
        }
        function $WindowProvider() {
          this.$get = valueFn(window);
        }
        function $$CookieReader($document) {
          var rawDocument = $document[0] || {};
          var lastCookies = {};
          var lastCookieString = '';
          function safeDecodeURIComponent(str) {
            try {
              return decodeURIComponent(str);
            } catch (e) {
              return str;
            }
          }
          return function() {
            var cookieArray,
                cookie,
                i,
                index,
                name;
            var currentCookieString = rawDocument.cookie || '';
            if (currentCookieString !== lastCookieString) {
              lastCookieString = currentCookieString;
              cookieArray = lastCookieString.split('; ');
              lastCookies = {};
              for (i = 0; i < cookieArray.length; i++) {
                cookie = cookieArray[i];
                index = cookie.indexOf('=');
                if (index > 0) {
                  name = safeDecodeURIComponent(cookie.substring(0, index));
                  if (lastCookies[name] === undefined) {
                    lastCookies[name] = safeDecodeURIComponent(cookie.substring(index + 1));
                  }
                }
              }
            }
            return lastCookies;
          };
        }
        $$CookieReader.$inject = ['$document'];
        function $$CookieReaderProvider() {
          this.$get = $$CookieReader;
        }
        $FilterProvider.$inject = ['$provide'];
        function $FilterProvider($provide) {
          var suffix = 'Filter';
          function register(name, factory) {
            if (isObject(name)) {
              var filters = {};
              forEach(name, function(filter, key) {
                filters[key] = register(key, filter);
              });
              return filters;
            } else {
              return $provide.factory(name + suffix, factory);
            }
          }
          this.register = register;
          this.$get = ['$injector', function($injector) {
            return function(name) {
              return $injector.get(name + suffix);
            };
          }];
          register('currency', currencyFilter);
          register('date', dateFilter);
          register('filter', filterFilter);
          register('json', jsonFilter);
          register('limitTo', limitToFilter);
          register('lowercase', lowercaseFilter);
          register('number', numberFilter);
          register('orderBy', orderByFilter);
          register('uppercase', uppercaseFilter);
        }
        function filterFilter() {
          return function(array, expression, comparator) {
            if (!isArrayLike(array)) {
              if (array == null) {
                return array;
              } else {
                throw minErr('filter')('notarray', 'Expected array but received: {0}', array);
              }
            }
            var expressionType = getTypeForFilter(expression);
            var predicateFn;
            var matchAgainstAnyProp;
            switch (expressionType) {
              case 'function':
                predicateFn = expression;
                break;
              case 'boolean':
              case 'null':
              case 'number':
              case 'string':
                matchAgainstAnyProp = true;
              case 'object':
                predicateFn = createPredicateFn(expression, comparator, matchAgainstAnyProp);
                break;
              default:
                return array;
            }
            return Array.prototype.filter.call(array, predicateFn);
          };
        }
        function createPredicateFn(expression, comparator, matchAgainstAnyProp) {
          var shouldMatchPrimitives = isObject(expression) && ('$' in expression);
          var predicateFn;
          if (comparator === true) {
            comparator = equals;
          } else if (!isFunction(comparator)) {
            comparator = function(actual, expected) {
              if (isUndefined(actual)) {
                return false;
              }
              if ((actual === null) || (expected === null)) {
                return actual === expected;
              }
              if (isObject(expected) || (isObject(actual) && !hasCustomToString(actual))) {
                return false;
              }
              actual = lowercase('' + actual);
              expected = lowercase('' + expected);
              return actual.indexOf(expected) !== -1;
            };
          }
          predicateFn = function(item) {
            if (shouldMatchPrimitives && !isObject(item)) {
              return deepCompare(item, expression.$, comparator, false);
            }
            return deepCompare(item, expression, comparator, matchAgainstAnyProp);
          };
          return predicateFn;
        }
        function deepCompare(actual, expected, comparator, matchAgainstAnyProp, dontMatchWholeObject) {
          var actualType = getTypeForFilter(actual);
          var expectedType = getTypeForFilter(expected);
          if ((expectedType === 'string') && (expected.charAt(0) === '!')) {
            return !deepCompare(actual, expected.substring(1), comparator, matchAgainstAnyProp);
          } else if (isArray(actual)) {
            return actual.some(function(item) {
              return deepCompare(item, expected, comparator, matchAgainstAnyProp);
            });
          }
          switch (actualType) {
            case 'object':
              var key;
              if (matchAgainstAnyProp) {
                for (key in actual) {
                  if ((key.charAt(0) !== '$') && deepCompare(actual[key], expected, comparator, true)) {
                    return true;
                  }
                }
                return dontMatchWholeObject ? false : deepCompare(actual, expected, comparator, false);
              } else if (expectedType === 'object') {
                for (key in expected) {
                  var expectedVal = expected[key];
                  if (isFunction(expectedVal) || isUndefined(expectedVal)) {
                    continue;
                  }
                  var matchAnyProperty = key === '$';
                  var actualVal = matchAnyProperty ? actual : actual[key];
                  if (!deepCompare(actualVal, expectedVal, comparator, matchAnyProperty, matchAnyProperty)) {
                    return false;
                  }
                }
                return true;
              } else {
                return comparator(actual, expected);
              }
              break;
            case 'function':
              return false;
            default:
              return comparator(actual, expected);
          }
        }
        function getTypeForFilter(val) {
          return (val === null) ? 'null' : typeof val;
        }
        currencyFilter.$inject = ['$locale'];
        function currencyFilter($locale) {
          var formats = $locale.NUMBER_FORMATS;
          return function(amount, currencySymbol, fractionSize) {
            if (isUndefined(currencySymbol)) {
              currencySymbol = formats.CURRENCY_SYM;
            }
            if (isUndefined(fractionSize)) {
              fractionSize = formats.PATTERNS[1].maxFrac;
            }
            return (amount == null) ? amount : formatNumber(amount, formats.PATTERNS[1], formats.GROUP_SEP, formats.DECIMAL_SEP, fractionSize).replace(/\u00A4/g, currencySymbol);
          };
        }
        numberFilter.$inject = ['$locale'];
        function numberFilter($locale) {
          var formats = $locale.NUMBER_FORMATS;
          return function(number, fractionSize) {
            return (number == null) ? number : formatNumber(number, formats.PATTERNS[0], formats.GROUP_SEP, formats.DECIMAL_SEP, fractionSize);
          };
        }
        var DECIMAL_SEP = '.';
        function formatNumber(number, pattern, groupSep, decimalSep, fractionSize) {
          if (isObject(number))
            return '';
          var isNegative = number < 0;
          number = Math.abs(number);
          var isInfinity = number === Infinity;
          if (!isInfinity && !isFinite(number))
            return '';
          var numStr = number + '',
              formatedText = '',
              hasExponent = false,
              parts = [];
          if (isInfinity)
            formatedText = '\u221e';
          if (!isInfinity && numStr.indexOf('e') !== -1) {
            var match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
            if (match && match[2] == '-' && match[3] > fractionSize + 1) {
              number = 0;
            } else {
              formatedText = numStr;
              hasExponent = true;
            }
          }
          if (!isInfinity && !hasExponent) {
            var fractionLen = (numStr.split(DECIMAL_SEP)[1] || '').length;
            if (isUndefined(fractionSize)) {
              fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
            }
            number = +(Math.round(+(number.toString() + 'e' + fractionSize)).toString() + 'e' + -fractionSize);
            var fraction = ('' + number).split(DECIMAL_SEP);
            var whole = fraction[0];
            fraction = fraction[1] || '';
            var i,
                pos = 0,
                lgroup = pattern.lgSize,
                group = pattern.gSize;
            if (whole.length >= (lgroup + group)) {
              pos = whole.length - lgroup;
              for (i = 0; i < pos; i++) {
                if ((pos - i) % group === 0 && i !== 0) {
                  formatedText += groupSep;
                }
                formatedText += whole.charAt(i);
              }
            }
            for (i = pos; i < whole.length; i++) {
              if ((whole.length - i) % lgroup === 0 && i !== 0) {
                formatedText += groupSep;
              }
              formatedText += whole.charAt(i);
            }
            while (fraction.length < fractionSize) {
              fraction += '0';
            }
            if (fractionSize && fractionSize !== "0")
              formatedText += decimalSep + fraction.substr(0, fractionSize);
          } else {
            if (fractionSize > 0 && number < 1) {
              formatedText = number.toFixed(fractionSize);
              number = parseFloat(formatedText);
            }
          }
          if (number === 0) {
            isNegative = false;
          }
          parts.push(isNegative ? pattern.negPre : pattern.posPre, formatedText, isNegative ? pattern.negSuf : pattern.posSuf);
          return parts.join('');
        }
        function padNumber(num, digits, trim) {
          var neg = '';
          if (num < 0) {
            neg = '-';
            num = -num;
          }
          num = '' + num;
          while (num.length < digits)
            num = '0' + num;
          if (trim) {
            num = num.substr(num.length - digits);
          }
          return neg + num;
        }
        function dateGetter(name, size, offset, trim) {
          offset = offset || 0;
          return function(date) {
            var value = date['get' + name]();
            if (offset > 0 || value > -offset) {
              value += offset;
            }
            if (value === 0 && offset == -12)
              value = 12;
            return padNumber(value, size, trim);
          };
        }
        function dateStrGetter(name, shortForm) {
          return function(date, formats) {
            var value = date['get' + name]();
            var get = uppercase(shortForm ? ('SHORT' + name) : name);
            return formats[get][value];
          };
        }
        function timeZoneGetter(date, formats, offset) {
          var zone = -1 * offset;
          var paddedZone = (zone >= 0) ? "+" : "";
          paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2);
          return paddedZone;
        }
        function getFirstThursdayOfYear(year) {
          var dayOfWeekOnFirst = (new Date(year, 0, 1)).getDay();
          return new Date(year, 0, ((dayOfWeekOnFirst <= 4) ? 5 : 12) - dayOfWeekOnFirst);
        }
        function getThursdayThisWeek(datetime) {
          return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate() + (4 - datetime.getDay()));
        }
        function weekGetter(size) {
          return function(date) {
            var firstThurs = getFirstThursdayOfYear(date.getFullYear()),
                thisThurs = getThursdayThisWeek(date);
            var diff = +thisThurs - +firstThurs,
                result = 1 + Math.round(diff / 6.048e8);
            return padNumber(result, size);
          };
        }
        function ampmGetter(date, formats) {
          return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
        }
        function eraGetter(date, formats) {
          return date.getFullYear() <= 0 ? formats.ERAS[0] : formats.ERAS[1];
        }
        function longEraGetter(date, formats) {
          return date.getFullYear() <= 0 ? formats.ERANAMES[0] : formats.ERANAMES[1];
        }
        var DATE_FORMATS = {
          yyyy: dateGetter('FullYear', 4),
          yy: dateGetter('FullYear', 2, 0, true),
          y: dateGetter('FullYear', 1),
          MMMM: dateStrGetter('Month'),
          MMM: dateStrGetter('Month', true),
          MM: dateGetter('Month', 2, 1),
          M: dateGetter('Month', 1, 1),
          dd: dateGetter('Date', 2),
          d: dateGetter('Date', 1),
          HH: dateGetter('Hours', 2),
          H: dateGetter('Hours', 1),
          hh: dateGetter('Hours', 2, -12),
          h: dateGetter('Hours', 1, -12),
          mm: dateGetter('Minutes', 2),
          m: dateGetter('Minutes', 1),
          ss: dateGetter('Seconds', 2),
          s: dateGetter('Seconds', 1),
          sss: dateGetter('Milliseconds', 3),
          EEEE: dateStrGetter('Day'),
          EEE: dateStrGetter('Day', true),
          a: ampmGetter,
          Z: timeZoneGetter,
          ww: weekGetter(2),
          w: weekGetter(1),
          G: eraGetter,
          GG: eraGetter,
          GGG: eraGetter,
          GGGG: longEraGetter
        };
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZEwG']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z|G+|w+))(.*)/,
            NUMBER_STRING = /^\-?\d+$/;
        dateFilter.$inject = ['$locale'];
        function dateFilter($locale) {
          var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
          function jsonStringToDate(string) {
            var match;
            if (match = string.match(R_ISO8601_STR)) {
              var date = new Date(0),
                  tzHour = 0,
                  tzMin = 0,
                  dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                  timeSetter = match[8] ? date.setUTCHours : date.setHours;
              if (match[9]) {
                tzHour = toInt(match[9] + match[10]);
                tzMin = toInt(match[9] + match[11]);
              }
              dateSetter.call(date, toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]));
              var h = toInt(match[4] || 0) - tzHour;
              var m = toInt(match[5] || 0) - tzMin;
              var s = toInt(match[6] || 0);
              var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
              timeSetter.call(date, h, m, s, ms);
              return date;
            }
            return string;
          }
          return function(date, format, timezone) {
            var text = '',
                parts = [],
                fn,
                match;
            format = format || 'mediumDate';
            format = $locale.DATETIME_FORMATS[format] || format;
            if (isString(date)) {
              date = NUMBER_STRING.test(date) ? toInt(date) : jsonStringToDate(date);
            }
            if (isNumber(date)) {
              date = new Date(date);
            }
            if (!isDate(date) || !isFinite(date.getTime())) {
              return date;
            }
            while (format) {
              match = DATE_FORMATS_SPLIT.exec(format);
              if (match) {
                parts = concat(parts, match, 1);
                format = parts.pop();
              } else {
                parts.push(format);
                format = null;
              }
            }
            var dateTimezoneOffset = date.getTimezoneOffset();
            if (timezone) {
              dateTimezoneOffset = timezoneToOffset(timezone, date.getTimezoneOffset());
              date = convertTimezoneToLocal(date, timezone, true);
            }
            forEach(parts, function(value) {
              fn = DATE_FORMATS[value];
              text += fn ? fn(date, $locale.DATETIME_FORMATS, dateTimezoneOffset) : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
            });
            return text;
          };
        }
        function jsonFilter() {
          return function(object, spacing) {
            if (isUndefined(spacing)) {
              spacing = 2;
            }
            return toJson(object, spacing);
          };
        }
        var lowercaseFilter = valueFn(lowercase);
        var uppercaseFilter = valueFn(uppercase);
        function limitToFilter() {
          return function(input, limit, begin) {
            if (Math.abs(Number(limit)) === Infinity) {
              limit = Number(limit);
            } else {
              limit = toInt(limit);
            }
            if (isNaN(limit))
              return input;
            if (isNumber(input))
              input = input.toString();
            if (!isArray(input) && !isString(input))
              return input;
            begin = (!begin || isNaN(begin)) ? 0 : toInt(begin);
            begin = (begin < 0 && begin >= -input.length) ? input.length + begin : begin;
            if (limit >= 0) {
              return input.slice(begin, begin + limit);
            } else {
              if (begin === 0) {
                return input.slice(limit, input.length);
              } else {
                return input.slice(Math.max(0, begin + limit), begin);
              }
            }
          };
        }
        orderByFilter.$inject = ['$parse'];
        function orderByFilter($parse) {
          return function(array, sortPredicate, reverseOrder) {
            if (!(isArrayLike(array)))
              return array;
            if (!isArray(sortPredicate)) {
              sortPredicate = [sortPredicate];
            }
            if (sortPredicate.length === 0) {
              sortPredicate = ['+'];
            }
            var predicates = processPredicates(sortPredicate, reverseOrder);
            var compareValues = Array.prototype.map.call(array, getComparisonObject);
            compareValues.sort(doComparison);
            array = compareValues.map(function(item) {
              return item.value;
            });
            return array;
            function getComparisonObject(value, index) {
              return {
                value: value,
                predicateValues: predicates.map(function(predicate) {
                  return getPredicateValue(predicate.get(value), index);
                })
              };
            }
            function doComparison(v1, v2) {
              var result = 0;
              for (var index = 0,
                  length = predicates.length; index < length; ++index) {
                result = compare(v1.predicateValues[index], v2.predicateValues[index]) * predicates[index].descending;
                if (result)
                  break;
              }
              return result;
            }
          };
          function processPredicates(sortPredicate, reverseOrder) {
            reverseOrder = reverseOrder ? -1 : 1;
            return sortPredicate.map(function(predicate) {
              var descending = 1,
                  get = identity;
              if (isFunction(predicate)) {
                get = predicate;
              } else if (isString(predicate)) {
                if ((predicate.charAt(0) == '+' || predicate.charAt(0) == '-')) {
                  descending = predicate.charAt(0) == '-' ? -1 : 1;
                  predicate = predicate.substring(1);
                }
                if (predicate !== '') {
                  get = $parse(predicate);
                  if (get.constant) {
                    var key = get();
                    get = function(value) {
                      return value[key];
                    };
                  }
                }
              }
              return {
                get: get,
                descending: descending * reverseOrder
              };
            });
          }
          function isPrimitive(value) {
            switch (typeof value) {
              case 'number':
              case 'boolean':
              case 'string':
                return true;
              default:
                return false;
            }
          }
          function objectValue(value, index) {
            if (typeof value.valueOf === 'function') {
              value = value.valueOf();
              if (isPrimitive(value))
                return value;
            }
            if (hasCustomToString(value)) {
              value = value.toString();
              if (isPrimitive(value))
                return value;
            }
            return index;
          }
          function getPredicateValue(value, index) {
            var type = typeof value;
            if (value === null) {
              type = 'string';
              value = 'null';
            } else if (type === 'string') {
              value = value.toLowerCase();
            } else if (type === 'object') {
              value = objectValue(value, index);
            }
            return {
              value: value,
              type: type
            };
          }
          function compare(v1, v2) {
            var result = 0;
            if (v1.type === v2.type) {
              if (v1.value !== v2.value) {
                result = v1.value < v2.value ? -1 : 1;
              }
            } else {
              result = v1.type < v2.type ? -1 : 1;
            }
            return result;
          }
        }
        function ngDirective(directive) {
          if (isFunction(directive)) {
            directive = {link: directive};
          }
          directive.restrict = directive.restrict || 'AC';
          return valueFn(directive);
        }
        var htmlAnchorDirective = valueFn({
          restrict: 'E',
          compile: function(element, attr) {
            if (!attr.href && !attr.xlinkHref) {
              return function(scope, element) {
                if (element[0].nodeName.toLowerCase() !== 'a')
                  return;
                var href = toString.call(element.prop('href')) === '[object SVGAnimatedString]' ? 'xlink:href' : 'href';
                element.on('click', function(event) {
                  if (!element.attr(href)) {
                    event.preventDefault();
                  }
                });
              };
            }
          }
        });
        var ngAttributeAliasDirectives = {};
        forEach(BOOLEAN_ATTR, function(propName, attrName) {
          if (propName == "multiple")
            return;
          function defaultLinkFn(scope, element, attr) {
            scope.$watch(attr[normalized], function ngBooleanAttrWatchAction(value) {
              attr.$set(attrName, !!value);
            });
          }
          var normalized = directiveNormalize('ng-' + attrName);
          var linkFn = defaultLinkFn;
          if (propName === 'checked') {
            linkFn = function(scope, element, attr) {
              if (attr.ngModel !== attr[normalized]) {
                defaultLinkFn(scope, element, attr);
              }
            };
          }
          ngAttributeAliasDirectives[normalized] = function() {
            return {
              restrict: 'A',
              priority: 100,
              link: linkFn
            };
          };
        });
        forEach(ALIASED_ATTR, function(htmlAttr, ngAttr) {
          ngAttributeAliasDirectives[ngAttr] = function() {
            return {
              priority: 100,
              link: function(scope, element, attr) {
                if (ngAttr === "ngPattern" && attr.ngPattern.charAt(0) == "/") {
                  var match = attr.ngPattern.match(REGEX_STRING_REGEXP);
                  if (match) {
                    attr.$set("ngPattern", new RegExp(match[1], match[2]));
                    return;
                  }
                }
                scope.$watch(attr[ngAttr], function ngAttrAliasWatchAction(value) {
                  attr.$set(ngAttr, value);
                });
              }
            };
          };
        });
        forEach(['src', 'srcset', 'href'], function(attrName) {
          var normalized = directiveNormalize('ng-' + attrName);
          ngAttributeAliasDirectives[normalized] = function() {
            return {
              priority: 99,
              link: function(scope, element, attr) {
                var propName = attrName,
                    name = attrName;
                if (attrName === 'href' && toString.call(element.prop('href')) === '[object SVGAnimatedString]') {
                  name = 'xlinkHref';
                  attr.$attr[name] = 'xlink:href';
                  propName = null;
                }
                attr.$observe(normalized, function(value) {
                  if (!value) {
                    if (attrName === 'href') {
                      attr.$set(name, null);
                    }
                    return;
                  }
                  attr.$set(name, value);
                  if (msie && propName)
                    element.prop(propName, attr[name]);
                });
              }
            };
          };
        });
        var nullFormCtrl = {
          $addControl: noop,
          $$renameControl: nullFormRenameControl,
          $removeControl: noop,
          $setValidity: noop,
          $setDirty: noop,
          $setPristine: noop,
          $setSubmitted: noop
        },
            SUBMITTED_CLASS = 'ng-submitted';
        function nullFormRenameControl(control, name) {
          control.$name = name;
        }
        FormController.$inject = ['$element', '$attrs', '$scope', '$animate', '$interpolate'];
        function FormController(element, attrs, $scope, $animate, $interpolate) {
          var form = this,
              controls = [];
          var parentForm = form.$$parentForm = element.parent().controller('form') || nullFormCtrl;
          form.$error = {};
          form.$$success = {};
          form.$pending = undefined;
          form.$name = $interpolate(attrs.name || attrs.ngForm || '')($scope);
          form.$dirty = false;
          form.$pristine = true;
          form.$valid = true;
          form.$invalid = false;
          form.$submitted = false;
          parentForm.$addControl(form);
          form.$rollbackViewValue = function() {
            forEach(controls, function(control) {
              control.$rollbackViewValue();
            });
          };
          form.$commitViewValue = function() {
            forEach(controls, function(control) {
              control.$commitViewValue();
            });
          };
          form.$addControl = function(control) {
            assertNotHasOwnProperty(control.$name, 'input');
            controls.push(control);
            if (control.$name) {
              form[control.$name] = control;
            }
          };
          form.$$renameControl = function(control, newName) {
            var oldName = control.$name;
            if (form[oldName] === control) {
              delete form[oldName];
            }
            form[newName] = control;
            control.$name = newName;
          };
          form.$removeControl = function(control) {
            if (control.$name && form[control.$name] === control) {
              delete form[control.$name];
            }
            forEach(form.$pending, function(value, name) {
              form.$setValidity(name, null, control);
            });
            forEach(form.$error, function(value, name) {
              form.$setValidity(name, null, control);
            });
            forEach(form.$$success, function(value, name) {
              form.$setValidity(name, null, control);
            });
            arrayRemove(controls, control);
          };
          addSetValidityMethod({
            ctrl: this,
            $element: element,
            set: function(object, property, controller) {
              var list = object[property];
              if (!list) {
                object[property] = [controller];
              } else {
                var index = list.indexOf(controller);
                if (index === -1) {
                  list.push(controller);
                }
              }
            },
            unset: function(object, property, controller) {
              var list = object[property];
              if (!list) {
                return;
              }
              arrayRemove(list, controller);
              if (list.length === 0) {
                delete object[property];
              }
            },
            parentForm: parentForm,
            $animate: $animate
          });
          form.$setDirty = function() {
            $animate.removeClass(element, PRISTINE_CLASS);
            $animate.addClass(element, DIRTY_CLASS);
            form.$dirty = true;
            form.$pristine = false;
            parentForm.$setDirty();
          };
          form.$setPristine = function() {
            $animate.setClass(element, PRISTINE_CLASS, DIRTY_CLASS + ' ' + SUBMITTED_CLASS);
            form.$dirty = false;
            form.$pristine = true;
            form.$submitted = false;
            forEach(controls, function(control) {
              control.$setPristine();
            });
          };
          form.$setUntouched = function() {
            forEach(controls, function(control) {
              control.$setUntouched();
            });
          };
          form.$setSubmitted = function() {
            $animate.addClass(element, SUBMITTED_CLASS);
            form.$submitted = true;
            parentForm.$setSubmitted();
          };
        }
        var formDirectiveFactory = function(isNgForm) {
          return ['$timeout', function($timeout) {
            var formDirective = {
              name: 'form',
              restrict: isNgForm ? 'EAC' : 'E',
              controller: FormController,
              compile: function ngFormCompile(formElement, attr) {
                formElement.addClass(PRISTINE_CLASS).addClass(VALID_CLASS);
                var nameAttr = attr.name ? 'name' : (isNgForm && attr.ngForm ? 'ngForm' : false);
                return {pre: function ngFormPreLink(scope, formElement, attr, controller) {
                    if (!('action' in attr)) {
                      var handleFormSubmission = function(event) {
                        scope.$apply(function() {
                          controller.$commitViewValue();
                          controller.$setSubmitted();
                        });
                        event.preventDefault();
                      };
                      addEventListenerFn(formElement[0], 'submit', handleFormSubmission);
                      formElement.on('$destroy', function() {
                        $timeout(function() {
                          removeEventListenerFn(formElement[0], 'submit', handleFormSubmission);
                        }, 0, false);
                      });
                    }
                    var parentFormCtrl = controller.$$parentForm;
                    if (nameAttr) {
                      setter(scope, controller.$name, controller, controller.$name);
                      attr.$observe(nameAttr, function(newValue) {
                        if (controller.$name === newValue)
                          return;
                        setter(scope, controller.$name, undefined, controller.$name);
                        parentFormCtrl.$$renameControl(controller, newValue);
                        setter(scope, controller.$name, controller, controller.$name);
                      });
                    }
                    formElement.on('$destroy', function() {
                      parentFormCtrl.$removeControl(controller);
                      if (nameAttr) {
                        setter(scope, attr[nameAttr], undefined, controller.$name);
                      }
                      extend(controller, nullFormCtrl);
                    });
                  }};
              }
            };
            return formDirective;
          }];
        };
        var formDirective = formDirectiveFactory();
        var ngFormDirective = formDirectiveFactory(true);
        var ISO_DATE_REGEXP = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;
        var URL_REGEXP = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
        var EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
        var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))([eE][+-]?\d+)?\s*$/;
        var DATE_REGEXP = /^(\d{4})-(\d{2})-(\d{2})$/;
        var DATETIMELOCAL_REGEXP = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/;
        var WEEK_REGEXP = /^(\d{4})-W(\d\d)$/;
        var MONTH_REGEXP = /^(\d{4})-(\d\d)$/;
        var TIME_REGEXP = /^(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/;
        var inputType = {
          'text': textInputType,
          'date': createDateInputType('date', DATE_REGEXP, createDateParser(DATE_REGEXP, ['yyyy', 'MM', 'dd']), 'yyyy-MM-dd'),
          'datetime-local': createDateInputType('datetimelocal', DATETIMELOCAL_REGEXP, createDateParser(DATETIMELOCAL_REGEXP, ['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss', 'sss']), 'yyyy-MM-ddTHH:mm:ss.sss'),
          'time': createDateInputType('time', TIME_REGEXP, createDateParser(TIME_REGEXP, ['HH', 'mm', 'ss', 'sss']), 'HH:mm:ss.sss'),
          'week': createDateInputType('week', WEEK_REGEXP, weekParser, 'yyyy-Www'),
          'month': createDateInputType('month', MONTH_REGEXP, createDateParser(MONTH_REGEXP, ['yyyy', 'MM']), 'yyyy-MM'),
          'number': numberInputType,
          'url': urlInputType,
          'email': emailInputType,
          'radio': radioInputType,
          'checkbox': checkboxInputType,
          'hidden': noop,
          'button': noop,
          'submit': noop,
          'reset': noop,
          'file': noop
        };
        function stringBasedInputType(ctrl) {
          ctrl.$formatters.push(function(value) {
            return ctrl.$isEmpty(value) ? value : value.toString();
          });
        }
        function textInputType(scope, element, attr, ctrl, $sniffer, $browser) {
          baseInputType(scope, element, attr, ctrl, $sniffer, $browser);
          stringBasedInputType(ctrl);
        }
        function baseInputType(scope, element, attr, ctrl, $sniffer, $browser) {
          var type = lowercase(element[0].type);
          if (!$sniffer.android) {
            var composing = false;
            element.on('compositionstart', function(data) {
              composing = true;
            });
            element.on('compositionend', function() {
              composing = false;
              listener();
            });
          }
          var listener = function(ev) {
            if (timeout) {
              $browser.defer.cancel(timeout);
              timeout = null;
            }
            if (composing)
              return;
            var value = element.val(),
                event = ev && ev.type;
            if (type !== 'password' && (!attr.ngTrim || attr.ngTrim !== 'false')) {
              value = trim(value);
            }
            if (ctrl.$viewValue !== value || (value === '' && ctrl.$$hasNativeValidators)) {
              ctrl.$setViewValue(value, event);
            }
          };
          if ($sniffer.hasEvent('input')) {
            element.on('input', listener);
          } else {
            var timeout;
            var deferListener = function(ev, input, origValue) {
              if (!timeout) {
                timeout = $browser.defer(function() {
                  timeout = null;
                  if (!input || input.value !== origValue) {
                    listener(ev);
                  }
                });
              }
            };
            element.on('keydown', function(event) {
              var key = event.keyCode;
              if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40))
                return;
              deferListener(event, this, this.value);
            });
            if ($sniffer.hasEvent('paste')) {
              element.on('paste cut', deferListener);
            }
          }
          element.on('change', listener);
          ctrl.$render = function() {
            element.val(ctrl.$isEmpty(ctrl.$viewValue) ? '' : ctrl.$viewValue);
          };
        }
        function weekParser(isoWeek, existingDate) {
          if (isDate(isoWeek)) {
            return isoWeek;
          }
          if (isString(isoWeek)) {
            WEEK_REGEXP.lastIndex = 0;
            var parts = WEEK_REGEXP.exec(isoWeek);
            if (parts) {
              var year = +parts[1],
                  week = +parts[2],
                  hours = 0,
                  minutes = 0,
                  seconds = 0,
                  milliseconds = 0,
                  firstThurs = getFirstThursdayOfYear(year),
                  addDays = (week - 1) * 7;
              if (existingDate) {
                hours = existingDate.getHours();
                minutes = existingDate.getMinutes();
                seconds = existingDate.getSeconds();
                milliseconds = existingDate.getMilliseconds();
              }
              return new Date(year, 0, firstThurs.getDate() + addDays, hours, minutes, seconds, milliseconds);
            }
          }
          return NaN;
        }
        function createDateParser(regexp, mapping) {
          return function(iso, date) {
            var parts,
                map;
            if (isDate(iso)) {
              return iso;
            }
            if (isString(iso)) {
              if (iso.charAt(0) == '"' && iso.charAt(iso.length - 1) == '"') {
                iso = iso.substring(1, iso.length - 1);
              }
              if (ISO_DATE_REGEXP.test(iso)) {
                return new Date(iso);
              }
              regexp.lastIndex = 0;
              parts = regexp.exec(iso);
              if (parts) {
                parts.shift();
                if (date) {
                  map = {
                    yyyy: date.getFullYear(),
                    MM: date.getMonth() + 1,
                    dd: date.getDate(),
                    HH: date.getHours(),
                    mm: date.getMinutes(),
                    ss: date.getSeconds(),
                    sss: date.getMilliseconds() / 1000
                  };
                } else {
                  map = {
                    yyyy: 1970,
                    MM: 1,
                    dd: 1,
                    HH: 0,
                    mm: 0,
                    ss: 0,
                    sss: 0
                  };
                }
                forEach(parts, function(part, index) {
                  if (index < mapping.length) {
                    map[mapping[index]] = +part;
                  }
                });
                return new Date(map.yyyy, map.MM - 1, map.dd, map.HH, map.mm, map.ss || 0, map.sss * 1000 || 0);
              }
            }
            return NaN;
          };
        }
        function createDateInputType(type, regexp, parseDate, format) {
          return function dynamicDateInputType(scope, element, attr, ctrl, $sniffer, $browser, $filter) {
            badInputChecker(scope, element, attr, ctrl);
            baseInputType(scope, element, attr, ctrl, $sniffer, $browser);
            var timezone = ctrl && ctrl.$options && ctrl.$options.timezone;
            var previousDate;
            ctrl.$$parserName = type;
            ctrl.$parsers.push(function(value) {
              if (ctrl.$isEmpty(value))
                return null;
              if (regexp.test(value)) {
                var parsedDate = parseDate(value, previousDate);
                if (timezone) {
                  parsedDate = convertTimezoneToLocal(parsedDate, timezone);
                }
                return parsedDate;
              }
              return undefined;
            });
            ctrl.$formatters.push(function(value) {
              if (value && !isDate(value)) {
                throw $ngModelMinErr('datefmt', 'Expected `{0}` to be a date', value);
              }
              if (isValidDate(value)) {
                previousDate = value;
                if (previousDate && timezone) {
                  previousDate = convertTimezoneToLocal(previousDate, timezone, true);
                }
                return $filter('date')(value, format, timezone);
              } else {
                previousDate = null;
                return '';
              }
            });
            if (isDefined(attr.min) || attr.ngMin) {
              var minVal;
              ctrl.$validators.min = function(value) {
                return !isValidDate(value) || isUndefined(minVal) || parseDate(value) >= minVal;
              };
              attr.$observe('min', function(val) {
                minVal = parseObservedDateValue(val);
                ctrl.$validate();
              });
            }
            if (isDefined(attr.max) || attr.ngMax) {
              var maxVal;
              ctrl.$validators.max = function(value) {
                return !isValidDate(value) || isUndefined(maxVal) || parseDate(value) <= maxVal;
              };
              attr.$observe('max', function(val) {
                maxVal = parseObservedDateValue(val);
                ctrl.$validate();
              });
            }
            function isValidDate(value) {
              return value && !(value.getTime && value.getTime() !== value.getTime());
            }
            function parseObservedDateValue(val) {
              return isDefined(val) ? (isDate(val) ? val : parseDate(val)) : undefined;
            }
          };
        }
        function badInputChecker(scope, element, attr, ctrl) {
          var node = element[0];
          var nativeValidation = ctrl.$$hasNativeValidators = isObject(node.validity);
          if (nativeValidation) {
            ctrl.$parsers.push(function(value) {
              var validity = element.prop(VALIDITY_STATE_PROPERTY) || {};
              return validity.badInput && !validity.typeMismatch ? undefined : value;
            });
          }
        }
        function numberInputType(scope, element, attr, ctrl, $sniffer, $browser) {
          badInputChecker(scope, element, attr, ctrl);
          baseInputType(scope, element, attr, ctrl, $sniffer, $browser);
          ctrl.$$parserName = 'number';
          ctrl.$parsers.push(function(value) {
            if (ctrl.$isEmpty(value))
              return null;
            if (NUMBER_REGEXP.test(value))
              return parseFloat(value);
            return undefined;
          });
          ctrl.$formatters.push(function(value) {
            if (!ctrl.$isEmpty(value)) {
              if (!isNumber(value)) {
                throw $ngModelMinErr('numfmt', 'Expected `{0}` to be a number', value);
              }
              value = value.toString();
            }
            return value;
          });
          if (isDefined(attr.min) || attr.ngMin) {
            var minVal;
            ctrl.$validators.min = function(value) {
              return ctrl.$isEmpty(value) || isUndefined(minVal) || value >= minVal;
            };
            attr.$observe('min', function(val) {
              if (isDefined(val) && !isNumber(val)) {
                val = parseFloat(val, 10);
              }
              minVal = isNumber(val) && !isNaN(val) ? val : undefined;
              ctrl.$validate();
            });
          }
          if (isDefined(attr.max) || attr.ngMax) {
            var maxVal;
            ctrl.$validators.max = function(value) {
              return ctrl.$isEmpty(value) || isUndefined(maxVal) || value <= maxVal;
            };
            attr.$observe('max', function(val) {
              if (isDefined(val) && !isNumber(val)) {
                val = parseFloat(val, 10);
              }
              maxVal = isNumber(val) && !isNaN(val) ? val : undefined;
              ctrl.$validate();
            });
          }
        }
        function urlInputType(scope, element, attr, ctrl, $sniffer, $browser) {
          baseInputType(scope, element, attr, ctrl, $sniffer, $browser);
          stringBasedInputType(ctrl);
          ctrl.$$parserName = 'url';
          ctrl.$validators.url = function(modelValue, viewValue) {
            var value = modelValue || viewValue;
            return ctrl.$isEmpty(value) || URL_REGEXP.test(value);
          };
        }
        function emailInputType(scope, element, attr, ctrl, $sniffer, $browser) {
          baseInputType(scope, element, attr, ctrl, $sniffer, $browser);
          stringBasedInputType(ctrl);
          ctrl.$$parserName = 'email';
          ctrl.$validators.email = function(modelValue, viewValue) {
            var value = modelValue || viewValue;
            return ctrl.$isEmpty(value) || EMAIL_REGEXP.test(value);
          };
        }
        function radioInputType(scope, element, attr, ctrl) {
          if (isUndefined(attr.name)) {
            element.attr('name', nextUid());
          }
          var listener = function(ev) {
            if (element[0].checked) {
              ctrl.$setViewValue(attr.value, ev && ev.type);
            }
          };
          element.on('click', listener);
          ctrl.$render = function() {
            var value = attr.value;
            element[0].checked = (value == ctrl.$viewValue);
          };
          attr.$observe('value', ctrl.$render);
        }
        function parseConstantExpr($parse, context, name, expression, fallback) {
          var parseFn;
          if (isDefined(expression)) {
            parseFn = $parse(expression);
            if (!parseFn.constant) {
              throw minErr('ngModel')('constexpr', 'Expected constant expression for `{0}`, but saw ' + '`{1}`.', name, expression);
            }
            return parseFn(context);
          }
          return fallback;
        }
        function checkboxInputType(scope, element, attr, ctrl, $sniffer, $browser, $filter, $parse) {
          var trueValue = parseConstantExpr($parse, scope, 'ngTrueValue', attr.ngTrueValue, true);
          var falseValue = parseConstantExpr($parse, scope, 'ngFalseValue', attr.ngFalseValue, false);
          var listener = function(ev) {
            ctrl.$setViewValue(element[0].checked, ev && ev.type);
          };
          element.on('click', listener);
          ctrl.$render = function() {
            element[0].checked = ctrl.$viewValue;
          };
          ctrl.$isEmpty = function(value) {
            return value === false;
          };
          ctrl.$formatters.push(function(value) {
            return equals(value, trueValue);
          });
          ctrl.$parsers.push(function(value) {
            return value ? trueValue : falseValue;
          });
        }
        var inputDirective = ['$browser', '$sniffer', '$filter', '$parse', function($browser, $sniffer, $filter, $parse) {
          return {
            restrict: 'E',
            require: ['?ngModel'],
            link: {pre: function(scope, element, attr, ctrls) {
                if (ctrls[0]) {
                  (inputType[lowercase(attr.type)] || inputType.text)(scope, element, attr, ctrls[0], $sniffer, $browser, $filter, $parse);
                }
              }}
          };
        }];
        var CONSTANT_VALUE_REGEXP = /^(true|false|\d+)$/;
        var ngValueDirective = function() {
          return {
            restrict: 'A',
            priority: 100,
            compile: function(tpl, tplAttr) {
              if (CONSTANT_VALUE_REGEXP.test(tplAttr.ngValue)) {
                return function ngValueConstantLink(scope, elm, attr) {
                  attr.$set('value', scope.$eval(attr.ngValue));
                };
              } else {
                return function ngValueLink(scope, elm, attr) {
                  scope.$watch(attr.ngValue, function valueWatchAction(value) {
                    attr.$set('value', value);
                  });
                };
              }
            }
          };
        };
        var ngBindDirective = ['$compile', function($compile) {
          return {
            restrict: 'AC',
            compile: function ngBindCompile(templateElement) {
              $compile.$$addBindingClass(templateElement);
              return function ngBindLink(scope, element, attr) {
                $compile.$$addBindingInfo(element, attr.ngBind);
                element = element[0];
                scope.$watch(attr.ngBind, function ngBindWatchAction(value) {
                  element.textContent = value === undefined ? '' : value;
                });
              };
            }
          };
        }];
        var ngBindTemplateDirective = ['$interpolate', '$compile', function($interpolate, $compile) {
          return {compile: function ngBindTemplateCompile(templateElement) {
              $compile.$$addBindingClass(templateElement);
              return function ngBindTemplateLink(scope, element, attr) {
                var interpolateFn = $interpolate(element.attr(attr.$attr.ngBindTemplate));
                $compile.$$addBindingInfo(element, interpolateFn.expressions);
                element = element[0];
                attr.$observe('ngBindTemplate', function(value) {
                  element.textContent = value === undefined ? '' : value;
                });
              };
            }};
        }];
        var ngBindHtmlDirective = ['$sce', '$parse', '$compile', function($sce, $parse, $compile) {
          return {
            restrict: 'A',
            compile: function ngBindHtmlCompile(tElement, tAttrs) {
              var ngBindHtmlGetter = $parse(tAttrs.ngBindHtml);
              var ngBindHtmlWatch = $parse(tAttrs.ngBindHtml, function getStringValue(value) {
                return (value || '').toString();
              });
              $compile.$$addBindingClass(tElement);
              return function ngBindHtmlLink(scope, element, attr) {
                $compile.$$addBindingInfo(element, attr.ngBindHtml);
                scope.$watch(ngBindHtmlWatch, function ngBindHtmlWatchAction() {
                  element.html($sce.getTrustedHtml(ngBindHtmlGetter(scope)) || '');
                });
              };
            }
          };
        }];
        var ngChangeDirective = valueFn({
          restrict: 'A',
          require: 'ngModel',
          link: function(scope, element, attr, ctrl) {
            ctrl.$viewChangeListeners.push(function() {
              scope.$eval(attr.ngChange);
            });
          }
        });
        function classDirective(name, selector) {
          name = 'ngClass' + name;
          return ['$animate', function($animate) {
            return {
              restrict: 'AC',
              link: function(scope, element, attr) {
                var oldVal;
                scope.$watch(attr[name], ngClassWatchAction, true);
                attr.$observe('class', function(value) {
                  ngClassWatchAction(scope.$eval(attr[name]));
                });
                if (name !== 'ngClass') {
                  scope.$watch('$index', function($index, old$index) {
                    var mod = $index & 1;
                    if (mod !== (old$index & 1)) {
                      var classes = arrayClasses(scope.$eval(attr[name]));
                      mod === selector ? addClasses(classes) : removeClasses(classes);
                    }
                  });
                }
                function addClasses(classes) {
                  var newClasses = digestClassCounts(classes, 1);
                  attr.$addClass(newClasses);
                }
                function removeClasses(classes) {
                  var newClasses = digestClassCounts(classes, -1);
                  attr.$removeClass(newClasses);
                }
                function digestClassCounts(classes, count) {
                  var classCounts = element.data('$classCounts') || createMap();
                  var classesToUpdate = [];
                  forEach(classes, function(className) {
                    if (count > 0 || classCounts[className]) {
                      classCounts[className] = (classCounts[className] || 0) + count;
                      if (classCounts[className] === +(count > 0)) {
                        classesToUpdate.push(className);
                      }
                    }
                  });
                  element.data('$classCounts', classCounts);
                  return classesToUpdate.join(' ');
                }
                function updateClasses(oldClasses, newClasses) {
                  var toAdd = arrayDifference(newClasses, oldClasses);
                  var toRemove = arrayDifference(oldClasses, newClasses);
                  toAdd = digestClassCounts(toAdd, 1);
                  toRemove = digestClassCounts(toRemove, -1);
                  if (toAdd && toAdd.length) {
                    $animate.addClass(element, toAdd);
                  }
                  if (toRemove && toRemove.length) {
                    $animate.removeClass(element, toRemove);
                  }
                }
                function ngClassWatchAction(newVal) {
                  if (selector === true || scope.$index % 2 === selector) {
                    var newClasses = arrayClasses(newVal || []);
                    if (!oldVal) {
                      addClasses(newClasses);
                    } else if (!equals(newVal, oldVal)) {
                      var oldClasses = arrayClasses(oldVal);
                      updateClasses(oldClasses, newClasses);
                    }
                  }
                  oldVal = shallowCopy(newVal);
                }
              }
            };
            function arrayDifference(tokens1, tokens2) {
              var values = [];
              outer: for (var i = 0; i < tokens1.length; i++) {
                var token = tokens1[i];
                for (var j = 0; j < tokens2.length; j++) {
                  if (token == tokens2[j])
                    continue outer;
                }
                values.push(token);
              }
              return values;
            }
            function arrayClasses(classVal) {
              var classes = [];
              if (isArray(classVal)) {
                forEach(classVal, function(v) {
                  classes = classes.concat(arrayClasses(v));
                });
                return classes;
              } else if (isString(classVal)) {
                return classVal.split(' ');
              } else if (isObject(classVal)) {
                forEach(classVal, function(v, k) {
                  if (v) {
                    classes = classes.concat(k.split(' '));
                  }
                });
                return classes;
              }
              return classVal;
            }
          }];
        }
        var ngClassDirective = classDirective('', true);
        var ngClassOddDirective = classDirective('Odd', 0);
        var ngClassEvenDirective = classDirective('Even', 1);
        var ngCloakDirective = ngDirective({compile: function(element, attr) {
            attr.$set('ngCloak', undefined);
            element.removeClass('ng-cloak');
          }});
        var ngControllerDirective = [function() {
          return {
            restrict: 'A',
            scope: true,
            controller: '@',
            priority: 500
          };
        }];
        var ngEventDirectives = {};
        var forceAsyncEvents = {
          'blur': true,
          'focus': true
        };
        forEach('click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste'.split(' '), function(eventName) {
          var directiveName = directiveNormalize('ng-' + eventName);
          ngEventDirectives[directiveName] = ['$parse', '$rootScope', function($parse, $rootScope) {
            return {
              restrict: 'A',
              compile: function($element, attr) {
                var fn = $parse(attr[directiveName], null, true);
                return function ngEventHandler(scope, element) {
                  element.on(eventName, function(event) {
                    var callback = function() {
                      fn(scope, {$event: event});
                    };
                    if (forceAsyncEvents[eventName] && $rootScope.$$phase) {
                      scope.$evalAsync(callback);
                    } else {
                      scope.$apply(callback);
                    }
                  });
                };
              }
            };
          }];
        });
        var ngIfDirective = ['$animate', function($animate) {
          return {
            multiElement: true,
            transclude: 'element',
            priority: 600,
            terminal: true,
            restrict: 'A',
            $$tlb: true,
            link: function($scope, $element, $attr, ctrl, $transclude) {
              var block,
                  childScope,
                  previousElements;
              $scope.$watch($attr.ngIf, function ngIfWatchAction(value) {
                if (value) {
                  if (!childScope) {
                    $transclude(function(clone, newScope) {
                      childScope = newScope;
                      clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
                      block = {clone: clone};
                      $animate.enter(clone, $element.parent(), $element);
                    });
                  }
                } else {
                  if (previousElements) {
                    previousElements.remove();
                    previousElements = null;
                  }
                  if (childScope) {
                    childScope.$destroy();
                    childScope = null;
                  }
                  if (block) {
                    previousElements = getBlockNodes(block.clone);
                    $animate.leave(previousElements).then(function() {
                      previousElements = null;
                    });
                    block = null;
                  }
                }
              });
            }
          };
        }];
        var ngIncludeDirective = ['$templateRequest', '$anchorScroll', '$animate', function($templateRequest, $anchorScroll, $animate) {
          return {
            restrict: 'ECA',
            priority: 400,
            terminal: true,
            transclude: 'element',
            controller: angular.noop,
            compile: function(element, attr) {
              var srcExp = attr.ngInclude || attr.src,
                  onloadExp = attr.onload || '',
                  autoScrollExp = attr.autoscroll;
              return function(scope, $element, $attr, ctrl, $transclude) {
                var changeCounter = 0,
                    currentScope,
                    previousElement,
                    currentElement;
                var cleanupLastIncludeContent = function() {
                  if (previousElement) {
                    previousElement.remove();
                    previousElement = null;
                  }
                  if (currentScope) {
                    currentScope.$destroy();
                    currentScope = null;
                  }
                  if (currentElement) {
                    $animate.leave(currentElement).then(function() {
                      previousElement = null;
                    });
                    previousElement = currentElement;
                    currentElement = null;
                  }
                };
                scope.$watch(srcExp, function ngIncludeWatchAction(src) {
                  var afterAnimation = function() {
                    if (isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                      $anchorScroll();
                    }
                  };
                  var thisChangeId = ++changeCounter;
                  if (src) {
                    $templateRequest(src, true).then(function(response) {
                      if (thisChangeId !== changeCounter)
                        return;
                      var newScope = scope.$new();
                      ctrl.template = response;
                      var clone = $transclude(newScope, function(clone) {
                        cleanupLastIncludeContent();
                        $animate.enter(clone, null, $element).then(afterAnimation);
                      });
                      currentScope = newScope;
                      currentElement = clone;
                      currentScope.$emit('$includeContentLoaded', src);
                      scope.$eval(onloadExp);
                    }, function() {
                      if (thisChangeId === changeCounter) {
                        cleanupLastIncludeContent();
                        scope.$emit('$includeContentError', src);
                      }
                    });
                    scope.$emit('$includeContentRequested', src);
                  } else {
                    cleanupLastIncludeContent();
                    ctrl.template = null;
                  }
                });
              };
            }
          };
        }];
        var ngIncludeFillContentDirective = ['$compile', function($compile) {
          return {
            restrict: 'ECA',
            priority: -400,
            require: 'ngInclude',
            link: function(scope, $element, $attr, ctrl) {
              if (/SVG/.test($element[0].toString())) {
                $element.empty();
                $compile(jqLiteBuildFragment(ctrl.template, document).childNodes)(scope, function namespaceAdaptedClone(clone) {
                  $element.append(clone);
                }, {futureParentElement: $element});
                return;
              }
              $element.html(ctrl.template);
              $compile($element.contents())(scope);
            }
          };
        }];
        var ngInitDirective = ngDirective({
          priority: 450,
          compile: function() {
            return {pre: function(scope, element, attrs) {
                scope.$eval(attrs.ngInit);
              }};
          }
        });
        var ngListDirective = function() {
          return {
            restrict: 'A',
            priority: 100,
            require: 'ngModel',
            link: function(scope, element, attr, ctrl) {
              var ngList = element.attr(attr.$attr.ngList) || ', ';
              var trimValues = attr.ngTrim !== 'false';
              var separator = trimValues ? trim(ngList) : ngList;
              var parse = function(viewValue) {
                if (isUndefined(viewValue))
                  return;
                var list = [];
                if (viewValue) {
                  forEach(viewValue.split(separator), function(value) {
                    if (value)
                      list.push(trimValues ? trim(value) : value);
                  });
                }
                return list;
              };
              ctrl.$parsers.push(parse);
              ctrl.$formatters.push(function(value) {
                if (isArray(value)) {
                  return value.join(ngList);
                }
                return undefined;
              });
              ctrl.$isEmpty = function(value) {
                return !value || !value.length;
              };
            }
          };
        };
        var VALID_CLASS = 'ng-valid',
            INVALID_CLASS = 'ng-invalid',
            PRISTINE_CLASS = 'ng-pristine',
            DIRTY_CLASS = 'ng-dirty',
            UNTOUCHED_CLASS = 'ng-untouched',
            TOUCHED_CLASS = 'ng-touched',
            PENDING_CLASS = 'ng-pending';
        var $ngModelMinErr = new minErr('ngModel');
        var NgModelController = ['$scope', '$exceptionHandler', '$attrs', '$element', '$parse', '$animate', '$timeout', '$rootScope', '$q', '$interpolate', function($scope, $exceptionHandler, $attr, $element, $parse, $animate, $timeout, $rootScope, $q, $interpolate) {
          this.$viewValue = Number.NaN;
          this.$modelValue = Number.NaN;
          this.$$rawModelValue = undefined;
          this.$validators = {};
          this.$asyncValidators = {};
          this.$parsers = [];
          this.$formatters = [];
          this.$viewChangeListeners = [];
          this.$untouched = true;
          this.$touched = false;
          this.$pristine = true;
          this.$dirty = false;
          this.$valid = true;
          this.$invalid = false;
          this.$error = {};
          this.$$success = {};
          this.$pending = undefined;
          this.$name = $interpolate($attr.name || '', false)($scope);
          var parsedNgModel = $parse($attr.ngModel),
              parsedNgModelAssign = parsedNgModel.assign,
              ngModelGet = parsedNgModel,
              ngModelSet = parsedNgModelAssign,
              pendingDebounce = null,
              parserValid,
              ctrl = this;
          this.$$setOptions = function(options) {
            ctrl.$options = options;
            if (options && options.getterSetter) {
              var invokeModelGetter = $parse($attr.ngModel + '()'),
                  invokeModelSetter = $parse($attr.ngModel + '($$$p)');
              ngModelGet = function($scope) {
                var modelValue = parsedNgModel($scope);
                if (isFunction(modelValue)) {
                  modelValue = invokeModelGetter($scope);
                }
                return modelValue;
              };
              ngModelSet = function($scope, newValue) {
                if (isFunction(parsedNgModel($scope))) {
                  invokeModelSetter($scope, {$$$p: ctrl.$modelValue});
                } else {
                  parsedNgModelAssign($scope, ctrl.$modelValue);
                }
              };
            } else if (!parsedNgModel.assign) {
              throw $ngModelMinErr('nonassign', "Expression '{0}' is non-assignable. Element: {1}", $attr.ngModel, startingTag($element));
            }
          };
          this.$render = noop;
          this.$isEmpty = function(value) {
            return isUndefined(value) || value === '' || value === null || value !== value;
          };
          var parentForm = $element.inheritedData('$formController') || nullFormCtrl,
              currentValidationRunId = 0;
          addSetValidityMethod({
            ctrl: this,
            $element: $element,
            set: function(object, property) {
              object[property] = true;
            },
            unset: function(object, property) {
              delete object[property];
            },
            parentForm: parentForm,
            $animate: $animate
          });
          this.$setPristine = function() {
            ctrl.$dirty = false;
            ctrl.$pristine = true;
            $animate.removeClass($element, DIRTY_CLASS);
            $animate.addClass($element, PRISTINE_CLASS);
          };
          this.$setDirty = function() {
            ctrl.$dirty = true;
            ctrl.$pristine = false;
            $animate.removeClass($element, PRISTINE_CLASS);
            $animate.addClass($element, DIRTY_CLASS);
            parentForm.$setDirty();
          };
          this.$setUntouched = function() {
            ctrl.$touched = false;
            ctrl.$untouched = true;
            $animate.setClass($element, UNTOUCHED_CLASS, TOUCHED_CLASS);
          };
          this.$setTouched = function() {
            ctrl.$touched = true;
            ctrl.$untouched = false;
            $animate.setClass($element, TOUCHED_CLASS, UNTOUCHED_CLASS);
          };
          this.$rollbackViewValue = function() {
            $timeout.cancel(pendingDebounce);
            ctrl.$viewValue = ctrl.$$lastCommittedViewValue;
            ctrl.$render();
          };
          this.$validate = function() {
            if (isNumber(ctrl.$modelValue) && isNaN(ctrl.$modelValue)) {
              return;
            }
            var viewValue = ctrl.$$lastCommittedViewValue;
            var modelValue = ctrl.$$rawModelValue;
            var prevValid = ctrl.$valid;
            var prevModelValue = ctrl.$modelValue;
            var allowInvalid = ctrl.$options && ctrl.$options.allowInvalid;
            ctrl.$$runValidators(modelValue, viewValue, function(allValid) {
              if (!allowInvalid && prevValid !== allValid) {
                ctrl.$modelValue = allValid ? modelValue : undefined;
                if (ctrl.$modelValue !== prevModelValue) {
                  ctrl.$$writeModelToScope();
                }
              }
            });
          };
          this.$$runValidators = function(modelValue, viewValue, doneCallback) {
            currentValidationRunId++;
            var localValidationRunId = currentValidationRunId;
            if (!processParseErrors()) {
              validationDone(false);
              return;
            }
            if (!processSyncValidators()) {
              validationDone(false);
              return;
            }
            processAsyncValidators();
            function processParseErrors() {
              var errorKey = ctrl.$$parserName || 'parse';
              if (parserValid === undefined) {
                setValidity(errorKey, null);
              } else {
                if (!parserValid) {
                  forEach(ctrl.$validators, function(v, name) {
                    setValidity(name, null);
                  });
                  forEach(ctrl.$asyncValidators, function(v, name) {
                    setValidity(name, null);
                  });
                }
                setValidity(errorKey, parserValid);
                return parserValid;
              }
              return true;
            }
            function processSyncValidators() {
              var syncValidatorsValid = true;
              forEach(ctrl.$validators, function(validator, name) {
                var result = validator(modelValue, viewValue);
                syncValidatorsValid = syncValidatorsValid && result;
                setValidity(name, result);
              });
              if (!syncValidatorsValid) {
                forEach(ctrl.$asyncValidators, function(v, name) {
                  setValidity(name, null);
                });
                return false;
              }
              return true;
            }
            function processAsyncValidators() {
              var validatorPromises = [];
              var allValid = true;
              forEach(ctrl.$asyncValidators, function(validator, name) {
                var promise = validator(modelValue, viewValue);
                if (!isPromiseLike(promise)) {
                  throw $ngModelMinErr("$asyncValidators", "Expected asynchronous validator to return a promise but got '{0}' instead.", promise);
                }
                setValidity(name, undefined);
                validatorPromises.push(promise.then(function() {
                  setValidity(name, true);
                }, function(error) {
                  allValid = false;
                  setValidity(name, false);
                }));
              });
              if (!validatorPromises.length) {
                validationDone(true);
              } else {
                $q.all(validatorPromises).then(function() {
                  validationDone(allValid);
                }, noop);
              }
            }
            function setValidity(name, isValid) {
              if (localValidationRunId === currentValidationRunId) {
                ctrl.$setValidity(name, isValid);
              }
            }
            function validationDone(allValid) {
              if (localValidationRunId === currentValidationRunId) {
                doneCallback(allValid);
              }
            }
          };
          this.$commitViewValue = function() {
            var viewValue = ctrl.$viewValue;
            $timeout.cancel(pendingDebounce);
            if (ctrl.$$lastCommittedViewValue === viewValue && (viewValue !== '' || !ctrl.$$hasNativeValidators)) {
              return;
            }
            ctrl.$$lastCommittedViewValue = viewValue;
            if (ctrl.$pristine) {
              this.$setDirty();
            }
            this.$$parseAndValidate();
          };
          this.$$parseAndValidate = function() {
            var viewValue = ctrl.$$lastCommittedViewValue;
            var modelValue = viewValue;
            parserValid = isUndefined(modelValue) ? undefined : true;
            if (parserValid) {
              for (var i = 0; i < ctrl.$parsers.length; i++) {
                modelValue = ctrl.$parsers[i](modelValue);
                if (isUndefined(modelValue)) {
                  parserValid = false;
                  break;
                }
              }
            }
            if (isNumber(ctrl.$modelValue) && isNaN(ctrl.$modelValue)) {
              ctrl.$modelValue = ngModelGet($scope);
            }
            var prevModelValue = ctrl.$modelValue;
            var allowInvalid = ctrl.$options && ctrl.$options.allowInvalid;
            ctrl.$$rawModelValue = modelValue;
            if (allowInvalid) {
              ctrl.$modelValue = modelValue;
              writeToModelIfNeeded();
            }
            ctrl.$$runValidators(modelValue, ctrl.$$lastCommittedViewValue, function(allValid) {
              if (!allowInvalid) {
                ctrl.$modelValue = allValid ? modelValue : undefined;
                writeToModelIfNeeded();
              }
            });
            function writeToModelIfNeeded() {
              if (ctrl.$modelValue !== prevModelValue) {
                ctrl.$$writeModelToScope();
              }
            }
          };
          this.$$writeModelToScope = function() {
            ngModelSet($scope, ctrl.$modelValue);
            forEach(ctrl.$viewChangeListeners, function(listener) {
              try {
                listener();
              } catch (e) {
                $exceptionHandler(e);
              }
            });
          };
          this.$setViewValue = function(value, trigger) {
            ctrl.$viewValue = value;
            if (!ctrl.$options || ctrl.$options.updateOnDefault) {
              ctrl.$$debounceViewValueCommit(trigger);
            }
          };
          this.$$debounceViewValueCommit = function(trigger) {
            var debounceDelay = 0,
                options = ctrl.$options,
                debounce;
            if (options && isDefined(options.debounce)) {
              debounce = options.debounce;
              if (isNumber(debounce)) {
                debounceDelay = debounce;
              } else if (isNumber(debounce[trigger])) {
                debounceDelay = debounce[trigger];
              } else if (isNumber(debounce['default'])) {
                debounceDelay = debounce['default'];
              }
            }
            $timeout.cancel(pendingDebounce);
            if (debounceDelay) {
              pendingDebounce = $timeout(function() {
                ctrl.$commitViewValue();
              }, debounceDelay);
            } else if ($rootScope.$$phase) {
              ctrl.$commitViewValue();
            } else {
              $scope.$apply(function() {
                ctrl.$commitViewValue();
              });
            }
          };
          $scope.$watch(function ngModelWatch() {
            var modelValue = ngModelGet($scope);
            if (modelValue !== ctrl.$modelValue && (ctrl.$modelValue === ctrl.$modelValue || modelValue === modelValue)) {
              ctrl.$modelValue = ctrl.$$rawModelValue = modelValue;
              parserValid = undefined;
              var formatters = ctrl.$formatters,
                  idx = formatters.length;
              var viewValue = modelValue;
              while (idx--) {
                viewValue = formatters[idx](viewValue);
              }
              if (ctrl.$viewValue !== viewValue) {
                ctrl.$viewValue = ctrl.$$lastCommittedViewValue = viewValue;
                ctrl.$render();
                ctrl.$$runValidators(modelValue, viewValue, noop);
              }
            }
            return modelValue;
          });
        }];
        var ngModelDirective = ['$rootScope', function($rootScope) {
          return {
            restrict: 'A',
            require: ['ngModel', '^?form', '^?ngModelOptions'],
            controller: NgModelController,
            priority: 1,
            compile: function ngModelCompile(element) {
              element.addClass(PRISTINE_CLASS).addClass(UNTOUCHED_CLASS).addClass(VALID_CLASS);
              return {
                pre: function ngModelPreLink(scope, element, attr, ctrls) {
                  var modelCtrl = ctrls[0],
                      formCtrl = ctrls[1] || nullFormCtrl;
                  modelCtrl.$$setOptions(ctrls[2] && ctrls[2].$options);
                  formCtrl.$addControl(modelCtrl);
                  attr.$observe('name', function(newValue) {
                    if (modelCtrl.$name !== newValue) {
                      formCtrl.$$renameControl(modelCtrl, newValue);
                    }
                  });
                  scope.$on('$destroy', function() {
                    formCtrl.$removeControl(modelCtrl);
                  });
                },
                post: function ngModelPostLink(scope, element, attr, ctrls) {
                  var modelCtrl = ctrls[0];
                  if (modelCtrl.$options && modelCtrl.$options.updateOn) {
                    element.on(modelCtrl.$options.updateOn, function(ev) {
                      modelCtrl.$$debounceViewValueCommit(ev && ev.type);
                    });
                  }
                  element.on('blur', function(ev) {
                    if (modelCtrl.$touched)
                      return;
                    if ($rootScope.$$phase) {
                      scope.$evalAsync(modelCtrl.$setTouched);
                    } else {
                      scope.$apply(modelCtrl.$setTouched);
                    }
                  });
                }
              };
            }
          };
        }];
        var DEFAULT_REGEXP = /(\s+|^)default(\s+|$)/;
        var ngModelOptionsDirective = function() {
          return {
            restrict: 'A',
            controller: ['$scope', '$attrs', function($scope, $attrs) {
              var that = this;
              this.$options = copy($scope.$eval($attrs.ngModelOptions));
              if (this.$options.updateOn !== undefined) {
                this.$options.updateOnDefault = false;
                this.$options.updateOn = trim(this.$options.updateOn.replace(DEFAULT_REGEXP, function() {
                  that.$options.updateOnDefault = true;
                  return ' ';
                }));
              } else {
                this.$options.updateOnDefault = true;
              }
            }]
          };
        };
        function addSetValidityMethod(context) {
          var ctrl = context.ctrl,
              $element = context.$element,
              classCache = {},
              set = context.set,
              unset = context.unset,
              parentForm = context.parentForm,
              $animate = context.$animate;
          classCache[INVALID_CLASS] = !(classCache[VALID_CLASS] = $element.hasClass(VALID_CLASS));
          ctrl.$setValidity = setValidity;
          function setValidity(validationErrorKey, state, controller) {
            if (state === undefined) {
              createAndSet('$pending', validationErrorKey, controller);
            } else {
              unsetAndCleanup('$pending', validationErrorKey, controller);
            }
            if (!isBoolean(state)) {
              unset(ctrl.$error, validationErrorKey, controller);
              unset(ctrl.$$success, validationErrorKey, controller);
            } else {
              if (state) {
                unset(ctrl.$error, validationErrorKey, controller);
                set(ctrl.$$success, validationErrorKey, controller);
              } else {
                set(ctrl.$error, validationErrorKey, controller);
                unset(ctrl.$$success, validationErrorKey, controller);
              }
            }
            if (ctrl.$pending) {
              cachedToggleClass(PENDING_CLASS, true);
              ctrl.$valid = ctrl.$invalid = undefined;
              toggleValidationCss('', null);
            } else {
              cachedToggleClass(PENDING_CLASS, false);
              ctrl.$valid = isObjectEmpty(ctrl.$error);
              ctrl.$invalid = !ctrl.$valid;
              toggleValidationCss('', ctrl.$valid);
            }
            var combinedState;
            if (ctrl.$pending && ctrl.$pending[validationErrorKey]) {
              combinedState = undefined;
            } else if (ctrl.$error[validationErrorKey]) {
              combinedState = false;
            } else if (ctrl.$$success[validationErrorKey]) {
              combinedState = true;
            } else {
              combinedState = null;
            }
            toggleValidationCss(validationErrorKey, combinedState);
            parentForm.$setValidity(validationErrorKey, combinedState, ctrl);
          }
          function createAndSet(name, value, controller) {
            if (!ctrl[name]) {
              ctrl[name] = {};
            }
            set(ctrl[name], value, controller);
          }
          function unsetAndCleanup(name, value, controller) {
            if (ctrl[name]) {
              unset(ctrl[name], value, controller);
            }
            if (isObjectEmpty(ctrl[name])) {
              ctrl[name] = undefined;
            }
          }
          function cachedToggleClass(className, switchValue) {
            if (switchValue && !classCache[className]) {
              $animate.addClass($element, className);
              classCache[className] = true;
            } else if (!switchValue && classCache[className]) {
              $animate.removeClass($element, className);
              classCache[className] = false;
            }
          }
          function toggleValidationCss(validationErrorKey, isValid) {
            validationErrorKey = validationErrorKey ? '-' + snake_case(validationErrorKey, '-') : '';
            cachedToggleClass(VALID_CLASS + validationErrorKey, isValid === true);
            cachedToggleClass(INVALID_CLASS + validationErrorKey, isValid === false);
          }
        }
        function isObjectEmpty(obj) {
          if (obj) {
            for (var prop in obj) {
              if (obj.hasOwnProperty(prop)) {
                return false;
              }
            }
          }
          return true;
        }
        var ngNonBindableDirective = ngDirective({
          terminal: true,
          priority: 1000
        });
        var ngOptionsMinErr = minErr('ngOptions');
        var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?(?:\s+disable\s+when\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
        var ngOptionsDirective = ['$compile', '$parse', function($compile, $parse) {
          function parseOptionsExpression(optionsExp, selectElement, scope) {
            var match = optionsExp.match(NG_OPTIONS_REGEXP);
            if (!(match)) {
              throw ngOptionsMinErr('iexp', "Expected expression in form of " + "'_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" + " but got '{0}'. Element: {1}", optionsExp, startingTag(selectElement));
            }
            var valueName = match[5] || match[7];
            var keyName = match[6];
            var selectAs = / as /.test(match[0]) && match[1];
            var trackBy = match[9];
            var valueFn = $parse(match[2] ? match[1] : valueName);
            var selectAsFn = selectAs && $parse(selectAs);
            var viewValueFn = selectAsFn || valueFn;
            var trackByFn = trackBy && $parse(trackBy);
            var getTrackByValueFn = trackBy ? function(value, locals) {
              return trackByFn(scope, locals);
            } : function getHashOfValue(value) {
              return hashKey(value);
            };
            var getTrackByValue = function(value, key) {
              return getTrackByValueFn(value, getLocals(value, key));
            };
            var displayFn = $parse(match[2] || match[1]);
            var groupByFn = $parse(match[3] || '');
            var disableWhenFn = $parse(match[4] || '');
            var valuesFn = $parse(match[8]);
            var locals = {};
            var getLocals = keyName ? function(value, key) {
              locals[keyName] = key;
              locals[valueName] = value;
              return locals;
            } : function(value) {
              locals[valueName] = value;
              return locals;
            };
            function Option(selectValue, viewValue, label, group, disabled) {
              this.selectValue = selectValue;
              this.viewValue = viewValue;
              this.label = label;
              this.group = group;
              this.disabled = disabled;
            }
            function getOptionValuesKeys(optionValues) {
              var optionValuesKeys;
              if (!keyName && isArrayLike(optionValues)) {
                optionValuesKeys = optionValues;
              } else {
                optionValuesKeys = [];
                for (var itemKey in optionValues) {
                  if (optionValues.hasOwnProperty(itemKey) && itemKey.charAt(0) !== '$') {
                    optionValuesKeys.push(itemKey);
                  }
                }
              }
              return optionValuesKeys;
            }
            return {
              trackBy: trackBy,
              getTrackByValue: getTrackByValue,
              getWatchables: $parse(valuesFn, function(optionValues) {
                var watchedArray = [];
                optionValues = optionValues || [];
                var optionValuesKeys = getOptionValuesKeys(optionValues);
                var optionValuesLength = optionValuesKeys.length;
                for (var index = 0; index < optionValuesLength; index++) {
                  var key = (optionValues === optionValuesKeys) ? index : optionValuesKeys[index];
                  var value = optionValues[key];
                  var locals = getLocals(optionValues[key], key);
                  var selectValue = getTrackByValueFn(optionValues[key], locals);
                  watchedArray.push(selectValue);
                  if (match[2] || match[1]) {
                    var label = displayFn(scope, locals);
                    watchedArray.push(label);
                  }
                  if (match[4]) {
                    var disableWhen = disableWhenFn(scope, locals);
                    watchedArray.push(disableWhen);
                  }
                }
                return watchedArray;
              }),
              getOptions: function() {
                var optionItems = [];
                var selectValueMap = {};
                var optionValues = valuesFn(scope) || [];
                var optionValuesKeys = getOptionValuesKeys(optionValues);
                var optionValuesLength = optionValuesKeys.length;
                for (var index = 0; index < optionValuesLength; index++) {
                  var key = (optionValues === optionValuesKeys) ? index : optionValuesKeys[index];
                  var value = optionValues[key];
                  var locals = getLocals(value, key);
                  var viewValue = viewValueFn(scope, locals);
                  var selectValue = getTrackByValueFn(viewValue, locals);
                  var label = displayFn(scope, locals);
                  var group = groupByFn(scope, locals);
                  var disabled = disableWhenFn(scope, locals);
                  var optionItem = new Option(selectValue, viewValue, label, group, disabled);
                  optionItems.push(optionItem);
                  selectValueMap[selectValue] = optionItem;
                }
                return {
                  items: optionItems,
                  selectValueMap: selectValueMap,
                  getOptionFromViewValue: function(value) {
                    return selectValueMap[getTrackByValue(value)];
                  },
                  getViewValueFromOption: function(option) {
                    return trackBy ? angular.copy(option.viewValue) : option.viewValue;
                  }
                };
              }
            };
          }
          var optionTemplate = document.createElement('option'),
              optGroupTemplate = document.createElement('optgroup');
          return {
            restrict: 'A',
            terminal: true,
            require: ['select', '?ngModel'],
            link: function(scope, selectElement, attr, ctrls) {
              var ngModelCtrl = ctrls[1];
              if (!ngModelCtrl)
                return;
              var selectCtrl = ctrls[0];
              var multiple = attr.multiple;
              var emptyOption;
              for (var i = 0,
                  children = selectElement.children(),
                  ii = children.length; i < ii; i++) {
                if (children[i].value === '') {
                  emptyOption = children.eq(i);
                  break;
                }
              }
              var providedEmptyOption = !!emptyOption;
              var unknownOption = jqLite(optionTemplate.cloneNode(false));
              unknownOption.val('?');
              var options;
              var ngOptions = parseOptionsExpression(attr.ngOptions, selectElement, scope);
              var renderEmptyOption = function() {
                if (!providedEmptyOption) {
                  selectElement.prepend(emptyOption);
                }
                selectElement.val('');
                emptyOption.prop('selected', true);
                emptyOption.attr('selected', true);
              };
              var removeEmptyOption = function() {
                if (!providedEmptyOption) {
                  emptyOption.remove();
                }
              };
              var renderUnknownOption = function() {
                selectElement.prepend(unknownOption);
                selectElement.val('?');
                unknownOption.prop('selected', true);
                unknownOption.attr('selected', true);
              };
              var removeUnknownOption = function() {
                unknownOption.remove();
              };
              if (!multiple) {
                selectCtrl.writeValue = function writeNgOptionsValue(value) {
                  var option = options.getOptionFromViewValue(value);
                  if (option && !option.disabled) {
                    if (selectElement[0].value !== option.selectValue) {
                      removeUnknownOption();
                      removeEmptyOption();
                      selectElement[0].value = option.selectValue;
                      option.element.selected = true;
                      option.element.setAttribute('selected', 'selected');
                    }
                  } else {
                    if (value === null || providedEmptyOption) {
                      removeUnknownOption();
                      renderEmptyOption();
                    } else {
                      removeEmptyOption();
                      renderUnknownOption();
                    }
                  }
                };
                selectCtrl.readValue = function readNgOptionsValue() {
                  var selectedOption = options.selectValueMap[selectElement.val()];
                  if (selectedOption && !selectedOption.disabled) {
                    removeEmptyOption();
                    removeUnknownOption();
                    return options.getViewValueFromOption(selectedOption);
                  }
                  return null;
                };
                if (ngOptions.trackBy) {
                  scope.$watch(function() {
                    return ngOptions.getTrackByValue(ngModelCtrl.$viewValue);
                  }, function() {
                    ngModelCtrl.$render();
                  });
                }
              } else {
                ngModelCtrl.$isEmpty = function(value) {
                  return !value || value.length === 0;
                };
                selectCtrl.writeValue = function writeNgOptionsMultiple(value) {
                  options.items.forEach(function(option) {
                    option.element.selected = false;
                  });
                  if (value) {
                    value.forEach(function(item) {
                      var option = options.getOptionFromViewValue(item);
                      if (option && !option.disabled)
                        option.element.selected = true;
                    });
                  }
                };
                selectCtrl.readValue = function readNgOptionsMultiple() {
                  var selectedValues = selectElement.val() || [],
                      selections = [];
                  forEach(selectedValues, function(value) {
                    var option = options.selectValueMap[value];
                    if (!option.disabled)
                      selections.push(options.getViewValueFromOption(option));
                  });
                  return selections;
                };
                if (ngOptions.trackBy) {
                  scope.$watchCollection(function() {
                    if (isArray(ngModelCtrl.$viewValue)) {
                      return ngModelCtrl.$viewValue.map(function(value) {
                        return ngOptions.getTrackByValue(value);
                      });
                    }
                  }, function() {
                    ngModelCtrl.$render();
                  });
                }
              }
              if (providedEmptyOption) {
                emptyOption.remove();
                $compile(emptyOption)(scope);
                emptyOption.removeClass('ng-scope');
              } else {
                emptyOption = jqLite(optionTemplate.cloneNode(false));
              }
              updateOptions();
              scope.$watchCollection(ngOptions.getWatchables, updateOptions);
              function updateOptionElement(option, element) {
                option.element = element;
                element.disabled = option.disabled;
                if (option.value !== element.value)
                  element.value = option.selectValue;
                if (option.label !== element.label) {
                  element.label = option.label;
                  element.textContent = option.label;
                }
              }
              function addOrReuseElement(parent, current, type, templateElement) {
                var element;
                if (current && lowercase(current.nodeName) === type) {
                  element = current;
                } else {
                  element = templateElement.cloneNode(false);
                  if (!current) {
                    parent.appendChild(element);
                  } else {
                    parent.insertBefore(element, current);
                  }
                }
                return element;
              }
              function removeExcessElements(current) {
                var next;
                while (current) {
                  next = current.nextSibling;
                  jqLiteRemove(current);
                  current = next;
                }
              }
              function skipEmptyAndUnknownOptions(current) {
                var emptyOption_ = emptyOption && emptyOption[0];
                var unknownOption_ = unknownOption && unknownOption[0];
                if (emptyOption_ || unknownOption_) {
                  while (current && (current === emptyOption_ || current === unknownOption_)) {
                    current = current.nextSibling;
                  }
                }
                return current;
              }
              function updateOptions() {
                var previousValue = options && selectCtrl.readValue();
                options = ngOptions.getOptions();
                var groupMap = {};
                var currentElement = selectElement[0].firstChild;
                if (providedEmptyOption) {
                  selectElement.prepend(emptyOption);
                }
                currentElement = skipEmptyAndUnknownOptions(currentElement);
                options.items.forEach(function updateOption(option) {
                  var group;
                  var groupElement;
                  var optionElement;
                  if (option.group) {
                    group = groupMap[option.group];
                    if (!group) {
                      groupElement = addOrReuseElement(selectElement[0], currentElement, 'optgroup', optGroupTemplate);
                      currentElement = groupElement.nextSibling;
                      groupElement.label = option.group;
                      group = groupMap[option.group] = {
                        groupElement: groupElement,
                        currentOptionElement: groupElement.firstChild
                      };
                    }
                    optionElement = addOrReuseElement(group.groupElement, group.currentOptionElement, 'option', optionTemplate);
                    updateOptionElement(option, optionElement);
                    group.currentOptionElement = optionElement.nextSibling;
                  } else {
                    optionElement = addOrReuseElement(selectElement[0], currentElement, 'option', optionTemplate);
                    updateOptionElement(option, optionElement);
                    currentElement = optionElement.nextSibling;
                  }
                });
                Object.keys(groupMap).forEach(function(key) {
                  removeExcessElements(groupMap[key].currentOptionElement);
                });
                removeExcessElements(currentElement);
                ngModelCtrl.$render();
                if (!ngModelCtrl.$isEmpty(previousValue)) {
                  var nextValue = selectCtrl.readValue();
                  if (ngOptions.trackBy ? !equals(previousValue, nextValue) : previousValue !== nextValue) {
                    ngModelCtrl.$setViewValue(nextValue);
                    ngModelCtrl.$render();
                  }
                }
              }
            }
          };
        }];
        var ngPluralizeDirective = ['$locale', '$interpolate', '$log', function($locale, $interpolate, $log) {
          var BRACE = /{}/g,
              IS_WHEN = /^when(Minus)?(.+)$/;
          return {link: function(scope, element, attr) {
              var numberExp = attr.count,
                  whenExp = attr.$attr.when && element.attr(attr.$attr.when),
                  offset = attr.offset || 0,
                  whens = scope.$eval(whenExp) || {},
                  whensExpFns = {},
                  startSymbol = $interpolate.startSymbol(),
                  endSymbol = $interpolate.endSymbol(),
                  braceReplacement = startSymbol + numberExp + '-' + offset + endSymbol,
                  watchRemover = angular.noop,
                  lastCount;
              forEach(attr, function(expression, attributeName) {
                var tmpMatch = IS_WHEN.exec(attributeName);
                if (tmpMatch) {
                  var whenKey = (tmpMatch[1] ? '-' : '') + lowercase(tmpMatch[2]);
                  whens[whenKey] = element.attr(attr.$attr[attributeName]);
                }
              });
              forEach(whens, function(expression, key) {
                whensExpFns[key] = $interpolate(expression.replace(BRACE, braceReplacement));
              });
              scope.$watch(numberExp, function ngPluralizeWatchAction(newVal) {
                var count = parseFloat(newVal);
                var countIsNaN = isNaN(count);
                if (!countIsNaN && !(count in whens)) {
                  count = $locale.pluralCat(count - offset);
                }
                if ((count !== lastCount) && !(countIsNaN && isNumber(lastCount) && isNaN(lastCount))) {
                  watchRemover();
                  var whenExpFn = whensExpFns[count];
                  if (isUndefined(whenExpFn)) {
                    if (newVal != null) {
                      $log.debug("ngPluralize: no rule defined for '" + count + "' in " + whenExp);
                    }
                    watchRemover = noop;
                    updateElementText();
                  } else {
                    watchRemover = scope.$watch(whenExpFn, updateElementText);
                  }
                  lastCount = count;
                }
              });
              function updateElementText(newText) {
                element.text(newText || '');
              }
            }};
        }];
        var ngRepeatDirective = ['$parse', '$animate', function($parse, $animate) {
          var NG_REMOVED = '$$NG_REMOVED';
          var ngRepeatMinErr = minErr('ngRepeat');
          var updateScope = function(scope, index, valueIdentifier, value, keyIdentifier, key, arrayLength) {
            scope[valueIdentifier] = value;
            if (keyIdentifier)
              scope[keyIdentifier] = key;
            scope.$index = index;
            scope.$first = (index === 0);
            scope.$last = (index === (arrayLength - 1));
            scope.$middle = !(scope.$first || scope.$last);
            scope.$odd = !(scope.$even = (index & 1) === 0);
          };
          var getBlockStart = function(block) {
            return block.clone[0];
          };
          var getBlockEnd = function(block) {
            return block.clone[block.clone.length - 1];
          };
          return {
            restrict: 'A',
            multiElement: true,
            transclude: 'element',
            priority: 1000,
            terminal: true,
            $$tlb: true,
            compile: function ngRepeatCompile($element, $attr) {
              var expression = $attr.ngRepeat;
              var ngRepeatEndComment = document.createComment(' end ngRepeat: ' + expression + ' ');
              var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
              if (!match) {
                throw ngRepeatMinErr('iexp', "Expected expression in form of '_item_ in _collection_[ track by _id_]' but got '{0}'.", expression);
              }
              var lhs = match[1];
              var rhs = match[2];
              var aliasAs = match[3];
              var trackByExp = match[4];
              match = lhs.match(/^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/);
              if (!match) {
                throw ngRepeatMinErr('iidexp', "'_item_' in '_item_ in _collection_' should be an identifier or '(_key_, _value_)' expression, but got '{0}'.", lhs);
              }
              var valueIdentifier = match[3] || match[1];
              var keyIdentifier = match[2];
              if (aliasAs && (!/^[$a-zA-Z_][$a-zA-Z0-9_]*$/.test(aliasAs) || /^(null|undefined|this|\$index|\$first|\$middle|\$last|\$even|\$odd|\$parent|\$root|\$id)$/.test(aliasAs))) {
                throw ngRepeatMinErr('badident', "alias '{0}' is invalid --- must be a valid JS identifier which is not a reserved name.", aliasAs);
              }
              var trackByExpGetter,
                  trackByIdExpFn,
                  trackByIdArrayFn,
                  trackByIdObjFn;
              var hashFnLocals = {$id: hashKey};
              if (trackByExp) {
                trackByExpGetter = $parse(trackByExp);
              } else {
                trackByIdArrayFn = function(key, value) {
                  return hashKey(value);
                };
                trackByIdObjFn = function(key) {
                  return key;
                };
              }
              return function ngRepeatLink($scope, $element, $attr, ctrl, $transclude) {
                if (trackByExpGetter) {
                  trackByIdExpFn = function(key, value, index) {
                    if (keyIdentifier)
                      hashFnLocals[keyIdentifier] = key;
                    hashFnLocals[valueIdentifier] = value;
                    hashFnLocals.$index = index;
                    return trackByExpGetter($scope, hashFnLocals);
                  };
                }
                var lastBlockMap = createMap();
                $scope.$watchCollection(rhs, function ngRepeatAction(collection) {
                  var index,
                      length,
                      previousNode = $element[0],
                      nextNode,
                      nextBlockMap = createMap(),
                      collectionLength,
                      key,
                      value,
                      trackById,
                      trackByIdFn,
                      collectionKeys,
                      block,
                      nextBlockOrder,
                      elementsToRemove;
                  if (aliasAs) {
                    $scope[aliasAs] = collection;
                  }
                  if (isArrayLike(collection)) {
                    collectionKeys = collection;
                    trackByIdFn = trackByIdExpFn || trackByIdArrayFn;
                  } else {
                    trackByIdFn = trackByIdExpFn || trackByIdObjFn;
                    collectionKeys = [];
                    for (var itemKey in collection) {
                      if (collection.hasOwnProperty(itemKey) && itemKey.charAt(0) !== '$') {
                        collectionKeys.push(itemKey);
                      }
                    }
                  }
                  collectionLength = collectionKeys.length;
                  nextBlockOrder = new Array(collectionLength);
                  for (index = 0; index < collectionLength; index++) {
                    key = (collection === collectionKeys) ? index : collectionKeys[index];
                    value = collection[key];
                    trackById = trackByIdFn(key, value, index);
                    if (lastBlockMap[trackById]) {
                      block = lastBlockMap[trackById];
                      delete lastBlockMap[trackById];
                      nextBlockMap[trackById] = block;
                      nextBlockOrder[index] = block;
                    } else if (nextBlockMap[trackById]) {
                      forEach(nextBlockOrder, function(block) {
                        if (block && block.scope)
                          lastBlockMap[block.id] = block;
                      });
                      throw ngRepeatMinErr('dupes', "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys. Repeater: {0}, Duplicate key: {1}, Duplicate value: {2}", expression, trackById, value);
                    } else {
                      nextBlockOrder[index] = {
                        id: trackById,
                        scope: undefined,
                        clone: undefined
                      };
                      nextBlockMap[trackById] = true;
                    }
                  }
                  for (var blockKey in lastBlockMap) {
                    block = lastBlockMap[blockKey];
                    elementsToRemove = getBlockNodes(block.clone);
                    $animate.leave(elementsToRemove);
                    if (elementsToRemove[0].parentNode) {
                      for (index = 0, length = elementsToRemove.length; index < length; index++) {
                        elementsToRemove[index][NG_REMOVED] = true;
                      }
                    }
                    block.scope.$destroy();
                  }
                  for (index = 0; index < collectionLength; index++) {
                    key = (collection === collectionKeys) ? index : collectionKeys[index];
                    value = collection[key];
                    block = nextBlockOrder[index];
                    if (block.scope) {
                      nextNode = previousNode;
                      do {
                        nextNode = nextNode.nextSibling;
                      } while (nextNode && nextNode[NG_REMOVED]);
                      if (getBlockStart(block) != nextNode) {
                        $animate.move(getBlockNodes(block.clone), null, jqLite(previousNode));
                      }
                      previousNode = getBlockEnd(block);
                      updateScope(block.scope, index, valueIdentifier, value, keyIdentifier, key, collectionLength);
                    } else {
                      $transclude(function ngRepeatTransclude(clone, scope) {
                        block.scope = scope;
                        var endNode = ngRepeatEndComment.cloneNode(false);
                        clone[clone.length++] = endNode;
                        $animate.enter(clone, null, jqLite(previousNode));
                        previousNode = endNode;
                        block.clone = clone;
                        nextBlockMap[block.id] = block;
                        updateScope(block.scope, index, valueIdentifier, value, keyIdentifier, key, collectionLength);
                      });
                    }
                  }
                  lastBlockMap = nextBlockMap;
                });
              };
            }
          };
        }];
        var NG_HIDE_CLASS = 'ng-hide';
        var NG_HIDE_IN_PROGRESS_CLASS = 'ng-hide-animate';
        var ngShowDirective = ['$animate', function($animate) {
          return {
            restrict: 'A',
            multiElement: true,
            link: function(scope, element, attr) {
              scope.$watch(attr.ngShow, function ngShowWatchAction(value) {
                $animate[value ? 'removeClass' : 'addClass'](element, NG_HIDE_CLASS, {tempClasses: NG_HIDE_IN_PROGRESS_CLASS});
              });
            }
          };
        }];
        var ngHideDirective = ['$animate', function($animate) {
          return {
            restrict: 'A',
            multiElement: true,
            link: function(scope, element, attr) {
              scope.$watch(attr.ngHide, function ngHideWatchAction(value) {
                $animate[value ? 'addClass' : 'removeClass'](element, NG_HIDE_CLASS, {tempClasses: NG_HIDE_IN_PROGRESS_CLASS});
              });
            }
          };
        }];
        var ngStyleDirective = ngDirective(function(scope, element, attr) {
          scope.$watch(attr.ngStyle, function ngStyleWatchAction(newStyles, oldStyles) {
            if (oldStyles && (newStyles !== oldStyles)) {
              forEach(oldStyles, function(val, style) {
                element.css(style, '');
              });
            }
            if (newStyles)
              element.css(newStyles);
          }, true);
        });
        var ngSwitchDirective = ['$animate', function($animate) {
          return {
            require: 'ngSwitch',
            controller: ['$scope', function ngSwitchController() {
              this.cases = {};
            }],
            link: function(scope, element, attr, ngSwitchController) {
              var watchExpr = attr.ngSwitch || attr.on,
                  selectedTranscludes = [],
                  selectedElements = [],
                  previousLeaveAnimations = [],
                  selectedScopes = [];
              var spliceFactory = function(array, index) {
                return function() {
                  array.splice(index, 1);
                };
              };
              scope.$watch(watchExpr, function ngSwitchWatchAction(value) {
                var i,
                    ii;
                for (i = 0, ii = previousLeaveAnimations.length; i < ii; ++i) {
                  $animate.cancel(previousLeaveAnimations[i]);
                }
                previousLeaveAnimations.length = 0;
                for (i = 0, ii = selectedScopes.length; i < ii; ++i) {
                  var selected = getBlockNodes(selectedElements[i].clone);
                  selectedScopes[i].$destroy();
                  var promise = previousLeaveAnimations[i] = $animate.leave(selected);
                  promise.then(spliceFactory(previousLeaveAnimations, i));
                }
                selectedElements.length = 0;
                selectedScopes.length = 0;
                if ((selectedTranscludes = ngSwitchController.cases['!' + value] || ngSwitchController.cases['?'])) {
                  forEach(selectedTranscludes, function(selectedTransclude) {
                    selectedTransclude.transclude(function(caseElement, selectedScope) {
                      selectedScopes.push(selectedScope);
                      var anchor = selectedTransclude.element;
                      caseElement[caseElement.length++] = document.createComment(' end ngSwitchWhen: ');
                      var block = {clone: caseElement};
                      selectedElements.push(block);
                      $animate.enter(caseElement, anchor.parent(), anchor);
                    });
                  });
                }
              });
            }
          };
        }];
        var ngSwitchWhenDirective = ngDirective({
          transclude: 'element',
          priority: 1200,
          require: '^ngSwitch',
          multiElement: true,
          link: function(scope, element, attrs, ctrl, $transclude) {
            ctrl.cases['!' + attrs.ngSwitchWhen] = (ctrl.cases['!' + attrs.ngSwitchWhen] || []);
            ctrl.cases['!' + attrs.ngSwitchWhen].push({
              transclude: $transclude,
              element: element
            });
          }
        });
        var ngSwitchDefaultDirective = ngDirective({
          transclude: 'element',
          priority: 1200,
          require: '^ngSwitch',
          multiElement: true,
          link: function(scope, element, attr, ctrl, $transclude) {
            ctrl.cases['?'] = (ctrl.cases['?'] || []);
            ctrl.cases['?'].push({
              transclude: $transclude,
              element: element
            });
          }
        });
        var ngTranscludeDirective = ngDirective({
          restrict: 'EAC',
          link: function($scope, $element, $attrs, controller, $transclude) {
            if (!$transclude) {
              throw minErr('ngTransclude')('orphan', 'Illegal use of ngTransclude directive in the template! ' + 'No parent directive that requires a transclusion found. ' + 'Element: {0}', startingTag($element));
            }
            $transclude(function(clone) {
              $element.empty();
              $element.append(clone);
            });
          }
        });
        var scriptDirective = ['$templateCache', function($templateCache) {
          return {
            restrict: 'E',
            terminal: true,
            compile: function(element, attr) {
              if (attr.type == 'text/ng-template') {
                var templateUrl = attr.id,
                    text = element[0].text;
                $templateCache.put(templateUrl, text);
              }
            }
          };
        }];
        var noopNgModelController = {
          $setViewValue: noop,
          $render: noop
        };
        var SelectController = ['$element', '$scope', '$attrs', function($element, $scope, $attrs) {
          var self = this,
              optionsMap = new HashMap();
          self.ngModelCtrl = noopNgModelController;
          self.unknownOption = jqLite(document.createElement('option'));
          self.renderUnknownOption = function(val) {
            var unknownVal = '? ' + hashKey(val) + ' ?';
            self.unknownOption.val(unknownVal);
            $element.prepend(self.unknownOption);
            $element.val(unknownVal);
          };
          $scope.$on('$destroy', function() {
            self.renderUnknownOption = noop;
          });
          self.removeUnknownOption = function() {
            if (self.unknownOption.parent())
              self.unknownOption.remove();
          };
          self.readValue = function readSingleValue() {
            self.removeUnknownOption();
            return $element.val();
          };
          self.writeValue = function writeSingleValue(value) {
            if (self.hasOption(value)) {
              self.removeUnknownOption();
              $element.val(value);
              if (value === '')
                self.emptyOption.prop('selected', true);
            } else {
              if (value == null && self.emptyOption) {
                self.removeUnknownOption();
                $element.val('');
              } else {
                self.renderUnknownOption(value);
              }
            }
          };
          self.addOption = function(value, element) {
            assertNotHasOwnProperty(value, '"option value"');
            if (value === '') {
              self.emptyOption = element;
            }
            var count = optionsMap.get(value) || 0;
            optionsMap.put(value, count + 1);
          };
          self.removeOption = function(value) {
            var count = optionsMap.get(value);
            if (count) {
              if (count === 1) {
                optionsMap.remove(value);
                if (value === '') {
                  self.emptyOption = undefined;
                }
              } else {
                optionsMap.put(value, count - 1);
              }
            }
          };
          self.hasOption = function(value) {
            return !!optionsMap.get(value);
          };
        }];
        var selectDirective = function() {
          return {
            restrict: 'E',
            require: ['select', '?ngModel'],
            controller: SelectController,
            link: function(scope, element, attr, ctrls) {
              var ngModelCtrl = ctrls[1];
              if (!ngModelCtrl)
                return;
              var selectCtrl = ctrls[0];
              selectCtrl.ngModelCtrl = ngModelCtrl;
              ngModelCtrl.$render = function() {
                selectCtrl.writeValue(ngModelCtrl.$viewValue);
              };
              element.on('change', function() {
                scope.$apply(function() {
                  ngModelCtrl.$setViewValue(selectCtrl.readValue());
                });
              });
              if (attr.multiple) {
                selectCtrl.readValue = function readMultipleValue() {
                  var array = [];
                  forEach(element.find('option'), function(option) {
                    if (option.selected) {
                      array.push(option.value);
                    }
                  });
                  return array;
                };
                selectCtrl.writeValue = function writeMultipleValue(value) {
                  var items = new HashMap(value);
                  forEach(element.find('option'), function(option) {
                    option.selected = isDefined(items.get(option.value));
                  });
                };
                var lastView,
                    lastViewRef = NaN;
                scope.$watch(function selectMultipleWatch() {
                  if (lastViewRef === ngModelCtrl.$viewValue && !equals(lastView, ngModelCtrl.$viewValue)) {
                    lastView = shallowCopy(ngModelCtrl.$viewValue);
                    ngModelCtrl.$render();
                  }
                  lastViewRef = ngModelCtrl.$viewValue;
                });
                ngModelCtrl.$isEmpty = function(value) {
                  return !value || value.length === 0;
                };
              }
            }
          };
        };
        var optionDirective = ['$interpolate', function($interpolate) {
          function chromeHack(optionElement) {
            if (optionElement[0].hasAttribute('selected')) {
              optionElement[0].selected = true;
            }
          }
          return {
            restrict: 'E',
            priority: 100,
            compile: function(element, attr) {
              if (isUndefined(attr.value)) {
                var interpolateFn = $interpolate(element.text(), true);
                if (!interpolateFn) {
                  attr.$set('value', element.text());
                }
              }
              return function(scope, element, attr) {
                var selectCtrlName = '$selectController',
                    parent = element.parent(),
                    selectCtrl = parent.data(selectCtrlName) || parent.parent().data(selectCtrlName);
                if (selectCtrl && selectCtrl.ngModelCtrl) {
                  if (interpolateFn) {
                    scope.$watch(interpolateFn, function interpolateWatchAction(newVal, oldVal) {
                      attr.$set('value', newVal);
                      if (oldVal !== newVal) {
                        selectCtrl.removeOption(oldVal);
                      }
                      selectCtrl.addOption(newVal, element);
                      selectCtrl.ngModelCtrl.$render();
                      chromeHack(element);
                    });
                  } else {
                    selectCtrl.addOption(attr.value, element);
                    selectCtrl.ngModelCtrl.$render();
                    chromeHack(element);
                  }
                  element.on('$destroy', function() {
                    selectCtrl.removeOption(attr.value);
                    selectCtrl.ngModelCtrl.$render();
                  });
                }
              };
            }
          };
        }];
        var styleDirective = valueFn({
          restrict: 'E',
          terminal: false
        });
        var requiredDirective = function() {
          return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, elm, attr, ctrl) {
              if (!ctrl)
                return;
              attr.required = true;
              ctrl.$validators.required = function(modelValue, viewValue) {
                return !attr.required || !ctrl.$isEmpty(viewValue);
              };
              attr.$observe('required', function() {
                ctrl.$validate();
              });
            }
          };
        };
        var patternDirective = function() {
          return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, elm, attr, ctrl) {
              if (!ctrl)
                return;
              var regexp,
                  patternExp = attr.ngPattern || attr.pattern;
              attr.$observe('pattern', function(regex) {
                if (isString(regex) && regex.length > 0) {
                  regex = new RegExp('^' + regex + '$');
                }
                if (regex && !regex.test) {
                  throw minErr('ngPattern')('noregexp', 'Expected {0} to be a RegExp but was {1}. Element: {2}', patternExp, regex, startingTag(elm));
                }
                regexp = regex || undefined;
                ctrl.$validate();
              });
              ctrl.$validators.pattern = function(value) {
                return ctrl.$isEmpty(value) || isUndefined(regexp) || regexp.test(value);
              };
            }
          };
        };
        var maxlengthDirective = function() {
          return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, elm, attr, ctrl) {
              if (!ctrl)
                return;
              var maxlength = -1;
              attr.$observe('maxlength', function(value) {
                var intVal = toInt(value);
                maxlength = isNaN(intVal) ? -1 : intVal;
                ctrl.$validate();
              });
              ctrl.$validators.maxlength = function(modelValue, viewValue) {
                return (maxlength < 0) || ctrl.$isEmpty(viewValue) || (viewValue.length <= maxlength);
              };
            }
          };
        };
        var minlengthDirective = function() {
          return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, elm, attr, ctrl) {
              if (!ctrl)
                return;
              var minlength = 0;
              attr.$observe('minlength', function(value) {
                minlength = toInt(value) || 0;
                ctrl.$validate();
              });
              ctrl.$validators.minlength = function(modelValue, viewValue) {
                return ctrl.$isEmpty(viewValue) || viewValue.length >= minlength;
              };
            }
          };
        };
        if (window.angular.bootstrap) {
          console.log('WARNING: Tried to load angular more than once.');
          return;
        }
        bindJQuery();
        publishExternalAPI(angular);
        jqLite(document).ready(function() {
          angularInit(document, bootstrap);
        });
      })(window, document);
      !window.angular.$$csp() && window.angular.element(document.head).prepend('<style type="text/css">@charset "UTF-8";[ng\\:cloak],[ng-cloak],[data-ng-cloak],[x-ng-cloak],.ng-cloak,.x-ng-cloak,.ng-hide:not(.ng-hide-animate){display:none !important;}ng\\:form{display:block;}.ng-animate-shim{visibility:hidden;}.ng-anchor{position:absolute;}</style>');
    }, {}],
    3: [function(require, module, exports) {
      require('./angular');
      module.exports = angular;
    }, {"./angular": 2}],
    4: [function(require, module, exports) {
      (function(factory) {
        if (typeof exports !== 'undefined') {
          factory(exports);
        } else {
          window.hljs = factory({});
          if (typeof define === 'function' && define.amd) {
            define('hljs', [], function() {
              return window.hljs;
            });
          }
        }
      }(function(hljs) {
        function escape(value) {
          return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
        }
        function tag(node) {
          return node.nodeName.toLowerCase();
        }
        function testRe(re, lexeme) {
          var match = re && re.exec(lexeme);
          return match && match.index == 0;
        }
        function isNotHighlighted(language) {
          return /no-?highlight|plain|text/.test(language);
        }
        function blockLanguage(block) {
          var i,
              match,
              length,
              classes = block.className + ' ';
          classes += block.parentNode ? block.parentNode.className : '';
          match = /\blang(?:uage)?-([\w-]+)\b/.exec(classes);
          if (match) {
            return getLanguage(match[1]) ? match[1] : 'no-highlight';
          }
          classes = classes.split(/\s+/);
          for (i = 0, length = classes.length; i < length; i++) {
            if (getLanguage(classes[i]) || isNotHighlighted(classes[i])) {
              return classes[i];
            }
          }
        }
        function inherit(parent, obj) {
          var result = {},
              key;
          for (key in parent)
            result[key] = parent[key];
          if (obj)
            for (key in obj)
              result[key] = obj[key];
          return result;
        }
        function nodeStream(node) {
          var result = [];
          (function _nodeStream(node, offset) {
            for (var child = node.firstChild; child; child = child.nextSibling) {
              if (child.nodeType == 3)
                offset += child.nodeValue.length;
              else if (child.nodeType == 1) {
                result.push({
                  event: 'start',
                  offset: offset,
                  node: child
                });
                offset = _nodeStream(child, offset);
                if (!tag(child).match(/br|hr|img|input/)) {
                  result.push({
                    event: 'stop',
                    offset: offset,
                    node: child
                  });
                }
              }
            }
            return offset;
          })(node, 0);
          return result;
        }
        function mergeStreams(original, highlighted, value) {
          var processed = 0;
          var result = '';
          var nodeStack = [];
          function selectStream() {
            if (!original.length || !highlighted.length) {
              return original.length ? original : highlighted;
            }
            if (original[0].offset != highlighted[0].offset) {
              return (original[0].offset < highlighted[0].offset) ? original : highlighted;
            }
            return highlighted[0].event == 'start' ? original : highlighted;
          }
          function open(node) {
            function attr_str(a) {
              return ' ' + a.nodeName + '="' + escape(a.value) + '"';
            }
            result += '<' + tag(node) + Array.prototype.map.call(node.attributes, attr_str).join('') + '>';
          }
          function close(node) {
            result += '</' + tag(node) + '>';
          }
          function render(event) {
            (event.event == 'start' ? open : close)(event.node);
          }
          while (original.length || highlighted.length) {
            var stream = selectStream();
            result += escape(value.substr(processed, stream[0].offset - processed));
            processed = stream[0].offset;
            if (stream == original) {
              nodeStack.reverse().forEach(close);
              do {
                render(stream.splice(0, 1)[0]);
                stream = selectStream();
              } while (stream == original && stream.length && stream[0].offset == processed);
              nodeStack.reverse().forEach(open);
            } else {
              if (stream[0].event == 'start') {
                nodeStack.push(stream[0].node);
              } else {
                nodeStack.pop();
              }
              render(stream.splice(0, 1)[0]);
            }
          }
          return result + escape(value.substr(processed));
        }
        function compileLanguage(language) {
          function reStr(re) {
            return (re && re.source) || re;
          }
          function langRe(value, global) {
            return new RegExp(reStr(value), 'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : ''));
          }
          function compileMode(mode, parent) {
            if (mode.compiled)
              return;
            mode.compiled = true;
            mode.keywords = mode.keywords || mode.beginKeywords;
            if (mode.keywords) {
              var compiled_keywords = {};
              var flatten = function(className, str) {
                if (language.case_insensitive) {
                  str = str.toLowerCase();
                }
                str.split(' ').forEach(function(kw) {
                  var pair = kw.split('|');
                  compiled_keywords[pair[0]] = [className, pair[1] ? Number(pair[1]) : 1];
                });
              };
              if (typeof mode.keywords == 'string') {
                flatten('keyword', mode.keywords);
              } else {
                Object.keys(mode.keywords).forEach(function(className) {
                  flatten(className, mode.keywords[className]);
                });
              }
              mode.keywords = compiled_keywords;
            }
            mode.lexemesRe = langRe(mode.lexemes || /\b\w+\b/, true);
            if (parent) {
              if (mode.beginKeywords) {
                mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')\\b';
              }
              if (!mode.begin)
                mode.begin = /\B|\b/;
              mode.beginRe = langRe(mode.begin);
              if (!mode.end && !mode.endsWithParent)
                mode.end = /\B|\b/;
              if (mode.end)
                mode.endRe = langRe(mode.end);
              mode.terminator_end = reStr(mode.end) || '';
              if (mode.endsWithParent && parent.terminator_end)
                mode.terminator_end += (mode.end ? '|' : '') + parent.terminator_end;
            }
            if (mode.illegal)
              mode.illegalRe = langRe(mode.illegal);
            if (mode.relevance === undefined)
              mode.relevance = 1;
            if (!mode.contains) {
              mode.contains = [];
            }
            var expanded_contains = [];
            mode.contains.forEach(function(c) {
              if (c.variants) {
                c.variants.forEach(function(v) {
                  expanded_contains.push(inherit(c, v));
                });
              } else {
                expanded_contains.push(c == 'self' ? mode : c);
              }
            });
            mode.contains = expanded_contains;
            mode.contains.forEach(function(c) {
              compileMode(c, mode);
            });
            if (mode.starts) {
              compileMode(mode.starts, parent);
            }
            var terminators = mode.contains.map(function(c) {
              return c.beginKeywords ? '\\.?(' + c.begin + ')\\.?' : c.begin;
            }).concat([mode.terminator_end, mode.illegal]).map(reStr).filter(Boolean);
            mode.terminators = terminators.length ? langRe(terminators.join('|'), true) : {exec: function() {
                return null;
              }};
          }
          compileMode(language);
        }
        function highlight(name, value, ignore_illegals, continuation) {
          function subMode(lexeme, mode) {
            for (var i = 0; i < mode.contains.length; i++) {
              if (testRe(mode.contains[i].beginRe, lexeme)) {
                return mode.contains[i];
              }
            }
          }
          function endOfMode(mode, lexeme) {
            if (testRe(mode.endRe, lexeme)) {
              while (mode.endsParent && mode.parent) {
                mode = mode.parent;
              }
              return mode;
            }
            if (mode.endsWithParent) {
              return endOfMode(mode.parent, lexeme);
            }
          }
          function isIllegal(lexeme, mode) {
            return !ignore_illegals && testRe(mode.illegalRe, lexeme);
          }
          function keywordMatch(mode, match) {
            var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
            return mode.keywords.hasOwnProperty(match_str) && mode.keywords[match_str];
          }
          function buildSpan(classname, insideSpan, leaveOpen, noPrefix) {
            var classPrefix = noPrefix ? '' : options.classPrefix,
                openSpan = '<span class="' + classPrefix,
                closeSpan = leaveOpen ? '' : '</span>';
            openSpan += classname + '">';
            return openSpan + insideSpan + closeSpan;
          }
          function processKeywords() {
            if (!top.keywords)
              return escape(mode_buffer);
            var result = '';
            var last_index = 0;
            top.lexemesRe.lastIndex = 0;
            var match = top.lexemesRe.exec(mode_buffer);
            while (match) {
              result += escape(mode_buffer.substr(last_index, match.index - last_index));
              var keyword_match = keywordMatch(top, match);
              if (keyword_match) {
                relevance += keyword_match[1];
                result += buildSpan(keyword_match[0], escape(match[0]));
              } else {
                result += escape(match[0]);
              }
              last_index = top.lexemesRe.lastIndex;
              match = top.lexemesRe.exec(mode_buffer);
            }
            return result + escape(mode_buffer.substr(last_index));
          }
          function processSubLanguage() {
            if (top.subLanguage && !languages[top.subLanguage]) {
              return escape(mode_buffer);
            }
            var result = top.subLanguage ? highlight(top.subLanguage, mode_buffer, true, continuations[top.subLanguage]) : highlightAuto(mode_buffer);
            if (top.relevance > 0) {
              relevance += result.relevance;
            }
            if (top.subLanguageMode == 'continuous') {
              continuations[top.subLanguage] = result.top;
            }
            return buildSpan(result.language, result.value, false, true);
          }
          function processBuffer() {
            return top.subLanguage !== undefined ? processSubLanguage() : processKeywords();
          }
          function startNewMode(mode, lexeme) {
            var markup = mode.className ? buildSpan(mode.className, '', true) : '';
            if (mode.returnBegin) {
              result += markup;
              mode_buffer = '';
            } else if (mode.excludeBegin) {
              result += escape(lexeme) + markup;
              mode_buffer = '';
            } else {
              result += markup;
              mode_buffer = lexeme;
            }
            top = Object.create(mode, {parent: {value: top}});
          }
          function processLexeme(buffer, lexeme) {
            mode_buffer += buffer;
            if (lexeme === undefined) {
              result += processBuffer();
              return 0;
            }
            var new_mode = subMode(lexeme, top);
            if (new_mode) {
              result += processBuffer();
              startNewMode(new_mode, lexeme);
              return new_mode.returnBegin ? 0 : lexeme.length;
            }
            var end_mode = endOfMode(top, lexeme);
            if (end_mode) {
              var origin = top;
              if (!(origin.returnEnd || origin.excludeEnd)) {
                mode_buffer += lexeme;
              }
              result += processBuffer();
              do {
                if (top.className) {
                  result += '</span>';
                }
                relevance += top.relevance;
                top = top.parent;
              } while (top != end_mode.parent);
              if (origin.excludeEnd) {
                result += escape(lexeme);
              }
              mode_buffer = '';
              if (end_mode.starts) {
                startNewMode(end_mode.starts, '');
              }
              return origin.returnEnd ? 0 : lexeme.length;
            }
            if (isIllegal(lexeme, top))
              throw new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.className || '<unnamed>') + '"');
            mode_buffer += lexeme;
            return lexeme.length || 1;
          }
          var language = getLanguage(name);
          if (!language) {
            throw new Error('Unknown language: "' + name + '"');
          }
          compileLanguage(language);
          var top = continuation || language;
          var continuations = {};
          var result = '',
              current;
          for (current = top; current != language; current = current.parent) {
            if (current.className) {
              result = buildSpan(current.className, '', true) + result;
            }
          }
          var mode_buffer = '';
          var relevance = 0;
          try {
            var match,
                count,
                index = 0;
            while (true) {
              top.terminators.lastIndex = index;
              match = top.terminators.exec(value);
              if (!match)
                break;
              count = processLexeme(value.substr(index, match.index - index), match[0]);
              index = match.index + count;
            }
            processLexeme(value.substr(index));
            for (current = top; current.parent; current = current.parent) {
              if (current.className) {
                result += '</span>';
              }
            }
            return {
              relevance: relevance,
              value: result,
              language: name,
              top: top
            };
          } catch (e) {
            if (e.message.indexOf('Illegal') != -1) {
              return {
                relevance: 0,
                value: escape(value)
              };
            } else {
              throw e;
            }
          }
        }
        function highlightAuto(text, languageSubset) {
          languageSubset = languageSubset || options.languages || Object.keys(languages);
          var result = {
            relevance: 0,
            value: escape(text)
          };
          var second_best = result;
          languageSubset.forEach(function(name) {
            if (!getLanguage(name)) {
              return;
            }
            var current = highlight(name, text, false);
            current.language = name;
            if (current.relevance > second_best.relevance) {
              second_best = current;
            }
            if (current.relevance > result.relevance) {
              second_best = result;
              result = current;
            }
          });
          if (second_best.language) {
            result.second_best = second_best;
          }
          return result;
        }
        function fixMarkup(value) {
          if (options.tabReplace) {
            value = value.replace(/^((<[^>]+>|\t)+)/gm, function(match, p1) {
              return p1.replace(/\t/g, options.tabReplace);
            });
          }
          if (options.useBR) {
            value = value.replace(/\n/g, '<br>');
          }
          return value;
        }
        function buildClassName(prevClassName, currentLang, resultLang) {
          var language = currentLang ? aliases[currentLang] : resultLang,
              result = [prevClassName.trim()];
          if (!prevClassName.match(/\bhljs\b/)) {
            result.push('hljs');
          }
          if (prevClassName.indexOf(language) === -1) {
            result.push(language);
          }
          return result.join(' ').trim();
        }
        function highlightBlock(block) {
          var language = blockLanguage(block);
          if (isNotHighlighted(language))
            return;
          var node;
          if (options.useBR) {
            node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            node.innerHTML = block.innerHTML.replace(/\n/g, '').replace(/<br[ \/]*>/g, '\n');
          } else {
            node = block;
          }
          var text = node.textContent;
          var result = language ? highlight(language, text, true) : highlightAuto(text);
          var originalStream = nodeStream(node);
          if (originalStream.length) {
            var resultNode = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            resultNode.innerHTML = result.value;
            result.value = mergeStreams(originalStream, nodeStream(resultNode), text);
          }
          result.value = fixMarkup(result.value);
          block.innerHTML = result.value;
          block.className = buildClassName(block.className, language, result.language);
          block.result = {
            language: result.language,
            re: result.relevance
          };
          if (result.second_best) {
            block.second_best = {
              language: result.second_best.language,
              re: result.second_best.relevance
            };
          }
        }
        var options = {
          classPrefix: 'hljs-',
          tabReplace: null,
          useBR: false,
          languages: undefined
        };
        function configure(user_options) {
          options = inherit(options, user_options);
        }
        function initHighlighting() {
          if (initHighlighting.called)
            return;
          initHighlighting.called = true;
          var blocks = document.querySelectorAll('pre code');
          Array.prototype.forEach.call(blocks, highlightBlock);
        }
        function initHighlightingOnLoad() {
          addEventListener('DOMContentLoaded', initHighlighting, false);
          addEventListener('load', initHighlighting, false);
        }
        var languages = {};
        var aliases = {};
        function registerLanguage(name, language) {
          var lang = languages[name] = language(hljs);
          if (lang.aliases) {
            lang.aliases.forEach(function(alias) {
              aliases[alias] = name;
            });
          }
        }
        function listLanguages() {
          return Object.keys(languages);
        }
        function getLanguage(name) {
          return languages[name] || languages[aliases[name]];
        }
        hljs.highlight = highlight;
        hljs.highlightAuto = highlightAuto;
        hljs.fixMarkup = fixMarkup;
        hljs.highlightBlock = highlightBlock;
        hljs.configure = configure;
        hljs.initHighlighting = initHighlighting;
        hljs.initHighlightingOnLoad = initHighlightingOnLoad;
        hljs.registerLanguage = registerLanguage;
        hljs.listLanguages = listLanguages;
        hljs.getLanguage = getLanguage;
        hljs.inherit = inherit;
        hljs.IDENT_RE = '[a-zA-Z]\\w*';
        hljs.UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
        hljs.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
        hljs.C_NUMBER_RE = '\\b(0[xX][a-fA-F0-9]+|(\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)';
        hljs.BINARY_NUMBER_RE = '\\b(0b[01]+)';
        hljs.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';
        hljs.BACKSLASH_ESCAPE = {
          begin: '\\\\[\\s\\S]',
          relevance: 0
        };
        hljs.APOS_STRING_MODE = {
          className: 'string',
          begin: '\'',
          end: '\'',
          illegal: '\\n',
          contains: [hljs.BACKSLASH_ESCAPE]
        };
        hljs.QUOTE_STRING_MODE = {
          className: 'string',
          begin: '"',
          end: '"',
          illegal: '\\n',
          contains: [hljs.BACKSLASH_ESCAPE]
        };
        hljs.PHRASAL_WORDS_MODE = {begin: /\b(a|an|the|are|I|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such)\b/};
        hljs.COMMENT = function(begin, end, inherits) {
          var mode = hljs.inherit({
            className: 'comment',
            begin: begin,
            end: end,
            contains: []
          }, inherits || {});
          mode.contains.push(hljs.PHRASAL_WORDS_MODE);
          mode.contains.push({
            className: 'doctag',
            beginKeywords: "TODO FIXME NOTE BUG XXX",
            relevance: 0
          });
          return mode;
        };
        hljs.C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$');
        hljs.C_BLOCK_COMMENT_MODE = hljs.COMMENT('/\\*', '\\*/');
        hljs.HASH_COMMENT_MODE = hljs.COMMENT('#', '$');
        hljs.NUMBER_MODE = {
          className: 'number',
          begin: hljs.NUMBER_RE,
          relevance: 0
        };
        hljs.C_NUMBER_MODE = {
          className: 'number',
          begin: hljs.C_NUMBER_RE,
          relevance: 0
        };
        hljs.BINARY_NUMBER_MODE = {
          className: 'number',
          begin: hljs.BINARY_NUMBER_RE,
          relevance: 0
        };
        hljs.CSS_NUMBER_MODE = {
          className: 'number',
          begin: hljs.NUMBER_RE + '(' + '%|em|ex|ch|rem' + '|vw|vh|vmin|vmax' + '|cm|mm|in|pt|pc|px' + '|deg|grad|rad|turn' + '|s|ms' + '|Hz|kHz' + '|dpi|dpcm|dppx' + ')?',
          relevance: 0
        };
        hljs.REGEXP_MODE = {
          className: 'regexp',
          begin: /\//,
          end: /\/[gimuy]*/,
          illegal: /\n/,
          contains: [hljs.BACKSLASH_ESCAPE, {
            begin: /\[/,
            end: /\]/,
            relevance: 0,
            contains: [hljs.BACKSLASH_ESCAPE]
          }]
        };
        hljs.TITLE_MODE = {
          className: 'title',
          begin: hljs.IDENT_RE,
          relevance: 0
        };
        hljs.UNDERSCORE_TITLE_MODE = {
          className: 'title',
          begin: hljs.UNDERSCORE_IDENT_RE,
          relevance: 0
        };
        return hljs;
      }));
    }, {}],
    5: [function(require, module, exports) {
      var hljs = require('./highlight');
      hljs.registerLanguage('1c', require('./languages/1c'));
      hljs.registerLanguage('actionscript', require('./languages/actionscript'));
      hljs.registerLanguage('apache', require('./languages/apache'));
      hljs.registerLanguage('applescript', require('./languages/applescript'));
      hljs.registerLanguage('armasm', require('./languages/armasm'));
      hljs.registerLanguage('xml', require('./languages/xml'));
      hljs.registerLanguage('asciidoc', require('./languages/asciidoc'));
      hljs.registerLanguage('aspectj', require('./languages/aspectj'));
      hljs.registerLanguage('autohotkey', require('./languages/autohotkey'));
      hljs.registerLanguage('avrasm', require('./languages/avrasm'));
      hljs.registerLanguage('axapta', require('./languages/axapta'));
      hljs.registerLanguage('bash', require('./languages/bash'));
      hljs.registerLanguage('brainfuck', require('./languages/brainfuck'));
      hljs.registerLanguage('cal', require('./languages/cal'));
      hljs.registerLanguage('capnproto', require('./languages/capnproto'));
      hljs.registerLanguage('ceylon', require('./languages/ceylon'));
      hljs.registerLanguage('clojure', require('./languages/clojure'));
      hljs.registerLanguage('clojure-repl', require('./languages/clojure-repl'));
      hljs.registerLanguage('cmake', require('./languages/cmake'));
      hljs.registerLanguage('coffeescript', require('./languages/coffeescript'));
      hljs.registerLanguage('cpp', require('./languages/cpp'));
      hljs.registerLanguage('cs', require('./languages/cs'));
      hljs.registerLanguage('css', require('./languages/css'));
      hljs.registerLanguage('d', require('./languages/d'));
      hljs.registerLanguage('markdown', require('./languages/markdown'));
      hljs.registerLanguage('dart', require('./languages/dart'));
      hljs.registerLanguage('delphi', require('./languages/delphi'));
      hljs.registerLanguage('diff', require('./languages/diff'));
      hljs.registerLanguage('django', require('./languages/django'));
      hljs.registerLanguage('dns', require('./languages/dns'));
      hljs.registerLanguage('dockerfile', require('./languages/dockerfile'));
      hljs.registerLanguage('dos', require('./languages/dos'));
      hljs.registerLanguage('dust', require('./languages/dust'));
      hljs.registerLanguage('elixir', require('./languages/elixir'));
      hljs.registerLanguage('ruby', require('./languages/ruby'));
      hljs.registerLanguage('erb', require('./languages/erb'));
      hljs.registerLanguage('erlang-repl', require('./languages/erlang-repl'));
      hljs.registerLanguage('erlang', require('./languages/erlang'));
      hljs.registerLanguage('fix', require('./languages/fix'));
      hljs.registerLanguage('fortran', require('./languages/fortran'));
      hljs.registerLanguage('fsharp', require('./languages/fsharp'));
      hljs.registerLanguage('gcode', require('./languages/gcode'));
      hljs.registerLanguage('gherkin', require('./languages/gherkin'));
      hljs.registerLanguage('glsl', require('./languages/glsl'));
      hljs.registerLanguage('go', require('./languages/go'));
      hljs.registerLanguage('gradle', require('./languages/gradle'));
      hljs.registerLanguage('groovy', require('./languages/groovy'));
      hljs.registerLanguage('haml', require('./languages/haml'));
      hljs.registerLanguage('handlebars', require('./languages/handlebars'));
      hljs.registerLanguage('haskell', require('./languages/haskell'));
      hljs.registerLanguage('haxe', require('./languages/haxe'));
      hljs.registerLanguage('http', require('./languages/http'));
      hljs.registerLanguage('inform7', require('./languages/inform7'));
      hljs.registerLanguage('ini', require('./languages/ini'));
      hljs.registerLanguage('java', require('./languages/java'));
      hljs.registerLanguage('javascript', require('./languages/javascript'));
      hljs.registerLanguage('json', require('./languages/json'));
      hljs.registerLanguage('julia', require('./languages/julia'));
      hljs.registerLanguage('kotlin', require('./languages/kotlin'));
      hljs.registerLanguage('lasso', require('./languages/lasso'));
      hljs.registerLanguage('less', require('./languages/less'));
      hljs.registerLanguage('lisp', require('./languages/lisp'));
      hljs.registerLanguage('livecodeserver', require('./languages/livecodeserver'));
      hljs.registerLanguage('livescript', require('./languages/livescript'));
      hljs.registerLanguage('lua', require('./languages/lua'));
      hljs.registerLanguage('makefile', require('./languages/makefile'));
      hljs.registerLanguage('mathematica', require('./languages/mathematica'));
      hljs.registerLanguage('matlab', require('./languages/matlab'));
      hljs.registerLanguage('mel', require('./languages/mel'));
      hljs.registerLanguage('mercury', require('./languages/mercury'));
      hljs.registerLanguage('mizar', require('./languages/mizar'));
      hljs.registerLanguage('monkey', require('./languages/monkey'));
      hljs.registerLanguage('nginx', require('./languages/nginx'));
      hljs.registerLanguage('nimrod', require('./languages/nimrod'));
      hljs.registerLanguage('nix', require('./languages/nix'));
      hljs.registerLanguage('nsis', require('./languages/nsis'));
      hljs.registerLanguage('objectivec', require('./languages/objectivec'));
      hljs.registerLanguage('ocaml', require('./languages/ocaml'));
      hljs.registerLanguage('openscad', require('./languages/openscad'));
      hljs.registerLanguage('oxygene', require('./languages/oxygene'));
      hljs.registerLanguage('parser3', require('./languages/parser3'));
      hljs.registerLanguage('perl', require('./languages/perl'));
      hljs.registerLanguage('pf', require('./languages/pf'));
      hljs.registerLanguage('php', require('./languages/php'));
      hljs.registerLanguage('powershell', require('./languages/powershell'));
      hljs.registerLanguage('processing', require('./languages/processing'));
      hljs.registerLanguage('profile', require('./languages/profile'));
      hljs.registerLanguage('prolog', require('./languages/prolog'));
      hljs.registerLanguage('protobuf', require('./languages/protobuf'));
      hljs.registerLanguage('puppet', require('./languages/puppet'));
      hljs.registerLanguage('python', require('./languages/python'));
      hljs.registerLanguage('q', require('./languages/q'));
      hljs.registerLanguage('r', require('./languages/r'));
      hljs.registerLanguage('rib', require('./languages/rib'));
      hljs.registerLanguage('roboconf', require('./languages/roboconf'));
      hljs.registerLanguage('rsl', require('./languages/rsl'));
      hljs.registerLanguage('ruleslanguage', require('./languages/ruleslanguage'));
      hljs.registerLanguage('rust', require('./languages/rust'));
      hljs.registerLanguage('scala', require('./languages/scala'));
      hljs.registerLanguage('scheme', require('./languages/scheme'));
      hljs.registerLanguage('scilab', require('./languages/scilab'));
      hljs.registerLanguage('scss', require('./languages/scss'));
      hljs.registerLanguage('smali', require('./languages/smali'));
      hljs.registerLanguage('smalltalk', require('./languages/smalltalk'));
      hljs.registerLanguage('sml', require('./languages/sml'));
      hljs.registerLanguage('sql', require('./languages/sql'));
      hljs.registerLanguage('stata', require('./languages/stata'));
      hljs.registerLanguage('step21', require('./languages/step21'));
      hljs.registerLanguage('stylus', require('./languages/stylus'));
      hljs.registerLanguage('swift', require('./languages/swift'));
      hljs.registerLanguage('tcl', require('./languages/tcl'));
      hljs.registerLanguage('tex', require('./languages/tex'));
      hljs.registerLanguage('thrift', require('./languages/thrift'));
      hljs.registerLanguage('tp', require('./languages/tp'));
      hljs.registerLanguage('twig', require('./languages/twig'));
      hljs.registerLanguage('typescript', require('./languages/typescript'));
      hljs.registerLanguage('vala', require('./languages/vala'));
      hljs.registerLanguage('vbnet', require('./languages/vbnet'));
      hljs.registerLanguage('vbscript', require('./languages/vbscript'));
      hljs.registerLanguage('vbscript-html', require('./languages/vbscript-html'));
      hljs.registerLanguage('verilog', require('./languages/verilog'));
      hljs.registerLanguage('vhdl', require('./languages/vhdl'));
      hljs.registerLanguage('vim', require('./languages/vim'));
      hljs.registerLanguage('x86asm', require('./languages/x86asm'));
      hljs.registerLanguage('xl', require('./languages/xl'));
      module.exports = hljs;
    }, {
      "./highlight": 4,
      "./languages/1c": 6,
      "./languages/actionscript": 7,
      "./languages/apache": 8,
      "./languages/applescript": 9,
      "./languages/armasm": 10,
      "./languages/asciidoc": 11,
      "./languages/aspectj": 12,
      "./languages/autohotkey": 13,
      "./languages/avrasm": 14,
      "./languages/axapta": 15,
      "./languages/bash": 16,
      "./languages/brainfuck": 17,
      "./languages/cal": 18,
      "./languages/capnproto": 19,
      "./languages/ceylon": 20,
      "./languages/clojure": 22,
      "./languages/clojure-repl": 21,
      "./languages/cmake": 23,
      "./languages/coffeescript": 24,
      "./languages/cpp": 25,
      "./languages/cs": 26,
      "./languages/css": 27,
      "./languages/d": 28,
      "./languages/dart": 29,
      "./languages/delphi": 30,
      "./languages/diff": 31,
      "./languages/django": 32,
      "./languages/dns": 33,
      "./languages/dockerfile": 34,
      "./languages/dos": 35,
      "./languages/dust": 36,
      "./languages/elixir": 37,
      "./languages/erb": 38,
      "./languages/erlang": 40,
      "./languages/erlang-repl": 39,
      "./languages/fix": 41,
      "./languages/fortran": 42,
      "./languages/fsharp": 43,
      "./languages/gcode": 44,
      "./languages/gherkin": 45,
      "./languages/glsl": 46,
      "./languages/go": 47,
      "./languages/gradle": 48,
      "./languages/groovy": 49,
      "./languages/haml": 50,
      "./languages/handlebars": 51,
      "./languages/haskell": 52,
      "./languages/haxe": 53,
      "./languages/http": 54,
      "./languages/inform7": 55,
      "./languages/ini": 56,
      "./languages/java": 57,
      "./languages/javascript": 58,
      "./languages/json": 59,
      "./languages/julia": 60,
      "./languages/kotlin": 61,
      "./languages/lasso": 62,
      "./languages/less": 63,
      "./languages/lisp": 64,
      "./languages/livecodeserver": 65,
      "./languages/livescript": 66,
      "./languages/lua": 67,
      "./languages/makefile": 68,
      "./languages/markdown": 69,
      "./languages/mathematica": 70,
      "./languages/matlab": 71,
      "./languages/mel": 72,
      "./languages/mercury": 73,
      "./languages/mizar": 74,
      "./languages/monkey": 75,
      "./languages/nginx": 76,
      "./languages/nimrod": 77,
      "./languages/nix": 78,
      "./languages/nsis": 79,
      "./languages/objectivec": 80,
      "./languages/ocaml": 81,
      "./languages/openscad": 82,
      "./languages/oxygene": 83,
      "./languages/parser3": 84,
      "./languages/perl": 85,
      "./languages/pf": 86,
      "./languages/php": 87,
      "./languages/powershell": 88,
      "./languages/processing": 89,
      "./languages/profile": 90,
      "./languages/prolog": 91,
      "./languages/protobuf": 92,
      "./languages/puppet": 93,
      "./languages/python": 94,
      "./languages/q": 95,
      "./languages/r": 96,
      "./languages/rib": 97,
      "./languages/roboconf": 98,
      "./languages/rsl": 99,
      "./languages/ruby": 100,
      "./languages/ruleslanguage": 101,
      "./languages/rust": 102,
      "./languages/scala": 103,
      "./languages/scheme": 104,
      "./languages/scilab": 105,
      "./languages/scss": 106,
      "./languages/smali": 107,
      "./languages/smalltalk": 108,
      "./languages/sml": 109,
      "./languages/sql": 110,
      "./languages/stata": 111,
      "./languages/step21": 112,
      "./languages/stylus": 113,
      "./languages/swift": 114,
      "./languages/tcl": 115,
      "./languages/tex": 116,
      "./languages/thrift": 117,
      "./languages/tp": 118,
      "./languages/twig": 119,
      "./languages/typescript": 120,
      "./languages/vala": 121,
      "./languages/vbnet": 122,
      "./languages/vbscript": 124,
      "./languages/vbscript-html": 123,
      "./languages/verilog": 125,
      "./languages/vhdl": 126,
      "./languages/vim": 127,
      "./languages/x86asm": 128,
      "./languages/xl": 129,
      "./languages/xml": 130
    }],
    6: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE_RU = '[a-zA-Zа-яА-Я][a-zA-Z0-9_а-яА-Я]*';
        var OneS_KEYWORDS = 'возврат дата для если и или иначе иначеесли исключение конецесли ' + 'конецпопытки конецпроцедуры конецфункции конеццикла константа не перейти перем ' + 'перечисление по пока попытка прервать продолжить процедура строка тогда фс функция цикл ' + 'число экспорт';
        var OneS_BUILT_IN = 'ansitooem oemtoansi ввестивидсубконто ввестидату ввестизначение ' + 'ввестиперечисление ввестипериод ввестиплансчетов ввестистроку ввестичисло вопрос ' + 'восстановитьзначение врег выбранныйплансчетов вызватьисключение датагод датамесяц ' + 'датачисло добавитьмесяц завершитьработусистемы заголовоксистемы записьжурналарегистрации ' + 'запуститьприложение зафиксироватьтранзакцию значениевстроку значениевстрокувнутр ' + 'значениевфайл значениеизстроки значениеизстрокивнутр значениеизфайла имякомпьютера ' + 'имяпользователя каталогвременныхфайлов каталогиб каталогпользователя каталогпрограммы ' + 'кодсимв командасистемы конгода конецпериодаби конецрассчитанногопериодаби ' + 'конецстандартногоинтервала конквартала конмесяца коннедели лев лог лог10 макс ' + 'максимальноеколичествосубконто мин монопольныйрежим названиеинтерфейса названиенабораправ ' + 'назначитьвид назначитьсчет найти найтипомеченныенаудаление найтиссылки началопериодаби ' + 'началостандартногоинтервала начатьтранзакцию начгода начквартала начмесяца начнедели ' + 'номерднягода номерднянедели номернеделигода нрег обработкаожидания окр описаниеошибки ' + 'основнойжурналрасчетов основнойплансчетов основнойязык открытьформу открытьформумодально ' + 'отменитьтранзакцию очиститьокносообщений периодстр полноеимяпользователя получитьвремята ' + 'получитьдатута получитьдокументта получитьзначенияотбора получитьпозициюта ' + 'получитьпустоезначение получитьта прав праводоступа предупреждение префиксавтонумерации ' + 'пустаястрока пустоезначение рабочаядаттьпустоезначение рабочаядата разделительстраниц ' + 'разделительстрок разм разобратьпозициюдокумента рассчитатьрегистрына ' + 'рассчитатьрегистрыпо сигнал симв символтабуляции создатьобъект сокрл сокрлп сокрп ' + 'сообщить состояние сохранитьзначение сред статусвозврата стрдлина стрзаменить ' + 'стрколичествострок стрполучитьстроку  стрчисловхождений сформироватьпозициюдокумента ' + 'счетпокоду текущаядата текущеевремя типзначения типзначениястр удалитьобъекты ' + 'установитьтана установитьтапо фиксшаблон формат цел шаблон';
        var DQUOTE = {
          className: 'dquote',
          begin: '""'
        };
        var STR_START = {
          className: 'string',
          begin: '"',
          end: '"|$',
          contains: [DQUOTE]
        };
        var STR_CONT = {
          className: 'string',
          begin: '\\|',
          end: '"|$',
          contains: [DQUOTE]
        };
        return {
          case_insensitive: true,
          lexemes: IDENT_RE_RU,
          keywords: {
            keyword: OneS_KEYWORDS,
            built_in: OneS_BUILT_IN
          },
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.NUMBER_MODE, STR_START, STR_CONT, {
            className: 'function',
            begin: '(процедура|функция)',
            end: '$',
            lexemes: IDENT_RE_RU,
            keywords: 'процедура функция',
            contains: [hljs.inherit(hljs.TITLE_MODE, {begin: IDENT_RE_RU}), {
              className: 'tail',
              endsWithParent: true,
              contains: [{
                className: 'params',
                begin: '\\(',
                end: '\\)',
                lexemes: IDENT_RE_RU,
                keywords: 'знач',
                contains: [STR_START, STR_CONT]
              }, {
                className: 'export',
                begin: 'экспорт',
                endsWithParent: true,
                lexemes: IDENT_RE_RU,
                keywords: 'экспорт',
                contains: [hljs.C_LINE_COMMENT_MODE]
              }]
            }, hljs.C_LINE_COMMENT_MODE]
          }, {
            className: 'preprocessor',
            begin: '#',
            end: '$'
          }, {
            className: 'date',
            begin: '\'\\d{2}\\.\\d{2}\\.(\\d{2}|\\d{4})\''
          }]
        };
      };
    }, {}],
    7: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z_$][a-zA-Z0-9_$]*';
        var IDENT_FUNC_RETURN_TYPE_RE = '([*]|[a-zA-Z_$][a-zA-Z0-9_$]*)';
        var AS3_REST_ARG_MODE = {
          className: 'rest_arg',
          begin: '[.]{3}',
          end: IDENT_RE,
          relevance: 10
        };
        return {
          aliases: ['as'],
          keywords: {
            keyword: 'as break case catch class const continue default delete do dynamic each ' + 'else extends final finally for function get if implements import in include ' + 'instanceof interface internal is namespace native new override package private ' + 'protected public return set static super switch this throw try typeof use var void ' + 'while with',
            literal: 'true false null undefined'
          },
          contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.C_NUMBER_MODE, {
            className: 'package',
            beginKeywords: 'package',
            end: '{',
            contains: [hljs.TITLE_MODE]
          }, {
            className: 'class',
            beginKeywords: 'class interface',
            end: '{',
            excludeEnd: true,
            contains: [{beginKeywords: 'extends implements'}, hljs.TITLE_MODE]
          }, {
            className: 'preprocessor',
            beginKeywords: 'import include',
            end: ';'
          }, {
            className: 'function',
            beginKeywords: 'function',
            end: '[{;]',
            excludeEnd: true,
            illegal: '\\S',
            contains: [hljs.TITLE_MODE, {
              className: 'params',
              begin: '\\(',
              end: '\\)',
              contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, AS3_REST_ARG_MODE]
            }, {
              className: 'type',
              begin: ':',
              end: IDENT_FUNC_RETURN_TYPE_RE,
              relevance: 10
            }]
          }]
        };
      };
    }, {}],
    8: [function(require, module, exports) {
      module.exports = function(hljs) {
        var NUMBER = {
          className: 'number',
          begin: '[\\$%]\\d+'
        };
        return {
          aliases: ['apacheconf'],
          case_insensitive: true,
          contains: [hljs.HASH_COMMENT_MODE, {
            className: 'tag',
            begin: '</?',
            end: '>'
          }, {
            className: 'keyword',
            begin: /\w+/,
            relevance: 0,
            keywords: {common: 'order deny allow setenv rewriterule rewriteengine rewritecond documentroot ' + 'sethandler errordocument loadmodule options header listen serverroot ' + 'servername'},
            starts: {
              end: /$/,
              relevance: 0,
              keywords: {literal: 'on off all'},
              contains: [{
                className: 'sqbracket',
                begin: '\\s\\[',
                end: '\\]$'
              }, {
                className: 'cbracket',
                begin: '[\\$%]\\{',
                end: '\\}',
                contains: ['self', NUMBER]
              }, NUMBER, hljs.QUOTE_STRING_MODE]
            }
          }],
          illegal: /\S/
        };
      };
    }, {}],
    9: [function(require, module, exports) {
      module.exports = function(hljs) {
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: ''});
        var PARAMS = {
          className: 'params',
          begin: '\\(',
          end: '\\)',
          contains: ['self', hljs.C_NUMBER_MODE, STRING]
        };
        var COMMENT_MODE_1 = hljs.COMMENT('--', '$');
        var COMMENT_MODE_2 = hljs.COMMENT('\\(\\*', '\\*\\)', {contains: ['self', COMMENT_MODE_1]});
        var COMMENTS = [COMMENT_MODE_1, COMMENT_MODE_2, hljs.HASH_COMMENT_MODE];
        return {
          aliases: ['osascript'],
          keywords: {
            keyword: 'about above after against and around as at back before beginning ' + 'behind below beneath beside between but by considering ' + 'contain contains continue copy div does eighth else end equal ' + 'equals error every exit fifth first for fourth from front ' + 'get given global if ignoring in into is it its last local me ' + 'middle mod my ninth not of on onto or over prop property put ref ' + 'reference repeat returning script second set seventh since ' + 'sixth some tell tenth that the|0 then third through thru ' + 'timeout times to transaction try until where while whose with ' + 'without',
            constant: 'AppleScript false linefeed return pi quote result space tab true',
            type: 'alias application boolean class constant date file integer list ' + 'number real record string text',
            command: 'activate beep count delay launch log offset read round ' + 'run say summarize write',
            property: 'character characters contents day frontmost id item length ' + 'month name paragraph paragraphs rest reverse running time version ' + 'weekday word words year'
          },
          contains: [STRING, hljs.C_NUMBER_MODE, {
            className: 'type',
            begin: '\\bPOSIX file\\b'
          }, {
            className: 'command',
            begin: '\\b(clipboard info|the clipboard|info for|list (disks|folder)|' + 'mount volume|path to|(close|open for) access|(get|set) eof|' + 'current date|do shell script|get volume settings|random number|' + 'set volume|system attribute|system info|time to GMT|' + '(load|run|store) script|scripting components|' + 'ASCII (character|number)|localized string|' + 'choose (application|color|file|file name|' + 'folder|from list|remote application|URL)|' + 'display (alert|dialog))\\b|^\\s*return\\b'
          }, {
            className: 'constant',
            begin: '\\b(text item delimiters|current application|missing value)\\b'
          }, {
            className: 'keyword',
            begin: '\\b(apart from|aside from|instead of|out of|greater than|' + "isn't|(doesn't|does not) (equal|come before|come after|contain)|" + '(greater|less) than( or equal)?|(starts?|ends|begins?) with|' + 'contained by|comes (before|after)|a (ref|reference))\\b'
          }, {
            className: 'property',
            begin: '\\b(POSIX path|(date|time) string|quoted form)\\b'
          }, {
            className: 'function_start',
            beginKeywords: 'on',
            illegal: '[${=;\\n]',
            contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
          }].concat(COMMENTS),
          illegal: '//|->|=>'
        };
      };
    }, {}],
    10: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          case_insensitive: true,
          aliases: ['arm'],
          lexemes: '\\.?' + hljs.IDENT_RE,
          keywords: {
            literal: 'r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 ' + 'pc lr sp ip sl sb fp ' + 'a1 a2 a3 a4 v1 v2 v3 v4 v5 v6 v7 v8 f0 f1 f2 f3 f4 f5 f6 f7 ' + 'p0 p1 p2 p3 p4 p5 p6 p7 p8 p9 p10 p11 p12 p13 p14 p15 ' + 'c0 c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 ' + 'q0 q1 q2 q3 q4 q5 q6 q7 q8 q9 q10 q11 q12 q13 q14 q15 ' + 'cpsr_c cpsr_x cpsr_s cpsr_f cpsr_cx cpsr_cxs cpsr_xs cpsr_xsf cpsr_sf cpsr_cxsf ' + 'spsr_c spsr_x spsr_s spsr_f spsr_cx spsr_cxs spsr_xs spsr_xsf spsr_sf spsr_cxsf ' + 's0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 ' + 's16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31 ' + 'd0 d1 d2 d3 d4 d5 d6 d7 d8 d9 d10 d11 d12 d13 d14 d15 ' + 'd16 d17 d18 d19 d20 d21 d22 d23 d24 d25 d26 d27 d28 d29 d30 d31 ',
            preprocessor: '.2byte .4byte .align .ascii .asciz .balign .byte .code .data .else .end .endif .endm .endr .equ .err .exitm .extern .global .hword .if .ifdef .ifndef .include .irp .long .macro .rept .req .section .set .skip .space .text .word .arm .thumb .code16 .code32 .force_thumb .thumb_func .ltorg ' + 'ALIAS ALIGN ARM AREA ASSERT ATTR CN CODE CODE16 CODE32 COMMON CP DATA DCB DCD DCDU DCDO DCFD DCFDU DCI DCQ DCQU DCW DCWU DN ELIF ELSE END ENDFUNC ENDIF ENDP ENTRY EQU EXPORT EXPORTAS EXTERN FIELD FILL FUNCTION GBLA GBLL GBLS GET GLOBAL IF IMPORT INCBIN INCLUDE INFO KEEP LCLA LCLL LCLS LTORG MACRO MAP MEND MEXIT NOFP OPT PRESERVE8 PROC QN READONLY RELOC REQUIRE REQUIRE8 RLIST FN ROUT SETA SETL SETS SN SPACE SUBT THUMB THUMBX TTL WHILE WEND ',
            built_in: '{PC} {VAR} {TRUE} {FALSE} {OPT} {CONFIG} {ENDIAN} {CODESIZE} {CPU} {FPU} {ARCHITECTURE} {PCSTOREOFFSET} {ARMASM_VERSION} {INTER} {ROPI} {RWPI} {SWST} {NOSWST} . @ '
          },
          contains: [{
            className: 'keyword',
            begin: '\\b(' + 'adc|' + '(qd?|sh?|u[qh]?)?add(8|16)?|usada?8|(q|sh?|u[qh]?)?(as|sa)x|' + 'and|adrl?|sbc|rs[bc]|asr|b[lx]?|blx|bxj|cbn?z|tb[bh]|bic|' + 'bfc|bfi|[su]bfx|bkpt|cdp2?|clz|clrex|cmp|cmn|cpsi[ed]|cps|' + 'setend|dbg|dmb|dsb|eor|isb|it[te]{0,3}|lsl|lsr|ror|rrx|' + 'ldm(([id][ab])|f[ds])?|ldr((s|ex)?[bhd])?|movt?|mvn|mra|mar|' + 'mul|[us]mull|smul[bwt][bt]|smu[as]d|smmul|smmla|' + 'mla|umlaal|smlal?([wbt][bt]|d)|mls|smlsl?[ds]|smc|svc|sev|' + 'mia([bt]{2}|ph)?|mrr?c2?|mcrr2?|mrs|msr|orr|orn|pkh(tb|bt)|rbit|' + 'rev(16|sh)?|sel|[su]sat(16)?|nop|pop|push|rfe([id][ab])?|' + 'stm([id][ab])?|str(ex)?[bhd]?|(qd?)?sub|(sh?|q|u[qh]?)?sub(8|16)|' + '[su]xt(a?h|a?b(16)?)|srs([id][ab])?|swpb?|swi|smi|tst|teq|' + 'wfe|wfi|yield' + ')' + '(eq|ne|cs|cc|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|al|hs|lo)?' + '[sptrx]?',
            end: '\\s'
          }, hljs.COMMENT('[;@]', '$', {relevance: 0}), hljs.C_BLOCK_COMMENT_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '\'',
            end: '[^\\\\]\'',
            relevance: 0
          }, {
            className: 'title',
            begin: '\\|',
            end: '\\|',
            illegal: '\\n',
            relevance: 0
          }, {
            className: 'number',
            variants: [{begin: '[#$=]?0x[0-9a-f]+'}, {begin: '[#$=]?0b[01]+'}, {begin: '[#$=]\\d+'}, {begin: '\\b\\d+'}],
            relevance: 0
          }, {
            className: 'label',
            variants: [{begin: '^[a-z_\\.\\$][a-z0-9_\\.\\$]+'}, {begin: '^\\s*[a-z_\\.\\$][a-z0-9_\\.\\$]+:'}, {begin: '[=#]\\w+'}],
            relevance: 0
          }]
        };
      };
    }, {}],
    11: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['adoc'],
          contains: [hljs.COMMENT('^/{4,}\\n', '\\n/{4,}$', {relevance: 10}), hljs.COMMENT('^//', '$', {relevance: 0}), {
            className: 'title',
            begin: '^\\.\\w.*$'
          }, {
            begin: '^[=\\*]{4,}\\n',
            end: '\\n^[=\\*]{4,}$',
            relevance: 10
          }, {
            className: 'header',
            begin: '^(={1,5}) .+?( \\1)?$',
            relevance: 10
          }, {
            className: 'header',
            begin: '^[^\\[\\]\\n]+?\\n[=\\-~\\^\\+]{2,}$',
            relevance: 10
          }, {
            className: 'attribute',
            begin: '^:.+?:',
            end: '\\s',
            excludeEnd: true,
            relevance: 10
          }, {
            className: 'attribute',
            begin: '^\\[.+?\\]$',
            relevance: 0
          }, {
            className: 'blockquote',
            begin: '^_{4,}\\n',
            end: '\\n_{4,}$',
            relevance: 10
          }, {
            className: 'code',
            begin: '^[\\-\\.]{4,}\\n',
            end: '\\n[\\-\\.]{4,}$',
            relevance: 10
          }, {
            begin: '^\\+{4,}\\n',
            end: '\\n\\+{4,}$',
            contains: [{
              begin: '<',
              end: '>',
              subLanguage: 'xml',
              relevance: 0
            }],
            relevance: 10
          }, {
            className: 'bullet',
            begin: '^(\\*+|\\-+|\\.+|[^\\n]+?::)\\s+'
          }, {
            className: 'label',
            begin: '^(NOTE|TIP|IMPORTANT|WARNING|CAUTION):\\s+',
            relevance: 10
          }, {
            className: 'strong',
            begin: '\\B\\*(?![\\*\\s])',
            end: '(\\n{2}|\\*)',
            contains: [{
              begin: '\\\\*\\w',
              relevance: 0
            }]
          }, {
            className: 'emphasis',
            begin: '\\B\'(?![\'\\s])',
            end: '(\\n{2}|\')',
            contains: [{
              begin: '\\\\\'\\w',
              relevance: 0
            }],
            relevance: 0
          }, {
            className: 'emphasis',
            begin: '_(?![_\\s])',
            end: '(\\n{2}|_)',
            relevance: 0
          }, {
            className: 'smartquote',
            variants: [{begin: "``.+?''"}, {begin: "`.+?'"}]
          }, {
            className: 'code',
            begin: '(`.+?`|\\+.+?\\+)',
            relevance: 0
          }, {
            className: 'code',
            begin: '^[ \\t]',
            end: '$',
            relevance: 0
          }, {
            className: 'horizontal_rule',
            begin: '^\'{3,}[ \\t]*$',
            relevance: 10
          }, {
            begin: '(link:)?(http|https|ftp|file|irc|image:?):\\S+\\[.*?\\]',
            returnBegin: true,
            contains: [{
              begin: '(link|image:?):',
              relevance: 0
            }, {
              className: 'link_url',
              begin: '\\w',
              end: '[^\\[]+',
              relevance: 0
            }, {
              className: 'link_label',
              begin: '\\[',
              end: '\\]',
              excludeBegin: true,
              excludeEnd: true,
              relevance: 0
            }],
            relevance: 10
          }]
        };
      };
    }, {}],
    12: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = 'false synchronized int abstract float private char boolean static null if const ' + 'for true while long throw strictfp finally protected import native final return void ' + 'enum else extends implements break transient new catch instanceof byte super volatile case ' + 'assert short package default double public try this switch continue throws privileged ' + 'aspectOf adviceexecution proceed cflowbelow cflow initialization preinitialization ' + 'staticinitialization withincode target within execution getWithinTypeName handler ' + 'thisJoinPoint thisJoinPointStaticPart thisEnclosingJoinPointStaticPart declare parents ' + 'warning error soft precedence thisAspectInstance';
        var SHORTKEYS = 'get set args call';
        return {
          keywords: KEYWORDS,
          illegal: /<\//,
          contains: [hljs.COMMENT('/\\*\\*', '\\*/', {
            relevance: 0,
            contains: [{
              className: 'doctag',
              begin: '@[A-Za-z]+'
            }]
          }), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'aspect',
            beginKeywords: 'aspect',
            end: /[{;=]/,
            excludeEnd: true,
            illegal: /[:;"\[\]]/,
            contains: [{beginKeywords: 'extends implements pertypewithin perthis pertarget percflowbelow percflow issingleton'}, hljs.UNDERSCORE_TITLE_MODE, {
              begin: /\([^\)]*/,
              end: /[)]+/,
              keywords: KEYWORDS + ' ' + SHORTKEYS,
              excludeEnd: false
            }]
          }, {
            className: 'class',
            beginKeywords: 'class interface',
            end: /[{;=]/,
            excludeEnd: true,
            relevance: 0,
            keywords: 'class interface',
            illegal: /[:"\[\]]/,
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }, {
            beginKeywords: 'pointcut after before around throwing returning',
            end: /[)]/,
            excludeEnd: false,
            illegal: /["\[\]]/,
            contains: [{
              begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
              returnBegin: true,
              contains: [hljs.UNDERSCORE_TITLE_MODE]
            }]
          }, {
            begin: /[:]/,
            returnBegin: true,
            end: /[{;]/,
            relevance: 0,
            excludeEnd: false,
            keywords: KEYWORDS,
            illegal: /["\[\]]/,
            contains: [{
              begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
              keywords: KEYWORDS + ' ' + SHORTKEYS
            }, hljs.QUOTE_STRING_MODE]
          }, {
            beginKeywords: 'new throw',
            relevance: 0
          }, {
            className: 'function',
            begin: /\w+ +\w+(\.)?\w+\s*\([^\)]*\)\s*((throws)[\w\s,]+)?[\{;]/,
            returnBegin: true,
            end: /[{;=]/,
            keywords: KEYWORDS,
            excludeEnd: true,
            contains: [{
              begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
              returnBegin: true,
              relevance: 0,
              contains: [hljs.UNDERSCORE_TITLE_MODE]
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              relevance: 0,
              keywords: KEYWORDS,
              contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, hljs.C_BLOCK_COMMENT_MODE]
            }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }, hljs.C_NUMBER_MODE, {
            className: 'annotation',
            begin: '@[A-Za-z]+'
          }]
        };
      };
    }, {}],
    13: [function(require, module, exports) {
      module.exports = function(hljs) {
        var BACKTICK_ESCAPE = {
          className: 'escape',
          begin: '`[\\s\\S]'
        };
        var COMMENTS = hljs.COMMENT(';', '$', {relevance: 0});
        var BUILT_IN = [{
          className: 'built_in',
          begin: 'A_[a-zA-Z0-9]+'
        }, {
          className: 'built_in',
          beginKeywords: 'ComSpec Clipboard ClipboardAll ErrorLevel'
        }];
        return {
          case_insensitive: true,
          keywords: {
            keyword: 'Break Continue Else Gosub If Loop Return While',
            literal: 'A true false NOT AND OR'
          },
          contains: BUILT_IN.concat([BACKTICK_ESCAPE, hljs.inherit(hljs.QUOTE_STRING_MODE, {contains: [BACKTICK_ESCAPE]}), COMMENTS, {
            className: 'number',
            begin: hljs.NUMBER_RE,
            relevance: 0
          }, {
            className: 'var_expand',
            begin: '%',
            end: '%',
            illegal: '\\n',
            contains: [BACKTICK_ESCAPE]
          }, {
            className: 'label',
            contains: [BACKTICK_ESCAPE],
            variants: [{begin: '^[^\\n";]+::(?!=)'}, {
              begin: '^[^\\n";]+:(?!=)',
              relevance: 0
            }]
          }, {
            begin: ',\\s*,',
            relevance: 10
          }])
        };
      };
    }, {}],
    14: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          case_insensitive: true,
          lexemes: '\\.?' + hljs.IDENT_RE,
          keywords: {
            keyword: 'adc add adiw and andi asr bclr bld brbc brbs brcc brcs break breq brge brhc brhs ' + 'brid brie brlo brlt brmi brne brpl brsh brtc brts brvc brvs bset bst call cbi cbr ' + 'clc clh cli cln clr cls clt clv clz com cp cpc cpi cpse dec eicall eijmp elpm eor ' + 'fmul fmuls fmulsu icall ijmp in inc jmp ld ldd ldi lds lpm lsl lsr mov movw mul ' + 'muls mulsu neg nop or ori out pop push rcall ret reti rjmp rol ror sbc sbr sbrc sbrs ' + 'sec seh sbi sbci sbic sbis sbiw sei sen ser ses set sev sez sleep spm st std sts sub ' + 'subi swap tst wdr',
            built_in: 'r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 ' + 'r23 r24 r25 r26 r27 r28 r29 r30 r31 x|0 xh xl y|0 yh yl z|0 zh zl ' + 'ucsr1c udr1 ucsr1a ucsr1b ubrr1l ubrr1h ucsr0c ubrr0h tccr3c tccr3a tccr3b tcnt3h ' + 'tcnt3l ocr3ah ocr3al ocr3bh ocr3bl ocr3ch ocr3cl icr3h icr3l etimsk etifr tccr1c ' + 'ocr1ch ocr1cl twcr twdr twar twsr twbr osccal xmcra xmcrb eicra spmcsr spmcr portg ' + 'ddrg ping portf ddrf sreg sph spl xdiv rampz eicrb eimsk gimsk gicr eifr gifr timsk ' + 'tifr mcucr mcucsr tccr0 tcnt0 ocr0 assr tccr1a tccr1b tcnt1h tcnt1l ocr1ah ocr1al ' + 'ocr1bh ocr1bl icr1h icr1l tccr2 tcnt2 ocr2 ocdr wdtcr sfior eearh eearl eedr eecr ' + 'porta ddra pina portb ddrb pinb portc ddrc pinc portd ddrd pind spdr spsr spcr udr0 ' + 'ucsr0a ucsr0b ubrr0l acsr admux adcsr adch adcl porte ddre pine pinf',
            preprocessor: '.byte .cseg .db .def .device .dseg .dw .endmacro .equ .eseg .exit .include .list ' + '.listmac .macro .nolist .org .set'
          },
          contains: [hljs.C_BLOCK_COMMENT_MODE, hljs.COMMENT(';', '$', {relevance: 0}), hljs.C_NUMBER_MODE, hljs.BINARY_NUMBER_MODE, {
            className: 'number',
            begin: '\\b(\\$[a-zA-Z0-9]+|0o[0-7]+)'
          }, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '\'',
            end: '[^\\\\]\'',
            illegal: '[^\\\\][^\']'
          }, {
            className: 'label',
            begin: '^[A-Za-z0-9_.$]+:'
          }, {
            className: 'preprocessor',
            begin: '#',
            end: '$'
          }, {
            className: 'localvars',
            begin: '@[0-9]+'
          }]
        };
      };
    }, {}],
    15: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: 'false int abstract private char boolean static null if for true ' + 'while long throw finally protected final return void enum else ' + 'break new catch byte super case short default double public try this switch ' + 'continue reverse firstfast firstonly forupdate nofetch sum avg minof maxof count ' + 'order group by asc desc index hint like dispaly edit client server ttsbegin ' + 'ttscommit str real date container anytype common div mod',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, {
            className: 'preprocessor',
            begin: '#',
            end: '$'
          }, {
            className: 'class',
            beginKeywords: 'class interface',
            end: '{',
            excludeEnd: true,
            illegal: ':',
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }]
        };
      };
    }, {}],
    16: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VAR = {
          className: 'variable',
          variants: [{begin: /\$[\w\d#@][\w\d_]*/}, {begin: /\$\{(.*?)}/}]
        };
        var QUOTE_STRING = {
          className: 'string',
          begin: /"/,
          end: /"/,
          contains: [hljs.BACKSLASH_ESCAPE, VAR, {
            className: 'variable',
            begin: /\$\(/,
            end: /\)/,
            contains: [hljs.BACKSLASH_ESCAPE]
          }]
        };
        var APOS_STRING = {
          className: 'string',
          begin: /'/,
          end: /'/
        };
        return {
          aliases: ['sh', 'zsh'],
          lexemes: /-?[a-z\.]+/,
          keywords: {
            keyword: 'if then else elif fi for while in do done case esac function',
            literal: 'true false',
            built_in: 'break cd continue eval exec exit export getopts hash pwd readonly return shift test times ' + 'trap umask unset ' + 'alias bind builtin caller command declare echo enable help let local logout mapfile printf ' + 'read readarray source type typeset ulimit unalias ' + 'set shopt ' + 'autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles ' + 'compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate ' + 'fc fg float functions getcap getln history integer jobs kill limit log noglob popd print ' + 'pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit ' + 'unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof ' + 'zpty zregexparse zsocket zstyle ztcp',
            operator: '-ne -eq -lt -gt -f -d -e -s -l -a'
          },
          contains: [{
            className: 'shebang',
            begin: /^#![^\n]+sh\s*$/,
            relevance: 10
          }, {
            className: 'function',
            begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
            returnBegin: true,
            contains: [hljs.inherit(hljs.TITLE_MODE, {begin: /\w[\w\d_]*/})],
            relevance: 0
          }, hljs.HASH_COMMENT_MODE, hljs.NUMBER_MODE, QUOTE_STRING, APOS_STRING, VAR]
        };
      };
    }, {}],
    17: [function(require, module, exports) {
      module.exports = function(hljs) {
        var LITERAL = {
          className: 'literal',
          begin: '[\\+\\-]',
          relevance: 0
        };
        return {
          aliases: ['bf'],
          contains: [hljs.COMMENT('[^\\[\\]\\.,\\+\\-<> \r\n]', '[\\[\\]\\.,\\+\\-<> \r\n]', {
            returnEnd: true,
            relevance: 0
          }), {
            className: 'title',
            begin: '[\\[\\]]',
            relevance: 0
          }, {
            className: 'string',
            begin: '[\\.,]',
            relevance: 0
          }, {
            begin: /\+\+|\-\-/,
            returnBegin: true,
            contains: [LITERAL]
          }, LITERAL]
        };
      };
    }, {}],
    18: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = 'div mod in and or not xor asserterror begin case do downto else end exit for if of repeat then to ' + 'until while with var';
        var LITERALS = 'false true';
        var COMMENT_MODES = [hljs.C_LINE_COMMENT_MODE, hljs.COMMENT(/\{/, /\}/, {relevance: 0}), hljs.COMMENT(/\(\*/, /\*\)/, {relevance: 10})];
        var STRING = {
          className: 'string',
          begin: /'/,
          end: /'/,
          contains: [{begin: /''/}]
        };
        var CHAR_STRING = {
          className: 'string',
          begin: /(#\d+)+/
        };
        var DATE = {
          className: 'date',
          begin: '\\b\\d+(\\.\\d+)?(DT|D|T)',
          relevance: 0
        };
        var DBL_QUOTED_VARIABLE = {
          className: 'variable',
          begin: '"',
          end: '"'
        };
        var PROCEDURE = {
          className: 'function',
          beginKeywords: 'procedure',
          end: /[:;]/,
          keywords: 'procedure|10',
          contains: [hljs.TITLE_MODE, {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            keywords: KEYWORDS,
            contains: [STRING, CHAR_STRING]
          }].concat(COMMENT_MODES)
        };
        var OBJECT = {
          className: 'class',
          begin: 'OBJECT (Table|Form|Report|Dataport|Codeunit|XMLport|MenuSuite|Page|Query) (\\d+) ([^\\r\\n]+)',
          returnBegin: true,
          contains: [hljs.TITLE_MODE, PROCEDURE]
        };
        return {
          case_insensitive: true,
          keywords: {
            keyword: KEYWORDS,
            literal: LITERALS
          },
          contains: [STRING, CHAR_STRING, DATE, DBL_QUOTED_VARIABLE, hljs.NUMBER_MODE, OBJECT, PROCEDURE]
        };
      };
    }, {}],
    19: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['capnp'],
          keywords: {
            keyword: 'struct enum interface union group import using const annotation extends in of on as with from fixed',
            built_in: 'Void Bool Int8 Int16 Int32 Int64 UInt8 UInt16 UInt32 UInt64 Float32 Float64 ' + 'Text Data AnyPointer AnyStruct Capability List',
            literal: 'true false'
          },
          contains: [hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE, hljs.HASH_COMMENT_MODE, {
            className: 'shebang',
            begin: /@0x[\w\d]{16};/,
            illegal: /\n/
          }, {
            className: 'number',
            begin: /@\d+\b/
          }, {
            className: 'class',
            beginKeywords: 'struct enum',
            end: /\{/,
            illegal: /\n/,
            contains: [hljs.inherit(hljs.TITLE_MODE, {starts: {
                endsWithParent: true,
                excludeEnd: true
              }})]
          }, {
            className: 'class',
            beginKeywords: 'interface',
            end: /\{/,
            illegal: /\n/,
            contains: [hljs.inherit(hljs.TITLE_MODE, {starts: {
                endsWithParent: true,
                excludeEnd: true
              }})]
          }]
        };
      };
    }, {}],
    20: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = 'assembly module package import alias class interface object given value ' + 'assign void function new of extends satisfies abstracts in out return ' + 'break continue throw assert dynamic if else switch case for while try ' + 'catch finally then let this outer super is exists nonempty';
        var DECLARATION_MODIFIERS = 'shared abstract formal default actual variable late native deprecated' + 'final sealed annotation suppressWarnings small';
        var DOCUMENTATION = 'doc by license see throws tagged';
        var LANGUAGE_ANNOTATIONS = DECLARATION_MODIFIERS + ' ' + DOCUMENTATION;
        var SUBST = {
          className: 'subst',
          excludeBegin: true,
          excludeEnd: true,
          begin: /``/,
          end: /``/,
          keywords: KEYWORDS,
          relevance: 10
        };
        var EXPRESSIONS = [{
          className: 'string',
          begin: '"""',
          end: '"""',
          relevance: 10
        }, {
          className: 'string',
          begin: '"',
          end: '"',
          contains: [SUBST]
        }, {
          className: 'string',
          begin: "'",
          end: "'"
        }, {
          className: 'number',
          begin: '#[0-9a-fA-F_]+|\\$[01_]+|[0-9_]+(?:\\.[0-9_](?:[eE][+-]?\\d+)?)?[kMGTPmunpf]?',
          relevance: 0
        }];
        SUBST.contains = EXPRESSIONS;
        return {
          keywords: {
            keyword: KEYWORDS,
            annotation: LANGUAGE_ANNOTATIONS
          },
          illegal: '\\$[^01]|#[^0-9a-fA-F]',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.COMMENT('/\\*', '\\*/', {contains: ['self']}), {
            className: 'annotation',
            begin: '@[a-z]\\w*(?:\\:\"[^\"]*\")?'
          }].concat(EXPRESSIONS)
        };
      };
    }, {}],
    21: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {contains: [{
            className: 'prompt',
            begin: /^([\w.-]+|\s*#_)=>/,
            starts: {
              end: /$/,
              subLanguage: 'clojure',
              subLanguageMode: 'continuous'
            }
          }]};
      };
    }, {}],
    22: [function(require, module, exports) {
      module.exports = function(hljs) {
        var keywords = {built_in: 'def cond apply if-not if-let if not not= = < > <= >= == + / * - rem ' + 'quot neg? pos? delay? symbol? keyword? true? false? integer? empty? coll? list? ' + 'set? ifn? fn? associative? sequential? sorted? counted? reversible? number? decimal? ' + 'class? distinct? isa? float? rational? reduced? ratio? odd? even? char? seq? vector? ' + 'string? map? nil? contains? zero? instance? not-every? not-any? libspec? -> ->> .. . ' + 'inc compare do dotimes mapcat take remove take-while drop letfn drop-last take-last ' + 'drop-while while intern condp case reduced cycle split-at split-with repeat replicate ' + 'iterate range merge zipmap declare line-seq sort comparator sort-by dorun doall nthnext ' + 'nthrest partition eval doseq await await-for let agent atom send send-off release-pending-sends ' + 'add-watch mapv filterv remove-watch agent-error restart-agent set-error-handler error-handler ' + 'set-error-mode! error-mode shutdown-agents quote var fn loop recur throw try monitor-enter ' + 'monitor-exit defmacro defn defn- macroexpand macroexpand-1 for dosync and or ' + 'when when-not when-let comp juxt partial sequence memoize constantly complement identity assert ' + 'peek pop doto proxy defstruct first rest cons defprotocol cast coll deftype defrecord last butlast ' + 'sigs reify second ffirst fnext nfirst nnext defmulti defmethod meta with-meta ns in-ns create-ns import ' + 'refer keys select-keys vals key val rseq name namespace promise into transient persistent! conj! ' + 'assoc! dissoc! pop! disj! use class type num float double short byte boolean bigint biginteger ' + 'bigdec print-method print-dup throw-if printf format load compile get-in update-in pr pr-on newline ' + 'flush read slurp read-line subvec with-open memfn time re-find re-groups rand-int rand mod locking ' + 'assert-valid-fdecl alias resolve ref deref refset swap! reset! set-validator! compare-and-set! alter-meta! ' + 'reset-meta! commute get-validator alter ref-set ref-history-count ref-min-history ref-max-history ensure sync io! ' + 'new next conj set! to-array future future-call into-array aset gen-class reduce map filter find empty ' + 'hash-map hash-set sorted-map sorted-map-by sorted-set sorted-set-by vec vector seq flatten reverse assoc dissoc list ' + 'disj get union difference intersection extend extend-type extend-protocol int nth delay count concat chunk chunk-buffer ' + 'chunk-append chunk-first chunk-rest max min dec unchecked-inc-int unchecked-inc unchecked-dec-inc unchecked-dec unchecked-negate ' + 'unchecked-add-int unchecked-add unchecked-subtract-int unchecked-subtract chunk-next chunk-cons chunked-seq? prn vary-meta ' + 'lazy-seq spread list* str find-keyword keyword symbol gensym force rationalize'};
        var SYMBOLSTART = 'a-zA-Z_\\-!.?+*=<>&#\'';
        var SYMBOL_RE = '[' + SYMBOLSTART + '][' + SYMBOLSTART + '0-9/;:]*';
        var SIMPLE_NUMBER_RE = '[-+]?\\d+(\\.\\d+)?';
        var SYMBOL = {
          begin: SYMBOL_RE,
          relevance: 0
        };
        var NUMBER = {
          className: 'number',
          begin: SIMPLE_NUMBER_RE,
          relevance: 0
        };
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null});
        var COMMENT = hljs.COMMENT(';', '$', {relevance: 0});
        var LITERAL = {
          className: 'literal',
          begin: /\b(true|false|nil)\b/
        };
        var COLLECTION = {
          className: 'collection',
          begin: '[\\[\\{]',
          end: '[\\]\\}]'
        };
        var HINT = {
          className: 'comment',
          begin: '\\^' + SYMBOL_RE
        };
        var HINT_COL = hljs.COMMENT('\\^\\{', '\\}');
        var KEY = {
          className: 'attribute',
          begin: '[:]' + SYMBOL_RE
        };
        var LIST = {
          className: 'list',
          begin: '\\(',
          end: '\\)'
        };
        var BODY = {
          endsWithParent: true,
          relevance: 0
        };
        var NAME = {
          keywords: keywords,
          lexemes: SYMBOL_RE,
          className: 'keyword',
          begin: SYMBOL_RE,
          starts: BODY
        };
        var DEFAULT_CONTAINS = [LIST, STRING, HINT, HINT_COL, COMMENT, KEY, COLLECTION, NUMBER, LITERAL, SYMBOL];
        LIST.contains = [hljs.COMMENT('comment', ''), NAME, BODY];
        BODY.contains = DEFAULT_CONTAINS;
        COLLECTION.contains = DEFAULT_CONTAINS;
        return {
          aliases: ['clj'],
          illegal: /\S/,
          contains: [LIST, STRING, HINT, HINT_COL, COMMENT, KEY, COLLECTION, NUMBER, LITERAL]
        };
      };
    }, {}],
    23: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['cmake.in'],
          case_insensitive: true,
          keywords: {
            keyword: 'add_custom_command add_custom_target add_definitions add_dependencies ' + 'add_executable add_library add_subdirectory add_test aux_source_directory ' + 'break build_command cmake_minimum_required cmake_policy configure_file ' + 'create_test_sourcelist define_property else elseif enable_language enable_testing ' + 'endforeach endfunction endif endmacro endwhile execute_process export find_file ' + 'find_library find_package find_path find_program fltk_wrap_ui foreach function ' + 'get_cmake_property get_directory_property get_filename_component get_property ' + 'get_source_file_property get_target_property get_test_property if include ' + 'include_directories include_external_msproject include_regular_expression install ' + 'link_directories load_cache load_command macro mark_as_advanced message option ' + 'output_required_files project qt_wrap_cpp qt_wrap_ui remove_definitions return ' + 'separate_arguments set set_directory_properties set_property ' + 'set_source_files_properties set_target_properties set_tests_properties site_name ' + 'source_group string target_link_libraries try_compile try_run unset variable_watch ' + 'while build_name exec_program export_library_dependencies install_files ' + 'install_programs install_targets link_libraries make_directory remove subdir_depends ' + 'subdirs use_mangled_mesa utility_source variable_requires write_file ' + 'qt5_use_modules qt5_use_package qt5_wrap_cpp on off true false and or',
            operator: 'equal less greater strless strgreater strequal matches'
          },
          contains: [{
            className: 'envvar',
            begin: '\\${',
            end: '}'
          }, hljs.HASH_COMMENT_MODE, hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE]
        };
      };
    }, {}],
    24: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = {
          keyword: 'in if for while finally new do return else break catch instanceof throw try this ' + 'switch continue typeof delete debugger super ' + 'then unless until loop of by when and or is isnt not',
          literal: 'true false null undefined ' + 'yes no on off',
          reserved: 'case default function var void with const let enum export import native ' + '__hasProp __extends __slice __bind __indexOf',
          built_in: 'npm require console print module global window document'
        };
        var JS_IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
        var SUBST = {
          className: 'subst',
          begin: /#\{/,
          end: /}/,
          keywords: KEYWORDS
        };
        var EXPRESSIONS = [hljs.BINARY_NUMBER_MODE, hljs.inherit(hljs.C_NUMBER_MODE, {starts: {
            end: '(\\s*/)?',
            relevance: 0
          }}), {
          className: 'string',
          variants: [{
            begin: /'''/,
            end: /'''/,
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            begin: /'/,
            end: /'/,
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            begin: /"""/,
            end: /"""/,
            contains: [hljs.BACKSLASH_ESCAPE, SUBST]
          }, {
            begin: /"/,
            end: /"/,
            contains: [hljs.BACKSLASH_ESCAPE, SUBST]
          }]
        }, {
          className: 'regexp',
          variants: [{
            begin: '///',
            end: '///',
            contains: [SUBST, hljs.HASH_COMMENT_MODE]
          }, {
            begin: '//[gim]*',
            relevance: 0
          }, {begin: /\/(?![ *])(\\\/|.)*?\/[gim]*(?=\W|$)/}]
        }, {
          className: 'property',
          begin: '@' + JS_IDENT_RE
        }, {
          begin: '`',
          end: '`',
          excludeBegin: true,
          excludeEnd: true,
          subLanguage: 'javascript'
        }];
        SUBST.contains = EXPRESSIONS;
        var TITLE = hljs.inherit(hljs.TITLE_MODE, {begin: JS_IDENT_RE});
        var PARAMS_RE = '(\\(.*\\))?\\s*\\B[-=]>';
        var PARAMS = {
          className: 'params',
          begin: '\\([^\\(]',
          returnBegin: true,
          contains: [{
            begin: /\(/,
            end: /\)/,
            keywords: KEYWORDS,
            contains: ['self'].concat(EXPRESSIONS)
          }]
        };
        return {
          aliases: ['coffee', 'cson', 'iced'],
          keywords: KEYWORDS,
          illegal: /\/\*/,
          contains: EXPRESSIONS.concat([hljs.COMMENT('###', '###'), hljs.HASH_COMMENT_MODE, {
            className: 'function',
            begin: '^\\s*' + JS_IDENT_RE + '\\s*=\\s*' + PARAMS_RE,
            end: '[-=]>',
            returnBegin: true,
            contains: [TITLE, PARAMS]
          }, {
            begin: /[:\(,=]\s*/,
            relevance: 0,
            contains: [{
              className: 'function',
              begin: PARAMS_RE,
              end: '[-=]>',
              returnBegin: true,
              contains: [PARAMS]
            }]
          }, {
            className: 'class',
            beginKeywords: 'class',
            end: '$',
            illegal: /[:="\[\]]/,
            contains: [{
              beginKeywords: 'extends',
              endsWithParent: true,
              illegal: /[:="\[\]]/,
              contains: [TITLE]
            }, TITLE]
          }, {
            className: 'attribute',
            begin: JS_IDENT_RE + ':',
            end: ':',
            returnBegin: true,
            returnEnd: true,
            relevance: 0
          }])
        };
      };
    }, {}],
    25: [function(require, module, exports) {
      module.exports = function(hljs) {
        var CPP_PRIMATIVE_TYPES = {
          className: 'keyword',
          begin: '[a-z\\d_]*_t'
        };
        var CPP_KEYWORDS = {
          keyword: 'false int float while private char catch export virtual operator sizeof ' + 'dynamic_cast|10 typedef const_cast|10 const struct for static_cast|10 union namespace ' + 'unsigned long volatile static protected bool template mutable if public friend ' + 'do goto auto void enum else break extern using true class asm case typeid ' + 'short reinterpret_cast|10 default double register explicit signed typename try this ' + 'switch continue inline delete alignof constexpr decltype ' + 'noexcept nullptr static_assert thread_local restrict _Bool complex _Complex _Imaginary ' + 'atomic_bool atomic_char atomic_schar ' + 'atomic_uchar atomic_short atomic_ushort atomic_int atomic_uint atomic_long atomic_ulong atomic_llong ' + 'atomic_ullong',
          built_in: 'std string cin cout cerr clog stringstream istringstream ostringstream ' + 'auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set ' + 'unordered_map unordered_multiset unordered_multimap array shared_ptr abort abs acos ' + 'asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp ' + 'fscanf isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper ' + 'isxdigit tolower toupper labs ldexp log10 log malloc memchr memcmp memcpy memset modf pow ' + 'printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp ' + 'strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan ' + 'vfprintf vprintf vsprintf'
        };
        return {
          aliases: ['c', 'cc', 'h', 'c++', 'h++', 'hpp'],
          keywords: CPP_KEYWORDS,
          illegal: '</',
          contains: [CPP_PRIMATIVE_TYPES, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'string',
            variants: [hljs.inherit(hljs.QUOTE_STRING_MODE, {begin: '((u8?|U)|L)?"'}), {
              begin: '(u8?|U)?R"',
              end: '"',
              contains: [hljs.BACKSLASH_ESCAPE]
            }, {
              begin: '\'\\\\?.',
              end: '\'',
              illegal: '.'
            }]
          }, {
            className: 'number',
            begin: '\\b(\\d+(\\.\\d*)?|\\.\\d+)(u|U|l|L|ul|UL|f|F)'
          }, hljs.C_NUMBER_MODE, {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            keywords: 'if else elif endif define undef warning error line pragma',
            contains: [{
              begin: /\\\n/,
              relevance: 0
            }, {
              begin: 'include\\s*[<"]',
              end: '[>"]',
              keywords: 'include',
              illegal: '\\n'
            }, hljs.C_LINE_COMMENT_MODE]
          }, {
            begin: '\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<',
            end: '>',
            keywords: CPP_KEYWORDS,
            contains: ['self', CPP_PRIMATIVE_TYPES]
          }, {
            begin: hljs.IDENT_RE + '::',
            keywords: CPP_KEYWORDS
          }, {
            beginKeywords: 'new throw return else',
            relevance: 0
          }, {
            className: 'function',
            begin: '(' + hljs.IDENT_RE + '\\s+)+' + hljs.IDENT_RE + '\\s*\\(',
            returnBegin: true,
            end: /[{;=]/,
            excludeEnd: true,
            keywords: CPP_KEYWORDS,
            contains: [{
              begin: hljs.IDENT_RE + '\\s*\\(',
              returnBegin: true,
              contains: [hljs.TITLE_MODE],
              relevance: 0
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              keywords: CPP_KEYWORDS,
              relevance: 0,
              contains: [hljs.C_BLOCK_COMMENT_MODE]
            }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }]
        };
      };
    }, {}],
    26: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = 'abstract as base bool break byte case catch char checked const continue decimal dynamic ' + 'default delegate do double else enum event explicit extern false finally fixed float ' + 'for foreach goto if implicit in int interface internal is lock long null when ' + 'object operator out override params private protected public readonly ref sbyte ' + 'sealed short sizeof stackalloc static string struct switch this true try typeof ' + 'uint ulong unchecked unsafe ushort using virtual volatile void while async ' + 'protected public private internal ' + 'ascending descending from get group into join let orderby partial select set value var ' + 'where yield';
        var GENERIC_IDENT_RE = hljs.IDENT_RE + '(<' + hljs.IDENT_RE + '>)?';
        return {
          aliases: ['csharp'],
          keywords: KEYWORDS,
          illegal: /::/,
          contains: [hljs.COMMENT('///', '$', {
            returnBegin: true,
            contains: [{
              className: 'xmlDocTag',
              variants: [{
                begin: '///',
                relevance: 0
              }, {begin: '<!--|-->'}, {
                begin: '</?',
                end: '>'
              }]
            }]
          }), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            keywords: 'if else elif endif define undef warning error line region endregion pragma checksum'
          }, {
            className: 'string',
            begin: '@"',
            end: '"',
            contains: [{begin: '""'}]
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, {
            beginKeywords: 'class interface',
            end: /[{;=]/,
            illegal: /[^\s:]/,
            contains: [hljs.TITLE_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }, {
            beginKeywords: 'namespace',
            end: /[{;=]/,
            illegal: /[^\s:]/,
            contains: [{
              className: 'title',
              begin: '[a-zA-Z](\\.?\\w)*',
              relevance: 0
            }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }, {
            beginKeywords: 'new return throw await',
            relevance: 0
          }, {
            className: 'function',
            begin: '(' + GENERIC_IDENT_RE + '\\s+)+' + hljs.IDENT_RE + '\\s*\\(',
            returnBegin: true,
            end: /[{;=]/,
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: [{
              begin: hljs.IDENT_RE + '\\s*\\(',
              returnBegin: true,
              contains: [hljs.TITLE_MODE],
              relevance: 0
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              excludeBegin: true,
              excludeEnd: true,
              keywords: KEYWORDS,
              relevance: 0,
              contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, hljs.C_BLOCK_COMMENT_MODE]
            }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }]
        };
      };
    }, {}],
    27: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z-][a-zA-Z0-9_-]*';
        var FUNCTION = {
          className: 'function',
          begin: IDENT_RE + '\\(',
          returnBegin: true,
          excludeEnd: true,
          end: '\\('
        };
        var RULE = {
          className: 'rule',
          begin: /[A-Z\_\.\-]+\s*:/,
          returnBegin: true,
          end: ';',
          endsWithParent: true,
          contains: [{
            className: 'attribute',
            begin: /\S/,
            end: ':',
            excludeEnd: true,
            starts: {
              className: 'value',
              endsWithParent: true,
              excludeEnd: true,
              contains: [FUNCTION, hljs.CSS_NUMBER_MODE, hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, hljs.C_BLOCK_COMMENT_MODE, {
                className: 'hexcolor',
                begin: '#[0-9A-Fa-f]+'
              }, {
                className: 'important',
                begin: '!important'
              }]
            }
          }]
        };
        return {
          case_insensitive: true,
          illegal: /[=\/|'\$]/,
          contains: [hljs.C_BLOCK_COMMENT_MODE, RULE, {
            className: 'id',
            begin: /\#[A-Za-z0-9_-]+/
          }, {
            className: 'class',
            begin: /\.[A-Za-z0-9_-]+/
          }, {
            className: 'attr_selector',
            begin: /\[/,
            end: /\]/,
            illegal: '$'
          }, {
            className: 'pseudo',
            begin: /:(:)?[a-zA-Z0-9\_\-\+\(\)"']+/
          }, {
            className: 'at_rule',
            begin: '@(font-face|page)',
            lexemes: '[a-z-]+',
            keywords: 'font-face page'
          }, {
            className: 'at_rule',
            begin: '@',
            end: '[{;]',
            contains: [{
              className: 'keyword',
              begin: /\S+/
            }, {
              begin: /\s/,
              endsWithParent: true,
              excludeEnd: true,
              relevance: 0,
              contains: [FUNCTION, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.CSS_NUMBER_MODE]
            }]
          }, {
            className: 'tag',
            begin: IDENT_RE,
            relevance: 0
          }, {
            className: 'rules',
            begin: '{',
            end: '}',
            illegal: /\S/,
            contains: [hljs.C_BLOCK_COMMENT_MODE, RULE]
          }]
        };
      };
    }, {}],
    28: [function(require, module, exports) {
      module.exports = function(hljs) {
        var D_KEYWORDS = {
          keyword: 'abstract alias align asm assert auto body break byte case cast catch class ' + 'const continue debug default delete deprecated do else enum export extern final ' + 'finally for foreach foreach_reverse|10 goto if immutable import in inout int ' + 'interface invariant is lazy macro mixin module new nothrow out override package ' + 'pragma private protected public pure ref return scope shared static struct ' + 'super switch synchronized template this throw try typedef typeid typeof union ' + 'unittest version void volatile while with __FILE__ __LINE__ __gshared|10 ' + '__thread __traits __DATE__ __EOF__ __TIME__ __TIMESTAMP__ __VENDOR__ __VERSION__',
          built_in: 'bool cdouble cent cfloat char creal dchar delegate double dstring float function ' + 'idouble ifloat ireal long real short string ubyte ucent uint ulong ushort wchar ' + 'wstring',
          literal: 'false null true'
        };
        var decimal_integer_re = '(0|[1-9][\\d_]*)',
            decimal_integer_nosus_re = '(0|[1-9][\\d_]*|\\d[\\d_]*|[\\d_]+?\\d)',
            binary_integer_re = '0[bB][01_]+',
            hexadecimal_digits_re = '([\\da-fA-F][\\da-fA-F_]*|_[\\da-fA-F][\\da-fA-F_]*)',
            hexadecimal_integer_re = '0[xX]' + hexadecimal_digits_re,
            decimal_exponent_re = '([eE][+-]?' + decimal_integer_nosus_re + ')',
            decimal_float_re = '(' + decimal_integer_nosus_re + '(\\.\\d*|' + decimal_exponent_re + ')|' + '\\d+\\.' + decimal_integer_nosus_re + decimal_integer_nosus_re + '|' + '\\.' + decimal_integer_re + decimal_exponent_re + '?' + ')',
            hexadecimal_float_re = '(0[xX](' + hexadecimal_digits_re + '\\.' + hexadecimal_digits_re + '|' + '\\.?' + hexadecimal_digits_re + ')[pP][+-]?' + decimal_integer_nosus_re + ')',
            integer_re = '(' + decimal_integer_re + '|' + binary_integer_re + '|' + hexadecimal_integer_re + ')',
            float_re = '(' + hexadecimal_float_re + '|' + decimal_float_re + ')';
        var escape_sequence_re = '\\\\(' + '[\'"\\?\\\\abfnrtv]|' + 'u[\\dA-Fa-f]{4}|' + '[0-7]{1,3}|' + 'x[\\dA-Fa-f]{2}|' + 'U[\\dA-Fa-f]{8}' + ')|' + '&[a-zA-Z\\d]{2,};';
        var D_INTEGER_MODE = {
          className: 'number',
          begin: '\\b' + integer_re + '(L|u|U|Lu|LU|uL|UL)?',
          relevance: 0
        };
        var D_FLOAT_MODE = {
          className: 'number',
          begin: '\\b(' + float_re + '([fF]|L|i|[fF]i|Li)?|' + integer_re + '(i|[fF]i|Li)' + ')',
          relevance: 0
        };
        var D_CHARACTER_MODE = {
          className: 'string',
          begin: '\'(' + escape_sequence_re + '|.)',
          end: '\'',
          illegal: '.'
        };
        var D_ESCAPE_SEQUENCE = {
          begin: escape_sequence_re,
          relevance: 0
        };
        var D_STRING_MODE = {
          className: 'string',
          begin: '"',
          contains: [D_ESCAPE_SEQUENCE],
          end: '"[cwd]?'
        };
        var D_WYSIWYG_DELIMITED_STRING_MODE = {
          className: 'string',
          begin: '[rq]"',
          end: '"[cwd]?',
          relevance: 5
        };
        var D_ALTERNATE_WYSIWYG_STRING_MODE = {
          className: 'string',
          begin: '`',
          end: '`[cwd]?'
        };
        var D_HEX_STRING_MODE = {
          className: 'string',
          begin: 'x"[\\da-fA-F\\s\\n\\r]*"[cwd]?',
          relevance: 10
        };
        var D_TOKEN_STRING_MODE = {
          className: 'string',
          begin: 'q"\\{',
          end: '\\}"'
        };
        var D_HASHBANG_MODE = {
          className: 'shebang',
          begin: '^#!',
          end: '$',
          relevance: 5
        };
        var D_SPECIAL_TOKEN_SEQUENCE_MODE = {
          className: 'preprocessor',
          begin: '#(line)',
          end: '$',
          relevance: 5
        };
        var D_ATTRIBUTE_MODE = {
          className: 'keyword',
          begin: '@[a-zA-Z_][a-zA-Z_\\d]*'
        };
        var D_NESTING_COMMENT_MODE = hljs.COMMENT('\\/\\+', '\\+\\/', {
          contains: ['self'],
          relevance: 10
        });
        return {
          lexemes: hljs.UNDERSCORE_IDENT_RE,
          keywords: D_KEYWORDS,
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, D_NESTING_COMMENT_MODE, D_HEX_STRING_MODE, D_STRING_MODE, D_WYSIWYG_DELIMITED_STRING_MODE, D_ALTERNATE_WYSIWYG_STRING_MODE, D_TOKEN_STRING_MODE, D_FLOAT_MODE, D_INTEGER_MODE, D_CHARACTER_MODE, D_HASHBANG_MODE, D_SPECIAL_TOKEN_SEQUENCE_MODE, D_ATTRIBUTE_MODE]
        };
      };
    }, {}],
    29: [function(require, module, exports) {
      module.exports = function(hljs) {
        var SUBST = {
          className: 'subst',
          begin: '\\$\\{',
          end: '}',
          keywords: 'true false null this is new super'
        };
        var STRING = {
          className: 'string',
          variants: [{
            begin: 'r\'\'\'',
            end: '\'\'\''
          }, {
            begin: 'r"""',
            end: '"""'
          }, {
            begin: 'r\'',
            end: '\'',
            illegal: '\\n'
          }, {
            begin: 'r"',
            end: '"',
            illegal: '\\n'
          }, {
            begin: '\'\'\'',
            end: '\'\'\'',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST]
          }, {
            begin: '"""',
            end: '"""',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST]
          }, {
            begin: '\'',
            end: '\'',
            illegal: '\\n',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST]
          }, {
            begin: '"',
            end: '"',
            illegal: '\\n',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST]
          }]
        };
        SUBST.contains = [hljs.C_NUMBER_MODE, STRING];
        var KEYWORDS = {
          keyword: 'assert break case catch class const continue default do else enum extends false final finally for if ' + 'in is new null rethrow return super switch this throw true try var void while with',
          literal: 'abstract as dynamic export external factory get implements import library operator part set static typedef',
          built_in: 'print Comparable DateTime Duration Function Iterable Iterator List Map Match Null Object Pattern RegExp Set ' + 'Stopwatch String StringBuffer StringSink Symbol Type Uri bool double int num ' + 'document window querySelector querySelectorAll Element ElementList'
        };
        return {
          keywords: KEYWORDS,
          contains: [STRING, hljs.COMMENT('/\\*\\*', '\\*/', {
            subLanguage: 'markdown',
            subLanguageMode: 'continuous'
          }), hljs.COMMENT('///', '$', {
            subLanguage: 'markdown',
            subLanguageMode: 'continuous'
          }), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'class',
            beginKeywords: 'class interface',
            end: '{',
            excludeEnd: true,
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }, hljs.C_NUMBER_MODE, {
            className: 'annotation',
            begin: '@[A-Za-z]+'
          }, {begin: '=>'}]
        };
      };
    }, {}],
    30: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = 'exports register file shl array record property for mod while set ally label uses raise not ' + 'stored class safecall var interface or private static exit index inherited to else stdcall ' + 'override shr asm far resourcestring finalization packed virtual out and protected library do ' + 'xorwrite goto near function end div overload object unit begin string on inline repeat until ' + 'destructor write message program with read initialization except default nil if case cdecl in ' + 'downto threadvar of try pascal const external constructor type public then implementation ' + 'finally published procedure';
        var COMMENT_MODES = [hljs.C_LINE_COMMENT_MODE, hljs.COMMENT(/\{/, /\}/, {relevance: 0}), hljs.COMMENT(/\(\*/, /\*\)/, {relevance: 10})];
        var STRING = {
          className: 'string',
          begin: /'/,
          end: /'/,
          contains: [{begin: /''/}]
        };
        var CHAR_STRING = {
          className: 'string',
          begin: /(#\d+)+/
        };
        var CLASS = {
          begin: hljs.IDENT_RE + '\\s*=\\s*class\\s*\\(',
          returnBegin: true,
          contains: [hljs.TITLE_MODE]
        };
        var FUNCTION = {
          className: 'function',
          beginKeywords: 'function constructor destructor procedure',
          end: /[:;]/,
          keywords: 'function constructor|10 destructor|10 procedure|10',
          contains: [hljs.TITLE_MODE, {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            keywords: KEYWORDS,
            contains: [STRING, CHAR_STRING]
          }].concat(COMMENT_MODES)
        };
        return {
          case_insensitive: true,
          keywords: KEYWORDS,
          illegal: /"|\$[G-Zg-z]|\/\*|<\/|\|/,
          contains: [STRING, CHAR_STRING, hljs.NUMBER_MODE, CLASS, FUNCTION].concat(COMMENT_MODES)
        };
      };
    }, {}],
    31: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['patch'],
          contains: [{
            className: 'chunk',
            relevance: 10,
            variants: [{begin: /^@@ +\-\d+,\d+ +\+\d+,\d+ +@@$/}, {begin: /^\*\*\* +\d+,\d+ +\*\*\*\*$/}, {begin: /^\-\-\- +\d+,\d+ +\-\-\-\-$/}]
          }, {
            className: 'header',
            variants: [{
              begin: /Index: /,
              end: /$/
            }, {
              begin: /=====/,
              end: /=====$/
            }, {
              begin: /^\-\-\-/,
              end: /$/
            }, {
              begin: /^\*{3} /,
              end: /$/
            }, {
              begin: /^\+\+\+/,
              end: /$/
            }, {
              begin: /\*{5}/,
              end: /\*{5}$/
            }]
          }, {
            className: 'addition',
            begin: '^\\+',
            end: '$'
          }, {
            className: 'deletion',
            begin: '^\\-',
            end: '$'
          }, {
            className: 'change',
            begin: '^\\!',
            end: '$'
          }]
        };
      };
    }, {}],
    32: [function(require, module, exports) {
      module.exports = function(hljs) {
        var FILTER = {
          className: 'filter',
          begin: /\|[A-Za-z]+:?/,
          keywords: 'truncatewords removetags linebreaksbr yesno get_digit timesince random striptags ' + 'filesizeformat escape linebreaks length_is ljust rjust cut urlize fix_ampersands ' + 'title floatformat capfirst pprint divisibleby add make_list unordered_list urlencode ' + 'timeuntil urlizetrunc wordcount stringformat linenumbers slice date dictsort ' + 'dictsortreversed default_if_none pluralize lower join center default ' + 'truncatewords_html upper length phone2numeric wordwrap time addslashes slugify first ' + 'escapejs force_escape iriencode last safe safeseq truncatechars localize unlocalize ' + 'localtime utc timezone',
          contains: [{
            className: 'argument',
            begin: /"/,
            end: /"/
          }, {
            className: 'argument',
            begin: /'/,
            end: /'/
          }]
        };
        return {
          aliases: ['jinja'],
          case_insensitive: true,
          subLanguage: 'xml',
          subLanguageMode: 'continuous',
          contains: [hljs.COMMENT(/\{%\s*comment\s*%}/, /\{%\s*endcomment\s*%}/), hljs.COMMENT(/\{#/, /#}/), {
            className: 'template_tag',
            begin: /\{%/,
            end: /%}/,
            keywords: 'comment endcomment load templatetag ifchanged endifchanged if endif firstof for ' + 'endfor in ifnotequal endifnotequal widthratio extends include spaceless ' + 'endspaceless regroup by as ifequal endifequal ssi now with cycle url filter ' + 'endfilter debug block endblock else autoescape endautoescape csrf_token empty elif ' + 'endwith static trans blocktrans endblocktrans get_static_prefix get_media_prefix ' + 'plural get_current_language language get_available_languages ' + 'get_current_language_bidi get_language_info get_language_info_list localize ' + 'endlocalize localtime endlocaltime timezone endtimezone get_current_timezone ' + 'verbatim',
            contains: [FILTER]
          }, {
            className: 'variable',
            begin: /\{\{/,
            end: /}}/,
            contains: [FILTER]
          }]
        };
      };
    }, {}],
    33: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['bind', 'zone'],
          keywords: {keyword: 'IN A AAAA AFSDB APL CAA CDNSKEY CDS CERT CNAME DHCID DLV DNAME DNSKEY DS HIP IPSECKEY KEY KX ' + 'LOC MX NAPTR NS NSEC NSEC3 NSEC3PARAM PTR RRSIG RP SIG SOA SRV SSHFP TA TKEY TLSA TSIG TXT'},
          contains: [hljs.COMMENT(';', '$'), {
            className: 'operator',
            beginKeywords: '$TTL $GENERATE $INCLUDE $ORIGIN'
          }, {
            className: 'number',
            begin: '((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))'
          }, {
            className: 'number',
            begin: '((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])'
          }]
        };
      };
    }, {}],
    34: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['docker'],
          case_insensitive: true,
          keywords: {built_ins: 'from maintainer cmd expose add copy entrypoint volume user workdir onbuild run env'},
          contains: [hljs.HASH_COMMENT_MODE, {
            keywords: {built_in: 'run cmd entrypoint volume add copy workdir onbuild'},
            begin: /^ *(onbuild +)?(run|cmd|entrypoint|volume|add|copy|workdir) +/,
            starts: {
              end: /[^\\]\n/,
              subLanguage: 'bash',
              subLanguageMode: 'continuous'
            }
          }, {
            keywords: {built_in: 'from maintainer expose env user onbuild'},
            begin: /^ *(onbuild +)?(from|maintainer|expose|env|user|onbuild) +/,
            end: /[^\\]\n/,
            contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE, hljs.HASH_COMMENT_MODE]
          }]
        };
      };
    }, {}],
    35: [function(require, module, exports) {
      module.exports = function(hljs) {
        var COMMENT = hljs.COMMENT(/@?rem\b/, /$/, {relevance: 10});
        var LABEL = {
          className: 'label',
          begin: '^\\s*[A-Za-z._?][A-Za-z0-9_$#@~.?]*(:|\\s+label)',
          relevance: 0
        };
        return {
          aliases: ['bat', 'cmd'],
          case_insensitive: true,
          keywords: {
            flow: 'if else goto for in do call exit not exist errorlevel defined',
            operator: 'equ neq lss leq gtr geq',
            keyword: 'shift cd dir echo setlocal endlocal set pause copy',
            stream: 'prn nul lpt3 lpt2 lpt1 con com4 com3 com2 com1 aux',
            winutils: 'ping net ipconfig taskkill xcopy ren del',
            built_in: 'append assoc at attrib break cacls cd chcp chdir chkdsk chkntfs cls cmd color ' + 'comp compact convert date dir diskcomp diskcopy doskey erase fs ' + 'find findstr format ftype graftabl help keyb label md mkdir mode more move path ' + 'pause print popd pushd promt rd recover rem rename replace restore rmdir shift' + 'sort start subst time title tree type ver verify vol'
          },
          contains: [{
            className: 'envvar',
            begin: /%%[^ ]|%[^ ]+?%|![^ ]+?!/
          }, {
            className: 'function',
            begin: LABEL.begin,
            end: 'goto:eof',
            contains: [hljs.inherit(hljs.TITLE_MODE, {begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*'}), COMMENT]
          }, {
            className: 'number',
            begin: '\\b\\d+',
            relevance: 0
          }, COMMENT]
        };
      };
    }, {}],
    36: [function(require, module, exports) {
      module.exports = function(hljs) {
        var EXPRESSION_KEYWORDS = 'if eq ne lt lte gt gte select default math sep';
        return {
          aliases: ['dst'],
          case_insensitive: true,
          subLanguage: 'xml',
          subLanguageMode: 'continuous',
          contains: [{
            className: 'expression',
            begin: '{',
            end: '}',
            relevance: 0,
            contains: [{
              className: 'begin-block',
              begin: '\#[a-zA-Z\-\ \.]+',
              keywords: EXPRESSION_KEYWORDS
            }, {
              className: 'string',
              begin: '"',
              end: '"'
            }, {
              className: 'end-block',
              begin: '\\\/[a-zA-Z\-\ \.]+',
              keywords: EXPRESSION_KEYWORDS
            }, {
              className: 'variable',
              begin: '[a-zA-Z\-\.]+',
              keywords: EXPRESSION_KEYWORDS,
              relevance: 0
            }]
          }]
        };
      };
    }, {}],
    37: [function(require, module, exports) {
      module.exports = function(hljs) {
        var ELIXIR_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*(\\!|\\?)?';
        var ELIXIR_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
        var ELIXIR_KEYWORDS = 'and false then defined module in return redo retry end for true self when ' + 'next until do begin unless nil break not case cond alias while ensure or ' + 'include use alias fn quote';
        var SUBST = {
          className: 'subst',
          begin: '#\\{',
          end: '}',
          lexemes: ELIXIR_IDENT_RE,
          keywords: ELIXIR_KEYWORDS
        };
        var STRING = {
          className: 'string',
          contains: [hljs.BACKSLASH_ESCAPE, SUBST],
          variants: [{
            begin: /'/,
            end: /'/
          }, {
            begin: /"/,
            end: /"/
          }]
        };
        var FUNCTION = {
          className: 'function',
          beginKeywords: 'def defp defmacro',
          end: /\B\b/,
          contains: [hljs.inherit(hljs.TITLE_MODE, {
            begin: ELIXIR_IDENT_RE,
            endsParent: true
          })]
        };
        var CLASS = hljs.inherit(FUNCTION, {
          className: 'class',
          beginKeywords: 'defmodule defrecord',
          end: /\bdo\b|$|;/
        });
        var ELIXIR_DEFAULT_CONTAINS = [STRING, hljs.HASH_COMMENT_MODE, CLASS, FUNCTION, {
          className: 'constant',
          begin: '(\\b[A-Z_]\\w*(.)?)+',
          relevance: 0
        }, {
          className: 'symbol',
          begin: ':',
          contains: [STRING, {begin: ELIXIR_METHOD_RE}],
          relevance: 0
        }, {
          className: 'symbol',
          begin: ELIXIR_IDENT_RE + ':',
          relevance: 0
        }, {
          className: 'number',
          begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
          relevance: 0
        }, {
          className: 'variable',
          begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
        }, {begin: '->'}, {
          begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
          contains: [hljs.HASH_COMMENT_MODE, {
            className: 'regexp',
            illegal: '\\n',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST],
            variants: [{
              begin: '/',
              end: '/[a-z]*'
            }, {
              begin: '%r\\[',
              end: '\\][a-z]*'
            }]
          }],
          relevance: 0
        }];
        SUBST.contains = ELIXIR_DEFAULT_CONTAINS;
        return {
          lexemes: ELIXIR_IDENT_RE,
          keywords: ELIXIR_KEYWORDS,
          contains: ELIXIR_DEFAULT_CONTAINS
        };
      };
    }, {}],
    38: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          subLanguage: 'xml',
          subLanguageMode: 'continuous',
          contains: [hljs.COMMENT('<%#', '%>'), {
            begin: '<%[%=-]?',
            end: '[%-]?%>',
            subLanguage: 'ruby',
            excludeBegin: true,
            excludeEnd: true
          }]
        };
      };
    }, {}],
    39: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            special_functions: 'spawn spawn_link self',
            reserved: 'after and andalso|10 band begin bnot bor bsl bsr bxor case catch cond div end fun if ' + 'let not of or orelse|10 query receive rem try when xor'
          },
          contains: [{
            className: 'prompt',
            begin: '^[0-9]+> ',
            relevance: 10
          }, hljs.COMMENT('%', '$'), {
            className: 'number',
            begin: '\\b(\\d+#[a-fA-F0-9]+|\\d+(\\.\\d+)?([eE][-+]?\\d+)?)',
            relevance: 0
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'constant',
            begin: '\\?(::)?([A-Z]\\w*(::)?)+'
          }, {
            className: 'arrow',
            begin: '->'
          }, {
            className: 'ok',
            begin: 'ok'
          }, {
            className: 'exclamation_mark',
            begin: '!'
          }, {
            className: 'function_or_atom',
            begin: '(\\b[a-z\'][a-zA-Z0-9_\']*:[a-z\'][a-zA-Z0-9_\']*)|(\\b[a-z\'][a-zA-Z0-9_\']*)',
            relevance: 0
          }, {
            className: 'variable',
            begin: '[A-Z][a-zA-Z0-9_\']*',
            relevance: 0
          }]
        };
      };
    }, {}],
    40: [function(require, module, exports) {
      module.exports = function(hljs) {
        var BASIC_ATOM_RE = '[a-z\'][a-zA-Z0-9_\']*';
        var FUNCTION_NAME_RE = '(' + BASIC_ATOM_RE + ':' + BASIC_ATOM_RE + '|' + BASIC_ATOM_RE + ')';
        var ERLANG_RESERVED = {
          keyword: 'after and andalso|10 band begin bnot bor bsl bzr bxor case catch cond div end fun if ' + 'let not of orelse|10 query receive rem try when xor',
          literal: 'false true'
        };
        var COMMENT = hljs.COMMENT('%', '$');
        var NUMBER = {
          className: 'number',
          begin: '\\b(\\d+#[a-fA-F0-9]+|\\d+(\\.\\d+)?([eE][-+]?\\d+)?)',
          relevance: 0
        };
        var NAMED_FUN = {begin: 'fun\\s+' + BASIC_ATOM_RE + '/\\d+'};
        var FUNCTION_CALL = {
          begin: FUNCTION_NAME_RE + '\\(',
          end: '\\)',
          returnBegin: true,
          relevance: 0,
          contains: [{
            className: 'function_name',
            begin: FUNCTION_NAME_RE,
            relevance: 0
          }, {
            begin: '\\(',
            end: '\\)',
            endsWithParent: true,
            returnEnd: true,
            relevance: 0
          }]
        };
        var TUPLE = {
          className: 'tuple',
          begin: '{',
          end: '}',
          relevance: 0
        };
        var VAR1 = {
          className: 'variable',
          begin: '\\b_([A-Z][A-Za-z0-9_]*)?',
          relevance: 0
        };
        var VAR2 = {
          className: 'variable',
          begin: '[A-Z][a-zA-Z0-9_]*',
          relevance: 0
        };
        var RECORD_ACCESS = {
          begin: '#' + hljs.UNDERSCORE_IDENT_RE,
          relevance: 0,
          returnBegin: true,
          contains: [{
            className: 'record_name',
            begin: '#' + hljs.UNDERSCORE_IDENT_RE,
            relevance: 0
          }, {
            begin: '{',
            end: '}',
            relevance: 0
          }]
        };
        var BLOCK_STATEMENTS = {
          beginKeywords: 'fun receive if try case',
          end: 'end',
          keywords: ERLANG_RESERVED
        };
        BLOCK_STATEMENTS.contains = [COMMENT, NAMED_FUN, hljs.inherit(hljs.APOS_STRING_MODE, {className: ''}), BLOCK_STATEMENTS, FUNCTION_CALL, hljs.QUOTE_STRING_MODE, NUMBER, TUPLE, VAR1, VAR2, RECORD_ACCESS];
        var BASIC_MODES = [COMMENT, NAMED_FUN, BLOCK_STATEMENTS, FUNCTION_CALL, hljs.QUOTE_STRING_MODE, NUMBER, TUPLE, VAR1, VAR2, RECORD_ACCESS];
        FUNCTION_CALL.contains[1].contains = BASIC_MODES;
        TUPLE.contains = BASIC_MODES;
        RECORD_ACCESS.contains[1].contains = BASIC_MODES;
        var PARAMS = {
          className: 'params',
          begin: '\\(',
          end: '\\)',
          contains: BASIC_MODES
        };
        return {
          aliases: ['erl'],
          keywords: ERLANG_RESERVED,
          illegal: '(</|\\*=|\\+=|-=|/\\*|\\*/|\\(\\*|\\*\\))',
          contains: [{
            className: 'function',
            begin: '^' + BASIC_ATOM_RE + '\\s*\\(',
            end: '->',
            returnBegin: true,
            illegal: '\\(|#|//|/\\*|\\\\|:|;',
            contains: [PARAMS, hljs.inherit(hljs.TITLE_MODE, {begin: BASIC_ATOM_RE})],
            starts: {
              end: ';|\\.',
              keywords: ERLANG_RESERVED,
              contains: BASIC_MODES
            }
          }, COMMENT, {
            className: 'pp',
            begin: '^-',
            end: '\\.',
            relevance: 0,
            excludeEnd: true,
            returnBegin: true,
            lexemes: '-' + hljs.IDENT_RE,
            keywords: '-module -record -undef -export -ifdef -ifndef -author -copyright -doc -vsn ' + '-import -include -include_lib -compile -define -else -endif -file -behaviour ' + '-behavior -spec',
            contains: [PARAMS]
          }, NUMBER, hljs.QUOTE_STRING_MODE, RECORD_ACCESS, VAR1, VAR2, TUPLE, {begin: /\.$/}]
        };
      };
    }, {}],
    41: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          contains: [{
            begin: /[^\u2401\u0001]+/,
            end: /[\u2401\u0001]/,
            excludeEnd: true,
            returnBegin: true,
            returnEnd: false,
            contains: [{
              begin: /([^\u2401\u0001=]+)/,
              end: /=([^\u2401\u0001=]+)/,
              returnEnd: true,
              returnBegin: false,
              className: 'attribute'
            }, {
              begin: /=/,
              end: /([\u2401\u0001])/,
              excludeEnd: true,
              excludeBegin: true,
              className: 'string'
            }]
          }],
          case_insensitive: true
        };
      };
    }, {}],
    42: [function(require, module, exports) {
      module.exports = function(hljs) {
        var PARAMS = {
          className: 'params',
          begin: '\\(',
          end: '\\)'
        };
        var F_KEYWORDS = {
          constant: '.False. .True.',
          type: 'integer real character complex logical dimension allocatable|10 parameter ' + 'external implicit|10 none double precision assign intent optional pointer ' + 'target in out common equivalence data',
          keyword: 'kind do while private call intrinsic where elsewhere ' + 'type endtype endmodule endselect endinterface end enddo endif if forall endforall only contains default return stop then ' + 'public subroutine|10 function program .and. .or. .not. .le. .eq. .ge. .gt. .lt. ' + 'goto save else use module select case ' + 'access blank direct exist file fmt form formatted iostat name named nextrec number opened rec recl sequential status unformatted unit ' + 'continue format pause cycle exit ' + 'c_null_char c_alert c_backspace c_form_feed flush wait decimal round iomsg ' + 'synchronous nopass non_overridable pass protected volatile abstract extends import ' + 'non_intrinsic value deferred generic final enumerator class associate bind enum ' + 'c_int c_short c_long c_long_long c_signed_char c_size_t c_int8_t c_int16_t c_int32_t c_int64_t c_int_least8_t c_int_least16_t ' + 'c_int_least32_t c_int_least64_t c_int_fast8_t c_int_fast16_t c_int_fast32_t c_int_fast64_t c_intmax_t C_intptr_t c_float c_double ' + 'c_long_double c_float_complex c_double_complex c_long_double_complex c_bool c_char c_null_ptr c_null_funptr ' + 'c_new_line c_carriage_return c_horizontal_tab c_vertical_tab iso_c_binding c_loc c_funloc c_associated  c_f_pointer ' + 'c_ptr c_funptr iso_fortran_env character_storage_size error_unit file_storage_size input_unit iostat_end iostat_eor ' + 'numeric_storage_size output_unit c_f_procpointer ieee_arithmetic ieee_support_underflow_control ' + 'ieee_get_underflow_mode ieee_set_underflow_mode newunit contiguous ' + 'pad position action delim readwrite eor advance nml interface procedure namelist include sequence elemental pure',
          built_in: 'alog alog10 amax0 amax1 amin0 amin1 amod cabs ccos cexp clog csin csqrt dabs dacos dasin datan datan2 dcos dcosh ddim dexp dint ' + 'dlog dlog10 dmax1 dmin1 dmod dnint dsign dsin dsinh dsqrt dtan dtanh float iabs idim idint idnint ifix isign max0 max1 min0 min1 sngl ' + 'algama cdabs cdcos cdexp cdlog cdsin cdsqrt cqabs cqcos cqexp cqlog cqsin cqsqrt dcmplx dconjg derf derfc dfloat dgamma dimag dlgama ' + 'iqint qabs qacos qasin qatan qatan2 qcmplx qconjg qcos qcosh qdim qerf qerfc qexp qgamma qimag qlgama qlog qlog10 qmax1 qmin1 qmod ' + 'qnint qsign qsin qsinh qsqrt qtan qtanh abs acos aimag aint anint asin atan atan2 char cmplx conjg cos cosh exp ichar index int log ' + 'log10 max min nint sign sin sinh sqrt tan tanh print write dim lge lgt lle llt mod nullify allocate deallocate ' + 'adjustl adjustr all allocated any associated bit_size btest ceiling count cshift date_and_time digits dot_product ' + 'eoshift epsilon exponent floor fraction huge iand ibclr ibits ibset ieor ior ishft ishftc lbound len_trim matmul ' + 'maxexponent maxloc maxval merge minexponent minloc minval modulo mvbits nearest pack present product ' + 'radix random_number random_seed range repeat reshape rrspacing scale scan selected_int_kind selected_real_kind ' + 'set_exponent shape size spacing spread sum system_clock tiny transpose trim ubound unpack verify achar iachar transfer ' + 'dble entry dprod cpu_time command_argument_count get_command get_command_argument get_environment_variable is_iostat_end ' + 'ieee_arithmetic ieee_support_underflow_control ieee_get_underflow_mode ieee_set_underflow_mode ' + 'is_iostat_eor move_alloc new_line selected_char_kind same_type_as extends_type_of' + 'acosh asinh atanh bessel_j0 bessel_j1 bessel_jn bessel_y0 bessel_y1 bessel_yn erf erfc erfc_scaled gamma log_gamma hypot norm2 ' + 'atomic_define atomic_ref execute_command_line leadz trailz storage_size merge_bits ' + 'bge bgt ble blt dshiftl dshiftr findloc iall iany iparity image_index lcobound ucobound maskl maskr ' + 'num_images parity popcnt poppar shifta shiftl shiftr this_image'
        };
        return {
          case_insensitive: true,
          aliases: ['f90', 'f95'],
          keywords: F_KEYWORDS,
          contains: [hljs.inherit(hljs.APOS_STRING_MODE, {
            className: 'string',
            relevance: 0
          }), hljs.inherit(hljs.QUOTE_STRING_MODE, {
            className: 'string',
            relevance: 0
          }), {
            className: 'function',
            beginKeywords: 'subroutine function program',
            illegal: '[${=\\n]',
            contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
          }, hljs.COMMENT('!', '$', {relevance: 0}), {
            className: 'number',
            begin: '(?=\\b|\\+|\\-|\\.)(?=\\.\\d|\\d)(?:\\d+)?(?:\\.?\\d*)(?:[de][+-]?\\d+)?\\b\\.?',
            relevance: 0
          }]
        };
      };
    }, {}],
    43: [function(require, module, exports) {
      module.exports = function(hljs) {
        var TYPEPARAM = {
          begin: '<',
          end: '>',
          contains: [hljs.inherit(hljs.TITLE_MODE, {begin: /'[a-zA-Z0-9_]+/})]
        };
        return {
          aliases: ['fs'],
          keywords: 'yield! return! let! do!' + 'abstract and as assert base begin class default delegate do done ' + 'downcast downto elif else end exception extern false finally for ' + 'fun function global if in inherit inline interface internal lazy let ' + 'match member module mutable namespace new null of open or ' + 'override private public rec return sig static struct then to ' + 'true try type upcast use val void when while with yield',
          contains: [{
            className: 'string',
            begin: '@"',
            end: '"',
            contains: [{begin: '""'}]
          }, {
            className: 'string',
            begin: '"""',
            end: '"""'
          }, hljs.COMMENT('\\(\\*', '\\*\\)'), {
            className: 'class',
            beginKeywords: 'type',
            end: '\\(|=|$',
            excludeEnd: true,
            contains: [hljs.UNDERSCORE_TITLE_MODE, TYPEPARAM]
          }, {
            className: 'annotation',
            begin: '\\[<',
            end: '>\\]',
            relevance: 10
          }, {
            className: 'attribute',
            begin: '\\B(\'[A-Za-z])\\b',
            contains: [hljs.BACKSLASH_ESCAPE]
          }, hljs.C_LINE_COMMENT_MODE, hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    44: [function(require, module, exports) {
      module.exports = function(hljs) {
        var GCODE_IDENT_RE = '[A-Z_][A-Z0-9_.]*';
        var GCODE_CLOSE_RE = '\\%';
        var GCODE_KEYWORDS = {
          literal: '',
          built_in: '',
          keyword: 'IF DO WHILE ENDWHILE CALL ENDIF SUB ENDSUB GOTO REPEAT ENDREPEAT ' + 'EQ LT GT NE GE LE OR XOR'
        };
        var GCODE_START = {
          className: 'preprocessor',
          begin: '([O])([0-9]+)'
        };
        var GCODE_CODE = [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.COMMENT(/\(/, /\)/), hljs.inherit(hljs.C_NUMBER_MODE, {begin: '([-+]?([0-9]*\\.?[0-9]+\\.?))|' + hljs.C_NUMBER_RE}), hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), {
          className: 'keyword',
          begin: '([G])([0-9]+\\.?[0-9]?)'
        }, {
          className: 'title',
          begin: '([M])([0-9]+\\.?[0-9]?)'
        }, {
          className: 'title',
          begin: '(VC|VS|#)',
          end: '(\\d+)'
        }, {
          className: 'title',
          begin: '(VZOFX|VZOFY|VZOFZ)'
        }, {
          className: 'built_in',
          begin: '(ATAN|ABS|ACOS|ASIN|SIN|COS|EXP|FIX|FUP|ROUND|LN|TAN)(\\[)',
          end: '([-+]?([0-9]*\\.?[0-9]+\\.?))(\\])'
        }, {
          className: 'label',
          variants: [{
            begin: 'N',
            end: '\\d+',
            illegal: '\\W'
          }]
        }];
        return {
          aliases: ['nc'],
          case_insensitive: true,
          lexemes: GCODE_IDENT_RE,
          keywords: GCODE_KEYWORDS,
          contains: [{
            className: 'preprocessor',
            begin: GCODE_CLOSE_RE
          }, GCODE_START].concat(GCODE_CODE)
        };
      };
    }, {}],
    45: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['feature'],
          keywords: 'Feature Background Ability Business\ Need Scenario Scenarios Scenario\ Outline Scenario\ Template Examples Given And Then But When',
          contains: [{
            className: 'keyword',
            begin: '\\*'
          }, hljs.COMMENT('@[^@\r\n\t ]+', '$'), {
            begin: '\\|',
            end: '\\|\\w*$',
            contains: [{
              className: 'string',
              begin: '[^|]+'
            }]
          }, {
            className: 'variable',
            begin: '<',
            end: '>'
          }, hljs.HASH_COMMENT_MODE, {
            className: 'string',
            begin: '"""',
            end: '"""'
          }, hljs.QUOTE_STRING_MODE]
        };
      };
    }, {}],
    46: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            keyword: 'atomic_uint attribute bool break bvec2 bvec3 bvec4 case centroid coherent const continue default ' + 'discard dmat2 dmat2x2 dmat2x3 dmat2x4 dmat3 dmat3x2 dmat3x3 dmat3x4 dmat4 dmat4x2 dmat4x3 ' + 'dmat4x4 do double dvec2 dvec3 dvec4 else flat float for highp if iimage1D iimage1DArray ' + 'iimage2D iimage2DArray iimage2DMS iimage2DMSArray iimage2DRect iimage3D iimageBuffer iimageCube ' + 'iimageCubeArray image1D image1DArray image2D image2DArray image2DMS image2DMSArray image2DRect ' + 'image3D imageBuffer imageCube imageCubeArray in inout int invariant isampler1D isampler1DArray ' + 'isampler2D isampler2DArray isampler2DMS isampler2DMSArray isampler2DRect isampler3D isamplerBuffer ' + 'isamplerCube isamplerCubeArray ivec2 ivec3 ivec4 layout lowp mat2 mat2x2 mat2x3 mat2x4 mat3 mat3x2 ' + 'mat3x3 mat3x4 mat4 mat4x2 mat4x3 mat4x4 mediump noperspective out patch precision readonly restrict ' + 'return sample sampler1D sampler1DArray sampler1DArrayShadow sampler1DShadow sampler2D sampler2DArray ' + 'sampler2DArrayShadow sampler2DMS sampler2DMSArray sampler2DRect sampler2DRectShadow sampler2DShadow ' + 'sampler3D samplerBuffer samplerCube samplerCubeArray samplerCubeArrayShadow samplerCubeShadow smooth ' + 'struct subroutine switch uimage1D uimage1DArray uimage2D uimage2DArray uimage2DMS uimage2DMSArray ' + 'uimage2DRect uimage3D uimageBuffer uimageCube uimageCubeArray uint uniform usampler1D usampler1DArray ' + 'usampler2D usampler2DArray usampler2DMS usampler2DMSArray usampler2DRect usampler3D usamplerBuffer ' + 'usamplerCube usamplerCubeArray uvec2 uvec3 uvec4 varying vec2 vec3 vec4 void volatile while writeonly',
            built_in: 'gl_BackColor gl_BackLightModelProduct gl_BackLightProduct gl_BackMaterial ' + 'gl_BackSecondaryColor gl_ClipDistance gl_ClipPlane gl_ClipVertex gl_Color ' + 'gl_DepthRange gl_EyePlaneQ gl_EyePlaneR gl_EyePlaneS gl_EyePlaneT gl_Fog gl_FogCoord ' + 'gl_FogFragCoord gl_FragColor gl_FragCoord gl_FragData gl_FragDepth gl_FrontColor ' + 'gl_FrontFacing gl_FrontLightModelProduct gl_FrontLightProduct gl_FrontMaterial ' + 'gl_FrontSecondaryColor gl_InstanceID gl_InvocationID gl_Layer gl_LightModel ' + 'gl_LightSource gl_MaxAtomicCounterBindings gl_MaxAtomicCounterBufferSize ' + 'gl_MaxClipDistances gl_MaxClipPlanes gl_MaxCombinedAtomicCounterBuffers ' + 'gl_MaxCombinedAtomicCounters gl_MaxCombinedImageUniforms gl_MaxCombinedImageUnitsAndFragmentOutputs ' + 'gl_MaxCombinedTextureImageUnits gl_MaxDrawBuffers gl_MaxFragmentAtomicCounterBuffers ' + 'gl_MaxFragmentAtomicCounters gl_MaxFragmentImageUniforms gl_MaxFragmentInputComponents ' + 'gl_MaxFragmentUniformComponents gl_MaxFragmentUniformVectors gl_MaxGeometryAtomicCounterBuffers ' + 'gl_MaxGeometryAtomicCounters gl_MaxGeometryImageUniforms gl_MaxGeometryInputComponents ' + 'gl_MaxGeometryOutputComponents gl_MaxGeometryOutputVertices gl_MaxGeometryTextureImageUnits ' + 'gl_MaxGeometryTotalOutputComponents gl_MaxGeometryUniformComponents gl_MaxGeometryVaryingComponents ' + 'gl_MaxImageSamples gl_MaxImageUnits gl_MaxLights gl_MaxPatchVertices gl_MaxProgramTexelOffset ' + 'gl_MaxTessControlAtomicCounterBuffers gl_MaxTessControlAtomicCounters gl_MaxTessControlImageUniforms ' + 'gl_MaxTessControlInputComponents gl_MaxTessControlOutputComponents gl_MaxTessControlTextureImageUnits ' + 'gl_MaxTessControlTotalOutputComponents gl_MaxTessControlUniformComponents ' + 'gl_MaxTessEvaluationAtomicCounterBuffers gl_MaxTessEvaluationAtomicCounters ' + 'gl_MaxTessEvaluationImageUniforms gl_MaxTessEvaluationInputComponents gl_MaxTessEvaluationOutputComponents ' + 'gl_MaxTessEvaluationTextureImageUnits gl_MaxTessEvaluationUniformComponents ' + 'gl_MaxTessGenLevel gl_MaxTessPatchComponents gl_MaxTextureCoords gl_MaxTextureImageUnits ' + 'gl_MaxTextureUnits gl_MaxVaryingComponents gl_MaxVaryingFloats gl_MaxVaryingVectors ' + 'gl_MaxVertexAtomicCounterBuffers gl_MaxVertexAtomicCounters gl_MaxVertexAttribs ' + 'gl_MaxVertexImageUniforms gl_MaxVertexOutputComponents gl_MaxVertexTextureImageUnits ' + 'gl_MaxVertexUniformComponents gl_MaxVertexUniformVectors gl_MaxViewports gl_MinProgramTexelOffset' + 'gl_ModelViewMatrix gl_ModelViewMatrixInverse gl_ModelViewMatrixInverseTranspose ' + 'gl_ModelViewMatrixTranspose gl_ModelViewProjectionMatrix gl_ModelViewProjectionMatrixInverse ' + 'gl_ModelViewProjectionMatrixInverseTranspose gl_ModelViewProjectionMatrixTranspose ' + 'gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 gl_MultiTexCoord4 ' + 'gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 gl_Normal gl_NormalMatrix ' + 'gl_NormalScale gl_ObjectPlaneQ gl_ObjectPlaneR gl_ObjectPlaneS gl_ObjectPlaneT gl_PatchVerticesIn ' + 'gl_PerVertex gl_Point gl_PointCoord gl_PointSize gl_Position gl_PrimitiveID gl_PrimitiveIDIn ' + 'gl_ProjectionMatrix gl_ProjectionMatrixInverse gl_ProjectionMatrixInverseTranspose ' + 'gl_ProjectionMatrixTranspose gl_SampleID gl_SampleMask gl_SampleMaskIn gl_SamplePosition ' + 'gl_SecondaryColor gl_TessCoord gl_TessLevelInner gl_TessLevelOuter gl_TexCoord gl_TextureEnvColor ' + 'gl_TextureMatrixInverseTranspose gl_TextureMatrixTranspose gl_Vertex gl_VertexID ' + 'gl_ViewportIndex gl_in gl_out EmitStreamVertex EmitVertex EndPrimitive EndStreamPrimitive ' + 'abs acos acosh all any asin asinh atan atanh atomicCounter atomicCounterDecrement ' + 'atomicCounterIncrement barrier bitCount bitfieldExtract bitfieldInsert bitfieldReverse ' + 'ceil clamp cos cosh cross dFdx dFdy degrees determinant distance dot equal exp exp2 faceforward ' + 'findLSB findMSB floatBitsToInt floatBitsToUint floor fma fract frexp ftransform fwidth greaterThan ' + 'greaterThanEqual imageAtomicAdd imageAtomicAnd imageAtomicCompSwap imageAtomicExchange ' + 'imageAtomicMax imageAtomicMin imageAtomicOr imageAtomicXor imageLoad imageStore imulExtended ' + 'intBitsToFloat interpolateAtCentroid interpolateAtOffset interpolateAtSample inverse inversesqrt ' + 'isinf isnan ldexp length lessThan lessThanEqual log log2 matrixCompMult max memoryBarrier ' + 'min mix mod modf noise1 noise2 noise3 noise4 normalize not notEqual outerProduct packDouble2x32 ' + 'packHalf2x16 packSnorm2x16 packSnorm4x8 packUnorm2x16 packUnorm4x8 pow radians reflect refract ' + 'round roundEven shadow1D shadow1DLod shadow1DProj shadow1DProjLod shadow2D shadow2DLod shadow2DProj ' + 'shadow2DProjLod sign sin sinh smoothstep sqrt step tan tanh texelFetch texelFetchOffset texture ' + 'texture1D texture1DLod texture1DProj texture1DProjLod texture2D texture2DLod texture2DProj ' + 'texture2DProjLod texture3D texture3DLod texture3DProj texture3DProjLod textureCube textureCubeLod ' + 'textureGather textureGatherOffset textureGatherOffsets textureGrad textureGradOffset textureLod ' + 'textureLodOffset textureOffset textureProj textureProjGrad textureProjGradOffset textureProjLod ' + 'textureProjLodOffset textureProjOffset textureQueryLod textureSize transpose trunc uaddCarry ' + 'uintBitsToFloat umulExtended unpackDouble2x32 unpackHalf2x16 unpackSnorm2x16 unpackSnorm4x8 ' + 'unpackUnorm2x16 unpackUnorm4x8 usubBorrow gl_TextureMatrix gl_TextureMatrixInverse',
            literal: 'true false'
          },
          illegal: '"',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.C_NUMBER_MODE, {
            className: 'preprocessor',
            begin: '#',
            end: '$'
          }]
        };
      };
    }, {}],
    47: [function(require, module, exports) {
      module.exports = function(hljs) {
        var GO_KEYWORDS = {
          keyword: 'break default func interface select case map struct chan else goto package switch ' + 'const fallthrough if range type continue for import return var go defer',
          constant: 'true false iota nil',
          typename: 'bool byte complex64 complex128 float32 float64 int8 int16 int32 int64 string uint8 ' + 'uint16 uint32 uint64 int uint uintptr rune',
          built_in: 'append cap close complex copy imag len make new panic print println real recover delete'
        };
        return {
          aliases: ["golang"],
          keywords: GO_KEYWORDS,
          illegal: '</',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '\'',
            end: '[^\\\\]\''
          }, {
            className: 'string',
            begin: '`',
            end: '`'
          }, {
            className: 'number',
            begin: hljs.C_NUMBER_RE + '[dflsi]?',
            relevance: 0
          }, hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    48: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          case_insensitive: true,
          keywords: {keyword: 'task project allprojects subprojects artifacts buildscript configurations ' + 'dependencies repositories sourceSets description delete from into include ' + 'exclude source classpath destinationDir includes options sourceCompatibility ' + 'targetCompatibility group flatDir doLast doFirst flatten todir fromdir ant ' + 'def abstract break case catch continue default do else extends final finally ' + 'for if implements instanceof native new private protected public return static ' + 'switch synchronized throw throws transient try volatile while strictfp package ' + 'import false null super this true antlrtask checkstyle codenarc copy boolean ' + 'byte char class double float int interface long short void compile runTime ' + 'file fileTree abs any append asList asWritable call collect compareTo count ' + 'div dump each eachByte eachFile eachLine every find findAll flatten getAt ' + 'getErr getIn getOut getText grep immutable inject inspect intersect invokeMethods ' + 'isCase join leftShift minus multiply newInputStream newOutputStream newPrintWriter ' + 'newReader newWriter next plus pop power previous print println push putAt read ' + 'readBytes readLines reverse reverseEach round size sort splitEachLine step subMap ' + 'times toInteger toList tokenize upto waitForOrKill withPrintWriter withReader ' + 'withStream withWriter withWriterAppend write writeLine'},
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE, hljs.REGEXP_MODE]
        };
      };
    }, {}],
    49: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            typename: 'byte short char int long boolean float double void',
            literal: 'true false null',
            keyword: 'def as in assert trait ' + 'super this abstract static volatile transient public private protected synchronized final ' + 'class interface enum if else for while switch case break default continue ' + 'throw throws try catch finally implements extends new import package return instanceof'
          },
          contains: [hljs.COMMENT('/\\*\\*', '\\*/', {
            relevance: 0,
            contains: [{
              className: 'doctag',
              begin: '@[A-Za-z]+'
            }]
          }), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'string',
            begin: '"""',
            end: '"""'
          }, {
            className: 'string',
            begin: "'''",
            end: "'''"
          }, {
            className: 'string',
            begin: "\\$/",
            end: "/\\$",
            relevance: 10
          }, hljs.APOS_STRING_MODE, {
            className: 'regexp',
            begin: /~?\/[^\/\n]+\//,
            contains: [hljs.BACKSLASH_ESCAPE]
          }, hljs.QUOTE_STRING_MODE, {
            className: 'shebang',
            begin: "^#!/usr/bin/env",
            end: '$',
            illegal: '\n'
          }, hljs.BINARY_NUMBER_MODE, {
            className: 'class',
            beginKeywords: 'class interface trait enum',
            end: '{',
            illegal: ':',
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }, hljs.C_NUMBER_MODE, {
            className: 'annotation',
            begin: '@[A-Za-z]+'
          }, {
            className: 'string',
            begin: /[^\?]{0}[A-Za-z0-9_$]+ *:/
          }, {
            begin: /\?/,
            end: /\:/
          }, {
            className: 'label',
            begin: '^\\s*[A-Za-z0-9_$]+:',
            relevance: 0
          }]
        };
      };
    }, {}],
    50: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          case_insensitive: true,
          contains: [{
            className: 'doctype',
            begin: '^!!!( (5|1\\.1|Strict|Frameset|Basic|Mobile|RDFa|XML\\b.*))?$',
            relevance: 10
          }, hljs.COMMENT('^\\s*(!=#|=#|-#|/).*$', false, {relevance: 0}), {
            begin: '^\\s*(-|=|!=)(?!#)',
            starts: {
              end: '\\n',
              subLanguage: 'ruby'
            }
          }, {
            className: 'tag',
            begin: '^\\s*%',
            contains: [{
              className: 'title',
              begin: '\\w+'
            }, {
              className: 'value',
              begin: '[#\\.][\\w-]+'
            }, {
              begin: '{\\s*',
              end: '\\s*}',
              excludeEnd: true,
              contains: [{
                begin: ':\\w+\\s*=>',
                end: ',\\s+',
                returnBegin: true,
                endsWithParent: true,
                contains: [{
                  className: 'symbol',
                  begin: ':\\w+'
                }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
                  begin: '\\w+',
                  relevance: 0
                }]
              }]
            }, {
              begin: '\\(\\s*',
              end: '\\s*\\)',
              excludeEnd: true,
              contains: [{
                begin: '\\w+\\s*=',
                end: '\\s+',
                returnBegin: true,
                endsWithParent: true,
                contains: [{
                  className: 'attribute',
                  begin: '\\w+',
                  relevance: 0
                }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
                  begin: '\\w+',
                  relevance: 0
                }]
              }]
            }]
          }, {
            className: 'bullet',
            begin: '^\\s*[=~]\\s*',
            relevance: 0
          }, {
            begin: '#{',
            starts: {
              end: '}',
              subLanguage: 'ruby'
            }
          }]
        };
      };
    }, {}],
    51: [function(require, module, exports) {
      module.exports = function(hljs) {
        var EXPRESSION_KEYWORDS = 'each in with if else unless bindattr action collection debugger log outlet template unbound view yield';
        return {
          aliases: ['hbs', 'html.hbs', 'html.handlebars'],
          case_insensitive: true,
          subLanguage: 'xml',
          subLanguageMode: 'continuous',
          contains: [{
            className: 'expression',
            begin: '{{',
            end: '}}',
            contains: [{
              className: 'begin-block',
              begin: '\#[a-zA-Z\-\ \.]+',
              keywords: EXPRESSION_KEYWORDS
            }, {
              className: 'string',
              begin: '"',
              end: '"'
            }, {
              className: 'end-block',
              begin: '\\\/[a-zA-Z\-\ \.]+',
              keywords: EXPRESSION_KEYWORDS
            }, {
              className: 'variable',
              begin: '[a-zA-Z\-\.]+',
              keywords: EXPRESSION_KEYWORDS
            }]
          }]
        };
      };
    }, {}],
    52: [function(require, module, exports) {
      module.exports = function(hljs) {
        var COMMENT_MODES = [hljs.COMMENT('--', '$'), hljs.COMMENT('{-', '-}', {contains: ['self']})];
        var PRAGMA = {
          className: 'pragma',
          begin: '{-#',
          end: '#-}'
        };
        var PREPROCESSOR = {
          className: 'preprocessor',
          begin: '^#',
          end: '$'
        };
        var CONSTRUCTOR = {
          className: 'type',
          begin: '\\b[A-Z][\\w\']*',
          relevance: 0
        };
        var LIST = {
          className: 'container',
          begin: '\\(',
          end: '\\)',
          illegal: '"',
          contains: [PRAGMA, PREPROCESSOR, {
            className: 'type',
            begin: '\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?'
          }, hljs.inherit(hljs.TITLE_MODE, {begin: '[_a-z][\\w\']*'})].concat(COMMENT_MODES)
        };
        var RECORD = {
          className: 'container',
          begin: '{',
          end: '}',
          contains: LIST.contains
        };
        return {
          aliases: ['hs'],
          keywords: 'let in if then else case of where do module import hiding ' + 'qualified type data newtype deriving class instance as default ' + 'infix infixl infixr foreign export ccall stdcall cplusplus ' + 'jvm dotnet safe unsafe family forall mdo proc rec',
          contains: [{
            className: 'module',
            begin: '\\bmodule\\b',
            end: 'where',
            keywords: 'module where',
            contains: [LIST].concat(COMMENT_MODES),
            illegal: '\\W\\.|;'
          }, {
            className: 'import',
            begin: '\\bimport\\b',
            end: '$',
            keywords: 'import|0 qualified as hiding',
            contains: [LIST].concat(COMMENT_MODES),
            illegal: '\\W\\.|;'
          }, {
            className: 'class',
            begin: '^(\\s*)?(class|instance)\\b',
            end: 'where',
            keywords: 'class family instance where',
            contains: [CONSTRUCTOR, LIST].concat(COMMENT_MODES)
          }, {
            className: 'typedef',
            begin: '\\b(data|(new)?type)\\b',
            end: '$',
            keywords: 'data family type newtype deriving',
            contains: [PRAGMA, CONSTRUCTOR, LIST, RECORD].concat(COMMENT_MODES)
          }, {
            className: 'default',
            beginKeywords: 'default',
            end: '$',
            contains: [CONSTRUCTOR, LIST].concat(COMMENT_MODES)
          }, {
            className: 'infix',
            beginKeywords: 'infix infixl infixr',
            end: '$',
            contains: [hljs.C_NUMBER_MODE].concat(COMMENT_MODES)
          }, {
            className: 'foreign',
            begin: '\\bforeign\\b',
            end: '$',
            keywords: 'foreign import export ccall stdcall cplusplus jvm ' + 'dotnet safe unsafe',
            contains: [CONSTRUCTOR, hljs.QUOTE_STRING_MODE].concat(COMMENT_MODES)
          }, {
            className: 'shebang',
            begin: '#!\\/usr\\/bin\\/env\ runhaskell',
            end: '$'
          }, PRAGMA, PREPROCESSOR, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, CONSTRUCTOR, hljs.inherit(hljs.TITLE_MODE, {begin: '^[_a-z][\\w\']*'}), {begin: '->|<-'}].concat(COMMENT_MODES)
        };
      };
    }, {}],
    53: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z_$][a-zA-Z0-9_$]*';
        var IDENT_FUNC_RETURN_TYPE_RE = '([*]|[a-zA-Z_$][a-zA-Z0-9_$]*)';
        return {
          aliases: ['hx'],
          keywords: {
            keyword: 'break callback case cast catch class continue default do dynamic else enum extends extern ' + 'for function here if implements import in inline interface never new override package private ' + 'public return static super switch this throw trace try typedef untyped using var while',
            literal: 'true false null'
          },
          contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.C_NUMBER_MODE, {
            className: 'class',
            beginKeywords: 'class interface',
            end: '{',
            excludeEnd: true,
            contains: [{beginKeywords: 'extends implements'}, hljs.TITLE_MODE]
          }, {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            keywords: 'if else elseif end error'
          }, {
            className: 'function',
            beginKeywords: 'function',
            end: '[{;]',
            excludeEnd: true,
            illegal: '\\S',
            contains: [hljs.TITLE_MODE, {
              className: 'params',
              begin: '\\(',
              end: '\\)',
              contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
            }, {
              className: 'type',
              begin: ':',
              end: IDENT_FUNC_RETURN_TYPE_RE,
              relevance: 10
            }]
          }]
        };
      };
    }, {}],
    54: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['https'],
          illegal: '\\S',
          contains: [{
            className: 'status',
            begin: '^HTTP/[0-9\\.]+',
            end: '$',
            contains: [{
              className: 'number',
              begin: '\\b\\d{3}\\b'
            }]
          }, {
            className: 'request',
            begin: '^[A-Z]+ (.*?) HTTP/[0-9\\.]+$',
            returnBegin: true,
            end: '$',
            contains: [{
              className: 'string',
              begin: ' ',
              end: ' ',
              excludeBegin: true,
              excludeEnd: true
            }]
          }, {
            className: 'attribute',
            begin: '^\\w',
            end: ': ',
            excludeEnd: true,
            illegal: '\\n|\\s|=',
            starts: {
              className: 'string',
              end: '$'
            }
          }, {
            begin: '\\n\\n',
            starts: {
              subLanguage: '',
              endsWithParent: true
            }
          }]
        };
      };
    }, {}],
    55: [function(require, module, exports) {
      module.exports = function(hljs) {
        var START_BRACKET = '\\[';
        var END_BRACKET = '\\]';
        return {
          aliases: ['i7'],
          case_insensitive: true,
          keywords: {keyword: 'thing|10 room|10 person|10 man|10 woman|10 animal|10 container ' + 'supporter|10 backdrop|10 door|10 ' + 'scenery|10 open closed|10 locked|10 inside|10 gender|10 ' + 'is are say|10 understand|10 ' + 'kind|10 of rule|10'},
          contains: [{
            className: 'string',
            begin: '"',
            end: '"',
            relevance: 0,
            contains: [{
              className: 'subst',
              begin: START_BRACKET,
              end: END_BRACKET
            }]
          }, {
            className: 'title',
            beginKeywords: '^Volume ^Book ^Part ^Chapter ^Section',
            end: '$',
            relevance: 10
          }, {
            className: 'title',
            beginKeywords: '^Table',
            end: '$',
            relevance: 10
          }, {
            begin: '^\\b(Check|Carry out|Report|Instead of|To|Rule|When|Before|After)',
            end: ':',
            contains: [{
              begin: '\\b\\(This',
              end: '\\)',
              relevance: 10
            }],
            relevance: 10
          }, {
            className: 'comment',
            begin: START_BRACKET,
            end: END_BRACKET,
            contains: ['self']
          }]
        };
      };
    }, {}],
    56: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          case_insensitive: true,
          illegal: /\S/,
          contains: [hljs.COMMENT(';', '$'), {
            className: 'title',
            begin: '^\\[',
            end: '\\]'
          }, {
            className: 'setting',
            begin: '^[a-z0-9\\[\\]_-]+[ \\t]*=[ \\t]*',
            end: '$',
            contains: [{
              className: 'value',
              endsWithParent: true,
              keywords: 'on off true false yes no',
              contains: [hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE],
              relevance: 0
            }]
          }]
        };
      };
    }, {}],
    57: [function(require, module, exports) {
      module.exports = function(hljs) {
        var GENERIC_IDENT_RE = hljs.UNDERSCORE_IDENT_RE + '(<' + hljs.UNDERSCORE_IDENT_RE + '>)?';
        var KEYWORDS = 'false synchronized int abstract float private char boolean static null if const ' + 'for true while long strictfp finally protected import native final void ' + 'enum else break transient catch instanceof byte super volatile case assert short ' + 'package default double public try this switch continue throws protected public private';
        var JAVA_NUMBER_RE = '\\b' + '(' + '0[bB]([01]+[01_]+[01]+|[01]+)' + '|' + '0[xX]([a-fA-F0-9]+[a-fA-F0-9_]+[a-fA-F0-9]+|[a-fA-F0-9]+)' + '|' + '(' + '([\\d]+[\\d_]+[\\d]+|[\\d]+)(\\.([\\d]+[\\d_]+[\\d]+|[\\d]+))?' + '|' + '\\.([\\d]+[\\d_]+[\\d]+|[\\d]+)' + ')' + '([eE][-+]?\\d+)?' + ')' + '[lLfF]?';
        var JAVA_NUMBER_MODE = {
          className: 'number',
          begin: JAVA_NUMBER_RE,
          relevance: 0
        };
        return {
          aliases: ['jsp'],
          keywords: KEYWORDS,
          illegal: /<\//,
          contains: [hljs.COMMENT('/\\*\\*', '\\*/', {
            relevance: 0,
            contains: [{
              className: 'doctag',
              begin: '@[A-Za-z]+'
            }]
          }), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'class',
            beginKeywords: 'class interface',
            end: /[{;=]/,
            excludeEnd: true,
            keywords: 'class interface',
            illegal: /[:"\[\]]/,
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }, {
            beginKeywords: 'new throw return else',
            relevance: 0
          }, {
            className: 'function',
            begin: '(' + GENERIC_IDENT_RE + '\\s+)+' + hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
            returnBegin: true,
            end: /[{;=]/,
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: [{
              begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
              returnBegin: true,
              relevance: 0,
              contains: [hljs.UNDERSCORE_TITLE_MODE]
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS,
              relevance: 0,
              contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, hljs.C_BLOCK_COMMENT_MODE]
            }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }, JAVA_NUMBER_MODE, {
            className: 'annotation',
            begin: '@[A-Za-z]+'
          }]
        };
      };
    }, {}],
    58: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['js'],
          keywords: {
            keyword: 'in of if for while finally var new function do return void else break catch ' + 'instanceof with throw case default try this switch continue typeof delete ' + 'let yield const export super debugger as async await',
            literal: 'true false null undefined NaN Infinity',
            built_in: 'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' + 'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' + 'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' + 'TypeError URIError Number Math Date String RegExp Array Float32Array ' + 'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' + 'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' + 'module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect ' + 'Promise'
          },
          contains: [{
            className: 'pi',
            relevance: 10,
            begin: /^\s*['"]use (strict|asm)['"]/
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '`',
            end: '`',
            contains: [hljs.BACKSLASH_ESCAPE, {
              className: 'subst',
              begin: '\\$\\{',
              end: '\\}'
            }]
          }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'number',
            variants: [{begin: '\\b(0[bB][01]+)'}, {begin: '\\b(0[oO][0-7]+)'}, {begin: hljs.C_NUMBER_RE}],
            relevance: 0
          }, {
            begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
            keywords: 'return throw case',
            contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.REGEXP_MODE, {
              begin: /</,
              end: />\s*[);\]]/,
              relevance: 0,
              subLanguage: 'xml'
            }],
            relevance: 0
          }, {
            className: 'function',
            beginKeywords: 'function',
            end: /\{/,
            excludeEnd: true,
            contains: [hljs.inherit(hljs.TITLE_MODE, {begin: /[A-Za-z$_][0-9A-Za-z$_]*/}), {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              excludeBegin: true,
              excludeEnd: true,
              contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE],
              illegal: /["'\(]/
            }],
            illegal: /\[|%/
          }, {begin: /\$[(.]/}, {
            begin: '\\.' + hljs.IDENT_RE,
            relevance: 0
          }, {
            beginKeywords: 'import',
            end: '[;$]',
            keywords: 'import from as',
            contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
          }, {
            className: 'class',
            beginKeywords: 'class',
            end: /[{;=]/,
            excludeEnd: true,
            illegal: /[:"\[\]]/,
            contains: [{beginKeywords: 'extends'}, hljs.UNDERSCORE_TITLE_MODE]
          }]
        };
      };
    }, {}],
    59: [function(require, module, exports) {
      module.exports = function(hljs) {
        var LITERALS = {literal: 'true false null'};
        var TYPES = [hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE];
        var VALUE_CONTAINER = {
          className: 'value',
          end: ',',
          endsWithParent: true,
          excludeEnd: true,
          contains: TYPES,
          keywords: LITERALS
        };
        var OBJECT = {
          begin: '{',
          end: '}',
          contains: [{
            className: 'attribute',
            begin: '\\s*"',
            end: '"\\s*:\\s*',
            excludeBegin: true,
            excludeEnd: true,
            contains: [hljs.BACKSLASH_ESCAPE],
            illegal: '\\n',
            starts: VALUE_CONTAINER
          }],
          illegal: '\\S'
        };
        var ARRAY = {
          begin: '\\[',
          end: '\\]',
          contains: [hljs.inherit(VALUE_CONTAINER, {className: null})],
          illegal: '\\S'
        };
        TYPES.splice(TYPES.length, 0, OBJECT, ARRAY);
        return {
          contains: TYPES,
          keywords: LITERALS,
          illegal: '\\S'
        };
      };
    }, {}],
    60: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = {
          keyword: 'in abstract baremodule begin bitstype break catch ccall const continue do else elseif end export ' + 'finally for function global if immutable import importall let local macro module quote return try type ' + 'typealias using while',
          literal: 'true false ANY ARGS CPU_CORES C_NULL DL_LOAD_PATH DevNull ENDIAN_BOM ENV I|0 Inf Inf16 Inf32 ' + 'InsertionSort JULIA_HOME LOAD_PATH MS_ASYNC MS_INVALIDATE MS_SYNC MergeSort NaN NaN16 NaN32 OS_NAME QuickSort ' + 'RTLD_DEEPBIND RTLD_FIRST RTLD_GLOBAL RTLD_LAZY RTLD_LOCAL RTLD_NODELETE RTLD_NOLOAD RTLD_NOW RoundDown ' + 'RoundFromZero RoundNearest RoundToZero RoundUp STDERR STDIN STDOUT VERSION WORD_SIZE catalan cglobal e eu ' + 'eulergamma golden im nothing pi γ π φ',
          built_in: 'ASCIIString AbstractArray AbstractRNG AbstractSparseArray Any ArgumentError Array Associative Base64Pipe ' + 'Bidiagonal BigFloat BigInt BitArray BitMatrix BitVector Bool BoundsError Box CFILE Cchar Cdouble Cfloat Char ' + 'CharString Cint Clong Clonglong ClusterManager Cmd Coff_t Colon Complex Complex128 Complex32 Complex64 ' + 'Condition Cptrdiff_t Cshort Csize_t Cssize_t Cuchar Cuint Culong Culonglong Cushort Cwchar_t DArray DataType ' + 'DenseArray Diagonal Dict DimensionMismatch DirectIndexString Display DivideError DomainError EOFError ' + 'EachLine Enumerate ErrorException Exception Expr Factorization FileMonitor FileOffset Filter Float16 Float32 ' + 'Float64 FloatRange FloatingPoint Function GetfieldNode GotoNode Hermitian IO IOBuffer IOStream IPv4 IPv6 ' + 'InexactError Int Int128 Int16 Int32 Int64 Int8 IntSet Integer InterruptException IntrinsicFunction KeyError ' + 'LabelNode LambdaStaticData LineNumberNode LoadError LocalProcess MIME MathConst MemoryError MersenneTwister ' + 'Method MethodError MethodTable Module NTuple NewvarNode Nothing Number ObjectIdDict OrdinalRange ' + 'OverflowError ParseError PollingFileWatcher ProcessExitedException ProcessGroup Ptr QuoteNode Range Range1 ' + 'Ranges Rational RawFD Real Regex RegexMatch RemoteRef RepString RevString RopeString RoundingMode Set ' + 'SharedArray Signed SparseMatrixCSC StackOverflowError Stat StatStruct StepRange String SubArray SubString ' + 'SymTridiagonal Symbol SymbolNode Symmetric SystemError Task TextDisplay Timer TmStruct TopNode Triangular ' + 'Tridiagonal Type TypeConstructor TypeError TypeName TypeVar UTF16String UTF32String UTF8String UdpSocket ' + 'Uint Uint128 Uint16 Uint32 Uint64 Uint8 UndefRefError UndefVarError UniformScaling UnionType UnitRange ' + 'Unsigned Vararg VersionNumber WString WeakKeyDict WeakRef Woodbury Zip'
        };
        var VARIABLE_NAME_RE = "[A-Za-z_\\u00A1-\\uFFFF][A-Za-z_0-9\\u00A1-\\uFFFF]*";
        var DEFAULT = {
          lexemes: VARIABLE_NAME_RE,
          keywords: KEYWORDS
        };
        var TYPE_ANNOTATION = {
          className: "type-annotation",
          begin: /::/
        };
        var SUBTYPE = {
          className: "subtype",
          begin: /<:/
        };
        var NUMBER = {
          className: "number",
          begin: /(\b0x[\d_]*(\.[\d_]*)?|0x\.\d[\d_]*)p[-+]?\d+|\b0[box][a-fA-F0-9][a-fA-F0-9_]*|(\b\d[\d_]*(\.[\d_]*)?|\.\d[\d_]*)([eEfF][-+]?\d+)?/,
          relevance: 0
        };
        var CHAR = {
          className: "char",
          begin: /'(.|\\[xXuU][a-zA-Z0-9]+)'/
        };
        var INTERPOLATION = {
          className: 'subst',
          begin: /\$\(/,
          end: /\)/,
          keywords: KEYWORDS
        };
        var INTERPOLATED_VARIABLE = {
          className: 'variable',
          begin: "\\$" + VARIABLE_NAME_RE
        };
        var STRING = {
          className: "string",
          contains: [hljs.BACKSLASH_ESCAPE, INTERPOLATION, INTERPOLATED_VARIABLE],
          variants: [{
            begin: /\w*"/,
            end: /"\w*/
          }, {
            begin: /\w*"""/,
            end: /"""\w*/
          }]
        };
        var COMMAND = {
          className: "string",
          contains: [hljs.BACKSLASH_ESCAPE, INTERPOLATION, INTERPOLATED_VARIABLE],
          begin: '`',
          end: '`'
        };
        var MACROCALL = {
          className: "macrocall",
          begin: "@" + VARIABLE_NAME_RE
        };
        var COMMENT = {
          className: "comment",
          variants: [{
            begin: "#=",
            end: "=#",
            relevance: 10
          }, {
            begin: '#',
            end: '$'
          }]
        };
        DEFAULT.contains = [NUMBER, CHAR, TYPE_ANNOTATION, SUBTYPE, STRING, COMMAND, MACROCALL, COMMENT, hljs.HASH_COMMENT_MODE];
        INTERPOLATION.contains = DEFAULT.contains;
        return DEFAULT;
      };
    }, {}],
    61: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = 'val var get set class trait object public open private protected ' + 'final enum if else do while for when break continue throw try catch finally ' + 'import package is as in return fun override default companion reified inline volatile transient native';
        return {
          keywords: {
            typename: 'Byte Short Char Int Long Boolean Float Double Void Unit Nothing',
            literal: 'true false null',
            keyword: KEYWORDS
          },
          contains: [hljs.COMMENT('/\\*\\*', '\\*/', {
            relevance: 0,
            contains: [{
              className: 'doctag',
              begin: '@[A-Za-z]+'
            }]
          }), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'type',
            begin: /</,
            end: />/,
            returnBegin: true,
            excludeEnd: false,
            relevance: 0
          }, {
            className: 'function',
            beginKeywords: 'fun',
            end: '[(]|$',
            returnBegin: true,
            excludeEnd: true,
            keywords: KEYWORDS,
            illegal: /fun\s+(<.*>)?[^\s\(]+(\s+[^\s\(]+)\s*=/,
            relevance: 5,
            contains: [{
              begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
              returnBegin: true,
              relevance: 0,
              contains: [hljs.UNDERSCORE_TITLE_MODE]
            }, {
              className: 'type',
              begin: /</,
              end: />/,
              keywords: 'reified',
              relevance: 0
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              keywords: KEYWORDS,
              relevance: 0,
              illegal: /\([^\(,\s:]+,/,
              contains: [{
                className: 'typename',
                begin: /:\s*/,
                end: /\s*[=\)]/,
                excludeBegin: true,
                returnEnd: true,
                relevance: 0
              }]
            }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
          }, {
            className: 'class',
            beginKeywords: 'class trait',
            end: /[:\{(]|$/,
            excludeEnd: true,
            illegal: 'extends implements',
            contains: [hljs.UNDERSCORE_TITLE_MODE, {
              className: 'type',
              begin: /</,
              end: />/,
              excludeBegin: true,
              excludeEnd: true,
              relevance: 0
            }, {
              className: 'typename',
              begin: /[,:]\s*/,
              end: /[<\(,]|$/,
              excludeBegin: true,
              returnEnd: true
            }]
          }, {
            className: 'variable',
            beginKeywords: 'var val',
            end: /\s*[=:$]/,
            excludeEnd: true
          }, hljs.QUOTE_STRING_MODE, {
            className: 'shebang',
            begin: "^#!/usr/bin/env",
            end: '$',
            illegal: '\n'
          }, hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    62: [function(require, module, exports) {
      module.exports = function(hljs) {
        var LASSO_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_.]*';
        var LASSO_ANGLE_RE = '<\\?(lasso(script)?|=)';
        var LASSO_CLOSE_RE = '\\]|\\?>';
        var LASSO_KEYWORDS = {
          literal: 'true false none minimal full all void and or not ' + 'bw nbw ew new cn ncn lt lte gt gte eq neq rx nrx ft',
          built_in: 'array date decimal duration integer map pair string tag xml null ' + 'boolean bytes keyword list locale queue set stack staticarray ' + 'local var variable global data self inherited',
          keyword: 'error_code error_msg error_pop error_push error_reset cache ' + 'database_names database_schemanames database_tablenames define_tag ' + 'define_type email_batch encode_set html_comment handle handle_error ' + 'header if inline iterate ljax_target link link_currentaction ' + 'link_currentgroup link_currentrecord link_detail link_firstgroup ' + 'link_firstrecord link_lastgroup link_lastrecord link_nextgroup ' + 'link_nextrecord link_prevgroup link_prevrecord log loop ' + 'namespace_using output_none portal private protect records referer ' + 'referrer repeating resultset rows search_args search_arguments ' + 'select sort_args sort_arguments thread_atomic value_list while ' + 'abort case else if_empty if_false if_null if_true loop_abort ' + 'loop_continue loop_count params params_up return return_value ' + 'run_children soap_definetag soap_lastrequest soap_lastresponse ' + 'tag_name ascending average by define descending do equals ' + 'frozen group handle_failure import in into join let match max ' + 'min on order parent protected provide public require returnhome ' + 'skip split_thread sum take thread to trait type where with ' + 'yield yieldhome'
        };
        var HTML_COMMENT = hljs.COMMENT('<!--', '-->', {relevance: 0});
        var LASSO_NOPROCESS = {
          className: 'preprocessor',
          begin: '\\[noprocess\\]',
          starts: {
            className: 'markup',
            end: '\\[/noprocess\\]',
            returnEnd: true,
            contains: [HTML_COMMENT]
          }
        };
        var LASSO_START = {
          className: 'preprocessor',
          begin: '\\[/noprocess|' + LASSO_ANGLE_RE
        };
        var LASSO_DATAMEMBER = {
          className: 'variable',
          begin: '\'' + LASSO_IDENT_RE + '\''
        };
        var LASSO_CODE = [hljs.COMMENT('/\\*\\*!', '\\*/'), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.inherit(hljs.C_NUMBER_MODE, {begin: hljs.C_NUMBER_RE + '|(-?infinity|nan)\\b'}), hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), {
          className: 'string',
          begin: '`',
          end: '`'
        }, {
          className: 'variable',
          variants: [{begin: '[#$]' + LASSO_IDENT_RE}, {
            begin: '#',
            end: '\\d+',
            illegal: '\\W'
          }]
        }, {
          className: 'tag',
          begin: '::\\s*',
          end: LASSO_IDENT_RE,
          illegal: '\\W'
        }, {
          className: 'attribute',
          variants: [{
            begin: '-' + hljs.UNDERSCORE_IDENT_RE,
            relevance: 0
          }, {begin: '(\\.\\.\\.)'}]
        }, {
          className: 'subst',
          variants: [{
            begin: '->\\s*',
            contains: [LASSO_DATAMEMBER]
          }, {
            begin: ':=|/(?!\\w)=?|[-+*%=<>&|!?\\\\]+',
            relevance: 0
          }]
        }, {
          className: 'built_in',
          begin: '\\.\\.?\\s*',
          relevance: 0,
          contains: [LASSO_DATAMEMBER]
        }, {
          className: 'class',
          beginKeywords: 'define',
          returnEnd: true,
          end: '\\(|=>',
          contains: [hljs.inherit(hljs.TITLE_MODE, {begin: hljs.UNDERSCORE_IDENT_RE + '(=(?!>))?'})]
        }];
        return {
          aliases: ['ls', 'lassoscript'],
          case_insensitive: true,
          lexemes: LASSO_IDENT_RE + '|&[lg]t;',
          keywords: LASSO_KEYWORDS,
          contains: [{
            className: 'preprocessor',
            begin: LASSO_CLOSE_RE,
            relevance: 0,
            starts: {
              className: 'markup',
              end: '\\[|' + LASSO_ANGLE_RE,
              returnEnd: true,
              relevance: 0,
              contains: [HTML_COMMENT]
            }
          }, LASSO_NOPROCESS, LASSO_START, {
            className: 'preprocessor',
            begin: '\\[no_square_brackets',
            starts: {
              end: '\\[/no_square_brackets\\]',
              lexemes: LASSO_IDENT_RE + '|&[lg]t;',
              keywords: LASSO_KEYWORDS,
              contains: [{
                className: 'preprocessor',
                begin: LASSO_CLOSE_RE,
                relevance: 0,
                starts: {
                  className: 'markup',
                  end: '\\[noprocess\\]|' + LASSO_ANGLE_RE,
                  returnEnd: true,
                  contains: [HTML_COMMENT]
                }
              }, LASSO_NOPROCESS, LASSO_START].concat(LASSO_CODE)
            }
          }, {
            className: 'preprocessor',
            begin: '\\[',
            relevance: 0
          }, {
            className: 'shebang',
            begin: '^#!.+lasso9\\b',
            relevance: 10
          }].concat(LASSO_CODE)
        };
      };
    }, {}],
    63: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE = '[\\w-]+';
        var INTERP_IDENT_RE = '(' + IDENT_RE + '|@{' + IDENT_RE + '})';
        var RULES = [],
            VALUE = [];
        var STRING_MODE = function(c) {
          return {
            className: 'string',
            begin: '~?' + c + '.*?' + c
          };
        };
        var IDENT_MODE = function(name, begin, relevance) {
          return {
            className: name,
            begin: begin,
            relevance: relevance
          };
        };
        var FUNCT_MODE = function(name, ident, obj) {
          return hljs.inherit({
            className: name,
            begin: ident + '\\(',
            end: '\\(',
            returnBegin: true,
            excludeEnd: true,
            relevance: 0
          }, obj);
        };
        var PARENS_MODE = {
          begin: '\\(',
          end: '\\)',
          contains: VALUE,
          relevance: 0
        };
        VALUE.push(hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, STRING_MODE("'"), STRING_MODE('"'), hljs.CSS_NUMBER_MODE, IDENT_MODE('hexcolor', '#[0-9A-Fa-f]+\\b'), FUNCT_MODE('function', '(url|data-uri)', {starts: {
            className: 'string',
            end: '[\\)\\n]',
            excludeEnd: true
          }}), FUNCT_MODE('function', IDENT_RE), PARENS_MODE, IDENT_MODE('variable', '@@?' + IDENT_RE, 10), IDENT_MODE('variable', '@{' + IDENT_RE + '}'), IDENT_MODE('built_in', '~?`[^`]*?`'), {
          className: 'attribute',
          begin: IDENT_RE + '\\s*:',
          end: ':',
          returnBegin: true,
          excludeEnd: true
        });
        var VALUE_WITH_RULESETS = VALUE.concat({
          begin: '{',
          end: '}',
          contains: RULES
        });
        var MIXIN_GUARD_MODE = {
          beginKeywords: 'when',
          endsWithParent: true,
          contains: [{beginKeywords: 'and not'}].concat(VALUE)
        };
        var RULE_MODE = {
          className: 'attribute',
          begin: INTERP_IDENT_RE,
          end: ':',
          excludeEnd: true,
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE],
          illegal: /\S/,
          starts: {
            end: '[;}]',
            returnEnd: true,
            contains: VALUE,
            illegal: '[<=$]'
          }
        };
        var AT_RULE_MODE = {
          className: 'at_rule',
          begin: '@(import|media|charset|font-face|(-[a-z]+-)?keyframes|supports|document|namespace|page|viewport|host)\\b',
          starts: {
            end: '[;{}]',
            returnEnd: true,
            contains: VALUE,
            relevance: 0
          }
        };
        var VAR_RULE_MODE = {
          className: 'variable',
          variants: [{
            begin: '@' + IDENT_RE + '\\s*:',
            relevance: 15
          }, {begin: '@' + IDENT_RE}],
          starts: {
            end: '[;}]',
            returnEnd: true,
            contains: VALUE_WITH_RULESETS
          }
        };
        var SELECTOR_MODE = {
          variants: [{
            begin: '[\\.#:&\\[]',
            end: '[;{}]'
          }, {
            begin: INTERP_IDENT_RE + '[^;]*{',
            end: '{'
          }],
          returnBegin: true,
          returnEnd: true,
          illegal: '[<=\'$"]',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, MIXIN_GUARD_MODE, IDENT_MODE('keyword', 'all\\b'), IDENT_MODE('variable', '@{' + IDENT_RE + '}'), IDENT_MODE('tag', INTERP_IDENT_RE + '%?', 0), IDENT_MODE('id', '#' + INTERP_IDENT_RE), IDENT_MODE('class', '\\.' + INTERP_IDENT_RE, 0), IDENT_MODE('keyword', '&', 0), FUNCT_MODE('pseudo', ':not'), FUNCT_MODE('keyword', ':extend'), IDENT_MODE('pseudo', '::?' + INTERP_IDENT_RE), {
            className: 'attr_selector',
            begin: '\\[',
            end: '\\]'
          }, {
            begin: '\\(',
            end: '\\)',
            contains: VALUE_WITH_RULESETS
          }, {begin: '!important'}]
        };
        RULES.push(hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, AT_RULE_MODE, VAR_RULE_MODE, SELECTOR_MODE, RULE_MODE);
        return {
          case_insensitive: true,
          illegal: '[=>\'/<($"]',
          contains: RULES
        };
      };
    }, {}],
    64: [function(require, module, exports) {
      module.exports = function(hljs) {
        var LISP_IDENT_RE = '[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#!]*';
        var MEC_RE = '\\|[^]*?\\|';
        var LISP_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s|D|E|F|L|S)(\\+|\\-)?\\d+)?';
        var SHEBANG = {
          className: 'shebang',
          begin: '^#!',
          end: '$'
        };
        var LITERAL = {
          className: 'literal',
          begin: '\\b(t{1}|nil)\\b'
        };
        var NUMBER = {
          className: 'number',
          variants: [{
            begin: LISP_SIMPLE_NUMBER_RE,
            relevance: 0
          }, {begin: '#(b|B)[0-1]+(/[0-1]+)?'}, {begin: '#(o|O)[0-7]+(/[0-7]+)?'}, {begin: '#(x|X)[0-9a-fA-F]+(/[0-9a-fA-F]+)?'}, {
            begin: '#(c|C)\\(' + LISP_SIMPLE_NUMBER_RE + ' +' + LISP_SIMPLE_NUMBER_RE,
            end: '\\)'
          }]
        };
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null});
        var COMMENT = hljs.COMMENT(';', '$', {relevance: 0});
        var VARIABLE = {
          className: 'variable',
          begin: '\\*',
          end: '\\*'
        };
        var KEYWORD = {
          className: 'keyword',
          begin: '[:&]' + LISP_IDENT_RE
        };
        var IDENT = {
          begin: LISP_IDENT_RE,
          relevance: 0
        };
        var MEC = {begin: MEC_RE};
        var QUOTED_LIST = {
          begin: '\\(',
          end: '\\)',
          contains: ['self', LITERAL, STRING, NUMBER, IDENT]
        };
        var QUOTED = {
          className: 'quoted',
          contains: [NUMBER, STRING, VARIABLE, KEYWORD, QUOTED_LIST, IDENT],
          variants: [{
            begin: '[\'`]\\(',
            end: '\\)'
          }, {
            begin: '\\(quote ',
            end: '\\)',
            keywords: 'quote'
          }, {begin: '\'' + MEC_RE}]
        };
        var QUOTED_ATOM = {
          className: 'quoted',
          variants: [{begin: '\'' + LISP_IDENT_RE}, {begin: '#\'' + LISP_IDENT_RE + '(::' + LISP_IDENT_RE + ')*'}]
        };
        var LIST = {
          className: 'list',
          begin: '\\(\\s*',
          end: '\\)'
        };
        var BODY = {
          endsWithParent: true,
          relevance: 0
        };
        LIST.contains = [{
          className: 'keyword',
          variants: [{begin: LISP_IDENT_RE}, {begin: MEC_RE}]
        }, BODY];
        BODY.contains = [QUOTED, QUOTED_ATOM, LIST, LITERAL, NUMBER, STRING, COMMENT, VARIABLE, KEYWORD, MEC, IDENT];
        return {
          illegal: /\S/,
          contains: [NUMBER, SHEBANG, LITERAL, STRING, COMMENT, QUOTED, QUOTED_ATOM, LIST, IDENT]
        };
      };
    }, {}],
    65: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VARIABLE = {
          className: 'variable',
          begin: '\\b[gtps][A-Z]+[A-Za-z0-9_\\-]*\\b|\\$_[A-Z]+',
          relevance: 0
        };
        var COMMENT_MODES = [hljs.C_BLOCK_COMMENT_MODE, hljs.HASH_COMMENT_MODE, hljs.COMMENT('--', '$'), hljs.COMMENT('[^:]//', '$')];
        var TITLE1 = hljs.inherit(hljs.TITLE_MODE, {variants: [{begin: '\\b_*rig[A-Z]+[A-Za-z0-9_\\-]*'}, {begin: '\\b_[a-z0-9\\-]+'}]});
        var TITLE2 = hljs.inherit(hljs.TITLE_MODE, {begin: '\\b([A-Za-z0-9_\\-]+)\\b'});
        return {
          case_insensitive: false,
          keywords: {
            keyword: '$_COOKIE $_FILES $_GET $_GET_BINARY $_GET_RAW $_POST $_POST_BINARY $_POST_RAW $_SESSION $_SERVER ' + 'codepoint codepoints segment segments codeunit codeunits sentence sentences trueWord trueWords paragraph ' + 'after byte bytes english the until http forever descending using line real8 with seventh ' + 'for stdout finally element word words fourth before black ninth sixth characters chars stderr ' + 'uInt1 uInt1s uInt2 uInt2s stdin string lines relative rel any fifth items from middle mid ' + 'at else of catch then third it file milliseconds seconds second secs sec int1 int1s int4 ' + 'int4s internet int2 int2s normal text item last long detailed effective uInt4 uInt4s repeat ' + 'end repeat URL in try into switch to words https token binfile each tenth as ticks tick ' + 'system real4 by dateItems without char character ascending eighth whole dateTime numeric short ' + 'first ftp integer abbreviated abbr abbrev private case while if',
            constant: 'SIX TEN FORMFEED NINE ZERO NONE SPACE FOUR FALSE COLON CRLF PI COMMA ENDOFFILE EOF EIGHT FIVE ' + 'QUOTE EMPTY ONE TRUE RETURN CR LINEFEED RIGHT BACKSLASH NULL SEVEN TAB THREE TWO ' + 'six ten formfeed nine zero none space four false colon crlf pi comma endoffile eof eight five ' + 'quote empty one true return cr linefeed right backslash null seven tab three two ' + 'RIVERSION RISTATE FILE_READ_MODE FILE_WRITE_MODE FILE_WRITE_MODE DIR_WRITE_MODE FILE_READ_UMASK ' + 'FILE_WRITE_UMASK DIR_READ_UMASK DIR_WRITE_UMASK',
            operator: 'div mod wrap and or bitAnd bitNot bitOr bitXor among not in a an within ' + 'contains ends with begins the keys of keys',
            built_in: 'put abs acos aliasReference annuity arrayDecode arrayEncode asin atan atan2 average avg avgDev base64Decode ' + 'base64Encode baseConvert binaryDecode binaryEncode byteOffset byteToNum cachedURL cachedURLs charToNum ' + 'cipherNames codepointOffset codepointProperty codepointToNum codeunitOffset commandNames compound compress ' + 'constantNames cos date dateFormat decompress directories ' + 'diskSpace DNSServers exp exp1 exp2 exp10 extents files flushEvents folders format functionNames geometricMean global ' + 'globals hasMemory harmonicMean hostAddress hostAddressToName hostName hostNameToAddress isNumber ISOToMac itemOffset ' + 'keys len length libURLErrorData libUrlFormData libURLftpCommand libURLLastHTTPHeaders libURLLastRHHeaders ' + 'libUrlMultipartFormAddPart libUrlMultipartFormData libURLVersion lineOffset ln ln1 localNames log log2 log10 ' + 'longFilePath lower macToISO matchChunk matchText matrixMultiply max md5Digest median merge millisec ' + 'millisecs millisecond milliseconds min monthNames nativeCharToNum normalizeText num number numToByte numToChar ' + 'numToCodepoint numToNativeChar offset open openfiles openProcesses openProcessIDs openSockets ' + 'paragraphOffset paramCount param params peerAddress pendingMessages platform popStdDev populationStandardDeviation ' + 'populationVariance popVariance processID random randomBytes replaceText result revCreateXMLTree revCreateXMLTreeFromFile ' + 'revCurrentRecord revCurrentRecordIsFirst revCurrentRecordIsLast revDatabaseColumnCount revDatabaseColumnIsNull ' + 'revDatabaseColumnLengths revDatabaseColumnNames revDatabaseColumnNamed revDatabaseColumnNumbered ' + 'revDatabaseColumnTypes revDatabaseConnectResult revDatabaseCursors revDatabaseID revDatabaseTableNames ' + 'revDatabaseType revDataFromQuery revdb_closeCursor revdb_columnbynumber revdb_columncount revdb_columnisnull ' + 'revdb_columnlengths revdb_columnnames revdb_columntypes revdb_commit revdb_connect revdb_connections ' + 'revdb_connectionerr revdb_currentrecord revdb_cursorconnection revdb_cursorerr revdb_cursors revdb_dbtype ' + 'revdb_disconnect revdb_execute revdb_iseof revdb_isbof revdb_movefirst revdb_movelast revdb_movenext ' + 'revdb_moveprev revdb_query revdb_querylist revdb_recordcount revdb_rollback revdb_tablenames ' + 'revGetDatabaseDriverPath revNumberOfRecords revOpenDatabase revOpenDatabases revQueryDatabase ' + 'revQueryDatabaseBlob revQueryResult revQueryIsAtStart revQueryIsAtEnd revUnixFromMacPath revXMLAttribute ' + 'revXMLAttributes revXMLAttributeValues revXMLChildContents revXMLChildNames revXMLCreateTreeFromFileWithNamespaces ' + 'revXMLCreateTreeWithNamespaces revXMLDataFromXPathQuery revXMLEvaluateXPath revXMLFirstChild revXMLMatchingNode ' + 'revXMLNextSibling revXMLNodeContents revXMLNumberOfChildren revXMLParent revXMLPreviousSibling ' + 'revXMLRootNode revXMLRPC_CreateRequest revXMLRPC_Documents revXMLRPC_Error ' + 'revXMLRPC_GetHost revXMLRPC_GetMethod revXMLRPC_GetParam revXMLText revXMLRPC_Execute ' + 'revXMLRPC_GetParamCount revXMLRPC_GetParamNode revXMLRPC_GetParamType revXMLRPC_GetPath revXMLRPC_GetPort ' + 'revXMLRPC_GetProtocol revXMLRPC_GetRequest revXMLRPC_GetResponse revXMLRPC_GetSocket revXMLTree ' + 'revXMLTrees revXMLValidateDTD revZipDescribeItem revZipEnumerateItems revZipOpenArchives round sampVariance ' + 'sec secs seconds sentenceOffset sha1Digest shell shortFilePath sin specialFolderPath sqrt standardDeviation statRound ' + 'stdDev sum sysError systemVersion tan tempName textDecode textEncode tick ticks time to tokenOffset toLower toUpper ' + 'transpose truewordOffset trunc uniDecode uniEncode upper URLDecode URLEncode URLStatus uuid value variableNames ' + 'variance version waitDepth weekdayNames wordOffset xsltApplyStylesheet xsltApplyStylesheetFromFile xsltLoadStylesheet ' + 'xsltLoadStylesheetFromFile add breakpoint cancel clear local variable file word line folder directory URL close socket process ' + 'combine constant convert create new alias folder directory decrypt delete variable word line folder ' + 'directory URL dispatch divide do encrypt filter get include intersect kill libURLDownloadToFile ' + 'libURLFollowHttpRedirects libURLftpUpload libURLftpUploadFile libURLresetAll libUrlSetAuthCallback ' + 'libURLSetCustomHTTPHeaders libUrlSetExpect100 libURLSetFTPListCommand libURLSetFTPMode libURLSetFTPStopTime ' + 'libURLSetStatusCallback load multiply socket prepare process post seek rel relative read from process rename ' + 'replace require resetAll resolve revAddXMLNode revAppendXML revCloseCursor revCloseDatabase revCommitDatabase ' + 'revCopyFile revCopyFolder revCopyXMLNode revDeleteFolder revDeleteXMLNode revDeleteAllXMLTrees ' + 'revDeleteXMLTree revExecuteSQL revGoURL revInsertXMLNode revMoveFolder revMoveToFirstRecord revMoveToLastRecord ' + 'revMoveToNextRecord revMoveToPreviousRecord revMoveToRecord revMoveXMLNode revPutIntoXMLNode revRollBackDatabase ' + 'revSetDatabaseDriverPath revSetXMLAttribute revXMLRPC_AddParam revXMLRPC_DeleteAllDocuments revXMLAddDTD ' + 'revXMLRPC_Free revXMLRPC_FreeAll revXMLRPC_DeleteDocument revXMLRPC_DeleteParam revXMLRPC_SetHost ' + 'revXMLRPC_SetMethod revXMLRPC_SetPort revXMLRPC_SetProtocol revXMLRPC_SetSocket revZipAddItemWithData ' + 'revZipAddItemWithFile revZipAddUncompressedItemWithData revZipAddUncompressedItemWithFile revZipCancel ' + 'revZipCloseArchive revZipDeleteItem revZipExtractItemToFile revZipExtractItemToVariable revZipSetProgressCallback ' + 'revZipRenameItem revZipReplaceItemWithData revZipReplaceItemWithFile revZipOpenArchive send set sort split start stop ' + 'subtract union unload wait write'
          },
          contains: [VARIABLE, {
            className: 'keyword',
            begin: '\\bend\\sif\\b'
          }, {
            className: 'function',
            beginKeywords: 'function',
            end: '$',
            contains: [VARIABLE, TITLE2, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE, TITLE1]
          }, {
            className: 'function',
            begin: '\\bend\\s+',
            end: '$',
            keywords: 'end',
            contains: [TITLE2, TITLE1]
          }, {
            className: 'command',
            beginKeywords: 'command on',
            end: '$',
            contains: [VARIABLE, TITLE2, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE, TITLE1]
          }, {
            className: 'preprocessor',
            variants: [{
              begin: '<\\?(rev|lc|livecode)',
              relevance: 10
            }, {begin: '<\\?'}, {begin: '\\?>'}]
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE, TITLE1].concat(COMMENT_MODES),
          illegal: ';$|^\\[|^='
        };
      };
    }, {}],
    66: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = {
          keyword: 'in if for while finally new do return else break catch instanceof throw try this ' + 'switch continue typeof delete debugger case default function var with ' + 'then unless until loop of by when and or is isnt not it that otherwise from to til fallthrough super ' + 'case default function var void const let enum export import native ' + '__hasProp __extends __slice __bind __indexOf',
          literal: 'true false null undefined ' + 'yes no on off it that void',
          built_in: 'npm require console print module global window document'
        };
        var JS_IDENT_RE = '[A-Za-z$_](?:\-[0-9A-Za-z$_]|[0-9A-Za-z$_])*';
        var TITLE = hljs.inherit(hljs.TITLE_MODE, {begin: JS_IDENT_RE});
        var SUBST = {
          className: 'subst',
          begin: /#\{/,
          end: /}/,
          keywords: KEYWORDS
        };
        var SUBST_SIMPLE = {
          className: 'subst',
          begin: /#[A-Za-z$_]/,
          end: /(?:\-[0-9A-Za-z$_]|[0-9A-Za-z$_])*/,
          keywords: KEYWORDS
        };
        var EXPRESSIONS = [hljs.BINARY_NUMBER_MODE, {
          className: 'number',
          begin: '(\\b0[xX][a-fA-F0-9_]+)|(\\b\\d(\\d|_\\d)*(\\.(\\d(\\d|_\\d)*)?)?(_*[eE]([-+]\\d(_\\d|\\d)*)?)?[_a-z]*)',
          relevance: 0,
          starts: {
            end: '(\\s*/)?',
            relevance: 0
          }
        }, {
          className: 'string',
          variants: [{
            begin: /'''/,
            end: /'''/,
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            begin: /'/,
            end: /'/,
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            begin: /"""/,
            end: /"""/,
            contains: [hljs.BACKSLASH_ESCAPE, SUBST, SUBST_SIMPLE]
          }, {
            begin: /"/,
            end: /"/,
            contains: [hljs.BACKSLASH_ESCAPE, SUBST, SUBST_SIMPLE]
          }, {
            begin: /\\/,
            end: /(\s|$)/,
            excludeEnd: true
          }]
        }, {
          className: 'pi',
          variants: [{
            begin: '//',
            end: '//[gim]*',
            contains: [SUBST, hljs.HASH_COMMENT_MODE]
          }, {begin: /\/(?![ *])(\\\/|.)*?\/[gim]*(?=\W|$)/}]
        }, {
          className: 'property',
          begin: '@' + JS_IDENT_RE
        }, {
          begin: '``',
          end: '``',
          excludeBegin: true,
          excludeEnd: true,
          subLanguage: 'javascript'
        }];
        SUBST.contains = EXPRESSIONS;
        var PARAMS = {
          className: 'params',
          begin: '\\(',
          returnBegin: true,
          contains: [{
            begin: /\(/,
            end: /\)/,
            keywords: KEYWORDS,
            contains: ['self'].concat(EXPRESSIONS)
          }]
        };
        return {
          aliases: ['ls'],
          keywords: KEYWORDS,
          illegal: /\/\*/,
          contains: EXPRESSIONS.concat([hljs.COMMENT('\\/\\*', '\\*\\/'), hljs.HASH_COMMENT_MODE, {
            className: 'function',
            contains: [TITLE, PARAMS],
            returnBegin: true,
            variants: [{
              begin: '(' + JS_IDENT_RE + '\\s*(?:=|:=)\\s*)?(\\(.*\\))?\\s*\\B\\->\\*?',
              end: '\\->\\*?'
            }, {
              begin: '(' + JS_IDENT_RE + '\\s*(?:=|:=)\\s*)?!?(\\(.*\\))?\\s*\\B[-~]{1,2}>\\*?',
              end: '[-~]{1,2}>\\*?'
            }, {
              begin: '(' + JS_IDENT_RE + '\\s*(?:=|:=)\\s*)?(\\(.*\\))?\\s*\\B!?[-~]{1,2}>\\*?',
              end: '!?[-~]{1,2}>\\*?'
            }]
          }, {
            className: 'class',
            beginKeywords: 'class',
            end: '$',
            illegal: /[:="\[\]]/,
            contains: [{
              beginKeywords: 'extends',
              endsWithParent: true,
              illegal: /[:="\[\]]/,
              contains: [TITLE]
            }, TITLE]
          }, {
            className: 'attribute',
            begin: JS_IDENT_RE + ':',
            end: ':',
            returnBegin: true,
            returnEnd: true,
            relevance: 0
          }])
        };
      };
    }, {}],
    67: [function(require, module, exports) {
      module.exports = function(hljs) {
        var OPENING_LONG_BRACKET = '\\[=*\\[';
        var CLOSING_LONG_BRACKET = '\\]=*\\]';
        var LONG_BRACKETS = {
          begin: OPENING_LONG_BRACKET,
          end: CLOSING_LONG_BRACKET,
          contains: ['self']
        };
        var COMMENTS = [hljs.COMMENT('--(?!' + OPENING_LONG_BRACKET + ')', '$'), hljs.COMMENT('--' + OPENING_LONG_BRACKET, CLOSING_LONG_BRACKET, {
          contains: [LONG_BRACKETS],
          relevance: 10
        })];
        return {
          lexemes: hljs.UNDERSCORE_IDENT_RE,
          keywords: {
            keyword: 'and break do else elseif end false for if in local nil not or repeat return then ' + 'true until while',
            built_in: '_G _VERSION assert collectgarbage dofile error getfenv getmetatable ipairs load ' + 'loadfile loadstring module next pairs pcall print rawequal rawget rawset require ' + 'select setfenv setmetatable tonumber tostring type unpack xpcall coroutine debug ' + 'io math os package string table'
          },
          contains: COMMENTS.concat([{
            className: 'function',
            beginKeywords: 'function',
            end: '\\)',
            contains: [hljs.inherit(hljs.TITLE_MODE, {begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*'}), {
              className: 'params',
              begin: '\\(',
              endsWithParent: true,
              contains: COMMENTS
            }].concat(COMMENTS)
          }, hljs.C_NUMBER_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: OPENING_LONG_BRACKET,
            end: CLOSING_LONG_BRACKET,
            contains: [LONG_BRACKETS],
            relevance: 5
          }])
        };
      };
    }, {}],
    68: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VARIABLE = {
          className: 'variable',
          begin: /\$\(/,
          end: /\)/,
          contains: [hljs.BACKSLASH_ESCAPE]
        };
        return {
          aliases: ['mk', 'mak'],
          contains: [hljs.HASH_COMMENT_MODE, {
            begin: /^\w+\s*\W*=/,
            returnBegin: true,
            relevance: 0,
            starts: {
              className: 'constant',
              end: /\s*\W*=/,
              excludeEnd: true,
              starts: {
                end: /$/,
                relevance: 0,
                contains: [VARIABLE]
              }
            }
          }, {
            className: 'title',
            begin: /^[\w]+:\s*$/
          }, {
            className: 'phony',
            begin: /^\.PHONY:/,
            end: /$/,
            keywords: '.PHONY',
            lexemes: /[\.\w]+/
          }, {
            begin: /^\t+/,
            end: /$/,
            relevance: 0,
            contains: [hljs.QUOTE_STRING_MODE, VARIABLE]
          }]
        };
      };
    }, {}],
    69: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['md', 'mkdown', 'mkd'],
          contains: [{
            className: 'header',
            variants: [{
              begin: '^#{1,6}',
              end: '$'
            }, {begin: '^.+?\\n[=-]{2,}$'}]
          }, {
            begin: '<',
            end: '>',
            subLanguage: 'xml',
            relevance: 0
          }, {
            className: 'bullet',
            begin: '^([*+-]|(\\d+\\.))\\s+'
          }, {
            className: 'strong',
            begin: '[*_]{2}.+?[*_]{2}'
          }, {
            className: 'emphasis',
            variants: [{begin: '\\*.+?\\*'}, {
              begin: '_.+?_',
              relevance: 0
            }]
          }, {
            className: 'blockquote',
            begin: '^>\\s+',
            end: '$'
          }, {
            className: 'code',
            variants: [{begin: '`.+?`'}, {
              begin: '^( {4}|\t)',
              end: '$',
              relevance: 0
            }]
          }, {
            className: 'horizontal_rule',
            begin: '^[-\\*]{3,}',
            end: '$'
          }, {
            begin: '\\[.+?\\][\\(\\[].*?[\\)\\]]',
            returnBegin: true,
            contains: [{
              className: 'link_label',
              begin: '\\[',
              end: '\\]',
              excludeBegin: true,
              returnEnd: true,
              relevance: 0
            }, {
              className: 'link_url',
              begin: '\\]\\(',
              end: '\\)',
              excludeBegin: true,
              excludeEnd: true
            }, {
              className: 'link_reference',
              begin: '\\]\\[',
              end: '\\]',
              excludeBegin: true,
              excludeEnd: true
            }],
            relevance: 10
          }, {
            begin: '^\\[\.+\\]:',
            returnBegin: true,
            contains: [{
              className: 'link_reference',
              begin: '\\[',
              end: '\\]:',
              excludeBegin: true,
              excludeEnd: true,
              starts: {
                className: 'link_url',
                end: '$'
              }
            }]
          }]
        };
      };
    }, {}],
    70: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['mma'],
          lexemes: '(\\$|\\b)' + hljs.IDENT_RE + '\\b',
          keywords: 'AbelianGroup Abort AbortKernels AbortProtect Above Abs Absolute AbsoluteCorrelation AbsoluteCorrelationFunction AbsoluteCurrentValue AbsoluteDashing AbsoluteFileName AbsoluteOptions AbsolutePointSize AbsoluteThickness AbsoluteTime AbsoluteTiming AccountingForm Accumulate Accuracy AccuracyGoal ActionDelay ActionMenu ActionMenuBox ActionMenuBoxOptions Active ActiveItem ActiveStyle AcyclicGraphQ AddOnHelpPath AddTo AdjacencyGraph AdjacencyList AdjacencyMatrix AdjustmentBox AdjustmentBoxOptions AdjustTimeSeriesForecast AffineTransform After AiryAi AiryAiPrime AiryAiZero AiryBi AiryBiPrime AiryBiZero AlgebraicIntegerQ AlgebraicNumber AlgebraicNumberDenominator AlgebraicNumberNorm AlgebraicNumberPolynomial AlgebraicNumberTrace AlgebraicRules AlgebraicRulesData Algebraics AlgebraicUnitQ Alignment AlignmentMarker AlignmentPoint All AllowedDimensions AllowGroupClose AllowInlineCells AllowKernelInitialization AllowReverseGroupClose AllowScriptLevelChange AlphaChannel AlternatingGroup AlternativeHypothesis Alternatives AmbientLight Analytic AnchoredSearch And AndersonDarlingTest AngerJ AngleBracket AngularGauge Animate AnimationCycleOffset AnimationCycleRepetitions AnimationDirection AnimationDisplayTime AnimationRate AnimationRepetitions AnimationRunning Animator AnimatorBox AnimatorBoxOptions AnimatorElements Annotation Annuity AnnuityDue Antialiasing Antisymmetric Apart ApartSquareFree Appearance AppearanceElements AppellF1 Append AppendTo Apply ArcCos ArcCosh ArcCot ArcCoth ArcCsc ArcCsch ArcSec ArcSech ArcSin ArcSinDistribution ArcSinh ArcTan ArcTanh Arg ArgMax ArgMin ArgumentCountQ ARIMAProcess ArithmeticGeometricMean ARMAProcess ARProcess Array ArrayComponents ArrayDepth ArrayFlatten ArrayPad ArrayPlot ArrayQ ArrayReshape ArrayRules Arrays Arrow Arrow3DBox ArrowBox Arrowheads AspectRatio AspectRatioFixed Assert Assuming Assumptions AstronomicalData Asynchronous AsynchronousTaskObject AsynchronousTasks AtomQ Attributes AugmentedSymmetricPolynomial AutoAction AutoDelete AutoEvaluateEvents AutoGeneratedPackage AutoIndent AutoIndentSpacings AutoItalicWords AutoloadPath AutoMatch Automatic AutomaticImageSize AutoMultiplicationSymbol AutoNumberFormatting AutoOpenNotebooks AutoOpenPalettes AutorunSequencing AutoScaling AutoScroll AutoSpacing AutoStyleOptions AutoStyleWords Axes AxesEdge AxesLabel AxesOrigin AxesStyle Axis ' + 'BabyMonsterGroupB Back Background BackgroundTasksSettings Backslash Backsubstitution Backward Band BandpassFilter BandstopFilter BarabasiAlbertGraphDistribution BarChart BarChart3D BarLegend BarlowProschanImportance BarnesG BarOrigin BarSpacing BartlettHannWindow BartlettWindow BaseForm Baseline BaselinePosition BaseStyle BatesDistribution BattleLemarieWavelet Because BeckmannDistribution Beep Before Begin BeginDialogPacket BeginFrontEndInteractionPacket BeginPackage BellB BellY Below BenfordDistribution BeniniDistribution BenktanderGibratDistribution BenktanderWeibullDistribution BernoulliB BernoulliDistribution BernoulliGraphDistribution BernoulliProcess BernsteinBasis BesselFilterModel BesselI BesselJ BesselJZero BesselK BesselY BesselYZero Beta BetaBinomialDistribution BetaDistribution BetaNegativeBinomialDistribution BetaPrimeDistribution BetaRegularized BetweennessCentrality BezierCurve BezierCurve3DBox BezierCurve3DBoxOptions BezierCurveBox BezierCurveBoxOptions BezierFunction BilateralFilter Binarize BinaryFormat BinaryImageQ BinaryRead BinaryReadList BinaryWrite BinCounts BinLists Binomial BinomialDistribution BinomialProcess BinormalDistribution BiorthogonalSplineWavelet BipartiteGraphQ BirnbaumImportance BirnbaumSaundersDistribution BitAnd BitClear BitGet BitLength BitNot BitOr BitSet BitShiftLeft BitShiftRight BitXor Black BlackmanHarrisWindow BlackmanNuttallWindow BlackmanWindow Blank BlankForm BlankNullSequence BlankSequence Blend Block BlockRandom BlomqvistBeta BlomqvistBetaTest Blue Blur BodePlot BohmanWindow Bold Bookmarks Boole BooleanConsecutiveFunction BooleanConvert BooleanCountingFunction BooleanFunction BooleanGraph BooleanMaxterms BooleanMinimize BooleanMinterms Booleans BooleanTable BooleanVariables BorderDimensions BorelTannerDistribution Bottom BottomHatTransform BoundaryStyle Bounds Box BoxBaselineShift BoxData BoxDimensions Boxed Boxes BoxForm BoxFormFormatTypes BoxFrame BoxID BoxMargins BoxMatrix BoxRatios BoxRotation BoxRotationPoint BoxStyle BoxWhiskerChart Bra BracketingBar BraKet BrayCurtisDistance BreadthFirstScan Break Brown BrownForsytheTest BrownianBridgeProcess BrowserCategory BSplineBasis BSplineCurve BSplineCurve3DBox BSplineCurveBox BSplineCurveBoxOptions BSplineFunction BSplineSurface BSplineSurface3DBox BubbleChart BubbleChart3D BubbleScale BubbleSizes BulletGauge BusinessDayQ ButterflyGraph ButterworthFilterModel Button ButtonBar ButtonBox ButtonBoxOptions ButtonCell ButtonContents ButtonData ButtonEvaluator ButtonExpandable ButtonFrame ButtonFunction ButtonMargins ButtonMinHeight ButtonNote ButtonNotebook ButtonSource ButtonStyle ButtonStyleMenuListing Byte ByteCount ByteOrdering ' + 'C CachedValue CacheGraphics CalendarData CalendarType CallPacket CanberraDistance Cancel CancelButton CandlestickChart Cap CapForm CapitalDifferentialD CardinalBSplineBasis CarmichaelLambda Cases Cashflow Casoratian Catalan CatalanNumber Catch CauchyDistribution CauchyWindow CayleyGraph CDF CDFDeploy CDFInformation CDFWavelet Ceiling Cell CellAutoOverwrite CellBaseline CellBoundingBox CellBracketOptions CellChangeTimes CellContents CellContext CellDingbat CellDynamicExpression CellEditDuplicate CellElementsBoundingBox CellElementSpacings CellEpilog CellEvaluationDuplicate CellEvaluationFunction CellEventActions CellFrame CellFrameColor CellFrameLabelMargins CellFrameLabels CellFrameMargins CellGroup CellGroupData CellGrouping CellGroupingRules CellHorizontalScrolling CellID CellLabel CellLabelAutoDelete CellLabelMargins CellLabelPositioning CellMargins CellObject CellOpen CellPrint CellProlog Cells CellSize CellStyle CellTags CellularAutomaton CensoredDistribution Censoring Center CenterDot CentralMoment CentralMomentGeneratingFunction CForm ChampernowneNumber ChanVeseBinarize Character CharacterEncoding CharacterEncodingsPath CharacteristicFunction CharacteristicPolynomial CharacterRange Characters ChartBaseStyle ChartElementData ChartElementDataFunction ChartElementFunction ChartElements ChartLabels ChartLayout ChartLegends ChartStyle Chebyshev1FilterModel Chebyshev2FilterModel ChebyshevDistance ChebyshevT ChebyshevU Check CheckAbort CheckAll Checkbox CheckboxBar CheckboxBox CheckboxBoxOptions ChemicalData ChessboardDistance ChiDistribution ChineseRemainder ChiSquareDistribution ChoiceButtons ChoiceDialog CholeskyDecomposition Chop Circle CircleBox CircleDot CircleMinus CirclePlus CircleTimes CirculantGraph CityData Clear ClearAll ClearAttributes ClearSystemCache ClebschGordan ClickPane Clip ClipboardNotebook ClipFill ClippingStyle ClipPlanes ClipRange Clock ClockGauge ClockwiseContourIntegral Close Closed CloseKernels ClosenessCentrality Closing ClosingAutoSave ClosingEvent ClusteringComponents CMYKColor Coarse Coefficient CoefficientArrays CoefficientDomain CoefficientList CoefficientRules CoifletWavelet Collect Colon ColonForm ColorCombine ColorConvert ColorData ColorDataFunction ColorFunction ColorFunctionScaling Colorize ColorNegate ColorOutput ColorProfileData ColorQuantize ColorReplace ColorRules ColorSelectorSettings ColorSeparate ColorSetter ColorSetterBox ColorSetterBoxOptions ColorSlider ColorSpace Column ColumnAlignments ColumnBackgrounds ColumnForm ColumnLines ColumnsEqual ColumnSpacings ColumnWidths CommonDefaultFormatTypes Commonest CommonestFilter CommonUnits CommunityBoundaryStyle CommunityGraphPlot CommunityLabels CommunityRegionStyle CompatibleUnitQ CompilationOptions CompilationTarget Compile Compiled CompiledFunction Complement CompleteGraph CompleteGraphQ CompleteKaryTree CompletionsListPacket Complex Complexes ComplexExpand ComplexInfinity ComplexityFunction ComponentMeasurements ' + 'ComponentwiseContextMenu Compose ComposeList ComposeSeries Composition CompoundExpression CompoundPoissonDistribution CompoundPoissonProcess CompoundRenewalProcess Compress CompressedData Condition ConditionalExpression Conditioned Cone ConeBox ConfidenceLevel ConfidenceRange ConfidenceTransform ConfigurationPath Congruent Conjugate ConjugateTranspose Conjunction Connect ConnectedComponents ConnectedGraphQ ConnesWindow ConoverTest ConsoleMessage ConsoleMessagePacket ConsolePrint Constant ConstantArray Constants ConstrainedMax ConstrainedMin ContentPadding ContentsBoundingBox ContentSelectable ContentSize Context ContextMenu Contexts ContextToFilename ContextToFileName Continuation Continue ContinuedFraction ContinuedFractionK ContinuousAction ContinuousMarkovProcess ContinuousTimeModelQ ContinuousWaveletData ContinuousWaveletTransform ContourDetect ContourGraphics ContourIntegral ContourLabels ContourLines ContourPlot ContourPlot3D Contours ContourShading ContourSmoothing ContourStyle ContraharmonicMean Control ControlActive ControlAlignment ControllabilityGramian ControllabilityMatrix ControllableDecomposition ControllableModelQ ControllerDuration ControllerInformation ControllerInformationData ControllerLinking ControllerManipulate ControllerMethod ControllerPath ControllerState ControlPlacement ControlsRendering ControlType Convergents ConversionOptions ConversionRules ConvertToBitmapPacket ConvertToPostScript ConvertToPostScriptPacket Convolve ConwayGroupCo1 ConwayGroupCo2 ConwayGroupCo3 CoordinateChartData CoordinatesToolOptions CoordinateTransform CoordinateTransformData CoprimeQ Coproduct CopulaDistribution Copyable CopyDirectory CopyFile CopyTag CopyToClipboard CornerFilter CornerNeighbors Correlation CorrelationDistance CorrelationFunction CorrelationTest Cos Cosh CoshIntegral CosineDistance CosineWindow CosIntegral Cot Coth Count CounterAssignments CounterBox CounterBoxOptions CounterClockwiseContourIntegral CounterEvaluator CounterFunction CounterIncrements CounterStyle CounterStyleMenuListing CountRoots CountryData Covariance CovarianceEstimatorFunction CovarianceFunction CoxianDistribution CoxIngersollRossProcess CoxModel CoxModelFit CramerVonMisesTest CreateArchive CreateDialog CreateDirectory CreateDocument CreateIntermediateDirectories CreatePalette CreatePalettePacket CreateScheduledTask CreateTemporary CreateWindow CriticalityFailureImportance CriticalitySuccessImportance CriticalSection Cross CrossingDetect CrossMatrix Csc Csch CubeRoot Cubics Cuboid CuboidBox Cumulant CumulantGeneratingFunction Cup CupCap Curl CurlyDoubleQuote CurlyQuote CurrentImage CurrentlySpeakingPacket CurrentValue CurvatureFlowFilter CurveClosed Cyan CycleGraph CycleIndexPolynomial Cycles CyclicGroup Cyclotomic Cylinder CylinderBox CylindricalDecomposition ' + 'D DagumDistribution DamerauLevenshteinDistance DampingFactor Darker Dashed Dashing DataCompression DataDistribution DataRange DataReversed Date DateDelimiters DateDifference DateFunction DateList DateListLogPlot DateListPlot DatePattern DatePlus DateRange DateString DateTicksFormat DaubechiesWavelet DavisDistribution DawsonF DayCount DayCountConvention DayMatchQ DayName DayPlus DayRange DayRound DeBruijnGraph Debug DebugTag Decimal DeclareKnownSymbols DeclarePackage Decompose Decrement DedekindEta Default DefaultAxesStyle DefaultBaseStyle DefaultBoxStyle DefaultButton DefaultColor DefaultControlPlacement DefaultDuplicateCellStyle DefaultDuration DefaultElement DefaultFaceGridsStyle DefaultFieldHintStyle DefaultFont DefaultFontProperties DefaultFormatType DefaultFormatTypeForStyle DefaultFrameStyle DefaultFrameTicksStyle DefaultGridLinesStyle DefaultInlineFormatType DefaultInputFormatType DefaultLabelStyle DefaultMenuStyle DefaultNaturalLanguage DefaultNewCellStyle DefaultNewInlineCellStyle DefaultNotebook DefaultOptions DefaultOutputFormatType DefaultStyle DefaultStyleDefinitions DefaultTextFormatType DefaultTextInlineFormatType DefaultTicksStyle DefaultTooltipStyle DefaultValues Defer DefineExternal DefineInputStreamMethod DefineOutputStreamMethod Definition Degree DegreeCentrality DegreeGraphDistribution DegreeLexicographic DegreeReverseLexicographic Deinitialization Del Deletable Delete DeleteBorderComponents DeleteCases DeleteContents DeleteDirectory DeleteDuplicates DeleteFile DeleteSmallComponents DeleteWithContents DeletionWarning Delimiter DelimiterFlashTime DelimiterMatching Delimiters Denominator DensityGraphics DensityHistogram DensityPlot DependentVariables Deploy Deployed Depth DepthFirstScan Derivative DerivativeFilter DescriptorStateSpace DesignMatrix Det DGaussianWavelet DiacriticalPositioning Diagonal DiagonalMatrix Dialog DialogIndent DialogInput DialogLevel DialogNotebook DialogProlog DialogReturn DialogSymbols Diamond DiamondMatrix DiceDissimilarity DictionaryLookup DifferenceDelta DifferenceOrder DifferenceRoot DifferenceRootReduce Differences DifferentialD DifferentialRoot DifferentialRootReduce DifferentiatorFilter DigitBlock DigitBlockMinimum DigitCharacter DigitCount DigitQ DihedralGroup Dilation Dimensions DiracComb DiracDelta DirectedEdge DirectedEdges DirectedGraph DirectedGraphQ DirectedInfinity Direction Directive Directory DirectoryName DirectoryQ DirectoryStack DirichletCharacter DirichletConvolve DirichletDistribution DirichletL DirichletTransform DirichletWindow DisableConsolePrintPacket DiscreteChirpZTransform DiscreteConvolve DiscreteDelta DiscreteHadamardTransform DiscreteIndicator DiscreteLQEstimatorGains DiscreteLQRegulatorGains DiscreteLyapunovSolve DiscreteMarkovProcess DiscretePlot DiscretePlot3D DiscreteRatio DiscreteRiccatiSolve DiscreteShift DiscreteTimeModelQ DiscreteUniformDistribution DiscreteVariables DiscreteWaveletData DiscreteWaveletPacketTransform ' + 'DiscreteWaveletTransform Discriminant Disjunction Disk DiskBox DiskMatrix Dispatch DispersionEstimatorFunction Display DisplayAllSteps DisplayEndPacket DisplayFlushImagePacket DisplayForm DisplayFunction DisplayPacket DisplayRules DisplaySetSizePacket DisplayString DisplayTemporary DisplayWith DisplayWithRef DisplayWithVariable DistanceFunction DistanceTransform Distribute Distributed DistributedContexts DistributeDefinitions DistributionChart DistributionDomain DistributionFitTest DistributionParameterAssumptions DistributionParameterQ Dithering Div Divergence Divide DivideBy Dividers Divisible Divisors DivisorSigma DivisorSum DMSList DMSString Do DockedCells DocumentNotebook DominantColors DOSTextFormat Dot DotDashed DotEqual Dotted DoubleBracketingBar DoubleContourIntegral DoubleDownArrow DoubleLeftArrow DoubleLeftRightArrow DoubleLeftTee DoubleLongLeftArrow DoubleLongLeftRightArrow DoubleLongRightArrow DoubleRightArrow DoubleRightTee DoubleUpArrow DoubleUpDownArrow DoubleVerticalBar DoublyInfinite Down DownArrow DownArrowBar DownArrowUpArrow DownLeftRightVector DownLeftTeeVector DownLeftVector DownLeftVectorBar DownRightTeeVector DownRightVector DownRightVectorBar Downsample DownTee DownTeeArrow DownValues DragAndDrop DrawEdges DrawFrontFaces DrawHighlighted Drop DSolve Dt DualLinearProgramming DualSystemsModel DumpGet DumpSave DuplicateFreeQ Dynamic DynamicBox DynamicBoxOptions DynamicEvaluationTimeout DynamicLocation DynamicModule DynamicModuleBox DynamicModuleBoxOptions DynamicModuleParent DynamicModuleValues DynamicName DynamicNamespace DynamicReference DynamicSetting DynamicUpdating DynamicWrapper DynamicWrapperBox DynamicWrapperBoxOptions ' + 'E EccentricityCentrality EdgeAdd EdgeBetweennessCentrality EdgeCapacity EdgeCapForm EdgeColor EdgeConnectivity EdgeCost EdgeCount EdgeCoverQ EdgeDashing EdgeDelete EdgeDetect EdgeForm EdgeIndex EdgeJoinForm EdgeLabeling EdgeLabels EdgeLabelStyle EdgeList EdgeOpacity EdgeQ EdgeRenderingFunction EdgeRules EdgeShapeFunction EdgeStyle EdgeThickness EdgeWeight Editable EditButtonSettings EditCellTagsSettings EditDistance EffectiveInterest Eigensystem Eigenvalues EigenvectorCentrality Eigenvectors Element ElementData Eliminate EliminationOrder EllipticE EllipticExp EllipticExpPrime EllipticF EllipticFilterModel EllipticK EllipticLog EllipticNomeQ EllipticPi EllipticReducedHalfPeriods EllipticTheta EllipticThetaPrime EmitSound EmphasizeSyntaxErrors EmpiricalDistribution Empty EmptyGraphQ EnableConsolePrintPacket Enabled Encode End EndAdd EndDialogPacket EndFrontEndInteractionPacket EndOfFile EndOfLine EndOfString EndPackage EngineeringForm Enter EnterExpressionPacket EnterTextPacket Entropy EntropyFilter Environment Epilog Equal EqualColumns EqualRows EqualTilde EquatedTo Equilibrium EquirippleFilterKernel Equivalent Erf Erfc Erfi ErlangB ErlangC ErlangDistribution Erosion ErrorBox ErrorBoxOptions ErrorNorm ErrorPacket ErrorsDialogSettings EstimatedDistribution EstimatedProcess EstimatorGains EstimatorRegulator EuclideanDistance EulerE EulerGamma EulerianGraphQ EulerPhi Evaluatable Evaluate Evaluated EvaluatePacket EvaluationCell EvaluationCompletionAction EvaluationElements EvaluationMode EvaluationMonitor EvaluationNotebook EvaluationObject EvaluationOrder Evaluator EvaluatorNames EvenQ EventData EventEvaluator EventHandler EventHandlerTag EventLabels ExactBlackmanWindow ExactNumberQ ExactRootIsolation ExampleData Except ExcludedForms ExcludePods Exclusions ExclusionsStyle Exists Exit ExitDialog Exp Expand ExpandAll ExpandDenominator ExpandFileName ExpandNumerator Expectation ExpectationE ExpectedValue ExpGammaDistribution ExpIntegralE ExpIntegralEi Exponent ExponentFunction ExponentialDistribution ExponentialFamily ExponentialGeneratingFunction ExponentialMovingAverage ExponentialPowerDistribution ExponentPosition ExponentStep Export ExportAutoReplacements ExportPacket ExportString Expression ExpressionCell ExpressionPacket ExpToTrig ExtendedGCD Extension ExtentElementFunction ExtentMarkers ExtentSize ExternalCall ExternalDataCharacterEncoding Extract ExtractArchive ExtremeValueDistribution ' + 'FaceForm FaceGrids FaceGridsStyle Factor FactorComplete Factorial Factorial2 FactorialMoment FactorialMomentGeneratingFunction FactorialPower FactorInteger FactorList FactorSquareFree FactorSquareFreeList FactorTerms FactorTermsList Fail FailureDistribution False FARIMAProcess FEDisableConsolePrintPacket FeedbackSector FeedbackSectorStyle FeedbackType FEEnableConsolePrintPacket Fibonacci FieldHint FieldHintStyle FieldMasked FieldSize File FileBaseName FileByteCount FileDate FileExistsQ FileExtension FileFormat FileHash FileInformation FileName FileNameDepth FileNameDialogSettings FileNameDrop FileNameJoin FileNames FileNameSetter FileNameSplit FileNameTake FilePrint FileType FilledCurve FilledCurveBox Filling FillingStyle FillingTransform FilterRules FinancialBond FinancialData FinancialDerivative FinancialIndicator Find FindArgMax FindArgMin FindClique FindClusters FindCurvePath FindDistributionParameters FindDivisions FindEdgeCover FindEdgeCut FindEulerianCycle FindFaces FindFile FindFit FindGeneratingFunction FindGeoLocation FindGeometricTransform FindGraphCommunities FindGraphIsomorphism FindGraphPartition FindHamiltonianCycle FindIndependentEdgeSet FindIndependentVertexSet FindInstance FindIntegerNullVector FindKClan FindKClique FindKClub FindKPlex FindLibrary FindLinearRecurrence FindList FindMaximum FindMaximumFlow FindMaxValue FindMinimum FindMinimumCostFlow FindMinimumCut FindMinValue FindPermutation FindPostmanTour FindProcessParameters FindRoot FindSequenceFunction FindSettings FindShortestPath FindShortestTour FindThreshold FindVertexCover FindVertexCut Fine FinishDynamic FiniteAbelianGroupCount FiniteGroupCount FiniteGroupData First FirstPassageTimeDistribution FischerGroupFi22 FischerGroupFi23 FischerGroupFi24Prime FisherHypergeometricDistribution FisherRatioTest FisherZDistribution Fit FitAll FittedModel FixedPoint FixedPointList FlashSelection Flat Flatten FlattenAt FlatTopWindow FlipView Floor FlushPrintOutputPacket Fold FoldList Font FontColor FontFamily FontForm FontName FontOpacity FontPostScriptName FontProperties FontReencoding FontSize FontSlant FontSubstitutions FontTracking FontVariations FontWeight For ForAll Format FormatRules FormatType FormatTypeAutoConvert FormatValues FormBox FormBoxOptions FortranForm Forward ForwardBackward Fourier FourierCoefficient FourierCosCoefficient FourierCosSeries FourierCosTransform FourierDCT FourierDCTFilter FourierDCTMatrix FourierDST FourierDSTMatrix FourierMatrix FourierParameters FourierSequenceTransform FourierSeries FourierSinCoefficient FourierSinSeries FourierSinTransform FourierTransform FourierTrigSeries FractionalBrownianMotionProcess FractionalPart FractionBox FractionBoxOptions FractionLine Frame FrameBox FrameBoxOptions Framed FrameInset FrameLabel Frameless FrameMargins FrameStyle FrameTicks FrameTicksStyle FRatioDistribution FrechetDistribution FreeQ FrequencySamplingFilterKernel FresnelC FresnelS Friday FrobeniusNumber FrobeniusSolve ' + 'FromCharacterCode FromCoefficientRules FromContinuedFraction FromDate FromDigits FromDMS Front FrontEndDynamicExpression FrontEndEventActions FrontEndExecute FrontEndObject FrontEndResource FrontEndResourceString FrontEndStackSize FrontEndToken FrontEndTokenExecute FrontEndValueCache FrontEndVersion FrontFaceColor FrontFaceOpacity Full FullAxes FullDefinition FullForm FullGraphics FullOptions FullSimplify Function FunctionExpand FunctionInterpolation FunctionSpace FussellVeselyImportance ' + 'GaborFilter GaborMatrix GaborWavelet GainMargins GainPhaseMargins Gamma GammaDistribution GammaRegularized GapPenalty Gather GatherBy GaugeFaceElementFunction GaugeFaceStyle GaugeFrameElementFunction GaugeFrameSize GaugeFrameStyle GaugeLabels GaugeMarkers GaugeStyle GaussianFilter GaussianIntegers GaussianMatrix GaussianWindow GCD GegenbauerC General GeneralizedLinearModelFit GenerateConditions GeneratedCell GeneratedParameters GeneratingFunction Generic GenericCylindricalDecomposition GenomeData GenomeLookup GeodesicClosing GeodesicDilation GeodesicErosion GeodesicOpening GeoDestination GeodesyData GeoDirection GeoDistance GeoGridPosition GeometricBrownianMotionProcess GeometricDistribution GeometricMean GeometricMeanFilter GeometricTransformation GeometricTransformation3DBox GeometricTransformation3DBoxOptions GeometricTransformationBox GeometricTransformationBoxOptions GeoPosition GeoPositionENU GeoPositionXYZ GeoProjectionData GestureHandler GestureHandlerTag Get GetBoundingBoxSizePacket GetContext GetEnvironment GetFileName GetFrontEndOptionsDataPacket GetLinebreakInformationPacket GetMenusPacket GetPageBreakInformationPacket Glaisher GlobalClusteringCoefficient GlobalPreferences GlobalSession Glow GoldenRatio GompertzMakehamDistribution GoodmanKruskalGamma GoodmanKruskalGammaTest Goto Grad Gradient GradientFilter GradientOrientationFilter Graph GraphAssortativity GraphCenter GraphComplement GraphData GraphDensity GraphDiameter GraphDifference GraphDisjointUnion ' + 'GraphDistance GraphDistanceMatrix GraphElementData GraphEmbedding GraphHighlight GraphHighlightStyle GraphHub Graphics Graphics3D Graphics3DBox Graphics3DBoxOptions GraphicsArray GraphicsBaseline GraphicsBox GraphicsBoxOptions GraphicsColor GraphicsColumn GraphicsComplex GraphicsComplex3DBox GraphicsComplex3DBoxOptions GraphicsComplexBox GraphicsComplexBoxOptions GraphicsContents GraphicsData GraphicsGrid GraphicsGridBox GraphicsGroup GraphicsGroup3DBox GraphicsGroup3DBoxOptions GraphicsGroupBox GraphicsGroupBoxOptions GraphicsGrouping GraphicsHighlightColor GraphicsRow GraphicsSpacing GraphicsStyle GraphIntersection GraphLayout GraphLinkEfficiency GraphPeriphery GraphPlot GraphPlot3D GraphPower GraphPropertyDistribution GraphQ GraphRadius GraphReciprocity GraphRoot GraphStyle GraphUnion Gray GrayLevel GreatCircleDistance Greater GreaterEqual GreaterEqualLess GreaterFullEqual GreaterGreater GreaterLess GreaterSlantEqual GreaterTilde Green Grid GridBaseline GridBox GridBoxAlignment GridBoxBackground GridBoxDividers GridBoxFrame GridBoxItemSize GridBoxItemStyle GridBoxOptions GridBoxSpacings GridCreationSettings GridDefaultElement GridElementStyleOptions GridFrame GridFrameMargins GridGraph GridLines GridLinesStyle GroebnerBasis GroupActionBase GroupCentralizer GroupElementFromWord GroupElementPosition GroupElementQ GroupElements GroupElementToWord GroupGenerators GroupMultiplicationTable GroupOrbits GroupOrder GroupPageBreakWithin GroupSetwiseStabilizer GroupStabilizer GroupStabilizerChain Gudermannian GumbelDistribution ' + 'HaarWavelet HadamardMatrix HalfNormalDistribution HamiltonianGraphQ HammingDistance HammingWindow HankelH1 HankelH2 HankelMatrix HannPoissonWindow HannWindow HaradaNortonGroupHN HararyGraph HarmonicMean HarmonicMeanFilter HarmonicNumber Hash HashTable Haversine HazardFunction Head HeadCompose Heads HeavisideLambda HeavisidePi HeavisideTheta HeldGroupHe HeldPart HelpBrowserLookup HelpBrowserNotebook HelpBrowserSettings HermiteDecomposition HermiteH HermitianMatrixQ HessenbergDecomposition Hessian HexadecimalCharacter Hexahedron HexahedronBox HexahedronBoxOptions HiddenSurface HighlightGraph HighlightImage HighpassFilter HigmanSimsGroupHS HilbertFilter HilbertMatrix Histogram Histogram3D HistogramDistribution HistogramList HistogramTransform HistogramTransformInterpolation HitMissTransform HITSCentrality HodgeDual HoeffdingD HoeffdingDTest Hold HoldAll HoldAllComplete HoldComplete HoldFirst HoldForm HoldPattern HoldRest HolidayCalendar HomeDirectory HomePage Horizontal HorizontalForm HorizontalGauge HorizontalScrollPosition HornerForm HotellingTSquareDistribution HoytDistribution HTMLSave Hue HumpDownHump HumpEqual HurwitzLerchPhi HurwitzZeta HyperbolicDistribution HypercubeGraph HyperexponentialDistribution Hyperfactorial Hypergeometric0F1 Hypergeometric0F1Regularized Hypergeometric1F1 Hypergeometric1F1Regularized Hypergeometric2F1 Hypergeometric2F1Regularized HypergeometricDistribution HypergeometricPFQ HypergeometricPFQRegularized HypergeometricU Hyperlink HyperlinkCreationSettings Hyphenation HyphenationOptions HypoexponentialDistribution HypothesisTestData ' + 'I Identity IdentityMatrix If IgnoreCase Im Image Image3D Image3DSlices ImageAccumulate ImageAdd ImageAdjust ImageAlign ImageApply ImageAspectRatio ImageAssemble ImageCache ImageCacheValid ImageCapture ImageChannels ImageClip ImageColorSpace ImageCompose ImageConvolve ImageCooccurrence ImageCorners ImageCorrelate ImageCorrespondingPoints ImageCrop ImageData ImageDataPacket ImageDeconvolve ImageDemosaic ImageDifference ImageDimensions ImageDistance ImageEffect ImageFeatureTrack ImageFileApply ImageFileFilter ImageFileScan ImageFilter ImageForestingComponents ImageForwardTransformation ImageHistogram ImageKeypoints ImageLevels ImageLines ImageMargins ImageMarkers ImageMeasurements ImageMultiply ImageOffset ImagePad ImagePadding ImagePartition ImagePeriodogram ImagePerspectiveTransformation ImageQ ImageRangeCache ImageReflect ImageRegion ImageResize ImageResolution ImageRotate ImageRotated ImageScaled ImageScan ImageSize ImageSizeAction ImageSizeCache ImageSizeMultipliers ImageSizeRaw ImageSubtract ImageTake ImageTransformation ImageTrim ImageType ImageValue ImageValuePositions Implies Import ImportAutoReplacements ImportString ImprovementImportance In IncidenceGraph IncidenceList IncidenceMatrix IncludeConstantBasis IncludeFileExtension IncludePods IncludeSingularTerm Increment Indent IndentingNewlineSpacings IndentMaxFraction IndependenceTest IndependentEdgeSetQ IndependentUnit IndependentVertexSetQ Indeterminate IndexCreationOptions Indexed IndexGraph IndexTag Inequality InexactNumberQ InexactNumbers Infinity Infix Information Inherited InheritScope Initialization InitializationCell InitializationCellEvaluation InitializationCellWarning InlineCounterAssignments InlineCounterIncrements InlineRules Inner Inpaint Input InputAliases InputAssumptions InputAutoReplacements InputField InputFieldBox InputFieldBoxOptions InputForm InputGrouping InputNamePacket InputNotebook InputPacket InputSettings InputStream InputString InputStringPacket InputToBoxFormPacket Insert InsertionPointObject InsertResults Inset Inset3DBox Inset3DBoxOptions InsetBox InsetBoxOptions Install InstallService InString Integer IntegerDigits IntegerExponent IntegerLength IntegerPart IntegerPartitions IntegerQ Integers IntegerString Integral Integrate Interactive InteractiveTradingChart Interlaced Interleaving InternallyBalancedDecomposition InterpolatingFunction InterpolatingPolynomial Interpolation InterpolationOrder InterpolationPoints InterpolationPrecision Interpretation InterpretationBox InterpretationBoxOptions InterpretationFunction ' + 'InterpretTemplate InterquartileRange Interrupt InterruptSettings Intersection Interval IntervalIntersection IntervalMemberQ IntervalUnion Inverse InverseBetaRegularized InverseCDF InverseChiSquareDistribution InverseContinuousWaveletTransform InverseDistanceTransform InverseEllipticNomeQ InverseErf InverseErfc InverseFourier InverseFourierCosTransform InverseFourierSequenceTransform InverseFourierSinTransform InverseFourierTransform InverseFunction InverseFunctions InverseGammaDistribution InverseGammaRegularized InverseGaussianDistribution InverseGudermannian InverseHaversine InverseJacobiCD InverseJacobiCN InverseJacobiCS InverseJacobiDC InverseJacobiDN InverseJacobiDS InverseJacobiNC InverseJacobiND InverseJacobiNS InverseJacobiSC InverseJacobiSD InverseJacobiSN InverseLaplaceTransform InversePermutation InverseRadon InverseSeries InverseSurvivalFunction InverseWaveletTransform InverseWeierstrassP InverseZTransform Invisible InvisibleApplication InvisibleTimes IrreduciblePolynomialQ IsolatingInterval IsomorphicGraphQ IsotopeData Italic Item ItemBox ItemBoxOptions ItemSize ItemStyle ItoProcess ' + 'JaccardDissimilarity JacobiAmplitude Jacobian JacobiCD JacobiCN JacobiCS JacobiDC JacobiDN JacobiDS JacobiNC JacobiND JacobiNS JacobiP JacobiSC JacobiSD JacobiSN JacobiSymbol JacobiZeta JankoGroupJ1 JankoGroupJ2 JankoGroupJ3 JankoGroupJ4 JarqueBeraALMTest JohnsonDistribution Join Joined JoinedCurve JoinedCurveBox JoinForm JordanDecomposition JordanModelDecomposition ' + 'K KagiChart KaiserBesselWindow KaiserWindow KalmanEstimator KalmanFilter KarhunenLoeveDecomposition KaryTree KatzCentrality KCoreComponents KDistribution KelvinBei KelvinBer KelvinKei KelvinKer KendallTau KendallTauTest KernelExecute KernelMixtureDistribution KernelObject Kernels Ket Khinchin KirchhoffGraph KirchhoffMatrix KleinInvariantJ KnightTourGraph KnotData KnownUnitQ KolmogorovSmirnovTest KroneckerDelta KroneckerModelDecomposition KroneckerProduct KroneckerSymbol KuiperTest KumaraswamyDistribution Kurtosis KuwaharaFilter ' + 'Label Labeled LabeledSlider LabelingFunction LabelStyle LaguerreL LambdaComponents LambertW LanczosWindow LandauDistribution Language LanguageCategory LaplaceDistribution LaplaceTransform Laplacian LaplacianFilter LaplacianGaussianFilter Large Larger Last Latitude LatitudeLongitude LatticeData LatticeReduce Launch LaunchKernels LayeredGraphPlot LayerSizeFunction LayoutInformation LCM LeafCount LeapYearQ LeastSquares LeastSquaresFilterKernel Left LeftArrow LeftArrowBar LeftArrowRightArrow LeftDownTeeVector LeftDownVector LeftDownVectorBar LeftRightArrow LeftRightVector LeftTee LeftTeeArrow LeftTeeVector LeftTriangle LeftTriangleBar LeftTriangleEqual LeftUpDownVector LeftUpTeeVector LeftUpVector LeftUpVectorBar LeftVector LeftVectorBar LegendAppearance Legended LegendFunction LegendLabel LegendLayout LegendMargins LegendMarkers LegendMarkerSize LegendreP LegendreQ LegendreType Length LengthWhile LerchPhi Less LessEqual LessEqualGreater LessFullEqual LessGreater LessLess LessSlantEqual LessTilde LetterCharacter LetterQ Level LeveneTest LeviCivitaTensor LevyDistribution Lexicographic LibraryFunction LibraryFunctionError LibraryFunctionInformation LibraryFunctionLoad LibraryFunctionUnload LibraryLoad LibraryUnload LicenseID LiftingFilterData LiftingWaveletTransform LightBlue LightBrown LightCyan Lighter LightGray LightGreen Lighting LightingAngle LightMagenta LightOrange LightPink LightPurple LightRed LightSources LightYellow Likelihood Limit LimitsPositioning LimitsPositioningTokens LindleyDistribution Line Line3DBox LinearFilter LinearFractionalTransform LinearModelFit LinearOffsetFunction LinearProgramming LinearRecurrence LinearSolve LinearSolveFunction LineBox LineBreak LinebreakAdjustments LineBreakChart LineBreakWithin LineColor LineForm LineGraph LineIndent LineIndentMaxFraction LineIntegralConvolutionPlot LineIntegralConvolutionScale LineLegend LineOpacity LineSpacing LineWrapParts LinkActivate LinkClose LinkConnect LinkConnectedQ LinkCreate LinkError LinkFlush LinkFunction LinkHost LinkInterrupt LinkLaunch LinkMode LinkObject LinkOpen LinkOptions LinkPatterns LinkProtocol LinkRead LinkReadHeld LinkReadyQ Links LinkWrite LinkWriteHeld LiouvilleLambda List Listable ListAnimate ListContourPlot ListContourPlot3D ListConvolve ListCorrelate ListCurvePathPlot ListDeconvolve ListDensityPlot Listen ListFourierSequenceTransform ListInterpolation ListLineIntegralConvolutionPlot ListLinePlot ListLogLinearPlot ListLogLogPlot ListLogPlot ListPicker ListPickerBox ListPickerBoxBackground ListPickerBoxOptions ListPlay ListPlot ListPlot3D ListPointPlot3D ListPolarPlot ListQ ListStreamDensityPlot ListStreamPlot ListSurfacePlot3D ListVectorDensityPlot ListVectorPlot ListVectorPlot3D ListZTransform Literal LiteralSearch LocalClusteringCoefficient LocalizeVariables LocationEquivalenceTest LocationTest Locator LocatorAutoCreate LocatorBox LocatorBoxOptions LocatorCentering LocatorPane LocatorPaneBox LocatorPaneBoxOptions ' + 'LocatorRegion Locked Log Log10 Log2 LogBarnesG LogGamma LogGammaDistribution LogicalExpand LogIntegral LogisticDistribution LogitModelFit LogLikelihood LogLinearPlot LogLogisticDistribution LogLogPlot LogMultinormalDistribution LogNormalDistribution LogPlot LogRankTest LogSeriesDistribution LongEqual Longest LongestAscendingSequence LongestCommonSequence LongestCommonSequencePositions LongestCommonSubsequence LongestCommonSubsequencePositions LongestMatch LongForm Longitude LongLeftArrow LongLeftRightArrow LongRightArrow Loopback LoopFreeGraphQ LowerCaseQ LowerLeftArrow LowerRightArrow LowerTriangularize LowpassFilter LQEstimatorGains LQGRegulator LQOutputRegulatorGains LQRegulatorGains LUBackSubstitution LucasL LuccioSamiComponents LUDecomposition LyapunovSolve LyonsGroupLy ' + 'MachineID MachineName MachineNumberQ MachinePrecision MacintoshSystemPageSetup Magenta Magnification Magnify MainSolve MaintainDynamicCaches Majority MakeBoxes MakeExpression MakeRules MangoldtLambda ManhattanDistance Manipulate Manipulator MannWhitneyTest MantissaExponent Manual Map MapAll MapAt MapIndexed MAProcess MapThread MarcumQ MardiaCombinedTest MardiaKurtosisTest MardiaSkewnessTest MarginalDistribution MarkovProcessProperties Masking MatchingDissimilarity MatchLocalNameQ MatchLocalNames MatchQ Material MathematicaNotation MathieuC MathieuCharacteristicA MathieuCharacteristicB MathieuCharacteristicExponent MathieuCPrime MathieuGroupM11 MathieuGroupM12 MathieuGroupM22 MathieuGroupM23 MathieuGroupM24 MathieuS MathieuSPrime MathMLForm MathMLText Matrices MatrixExp MatrixForm MatrixFunction MatrixLog MatrixPlot MatrixPower MatrixQ MatrixRank Max MaxBend MaxDetect MaxExtraBandwidths MaxExtraConditions MaxFeatures MaxFilter Maximize MaxIterations MaxMemoryUsed MaxMixtureKernels MaxPlotPoints MaxPoints MaxRecursion MaxStableDistribution MaxStepFraction MaxSteps MaxStepSize MaxValue MaxwellDistribution McLaughlinGroupMcL Mean MeanClusteringCoefficient MeanDegreeConnectivity MeanDeviation MeanFilter MeanGraphDistance MeanNeighborDegree MeanShift MeanShiftFilter Median MedianDeviation MedianFilter Medium MeijerG MeixnerDistribution MemberQ MemoryConstrained MemoryInUse Menu MenuAppearance MenuCommandKey MenuEvaluator MenuItem MenuPacket MenuSortingValue MenuStyle MenuView MergeDifferences Mesh MeshFunctions MeshRange MeshShading MeshStyle Message MessageDialog MessageList MessageName MessageOptions MessagePacket Messages MessagesNotebook MetaCharacters MetaInformation Method MethodOptions MexicanHatWavelet MeyerWavelet Min MinDetect MinFilter MinimalPolynomial MinimalStateSpaceModel Minimize Minors MinRecursion MinSize MinStableDistribution Minus MinusPlus MinValue Missing MissingDataMethod MittagLefflerE MixedRadix MixedRadixQuantity MixtureDistribution Mod Modal Mode Modular ModularLambda Module Modulus MoebiusMu Moment Momentary MomentConvert MomentEvaluate MomentGeneratingFunction Monday Monitor MonomialList MonomialOrder MonsterGroupM MorletWavelet MorphologicalBinarize MorphologicalBranchPoints MorphologicalComponents MorphologicalEulerNumber MorphologicalGraph MorphologicalPerimeter MorphologicalTransform Most MouseAnnotation MouseAppearance MouseAppearanceTag MouseButtons Mouseover MousePointerNote MousePosition MovingAverage MovingMedian MoyalDistribution MultiedgeStyle MultilaunchWarning MultiLetterItalics MultiLetterStyle MultilineFunction Multinomial MultinomialDistribution MultinormalDistribution MultiplicativeOrder Multiplicity Multiselection MultivariateHypergeometricDistribution MultivariatePoissonDistribution MultivariateTDistribution ' + 'N NakagamiDistribution NameQ Names NamespaceBox Nand NArgMax NArgMin NBernoulliB NCache NDSolve NDSolveValue Nearest NearestFunction NeedCurrentFrontEndPackagePacket NeedCurrentFrontEndSymbolsPacket NeedlemanWunschSimilarity Needs Negative NegativeBinomialDistribution NegativeMultinomialDistribution NeighborhoodGraph Nest NestedGreaterGreater NestedLessLess NestedScriptRules NestList NestWhile NestWhileList NevilleThetaC NevilleThetaD NevilleThetaN NevilleThetaS NewPrimitiveStyle NExpectation Next NextPrime NHoldAll NHoldFirst NHoldRest NicholsGridLines NicholsPlot NIntegrate NMaximize NMaxValue NMinimize NMinValue NominalVariables NonAssociative NoncentralBetaDistribution NoncentralChiSquareDistribution NoncentralFRatioDistribution NoncentralStudentTDistribution NonCommutativeMultiply NonConstants None NonlinearModelFit NonlocalMeansFilter NonNegative NonPositive Nor NorlundB Norm Normal NormalDistribution NormalGrouping Normalize NormalizedSquaredEuclideanDistance NormalsFunction NormFunction Not NotCongruent NotCupCap NotDoubleVerticalBar Notebook NotebookApply NotebookAutoSave NotebookClose NotebookConvertSettings NotebookCreate NotebookCreateReturnObject NotebookDefault NotebookDelete NotebookDirectory NotebookDynamicExpression NotebookEvaluate NotebookEventActions NotebookFileName NotebookFind NotebookFindReturnObject NotebookGet NotebookGetLayoutInformationPacket NotebookGetMisspellingsPacket NotebookInformation NotebookInterfaceObject NotebookLocate NotebookObject NotebookOpen NotebookOpenReturnObject NotebookPath NotebookPrint NotebookPut NotebookPutReturnObject NotebookRead NotebookResetGeneratedCells Notebooks NotebookSave NotebookSaveAs NotebookSelection NotebookSetupLayoutInformationPacket NotebooksMenu NotebookWrite NotElement NotEqualTilde NotExists NotGreater NotGreaterEqual NotGreaterFullEqual NotGreaterGreater NotGreaterLess NotGreaterSlantEqual NotGreaterTilde NotHumpDownHump NotHumpEqual NotLeftTriangle NotLeftTriangleBar NotLeftTriangleEqual NotLess NotLessEqual NotLessFullEqual NotLessGreater NotLessLess NotLessSlantEqual NotLessTilde NotNestedGreaterGreater NotNestedLessLess NotPrecedes NotPrecedesEqual NotPrecedesSlantEqual NotPrecedesTilde NotReverseElement NotRightTriangle NotRightTriangleBar NotRightTriangleEqual NotSquareSubset NotSquareSubsetEqual NotSquareSuperset NotSquareSupersetEqual NotSubset NotSubsetEqual NotSucceeds NotSucceedsEqual NotSucceedsSlantEqual NotSucceedsTilde NotSuperset NotSupersetEqual NotTilde NotTildeEqual NotTildeFullEqual NotTildeTilde NotVerticalBar NProbability NProduct NProductFactors NRoots NSolve NSum NSumTerms Null NullRecords NullSpace NullWords Number NumberFieldClassNumber NumberFieldDiscriminant NumberFieldFundamentalUnits NumberFieldIntegralBasis NumberFieldNormRepresentatives NumberFieldRegulator NumberFieldRootsOfUnity NumberFieldSignature NumberForm NumberFormat NumberMarks NumberMultiplier NumberPadding NumberPoint NumberQ NumberSeparator ' + 'NumberSigns NumberString Numerator NumericFunction NumericQ NuttallWindow NValues NyquistGridLines NyquistPlot ' + 'O ObservabilityGramian ObservabilityMatrix ObservableDecomposition ObservableModelQ OddQ Off Offset OLEData On ONanGroupON OneIdentity Opacity Open OpenAppend Opener OpenerBox OpenerBoxOptions OpenerView OpenFunctionInspectorPacket Opening OpenRead OpenSpecialOptions OpenTemporary OpenWrite Operate OperatingSystem OptimumFlowData Optional OptionInspectorSettings OptionQ Options OptionsPacket OptionsPattern OptionValue OptionValueBox OptionValueBoxOptions Or Orange Order OrderDistribution OrderedQ Ordering Orderless OrnsteinUhlenbeckProcess Orthogonalize Out Outer OutputAutoOverwrite OutputControllabilityMatrix OutputControllableModelQ OutputForm OutputFormData OutputGrouping OutputMathEditExpression OutputNamePacket OutputResponse OutputSizeLimit OutputStream Over OverBar OverDot Overflow OverHat Overlaps Overlay OverlayBox OverlayBoxOptions Overscript OverscriptBox OverscriptBoxOptions OverTilde OverVector OwenT OwnValues ' + 'PackingMethod PaddedForm Padding PadeApproximant PadLeft PadRight PageBreakAbove PageBreakBelow PageBreakWithin PageFooterLines PageFooters PageHeaderLines PageHeaders PageHeight PageRankCentrality PageWidth PairedBarChart PairedHistogram PairedSmoothHistogram PairedTTest PairedZTest PaletteNotebook PalettePath Pane PaneBox PaneBoxOptions Panel PanelBox PanelBoxOptions Paneled PaneSelector PaneSelectorBox PaneSelectorBoxOptions PaperWidth ParabolicCylinderD ParagraphIndent ParagraphSpacing ParallelArray ParallelCombine ParallelDo ParallelEvaluate Parallelization Parallelize ParallelMap ParallelNeeds ParallelProduct ParallelSubmit ParallelSum ParallelTable ParallelTry Parameter ParameterEstimator ParameterMixtureDistribution ParameterVariables ParametricFunction ParametricNDSolve ParametricNDSolveValue ParametricPlot ParametricPlot3D ParentConnect ParentDirectory ParentForm Parenthesize ParentList ParetoDistribution Part PartialCorrelationFunction PartialD ParticleData Partition PartitionsP PartitionsQ ParzenWindow PascalDistribution PassEventsDown PassEventsUp Paste PasteBoxFormInlineCells PasteButton Path PathGraph PathGraphQ Pattern PatternSequence PatternTest PauliMatrix PaulWavelet Pause PausedTime PDF PearsonChiSquareTest PearsonCorrelationTest PearsonDistribution PerformanceGoal PeriodicInterpolation Periodogram PeriodogramArray PermutationCycles PermutationCyclesQ PermutationGroup PermutationLength PermutationList PermutationListQ PermutationMax PermutationMin PermutationOrder PermutationPower PermutationProduct PermutationReplace Permutations PermutationSupport Permute PeronaMalikFilter Perpendicular PERTDistribution PetersenGraph PhaseMargins Pi Pick PIDData PIDDerivativeFilter PIDFeedforward PIDTune Piecewise PiecewiseExpand PieChart PieChart3D PillaiTrace PillaiTraceTest Pink Pivoting PixelConstrained PixelValue PixelValuePositions Placed Placeholder PlaceholderReplace Plain PlanarGraphQ Play PlayRange Plot Plot3D Plot3Matrix PlotDivision PlotJoined PlotLabel PlotLayout PlotLegends PlotMarkers PlotPoints PlotRange PlotRangeClipping PlotRangePadding PlotRegion PlotStyle Plus PlusMinus Pochhammer PodStates PodWidth Point Point3DBox PointBox PointFigureChart PointForm PointLegend PointSize PoissonConsulDistribution PoissonDistribution PoissonProcess PoissonWindow PolarAxes PolarAxesOrigin PolarGridLines PolarPlot PolarTicks PoleZeroMarkers PolyaAeppliDistribution PolyGamma Polygon Polygon3DBox Polygon3DBoxOptions PolygonBox PolygonBoxOptions PolygonHoleScale PolygonIntersections PolygonScale PolyhedronData PolyLog PolynomialExtendedGCD PolynomialForm PolynomialGCD PolynomialLCM PolynomialMod PolynomialQ PolynomialQuotient PolynomialQuotientRemainder PolynomialReduce PolynomialRemainder Polynomials PopupMenu PopupMenuBox PopupMenuBoxOptions PopupView PopupWindow Position Positive PositiveDefiniteMatrixQ PossibleZeroQ Postfix PostScript Power PowerDistribution PowerExpand PowerMod PowerModList ' + 'PowerSpectralDensity PowersRepresentations PowerSymmetricPolynomial Precedence PrecedenceForm Precedes PrecedesEqual PrecedesSlantEqual PrecedesTilde Precision PrecisionGoal PreDecrement PredictionRoot PreemptProtect PreferencesPath Prefix PreIncrement Prepend PrependTo PreserveImageOptions Previous PriceGraphDistribution PrimaryPlaceholder Prime PrimeNu PrimeOmega PrimePi PrimePowerQ PrimeQ Primes PrimeZetaP PrimitiveRoot PrincipalComponents PrincipalValue Print PrintAction PrintForm PrintingCopies PrintingOptions PrintingPageRange PrintingStartingPageNumber PrintingStyleEnvironment PrintPrecision PrintTemporary Prism PrismBox PrismBoxOptions PrivateCellOptions PrivateEvaluationOptions PrivateFontOptions PrivateFrontEndOptions PrivateNotebookOptions PrivatePaths Probability ProbabilityDistribution ProbabilityPlot ProbabilityPr ProbabilityScalePlot ProbitModelFit ProcessEstimator ProcessParameterAssumptions ProcessParameterQ ProcessStateDomain ProcessTimeDomain Product ProductDistribution ProductLog ProgressIndicator ProgressIndicatorBox ProgressIndicatorBoxOptions Projection Prolog PromptForm Properties Property PropertyList PropertyValue Proportion Proportional Protect Protected ProteinData Pruning PseudoInverse Purple Put PutAppend Pyramid PyramidBox PyramidBoxOptions ' + 'QBinomial QFactorial QGamma QHypergeometricPFQ QPochhammer QPolyGamma QRDecomposition QuadraticIrrationalQ Quantile QuantilePlot Quantity QuantityForm QuantityMagnitude QuantityQ QuantityUnit Quartics QuartileDeviation Quartiles QuartileSkewness QueueingNetworkProcess QueueingProcess QueueProperties Quiet Quit Quotient QuotientRemainder ' + 'RadialityCentrality RadicalBox RadicalBoxOptions RadioButton RadioButtonBar RadioButtonBox RadioButtonBoxOptions Radon RamanujanTau RamanujanTauL RamanujanTauTheta RamanujanTauZ Random RandomChoice RandomComplex RandomFunction RandomGraph RandomImage RandomInteger RandomPermutation RandomPrime RandomReal RandomSample RandomSeed RandomVariate RandomWalkProcess Range RangeFilter RangeSpecification RankedMax RankedMin Raster Raster3D Raster3DBox Raster3DBoxOptions RasterArray RasterBox RasterBoxOptions Rasterize RasterSize Rational RationalFunctions Rationalize Rationals Ratios Raw RawArray RawBoxes RawData RawMedium RayleighDistribution Re Read ReadList ReadProtected Real RealBlockDiagonalForm RealDigits RealExponent Reals Reap Record RecordLists RecordSeparators Rectangle RectangleBox RectangleBoxOptions RectangleChart RectangleChart3D RecurrenceFilter RecurrenceTable RecurringDigitsForm Red Reduce RefBox ReferenceLineStyle ReferenceMarkers ReferenceMarkerStyle Refine ReflectionMatrix ReflectionTransform Refresh RefreshRate RegionBinarize RegionFunction RegionPlot RegionPlot3D RegularExpression Regularization Reinstall Release ReleaseHold ReliabilityDistribution ReliefImage ReliefPlot Remove RemoveAlphaChannel RemoveAsynchronousTask Removed RemoveInputStreamMethod RemoveOutputStreamMethod RemoveProperty RemoveScheduledTask RenameDirectory RenameFile RenderAll RenderingOptions RenewalProcess RenkoChart Repeated RepeatedNull RepeatedString Replace ReplaceAll ReplaceHeldPart ReplaceImageValue ReplaceList ReplacePart ReplacePixelValue ReplaceRepeated Resampling Rescale RescalingTransform ResetDirectory ResetMenusPacket ResetScheduledTask Residue Resolve Rest Resultant ResumePacket Return ReturnExpressionPacket ReturnInputFormPacket ReturnPacket ReturnTextPacket Reverse ReverseBiorthogonalSplineWavelet ReverseElement ReverseEquilibrium ReverseGraph ReverseUpEquilibrium RevolutionAxis RevolutionPlot3D RGBColor RiccatiSolve RiceDistribution RidgeFilter RiemannR RiemannSiegelTheta RiemannSiegelZ Riffle Right RightArrow RightArrowBar RightArrowLeftArrow RightCosetRepresentative RightDownTeeVector RightDownVector RightDownVectorBar RightTee RightTeeArrow RightTeeVector RightTriangle RightTriangleBar RightTriangleEqual RightUpDownVector RightUpTeeVector RightUpVector RightUpVectorBar RightVector RightVectorBar RiskAchievementImportance RiskReductionImportance RogersTanimotoDissimilarity Root RootApproximant RootIntervals RootLocusPlot RootMeanSquare RootOfUnityQ RootReduce Roots RootSum Rotate RotateLabel RotateLeft RotateRight RotationAction RotationBox RotationBoxOptions RotationMatrix RotationTransform Round RoundImplies RoundingRadius Row RowAlignments RowBackgrounds RowBox RowHeights RowLines RowMinHeight RowReduce RowsEqual RowSpacings RSolve RudvalisGroupRu Rule RuleCondition RuleDelayed RuleForm RulerUnits Run RunScheduledTask RunThrough RuntimeAttributes RuntimeOptions RussellRaoDissimilarity ' + 'SameQ SameTest SampleDepth SampledSoundFunction SampledSoundList SampleRate SamplingPeriod SARIMAProcess SARMAProcess SatisfiabilityCount SatisfiabilityInstances SatisfiableQ Saturday Save Saveable SaveAutoDelete SaveDefinitions SawtoothWave Scale Scaled ScaleDivisions ScaledMousePosition ScaleOrigin ScalePadding ScaleRanges ScaleRangeStyle ScalingFunctions ScalingMatrix ScalingTransform Scan ScheduledTaskActiveQ ScheduledTaskData ScheduledTaskObject ScheduledTasks SchurDecomposition ScientificForm ScreenRectangle ScreenStyleEnvironment ScriptBaselineShifts ScriptLevel ScriptMinSize ScriptRules ScriptSizeMultipliers Scrollbars ScrollingOptions ScrollPosition Sec Sech SechDistribution SectionGrouping SectorChart SectorChart3D SectorOrigin SectorSpacing SeedRandom Select Selectable SelectComponents SelectedCells SelectedNotebook Selection SelectionAnimate SelectionCell SelectionCellCreateCell SelectionCellDefaultStyle SelectionCellParentStyle SelectionCreateCell SelectionDebuggerTag SelectionDuplicateCell SelectionEvaluate SelectionEvaluateCreateCell SelectionMove SelectionPlaceholder SelectionSetStyle SelectWithContents SelfLoops SelfLoopStyle SemialgebraicComponentInstances SendMail Sequence SequenceAlignment SequenceForm SequenceHold SequenceLimit Series SeriesCoefficient SeriesData SessionTime Set SetAccuracy SetAlphaChannel SetAttributes Setbacks SetBoxFormNamesPacket SetDelayed SetDirectory SetEnvironment SetEvaluationNotebook SetFileDate SetFileLoadingContext SetNotebookStatusLine SetOptions SetOptionsPacket SetPrecision SetProperty SetSelectedNotebook SetSharedFunction SetSharedVariable SetSpeechParametersPacket SetStreamPosition SetSystemOptions Setter SetterBar SetterBox SetterBoxOptions Setting SetValue Shading Shallow ShannonWavelet ShapiroWilkTest Share Sharpen ShearingMatrix ShearingTransform ShenCastanMatrix Short ShortDownArrow Shortest ShortestMatch ShortestPathFunction ShortLeftArrow ShortRightArrow ShortUpArrow Show ShowAutoStyles ShowCellBracket ShowCellLabel ShowCellTags ShowClosedCellArea ShowContents ShowControls ShowCursorTracker ShowGroupOpenCloseIcon ShowGroupOpener ShowInvisibleCharacters ShowPageBreaks ShowPredictiveInterface ShowSelection ShowShortBoxForm ShowSpecialCharacters ShowStringCharacters ShowSyntaxStyles ShrinkingDelay ShrinkWrapBoundingBox SiegelTheta SiegelTukeyTest Sign Signature SignedRankTest SignificanceLevel SignPadding SignTest SimilarityRules SimpleGraph SimpleGraphQ Simplify Sin Sinc SinghMaddalaDistribution SingleEvaluation SingleLetterItalics SingleLetterStyle SingularValueDecomposition SingularValueList SingularValuePlot SingularValues Sinh SinhIntegral SinIntegral SixJSymbol Skeleton SkeletonTransform SkellamDistribution Skewness SkewNormalDistribution Skip SliceDistribution Slider Slider2D Slider2DBox Slider2DBoxOptions SliderBox SliderBoxOptions SlideView Slot SlotSequence Small SmallCircle Smaller SmithDelayCompensator SmithWatermanSimilarity ' + 'SmoothDensityHistogram SmoothHistogram SmoothHistogram3D SmoothKernelDistribution SocialMediaData Socket SokalSneathDissimilarity Solve SolveAlways SolveDelayed Sort SortBy Sound SoundAndGraphics SoundNote SoundVolume Sow Space SpaceForm Spacer Spacings Span SpanAdjustments SpanCharacterRounding SpanFromAbove SpanFromBoth SpanFromLeft SpanLineThickness SpanMaxSize SpanMinSize SpanningCharacters SpanSymmetric SparseArray SpatialGraphDistribution Speak SpeakTextPacket SpearmanRankTest SpearmanRho Spectrogram SpectrogramArray Specularity SpellingCorrection SpellingDictionaries SpellingDictionariesPath SpellingOptions SpellingSuggestionsPacket Sphere SphereBox SphericalBesselJ SphericalBesselY SphericalHankelH1 SphericalHankelH2 SphericalHarmonicY SphericalPlot3D SphericalRegion SpheroidalEigenvalue SpheroidalJoiningFactor SpheroidalPS SpheroidalPSPrime SpheroidalQS SpheroidalQSPrime SpheroidalRadialFactor SpheroidalS1 SpheroidalS1Prime SpheroidalS2 SpheroidalS2Prime Splice SplicedDistribution SplineClosed SplineDegree SplineKnots SplineWeights Split SplitBy SpokenString Sqrt SqrtBox SqrtBoxOptions Square SquaredEuclideanDistance SquareFreeQ SquareIntersection SquaresR SquareSubset SquareSubsetEqual SquareSuperset SquareSupersetEqual SquareUnion SquareWave StabilityMargins StabilityMarginsStyle StableDistribution Stack StackBegin StackComplete StackInhibit StandardDeviation StandardDeviationFilter StandardForm Standardize StandbyDistribution Star StarGraph StartAsynchronousTask StartingStepSize StartOfLine StartOfString StartScheduledTask StartupSound StateDimensions StateFeedbackGains StateOutputEstimator StateResponse StateSpaceModel StateSpaceRealization StateSpaceTransform StationaryDistribution StationaryWaveletPacketTransform StationaryWaveletTransform StatusArea StatusCentrality StepMonitor StieltjesGamma StirlingS1 StirlingS2 StopAsynchronousTask StopScheduledTask StrataVariables StratonovichProcess StreamColorFunction StreamColorFunctionScaling StreamDensityPlot StreamPlot StreamPoints StreamPosition Streams StreamScale StreamStyle String StringBreak StringByteCount StringCases StringCount StringDrop StringExpression StringForm StringFormat StringFreeQ StringInsert StringJoin StringLength StringMatchQ StringPosition StringQ StringReplace StringReplaceList StringReplacePart StringReverse StringRotateLeft StringRotateRight StringSkeleton StringSplit StringTake StringToStream StringTrim StripBoxes StripOnInput StripWrapperBoxes StrokeForm StructuralImportance StructuredArray StructuredSelection StruveH StruveL Stub StudentTDistribution Style StyleBox StyleBoxAutoDelete StyleBoxOptions StyleData StyleDefinitions StyleForm StyleKeyMapping StyleMenuListing StyleNameDialogSettings StyleNames StylePrint StyleSheetPath Subfactorial Subgraph SubMinus SubPlus SubresultantPolynomialRemainders ' + 'SubresultantPolynomials Subresultants Subscript SubscriptBox SubscriptBoxOptions Subscripted Subset SubsetEqual Subsets SubStar Subsuperscript SubsuperscriptBox SubsuperscriptBoxOptions Subtract SubtractFrom SubValues Succeeds SucceedsEqual SucceedsSlantEqual SucceedsTilde SuchThat Sum SumConvergence Sunday SuperDagger SuperMinus SuperPlus Superscript SuperscriptBox SuperscriptBoxOptions Superset SupersetEqual SuperStar Surd SurdForm SurfaceColor SurfaceGraphics SurvivalDistribution SurvivalFunction SurvivalModel SurvivalModelFit SuspendPacket SuzukiDistribution SuzukiGroupSuz SwatchLegend Switch Symbol SymbolName SymletWavelet Symmetric SymmetricGroup SymmetricMatrixQ SymmetricPolynomial SymmetricReduction Symmetrize SymmetrizedArray SymmetrizedArrayRules SymmetrizedDependentComponents SymmetrizedIndependentComponents SymmetrizedReplacePart SynchronousInitialization SynchronousUpdating Syntax SyntaxForm SyntaxInformation SyntaxLength SyntaxPacket SyntaxQ SystemDialogInput SystemException SystemHelpPath SystemInformation SystemInformationData SystemOpen SystemOptions SystemsModelDelay SystemsModelDelayApproximate SystemsModelDelete SystemsModelDimensions SystemsModelExtract SystemsModelFeedbackConnect SystemsModelLabels SystemsModelOrder SystemsModelParallelConnect SystemsModelSeriesConnect SystemsModelStateFeedbackConnect SystemStub ' + 'Tab TabFilling Table TableAlignments TableDepth TableDirections TableForm TableHeadings TableSpacing TableView TableViewBox TabSpacings TabView TabViewBox TabViewBoxOptions TagBox TagBoxNote TagBoxOptions TaggingRules TagSet TagSetDelayed TagStyle TagUnset Take TakeWhile Tally Tan Tanh TargetFunctions TargetUnits TautologyQ TelegraphProcess TemplateBox TemplateBoxOptions TemplateSlotSequence TemporalData Temporary TemporaryVariable TensorContract TensorDimensions TensorExpand TensorProduct TensorQ TensorRank TensorReduce TensorSymmetry TensorTranspose TensorWedge Tetrahedron TetrahedronBox TetrahedronBoxOptions TeXForm TeXSave Text Text3DBox Text3DBoxOptions TextAlignment TextBand TextBoundingBox TextBox TextCell TextClipboardType TextData TextForm TextJustification TextLine TextPacket TextParagraph TextRecognize TextRendering TextStyle Texture TextureCoordinateFunction TextureCoordinateScaling Therefore ThermometerGauge Thick Thickness Thin Thinning ThisLink ThompsonGroupTh Thread ThreeJSymbol Threshold Through Throw Thumbnail Thursday Ticks TicksStyle Tilde TildeEqual TildeFullEqual TildeTilde TimeConstrained TimeConstraint Times TimesBy TimeSeriesForecast TimeSeriesInvertibility TimeUsed TimeValue TimeZone Timing Tiny TitleGrouping TitsGroupT ToBoxes ToCharacterCode ToColor ToContinuousTimeModel ToDate ToDiscreteTimeModel ToeplitzMatrix ToExpression ToFileName Together Toggle ToggleFalse Toggler TogglerBar TogglerBox TogglerBoxOptions ToHeldExpression ToInvertibleTimeSeries TokenWords Tolerance ToLowerCase ToNumberField TooBig Tooltip TooltipBox TooltipBoxOptions TooltipDelay TooltipStyle Top TopHatTransform TopologicalSort ToRadicals ToRules ToString Total TotalHeight TotalVariationFilter TotalWidth TouchscreenAutoZoom TouchscreenControlPlacement ToUpperCase Tr Trace TraceAbove TraceAction TraceBackward TraceDepth TraceDialog TraceForward TraceInternal TraceLevel TraceOff TraceOn TraceOriginal TracePrint TraceScan TrackedSymbols TradingChart TraditionalForm TraditionalFunctionNotation TraditionalNotation TraditionalOrder TransferFunctionCancel TransferFunctionExpand TransferFunctionFactor TransferFunctionModel TransferFunctionPoles TransferFunctionTransform TransferFunctionZeros TransformationFunction TransformationFunctions TransformationMatrix TransformedDistribution TransformedField Translate TranslationTransform TransparentColor Transpose TreeForm TreeGraph TreeGraphQ TreePlot TrendStyle TriangleWave TriangularDistribution Trig TrigExpand TrigFactor TrigFactorList Trigger TrigReduce TrigToExp TrimmedMean True TrueQ TruncatedDistribution TsallisQExponentialDistribution TsallisQGaussianDistribution TTest Tube TubeBezierCurveBox TubeBezierCurveBoxOptions TubeBox TubeBSplineCurveBox TubeBSplineCurveBoxOptions Tuesday TukeyLambdaDistribution TukeyWindow Tuples TuranGraph TuringMachine ' + 'Transparent ' + 'UnateQ Uncompress Undefined UnderBar Underflow Underlined Underoverscript UnderoverscriptBox UnderoverscriptBoxOptions Underscript UnderscriptBox UnderscriptBoxOptions UndirectedEdge UndirectedGraph UndirectedGraphQ UndocumentedTestFEParserPacket UndocumentedTestGetSelectionPacket Unequal Unevaluated UniformDistribution UniformGraphDistribution UniformSumDistribution Uninstall Union UnionPlus Unique UnitBox UnitConvert UnitDimensions Unitize UnitRootTest UnitSimplify UnitStep UnitTriangle UnitVector Unprotect UnsameQ UnsavedVariables Unset UnsetShared UntrackedVariables Up UpArrow UpArrowBar UpArrowDownArrow Update UpdateDynamicObjects UpdateDynamicObjectsSynchronous UpdateInterval UpDownArrow UpEquilibrium UpperCaseQ UpperLeftArrow UpperRightArrow UpperTriangularize Upsample UpSet UpSetDelayed UpTee UpTeeArrow UpValues URL URLFetch URLFetchAsynchronous URLSave URLSaveAsynchronous UseGraphicsRange Using UsingFrontEnd ' + 'V2Get ValidationLength Value ValueBox ValueBoxOptions ValueForm ValueQ ValuesData Variables Variance VarianceEquivalenceTest VarianceEstimatorFunction VarianceGammaDistribution VarianceTest VectorAngle VectorColorFunction VectorColorFunctionScaling VectorDensityPlot VectorGlyphData VectorPlot VectorPlot3D VectorPoints VectorQ Vectors VectorScale VectorStyle Vee Verbatim Verbose VerboseConvertToPostScriptPacket VerifyConvergence VerifySolutions VerifyTestAssumptions Version VersionNumber VertexAdd VertexCapacity VertexColors VertexComponent VertexConnectivity VertexCoordinateRules VertexCoordinates VertexCorrelationSimilarity VertexCosineSimilarity VertexCount VertexCoverQ VertexDataCoordinates VertexDegree VertexDelete VertexDiceSimilarity VertexEccentricity VertexInComponent VertexInDegree VertexIndex VertexJaccardSimilarity VertexLabeling VertexLabels VertexLabelStyle VertexList VertexNormals VertexOutComponent VertexOutDegree VertexQ VertexRenderingFunction VertexReplace VertexShape VertexShapeFunction VertexSize VertexStyle VertexTextureCoordinates VertexWeight Vertical VerticalBar VerticalForm VerticalGauge VerticalSeparator VerticalSlider VerticalTilde ViewAngle ViewCenter ViewMatrix ViewPoint ViewPointSelectorSettings ViewPort ViewRange ViewVector ViewVertical VirtualGroupData Visible VisibleCell VoigtDistribution VonMisesDistribution ' + 'WaitAll WaitAsynchronousTask WaitNext WaitUntil WakebyDistribution WalleniusHypergeometricDistribution WaringYuleDistribution WatershedComponents WatsonUSquareTest WattsStrogatzGraphDistribution WaveletBestBasis WaveletFilterCoefficients WaveletImagePlot WaveletListPlot WaveletMapIndexed WaveletMatrixPlot WaveletPhi WaveletPsi WaveletScale WaveletScalogram WaveletThreshold WeaklyConnectedComponents WeaklyConnectedGraphQ WeakStationarity WeatherData WeberE Wedge Wednesday WeibullDistribution WeierstrassHalfPeriods WeierstrassInvariants WeierstrassP WeierstrassPPrime WeierstrassSigma WeierstrassZeta WeightedAdjacencyGraph WeightedAdjacencyMatrix WeightedData WeightedGraphQ Weights WelchWindow WheelGraph WhenEvent Which While White Whitespace WhitespaceCharacter WhittakerM WhittakerW WienerFilter WienerProcess WignerD WignerSemicircleDistribution WilksW WilksWTest WindowClickSelect WindowElements WindowFloating WindowFrame WindowFrameElements WindowMargins WindowMovable WindowOpacity WindowSelected WindowSize WindowStatusArea WindowTitle WindowToolbars WindowWidth With WolframAlpha WolframAlphaDate WolframAlphaQuantity WolframAlphaResult Word WordBoundary WordCharacter WordData WordSearch WordSeparators WorkingPrecision Write WriteString Wronskian ' + 'XMLElement XMLObject Xnor Xor ' + 'Yellow YuleDissimilarity ' + 'ZernikeR ZeroSymmetric ZeroTest ZeroWidthTimes Zeta ZetaZero ZipfDistribution ZTest ZTransform ' + '$Aborted $ActivationGroupID $ActivationKey $ActivationUserRegistered $AddOnsDirectory $AssertFunction $Assumptions $AsynchronousTask $BaseDirectory $BatchInput $BatchOutput $BoxForms $ByteOrdering $Canceled $CharacterEncoding $CharacterEncodings $CommandLine $CompilationTarget $ConditionHold $ConfiguredKernels $Context $ContextPath $ControlActiveSetting $CreationDate $CurrentLink $DateStringFormat $DefaultFont $DefaultFrontEnd $DefaultImagingDevice $DefaultPath $Display $DisplayFunction $DistributedContexts $DynamicEvaluation $Echo $Epilog $ExportFormats $Failed $FinancialDataSource $FormatType $FrontEnd $FrontEndSession $GeoLocation $HistoryLength $HomeDirectory $HTTPCookies $IgnoreEOF $ImagingDevices $ImportFormats $InitialDirectory $Input $InputFileName $InputStreamMethods $Inspector $InstallationDate $InstallationDirectory $InterfaceEnvironment $IterationLimit $KernelCount $KernelID $Language $LaunchDirectory $LibraryPath $LicenseExpirationDate $LicenseID $LicenseProcesses $LicenseServer $LicenseSubprocesses $LicenseType $Line $Linked $LinkSupported $LoadedFiles $MachineAddresses $MachineDomain $MachineDomains $MachineEpsilon $MachineID $MachineName $MachinePrecision $MachineType $MaxExtraPrecision $MaxLicenseProcesses $MaxLicenseSubprocesses $MaxMachineNumber $MaxNumber $MaxPiecewiseCases $MaxPrecision $MaxRootDegree $MessageGroups $MessageList $MessagePrePrint $Messages $MinMachineNumber $MinNumber $MinorReleaseNumber $MinPrecision $ModuleNumber $NetworkLicense $NewMessage $NewSymbol $Notebooks $NumberMarks $Off $OperatingSystem $Output $OutputForms $OutputSizeLimit $OutputStreamMethods $Packages $ParentLink $ParentProcessID $PasswordFile $PatchLevelID $Path $PathnameSeparator $PerformanceGoal $PipeSupported $Post $Pre $PreferencesDirectory $PrePrint $PreRead $PrintForms $PrintLiteral $ProcessID $ProcessorCount $ProcessorType $ProductInformation $ProgramName $RandomState $RecursionLimit $ReleaseNumber $RootDirectory $ScheduledTask $ScriptCommandLine $SessionID $SetParentLink $SharedFunctions $SharedVariables $SoundDisplay $SoundDisplayFunction $SuppressInputFormHeads $SynchronousEvaluation $SyntaxHandler $System $SystemCharacterEncoding $SystemID $SystemWordLength $TemporaryDirectory $TemporaryPrefix $TextStyle $TimedOut $TimeUnit $TimeZone $TopDirectory $TraceOff $TraceOn $TracePattern $TracePostAction $TracePreAction $Urgent $UserAddOnsDirectory $UserBaseDirectory $UserDocumentsDirectory $UserName $Version $VersionNumber',
          contains: [{
            className: "comment",
            begin: /\(\*/,
            end: /\*\)/
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, {
            className: 'list',
            begin: /\{/,
            end: /\}/,
            illegal: /:/
          }]
        };
      };
    }, {}],
    71: [function(require, module, exports) {
      module.exports = function(hljs) {
        var COMMON_CONTAINS = [hljs.C_NUMBER_MODE, {
          className: 'string',
          begin: '\'',
          end: '\'',
          contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}]
        }];
        var TRANSPOSE = {
          relevance: 0,
          contains: [{
            className: 'operator',
            begin: /'['\.]*/
          }]
        };
        return {
          keywords: {
            keyword: 'break case catch classdef continue else elseif end enumerated events for function ' + 'global if methods otherwise parfor persistent properties return spmd switch try while',
            built_in: 'sin sind sinh asin asind asinh cos cosd cosh acos acosd acosh tan tand tanh atan ' + 'atand atan2 atanh sec secd sech asec asecd asech csc cscd csch acsc acscd acsch cot ' + 'cotd coth acot acotd acoth hypot exp expm1 log log1p log10 log2 pow2 realpow reallog ' + 'realsqrt sqrt nthroot nextpow2 abs angle complex conj imag real unwrap isreal ' + 'cplxpair fix floor ceil round mod rem sign airy besselj bessely besselh besseli ' + 'besselk beta betainc betaln ellipj ellipke erf erfc erfcx erfinv expint gamma ' + 'gammainc gammaln psi legendre cross dot factor isprime primes gcd lcm rat rats perms ' + 'nchoosek factorial cart2sph cart2pol pol2cart sph2cart hsv2rgb rgb2hsv zeros ones ' + 'eye repmat rand randn linspace logspace freqspace meshgrid accumarray size length ' + 'ndims numel disp isempty isequal isequalwithequalnans cat reshape diag blkdiag tril ' + 'triu fliplr flipud flipdim rot90 find sub2ind ind2sub bsxfun ndgrid permute ipermute ' + 'shiftdim circshift squeeze isscalar isvector ans eps realmax realmin pi i inf nan ' + 'isnan isinf isfinite j why compan gallery hadamard hankel hilb invhilb magic pascal ' + 'rosser toeplitz vander wilkinson'
          },
          illegal: '(//|"|#|/\\*|\\s+/\\w+)',
          contains: [{
            className: 'function',
            beginKeywords: 'function',
            end: '$',
            contains: [hljs.UNDERSCORE_TITLE_MODE, {
              className: 'params',
              begin: '\\(',
              end: '\\)'
            }, {
              className: 'params',
              begin: '\\[',
              end: '\\]'
            }]
          }, {
            begin: /[a-zA-Z_][a-zA-Z_0-9]*'['\.]*/,
            returnBegin: true,
            relevance: 0,
            contains: [{
              begin: /[a-zA-Z_][a-zA-Z_0-9]*/,
              relevance: 0
            }, TRANSPOSE.contains[0]]
          }, {
            className: 'matrix',
            begin: '\\[',
            end: '\\]',
            contains: COMMON_CONTAINS,
            relevance: 0,
            starts: TRANSPOSE
          }, {
            className: 'cell',
            begin: '\\{',
            end: /}/,
            contains: COMMON_CONTAINS,
            relevance: 0,
            starts: TRANSPOSE
          }, {
            begin: /\)/,
            relevance: 0,
            starts: TRANSPOSE
          }, hljs.COMMENT('^\\s*\\%\\{\\s*$', '^\\s*\\%\\}\\s*$'), hljs.COMMENT('\\%', '$')].concat(COMMON_CONTAINS)
        };
      };
    }, {}],
    72: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: 'int float string vector matrix if else switch case default while do for in break ' + 'continue global proc return about abs addAttr addAttributeEditorNodeHelp addDynamic ' + 'addNewShelfTab addPP addPanelCategory addPrefixToName advanceToNextDrivenKey ' + 'affectedNet affects aimConstraint air alias aliasAttr align alignCtx alignCurve ' + 'alignSurface allViewFit ambientLight angle angleBetween animCone animCurveEditor ' + 'animDisplay animView annotate appendStringArray applicationName applyAttrPreset ' + 'applyTake arcLenDimContext arcLengthDimension arclen arrayMapper art3dPaintCtx ' + 'artAttrCtx artAttrPaintVertexCtx artAttrSkinPaintCtx artAttrTool artBuildPaintMenu ' + 'artFluidAttrCtx artPuttyCtx artSelectCtx artSetPaintCtx artUserPaintCtx assignCommand ' + 'assignInputDevice assignViewportFactories attachCurve attachDeviceAttr attachSurface ' + 'attrColorSliderGrp attrCompatibility attrControlGrp attrEnumOptionMenu ' + 'attrEnumOptionMenuGrp attrFieldGrp attrFieldSliderGrp attrNavigationControlGrp ' + 'attrPresetEditWin attributeExists attributeInfo attributeMenu attributeQuery ' + 'autoKeyframe autoPlace bakeClip bakeFluidShading bakePartialHistory bakeResults ' + 'bakeSimulation basename basenameEx batchRender bessel bevel bevelPlus binMembership ' + 'bindSkin blend2 blendShape blendShapeEditor blendShapePanel blendTwoAttr blindDataType ' + 'boneLattice boundary boxDollyCtx boxZoomCtx bufferCurve buildBookmarkMenu ' + 'buildKeyframeMenu button buttonManip CBG cacheFile cacheFileCombine cacheFileMerge ' + 'cacheFileTrack camera cameraView canCreateManip canvas capitalizeString catch ' + 'catchQuiet ceil changeSubdivComponentDisplayLevel changeSubdivRegion channelBox ' + 'character characterMap characterOutlineEditor characterize chdir checkBox checkBoxGrp ' + 'checkDefaultRenderGlobals choice circle circularFillet clamp clear clearCache clip ' + 'clipEditor clipEditorCurrentTimeCtx clipSchedule clipSchedulerOutliner clipTrimBefore ' + 'closeCurve closeSurface cluster cmdFileOutput cmdScrollFieldExecuter ' + 'cmdScrollFieldReporter cmdShell coarsenSubdivSelectionList collision color ' + 'colorAtPoint colorEditor colorIndex colorIndexSliderGrp colorSliderButtonGrp ' + 'colorSliderGrp columnLayout commandEcho commandLine commandPort compactHairSystem ' + 'componentEditor compositingInterop computePolysetVolume condition cone confirmDialog ' + 'connectAttr connectControl connectDynamic connectJoint connectionInfo constrain ' + 'constrainValue constructionHistory container containsMultibyte contextInfo control ' + 'convertFromOldLayers convertIffToPsd convertLightmap convertSolidTx convertTessellation ' + 'convertUnit copyArray copyFlexor copyKey copySkinWeights cos cpButton cpCache ' + 'cpClothSet cpCollision cpConstraint cpConvClothToMesh cpForces cpGetSolverAttr cpPanel ' + 'cpProperty cpRigidCollisionFilter cpSeam cpSetEdit cpSetSolverAttr cpSolver ' + 'cpSolverTypes cpTool cpUpdateClothUVs createDisplayLayer createDrawCtx createEditor ' + 'createLayeredPsdFile createMotionField createNewShelf createNode createRenderLayer ' + 'createSubdivRegion cross crossProduct ctxAbort ctxCompletion ctxEditMode ctxTraverse ' + 'currentCtx currentTime currentTimeCtx currentUnit curve curveAddPtCtx ' + 'curveCVCtx curveEPCtx curveEditorCtx curveIntersect curveMoveEPCtx curveOnSurface ' + 'curveSketchCtx cutKey cycleCheck cylinder dagPose date defaultLightListCheckBox ' + 'defaultNavigation defineDataServer defineVirtualDevice deformer deg_to_rad delete ' + 'deleteAttr deleteShadingGroupsAndMaterials deleteShelfTab deleteUI deleteUnusedBrushes ' + 'delrandstr detachCurve detachDeviceAttr detachSurface deviceEditor devicePanel dgInfo ' + 'dgdirty dgeval dgtimer dimWhen directKeyCtx directionalLight dirmap dirname disable ' + 'disconnectAttr disconnectJoint diskCache displacementToPoly displayAffected ' + 'displayColor displayCull displayLevelOfDetail displayPref displayRGBColor ' + 'displaySmoothness displayStats displayString displaySurface distanceDimContext ' + 'distanceDimension doBlur dolly dollyCtx dopeSheetEditor dot dotProduct ' + 'doubleProfileBirailSurface drag dragAttrContext draggerContext dropoffLocator ' + 'duplicate duplicateCurve duplicateSurface dynCache dynControl dynExport dynExpression ' + 'dynGlobals dynPaintEditor dynParticleCtx dynPref dynRelEdPanel dynRelEditor ' + 'dynamicLoad editAttrLimits editDisplayLayerGlobals editDisplayLayerMembers ' + 'editRenderLayerAdjustment editRenderLayerGlobals editRenderLayerMembers editor ' + 'editorTemplate effector emit emitter enableDevice encodeString endString endsWith env ' + 'equivalent equivalentTol erf error eval evalDeferred evalEcho event ' + 'exactWorldBoundingBox exclusiveLightCheckBox exec executeForEachObject exists exp ' + 'expression expressionEditorListen extendCurve extendSurface extrude fcheck fclose feof ' + 'fflush fgetline fgetword file fileBrowserDialog fileDialog fileExtension fileInfo ' + 'filetest filletCurve filter filterCurve filterExpand filterStudioImport ' + 'findAllIntersections findAnimCurves findKeyframe findMenuItem findRelatedSkinCluster ' + 'finder firstParentOf fitBspline flexor floatEq floatField floatFieldGrp floatScrollBar ' + 'floatSlider floatSlider2 floatSliderButtonGrp floatSliderGrp floor flow fluidCacheInfo ' + 'fluidEmitter fluidVoxelInfo flushUndo fmod fontDialog fopen formLayout format fprint ' + 'frameLayout fread freeFormFillet frewind fromNativePath fwrite gamma gauss ' + 'geometryConstraint getApplicationVersionAsFloat getAttr getClassification ' + 'getDefaultBrush getFileList getFluidAttr getInputDeviceRange getMayaPanelTypes ' + 'getModifiers getPanel getParticleAttr getPluginResource getenv getpid glRender ' + 'glRenderEditor globalStitch gmatch goal gotoBindPose grabColor gradientControl ' + 'gradientControlNoAttr graphDollyCtx graphSelectContext graphTrackCtx gravity grid ' + 'gridLayout group groupObjectsByName HfAddAttractorToAS HfAssignAS HfBuildEqualMap ' + 'HfBuildFurFiles HfBuildFurImages HfCancelAFR HfConnectASToHF HfCreateAttractor ' + 'HfDeleteAS HfEditAS HfPerformCreateAS HfRemoveAttractorFromAS HfSelectAttached ' + 'HfSelectAttractors HfUnAssignAS hardenPointCurve hardware hardwareRenderPanel ' + 'headsUpDisplay headsUpMessage help helpLine hermite hide hilite hitTest hotBox hotkey ' + 'hotkeyCheck hsv_to_rgb hudButton hudSlider hudSliderButton hwReflectionMap hwRender ' + 'hwRenderLoad hyperGraph hyperPanel hyperShade hypot iconTextButton iconTextCheckBox ' + 'iconTextRadioButton iconTextRadioCollection iconTextScrollList iconTextStaticLabel ' + 'ikHandle ikHandleCtx ikHandleDisplayScale ikSolver ikSplineHandleCtx ikSystem ' + 'ikSystemInfo ikfkDisplayMethod illustratorCurves image imfPlugins inheritTransform ' + 'insertJoint insertJointCtx insertKeyCtx insertKnotCurve insertKnotSurface instance ' + 'instanceable instancer intField intFieldGrp intScrollBar intSlider intSliderGrp ' + 'interToUI internalVar intersect iprEngine isAnimCurve isConnected isDirty isParentOf ' + 'isSameObject isTrue isValidObjectName isValidString isValidUiName isolateSelect ' + 'itemFilter itemFilterAttr itemFilterRender itemFilterType joint jointCluster jointCtx ' + 'jointDisplayScale jointLattice keyTangent keyframe keyframeOutliner ' + 'keyframeRegionCurrentTimeCtx keyframeRegionDirectKeyCtx keyframeRegionDollyCtx ' + 'keyframeRegionInsertKeyCtx keyframeRegionMoveKeyCtx keyframeRegionScaleKeyCtx ' + 'keyframeRegionSelectKeyCtx keyframeRegionSetKeyCtx keyframeRegionTrackCtx ' + 'keyframeStats lassoContext lattice latticeDeformKeyCtx launch launchImageEditor ' + 'layerButton layeredShaderPort layeredTexturePort layout layoutDialog lightList ' + 'lightListEditor lightListPanel lightlink lineIntersection linearPrecision linstep ' + 'listAnimatable listAttr listCameras listConnections listDeviceAttachments listHistory ' + 'listInputDeviceAxes listInputDeviceButtons listInputDevices listMenuAnnotation ' + 'listNodeTypes listPanelCategories listRelatives listSets listTransforms ' + 'listUnselected listerEditor loadFluid loadNewShelf loadPlugin ' + 'loadPluginLanguageResources loadPrefObjects localizedPanelLabel lockNode loft log ' + 'longNameOf lookThru ls lsThroughFilter lsType lsUI Mayatomr mag makeIdentity makeLive ' + 'makePaintable makeRoll makeSingleSurface makeTubeOn makebot manipMoveContext ' + 'manipMoveLimitsCtx manipOptions manipRotateContext manipRotateLimitsCtx ' + 'manipScaleContext manipScaleLimitsCtx marker match max memory menu menuBarLayout ' + 'menuEditor menuItem menuItemToShelf menuSet menuSetPref messageLine min minimizeApp ' + 'mirrorJoint modelCurrentTimeCtx modelEditor modelPanel mouse movIn movOut move ' + 'moveIKtoFK moveKeyCtx moveVertexAlongDirection multiProfileBirailSurface mute ' + 'nParticle nameCommand nameField namespace namespaceInfo newPanelItems newton nodeCast ' + 'nodeIconButton nodeOutliner nodePreset nodeType noise nonLinear normalConstraint ' + 'normalize nurbsBoolean nurbsCopyUVSet nurbsCube nurbsEditUV nurbsPlane nurbsSelect ' + 'nurbsSquare nurbsToPoly nurbsToPolygonsPref nurbsToSubdiv nurbsToSubdivPref ' + 'nurbsUVSet nurbsViewDirectionVector objExists objectCenter objectLayer objectType ' + 'objectTypeUI obsoleteProc oceanNurbsPreviewPlane offsetCurve offsetCurveOnSurface ' + 'offsetSurface openGLExtension openMayaPref optionMenu optionMenuGrp optionVar orbit ' + 'orbitCtx orientConstraint outlinerEditor outlinerPanel overrideModifier ' + 'paintEffectsDisplay pairBlend palettePort paneLayout panel panelConfiguration ' + 'panelHistory paramDimContext paramDimension paramLocator parent parentConstraint ' + 'particle particleExists particleInstancer particleRenderInfo partition pasteKey ' + 'pathAnimation pause pclose percent performanceOptions pfxstrokes pickWalk picture ' + 'pixelMove planarSrf plane play playbackOptions playblast plugAttr plugNode pluginInfo ' + 'pluginResourceUtil pointConstraint pointCurveConstraint pointLight pointMatrixMult ' + 'pointOnCurve pointOnSurface pointPosition poleVectorConstraint polyAppend ' + 'polyAppendFacetCtx polyAppendVertex polyAutoProjection polyAverageNormal ' + 'polyAverageVertex polyBevel polyBlendColor polyBlindData polyBoolOp polyBridgeEdge ' + 'polyCacheMonitor polyCheck polyChipOff polyClipboard polyCloseBorder polyCollapseEdge ' + 'polyCollapseFacet polyColorBlindData polyColorDel polyColorPerVertex polyColorSet ' + 'polyCompare polyCone polyCopyUV polyCrease polyCreaseCtx polyCreateFacet ' + 'polyCreateFacetCtx polyCube polyCut polyCutCtx polyCylinder polyCylindricalProjection ' + 'polyDelEdge polyDelFacet polyDelVertex polyDuplicateAndConnect polyDuplicateEdge ' + 'polyEditUV polyEditUVShell polyEvaluate polyExtrudeEdge polyExtrudeFacet ' + 'polyExtrudeVertex polyFlipEdge polyFlipUV polyForceUV polyGeoSampler polyHelix ' + 'polyInfo polyInstallAction polyLayoutUV polyListComponentConversion polyMapCut ' + 'polyMapDel polyMapSew polyMapSewMove polyMergeEdge polyMergeEdgeCtx polyMergeFacet ' + 'polyMergeFacetCtx polyMergeUV polyMergeVertex polyMirrorFace polyMoveEdge ' + 'polyMoveFacet polyMoveFacetUV polyMoveUV polyMoveVertex polyNormal polyNormalPerVertex ' + 'polyNormalizeUV polyOptUvs polyOptions polyOutput polyPipe polyPlanarProjection ' + 'polyPlane polyPlatonicSolid polyPoke polyPrimitive polyPrism polyProjection ' + 'polyPyramid polyQuad polyQueryBlindData polyReduce polySelect polySelectConstraint ' + 'polySelectConstraintMonitor polySelectCtx polySelectEditCtx polySeparate ' + 'polySetToFaceNormal polySewEdge polyShortestPathCtx polySmooth polySoftEdge ' + 'polySphere polySphericalProjection polySplit polySplitCtx polySplitEdge polySplitRing ' + 'polySplitVertex polyStraightenUVBorder polySubdivideEdge polySubdivideFacet ' + 'polyToSubdiv polyTorus polyTransfer polyTriangulate polyUVSet polyUnite polyWedgeFace ' + 'popen popupMenu pose pow preloadRefEd print progressBar progressWindow projFileViewer ' + 'projectCurve projectTangent projectionContext projectionManip promptDialog propModCtx ' + 'propMove psdChannelOutliner psdEditTextureFile psdExport psdTextureFile putenv pwd ' + 'python querySubdiv quit rad_to_deg radial radioButton radioButtonGrp radioCollection ' + 'radioMenuItemCollection rampColorPort rand randomizeFollicles randstate rangeControl ' + 'readTake rebuildCurve rebuildSurface recordAttr recordDevice redo reference ' + 'referenceEdit referenceQuery refineSubdivSelectionList refresh refreshAE ' + 'registerPluginResource rehash reloadImage removeJoint removeMultiInstance ' + 'removePanelCategory rename renameAttr renameSelectionList renameUI render ' + 'renderGlobalsNode renderInfo renderLayerButton renderLayerParent ' + 'renderLayerPostProcess renderLayerUnparent renderManip renderPartition ' + 'renderQualityNode renderSettings renderThumbnailUpdate renderWindowEditor ' + 'renderWindowSelectContext renderer reorder reorderDeformers requires reroot ' + 'resampleFluid resetAE resetPfxToPolyCamera resetTool resolutionNode retarget ' + 'reverseCurve reverseSurface revolve rgb_to_hsv rigidBody rigidSolver roll rollCtx ' + 'rootOf rot rotate rotationInterpolation roundConstantRadius rowColumnLayout rowLayout ' + 'runTimeCommand runup sampleImage saveAllShelves saveAttrPreset saveFluid saveImage ' + 'saveInitialState saveMenu savePrefObjects savePrefs saveShelf saveToolSettings scale ' + 'scaleBrushBrightness scaleComponents scaleConstraint scaleKey scaleKeyCtx sceneEditor ' + 'sceneUIReplacement scmh scriptCtx scriptEditorInfo scriptJob scriptNode scriptTable ' + 'scriptToShelf scriptedPanel scriptedPanelType scrollField scrollLayout sculpt ' + 'searchPathArray seed selLoadSettings select selectContext selectCurveCV selectKey ' + 'selectKeyCtx selectKeyframeRegionCtx selectMode selectPref selectPriority selectType ' + 'selectedNodes selectionConnection separator setAttr setAttrEnumResource ' + 'setAttrMapping setAttrNiceNameResource setConstraintRestPosition ' + 'setDefaultShadingGroup setDrivenKeyframe setDynamic setEditCtx setEditor setFluidAttr ' + 'setFocus setInfinity setInputDeviceMapping setKeyCtx setKeyPath setKeyframe ' + 'setKeyframeBlendshapeTargetWts setMenuMode setNodeNiceNameResource setNodeTypeFlag ' + 'setParent setParticleAttr setPfxToPolyCamera setPluginResource setProject ' + 'setStampDensity setStartupMessage setState setToolTo setUITemplate setXformManip sets ' + 'shadingConnection shadingGeometryRelCtx shadingLightRelCtx shadingNetworkCompare ' + 'shadingNode shapeCompare shelfButton shelfLayout shelfTabLayout shellField ' + 'shortNameOf showHelp showHidden showManipCtx showSelectionInTitle ' + 'showShadingGroupAttrEditor showWindow sign simplify sin singleProfileBirailSurface ' + 'size sizeBytes skinCluster skinPercent smoothCurve smoothTangentSurface smoothstep ' + 'snap2to2 snapKey snapMode snapTogetherCtx snapshot soft softMod softModCtx sort sound ' + 'soundControl source spaceLocator sphere sphrand spotLight spotLightPreviewPort ' + 'spreadSheetEditor spring sqrt squareSurface srtContext stackTrace startString ' + 'startsWith stitchAndExplodeShell stitchSurface stitchSurfacePoints strcmp ' + 'stringArrayCatenate stringArrayContains stringArrayCount stringArrayInsertAtIndex ' + 'stringArrayIntersector stringArrayRemove stringArrayRemoveAtIndex ' + 'stringArrayRemoveDuplicates stringArrayRemoveExact stringArrayToString ' + 'stringToStringArray strip stripPrefixFromName stroke subdAutoProjection ' + 'subdCleanTopology subdCollapse subdDuplicateAndConnect subdEditUV ' + 'subdListComponentConversion subdMapCut subdMapSewMove subdMatchTopology subdMirror ' + 'subdToBlind subdToPoly subdTransferUVsToCache subdiv subdivCrease ' + 'subdivDisplaySmoothness substitute substituteAllString substituteGeometry substring ' + 'surface surfaceSampler surfaceShaderList swatchDisplayPort switchTable symbolButton ' + 'symbolCheckBox sysFile system tabLayout tan tangentConstraint texLatticeDeformContext ' + 'texManipContext texMoveContext texMoveUVShellContext texRotateContext texScaleContext ' + 'texSelectContext texSelectShortestPathCtx texSmudgeUVContext texWinToolCtx text ' + 'textCurves textField textFieldButtonGrp textFieldGrp textManip textScrollList ' + 'textToShelf textureDisplacePlane textureHairColor texturePlacementContext ' + 'textureWindow threadCount threePointArcCtx timeControl timePort timerX toNativePath ' + 'toggle toggleAxis toggleWindowVisibility tokenize tokenizeList tolerance tolower ' + 'toolButton toolCollection toolDropped toolHasOptions toolPropertyWindow torus toupper ' + 'trace track trackCtx transferAttributes transformCompare transformLimits translator ' + 'trim trunc truncateFluidCache truncateHairCache tumble tumbleCtx turbulence ' + 'twoPointArcCtx uiRes uiTemplate unassignInputDevice undo undoInfo ungroup uniform unit ' + 'unloadPlugin untangleUV untitledFileName untrim upAxis updateAE userCtx uvLink ' + 'uvSnapshot validateShelfName vectorize view2dToolCtx viewCamera viewClipPlane ' + 'viewFit viewHeadOn viewLookAt viewManip viewPlace viewSet visor volumeAxis vortex ' + 'waitCursor warning webBrowser webBrowserPrefs whatIs window windowPref wire ' + 'wireContext workspace wrinkle wrinkleContext writeTake xbmLangPathList xform',
          illegal: '</',
          contains: [hljs.C_NUMBER_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '`',
            end: '`',
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            className: 'variable',
            variants: [{begin: '\\$\\d'}, {begin: '[\\$\\%\\@](\\^\\w\\b|#\\w+|[^\\s\\w{]|{\\w+}|\\w+)'}, {
              begin: '\\*(\\^\\w\\b|#\\w+|[^\\s\\w{]|{\\w+}|\\w+)',
              relevance: 0
            }]
          }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
        };
      };
    }, {}],
    73: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = {
          keyword: 'module use_module import_module include_module end_module initialise ' + 'mutable initialize finalize finalise interface implementation pred ' + 'mode func type inst solver any_pred any_func is semidet det nondet ' + 'multi erroneous failure cc_nondet cc_multi typeclass instance where ' + 'pragma promise external trace atomic or_else require_complete_switch ' + 'require_det require_semidet require_multi require_nondet ' + 'require_cc_multi require_cc_nondet require_erroneous require_failure',
          pragma: 'inline no_inline type_spec source_file fact_table obsolete memo ' + 'loop_check minimal_model terminates does_not_terminate ' + 'check_termination promise_equivalent_clauses',
          preprocessor: 'foreign_proc foreign_decl foreign_code foreign_type ' + 'foreign_import_module foreign_export_enum foreign_export ' + 'foreign_enum may_call_mercury will_not_call_mercury thread_safe ' + 'not_thread_safe maybe_thread_safe promise_pure promise_semipure ' + 'tabled_for_io local untrailed trailed attach_to_io_state ' + 'can_pass_as_mercury_type stable will_not_throw_exception ' + 'may_modify_trail will_not_modify_trail may_duplicate ' + 'may_not_duplicate affects_liveness does_not_affect_liveness ' + 'doesnt_affect_liveness no_sharing unknown_sharing sharing',
          built_in: 'some all not if then else true fail false try catch catch_any ' + 'semidet_true semidet_false semidet_fail impure_true impure semipure'
        };
        var TODO = {
          className: 'label',
          begin: 'XXX',
          end: '$',
          endsWithParent: true,
          relevance: 0
        };
        var COMMENT = hljs.inherit(hljs.C_LINE_COMMENT_MODE, {begin: '%'});
        var CCOMMENT = hljs.inherit(hljs.C_BLOCK_COMMENT_MODE, {relevance: 0});
        COMMENT.contains.push(TODO);
        CCOMMENT.contains.push(TODO);
        var NUMCODE = {
          className: 'number',
          begin: "0'.\\|0[box][0-9a-fA-F]*"
        };
        var ATOM = hljs.inherit(hljs.APOS_STRING_MODE, {relevance: 0});
        var STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {relevance: 0});
        var STRING_FMT = {
          className: 'constant',
          begin: '\\\\[abfnrtv]\\|\\\\x[0-9a-fA-F]*\\\\\\|%[-+# *.0-9]*[dioxXucsfeEgGp]',
          relevance: 0
        };
        STRING.contains.push(STRING_FMT);
        var IMPLICATION = {
          className: 'built_in',
          variants: [{begin: '<=>'}, {
            begin: '<=',
            relevance: 0
          }, {
            begin: '=>',
            relevance: 0
          }, {begin: '/\\\\'}, {begin: '\\\\/'}]
        };
        var HEAD_BODY_CONJUNCTION = {
          className: 'built_in',
          variants: [{begin: ':-\\|-->'}, {
            begin: '=',
            relevance: 0
          }]
        };
        return {
          aliases: ['m', 'moo'],
          keywords: KEYWORDS,
          contains: [IMPLICATION, HEAD_BODY_CONJUNCTION, COMMENT, CCOMMENT, NUMCODE, hljs.NUMBER_MODE, ATOM, STRING, {begin: /:-/}]
        };
      };
    }, {}],
    74: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: 'environ vocabularies notations constructors definitions ' + 'registrations theorems schemes requirements begin end definition ' + 'registration cluster existence pred func defpred deffunc theorem ' + 'proof let take assume then thus hence ex for st holds consider ' + 'reconsider such that and in provided of as from be being by means ' + 'equals implies iff redefine define now not or attr is mode ' + 'suppose per cases set thesis contradiction scheme reserve struct ' + 'correctness compatibility coherence symmetry assymetry ' + 'reflexivity irreflexivity connectedness uniqueness commutativity ' + 'idempotence involutiveness projectivity',
          contains: [hljs.COMMENT('::', '$')]
        };
      };
    }, {}],
    75: [function(require, module, exports) {
      module.exports = function(hljs) {
        var NUMBER = {
          className: 'number',
          relevance: 0,
          variants: [{begin: '[$][a-fA-F0-9]+'}, hljs.NUMBER_MODE]
        };
        return {
          case_insensitive: true,
          keywords: {
            keyword: 'public private property continue exit extern new try catch ' + 'eachin not abstract final select case default const local global field ' + 'end if then else elseif endif while wend repeat until forever for to step next return module inline throw',
            built_in: 'DebugLog DebugStop Error Print ACos ACosr ASin ASinr ATan ATan2 ATan2r ATanr Abs Abs Ceil ' + 'Clamp Clamp Cos Cosr Exp Floor Log Max Max Min Min Pow Sgn Sgn Sin Sinr Sqrt Tan Tanr Seed PI HALFPI TWOPI',
            literal: 'true false null and or shl shr mod'
          },
          contains: [hljs.COMMENT('#rem', '#end'), hljs.COMMENT("'", '$', {relevance: 0}), {
            className: 'function',
            beginKeywords: 'function method',
            end: '[(=:]|$',
            illegal: /\n/,
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, {
            className: 'class',
            beginKeywords: 'class interface',
            end: '$',
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }, {
            className: 'variable',
            begin: '\\b(self|super)\\b'
          }, {
            className: 'preprocessor',
            beginKeywords: 'import',
            end: '$'
          }, {
            className: 'preprocessor',
            begin: '\\s*#',
            end: '$',
            keywords: 'if else elseif endif end then'
          }, {
            className: 'pi',
            begin: '^\\s*strict\\b'
          }, {
            beginKeywords: 'alias',
            end: '=',
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, hljs.QUOTE_STRING_MODE, NUMBER]
        };
      };
    }, {}],
    76: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VAR = {
          className: 'variable',
          variants: [{begin: /\$\d+/}, {
            begin: /\$\{/,
            end: /}/
          }, {begin: '[\\$\\@]' + hljs.UNDERSCORE_IDENT_RE}]
        };
        var DEFAULT = {
          endsWithParent: true,
          lexemes: '[a-z/_]+',
          keywords: {built_in: 'on off yes no true false none blocked debug info notice warn error crit ' + 'select break last permanent redirect kqueue rtsig epoll poll /dev/poll'},
          relevance: 0,
          illegal: '=>',
          contains: [hljs.HASH_COMMENT_MODE, {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE, VAR],
            variants: [{
              begin: /"/,
              end: /"/
            }, {
              begin: /'/,
              end: /'/
            }]
          }, {
            className: 'url',
            begin: '([a-z]+):/',
            end: '\\s',
            endsWithParent: true,
            excludeEnd: true,
            contains: [VAR]
          }, {
            className: 'regexp',
            contains: [hljs.BACKSLASH_ESCAPE, VAR],
            variants: [{
              begin: "\\s\\^",
              end: "\\s|{|;",
              returnEnd: true
            }, {
              begin: "~\\*?\\s+",
              end: "\\s|{|;",
              returnEnd: true
            }, {begin: "\\*(\\.[a-z\\-]+)+"}, {begin: "([a-z\\-]+\\.)+\\*"}]
          }, {
            className: 'number',
            begin: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d{1,5})?\\b'
          }, {
            className: 'number',
            begin: '\\b\\d+[kKmMgGdshdwy]*\\b',
            relevance: 0
          }, VAR]
        };
        return {
          aliases: ['nginxconf'],
          contains: [hljs.HASH_COMMENT_MODE, {
            begin: hljs.UNDERSCORE_IDENT_RE + '\\s',
            end: ';|{',
            returnBegin: true,
            contains: [{
              className: 'title',
              begin: hljs.UNDERSCORE_IDENT_RE,
              starts: DEFAULT
            }],
            relevance: 0
          }],
          illegal: '[^\\s\\}]'
        };
      };
    }, {}],
    77: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['nim'],
          keywords: {
            keyword: 'addr and as asm bind block break|0 case|0 cast const|0 continue|0 converter discard distinct|10 div do elif else|0 end|0 enum|0 except export finally for from generic if|0 import|0 in include|0 interface is isnot|10 iterator|10 let|0 macro method|10 mixin mod nil not notin|10 object|0 of or out proc|10 ptr raise ref|10 return shl shr static template|10 try|0 tuple type|0 using|0 var|0 when while|0 with without xor yield',
            literal: 'shared guarded stdin stdout stderr result|10 true false'
          },
          contains: [{
            className: 'decorator',
            begin: /{\./,
            end: /\.}/,
            relevance: 10
          }, {
            className: 'string',
            begin: /[a-zA-Z]\w*"/,
            end: /"/,
            contains: [{begin: /""/}]
          }, {
            className: 'string',
            begin: /([a-zA-Z]\w*)?"""/,
            end: /"""/
          }, hljs.QUOTE_STRING_MODE, {
            className: 'type',
            begin: /\b[A-Z]\w+\b/,
            relevance: 0
          }, {
            className: 'type',
            begin: /\b(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float|float32|float64|bool|char|string|cstring|pointer|expr|stmt|void|auto|any|range|array|openarray|varargs|seq|set|clong|culong|cchar|cschar|cshort|cint|csize|clonglong|cfloat|cdouble|clongdouble|cuchar|cushort|cuint|culonglong|cstringarray|semistatic)\b/
          }, {
            className: 'number',
            begin: /\b(0[xX][0-9a-fA-F][_0-9a-fA-F]*)('?[iIuU](8|16|32|64))?/,
            relevance: 0
          }, {
            className: 'number',
            begin: /\b(0o[0-7][_0-7]*)('?[iIuUfF](8|16|32|64))?/,
            relevance: 0
          }, {
            className: 'number',
            begin: /\b(0(b|B)[01][_01]*)('?[iIuUfF](8|16|32|64))?/,
            relevance: 0
          }, {
            className: 'number',
            begin: /\b(\d[_\d]*)('?[iIuUfF](8|16|32|64))?/,
            relevance: 0
          }, hljs.HASH_COMMENT_MODE]
        };
      };
    }, {}],
    78: [function(require, module, exports) {
      module.exports = function(hljs) {
        var NIX_KEYWORDS = {
          keyword: 'rec with let in inherit assert if else then',
          constant: 'true false or and null',
          built_in: 'import abort baseNameOf dirOf isNull builtins map removeAttrs throw toString derivation'
        };
        var ANTIQUOTE = {
          className: 'subst',
          begin: /\$\{/,
          end: /}/,
          keywords: NIX_KEYWORDS
        };
        var ATTRS = {
          className: 'variable',
          begin: /[a-zA-Z0-9-_]+(\s*=)/
        };
        var SINGLE_QUOTE = {
          className: 'string',
          begin: "''",
          end: "''",
          contains: [ANTIQUOTE]
        };
        var DOUBLE_QUOTE = {
          className: 'string',
          begin: '"',
          end: '"',
          contains: [ANTIQUOTE]
        };
        var EXPRESSIONS = [hljs.NUMBER_MODE, hljs.HASH_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, SINGLE_QUOTE, DOUBLE_QUOTE, ATTRS];
        ANTIQUOTE.contains = EXPRESSIONS;
        return {
          aliases: ["nixos"],
          keywords: NIX_KEYWORDS,
          contains: EXPRESSIONS
        };
      };
    }, {}],
    79: [function(require, module, exports) {
      module.exports = function(hljs) {
        var CONSTANTS = {
          className: 'symbol',
          begin: '\\$(ADMINTOOLS|APPDATA|CDBURN_AREA|CMDLINE|COMMONFILES32|COMMONFILES64|COMMONFILES|COOKIES|DESKTOP|DOCUMENTS|EXEDIR|EXEFILE|EXEPATH|FAVORITES|FONTS|HISTORY|HWNDPARENT|INSTDIR|INTERNET_CACHE|LANGUAGE|LOCALAPPDATA|MUSIC|NETHOOD|OUTDIR|PICTURES|PLUGINSDIR|PRINTHOOD|PROFILE|PROGRAMFILES32|PROGRAMFILES64|PROGRAMFILES|QUICKLAUNCH|RECENT|RESOURCES_LOCALIZED|RESOURCES|SENDTO|SMPROGRAMS|SMSTARTUP|STARTMENU|SYSDIR|TEMP|TEMPLATES|VIDEOS|WINDIR)'
        };
        var DEFINES = {
          className: 'constant',
          begin: '\\$+{[a-zA-Z0-9_]+}'
        };
        var VARIABLES = {
          className: 'variable',
          begin: '\\$+[a-zA-Z0-9_]+',
          illegal: '\\(\\){}'
        };
        var LANGUAGES = {
          className: 'constant',
          begin: '\\$+\\([a-zA-Z0-9_]+\\)'
        };
        var PARAMETERS = {
          className: 'params',
          begin: '(ARCHIVE|FILE_ATTRIBUTE_ARCHIVE|FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_OFFLINE|FILE_ATTRIBUTE_READONLY|FILE_ATTRIBUTE_SYSTEM|FILE_ATTRIBUTE_TEMPORARY|HKCR|HKCU|HKDD|HKEY_CLASSES_ROOT|HKEY_CURRENT_CONFIG|HKEY_CURRENT_USER|HKEY_DYN_DATA|HKEY_LOCAL_MACHINE|HKEY_PERFORMANCE_DATA|HKEY_USERS|HKLM|HKPD|HKU|IDABORT|IDCANCEL|IDIGNORE|IDNO|IDOK|IDRETRY|IDYES|MB_ABORTRETRYIGNORE|MB_DEFBUTTON1|MB_DEFBUTTON2|MB_DEFBUTTON3|MB_DEFBUTTON4|MB_ICONEXCLAMATION|MB_ICONINFORMATION|MB_ICONQUESTION|MB_ICONSTOP|MB_OK|MB_OKCANCEL|MB_RETRYCANCEL|MB_RIGHT|MB_RTLREADING|MB_SETFOREGROUND|MB_TOPMOST|MB_USERICON|MB_YESNO|NORMAL|OFFLINE|READONLY|SHCTX|SHELL_CONTEXT|SYSTEM|TEMPORARY)'
        };
        var COMPILER = {
          className: 'constant',
          begin: '\\!(addincludedir|addplugindir|appendfile|cd|define|delfile|echo|else|endif|error|execute|finalize|getdllversionsystem|ifdef|ifmacrodef|ifmacrondef|ifndef|if|include|insertmacro|macroend|macro|makensis|packhdr|searchparse|searchreplace|tempfile|undef|verbose|warning)'
        };
        return {
          case_insensitive: false,
          keywords: {
            keyword: 'Abort AddBrandingImage AddSize AllowRootDirInstall AllowSkipFiles AutoCloseWindow BGFont BGGradient BrandingText BringToFront Call CallInstDLL Caption ChangeUI CheckBitmap ClearErrors CompletedText ComponentText CopyFiles CRCCheck CreateDirectory CreateFont CreateShortCut Delete DeleteINISec DeleteINIStr DeleteRegKey DeleteRegValue DetailPrint DetailsButtonText DirText DirVar DirVerify EnableWindow EnumRegKey EnumRegValue Exch Exec ExecShell ExecWait ExpandEnvStrings File FileBufSize FileClose FileErrorText FileOpen FileRead FileReadByte FileReadUTF16LE FileReadWord FileSeek FileWrite FileWriteByte FileWriteUTF16LE FileWriteWord FindClose FindFirst FindNext FindWindow FlushINI FunctionEnd GetCurInstType GetCurrentAddress GetDlgItem GetDLLVersion GetDLLVersionLocal GetErrorLevel GetFileTime GetFileTimeLocal GetFullPathName GetFunctionAddress GetInstDirError GetLabelAddress GetTempFileName Goto HideWindow Icon IfAbort IfErrors IfFileExists IfRebootFlag IfSilent InitPluginsDir InstallButtonText InstallColors InstallDir InstallDirRegKey InstProgressFlags InstType InstTypeGetText InstTypeSetText IntCmp IntCmpU IntFmt IntOp IsWindow LangString LicenseBkColor LicenseData LicenseForceSelection LicenseLangString LicenseText LoadLanguageFile LockWindow LogSet LogText ManifestDPIAware ManifestSupportedOS MessageBox MiscButtonText Name Nop OutFile Page PageCallbacks PageExEnd Pop Push Quit ReadEnvStr ReadINIStr ReadRegDWORD ReadRegStr Reboot RegDLL Rename RequestExecutionLevel ReserveFile Return RMDir SearchPath SectionEnd SectionGetFlags SectionGetInstTypes SectionGetSize SectionGetText SectionGroupEnd SectionIn SectionSetFlags SectionSetInstTypes SectionSetSize SectionSetText SendMessage SetAutoClose SetBrandingImage SetCompress SetCompressor SetCompressorDictSize SetCtlColors SetCurInstType SetDatablockOptimize SetDateSave SetDetailsPrint SetDetailsView SetErrorLevel SetErrors SetFileAttributes SetFont SetOutPath SetOverwrite SetPluginUnload SetRebootFlag SetRegView SetShellVarContext SetSilent ShowInstDetails ShowUninstDetails ShowWindow SilentInstall SilentUnInstall Sleep SpaceTexts StrCmp StrCmpS StrCpy StrLen SubCaption SubSectionEnd Unicode UninstallButtonText UninstallCaption UninstallIcon UninstallSubCaption UninstallText UninstPage UnRegDLL Var VIAddVersionKey VIFileVersion VIProductVersion WindowIcon WriteINIStr WriteRegBin WriteRegDWORD WriteRegExpandStr WriteRegStr WriteUninstaller XPStyle',
            literal: 'admin all auto both colored current false force hide highest lastused leave listonly none normal notset off on open print show silent silentlog smooth textonly true user '
          },
          contains: [hljs.HASH_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'string',
            begin: '"',
            end: '"',
            illegal: '\\n',
            contains: [{
              className: 'symbol',
              begin: '\\$(\\\\(n|r|t)|\\$)'
            }, CONSTANTS, DEFINES, VARIABLES, LANGUAGES]
          }, hljs.COMMENT(';', '$', {relevance: 0}), {
            className: 'function',
            beginKeywords: 'Function PageEx Section SectionGroup SubSection',
            end: '$'
          }, COMPILER, DEFINES, VARIABLES, LANGUAGES, PARAMETERS, hljs.NUMBER_MODE, {
            className: 'literal',
            begin: hljs.IDENT_RE + '::' + hljs.IDENT_RE
          }]
        };
      };
    }, {}],
    80: [function(require, module, exports) {
      module.exports = function(hljs) {
        var API_CLASS = {
          className: 'built_in',
          begin: '(AV|CA|CF|CG|CI|MK|MP|NS|UI)\\w+'
        };
        var OBJC_KEYWORDS = {
          keyword: 'int float while char export sizeof typedef const struct for union ' + 'unsigned long volatile static bool mutable if do return goto void ' + 'enum else break extern asm case short default double register explicit ' + 'signed typename this switch continue wchar_t inline readonly assign ' + 'readwrite self @synchronized id typeof ' + 'nonatomic super unichar IBOutlet IBAction strong weak copy ' + 'in out inout bycopy byref oneway __strong __weak __block __autoreleasing ' + '@private @protected @public @try @property @end @throw @catch @finally ' + '@autoreleasepool @synthesize @dynamic @selector @optional @required',
          literal: 'false true FALSE TRUE nil YES NO NULL',
          built_in: 'BOOL dispatch_once_t dispatch_queue_t dispatch_sync dispatch_async dispatch_once'
        };
        var LEXEMES = /[a-zA-Z@][a-zA-Z0-9_]*/;
        var CLASS_KEYWORDS = '@interface @class @protocol @implementation';
        return {
          aliases: ['mm', 'objc', 'obj-c'],
          keywords: OBJC_KEYWORDS,
          lexemes: LEXEMES,
          illegal: '</',
          contains: [API_CLASS, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.C_NUMBER_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            variants: [{
              begin: '@"',
              end: '"',
              illegal: '\\n',
              contains: [hljs.BACKSLASH_ESCAPE]
            }, {
              begin: '\'',
              end: '[^\\\\]\'',
              illegal: '[^\\\\][^\']'
            }]
          }, {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            contains: [{
              className: 'title',
              variants: [{
                begin: '\"',
                end: '\"'
              }, {
                begin: '<',
                end: '>'
              }]
            }]
          }, {
            className: 'class',
            begin: '(' + CLASS_KEYWORDS.split(' ').join('|') + ')\\b',
            end: '({|$)',
            excludeEnd: true,
            keywords: CLASS_KEYWORDS,
            lexemes: LEXEMES,
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, {
            className: 'variable',
            begin: '\\.' + hljs.UNDERSCORE_IDENT_RE,
            relevance: 0
          }]
        };
      };
    }, {}],
    81: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['ml'],
          keywords: {
            keyword: 'and as assert asr begin class constraint do done downto else end ' + 'exception external for fun function functor if in include ' + 'inherit! inherit initializer land lazy let lor lsl lsr lxor match method!|10 method ' + 'mod module mutable new object of open! open or private rec sig struct ' + 'then to try type val! val virtual when while with ' + 'parser value',
            built_in: 'array bool bytes char exn|5 float int int32 int64 list lazy_t|5 nativeint|5 string unit ' + 'in_channel out_channel ref',
            literal: 'true false'
          },
          illegal: /\/\/|>>/,
          lexemes: '[a-z_]\\w*!?',
          contains: [{
            className: 'literal',
            begin: '\\[(\\|\\|)?\\]|\\(\\)'
          }, hljs.COMMENT('\\(\\*', '\\*\\)', {contains: ['self']}), {
            className: 'symbol',
            begin: '\'[A-Za-z_](?!\')[\\w\']*'
          }, {
            className: 'tag',
            begin: '`[A-Z][\\w\']*'
          }, {
            className: 'type',
            begin: '\\b[A-Z][\\w\']*',
            relevance: 0
          }, {begin: '[a-z_]\\w*\'[\\w\']*'}, hljs.inherit(hljs.APOS_STRING_MODE, {
            className: 'char',
            relevance: 0
          }), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), {
            className: 'number',
            begin: '\\b(0[xX][a-fA-F0-9_]+[Lln]?|' + '0[oO][0-7_]+[Lln]?|' + '0[bB][01_]+[Lln]?|' + '[0-9][0-9_]*([Lln]|(\\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)',
            relevance: 0
          }, {begin: /[-=]>/}]
        };
      };
    }, {}],
    82: [function(require, module, exports) {
      module.exports = function(hljs) {
        var SPECIAL_VARS = {
          className: 'keyword',
          begin: '\\$(f[asn]|t|vp[rtd]|children)'
        },
            LITERALS = {
              className: 'literal',
              begin: 'false|true|PI|undef'
            },
            NUMBERS = {
              className: 'number',
              begin: '\\b\\d+(\\.\\d+)?(e-?\\d+)?',
              relevance: 0
            },
            STRING = hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}),
            PREPRO = {
              className: 'preprocessor',
              keywords: 'include use',
              begin: 'include|use <',
              end: '>'
            },
            PARAMS = {
              className: 'params',
              begin: '\\(',
              end: '\\)',
              contains: ['self', NUMBERS, STRING, SPECIAL_VARS, LITERALS]
            },
            MODIFIERS = {
              className: 'built_in',
              begin: '[*!#%]',
              relevance: 0
            },
            FUNCTIONS = {
              className: 'function',
              beginKeywords: 'module function',
              end: '\\=|\\{',
              contains: [PARAMS, hljs.UNDERSCORE_TITLE_MODE]
            };
        return {
          aliases: ['scad'],
          keywords: {
            keyword: 'function module include use for intersection_for if else \\%',
            literal: 'false true PI undef',
            built_in: 'circle square polygon text sphere cube cylinder polyhedron translate rotate scale resize mirror multmatrix color offset hull minkowski union difference intersection abs sign sin cos tan acos asin atan atan2 floor round ceil ln log pow sqrt exp rands min max concat lookup str chr search version version_num norm cross parent_module echo import import_dxf dxf_linear_extrude linear_extrude rotate_extrude surface projection render children dxf_cross dxf_dim let assign'
          },
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, NUMBERS, PREPRO, STRING, PARAMS, SPECIAL_VARS, MODIFIERS, FUNCTIONS]
        };
      };
    }, {}],
    83: [function(require, module, exports) {
      module.exports = function(hljs) {
        var OXYGENE_KEYWORDS = 'abstract add and array as asc aspect assembly async begin break block by case class concat const copy constructor continue ' + 'create default delegate desc distinct div do downto dynamic each else empty end ensure enum equals event except exit extension external false ' + 'final finalize finalizer finally flags for forward from function future global group has if implementation implements implies in index inherited ' + 'inline interface into invariants is iterator join locked locking loop matching method mod module namespace nested new nil not notify nullable of ' + 'old on operator or order out override parallel params partial pinned private procedure property protected public queryable raise read readonly ' + 'record reintroduce remove repeat require result reverse sealed select self sequence set shl shr skip static step soft take then to true try tuple ' + 'type union unit unsafe until uses using var virtual raises volatile where while with write xor yield await mapped deprecated stdcall cdecl pascal ' + 'register safecall overload library platform reference packed strict published autoreleasepool selector strong weak unretained';
        var CURLY_COMMENT = hljs.COMMENT('{', '}', {relevance: 0});
        var PAREN_COMMENT = hljs.COMMENT('\\(\\*', '\\*\\)', {relevance: 10});
        var STRING = {
          className: 'string',
          begin: '\'',
          end: '\'',
          contains: [{begin: '\'\''}]
        };
        var CHAR_STRING = {
          className: 'string',
          begin: '(#\\d+)+'
        };
        var FUNCTION = {
          className: 'function',
          beginKeywords: 'function constructor destructor procedure method',
          end: '[:;]',
          keywords: 'function constructor|10 destructor|10 procedure|10 method|10',
          contains: [hljs.TITLE_MODE, {
            className: 'params',
            begin: '\\(',
            end: '\\)',
            keywords: OXYGENE_KEYWORDS,
            contains: [STRING, CHAR_STRING]
          }, CURLY_COMMENT, PAREN_COMMENT]
        };
        return {
          case_insensitive: true,
          keywords: OXYGENE_KEYWORDS,
          illegal: '("|\\$[G-Zg-z]|\\/\\*|</|=>|->)',
          contains: [CURLY_COMMENT, PAREN_COMMENT, hljs.C_LINE_COMMENT_MODE, STRING, CHAR_STRING, hljs.NUMBER_MODE, FUNCTION, {
            className: 'class',
            begin: '=\\bclass\\b',
            end: 'end;',
            keywords: OXYGENE_KEYWORDS,
            contains: [STRING, CHAR_STRING, CURLY_COMMENT, PAREN_COMMENT, hljs.C_LINE_COMMENT_MODE, FUNCTION]
          }]
        };
      };
    }, {}],
    84: [function(require, module, exports) {
      module.exports = function(hljs) {
        var CURLY_SUBCOMMENT = hljs.COMMENT('{', '}', {contains: ['self']});
        return {
          subLanguage: 'xml',
          relevance: 0,
          contains: [hljs.COMMENT('^#', '$'), hljs.COMMENT('\\^rem{', '}', {
            relevance: 10,
            contains: [CURLY_SUBCOMMENT]
          }), {
            className: 'preprocessor',
            begin: '^@(?:BASE|USE|CLASS|OPTIONS)$',
            relevance: 10
          }, {
            className: 'title',
            begin: '@[\\w\\-]+\\[[\\w^;\\-]*\\](?:\\[[\\w^;\\-]*\\])?(?:.*)$'
          }, {
            className: 'variable',
            begin: '\\$\\{?[\\w\\-\\.\\:]+\\}?'
          }, {
            className: 'keyword',
            begin: '\\^[\\w\\-\\.\\:]+'
          }, {
            className: 'number',
            begin: '\\^#[0-9a-fA-F]+'
          }, hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    85: [function(require, module, exports) {
      module.exports = function(hljs) {
        var PERL_KEYWORDS = 'getpwent getservent quotemeta msgrcv scalar kill dbmclose undef lc ' + 'ma syswrite tr send umask sysopen shmwrite vec qx utime local oct semctl localtime ' + 'readpipe do return format read sprintf dbmopen pop getpgrp not getpwnam rewinddir qq' + 'fileno qw endprotoent wait sethostent bless s|0 opendir continue each sleep endgrent ' + 'shutdown dump chomp connect getsockname die socketpair close flock exists index shmget' + 'sub for endpwent redo lstat msgctl setpgrp abs exit select print ref gethostbyaddr ' + 'unshift fcntl syscall goto getnetbyaddr join gmtime symlink semget splice x|0 ' + 'getpeername recv log setsockopt cos last reverse gethostbyname getgrnam study formline ' + 'endhostent times chop length gethostent getnetent pack getprotoent getservbyname rand ' + 'mkdir pos chmod y|0 substr endnetent printf next open msgsnd readdir use unlink ' + 'getsockopt getpriority rindex wantarray hex system getservbyport endservent int chr ' + 'untie rmdir prototype tell listen fork shmread ucfirst setprotoent else sysseek link ' + 'getgrgid shmctl waitpid unpack getnetbyname reset chdir grep split require caller ' + 'lcfirst until warn while values shift telldir getpwuid my getprotobynumber delete and ' + 'sort uc defined srand accept package seekdir getprotobyname semop our rename seek if q|0 ' + 'chroot sysread setpwent no crypt getc chown sqrt write setnetent setpriority foreach ' + 'tie sin msgget map stat getlogin unless elsif truncate exec keys glob tied closedir' + 'ioctl socket readlink eval xor readline binmode setservent eof ord bind alarm pipe ' + 'atan2 getgrent exp time push setgrent gt lt or ne m|0 break given say state when';
        var SUBST = {
          className: 'subst',
          begin: '[$@]\\{',
          end: '\\}',
          keywords: PERL_KEYWORDS
        };
        var METHOD = {
          begin: '->{',
          end: '}'
        };
        var VAR = {
          className: 'variable',
          variants: [{begin: /\$\d/}, {begin: /[\$%@](\^\w\b|#\w+(::\w+)*|{\w+}|\w+(::\w*)*)/}, {
            begin: /[\$%@][^\s\w{]/,
            relevance: 0
          }]
        };
        var COMMENT = hljs.COMMENT('^(__END__|__DATA__)', '\\n$', {relevance: 5});
        var STRING_CONTAINS = [hljs.BACKSLASH_ESCAPE, SUBST, VAR];
        var PERL_DEFAULT_CONTAINS = [VAR, hljs.HASH_COMMENT_MODE, COMMENT, hljs.COMMENT('^\\=\\w', '\\=cut', {endsWithParent: true}), METHOD, {
          className: 'string',
          contains: STRING_CONTAINS,
          variants: [{
            begin: 'q[qwxr]?\\s*\\(',
            end: '\\)',
            relevance: 5
          }, {
            begin: 'q[qwxr]?\\s*\\[',
            end: '\\]',
            relevance: 5
          }, {
            begin: 'q[qwxr]?\\s*\\{',
            end: '\\}',
            relevance: 5
          }, {
            begin: 'q[qwxr]?\\s*\\|',
            end: '\\|',
            relevance: 5
          }, {
            begin: 'q[qwxr]?\\s*\\<',
            end: '\\>',
            relevance: 5
          }, {
            begin: 'qw\\s+q',
            end: 'q',
            relevance: 5
          }, {
            begin: '\'',
            end: '\'',
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            begin: '"',
            end: '"'
          }, {
            begin: '`',
            end: '`',
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            begin: '{\\w+}',
            contains: [],
            relevance: 0
          }, {
            begin: '\-?\\w+\\s*\\=\\>',
            contains: [],
            relevance: 0
          }]
        }, {
          className: 'number',
          begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
          relevance: 0
        }, {
          begin: '(\\/\\/|' + hljs.RE_STARTERS_RE + '|\\b(split|return|print|reverse|grep)\\b)\\s*',
          keywords: 'split return print reverse grep',
          relevance: 0,
          contains: [hljs.HASH_COMMENT_MODE, COMMENT, {
            className: 'regexp',
            begin: '(s|tr|y)/(\\\\.|[^/])*/(\\\\.|[^/])*/[a-z]*',
            relevance: 10
          }, {
            className: 'regexp',
            begin: '(m|qr)?/',
            end: '/[a-z]*',
            contains: [hljs.BACKSLASH_ESCAPE],
            relevance: 0
          }]
        }, {
          className: 'sub',
          beginKeywords: 'sub',
          end: '(\\s*\\(.*?\\))?[;{]',
          relevance: 5
        }, {
          className: 'operator',
          begin: '-\\w\\b',
          relevance: 0
        }];
        SUBST.contains = PERL_DEFAULT_CONTAINS;
        METHOD.contains = PERL_DEFAULT_CONTAINS;
        return {
          aliases: ['pl'],
          keywords: PERL_KEYWORDS,
          contains: PERL_DEFAULT_CONTAINS
        };
      };
    }, {}],
    86: [function(require, module, exports) {
      module.exports = function(hljs) {
        var MACRO = {
          className: 'variable',
          begin: /\$[\w\d#@][\w\d_]*/
        };
        var TABLE = {
          className: 'variable',
          begin: /</,
          end: />/
        };
        var QUOTE_STRING = {
          className: 'string',
          begin: /"/,
          end: /"/
        };
        return {
          aliases: ['pf.conf'],
          lexemes: /[a-z0-9_<>-]+/,
          keywords: {
            built_in: 'block match pass load anchor|5 antispoof|10 set table',
            keyword: 'in out log quick on rdomain inet inet6 proto from port os to route' + 'allow-opts divert-packet divert-reply divert-to flags group icmp-type' + 'icmp6-type label once probability recieved-on rtable prio queue' + 'tos tag tagged user keep fragment for os drop' + 'af-to|10 binat-to|10 nat-to|10 rdr-to|10 bitmask least-stats random round-robin' + 'source-hash static-port' + 'dup-to reply-to route-to' + 'parent bandwidth default min max qlimit' + 'block-policy debug fingerprints hostid limit loginterface optimization' + 'reassemble ruleset-optimization basic none profile skip state-defaults' + 'state-policy timeout' + 'const counters persist' + 'no modulate synproxy state|5 floating if-bound no-sync pflow|10 sloppy' + 'source-track global rule max-src-nodes max-src-states max-src-conn' + 'max-src-conn-rate overload flush' + 'scrub|5 max-mss min-ttl no-df|10 random-id',
            literal: 'all any no-route self urpf-failed egress|5 unknown'
          },
          contains: [hljs.HASH_COMMENT_MODE, hljs.NUMBER_MODE, hljs.QUOTE_STRING_MODE, MACRO, TABLE]
        };
      };
    }, {}],
    87: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VARIABLE = {
          className: 'variable',
          begin: '\\$+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*'
        };
        var PREPROCESSOR = {
          className: 'preprocessor',
          begin: /<\?(php)?|\?>/
        };
        var STRING = {
          className: 'string',
          contains: [hljs.BACKSLASH_ESCAPE, PREPROCESSOR],
          variants: [{
            begin: 'b"',
            end: '"'
          }, {
            begin: 'b\'',
            end: '\''
          }, hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null})]
        };
        var NUMBER = {variants: [hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE]};
        return {
          aliases: ['php3', 'php4', 'php5', 'php6'],
          case_insensitive: true,
          keywords: 'and include_once list abstract global private echo interface as static endswitch ' + 'array null if endwhile or const for endforeach self var while isset public ' + 'protected exit foreach throw elseif include __FILE__ empty require_once do xor ' + 'return parent clone use __CLASS__ __LINE__ else break print eval new ' + 'catch __METHOD__ case exception default die require __FUNCTION__ ' + 'enddeclare final try switch continue endfor endif declare unset true false ' + 'trait goto instanceof insteadof __DIR__ __NAMESPACE__ ' + 'yield finally',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.HASH_COMMENT_MODE, hljs.COMMENT('/\\*', '\\*/', {contains: [{
              className: 'doctag',
              begin: '@[A-Za-z]+'
            }, PREPROCESSOR]}), hljs.COMMENT('__halt_compiler.+?;', false, {
            endsWithParent: true,
            keywords: '__halt_compiler',
            lexemes: hljs.UNDERSCORE_IDENT_RE
          }), {
            className: 'string',
            begin: '<<<[\'"]?\\w+[\'"]?$',
            end: '^\\w+;',
            contains: [hljs.BACKSLASH_ESCAPE]
          }, PREPROCESSOR, VARIABLE, {begin: /(::|->)+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/}, {
            className: 'function',
            beginKeywords: 'function',
            end: /[;{]/,
            excludeEnd: true,
            illegal: '\\$|\\[|%',
            contains: [hljs.UNDERSCORE_TITLE_MODE, {
              className: 'params',
              begin: '\\(',
              end: '\\)',
              contains: ['self', VARIABLE, hljs.C_BLOCK_COMMENT_MODE, STRING, NUMBER]
            }]
          }, {
            className: 'class',
            beginKeywords: 'class interface',
            end: '{',
            excludeEnd: true,
            illegal: /[:\(\$"]/,
            contains: [{beginKeywords: 'extends implements'}, hljs.UNDERSCORE_TITLE_MODE]
          }, {
            beginKeywords: 'namespace',
            end: ';',
            illegal: /[\.']/,
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, {
            beginKeywords: 'use',
            end: ';',
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, {begin: '=>'}, STRING, NUMBER]
        };
      };
    }, {}],
    88: [function(require, module, exports) {
      module.exports = function(hljs) {
        var backtickEscape = {
          begin: '`[\\s\\S]',
          relevance: 0
        };
        var dollarEscape = {
          begin: '\\$\\$[\\s\\S]',
          relevance: 0
        };
        var VAR = {
          className: 'variable',
          variants: [{begin: /\$[\w\d][\w\d_:]*/}]
        };
        var QUOTE_STRING = {
          className: 'string',
          begin: /"/,
          end: /"/,
          contains: [backtickEscape, VAR, {
            className: 'variable',
            begin: /\$[A-z]/,
            end: /[^A-z]/
          }]
        };
        var APOS_STRING = {
          className: 'string',
          begin: /'/,
          end: /'/
        };
        return {
          aliases: ['ps'],
          lexemes: /-?[A-z\.\-]+/,
          case_insensitive: true,
          keywords: {
            keyword: 'if else foreach return function do while until elseif begin for trap data dynamicparam end break throw param continue finally in switch exit filter try process catch',
            literal: '$null $true $false',
            built_in: 'Add-Content Add-History Add-Member Add-PSSnapin Clear-Content Clear-Item Clear-Item Property Clear-Variable Compare-Object ConvertFrom-SecureString Convert-Path ConvertTo-Html ConvertTo-SecureString Copy-Item Copy-ItemProperty Export-Alias Export-Clixml Export-Console Export-Csv ForEach-Object Format-Custom Format-List Format-Table Format-Wide Get-Acl Get-Alias Get-AuthenticodeSignature Get-ChildItem Get-Command Get-Content Get-Credential Get-Culture Get-Date Get-EventLog Get-ExecutionPolicy Get-Help Get-History Get-Host Get-Item Get-ItemProperty Get-Location Get-Member Get-PfxCertificate Get-Process Get-PSDrive Get-PSProvider Get-PSSnapin Get-Service Get-TraceSource Get-UICulture Get-Unique Get-Variable Get-WmiObject Group-Object Import-Alias Import-Clixml Import-Csv Invoke-Expression Invoke-History Invoke-Item Join-Path Measure-Command Measure-Object Move-Item Move-ItemProperty New-Alias New-Item New-ItemProperty New-Object New-PSDrive New-Service New-TimeSpan New-Variable Out-Default Out-File Out-Host Out-Null Out-Printer Out-String Pop-Location Push-Location Read-Host Remove-Item Remove-ItemProperty Remove-PSDrive Remove-PSSnapin Remove-Variable Rename-Item Rename-ItemProperty Resolve-Path Restart-Service Resume-Service Select-Object Select-String Set-Acl Set-Alias Set-AuthenticodeSignature Set-Content Set-Date Set-ExecutionPolicy Set-Item Set-ItemProperty Set-Location Set-PSDebug Set-Service Set-TraceSource Set-Variable Sort-Object Split-Path Start-Service Start-Sleep Start-Transcript Stop-Process Stop-Service Stop-Transcript Suspend-Service Tee-Object Test-Path Trace-Command Update-FormatData Update-TypeData Where-Object Write-Debug Write-Error Write-Host Write-Output Write-Progress Write-Verbose Write-Warning',
            operator: '-ne -eq -lt -gt -ge -le -not -like -notlike -match -notmatch -contains -notcontains -in -notin -replace'
          },
          contains: [hljs.HASH_COMMENT_MODE, hljs.NUMBER_MODE, QUOTE_STRING, APOS_STRING, VAR]
        };
      };
    }, {}],
    89: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            keyword: 'BufferedReader PVector PFont PImage PGraphics HashMap boolean byte char color ' + 'double float int long String Array FloatDict FloatList IntDict IntList JSONArray JSONObject ' + 'Object StringDict StringList Table TableRow XML ' + 'false synchronized int abstract float private char boolean static null if const ' + 'for true while long throw strictfp finally protected import native final return void ' + 'enum else break transient new catch instanceof byte super volatile case assert short ' + 'package default double public try this switch continue throws protected public private',
            constant: 'P2D P3D HALF_PI PI QUARTER_PI TAU TWO_PI',
            variable: 'displayHeight displayWidth mouseY mouseX mousePressed pmouseX pmouseY key ' + 'keyCode pixels focused frameCount frameRate height width',
            title: 'setup draw',
            built_in: 'size createGraphics beginDraw createShape loadShape PShape arc ellipse line point ' + 'quad rect triangle bezier bezierDetail bezierPoint bezierTangent curve curveDetail curvePoint ' + 'curveTangent curveTightness shape shapeMode beginContour beginShape bezierVertex curveVertex ' + 'endContour endShape quadraticVertex vertex ellipseMode noSmooth rectMode smooth strokeCap ' + 'strokeJoin strokeWeight mouseClicked mouseDragged mouseMoved mousePressed mouseReleased ' + 'mouseWheel keyPressed keyPressedkeyReleased keyTyped print println save saveFrame day hour ' + 'millis minute month second year background clear colorMode fill noFill noStroke stroke alpha ' + 'blue brightness color green hue lerpColor red saturation modelX modelY modelZ screenX screenY ' + 'screenZ ambient emissive shininess specular add createImage beginCamera camera endCamera frustum ' + 'ortho perspective printCamera printProjection cursor frameRate noCursor exit loop noLoop popStyle ' + 'pushStyle redraw binary boolean byte char float hex int str unbinary unhex join match matchAll nf ' + 'nfc nfp nfs split splitTokens trim append arrayCopy concat expand reverse shorten sort splice subset ' + 'box sphere sphereDetail createInput createReader loadBytes loadJSONArray loadJSONObject loadStrings ' + 'loadTable loadXML open parseXML saveTable selectFolder selectInput beginRaw beginRecord createOutput ' + 'createWriter endRaw endRecord PrintWritersaveBytes saveJSONArray saveJSONObject saveStream saveStrings ' + 'saveXML selectOutput popMatrix printMatrix pushMatrix resetMatrix rotate rotateX rotateY rotateZ scale ' + 'shearX shearY translate ambientLight directionalLight lightFalloff lights lightSpecular noLights normal ' + 'pointLight spotLight image imageMode loadImage noTint requestImage tint texture textureMode textureWrap ' + 'blend copy filter get loadPixels set updatePixels blendMode loadShader PShaderresetShader shader createFont ' + 'loadFont text textFont textAlign textLeading textMode textSize textWidth textAscent textDescent abs ceil ' + 'constrain dist exp floor lerp log mag map max min norm pow round sq sqrt acos asin atan atan2 cos degrees ' + 'radians sin tan noise noiseDetail noiseSeed random randomGaussian randomSeed'
          },
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    90: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {contains: [hljs.C_NUMBER_MODE, {
            className: 'built_in',
            begin: '{',
            end: '}$',
            excludeBegin: true,
            excludeEnd: true,
            contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE],
            relevance: 0
          }, {
            className: 'filename',
            begin: '[a-zA-Z_][\\da-zA-Z_]+\\.[\\da-zA-Z_]{1,3}',
            end: ':',
            excludeEnd: true
          }, {
            className: 'header',
            begin: '(ncalls|tottime|cumtime)',
            end: '$',
            keywords: 'ncalls tottime|10 cumtime|10 filename',
            relevance: 10
          }, {
            className: 'summary',
            begin: 'function calls',
            end: '$',
            contains: [hljs.C_NUMBER_MODE],
            relevance: 10
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'function',
            begin: '\\(',
            end: '\\)$',
            contains: [hljs.UNDERSCORE_TITLE_MODE],
            relevance: 0
          }]};
      };
    }, {}],
    91: [function(require, module, exports) {
      module.exports = function(hljs) {
        var ATOM = {
          className: 'atom',
          begin: /[a-z][A-Za-z0-9_]*/,
          relevance: 0
        };
        var VAR = {
          className: 'name',
          variants: [{begin: /[A-Z][a-zA-Z0-9_]*/}, {begin: /_[A-Za-z0-9_]*/}],
          relevance: 0
        };
        var PARENTED = {
          begin: /\(/,
          end: /\)/,
          relevance: 0
        };
        var LIST = {
          begin: /\[/,
          end: /\]/
        };
        var LINE_COMMENT = {
          className: 'comment',
          begin: /%/,
          end: /$/,
          contains: [hljs.PHRASAL_WORDS_MODE]
        };
        var BACKTICK_STRING = {
          className: 'string',
          begin: /`/,
          end: /`/,
          contains: [hljs.BACKSLASH_ESCAPE]
        };
        var CHAR_CODE = {
          className: 'string',
          begin: /0\'(\\\'|.)/
        };
        var SPACE_CODE = {
          className: 'string',
          begin: /0\'\\s/
        };
        var PRED_OP = {begin: /:-/};
        var inner = [ATOM, VAR, PARENTED, PRED_OP, LIST, LINE_COMMENT, hljs.C_BLOCK_COMMENT_MODE, hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, BACKTICK_STRING, CHAR_CODE, SPACE_CODE, hljs.C_NUMBER_MODE];
        PARENTED.contains = inner;
        LIST.contains = inner;
        return {contains: inner.concat([{begin: /\.$/}])};
      };
    }, {}],
    92: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            keyword: 'package import option optional required repeated group',
            built_in: 'double float int32 int64 uint32 uint64 sint32 sint64 ' + 'fixed32 fixed64 sfixed32 sfixed64 bool string bytes',
            literal: 'true false'
          },
          contains: [hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE, hljs.C_LINE_COMMENT_MODE, {
            className: 'class',
            beginKeywords: 'message enum service',
            end: /\{/,
            illegal: /\n/,
            contains: [hljs.inherit(hljs.TITLE_MODE, {starts: {
                endsWithParent: true,
                excludeEnd: true
              }})]
          }, {
            className: 'function',
            beginKeywords: 'rpc',
            end: /;/,
            excludeEnd: true,
            keywords: 'rpc returns'
          }, {
            className: 'constant',
            begin: /^\s*[A-Z_]+/,
            end: /\s*=/,
            excludeEnd: true
          }]
        };
      };
    }, {}],
    93: [function(require, module, exports) {
      module.exports = function(hljs) {
        var PUPPET_TYPE_REFERENCE = 'augeas computer cron exec file filebucket host interface k5login macauthorization mailalias maillist mcx mount nagios_command ' + 'nagios_contact nagios_contactgroup nagios_host nagios_hostdependency nagios_hostescalation nagios_hostextinfo nagios_hostgroup nagios_service firewall ' + 'nagios_servicedependency nagios_serviceescalation nagios_serviceextinfo nagios_servicegroup nagios_timeperiod notify package resources ' + 'router schedule scheduled_task selboolean selmodule service ssh_authorized_key sshkey stage tidy user vlan yumrepo zfs zone zpool';
        var PUPPET_ATTRIBUTES = 'alias audit before loglevel noop require subscribe tag ' + 'owner ensure group mode name|0 changes context force incl lens load_path onlyif provider returns root show_diff type_check ' + 'en_address ip_address realname command environment hour monute month monthday special target weekday ' + 'creates cwd ogoutput refresh refreshonly tries try_sleep umask backup checksum content ctime force ignore ' + 'links mtime purge recurse recurselimit replace selinux_ignore_defaults selrange selrole seltype seluser source ' + 'souirce_permissions sourceselect validate_cmd validate_replacement allowdupe attribute_membership auth_membership forcelocal gid ' + 'ia_load_module members system host_aliases ip allowed_trunk_vlans description device_url duplex encapsulation etherchannel ' + 'native_vlan speed principals allow_root auth_class auth_type authenticate_user k_of_n mechanisms rule session_owner shared options ' + 'device fstype enable hasrestart directory present absent link atboot blockdevice device dump pass remounts poller_tag use ' + 'message withpath adminfile allow_virtual allowcdrom category configfiles flavor install_options instance package_settings platform ' + 'responsefile status uninstall_options vendor unless_system_user unless_uid binary control flags hasstatus manifest pattern restart running ' + 'start stop allowdupe auths expiry gid groups home iterations key_membership keys managehome membership password password_max_age ' + 'password_min_age profile_membership profiles project purge_ssh_keys role_membership roles salt shell uid baseurl cost descr enabled ' + 'enablegroups exclude failovermethod gpgcheck gpgkey http_caching include includepkgs keepalive metadata_expire metalink mirrorlist ' + 'priority protect proxy proxy_password proxy_username repo_gpgcheck s3_enabled skip_if_unavailable sslcacert sslclientcert sslclientkey ' + 'sslverify mounted';
        var PUPPET_KEYWORDS = {
          keyword: 'and case class default define else elsif false if in import enherits node or true undef unless main settings $string ' + PUPPET_TYPE_REFERENCE,
          literal: PUPPET_ATTRIBUTES,
          built_in: 'architecture augeasversion blockdevices boardmanufacturer boardproductname boardserialnumber cfkey dhcp_servers ' + 'domain ec2_ ec2_userdata facterversion filesystems ldom fqdn gid hardwareisa hardwaremodel hostname id|0 interfaces ' + 'ipaddress ipaddress_ ipaddress6 ipaddress6_ iphostnumber is_virtual kernel kernelmajversion kernelrelease kernelversion ' + 'kernelrelease kernelversion lsbdistcodename lsbdistdescription lsbdistid lsbdistrelease lsbmajdistrelease lsbminordistrelease ' + 'lsbrelease macaddress macaddress_ macosx_buildversion macosx_productname macosx_productversion macosx_productverson_major ' + 'macosx_productversion_minor manufacturer memoryfree memorysize netmask metmask_ network_ operatingsystem operatingsystemmajrelease ' + 'operatingsystemrelease osfamily partitions path physicalprocessorcount processor processorcount productname ps puppetversion ' + 'rubysitedir rubyversion selinux selinux_config_mode selinux_config_policy selinux_current_mode selinux_current_mode selinux_enforced ' + 'selinux_policyversion serialnumber sp_ sshdsakey sshecdsakey sshrsakey swapencrypted swapfree swapsize timezone type uniqueid uptime ' + 'uptime_days uptime_hours uptime_seconds uuid virtual vlans xendomains zfs_version zonenae zones zpool_version'
        };
        var COMMENT = hljs.COMMENT('#', '$');
        var STRING = {
          className: 'string',
          contains: [hljs.BACKSLASH_ESCAPE],
          variants: [{
            begin: /'/,
            end: /'/
          }, {
            begin: /"/,
            end: /"/
          }]
        };
        var PUPPET_DEFAULT_CONTAINS = [STRING, COMMENT, {
          className: 'keyword',
          beginKeywords: 'class',
          end: '$|;',
          illegal: /=/,
          contains: [hljs.inherit(hljs.TITLE_MODE, {begin: '(::)?[A-Za-z_]\\w*(::\\w+)*'}), COMMENT, STRING]
        }, {
          className: 'keyword',
          begin: '([a-zA-Z_(::)]+ *\\{)',
          contains: [STRING, COMMENT],
          relevance: 0
        }, {
          className: 'keyword',
          begin: '(\\}|\\{)',
          relevance: 0
        }, {
          className: 'function',
          begin: '[a-zA-Z_]+\\s*=>'
        }, {
          className: 'constant',
          begin: '(::)?(\\b[A-Z][a-z_]*(::)?)+',
          relevance: 0
        }, {
          className: 'number',
          begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
          relevance: 0
        }];
        return {
          aliases: ['pp'],
          keywords: PUPPET_KEYWORDS,
          contains: PUPPET_DEFAULT_CONTAINS
        };
      };
    }, {}],
    94: [function(require, module, exports) {
      module.exports = function(hljs) {
        var PROMPT = {
          className: 'prompt',
          begin: /^(>>>|\.\.\.) /
        };
        var STRING = {
          className: 'string',
          contains: [hljs.BACKSLASH_ESCAPE],
          variants: [{
            begin: /(u|b)?r?'''/,
            end: /'''/,
            contains: [PROMPT],
            relevance: 10
          }, {
            begin: /(u|b)?r?"""/,
            end: /"""/,
            contains: [PROMPT],
            relevance: 10
          }, {
            begin: /(u|r|ur)'/,
            end: /'/,
            relevance: 10
          }, {
            begin: /(u|r|ur)"/,
            end: /"/,
            relevance: 10
          }, {
            begin: /(b|br)'/,
            end: /'/
          }, {
            begin: /(b|br)"/,
            end: /"/
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
        };
        var NUMBER = {
          className: 'number',
          relevance: 0,
          variants: [{begin: hljs.BINARY_NUMBER_RE + '[lLjJ]?'}, {begin: '\\b(0o[0-7]+)[lLjJ]?'}, {begin: hljs.C_NUMBER_RE + '[lLjJ]?'}]
        };
        var PARAMS = {
          className: 'params',
          begin: /\(/,
          end: /\)/,
          contains: ['self', PROMPT, NUMBER, STRING]
        };
        return {
          aliases: ['py', 'gyp'],
          keywords: {
            keyword: 'and elif is global as in if from raise for except finally print import pass return ' + 'exec else break not with class assert yield try while continue del or def lambda ' + 'nonlocal|10 None True False',
            built_in: 'Ellipsis NotImplemented'
          },
          illegal: /(<\/|->|\?)/,
          contains: [PROMPT, NUMBER, STRING, hljs.HASH_COMMENT_MODE, {
            variants: [{
              className: 'function',
              beginKeywords: 'def',
              relevance: 10
            }, {
              className: 'class',
              beginKeywords: 'class'
            }],
            end: /:/,
            illegal: /[${=;\n,]/,
            contains: [hljs.UNDERSCORE_TITLE_MODE, PARAMS]
          }, {
            className: 'decorator',
            begin: /@/,
            end: /$/
          }, {begin: /\b(print|exec)\(/}]
        };
      };
    }, {}],
    95: [function(require, module, exports) {
      module.exports = function(hljs) {
        var Q_KEYWORDS = {
          keyword: 'do while select delete by update from',
          constant: '0b 1b',
          built_in: 'neg not null string reciprocal floor ceiling signum mod xbar xlog and or each scan over prior mmu lsq inv md5 ltime gtime count first var dev med cov cor all any rand sums prds mins maxs fills deltas ratios avgs differ prev next rank reverse iasc idesc asc desc msum mcount mavg mdev xrank mmin mmax xprev rotate distinct group where flip type key til get value attr cut set upsert raze union inter except cross sv vs sublist enlist read0 read1 hopen hclose hdel hsym hcount peach system ltrim rtrim trim lower upper ssr view tables views cols xcols keys xkey xcol xasc xdesc fkeys meta lj aj aj0 ij pj asof uj ww wj wj1 fby xgroup ungroup ej save load rsave rload show csv parse eval min max avg wavg wsum sin cos tan sum',
          typename: '`float `double int `timestamp `timespan `datetime `time `boolean `symbol `char `byte `short `long `real `month `date `minute `second `guid'
        };
        return {
          aliases: ['k', 'kdb'],
          keywords: Q_KEYWORDS,
          lexemes: /\b(`?)[A-Za-z0-9_]+\b/,
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    96: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE = '([a-zA-Z]|\\.[a-zA-Z.])[a-zA-Z0-9._]*';
        return {contains: [hljs.HASH_COMMENT_MODE, {
            begin: IDENT_RE,
            lexemes: IDENT_RE,
            keywords: {
              keyword: 'function if in break next repeat else for return switch while try tryCatch ' + 'stop warning require library attach detach source setMethod setGeneric ' + 'setGroupGeneric setClass ...',
              literal: 'NULL NA TRUE FALSE T F Inf NaN NA_integer_|10 NA_real_|10 NA_character_|10 ' + 'NA_complex_|10'
            },
            relevance: 0
          }, {
            className: 'number',
            begin: "0[xX][0-9a-fA-F]+[Li]?\\b",
            relevance: 0
          }, {
            className: 'number',
            begin: "\\d+(?:[eE][+\\-]?\\d*)?L\\b",
            relevance: 0
          }, {
            className: 'number',
            begin: "\\d+\\.(?!\\d)(?:i\\b)?",
            relevance: 0
          }, {
            className: 'number',
            begin: "\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d*)?i?\\b",
            relevance: 0
          }, {
            className: 'number',
            begin: "\\.\\d+(?:[eE][+\\-]?\\d*)?i?\\b",
            relevance: 0
          }, {
            begin: '`',
            end: '`',
            relevance: 0
          }, {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE],
            variants: [{
              begin: '"',
              end: '"'
            }, {
              begin: "'",
              end: "'"
            }]
          }]};
      };
    }, {}],
    97: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: 'ArchiveRecord AreaLightSource Atmosphere Attribute AttributeBegin AttributeEnd Basis ' + 'Begin Blobby Bound Clipping ClippingPlane Color ColorSamples ConcatTransform Cone ' + 'CoordinateSystem CoordSysTransform CropWindow Curves Cylinder DepthOfField Detail ' + 'DetailRange Disk Displacement Display End ErrorHandler Exposure Exterior Format ' + 'FrameAspectRatio FrameBegin FrameEnd GeneralPolygon GeometricApproximation Geometry ' + 'Hider Hyperboloid Identity Illuminate Imager Interior LightSource ' + 'MakeCubeFaceEnvironment MakeLatLongEnvironment MakeShadow MakeTexture Matte ' + 'MotionBegin MotionEnd NuPatch ObjectBegin ObjectEnd ObjectInstance Opacity Option ' + 'Orientation Paraboloid Patch PatchMesh Perspective PixelFilter PixelSamples ' + 'PixelVariance Points PointsGeneralPolygons PointsPolygons Polygon Procedural Projection ' + 'Quantize ReadArchive RelativeDetail ReverseOrientation Rotate Scale ScreenWindow ' + 'ShadingInterpolation ShadingRate Shutter Sides Skew SolidBegin SolidEnd Sphere ' + 'SubdivisionMesh Surface TextureCoordinates Torus Transform TransformBegin TransformEnd ' + 'TransformPoints Translate TrimCurve WorldBegin WorldEnd',
          illegal: '</',
          contains: [hljs.HASH_COMMENT_MODE, hljs.C_NUMBER_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
        };
      };
    }, {}],
    98: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENTIFIER = '[a-zA-Z-_][^\n{\r\n]+\\{';
        return {
          aliases: ['graph', 'instances'],
          case_insensitive: true,
          keywords: 'import',
          contains: [{
            className: 'facet',
            begin: '^facet ' + IDENTIFIER,
            end: '}',
            keywords: 'facet installer exports children extends',
            contains: [hljs.HASH_COMMENT_MODE]
          }, {
            className: 'instance-of',
            begin: '^instance of ' + IDENTIFIER,
            end: '}',
            keywords: 'name count channels instance-data instance-state instance of',
            contains: [{
              className: 'keyword',
              begin: '[a-zA-Z-_]+( |\t)*:'
            }, hljs.HASH_COMMENT_MODE]
          }, {
            className: 'component',
            begin: '^' + IDENTIFIER,
            end: '}',
            lexemes: '\\(?[a-zA-Z]+\\)?',
            keywords: 'installer exports children extends imports facets alias (optional)',
            contains: [{
              className: 'string',
              begin: '\\.[a-zA-Z-_]+',
              end: '\\s|,|;',
              excludeEnd: true
            }, hljs.HASH_COMMENT_MODE]
          }, hljs.HASH_COMMENT_MODE]
        };
      };
    }, {}],
    99: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            keyword: 'float color point normal vector matrix while for if do return else break extern continue',
            built_in: 'abs acos ambient area asin atan atmosphere attribute calculatenormal ceil cellnoise ' + 'clamp comp concat cos degrees depth Deriv diffuse distance Du Dv environment exp ' + 'faceforward filterstep floor format fresnel incident length lightsource log match ' + 'max min mod noise normalize ntransform opposite option phong pnoise pow printf ' + 'ptlined radians random reflect refract renderinfo round setcomp setxcomp setycomp ' + 'setzcomp shadow sign sin smoothstep specular specularbrdf spline sqrt step tan ' + 'texture textureinfo trace transform vtransform xcomp ycomp zcomp'
          },
          illegal: '</',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, hljs.C_NUMBER_MODE, {
            className: 'preprocessor',
            begin: '#',
            end: '$'
          }, {
            className: 'shader',
            beginKeywords: 'surface displacement light volume imager',
            end: '\\('
          }, {
            className: 'shading',
            beginKeywords: 'illuminate illuminance gather',
            end: '\\('
          }]
        };
      };
    }, {}],
    100: [function(require, module, exports) {
      module.exports = function(hljs) {
        var RUBY_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
        var RUBY_KEYWORDS = 'and false then defined module in return redo if BEGIN retry end for true self when ' + 'next until do begin unless END rescue nil else break undef not super class case ' + 'require yield alias while ensure elsif or include attr_reader attr_writer attr_accessor';
        var YARDOCTAG = {
          className: 'doctag',
          begin: '@[A-Za-z]+'
        };
        var IRB_OBJECT = {
          className: 'value',
          begin: '#<',
          end: '>'
        };
        var COMMENT_MODES = [hljs.COMMENT('#', '$', {contains: [YARDOCTAG]}), hljs.COMMENT('^\\=begin', '^\\=end', {
          contains: [YARDOCTAG],
          relevance: 10
        }), hljs.COMMENT('^__END__', '\\n$')];
        var SUBST = {
          className: 'subst',
          begin: '#\\{',
          end: '}',
          keywords: RUBY_KEYWORDS
        };
        var STRING = {
          className: 'string',
          contains: [hljs.BACKSLASH_ESCAPE, SUBST],
          variants: [{
            begin: /'/,
            end: /'/
          }, {
            begin: /"/,
            end: /"/
          }, {
            begin: /`/,
            end: /`/
          }, {
            begin: '%[qQwWx]?\\(',
            end: '\\)'
          }, {
            begin: '%[qQwWx]?\\[',
            end: '\\]'
          }, {
            begin: '%[qQwWx]?{',
            end: '}'
          }, {
            begin: '%[qQwWx]?<',
            end: '>'
          }, {
            begin: '%[qQwWx]?/',
            end: '/'
          }, {
            begin: '%[qQwWx]?%',
            end: '%'
          }, {
            begin: '%[qQwWx]?-',
            end: '-'
          }, {
            begin: '%[qQwWx]?\\|',
            end: '\\|'
          }, {begin: /\B\?(\\\d{1,3}|\\x[A-Fa-f0-9]{1,2}|\\u[A-Fa-f0-9]{4}|\\?\S)\b/}]
        };
        var PARAMS = {
          className: 'params',
          begin: '\\(',
          end: '\\)',
          keywords: RUBY_KEYWORDS
        };
        var RUBY_DEFAULT_CONTAINS = [STRING, IRB_OBJECT, {
          className: 'class',
          beginKeywords: 'class module',
          end: '$|;',
          illegal: /=/,
          contains: [hljs.inherit(hljs.TITLE_MODE, {begin: '[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?'}), {
            className: 'inheritance',
            begin: '<\\s*',
            contains: [{
              className: 'parent',
              begin: '(' + hljs.IDENT_RE + '::)?' + hljs.IDENT_RE
            }]
          }].concat(COMMENT_MODES)
        }, {
          className: 'function',
          beginKeywords: 'def',
          end: ' |$|;',
          relevance: 0,
          contains: [hljs.inherit(hljs.TITLE_MODE, {begin: RUBY_METHOD_RE}), PARAMS].concat(COMMENT_MODES)
        }, {
          className: 'constant',
          begin: '(::)?(\\b[A-Z]\\w*(::)?)+',
          relevance: 0
        }, {
          className: 'symbol',
          begin: hljs.UNDERSCORE_IDENT_RE + '(\\!|\\?)?:',
          relevance: 0
        }, {
          className: 'symbol',
          begin: ':',
          contains: [STRING, {begin: RUBY_METHOD_RE}],
          relevance: 0
        }, {
          className: 'number',
          begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
          relevance: 0
        }, {
          className: 'variable',
          begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
        }, {
          begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
          contains: [IRB_OBJECT, {
            className: 'regexp',
            contains: [hljs.BACKSLASH_ESCAPE, SUBST],
            illegal: /\n/,
            variants: [{
              begin: '/',
              end: '/[a-z]*'
            }, {
              begin: '%r{',
              end: '}[a-z]*'
            }, {
              begin: '%r\\(',
              end: '\\)[a-z]*'
            }, {
              begin: '%r!',
              end: '![a-z]*'
            }, {
              begin: '%r\\[',
              end: '\\][a-z]*'
            }]
          }].concat(COMMENT_MODES),
          relevance: 0
        }].concat(COMMENT_MODES);
        SUBST.contains = RUBY_DEFAULT_CONTAINS;
        PARAMS.contains = RUBY_DEFAULT_CONTAINS;
        var SIMPLE_PROMPT = "[>?]>";
        var DEFAULT_PROMPT = "[\\w#]+\\(\\w+\\):\\d+:\\d+>";
        var RVM_PROMPT = "(\\w+-)?\\d+\\.\\d+\\.\\d(p\\d+)?[^>]+>";
        var IRB_DEFAULT = [{
          begin: /^\s*=>/,
          className: 'status',
          starts: {
            end: '$',
            contains: RUBY_DEFAULT_CONTAINS
          }
        }, {
          className: 'prompt',
          begin: '^(' + SIMPLE_PROMPT + "|" + DEFAULT_PROMPT + '|' + RVM_PROMPT + ')',
          starts: {
            end: '$',
            contains: RUBY_DEFAULT_CONTAINS
          }
        }];
        return {
          aliases: ['rb', 'gemspec', 'podspec', 'thor', 'irb'],
          keywords: RUBY_KEYWORDS,
          contains: COMMENT_MODES.concat(IRB_DEFAULT).concat(RUBY_DEFAULT_CONTAINS)
        };
      };
    }, {}],
    101: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            keyword: 'BILL_PERIOD BILL_START BILL_STOP RS_EFFECTIVE_START RS_EFFECTIVE_STOP RS_JURIS_CODE RS_OPCO_CODE ' + 'INTDADDATTRIBUTE|5 INTDADDVMSG|5 INTDBLOCKOP|5 INTDBLOCKOPNA|5 INTDCLOSE|5 INTDCOUNT|5 ' + 'INTDCOUNTSTATUSCODE|5 INTDCREATEMASK|5 INTDCREATEDAYMASK|5 INTDCREATEFACTORMASK|5 ' + 'INTDCREATEHANDLE|5 INTDCREATEOVERRIDEDAYMASK|5 INTDCREATEOVERRIDEMASK|5 ' + 'INTDCREATESTATUSCODEMASK|5 INTDCREATETOUPERIOD|5 INTDDELETE|5 INTDDIPTEST|5 INTDEXPORT|5 ' + 'INTDGETERRORCODE|5 INTDGETERRORMESSAGE|5 INTDISEQUAL|5 INTDJOIN|5 INTDLOAD|5 INTDLOADACTUALCUT|5 ' + 'INTDLOADDATES|5 INTDLOADHIST|5 INTDLOADLIST|5 INTDLOADLISTDATES|5 INTDLOADLISTENERGY|5 ' + 'INTDLOADLISTHIST|5 INTDLOADRELATEDCHANNEL|5 INTDLOADSP|5 INTDLOADSTAGING|5 INTDLOADUOM|5 ' + 'INTDLOADUOMDATES|5 INTDLOADUOMHIST|5 INTDLOADVERSION|5 INTDOPEN|5 INTDREADFIRST|5 INTDREADNEXT|5 ' + 'INTDRECCOUNT|5 INTDRELEASE|5 INTDREPLACE|5 INTDROLLAVG|5 INTDROLLPEAK|5 INTDSCALAROP|5 INTDSCALE|5 ' + 'INTDSETATTRIBUTE|5 INTDSETDSTPARTICIPANT|5 INTDSETSTRING|5 INTDSETVALUE|5 INTDSETVALUESTATUS|5 ' + 'INTDSHIFTSTARTTIME|5 INTDSMOOTH|5 INTDSORT|5 INTDSPIKETEST|5 INTDSUBSET|5 INTDTOU|5 ' + 'INTDTOURELEASE|5 INTDTOUVALUE|5 INTDUPDATESTATS|5 INTDVALUE|5 STDEV INTDDELETEEX|5 ' + 'INTDLOADEXACTUAL|5 INTDLOADEXCUT|5 INTDLOADEXDATES|5 INTDLOADEX|5 INTDLOADEXRELATEDCHANNEL|5 ' + 'INTDSAVEEX|5 MVLOAD|5 MVLOADACCT|5 MVLOADACCTDATES|5 MVLOADACCTHIST|5 MVLOADDATES|5 MVLOADHIST|5 ' + 'MVLOADLIST|5 MVLOADLISTDATES|5 MVLOADLISTHIST|5 IF FOR NEXT DONE SELECT END CALL ABORT CLEAR CHANNEL FACTOR LIST NUMBER ' + 'OVERRIDE SET WEEK DISTRIBUTIONNODE ELSE WHEN THEN OTHERWISE IENUM CSV INCLUDE LEAVE RIDER SAVE DELETE ' + 'NOVALUE SECTION WARN SAVE_UPDATE DETERMINANT LABEL REPORT REVENUE EACH ' + 'IN FROM TOTAL CHARGE BLOCK AND OR CSV_FILE RATE_CODE AUXILIARY_DEMAND ' + 'UIDACCOUNT RS BILL_PERIOD_SELECT HOURS_PER_MONTH INTD_ERROR_STOP SEASON_SCHEDULE_NAME ' + 'ACCOUNTFACTOR ARRAYUPPERBOUND CALLSTOREDPROC GETADOCONNECTION GETCONNECT GETDATASOURCE ' + 'GETQUALIFIER GETUSERID HASVALUE LISTCOUNT LISTOP LISTUPDATE LISTVALUE PRORATEFACTOR RSPRORATE ' + 'SETBINPATH SETDBMONITOR WQ_OPEN BILLINGHOURS DATE DATEFROMFLOAT DATETIMEFROMSTRING ' + 'DATETIMETOSTRING DATETOFLOAT DAY DAYDIFF DAYNAME DBDATETIME HOUR MINUTE MONTH MONTHDIFF ' + 'MONTHHOURS MONTHNAME ROUNDDATE SAMEWEEKDAYLASTYEAR SECOND WEEKDAY WEEKDIFF YEAR YEARDAY ' + 'YEARSTR COMPSUM HISTCOUNT HISTMAX HISTMIN HISTMINNZ HISTVALUE MAXNRANGE MAXRANGE MINRANGE ' + 'COMPIKVA COMPKVA COMPKVARFROMKQKW COMPLF IDATTR FLAG LF2KW LF2KWH MAXKW POWERFACTOR ' + 'READING2USAGE AVGSEASON MAXSEASON MONTHLYMERGE SEASONVALUE SUMSEASON ACCTREADDATES ' + 'ACCTTABLELOAD CONFIGADD CONFIGGET CREATEOBJECT CREATEREPORT EMAILCLIENT EXPBLKMDMUSAGE ' + 'EXPMDMUSAGE EXPORT_USAGE FACTORINEFFECT GETUSERSPECIFIEDSTOP INEFFECT ISHOLIDAY RUNRATE ' + 'SAVE_PROFILE SETREPORTTITLE USEREXIT WATFORRUNRATE TO TABLE ACOS ASIN ATAN ATAN2 BITAND CEIL ' + 'COS COSECANT COSH COTANGENT DIVQUOT DIVREM EXP FABS FLOOR FMOD FREPM FREXPN LOG LOG10 MAX MAXN ' + 'MIN MINNZ MODF POW ROUND ROUND2VALUE ROUNDINT SECANT SIN SINH SQROOT TAN TANH FLOAT2STRING ' + 'FLOAT2STRINGNC INSTR LEFT LEN LTRIM MID RIGHT RTRIM STRING STRINGNC TOLOWER TOUPPER TRIM ' + 'NUMDAYS READ_DATE STAGING',
            built_in: 'IDENTIFIER OPTIONS XML_ELEMENT XML_OP XML_ELEMENT_OF DOMDOCCREATE DOMDOCLOADFILE DOMDOCLOADXML ' + 'DOMDOCSAVEFILE DOMDOCGETROOT DOMDOCADDPI DOMNODEGETNAME DOMNODEGETTYPE DOMNODEGETVALUE DOMNODEGETCHILDCT ' + 'DOMNODEGETFIRSTCHILD DOMNODEGETSIBLING DOMNODECREATECHILDELEMENT DOMNODESETATTRIBUTE ' + 'DOMNODEGETCHILDELEMENTCT DOMNODEGETFIRSTCHILDELEMENT DOMNODEGETSIBLINGELEMENT DOMNODEGETATTRIBUTECT ' + 'DOMNODEGETATTRIBUTEI DOMNODEGETATTRIBUTEBYNAME DOMNODEGETBYNAME'
          },
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, {
            className: 'array',
            begin: '\#[a-zA-Z\ \.]+'
          }]
        };
      };
    }, {}],
    102: [function(require, module, exports) {
      module.exports = function(hljs) {
        var NUM_SUFFIX = '([uif](8|16|32|64|size))\?';
        var BLOCK_COMMENT = hljs.inherit(hljs.C_BLOCK_COMMENT_MODE);
        BLOCK_COMMENT.contains.push('self');
        return {
          aliases: ['rs'],
          keywords: {
            keyword: 'alignof as be box break const continue crate do else enum extern ' + 'false fn for if impl in let loop match mod mut offsetof once priv ' + 'proc pub pure ref return self sizeof static struct super trait true ' + 'type typeof unsafe unsized use virtual while yield ' + 'int i8 i16 i32 i64 ' + 'uint u8 u32 u64 ' + 'float f32 f64 ' + 'str char bool',
            built_in: 'assert! assert_eq! bitflags! bytes! cfg! col! concat! concat_idents! ' + 'debug_assert! debug_assert_eq! env! panic! file! format! format_args! ' + 'include_bin! include_str! line! local_data_key! module_path! ' + 'option_env! print! println! select! stringify! try! unimplemented! ' + 'unreachable! vec! write! writeln!'
          },
          lexemes: hljs.IDENT_RE + '!?',
          illegal: '</',
          contains: [hljs.C_LINE_COMMENT_MODE, BLOCK_COMMENT, hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), {
            className: 'string',
            variants: [{begin: /r(#*)".*?"\1(?!#)/}, {begin: /'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/}, {begin: /'[a-zA-Z_][a-zA-Z0-9_]*/}]
          }, {
            className: 'number',
            variants: [{begin: '\\b0b([01_]+)' + NUM_SUFFIX}, {begin: '\\b0o([0-7_]+)' + NUM_SUFFIX}, {begin: '\\b0x([A-Fa-f0-9_]+)' + NUM_SUFFIX}, {begin: '\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)' + NUM_SUFFIX}],
            relevance: 0
          }, {
            className: 'function',
            beginKeywords: 'fn',
            end: '(\\(|<)',
            excludeEnd: true,
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, {
            className: 'preprocessor',
            begin: '#\\!?\\[',
            end: '\\]'
          }, {
            beginKeywords: 'type',
            end: '(=|<)',
            contains: [hljs.UNDERSCORE_TITLE_MODE],
            illegal: '\\S'
          }, {
            beginKeywords: 'trait enum',
            end: '({|<)',
            contains: [hljs.UNDERSCORE_TITLE_MODE],
            illegal: '\\S'
          }, {begin: hljs.IDENT_RE + '::'}, {begin: '->'}]
        };
      };
    }, {}],
    103: [function(require, module, exports) {
      module.exports = function(hljs) {
        var ANNOTATION = {
          className: 'annotation',
          begin: '@[A-Za-z]+'
        };
        var STRING = {
          className: 'string',
          begin: 'u?r?"""',
          end: '"""',
          relevance: 10
        };
        var SYMBOL = {
          className: 'symbol',
          begin: '\'\\w[\\w\\d_]*(?!\')'
        };
        var TYPE = {
          className: 'type',
          begin: '\\b[A-Z][A-Za-z0-9_]*',
          relevance: 0
        };
        var NAME = {
          className: 'title',
          begin: /[^0-9\n\t "'(),.`{}\[\]:;][^\n\t "'(),.`{}\[\]:;]+|[^0-9\n\t "'(),.`{}\[\]:;=]/,
          relevance: 0
        };
        var CLASS = {
          className: 'class',
          beginKeywords: 'class object trait type',
          end: /[:={\[(\n;]/,
          contains: [{
            className: 'keyword',
            beginKeywords: 'extends with',
            relevance: 10
          }, NAME]
        };
        var METHOD = {
          className: 'function',
          beginKeywords: 'def val',
          end: /[:={\[(\n;]/,
          contains: [NAME]
        };
        return {
          keywords: {
            literal: 'true false null',
            keyword: 'type yield lazy override def with val var sealed abstract private trait object if forSome for while throw finally protected extends import final return else break new catch super class case package default try this match continue throws implicit'
          },
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, STRING, hljs.QUOTE_STRING_MODE, SYMBOL, TYPE, METHOD, CLASS, hljs.C_NUMBER_MODE, ANNOTATION]
        };
      };
    }, {}],
    104: [function(require, module, exports) {
      module.exports = function(hljs) {
        var SCHEME_IDENT_RE = '[^\\(\\)\\[\\]\\{\\}",\'`;#|\\\\\\s]+';
        var SCHEME_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+([./]\\d+)?';
        var SCHEME_COMPLEX_NUMBER_RE = SCHEME_SIMPLE_NUMBER_RE + '[+\\-]' + SCHEME_SIMPLE_NUMBER_RE + 'i';
        var BUILTINS = {built_in: 'case-lambda call/cc class define-class exit-handler field import ' + 'inherit init-field interface let*-values let-values let/ec mixin ' + 'opt-lambda override protect provide public rename require ' + 'require-for-syntax syntax syntax-case syntax-error unit/sig unless ' + 'when with-syntax and begin call-with-current-continuation ' + 'call-with-input-file call-with-output-file case cond define ' + 'define-syntax delay do dynamic-wind else for-each if lambda let let* ' + 'let-syntax letrec letrec-syntax map or syntax-rules \' * + , ,@ - ... / ' + '; < <= = => > >= ` abs acos angle append apply asin assoc assq assv atan ' + 'boolean? caar cadr call-with-input-file call-with-output-file ' + 'call-with-values car cdddar cddddr cdr ceiling char->integer ' + 'char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? ' + 'char-downcase char-lower-case? char-numeric? char-ready? char-upcase ' + 'char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? ' + 'char? close-input-port close-output-port complex? cons cos ' + 'current-input-port current-output-port denominator display eof-object? ' + 'eq? equal? eqv? eval even? exact->inexact exact? exp expt floor ' + 'force gcd imag-part inexact->exact inexact? input-port? integer->char ' + 'integer? interaction-environment lcm length list list->string ' + 'list->vector list-ref list-tail list? load log magnitude make-polar ' + 'make-rectangular make-string make-vector max member memq memv min ' + 'modulo negative? newline not null-environment null? number->string ' + 'number? numerator odd? open-input-file open-output-file output-port? ' + 'pair? peek-char port? positive? procedure? quasiquote quote quotient ' + 'rational? rationalize read read-char real-part real? remainder reverse ' + 'round scheme-report-environment set! set-car! set-cdr! sin sqrt string ' + 'string->list string->number string->symbol string-append string-ci<=? ' + 'string-ci<? string-ci=? string-ci>=? string-ci>? string-copy ' + 'string-fill! string-length string-ref string-set! string<=? string<? ' + 'string=? string>=? string>? string? substring symbol->string symbol? ' + 'tan transcript-off transcript-on truncate values vector ' + 'vector->list vector-fill! vector-length vector-ref vector-set! ' + 'with-input-from-file with-output-to-file write write-char zero?'};
        var SHEBANG = {
          className: 'shebang',
          begin: '^#!',
          end: '$'
        };
        var LITERAL = {
          className: 'literal',
          begin: '(#t|#f|#\\\\' + SCHEME_IDENT_RE + '|#\\\\.)'
        };
        var NUMBER = {
          className: 'number',
          variants: [{
            begin: SCHEME_SIMPLE_NUMBER_RE,
            relevance: 0
          }, {
            begin: SCHEME_COMPLEX_NUMBER_RE,
            relevance: 0
          }, {begin: '#b[0-1]+(/[0-1]+)?'}, {begin: '#o[0-7]+(/[0-7]+)?'}, {begin: '#x[0-9a-f]+(/[0-9a-f]+)?'}]
        };
        var STRING = hljs.QUOTE_STRING_MODE;
        var REGULAR_EXPRESSION = {
          className: 'regexp',
          begin: '#[pr]x"',
          end: '[^\\\\]"'
        };
        var COMMENT_MODES = [hljs.COMMENT(';', '$', {relevance: 0}), hljs.COMMENT('#\\|', '\\|#')];
        var IDENT = {
          begin: SCHEME_IDENT_RE,
          relevance: 0
        };
        var QUOTED_IDENT = {
          className: 'variable',
          begin: '\'' + SCHEME_IDENT_RE
        };
        var BODY = {
          endsWithParent: true,
          relevance: 0
        };
        var LIST = {
          className: 'list',
          variants: [{
            begin: '\\(',
            end: '\\)'
          }, {
            begin: '\\[',
            end: '\\]'
          }],
          contains: [{
            className: 'keyword',
            begin: SCHEME_IDENT_RE,
            lexemes: SCHEME_IDENT_RE,
            keywords: BUILTINS
          }, BODY]
        };
        BODY.contains = [LITERAL, NUMBER, STRING, IDENT, QUOTED_IDENT, LIST].concat(COMMENT_MODES);
        return {
          illegal: /\S/,
          contains: [SHEBANG, NUMBER, STRING, QUOTED_IDENT, LIST].concat(COMMENT_MODES)
        };
      };
    }, {}],
    105: [function(require, module, exports) {
      module.exports = function(hljs) {
        var COMMON_CONTAINS = [hljs.C_NUMBER_MODE, {
          className: 'string',
          begin: '\'|\"',
          end: '\'|\"',
          contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}]
        }];
        return {
          aliases: ['sci'],
          keywords: {
            keyword: 'abort break case clear catch continue do elseif else endfunction end for function' + 'global if pause return resume select try then while' + '%f %F %t %T %pi %eps %inf %nan %e %i %z %s',
            built_in: 'abs and acos asin atan ceil cd chdir clearglobal cosh cos cumprod deff disp error' + 'exec execstr exists exp eye gettext floor fprintf fread fsolve imag isdef isempty' + 'isinfisnan isvector lasterror length load linspace list listfiles log10 log2 log' + 'max min msprintf mclose mopen ones or pathconvert poly printf prod pwd rand real' + 'round sinh sin size gsort sprintf sqrt strcat strcmps tring sum system tanh tan' + 'type typename warning zeros matrix'
          },
          illegal: '("|#|/\\*|\\s+/\\w+)',
          contains: [{
            className: 'function',
            beginKeywords: 'function endfunction',
            end: '$',
            keywords: 'function endfunction|10',
            contains: [hljs.UNDERSCORE_TITLE_MODE, {
              className: 'params',
              begin: '\\(',
              end: '\\)'
            }]
          }, {
            className: 'transposed_variable',
            begin: '[a-zA-Z_][a-zA-Z_0-9]*(\'+[\\.\']*|[\\.\']+)',
            end: '',
            relevance: 0
          }, {
            className: 'matrix',
            begin: '\\[',
            end: '\\]\'*[\\.\']*',
            relevance: 0,
            contains: COMMON_CONTAINS
          }, hljs.COMMENT('//', '$')].concat(COMMON_CONTAINS)
        };
      };
    }, {}],
    106: [function(require, module, exports) {
      module.exports = function(hljs) {
        var IDENT_RE = '[a-zA-Z-][a-zA-Z0-9_-]*';
        var VARIABLE = {
          className: 'variable',
          begin: '(\\$' + IDENT_RE + ')\\b'
        };
        var FUNCTION = {
          className: 'function',
          begin: IDENT_RE + '\\(',
          returnBegin: true,
          excludeEnd: true,
          end: '\\('
        };
        var HEXCOLOR = {
          className: 'hexcolor',
          begin: '#[0-9A-Fa-f]+'
        };
        var DEF_INTERNALS = {
          className: 'attribute',
          begin: '[A-Z\\_\\.\\-]+',
          end: ':',
          excludeEnd: true,
          illegal: '[^\\s]',
          starts: {
            className: 'value',
            endsWithParent: true,
            excludeEnd: true,
            contains: [FUNCTION, HEXCOLOR, hljs.CSS_NUMBER_MODE, hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, hljs.C_BLOCK_COMMENT_MODE, {
              className: 'important',
              begin: '!important'
            }]
          }
        };
        return {
          case_insensitive: true,
          illegal: '[=/|\']',
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, FUNCTION, {
            className: 'id',
            begin: '\\#[A-Za-z0-9_-]+',
            relevance: 0
          }, {
            className: 'class',
            begin: '\\.[A-Za-z0-9_-]+',
            relevance: 0
          }, {
            className: 'attr_selector',
            begin: '\\[',
            end: '\\]',
            illegal: '$'
          }, {
            className: 'tag',
            begin: '\\b(a|abbr|acronym|address|area|article|aside|audio|b|base|big|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|command|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|frame|frameset|(h[1-6])|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|keygen|label|legend|li|link|map|mark|meta|meter|nav|noframes|noscript|object|ol|optgroup|option|output|p|param|pre|progress|q|rp|rt|ruby|samp|script|section|select|small|span|strike|strong|style|sub|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|tt|ul|var|video)\\b',
            relevance: 0
          }, {
            className: 'pseudo',
            begin: ':(visited|valid|root|right|required|read-write|read-only|out-range|optional|only-of-type|only-child|nth-of-type|nth-last-of-type|nth-last-child|nth-child|not|link|left|last-of-type|last-child|lang|invalid|indeterminate|in-range|hover|focus|first-of-type|first-line|first-letter|first-child|first|enabled|empty|disabled|default|checked|before|after|active)'
          }, {
            className: 'pseudo',
            begin: '::(after|before|choices|first-letter|first-line|repeat-index|repeat-item|selection|value)'
          }, VARIABLE, {
            className: 'attribute',
            begin: '\\b(z-index|word-wrap|word-spacing|word-break|width|widows|white-space|visibility|vertical-align|unicode-bidi|transition-timing-function|transition-property|transition-duration|transition-delay|transition|transform-style|transform-origin|transform|top|text-underline-position|text-transform|text-shadow|text-rendering|text-overflow|text-indent|text-decoration-style|text-decoration-line|text-decoration-color|text-decoration|text-align-last|text-align|tab-size|table-layout|right|resize|quotes|position|pointer-events|perspective-origin|perspective|page-break-inside|page-break-before|page-break-after|padding-top|padding-right|padding-left|padding-bottom|padding|overflow-y|overflow-x|overflow-wrap|overflow|outline-width|outline-style|outline-offset|outline-color|outline|orphans|order|opacity|object-position|object-fit|normal|none|nav-up|nav-right|nav-left|nav-index|nav-down|min-width|min-height|max-width|max-height|mask|marks|margin-top|margin-right|margin-left|margin-bottom|margin|list-style-type|list-style-position|list-style-image|list-style|line-height|letter-spacing|left|justify-content|initial|inherit|ime-mode|image-orientation|image-resolution|image-rendering|icon|hyphens|height|font-weight|font-variant-ligatures|font-variant|font-style|font-stretch|font-size-adjust|font-size|font-language-override|font-kerning|font-feature-settings|font-family|font|float|flex-wrap|flex-shrink|flex-grow|flex-flow|flex-direction|flex-basis|flex|filter|empty-cells|display|direction|cursor|counter-reset|counter-increment|content|column-width|column-span|column-rule-width|column-rule-style|column-rule-color|column-rule|column-gap|column-fill|column-count|columns|color|clip-path|clip|clear|caption-side|break-inside|break-before|break-after|box-sizing|box-shadow|box-decoration-break|bottom|border-width|border-top-width|border-top-style|border-top-right-radius|border-top-left-radius|border-top-color|border-top|border-style|border-spacing|border-right-width|border-right-style|border-right-color|border-right|border-radius|border-left-width|border-left-style|border-left-color|border-left|border-image-width|border-image-source|border-image-slice|border-image-repeat|border-image-outset|border-image|border-color|border-collapse|border-bottom-width|border-bottom-style|border-bottom-right-radius|border-bottom-left-radius|border-bottom-color|border-bottom|border|background-size|background-repeat|background-position|background-origin|background-image|background-color|background-clip|background-attachment|background-blend-mode|background|backface-visibility|auto|animation-timing-function|animation-play-state|animation-name|animation-iteration-count|animation-fill-mode|animation-duration|animation-direction|animation-delay|animation|align-self|align-items|align-content)\\b',
            illegal: '[^\\s]'
          }, {
            className: 'value',
            begin: '\\b(whitespace|wait|w-resize|visible|vertical-text|vertical-ideographic|uppercase|upper-roman|upper-alpha|underline|transparent|top|thin|thick|text|text-top|text-bottom|tb-rl|table-header-group|table-footer-group|sw-resize|super|strict|static|square|solid|small-caps|separate|se-resize|scroll|s-resize|rtl|row-resize|ridge|right|repeat|repeat-y|repeat-x|relative|progress|pointer|overline|outside|outset|oblique|nowrap|not-allowed|normal|none|nw-resize|no-repeat|no-drop|newspaper|ne-resize|n-resize|move|middle|medium|ltr|lr-tb|lowercase|lower-roman|lower-alpha|loose|list-item|line|line-through|line-edge|lighter|left|keep-all|justify|italic|inter-word|inter-ideograph|inside|inset|inline|inline-block|inherit|inactive|ideograph-space|ideograph-parenthesis|ideograph-numeric|ideograph-alpha|horizontal|hidden|help|hand|groove|fixed|ellipsis|e-resize|double|dotted|distribute|distribute-space|distribute-letter|distribute-all-lines|disc|disabled|default|decimal|dashed|crosshair|collapse|col-resize|circle|char|center|capitalize|break-word|break-all|bottom|both|bolder|bold|block|bidi-override|below|baseline|auto|always|all-scroll|absolute|table|table-cell)\\b'
          }, {
            className: 'value',
            begin: ':',
            end: ';',
            contains: [FUNCTION, VARIABLE, HEXCOLOR, hljs.CSS_NUMBER_MODE, hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, {
              className: 'important',
              begin: '!important'
            }]
          }, {
            className: 'at_rule',
            begin: '@',
            end: '[{;]',
            keywords: 'mixin include extend for if else each while charset import debug media page content font-face namespace warn',
            contains: [FUNCTION, VARIABLE, hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, HEXCOLOR, hljs.CSS_NUMBER_MODE, {
              className: 'preprocessor',
              begin: '\\s[A-Za-z0-9_.-]+',
              relevance: 0
            }]
          }]
        };
      };
    }, {}],
    107: [function(require, module, exports) {
      module.exports = function(hljs) {
        var smali_instr_low_prio = ['add', 'and', 'cmp', 'cmpg', 'cmpl', 'const', 'div', 'double', 'float', 'goto', 'if', 'int', 'long', 'move', 'mul', 'neg', 'new', 'nop', 'not', 'or', 'rem', 'return', 'shl', 'shr', 'sput', 'sub', 'throw', 'ushr', 'xor'];
        var smali_instr_high_prio = ['aget', 'aput', 'array', 'check', 'execute', 'fill', 'filled', 'goto/16', 'goto/32', 'iget', 'instance', 'invoke', 'iput', 'monitor', 'packed', 'sget', 'sparse'];
        var smali_keywords = ['transient', 'constructor', 'abstract', 'final', 'synthetic', 'public', 'private', 'protected', 'static', 'bridge', 'system'];
        return {
          aliases: ['smali'],
          contains: [{
            className: 'string',
            begin: '"',
            end: '"',
            relevance: 0
          }, hljs.COMMENT('#', '$', {relevance: 0}), {
            className: 'keyword',
            begin: '\\s*\\.end\\s[a-zA-Z0-9]*',
            relevance: 1
          }, {
            className: 'keyword',
            begin: '^[ ]*\\.[a-zA-Z]*',
            relevance: 0
          }, {
            className: 'keyword',
            begin: '\\s:[a-zA-Z_0-9]*',
            relevance: 0
          }, {
            className: 'keyword',
            begin: '\\s(' + smali_keywords.join('|') + ')',
            relevance: 1
          }, {
            className: 'keyword',
            begin: '\\[',
            relevance: 0
          }, {
            className: 'instruction',
            begin: '\\s(' + smali_instr_low_prio.join('|') + ')\\s',
            relevance: 1
          }, {
            className: 'instruction',
            begin: '\\s(' + smali_instr_low_prio.join('|') + ')((\\-|/)[a-zA-Z0-9]+)+\\s',
            relevance: 10
          }, {
            className: 'instruction',
            begin: '\\s(' + smali_instr_high_prio.join('|') + ')((\\-|/)[a-zA-Z0-9]+)*\\s',
            relevance: 10
          }, {
            className: 'class',
            begin: 'L[^\(;:\n]*;',
            relevance: 0
          }, {
            className: 'function',
            begin: '( |->)[^(\n ;"]*\\(',
            relevance: 0
          }, {
            className: 'function',
            begin: '\\)',
            relevance: 0
          }, {
            className: 'variable',
            begin: '[vp][0-9]+',
            relevance: 0
          }]
        };
      };
    }, {}],
    108: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VAR_IDENT_RE = '[a-z][a-zA-Z0-9_]*';
        var CHAR = {
          className: 'char',
          begin: '\\$.{1}'
        };
        var SYMBOL = {
          className: 'symbol',
          begin: '#' + hljs.UNDERSCORE_IDENT_RE
        };
        return {
          aliases: ['st'],
          keywords: 'self super nil true false thisContext',
          contains: [hljs.COMMENT('"', '"'), hljs.APOS_STRING_MODE, {
            className: 'class',
            begin: '\\b[A-Z][A-Za-z0-9_]*',
            relevance: 0
          }, {
            className: 'method',
            begin: VAR_IDENT_RE + ':',
            relevance: 0
          }, hljs.C_NUMBER_MODE, SYMBOL, CHAR, {
            className: 'localvars',
            begin: '\\|[ ]*' + VAR_IDENT_RE + '([ ]+' + VAR_IDENT_RE + ')*[ ]*\\|',
            returnBegin: true,
            end: /\|/,
            illegal: /\S/,
            contains: [{begin: '(\\|[ ]*)?' + VAR_IDENT_RE}]
          }, {
            className: 'array',
            begin: '\\#\\(',
            end: '\\)',
            contains: [hljs.APOS_STRING_MODE, CHAR, hljs.C_NUMBER_MODE, SYMBOL]
          }]
        };
      };
    }, {}],
    109: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['ml'],
          keywords: {
            keyword: 'abstype and andalso as case datatype do else end eqtype ' + 'exception fn fun functor handle if in include infix infixr ' + 'let local nonfix of op open orelse raise rec sharing sig ' + 'signature struct structure then type val with withtype where while',
            built_in: 'array bool char exn int list option order real ref string substring vector unit word',
            literal: 'true false NONE SOME LESS EQUAL GREATER nil'
          },
          illegal: /\/\/|>>/,
          lexemes: '[a-z_]\\w*!?',
          contains: [{
            className: 'literal',
            begin: '\\[(\\|\\|)?\\]|\\(\\)'
          }, hljs.COMMENT('\\(\\*', '\\*\\)', {contains: ['self']}), {
            className: 'symbol',
            begin: '\'[A-Za-z_](?!\')[\\w\']*'
          }, {
            className: 'tag',
            begin: '`[A-Z][\\w\']*'
          }, {
            className: 'type',
            begin: '\\b[A-Z][\\w\']*',
            relevance: 0
          }, {begin: '[a-z_]\\w*\'[\\w\']*'}, hljs.inherit(hljs.APOS_STRING_MODE, {
            className: 'char',
            relevance: 0
          }), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), {
            className: 'number',
            begin: '\\b(0[xX][a-fA-F0-9_]+[Lln]?|' + '0[oO][0-7_]+[Lln]?|' + '0[bB][01_]+[Lln]?|' + '[0-9][0-9_]*([Lln]|(\\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)',
            relevance: 0
          }, {begin: /[-=]>/}]
        };
      };
    }, {}],
    110: [function(require, module, exports) {
      module.exports = function(hljs) {
        var COMMENT_MODE = hljs.COMMENT('--', '$');
        return {
          case_insensitive: true,
          illegal: /[<>]/,
          contains: [{
            className: 'operator',
            beginKeywords: 'begin end start commit rollback savepoint lock alter create drop rename call ' + 'delete do handler insert load replace select truncate update set show pragma grant ' + 'merge describe use explain help declare prepare execute deallocate savepoint release ' + 'unlock purge reset change stop analyze cache flush optimize repair kill ' + 'install uninstall checksum restore check backup revoke',
            end: /;/,
            endsWithParent: true,
            keywords: {
              keyword: 'abs absolute acos action add adddate addtime aes_decrypt aes_encrypt after aggregate all allocate alter ' + 'analyze and any are as asc ascii asin assertion at atan atan2 atn2 authorization authors avg backup ' + 'before begin benchmark between bin binlog bit_and bit_count bit_length bit_or bit_xor both by ' + 'cache call cascade cascaded case cast catalog ceil ceiling chain change changed char_length ' + 'character_length charindex charset check checksum checksum_agg choose close coalesce ' + 'coercibility collate collation collationproperty column columns columns_updated commit compress concat ' + 'concat_ws concurrent connect connection connection_id consistent constraint constraints continue ' + 'contributors conv convert convert_tz corresponding cos cot count count_big crc32 create cross cume_dist ' + 'curdate current current_date current_time current_timestamp current_user cursor curtime data database ' + 'databases datalength date_add date_format date_sub dateadd datediff datefromparts datename ' + 'datepart datetime2fromparts datetimeoffsetfromparts day dayname dayofmonth dayofweek dayofyear ' + 'deallocate declare decode default deferrable deferred degrees delayed delete des_decrypt ' + 'des_encrypt des_key_file desc describe descriptor diagnostics difference disconnect distinct ' + 'distinctrow div do domain double drop dumpfile each else elt enclosed encode encrypt end end-exec ' + 'engine engines eomonth errors escape escaped event eventdata events except exception exec execute ' + 'exists exp explain export_set extended external extract fast fetch field fields find_in_set ' + 'first first_value floor flush for force foreign format found found_rows from from_base64 ' + 'from_days from_unixtime full function get get_format get_lock getdate getutcdate global go goto grant ' + 'grants greatest group group_concat grouping grouping_id gtid_subset gtid_subtract handler having help ' + 'hex high_priority hosts hour ident_current ident_incr ident_seed identified identity if ifnull ignore ' + 'iif ilike immediate in index indicator inet6_aton inet6_ntoa inet_aton inet_ntoa infile initially inner ' + 'innodb input insert install instr intersect into is is_free_lock is_ipv4 ' + 'is_ipv4_compat is_ipv4_mapped is_not is_not_null is_used_lock isdate isnull isolation join key kill ' + 'language last last_day last_insert_id last_value lcase lead leading least leaves left len lenght level ' + 'like limit lines ln load load_file local localtime localtimestamp locate lock log log10 log2 logfile ' + 'logs low_priority lower lpad ltrim make_set makedate maketime master master_pos_wait match matched max ' + 'md5 medium merge microsecond mid min minute mod mode module month monthname mutex name_const names ' + 'national natural nchar next no no_write_to_binlog not now nullif nvarchar oct ' + 'octet_length of old_password on only open optimize option optionally or ord order outer outfile output ' + 'pad parse partial partition password patindex percent_rank percentile_cont percentile_disc period_add ' + 'period_diff pi plugin position pow power pragma precision prepare preserve primary prior privileges ' + 'procedure procedure_analyze processlist profile profiles public publishingservername purge quarter ' + 'query quick quote quotename radians rand read references regexp relative relaylog release ' + 'release_lock rename repair repeat replace replicate reset restore restrict return returns reverse ' + 'revoke right rlike rollback rollup round row row_count rows rpad rtrim savepoint schema scroll ' + 'sec_to_time second section select serializable server session session_user set sha sha1 sha2 share ' + 'show sign sin size slave sleep smalldatetimefromparts snapshot some soname soundex ' + 'sounds_like space sql sql_big_result sql_buffer_result sql_cache sql_calc_found_rows sql_no_cache ' + 'sql_small_result sql_variant_property sqlstate sqrt square start starting status std ' + 'stddev stddev_pop stddev_samp stdev stdevp stop str str_to_date straight_join strcmp string stuff ' + 'subdate substr substring subtime subtring_index sum switchoffset sysdate sysdatetime sysdatetimeoffset ' + 'system_user sysutcdatetime table tables tablespace tan temporary terminated tertiary_weights then time ' + 'time_format time_to_sec timediff timefromparts timestamp timestampadd timestampdiff timezone_hour ' + 'timezone_minute to to_base64 to_days to_seconds todatetimeoffset trailing transaction translation ' + 'trigger trigger_nestlevel triggers trim truncate try_cast try_convert try_parse ucase uncompress ' + 'uncompressed_length unhex unicode uninstall union unique unix_timestamp unknown unlock update upgrade ' + 'upped upper usage use user user_resources using utc_date utc_time utc_timestamp uuid uuid_short ' + 'validate_password_strength value values var var_pop var_samp variables variance varp ' + 'version view warnings week weekday weekofyear weight_string when whenever where with work write xml ' + 'xor year yearweek zon',
              literal: 'true false null',
              built_in: 'array bigint binary bit blob boolean char character date dec decimal float int integer interval number ' + 'numeric real serial smallint varchar varying int8 serial8 text'
            },
            contains: [{
              className: 'string',
              begin: '\'',
              end: '\'',
              contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}]
            }, {
              className: 'string',
              begin: '"',
              end: '"',
              contains: [hljs.BACKSLASH_ESCAPE, {begin: '""'}]
            }, {
              className: 'string',
              begin: '`',
              end: '`',
              contains: [hljs.BACKSLASH_ESCAPE]
            }, hljs.C_NUMBER_MODE, hljs.C_BLOCK_COMMENT_MODE, COMMENT_MODE]
          }, hljs.C_BLOCK_COMMENT_MODE, COMMENT_MODE]
        };
      };
    }, {}],
    111: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['do', 'ado'],
          case_insensitive: true,
          keywords: 'if else in foreach for forv forva forval forvalu forvalue forvalues by bys bysort xi quietly qui capture about ac ac_7 acprplot acprplot_7 adjust ado adopath adoupdate alpha ameans an ano anov anova anova_estat anova_terms anovadef aorder ap app appe appen append arch arch_dr arch_estat arch_p archlm areg areg_p args arima arima_dr arima_estat arima_p as asmprobit asmprobit_estat asmprobit_lf asmprobit_mfx__dlg asmprobit_p ass asse asser assert avplot avplot_7 avplots avplots_7 bcskew0 bgodfrey binreg bip0_lf biplot bipp_lf bipr_lf bipr_p biprobit bitest bitesti bitowt blogit bmemsize boot bootsamp bootstrap bootstrap_8 boxco_l boxco_p boxcox boxcox_6 boxcox_p bprobit br break brier bro brow brows browse brr brrstat bs bs_7 bsampl_w bsample bsample_7 bsqreg bstat bstat_7 bstat_8 bstrap bstrap_7 ca ca_estat ca_p cabiplot camat canon canon_8 canon_8_p canon_estat canon_p cap caprojection capt captu captur capture cat cc cchart cchart_7 cci cd censobs_table centile cf char chdir checkdlgfiles checkestimationsample checkhlpfiles checksum chelp ci cii cl class classutil clear cli clis clist clo clog clog_lf clog_p clogi clogi_sw clogit clogit_lf clogit_p clogitp clogl_sw cloglog clonevar clslistarray cluster cluster_measures cluster_stop cluster_tree cluster_tree_8 clustermat cmdlog cnr cnre cnreg cnreg_p cnreg_sw cnsreg codebook collaps4 collapse colormult_nb colormult_nw compare compress conf confi confir confirm conren cons const constr constra constrai constrain constraint continue contract copy copyright copysource cor corc corr corr2data corr_anti corr_kmo corr_smc corre correl correla correlat correlate corrgram cou coun count cox cox_p cox_sw coxbase coxhaz coxvar cprplot cprplot_7 crc cret cretu cretur creturn cross cs cscript cscript_log csi ct ct_is ctset ctst_5 ctst_st cttost cumsp cumsp_7 cumul cusum cusum_7 cutil d datasig datasign datasigna datasignat datasignatu datasignatur datasignature datetof db dbeta de dec deco decod decode deff des desc descr descri describ describe destring dfbeta dfgls dfuller di di_g dir dirstats dis discard disp disp_res disp_s displ displa display distinct do doe doed doedi doedit dotplot dotplot_7 dprobit drawnorm drop ds ds_util dstdize duplicates durbina dwstat dydx e ed edi edit egen eivreg emdef en enc enco encod encode eq erase ereg ereg_lf ereg_p ereg_sw ereghet ereghet_glf ereghet_glf_sh ereghet_gp ereghet_ilf ereghet_ilf_sh ereghet_ip eret eretu eretur ereturn err erro error est est_cfexist est_cfname est_clickable est_expand est_hold est_table est_unhold est_unholdok estat estat_default estat_summ estat_vce_only esti estimates etodow etof etomdy ex exi exit expand expandcl fac fact facto factor factor_estat factor_p factor_pca_rotated factor_rotate factormat fcast fcast_compute fcast_graph fdades fdadesc fdadescr fdadescri fdadescrib fdadescribe fdasav fdasave fdause fh_st file open file read file close file filefilter fillin find_hlp_file findfile findit findit_7 fit fl fli flis flist for5_0 form forma format fpredict frac_154 frac_adj frac_chk frac_cox frac_ddp frac_dis frac_dv frac_in frac_mun frac_pp frac_pq frac_pv frac_wgt frac_xo fracgen fracplot fracplot_7 fracpoly fracpred fron_ex fron_hn fron_p fron_tn fron_tn2 frontier ftodate ftoe ftomdy ftowdate g gamhet_glf gamhet_gp gamhet_ilf gamhet_ip gamma gamma_d2 gamma_p gamma_sw gammahet gdi_hexagon gdi_spokes ge gen gene gener genera generat generate genrank genstd genvmean gettoken gl gladder gladder_7 glim_l01 glim_l02 glim_l03 glim_l04 glim_l05 glim_l06 glim_l07 glim_l08 glim_l09 glim_l10 glim_l11 glim_l12 glim_lf glim_mu glim_nw1 glim_nw2 glim_nw3 glim_p glim_v1 glim_v2 glim_v3 glim_v4 glim_v5 glim_v6 glim_v7 glm glm_6 glm_p glm_sw glmpred glo glob globa global glogit glogit_8 glogit_p gmeans gnbre_lf gnbreg gnbreg_5 gnbreg_p gomp_lf gompe_sw gomper_p gompertz gompertzhet gomphet_glf gomphet_glf_sh gomphet_gp gomphet_ilf gomphet_ilf_sh gomphet_ip gphdot gphpen gphprint gprefs gprobi_p gprobit gprobit_8 gr gr7 gr_copy gr_current gr_db gr_describe gr_dir gr_draw gr_draw_replay gr_drop gr_edit gr_editviewopts gr_example gr_example2 gr_export gr_print gr_qscheme gr_query gr_read gr_rename gr_replay gr_save gr_set gr_setscheme gr_table gr_undo gr_use graph graph7 grebar greigen greigen_7 greigen_8 grmeanby grmeanby_7 gs_fileinfo gs_filetype gs_graphinfo gs_stat gsort gwood h hadimvo hareg hausman haver he heck_d2 heckma_p heckman heckp_lf heckpr_p heckprob hel help hereg hetpr_lf hetpr_p hetprob hettest hexdump hilite hist hist_7 histogram hlogit hlu hmeans hotel hotelling hprobit hreg hsearch icd9 icd9_ff icd9p iis impute imtest inbase include inf infi infil infile infix inp inpu input ins insheet insp inspe inspec inspect integ inten intreg intreg_7 intreg_p intrg2_ll intrg_ll intrg_ll2 ipolate iqreg ir irf irf_create irfm iri is_svy is_svysum isid istdize ivprob_1_lf ivprob_lf ivprobit ivprobit_p ivreg ivreg_footnote ivtob_1_lf ivtob_lf ivtobit ivtobit_p jackknife jacknife jknife jknife_6 jknife_8 jkstat joinby kalarma1 kap kap_3 kapmeier kappa kapwgt kdensity kdensity_7 keep ksm ksmirnov ktau kwallis l la lab labe label labelbook ladder levels levelsof leverage lfit lfit_p li lincom line linktest lis list lloghet_glf lloghet_glf_sh lloghet_gp lloghet_ilf lloghet_ilf_sh lloghet_ip llogi_sw llogis_p llogist llogistic llogistichet lnorm_lf lnorm_sw lnorma_p lnormal lnormalhet lnormhet_glf lnormhet_glf_sh lnormhet_gp lnormhet_ilf lnormhet_ilf_sh lnormhet_ip lnskew0 loadingplot loc loca local log logi logis_lf logistic logistic_p logit logit_estat logit_p loglogs logrank loneway lookfor lookup lowess lowess_7 lpredict lrecomp lroc lroc_7 lrtest ls lsens lsens_7 lsens_x lstat ltable ltable_7 ltriang lv lvr2plot lvr2plot_7 m ma mac macr macro makecns man manova manova_estat manova_p manovatest mantel mark markin markout marksample mat mat_capp mat_order mat_put_rr mat_rapp mata mata_clear mata_describe mata_drop mata_matdescribe mata_matsave mata_matuse mata_memory mata_mlib mata_mosave mata_rename mata_which matalabel matcproc matlist matname matr matri matrix matrix_input__dlg matstrik mcc mcci md0_ md1_ md1debug_ md2_ md2debug_ mds mds_estat mds_p mdsconfig mdslong mdsmat mdsshepard mdytoe mdytof me_derd mean means median memory memsize meqparse mer merg merge mfp mfx mhelp mhodds minbound mixed_ll mixed_ll_reparm mkassert mkdir mkmat mkspline ml ml_5 ml_adjs ml_bhhhs ml_c_d ml_check ml_clear ml_cnt ml_debug ml_defd ml_e0 ml_e0_bfgs ml_e0_cycle ml_e0_dfp ml_e0i ml_e1 ml_e1_bfgs ml_e1_bhhh ml_e1_cycle ml_e1_dfp ml_e2 ml_e2_cycle ml_ebfg0 ml_ebfr0 ml_ebfr1 ml_ebh0q ml_ebhh0 ml_ebhr0 ml_ebr0i ml_ecr0i ml_edfp0 ml_edfr0 ml_edfr1 ml_edr0i ml_eds ml_eer0i ml_egr0i ml_elf ml_elf_bfgs ml_elf_bhhh ml_elf_cycle ml_elf_dfp ml_elfi ml_elfs ml_enr0i ml_enrr0 ml_erdu0 ml_erdu0_bfgs ml_erdu0_bhhh ml_erdu0_bhhhq ml_erdu0_cycle ml_erdu0_dfp ml_erdu0_nrbfgs ml_exde ml_footnote ml_geqnr ml_grad0 ml_graph ml_hbhhh ml_hd0 ml_hold ml_init ml_inv ml_log ml_max ml_mlout ml_mlout_8 ml_model ml_nb0 ml_opt ml_p ml_plot ml_query ml_rdgrd ml_repor ml_s_e ml_score ml_searc ml_technique ml_unhold mleval mlf_ mlmatbysum mlmatsum mlog mlogi mlogit mlogit_footnote mlogit_p mlopts mlsum mlvecsum mnl0_ mor more mov move mprobit mprobit_lf mprobit_p mrdu0_ mrdu1_ mvdecode mvencode mvreg mvreg_estat n nbreg nbreg_al nbreg_lf nbreg_p nbreg_sw nestreg net newey newey_7 newey_p news nl nl_7 nl_9 nl_9_p nl_p nl_p_7 nlcom nlcom_p nlexp2 nlexp2_7 nlexp2a nlexp2a_7 nlexp3 nlexp3_7 nlgom3 nlgom3_7 nlgom4 nlgom4_7 nlinit nllog3 nllog3_7 nllog4 nllog4_7 nlog_rd nlogit nlogit_p nlogitgen nlogittree nlpred no nobreak noi nois noisi noisil noisily note notes notes_dlg nptrend numlabel numlist odbc old_ver olo olog ologi ologi_sw ologit ologit_p ologitp on one onew onewa oneway op_colnm op_comp op_diff op_inv op_str opr opro oprob oprob_sw oprobi oprobi_p oprobit oprobitp opts_exclusive order orthog orthpoly ou out outf outfi outfil outfile outs outsh outshe outshee outsheet ovtest pac pac_7 palette parse parse_dissim pause pca pca_8 pca_display pca_estat pca_p pca_rotate pcamat pchart pchart_7 pchi pchi_7 pcorr pctile pentium pergram pergram_7 permute permute_8 personal peto_st pkcollapse pkcross pkequiv pkexamine pkexamine_7 pkshape pksumm pksumm_7 pl plo plot plugin pnorm pnorm_7 poisgof poiss_lf poiss_sw poisso_p poisson poisson_estat post postclose postfile postutil pperron pr prais prais_e prais_e2 prais_p predict predictnl preserve print pro prob probi probit probit_estat probit_p proc_time procoverlay procrustes procrustes_estat procrustes_p profiler prog progr progra program prop proportion prtest prtesti pwcorr pwd q\\s qby qbys qchi qchi_7 qladder qladder_7 qnorm qnorm_7 qqplot qqplot_7 qreg qreg_c qreg_p qreg_sw qu quadchk quantile quantile_7 que quer query range ranksum ratio rchart rchart_7 rcof recast reclink recode reg reg3 reg3_p regdw regr regre regre_p2 regres regres_p regress regress_estat regriv_p remap ren rena renam rename renpfix repeat replace report reshape restore ret retu retur return rm rmdir robvar roccomp roccomp_7 roccomp_8 rocf_lf rocfit rocfit_8 rocgold rocplot rocplot_7 roctab roctab_7 rolling rologit rologit_p rot rota rotat rotate rotatemat rreg rreg_p ru run runtest rvfplot rvfplot_7 rvpplot rvpplot_7 sa safesum sample sampsi sav save savedresults saveold sc sca scal scala scalar scatter scm_mine sco scob_lf scob_p scobi_sw scobit scor score scoreplot scoreplot_help scree screeplot screeplot_help sdtest sdtesti se search separate seperate serrbar serrbar_7 serset set set_defaults sfrancia sh she shel shell shewhart shewhart_7 signestimationsample signrank signtest simul simul_7 simulate simulate_8 sktest sleep slogit slogit_d2 slogit_p smooth snapspan so sor sort spearman spikeplot spikeplot_7 spikeplt spline_x split sqreg sqreg_p sret sretu sretur sreturn ssc st st_ct st_hc st_hcd st_hcd_sh st_is st_issys st_note st_promo st_set st_show st_smpl st_subid stack statsby statsby_8 stbase stci stci_7 stcox stcox_estat stcox_fr stcox_fr_ll stcox_p stcox_sw stcoxkm stcoxkm_7 stcstat stcurv stcurve stcurve_7 stdes stem stepwise stereg stfill stgen stir stjoin stmc stmh stphplot stphplot_7 stphtest stphtest_7 stptime strate strate_7 streg streg_sw streset sts sts_7 stset stsplit stsum sttocc sttoct stvary stweib su suest suest_8 sum summ summa summar summari summariz summarize sunflower sureg survcurv survsum svar svar_p svmat svy svy_disp svy_dreg svy_est svy_est_7 svy_estat svy_get svy_gnbreg_p svy_head svy_header svy_heckman_p svy_heckprob_p svy_intreg_p svy_ivreg_p svy_logistic_p svy_logit_p svy_mlogit_p svy_nbreg_p svy_ologit_p svy_oprobit_p svy_poisson_p svy_probit_p svy_regress_p svy_sub svy_sub_7 svy_x svy_x_7 svy_x_p svydes svydes_8 svygen svygnbreg svyheckman svyheckprob svyintreg svyintreg_7 svyintrg svyivreg svylc svylog_p svylogit svymarkout svymarkout_8 svymean svymlog svymlogit svynbreg svyolog svyologit svyoprob svyoprobit svyopts svypois svypois_7 svypoisson svyprobit svyprobt svyprop svyprop_7 svyratio svyreg svyreg_p svyregress svyset svyset_7 svyset_8 svytab svytab_7 svytest svytotal sw sw_8 swcnreg swcox swereg swilk swlogis swlogit swologit swoprbt swpois swprobit swqreg swtobit swweib symmetry symmi symplot symplot_7 syntax sysdescribe sysdir sysuse szroeter ta tab tab1 tab2 tab_or tabd tabdi tabdis tabdisp tabi table tabodds tabodds_7 tabstat tabu tabul tabula tabulat tabulate te tempfile tempname tempvar tes test testnl testparm teststd tetrachoric time_it timer tis tob tobi tobit tobit_p tobit_sw token tokeni tokeniz tokenize tostring total translate translator transmap treat_ll treatr_p treatreg trim trnb_cons trnb_mean trpoiss_d2 trunc_ll truncr_p truncreg tsappend tset tsfill tsline tsline_ex tsreport tsrevar tsrline tsset tssmooth tsunab ttest ttesti tut_chk tut_wait tutorial tw tware_st two twoway twoway__fpfit_serset twoway__function_gen twoway__histogram_gen twoway__ipoint_serset twoway__ipoints_serset twoway__kdensity_gen twoway__lfit_serset twoway__normgen_gen twoway__pci_serset twoway__qfit_serset twoway__scatteri_serset twoway__sunflower_gen twoway_ksm_serset ty typ type typeof u unab unabbrev unabcmd update us use uselabel var var_mkcompanion var_p varbasic varfcast vargranger varirf varirf_add varirf_cgraph varirf_create varirf_ctable varirf_describe varirf_dir varirf_drop varirf_erase varirf_graph varirf_ograph varirf_rename varirf_set varirf_table varlist varlmar varnorm varsoc varstable varstable_w varstable_w2 varwle vce vec vec_fevd vec_mkphi vec_p vec_p_w vecirf_create veclmar veclmar_w vecnorm vecnorm_w vecrank vecstable verinst vers versi versio version view viewsource vif vwls wdatetof webdescribe webseek webuse weib1_lf weib2_lf weib_lf weib_lf0 weibhet_glf weibhet_glf_sh weibhet_glfa weibhet_glfa_sh weibhet_gp weibhet_ilf weibhet_ilf_sh weibhet_ilfa weibhet_ilfa_sh weibhet_ip weibu_sw weibul_p weibull weibull_c weibull_s weibullhet wh whelp whi which whil while wilc_st wilcoxon win wind windo window winexec wntestb wntestb_7 wntestq xchart xchart_7 xcorr xcorr_7 xi xi_6 xmlsav xmlsave xmluse xpose xsh xshe xshel xshell xt_iis xt_tis xtab_p xtabond xtbin_p xtclog xtcloglog xtcloglog_8 xtcloglog_d2 xtcloglog_pa_p xtcloglog_re_p xtcnt_p xtcorr xtdata xtdes xtfront_p xtfrontier xtgee xtgee_elink xtgee_estat xtgee_makeivar xtgee_p xtgee_plink xtgls xtgls_p xthaus xthausman xtht_p xthtaylor xtile xtint_p xtintreg xtintreg_8 xtintreg_d2 xtintreg_p xtivp_1 xtivp_2 xtivreg xtline xtline_ex xtlogit xtlogit_8 xtlogit_d2 xtlogit_fe_p xtlogit_pa_p xtlogit_re_p xtmixed xtmixed_estat xtmixed_p xtnb_fe xtnb_lf xtnbreg xtnbreg_pa_p xtnbreg_refe_p xtpcse xtpcse_p xtpois xtpoisson xtpoisson_d2 xtpoisson_pa_p xtpoisson_refe_p xtpred xtprobit xtprobit_8 xtprobit_d2 xtprobit_re_p xtps_fe xtps_lf xtps_ren xtps_ren_8 xtrar_p xtrc xtrc_p xtrchh xtrefe_p xtreg xtreg_be xtreg_fe xtreg_ml xtreg_pa_p xtreg_re xtregar xtrere_p xtset xtsf_ll xtsf_llti xtsum xttab xttest0 xttobit xttobit_8 xttobit_p xttrans yx yxview__barlike_draw yxview_area_draw yxview_bar_draw yxview_dot_draw yxview_dropline_draw yxview_function_draw yxview_iarrow_draw yxview_ilabels_draw yxview_normal_draw yxview_pcarrow_draw yxview_pcbarrow_draw yxview_pccapsym_draw yxview_pcscatter_draw yxview_pcspike_draw yxview_rarea_draw yxview_rbar_draw yxview_rbarm_draw yxview_rcap_draw yxview_rcapsym_draw yxview_rconnected_draw yxview_rline_draw yxview_rscatter_draw yxview_rspike_draw yxview_spike_draw yxview_sunflower_draw zap_s zinb zinb_llf zinb_plf zip zip_llf zip_p zip_plf zt_ct_5 zt_hc_5 zt_hcd_5 zt_is_5 zt_iss_5 zt_sho_5 zt_smp_5 ztbase_5 ztcox_5 ztdes_5 ztereg_5 ztfill_5 ztgen_5 ztir_5 ztjoin_5 ztnb ztnb_p ztp ztp_p zts_5 ztset_5 ztspli_5 ztsum_5 zttoct_5 ztvary_5 ztweib_5',
          contains: [{
            className: 'label',
            variants: [{begin: "\\$\\{?[a-zA-Z0-9_]+\\}?"}, {begin: "`[a-zA-Z0-9_]+'"}]
          }, {
            className: 'string',
            variants: [{begin: '`"[^\r\n]*?"\''}, {begin: '"[^\r\n"]*"'}]
          }, {
            className: 'literal',
            variants: [{begin: '\\b(abs|acos|asin|atan|atan2|atanh|ceil|cloglog|comb|cos|digamma|exp|floor|invcloglog|invlogit|ln|lnfact|lnfactorial|lngamma|log|log10|max|min|mod|reldif|round|sign|sin|sqrt|sum|tan|tanh|trigamma|trunc|betaden|Binomial|binorm|binormal|chi2|chi2tail|dgammapda|dgammapdada|dgammapdadx|dgammapdx|dgammapdxdx|F|Fden|Ftail|gammaden|gammap|ibeta|invbinomial|invchi2|invchi2tail|invF|invFtail|invgammap|invibeta|invnchi2|invnFtail|invnibeta|invnorm|invnormal|invttail|nbetaden|nchi2|nFden|nFtail|nibeta|norm|normal|normalden|normd|npnchi2|tden|ttail|uniform|abbrev|char|index|indexnot|length|lower|ltrim|match|plural|proper|real|regexm|regexr|regexs|reverse|rtrim|string|strlen|strlower|strltrim|strmatch|strofreal|strpos|strproper|strreverse|strrtrim|strtrim|strupper|subinstr|subinword|substr|trim|upper|word|wordcount|_caller|autocode|byteorder|chop|clip|cond|e|epsdouble|epsfloat|group|inlist|inrange|irecode|matrix|maxbyte|maxdouble|maxfloat|maxint|maxlong|mi|minbyte|mindouble|minfloat|minint|minlong|missing|r|recode|replay|return|s|scalar|d|date|day|dow|doy|halfyear|mdy|month|quarter|week|year|d|daily|dofd|dofh|dofm|dofq|dofw|dofy|h|halfyearly|hofd|m|mofd|monthly|q|qofd|quarterly|tin|twithin|w|weekly|wofd|y|yearly|yh|ym|yofd|yq|yw|cholesky|colnumb|colsof|corr|det|diag|diag0cnt|el|get|hadamard|I|inv|invsym|issym|issymmetric|J|matmissing|matuniform|mreldif|nullmat|rownumb|rowsof|sweep|syminv|trace|vec|vecdiag)(?=\\(|$)'}]
          }, hljs.COMMENT('^[ \t]*\\*.*$', false), hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE]
        };
      };
    }, {}],
    112: [function(require, module, exports) {
      module.exports = function(hljs) {
        var STEP21_IDENT_RE = '[A-Z_][A-Z0-9_.]*';
        var STEP21_CLOSE_RE = 'END-ISO-10303-21;';
        var STEP21_KEYWORDS = {
          literal: '',
          built_in: '',
          keyword: 'HEADER ENDSEC DATA'
        };
        var STEP21_START = {
          className: 'preprocessor',
          begin: 'ISO-10303-21;',
          relevance: 10
        };
        var STEP21_CODE = [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.COMMENT('/\\*\\*!', '\\*/'), hljs.C_NUMBER_MODE, hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}), {
          className: 'string',
          begin: "'",
          end: "'"
        }, {
          className: 'label',
          variants: [{
            begin: '#',
            end: '\\d+',
            illegal: '\\W'
          }]
        }];
        return {
          aliases: ['p21', 'step', 'stp'],
          case_insensitive: true,
          lexemes: STEP21_IDENT_RE,
          keywords: STEP21_KEYWORDS,
          contains: [{
            className: 'preprocessor',
            begin: STEP21_CLOSE_RE,
            relevance: 10
          }, STEP21_START].concat(STEP21_CODE)
        };
      };
    }, {}],
    113: [function(require, module, exports) {
      module.exports = function(hljs) {
        var VARIABLE = {
          className: 'variable',
          begin: '\\$' + hljs.IDENT_RE
        };
        var HEX_COLOR = {
          className: 'hexcolor',
          begin: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})',
          relevance: 10
        };
        var AT_KEYWORDS = ['charset', 'css', 'debug', 'extend', 'font-face', 'for', 'import', 'include', 'media', 'mixin', 'page', 'warn', 'while'];
        var PSEUDO_SELECTORS = ['after', 'before', 'first-letter', 'first-line', 'active', 'first-child', 'focus', 'hover', 'lang', 'link', 'visited'];
        var TAGS = ['a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote', 'body', 'button', 'canvas', 'caption', 'cite', 'code', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'mark', 'menu', 'nav', 'object', 'ol', 'p', 'q', 'quote', 'samp', 'section', 'span', 'strong', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'ul', 'var', 'video'];
        var TAG_END = '[\\.\\s\\n\\[\\:,]';
        var ATTRIBUTES = ['align-content', 'align-items', 'align-self', 'animation', 'animation-delay', 'animation-direction', 'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name', 'animation-play-state', 'animation-timing-function', 'auto', 'backface-visibility', 'background', 'background-attachment', 'background-clip', 'background-color', 'background-image', 'background-origin', 'background-position', 'background-repeat', 'background-size', 'border', 'border-bottom', 'border-bottom-color', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width', 'border-collapse', 'border-color', 'border-image', 'border-image-outset', 'border-image-repeat', 'border-image-slice', 'border-image-source', 'border-image-width', 'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-radius', 'border-right', 'border-right-color', 'border-right-style', 'border-right-width', 'border-spacing', 'border-style', 'border-top', 'border-top-color', 'border-top-left-radius', 'border-top-right-radius', 'border-top-style', 'border-top-width', 'border-width', 'bottom', 'box-decoration-break', 'box-shadow', 'box-sizing', 'break-after', 'break-before', 'break-inside', 'caption-side', 'clear', 'clip', 'clip-path', 'color', 'column-count', 'column-fill', 'column-gap', 'column-rule', 'column-rule-color', 'column-rule-style', 'column-rule-width', 'column-span', 'column-width', 'columns', 'content', 'counter-increment', 'counter-reset', 'cursor', 'direction', 'display', 'empty-cells', 'filter', 'flex', 'flex-basis', 'flex-direction', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap', 'float', 'font', 'font-family', 'font-feature-settings', 'font-kerning', 'font-language-override', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-variant-ligatures', 'font-weight', 'height', 'hyphens', 'icon', 'image-orientation', 'image-rendering', 'image-resolution', 'ime-mode', 'inherit', 'initial', 'justify-content', 'left', 'letter-spacing', 'line-height', 'list-style', 'list-style-image', 'list-style-position', 'list-style-type', 'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'marks', 'mask', 'max-height', 'max-width', 'min-height', 'min-width', 'nav-down', 'nav-index', 'nav-left', 'nav-right', 'nav-up', 'none', 'normal', 'object-fit', 'object-position', 'opacity', 'order', 'orphans', 'outline', 'outline-color', 'outline-offset', 'outline-style', 'outline-width', 'overflow', 'overflow-wrap', 'overflow-x', 'overflow-y', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'page-break-after', 'page-break-before', 'page-break-inside', 'perspective', 'perspective-origin', 'pointer-events', 'position', 'quotes', 'resize', 'right', 'tab-size', 'table-layout', 'text-align', 'text-align-last', 'text-decoration', 'text-decoration-color', 'text-decoration-line', 'text-decoration-style', 'text-indent', 'text-overflow', 'text-rendering', 'text-shadow', 'text-transform', 'text-underline-position', 'top', 'transform', 'transform-origin', 'transform-style', 'transition', 'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function', 'unicode-bidi', 'vertical-align', 'visibility', 'white-space', 'widows', 'width', 'word-break', 'word-spacing', 'word-wrap', 'z-index'];
        var ILLEGAL = ['\\{', '\\}', '\\?', '(\\bReturn\\b)', '(\\bEnd\\b)', '(\\bend\\b)', ';', '#\\s', '\\*\\s', '===\\s', '\\|', '%'];
        return {
          aliases: ['styl'],
          case_insensitive: false,
          illegal: '(' + ILLEGAL.join('|') + ')',
          keywords: 'if else for in',
          contains: [hljs.QUOTE_STRING_MODE, hljs.APOS_STRING_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, HEX_COLOR, {
            begin: '\\.[a-zA-Z][a-zA-Z0-9_-]*' + TAG_END,
            returnBegin: true,
            contains: [{
              className: 'class',
              begin: '\\.[a-zA-Z][a-zA-Z0-9_-]*'
            }]
          }, {
            begin: '\\#[a-zA-Z][a-zA-Z0-9_-]*' + TAG_END,
            returnBegin: true,
            contains: [{
              className: 'id',
              begin: '\\#[a-zA-Z][a-zA-Z0-9_-]*'
            }]
          }, {
            begin: '\\b(' + TAGS.join('|') + ')' + TAG_END,
            returnBegin: true,
            contains: [{
              className: 'tag',
              begin: '\\b[a-zA-Z][a-zA-Z0-9_-]*'
            }]
          }, {
            className: 'pseudo',
            begin: '&?:?:\\b(' + PSEUDO_SELECTORS.join('|') + ')' + TAG_END
          }, {
            className: 'at_rule',
            begin: '\@(' + AT_KEYWORDS.join('|') + ')\\b'
          }, VARIABLE, hljs.CSS_NUMBER_MODE, hljs.NUMBER_MODE, {
            className: 'function',
            begin: '\\b[a-zA-Z][a-zA-Z0-9_\-]*\\(.*\\)',
            illegal: '[\\n]',
            returnBegin: true,
            contains: [{
              className: 'title',
              begin: '\\b[a-zA-Z][a-zA-Z0-9_\-]*'
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              contains: [HEX_COLOR, VARIABLE, hljs.APOS_STRING_MODE, hljs.CSS_NUMBER_MODE, hljs.NUMBER_MODE, hljs.QUOTE_STRING_MODE]
            }]
          }, {
            className: 'attribute',
            begin: '\\b(' + ATTRIBUTES.reverse().join('|') + ')\\b'
          }]
        };
      };
    }, {}],
    114: [function(require, module, exports) {
      module.exports = function(hljs) {
        var SWIFT_KEYWORDS = {
          keyword: 'class deinit enum extension func import init let protocol static ' + 'struct subscript typealias var break case continue default do ' + 'else fallthrough if in for return switch where while as dynamicType ' + 'is new super self Self Type __COLUMN__ __FILE__ __FUNCTION__ ' + '__LINE__ associativity didSet get infix inout left mutating none ' + 'nonmutating operator override postfix precedence prefix right set ' + 'unowned unowned safe unsafe weak willSet',
          literal: 'true false nil',
          built_in: 'abs advance alignof alignofValue assert bridgeFromObjectiveC ' + 'bridgeFromObjectiveCUnconditional bridgeToObjectiveC ' + 'bridgeToObjectiveCUnconditional c contains count countElements ' + 'countLeadingZeros debugPrint debugPrintln distance dropFirst dropLast dump ' + 'encodeBitsAsWords enumerate equal filter find getBridgedObjectiveCType ' + 'getVaList indices insertionSort isBridgedToObjectiveC ' + 'isBridgedVerbatimToObjectiveC isUniquelyReferenced join ' + 'lexicographicalCompare map max maxElement min minElement numericCast ' + 'partition posix print println quickSort reduce reflect reinterpretCast ' + 'reverse roundUpToAlignment sizeof sizeofValue sort split startsWith strideof ' + 'strideofValue swap swift toString transcode underestimateCount ' + 'unsafeReflect withExtendedLifetime withObjectAtPlusZero withUnsafePointer ' + 'withUnsafePointerToObject withUnsafePointers withVaList'
        };
        var TYPE = {
          className: 'type',
          begin: '\\b[A-Z][\\w\']*',
          relevance: 0
        };
        var BLOCK_COMMENT = hljs.COMMENT('/\\*', '\\*/', {contains: ['self']});
        var SUBST = {
          className: 'subst',
          begin: /\\\(/,
          end: '\\)',
          keywords: SWIFT_KEYWORDS,
          contains: []
        };
        var NUMBERS = {
          className: 'number',
          begin: '\\b([\\d_]+(\\.[\\deE_]+)?|0x[a-fA-F0-9_]+(\\.[a-fA-F0-9p_]+)?|0b[01_]+|0o[0-7_]+)\\b',
          relevance: 0
        };
        var QUOTE_STRING_MODE = hljs.inherit(hljs.QUOTE_STRING_MODE, {contains: [SUBST, hljs.BACKSLASH_ESCAPE]});
        SUBST.contains = [NUMBERS];
        return {
          keywords: SWIFT_KEYWORDS,
          contains: [QUOTE_STRING_MODE, hljs.C_LINE_COMMENT_MODE, BLOCK_COMMENT, TYPE, NUMBERS, {
            className: 'func',
            beginKeywords: 'func',
            end: '{',
            excludeEnd: true,
            contains: [hljs.inherit(hljs.TITLE_MODE, {
              begin: /[A-Za-z$_][0-9A-Za-z$_]*/,
              illegal: /\(/
            }), {
              className: 'generics',
              begin: /</,
              end: />/,
              illegal: />/
            }, {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              endsParent: true,
              keywords: SWIFT_KEYWORDS,
              contains: ['self', NUMBERS, QUOTE_STRING_MODE, hljs.C_BLOCK_COMMENT_MODE, {begin: ':'}],
              illegal: /["']/
            }],
            illegal: /\[|%/
          }, {
            className: 'class',
            beginKeywords: 'struct protocol class extension enum',
            keywords: SWIFT_KEYWORDS,
            end: '\\{',
            excludeEnd: true,
            contains: [hljs.inherit(hljs.TITLE_MODE, {begin: /[A-Za-z$_][0-9A-Za-z$_]*/})]
          }, {
            className: 'preprocessor',
            begin: '(@assignment|@class_protocol|@exported|@final|@lazy|@noreturn|' + '@NSCopying|@NSManaged|@objc|@optional|@required|@auto_closure|' + '@noreturn|@IBAction|@IBDesignable|@IBInspectable|@IBOutlet|' + '@infix|@prefix|@postfix)'
          }]
        };
      };
    }, {}],
    115: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['tk'],
          keywords: 'after append apply array auto_execok auto_import auto_load auto_mkindex ' + 'auto_mkindex_old auto_qualify auto_reset bgerror binary break catch cd chan clock ' + 'close concat continue dde dict encoding eof error eval exec exit expr fblocked ' + 'fconfigure fcopy file fileevent filename flush for foreach format gets glob global ' + 'history http if incr info interp join lappend|10 lassign|10 lindex|10 linsert|10 list ' + 'llength|10 load lrange|10 lrepeat|10 lreplace|10 lreverse|10 lsearch|10 lset|10 lsort|10 ' + 'mathfunc mathop memory msgcat namespace open package parray pid pkg::create pkg_mkIndex ' + 'platform platform::shell proc puts pwd read refchan regexp registry regsub|10 rename ' + 'return safe scan seek set socket source split string subst switch tcl_endOfWord ' + 'tcl_findLibrary tcl_startOfNextWord tcl_startOfPreviousWord tcl_wordBreakAfter ' + 'tcl_wordBreakBefore tcltest tclvars tell time tm trace unknown unload unset update ' + 'uplevel upvar variable vwait while',
          contains: [hljs.COMMENT(';[ \\t]*#', '$'), hljs.COMMENT('^[ \\t]*#', '$'), {
            beginKeywords: 'proc',
            end: '[\\{]',
            excludeEnd: true,
            contains: [{
              className: 'symbol',
              begin: '[ \\t\\n\\r]+(::)?[a-zA-Z_]((::)?[a-zA-Z0-9_])*',
              end: '[ \\t\\n\\r]',
              endsWithParent: true,
              excludeEnd: true
            }]
          }, {
            className: 'variable',
            excludeEnd: true,
            variants: [{
              begin: '\\$(\\{)?(::)?[a-zA-Z_]((::)?[a-zA-Z0-9_])*\\(([a-zA-Z0-9_])*\\)',
              end: '[^a-zA-Z0-9_\\}\\$]'
            }, {
              begin: '\\$(\\{)?(::)?[a-zA-Z_]((::)?[a-zA-Z0-9_])*',
              end: '(\\))?[^a-zA-Z0-9_\\}\\$]'
            }]
          }, {
            className: 'string',
            contains: [hljs.BACKSLASH_ESCAPE],
            variants: [hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}), hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null})]
          }, {
            className: 'number',
            variants: [hljs.BINARY_NUMBER_MODE, hljs.C_NUMBER_MODE]
          }]
        };
      };
    }, {}],
    116: [function(require, module, exports) {
      module.exports = function(hljs) {
        var COMMAND1 = {
          className: 'command',
          begin: '\\\\[a-zA-Zа-яА-я]+[\\*]?'
        };
        var COMMAND2 = {
          className: 'command',
          begin: '\\\\[^a-zA-Zа-яА-я0-9]'
        };
        var SPECIAL = {
          className: 'special',
          begin: '[{}\\[\\]\\&#~]',
          relevance: 0
        };
        return {contains: [{
            begin: '\\\\[a-zA-Zа-яА-я]+[\\*]? *= *-?\\d*\\.?\\d+(pt|pc|mm|cm|in|dd|cc|ex|em)?',
            returnBegin: true,
            contains: [COMMAND1, COMMAND2, {
              className: 'number',
              begin: ' *=',
              end: '-?\\d*\\.?\\d+(pt|pc|mm|cm|in|dd|cc|ex|em)?',
              excludeBegin: true
            }],
            relevance: 10
          }, COMMAND1, COMMAND2, SPECIAL, {
            className: 'formula',
            begin: '\\$\\$',
            end: '\\$\\$',
            contains: [COMMAND1, COMMAND2, SPECIAL],
            relevance: 0
          }, {
            className: 'formula',
            begin: '\\$',
            end: '\\$',
            contains: [COMMAND1, COMMAND2, SPECIAL],
            relevance: 0
          }, hljs.COMMENT('%', '$', {relevance: 0})]};
      };
    }, {}],
    117: [function(require, module, exports) {
      module.exports = function(hljs) {
        var BUILT_IN_TYPES = 'bool byte i16 i32 i64 double string binary';
        return {
          keywords: {
            keyword: 'namespace const typedef struct enum service exception void oneway set list map required optional',
            built_in: BUILT_IN_TYPES,
            literal: 'true false'
          },
          contains: [hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'class',
            beginKeywords: 'struct enum service exception',
            end: /\{/,
            illegal: /\n/,
            contains: [hljs.inherit(hljs.TITLE_MODE, {starts: {
                endsWithParent: true,
                excludeEnd: true
              }})]
          }, {
            begin: '\\b(set|list|map)\\s*<',
            end: '>',
            keywords: BUILT_IN_TYPES,
            contains: ['self']
          }]
        };
      };
    }, {}],
    118: [function(require, module, exports) {
      module.exports = function(hljs) {
        var TPID = {
          className: 'number',
          begin: '[1-9][0-9]*',
          relevance: 0
        };
        var TPLABEL = {
          className: 'comment',
          begin: ':[^\\]]+'
        };
        var TPDATA = {
          className: 'built_in',
          begin: '(AR|P|PAYLOAD|PR|R|SR|RSR|LBL|VR|UALM|MESSAGE|UTOOL|UFRAME|TIMER|\
    TIMER_OVERFLOW|JOINT_MAX_SPEED|RESUME_PROG|DIAG_REC)\\[',
          end: '\\]',
          contains: ['self', TPID, TPLABEL]
        };
        var TPIO = {
          className: 'built_in',
          begin: '(AI|AO|DI|DO|F|RI|RO|UI|UO|GI|GO|SI|SO)\\[',
          end: '\\]',
          contains: ['self', TPID, hljs.QUOTE_STRING_MODE, TPLABEL]
        };
        return {
          keywords: {
            keyword: 'ABORT ACC ADJUST AND AP_LD BREAK CALL CNT COL CONDITION CONFIG DA DB ' + 'DIV DETECT ELSE END ENDFOR ERR_NUM ERROR_PROG FINE FOR GP GUARD INC ' + 'IF JMP LINEAR_MAX_SPEED LOCK MOD MONITOR OFFSET Offset OR OVERRIDE ' + 'PAUSE PREG PTH RT_LD RUN SELECT SKIP Skip TA TB TO TOOL_OFFSET ' + 'Tool_Offset UF UT UFRAME_NUM UTOOL_NUM UNLOCK WAIT X Y Z W P R STRLEN ' + 'SUBSTR FINDSTR VOFFSET',
            constant: 'ON OFF max_speed LPOS JPOS ENABLE DISABLE START STOP RESET'
          },
          contains: [TPDATA, TPIO, {
            className: 'keyword',
            begin: '/(PROG|ATTR|MN|POS|END)\\b'
          }, {
            className: 'keyword',
            begin: '(CALL|RUN|POINT_LOGIC|LBL)\\b'
          }, {
            className: 'keyword',
            begin: '\\b(ACC|CNT|Skip|Offset|PSPD|RT_LD|AP_LD|Tool_Offset)'
          }, {
            className: 'number',
            begin: '\\d+(sec|msec|mm/sec|cm/min|inch/min|deg/sec|mm|in|cm)?\\b',
            relevance: 0
          }, hljs.COMMENT('//', '[;$]'), hljs.COMMENT('!', '[;$]'), hljs.COMMENT('--eg:', '$'), hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '\'',
            end: '\''
          }, hljs.C_NUMBER_MODE, {
            className: 'variable',
            begin: '\\$[A-Za-z0-9_]+'
          }]
        };
      };
    }, {}],
    119: [function(require, module, exports) {
      module.exports = function(hljs) {
        var PARAMS = {
          className: 'params',
          begin: '\\(',
          end: '\\)'
        };
        var FUNCTION_NAMES = 'attribute block constant cycle date dump include ' + 'max min parent random range source template_from_string';
        var FUNCTIONS = {
          className: 'function',
          beginKeywords: FUNCTION_NAMES,
          relevance: 0,
          contains: [PARAMS]
        };
        var FILTER = {
          className: 'filter',
          begin: /\|[A-Za-z_]+:?/,
          keywords: 'abs batch capitalize convert_encoding date date_modify default ' + 'escape first format join json_encode keys last length lower ' + 'merge nl2br number_format raw replace reverse round slice sort split ' + 'striptags title trim upper url_encode',
          contains: [FUNCTIONS]
        };
        var TAGS = 'autoescape block do embed extends filter flush for ' + 'if import include macro sandbox set spaceless use verbatim';
        TAGS = TAGS + ' ' + TAGS.split(' ').map(function(t) {
          return 'end' + t;
        }).join(' ');
        return {
          aliases: ['craftcms'],
          case_insensitive: true,
          subLanguage: 'xml',
          subLanguageMode: 'continuous',
          contains: [hljs.COMMENT(/\{#/, /#}/), {
            className: 'template_tag',
            begin: /\{%/,
            end: /%}/,
            keywords: TAGS,
            contains: [FILTER, FUNCTIONS]
          }, {
            className: 'variable',
            begin: /\{\{/,
            end: /}}/,
            contains: [FILTER, FUNCTIONS]
          }]
        };
      };
    }, {}],
    120: [function(require, module, exports) {
      module.exports = function(hljs) {
        var KEYWORDS = {
          keyword: 'in if for while finally var new function|0 do return void else break catch ' + 'instanceof with throw case default try this switch continue typeof delete ' + 'let yield const class public private get set super interface extends' + 'static constructor implements enum export import declare type protected',
          literal: 'true false null undefined NaN Infinity',
          built_in: 'eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent ' + 'encodeURI encodeURIComponent escape unescape Object Function Boolean Error ' + 'EvalError InternalError RangeError ReferenceError StopIteration SyntaxError ' + 'TypeError URIError Number Math Date String RegExp Array Float32Array ' + 'Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array ' + 'Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require ' + 'module console window document any number boolean string void'
        };
        return {
          aliases: ['ts'],
          keywords: KEYWORDS,
          contains: [{
            className: 'pi',
            begin: /^\s*['"]use strict['"]/,
            relevance: 0
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'number',
            variants: [{begin: '\\b(0[bB][01]+)'}, {begin: '\\b(0[oO][0-7]+)'}, {begin: hljs.C_NUMBER_RE}],
            relevance: 0
          }, {
            begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
            keywords: 'return throw case',
            contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, hljs.REGEXP_MODE, {
              begin: /</,
              end: />;/,
              relevance: 0,
              subLanguage: 'xml'
            }],
            relevance: 0
          }, {
            className: 'function',
            begin: 'function',
            end: /[\{;]/,
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: ['self', hljs.inherit(hljs.TITLE_MODE, {begin: /[A-Za-z$_][0-9A-Za-z$_]*/}), {
              className: 'params',
              begin: /\(/,
              end: /\)/,
              excludeBegin: true,
              excludeEnd: true,
              keywords: KEYWORDS,
              contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE],
              illegal: /["'\(]/
            }],
            illegal: /\[|%/,
            relevance: 0
          }, {
            className: 'constructor',
            begin: 'constructor',
            end: /\{/,
            excludeEnd: true,
            keywords: KEYWORDS,
            relevance: 10
          }, {
            className: 'module',
            beginKeywords: 'module',
            end: /\{/,
            excludeEnd: true
          }, {
            className: 'interface',
            beginKeywords: 'interface',
            end: /\{/,
            excludeEnd: true
          }, {begin: /\$[(.]/}, {
            begin: '\\.' + hljs.IDENT_RE,
            relevance: 0
          }]
        };
      };
    }, {}],
    121: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          keywords: {
            keyword: 'char uchar unichar int uint long ulong short ushort int8 int16 int32 int64 uint8 ' + 'uint16 uint32 uint64 float double bool struct enum string void ' + 'weak unowned owned ' + 'async signal static abstract interface override ' + 'while do for foreach else switch case break default return try catch ' + 'public private protected internal ' + 'using new this get set const stdout stdin stderr var',
            built_in: 'DBus GLib CCode Gee Object',
            literal: 'false true null'
          },
          contains: [{
            className: 'class',
            beginKeywords: 'class interface delegate namespace',
            end: '{',
            excludeEnd: true,
            illegal: '[^,:\\n\\s\\.]',
            contains: [hljs.UNDERSCORE_TITLE_MODE]
          }, hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, {
            className: 'string',
            begin: '"""',
            end: '"""',
            relevance: 5
          }, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, hljs.C_NUMBER_MODE, {
            className: 'preprocessor',
            begin: '^#',
            end: '$',
            relevance: 2
          }, {
            className: 'constant',
            begin: ' [A-Z_]+ ',
            relevance: 0
          }]
        };
      };
    }, {}],
    122: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['vb'],
          case_insensitive: true,
          keywords: {
            keyword: 'addhandler addressof alias and andalso aggregate ansi as assembly auto binary by byref byval ' + 'call case catch class compare const continue custom declare default delegate dim distinct do ' + 'each equals else elseif end enum erase error event exit explicit finally for friend from function ' + 'get global goto group handles if implements imports in inherits interface into is isfalse isnot istrue ' + 'join key let lib like loop me mid mod module mustinherit mustoverride mybase myclass ' + 'namespace narrowing new next not notinheritable notoverridable ' + 'of off on operator option optional or order orelse overloads overridable overrides ' + 'paramarray partial preserve private property protected public ' + 'raiseevent readonly redim rem removehandler resume return ' + 'select set shadows shared skip static step stop structure strict sub synclock ' + 'take text then throw to try unicode until using when where while widening with withevents writeonly xor',
            built_in: 'boolean byte cbool cbyte cchar cdate cdec cdbl char cint clng cobj csbyte cshort csng cstr ctype ' + 'date decimal directcast double gettype getxmlnamespace iif integer long object ' + 'sbyte short single string trycast typeof uinteger ulong ushort',
            literal: 'true false nothing'
          },
          illegal: '//|{|}|endif|gosub|variant|wend',
          contains: [hljs.inherit(hljs.QUOTE_STRING_MODE, {contains: [{begin: '""'}]}), hljs.COMMENT('\'', '$', {
            returnBegin: true,
            contains: [{
              className: 'xmlDocTag',
              begin: '\'\'\'|<!--|-->',
              contains: [hljs.PHRASAL_WORDS_MODE]
            }, {
              className: 'xmlDocTag',
              begin: '</?',
              end: '>',
              contains: [hljs.PHRASAL_WORDS_MODE]
            }]
          }), hljs.C_NUMBER_MODE, {
            className: 'preprocessor',
            begin: '#',
            end: '$',
            keywords: 'if else elseif end region externalsource'
          }]
        };
      };
    }, {}],
    123: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          subLanguage: 'xml',
          subLanguageMode: 'continuous',
          contains: [{
            begin: '<%',
            end: '%>',
            subLanguage: 'vbscript'
          }]
        };
      };
    }, {}],
    124: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['vbs'],
          case_insensitive: true,
          keywords: {
            keyword: 'call class const dim do loop erase execute executeglobal exit for each next function ' + 'if then else on error option explicit new private property let get public randomize ' + 'redim rem select case set stop sub while wend with end to elseif is or xor and not ' + 'class_initialize class_terminate default preserve in me byval byref step resume goto',
            built_in: 'lcase month vartype instrrev ubound setlocale getobject rgb getref string ' + 'weekdayname rnd dateadd monthname now day minute isarray cbool round formatcurrency ' + 'conversions csng timevalue second year space abs clng timeserial fixs len asc ' + 'isempty maths dateserial atn timer isobject filter weekday datevalue ccur isdate ' + 'instr datediff formatdatetime replace isnull right sgn array snumeric log cdbl hex ' + 'chr lbound msgbox ucase getlocale cos cdate cbyte rtrim join hour oct typename trim ' + 'strcomp int createobject loadpicture tan formatnumber mid scriptenginebuildversion ' + 'scriptengine split scriptengineminorversion cint sin datepart ltrim sqr ' + 'scriptenginemajorversion time derived eval date formatpercent exp inputbox left ascw ' + 'chrw regexp server response request cstr err',
            literal: 'true false null nothing empty'
          },
          illegal: '//',
          contains: [hljs.inherit(hljs.QUOTE_STRING_MODE, {contains: [{begin: '""'}]}), hljs.COMMENT(/'/, /$/, {relevance: 0}), hljs.C_NUMBER_MODE]
        };
      };
    }, {}],
    125: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          aliases: ['v'],
          case_insensitive: true,
          keywords: {
            keyword: 'always and assign begin buf bufif0 bufif1 case casex casez cmos deassign ' + 'default defparam disable edge else end endcase endfunction endmodule ' + 'endprimitive endspecify endtable endtask event for force forever fork ' + 'function if ifnone initial inout input join macromodule module nand ' + 'negedge nmos nor not notif0 notif1 or output parameter pmos posedge ' + 'primitive pulldown pullup rcmos release repeat rnmos rpmos rtran ' + 'rtranif0 rtranif1 specify specparam table task timescale tran ' + 'tranif0 tranif1 wait while xnor xor',
            typename: 'highz0 highz1 integer large medium pull0 pull1 real realtime reg ' + 'scalared signed small strong0 strong1 supply0 supply0 supply1 supply1 ' + 'time tri tri0 tri1 triand trior trireg vectored wand weak0 weak1 wire wor'
          },
          contains: [hljs.C_BLOCK_COMMENT_MODE, hljs.C_LINE_COMMENT_MODE, hljs.QUOTE_STRING_MODE, {
            className: 'number',
            begin: '\\b(\\d+\'(b|h|o|d|B|H|O|D))?[0-9xzXZ]+',
            contains: [hljs.BACKSLASH_ESCAPE],
            relevance: 0
          }, {
            className: 'typename',
            begin: '\\.\\w+',
            relevance: 0
          }, {
            className: 'value',
            begin: '#\\((?!parameter).+\\)'
          }, {
            className: 'keyword',
            begin: '\\+|-|\\*|/|%|<|>|=|#|`|\\!|&|\\||@|:|\\^|~|\\{|\\}',
            relevance: 0
          }]
        };
      };
    }, {}],
    126: [function(require, module, exports) {
      module.exports = function(hljs) {
        var INTEGER_RE = '\\d(_|\\d)*';
        var EXPONENT_RE = '[eE][-+]?' + INTEGER_RE;
        var DECIMAL_LITERAL_RE = INTEGER_RE + '(\\.' + INTEGER_RE + ')?' + '(' + EXPONENT_RE + ')?';
        var BASED_INTEGER_RE = '\\w+';
        var BASED_LITERAL_RE = INTEGER_RE + '#' + BASED_INTEGER_RE + '(\\.' + BASED_INTEGER_RE + ')?' + '#' + '(' + EXPONENT_RE + ')?';
        var NUMBER_RE = '\\b(' + BASED_LITERAL_RE + '|' + DECIMAL_LITERAL_RE + ')';
        return {
          case_insensitive: true,
          keywords: {
            keyword: 'abs access after alias all and architecture array assert attribute begin block ' + 'body buffer bus case component configuration constant context cover disconnect ' + 'downto default else elsif end entity exit fairness file for force function generate ' + 'generic group guarded if impure in inertial inout is label library linkage literal ' + 'loop map mod nand new next nor not null of on open or others out package port ' + 'postponed procedure process property protected pure range record register reject ' + 'release rem report restrict restrict_guarantee return rol ror select sequence ' + 'severity shared signal sla sll sra srl strong subtype then to transport type ' + 'unaffected units until use variable vmode vprop vunit wait when while with xnor xor',
            typename: 'boolean bit character severity_level integer time delay_length natural positive ' + 'string bit_vector file_open_kind file_open_status std_ulogic std_ulogic_vector ' + 'std_logic std_logic_vector unsigned signed boolean_vector integer_vector ' + 'real_vector time_vector'
          },
          illegal: '{',
          contains: [hljs.C_BLOCK_COMMENT_MODE, hljs.COMMENT('--', '$'), hljs.QUOTE_STRING_MODE, {
            className: 'number',
            begin: NUMBER_RE,
            relevance: 0
          }, {
            className: 'literal',
            begin: '\'(U|X|0|1|Z|W|L|H|-)\'',
            contains: [hljs.BACKSLASH_ESCAPE]
          }, {
            className: 'attribute',
            begin: '\'[A-Za-z](_?[A-Za-z0-9])*',
            contains: [hljs.BACKSLASH_ESCAPE]
          }]
        };
      };
    }, {}],
    127: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          lexemes: /[!#@\w]+/,
          keywords: {
            keyword: 'N|0 P|0 X|0 a|0 ab abc abo al am an|0 ar arga argd arge argdo argg argl argu as au aug aun b|0 bN ba bad bd be bel bf bl bm bn bo bp br brea breaka breakd breakl bro bufdo buffers bun bw c|0 cN cNf ca cabc caddb cad caddf cal cat cb cc ccl cd ce cex cf cfir cgetb cgete cg changes chd che checkt cl cla clo cm cmapc cme cn cnew cnf cno cnorea cnoreme co col colo com comc comp con conf cope ' + 'cp cpf cq cr cs cst cu cuna cunme cw d|0 delm deb debugg delc delf dif diffg diffo diffp diffpu diffs diffthis dig di dl dell dj dli do doautoa dp dr ds dsp e|0 ea ec echoe echoh echom echon el elsei em en endfo endf endt endw ene ex exe exi exu f|0 files filet fin fina fini fir fix fo foldc foldd folddoc foldo for fu g|0 go gr grepa gu gv ha h|0 helpf helpg helpt hi hid his i|0 ia iabc if ij il im imapc ' + 'ime ino inorea inoreme int is isp iu iuna iunme j|0 ju k|0 keepa kee keepj lN lNf l|0 lad laddb laddf la lan lat lb lc lch lcl lcs le lefta let lex lf lfir lgetb lgete lg lgr lgrepa lh ll lla lli lmak lm lmapc lne lnew lnf ln loadk lo loc lockv lol lope lp lpf lr ls lt lu lua luad luaf lv lvimgrepa lw m|0 ma mak map mapc marks mat me menut mes mk mks mksp mkv mkvie mod mz mzf nbc nb nbs n|0 new nm nmapc nme nn nnoreme noa no noh norea noreme norm nu nun nunme ol o|0 om omapc ome on ono onoreme opt ou ounme ow p|0 ' + 'profd prof pro promptr pc ped pe perld po popu pp pre prev ps pt ptN ptf ptj ptl ptn ptp ptr pts pu pw py3 python3 py3d py3f py pyd pyf q|0 quita qa r|0 rec red redi redr redraws reg res ret retu rew ri rightb rub rubyd rubyf rund ru rv s|0 sN san sa sal sav sb sbN sba sbf sbl sbm sbn sbp sbr scrip scripte scs se setf setg setl sf sfir sh sim sig sil sl sla sm smap smapc sme sn sni sno snor snoreme sor ' + 'so spelld spe spelli spellr spellu spellw sp spr sre st sta startg startr star stopi stj sts sun sunm sunme sus sv sw sy synti sync t|0 tN tabN tabc tabdo tabe tabf tabfir tabl tabm tabnew ' + 'tabn tabo tabp tabr tabs tab ta tags tc tcld tclf te tf th tj tl tm tn to tp tr try ts tu u|0 undoj undol una unh unl unlo unm unme uns up v|0 ve verb vert vim vimgrepa vi viu vie vm vmapc vme vne vn vnoreme vs vu vunme windo w|0 wN wa wh wi winc winp wn wp wq wqa ws wu wv x|0 xa xmapc xm xme xn xnoreme xu xunme y|0 z|0 ~ ' + 'Next Print append abbreviate abclear aboveleft all amenu anoremenu args argadd argdelete argedit argglobal arglocal argument ascii autocmd augroup aunmenu buffer bNext ball badd bdelete behave belowright bfirst blast bmodified bnext botright bprevious brewind break breakadd breakdel breaklist browse bunload ' + 'bwipeout change cNext cNfile cabbrev cabclear caddbuffer caddexpr caddfile call catch cbuffer cclose center cexpr cfile cfirst cgetbuffer cgetexpr cgetfile chdir checkpath checktime clist clast close cmap cmapclear cmenu cnext cnewer cnfile cnoremap cnoreabbrev cnoremenu copy colder colorscheme command comclear compiler continue confirm copen cprevious cpfile cquit crewind cscope cstag cunmap ' + 'cunabbrev cunmenu cwindow delete delmarks debug debuggreedy delcommand delfunction diffupdate diffget diffoff diffpatch diffput diffsplit digraphs display deletel djump dlist doautocmd doautoall deletep drop dsearch dsplit edit earlier echo echoerr echohl echomsg else elseif emenu endif endfor ' + 'endfunction endtry endwhile enew execute exit exusage file filetype find finally finish first fixdel fold foldclose folddoopen folddoclosed foldopen function global goto grep grepadd gui gvim hardcopy help helpfind helpgrep helptags highlight hide history insert iabbrev iabclear ijump ilist imap ' + 'imapclear imenu inoremap inoreabbrev inoremenu intro isearch isplit iunmap iunabbrev iunmenu join jumps keepalt keepmarks keepjumps lNext lNfile list laddexpr laddbuffer laddfile last language later lbuffer lcd lchdir lclose lcscope left leftabove lexpr lfile lfirst lgetbuffer lgetexpr lgetfile lgrep lgrepadd lhelpgrep llast llist lmake lmap lmapclear lnext lnewer lnfile lnoremap loadkeymap loadview ' + 'lockmarks lockvar lolder lopen lprevious lpfile lrewind ltag lunmap luado luafile lvimgrep lvimgrepadd lwindow move mark make mapclear match menu menutranslate messages mkexrc mksession mkspell mkvimrc mkview mode mzscheme mzfile nbclose nbkey nbsart next nmap nmapclear nmenu nnoremap ' + 'nnoremenu noautocmd noremap nohlsearch noreabbrev noremenu normal number nunmap nunmenu oldfiles open omap omapclear omenu only onoremap onoremenu options ounmap ounmenu ownsyntax print profdel profile promptfind promptrepl pclose pedit perl perldo pop popup ppop preserve previous psearch ptag ptNext ' + 'ptfirst ptjump ptlast ptnext ptprevious ptrewind ptselect put pwd py3do py3file python pydo pyfile quit quitall qall read recover redo redir redraw redrawstatus registers resize retab return rewind right rightbelow ruby rubydo rubyfile rundo runtime rviminfo substitute sNext sandbox sargument sall saveas sbuffer sbNext sball sbfirst sblast sbmodified sbnext sbprevious sbrewind scriptnames scriptencoding ' + 'scscope set setfiletype setglobal setlocal sfind sfirst shell simalt sign silent sleep slast smagic smapclear smenu snext sniff snomagic snoremap snoremenu sort source spelldump spellgood spellinfo spellrepall spellundo spellwrong split sprevious srewind stop stag startgreplace startreplace ' + 'startinsert stopinsert stjump stselect sunhide sunmap sunmenu suspend sview swapname syntax syntime syncbind tNext tabNext tabclose tabedit tabfind tabfirst tablast tabmove tabnext tabonly tabprevious tabrewind tag tcl tcldo tclfile tearoff tfirst throw tjump tlast tmenu tnext topleft tprevious ' + 'trewind tselect tunmenu undo undojoin undolist unabbreviate unhide unlet unlockvar unmap unmenu unsilent update vglobal version verbose vertical vimgrep vimgrepadd visual viusage view vmap vmapclear vmenu vnew ' + 'vnoremap vnoremenu vsplit vunmap vunmenu write wNext wall while winsize wincmd winpos wnext wprevious wqall wsverb wundo wviminfo xit xall xmapclear xmap xmenu xnoremap xnoremenu xunmap xunmenu yank',
            built_in: 'abs acos add and append argc argidx argv asin atan atan2 browse browsedir bufexists buflisted bufloaded bufname bufnr bufwinnr byte2line byteidx call ceil changenr char2nr cindent clearmatches col complete complete_add complete_check confirm copy cos cosh count cscope_connection cursor ' + 'deepcopy delete did_filetype diff_filler diff_hlID empty escape eval eventhandler executable exists exp expand extend feedkeys filereadable filewritable filter finddir findfile float2nr floor fmod fnameescape fnamemodify foldclosed foldclosedend foldlevel foldtext foldtextresult foreground function ' + 'garbagecollect get getbufline getbufvar getchar getcharmod getcmdline getcmdpos getcmdtype getcwd getfontname getfperm getfsize getftime getftype getline getloclist getmatches getpid getpos getqflist getreg getregtype gettabvar gettabwinvar getwinposx getwinposy getwinvar glob globpath has has_key ' + 'haslocaldir hasmapto histadd histdel histget histnr hlexists hlID hostname iconv indent index input inputdialog inputlist inputrestore inputsave inputsecret insert invert isdirectory islocked items join keys len libcall libcallnr line line2byte lispindent localtime log log10 luaeval map maparg mapcheck ' + 'match matchadd matcharg matchdelete matchend matchlist matchstr max min mkdir mode mzeval nextnonblank nr2char or pathshorten pow prevnonblank printf pumvisible py3eval pyeval range readfile reltime reltimestr remote_expr remote_foreground remote_peek remote_read remote_send remove rename repeat ' + 'resolve reverse round screenattr screenchar screencol screenrow search searchdecl searchpair searchpairpos searchpos server2client serverlist setbufvar setcmdpos setline setloclist setmatches setpos setqflist setreg settabvar settabwinvar setwinvar sha256 shellescape shiftwidth simplify sin ' + 'sinh sort soundfold spellbadword spellsuggest split sqrt str2float str2nr strchars strdisplaywidth strftime stridx string strlen strpart strridx strtrans strwidth submatch substitute synconcealed synID synIDattr ' + 'synIDtrans synstack system tabpagebuflist tabpagenr tabpagewinnr tagfiles taglist tan tanh tempname tolower toupper tr trunc type undofile undotree values virtcol visualmode wildmenumode winbufnr wincol winheight winline winnr winrestcmd winrestview winsaveview winwidth writefile xor'
          },
          illegal: /[{:]/,
          contains: [hljs.NUMBER_MODE, hljs.APOS_STRING_MODE, {
            className: 'string',
            begin: /"((\\")|[^"\n])*("|\n)/
          }, {
            className: 'variable',
            begin: /[bwtglsav]:[\w\d_]*/
          }, {
            className: 'function',
            beginKeywords: 'function function!',
            end: '$',
            relevance: 0,
            contains: [hljs.TITLE_MODE, {
              className: 'params',
              begin: '\\(',
              end: '\\)'
            }]
          }]
        };
      };
    }, {}],
    128: [function(require, module, exports) {
      module.exports = function(hljs) {
        return {
          case_insensitive: true,
          lexemes: '\\.?' + hljs.IDENT_RE,
          keywords: {
            keyword: 'lock rep repe repz repne repnz xaquire xrelease bnd nobnd ' + 'aaa aad aam aas adc add and arpl bb0_reset bb1_reset bound bsf bsr bswap bt btc btr bts call cbw cdq cdqe clc cld cli clts cmc cmp cmpsb cmpsd cmpsq cmpsw cmpxchg cmpxchg486 cmpxchg8b cmpxchg16b cpuid cpu_read cpu_write cqo cwd cwde daa das dec div dmint emms enter equ f2xm1 fabs fadd faddp fbld fbstp fchs fclex fcmovb fcmovbe fcmove fcmovnb fcmovnbe fcmovne fcmovnu fcmovu fcom fcomi fcomip fcomp fcompp fcos fdecstp fdisi fdiv fdivp fdivr fdivrp femms feni ffree ffreep fiadd ficom ficomp fidiv fidivr fild fimul fincstp finit fist fistp fisttp fisub fisubr fld fld1 fldcw fldenv fldl2e fldl2t fldlg2 fldln2 fldpi fldz fmul fmulp fnclex fndisi fneni fninit fnop fnsave fnstcw fnstenv fnstsw fpatan fprem fprem1 fptan frndint frstor fsave fscale fsetpm fsin fsincos fsqrt fst fstcw fstenv fstp fstsw fsub fsubp fsubr fsubrp ftst fucom fucomi fucomip fucomp fucompp fxam fxch fxtract fyl2x fyl2xp1 hlt ibts icebp idiv imul in inc incbin insb insd insw int int01 int1 int03 int3 into invd invpcid invlpg invlpga iret iretd iretq iretw jcxz jecxz jrcxz jmp jmpe lahf lar lds lea leave les lfence lfs lgdt lgs lidt lldt lmsw loadall loadall286 lodsb lodsd lodsq lodsw loop loope loopne loopnz loopz lsl lss ltr mfence monitor mov movd movq movsb movsd movsq movsw movsx movsxd movzx mul mwait neg nop not or out outsb outsd outsw packssdw packsswb packuswb paddb paddd paddsb paddsiw paddsw paddusb paddusw paddw pand pandn pause paveb pavgusb pcmpeqb pcmpeqd pcmpeqw pcmpgtb pcmpgtd pcmpgtw pdistib pf2id pfacc pfadd pfcmpeq pfcmpge pfcmpgt pfmax pfmin pfmul pfrcp pfrcpit1 pfrcpit2 pfrsqit1 pfrsqrt pfsub pfsubr pi2fd pmachriw pmaddwd pmagw pmulhriw pmulhrwa pmulhrwc pmulhw pmullw pmvgezb pmvlzb pmvnzb pmvzb pop popa popad popaw popf popfd popfq popfw por prefetch prefetchw pslld psllq psllw psrad psraw psrld psrlq psrlw psubb psubd psubsb psubsiw psubsw psubusb psubusw psubw punpckhbw punpckhdq punpckhwd punpcklbw punpckldq punpcklwd push pusha pushad pushaw pushf pushfd pushfq pushfw pxor rcl rcr rdshr rdmsr rdpmc rdtsc rdtscp ret retf retn rol ror rdm rsdc rsldt rsm rsts sahf sal salc sar sbb scasb scasd scasq scasw sfence sgdt shl shld shr shrd sidt sldt skinit smi smint smintold smsw stc std sti stosb stosd stosq stosw str sub svdc svldt svts swapgs syscall sysenter sysexit sysret test ud0 ud1 ud2b ud2 ud2a umov verr verw fwait wbinvd wrshr wrmsr xadd xbts xchg xlatb xlat xor cmove cmovz cmovne cmovnz cmova cmovnbe cmovae cmovnb cmovb cmovnae cmovbe cmovna cmovg cmovnle cmovge cmovnl cmovl cmovnge cmovle cmovng cmovc cmovnc cmovo cmovno cmovs cmovns cmovp cmovpe cmovnp cmovpo je jz jne jnz ja jnbe jae jnb jb jnae jbe jna jg jnle jge jnl jl jnge jle jng jc jnc jo jno js jns jpo jnp jpe jp sete setz setne setnz seta setnbe setae setnb setnc setb setnae setcset setbe setna setg setnle setge setnl setl setnge setle setng sets setns seto setno setpe setp setpo setnp addps addss andnps andps cmpeqps cmpeqss cmpleps cmpless cmpltps cmpltss cmpneqps cmpneqss cmpnleps cmpnless cmpnltps cmpnltss cmpordps cmpordss cmpunordps cmpunordss cmpps cmpss comiss cvtpi2ps cvtps2pi cvtsi2ss cvtss2si cvttps2pi cvttss2si divps divss ldmxcsr maxps maxss minps minss movaps movhps movlhps movlps movhlps movmskps movntps movss movups mulps mulss orps rcpps rcpss rsqrtps rsqrtss shufps sqrtps sqrtss stmxcsr subps subss ucomiss unpckhps unpcklps xorps fxrstor fxrstor64 fxsave fxsave64 xgetbv xsetbv xsave xsave64 xsaveopt xsaveopt64 xrstor xrstor64 prefetchnta prefetcht0 prefetcht1 prefetcht2 maskmovq movntq pavgb pavgw pextrw pinsrw pmaxsw pmaxub pminsw pminub pmovmskb pmulhuw psadbw pshufw pf2iw pfnacc pfpnacc pi2fw pswapd maskmovdqu clflush movntdq movnti movntpd movdqa movdqu movdq2q movq2dq paddq pmuludq pshufd pshufhw pshuflw pslldq psrldq psubq punpckhqdq punpcklqdq addpd addsd andnpd andpd cmpeqpd cmpeqsd cmplepd cmplesd cmpltpd cmpltsd cmpneqpd cmpneqsd cmpnlepd cmpnlesd cmpnltpd cmpnltsd cmpordpd cmpordsd cmpunordpd cmpunordsd cmppd comisd cvtdq2pd cvtdq2ps cvtpd2dq cvtpd2pi cvtpd2ps cvtpi2pd cvtps2dq cvtps2pd cvtsd2si cvtsd2ss cvtsi2sd cvtss2sd cvttpd2pi cvttpd2dq cvttps2dq cvttsd2si divpd divsd maxpd maxsd minpd minsd movapd movhpd movlpd movmskpd movupd mulpd mulsd orpd shufpd sqrtpd sqrtsd subpd subsd ucomisd unpckhpd unpcklpd xorpd addsubpd addsubps haddpd haddps hsubpd hsubps lddqu movddup movshdup movsldup clgi stgi vmcall vmclear vmfunc vmlaunch vmload vmmcall vmptrld vmptrst vmread vmresume vmrun vmsave vmwrite vmxoff vmxon invept invvpid pabsb pabsw pabsd palignr phaddw phaddd phaddsw phsubw phsubd phsubsw pmaddubsw pmulhrsw pshufb psignb psignw psignd extrq insertq movntsd movntss lzcnt blendpd blendps blendvpd blendvps dppd dpps extractps insertps movntdqa mpsadbw packusdw pblendvb pblendw pcmpeqq pextrb pextrd pextrq phminposuw pinsrb pinsrd pinsrq pmaxsb pmaxsd pmaxud pmaxuw pminsb pminsd pminud pminuw pmovsxbw pmovsxbd pmovsxbq pmovsxwd pmovsxwq pmovsxdq pmovzxbw pmovzxbd pmovzxbq pmovzxwd pmovzxwq pmovzxdq pmuldq pmulld ptest roundpd roundps roundsd roundss crc32 pcmpestri pcmpestrm pcmpistri pcmpistrm pcmpgtq popcnt getsec pfrcpv pfrsqrtv movbe aesenc aesenclast aesdec aesdeclast aesimc aeskeygenassist vaesenc vaesenclast vaesdec vaesdeclast vaesimc vaeskeygenassist vaddpd vaddps vaddsd vaddss vaddsubpd vaddsubps vandpd vandps vandnpd vandnps vblendpd vblendps vblendvpd vblendvps vbroadcastss vbroadcastsd vbroadcastf128 vcmpeq_ospd vcmpeqpd vcmplt_ospd vcmpltpd vcmple_ospd vcmplepd vcmpunord_qpd vcmpunordpd vcmpneq_uqpd vcmpneqpd vcmpnlt_uspd vcmpnltpd vcmpnle_uspd vcmpnlepd vcmpord_qpd vcmpordpd vcmpeq_uqpd vcmpnge_uspd vcmpngepd vcmpngt_uspd vcmpngtpd vcmpfalse_oqpd vcmpfalsepd vcmpneq_oqpd vcmpge_ospd vcmpgepd vcmpgt_ospd vcmpgtpd vcmptrue_uqpd vcmptruepd vcmplt_oqpd vcmple_oqpd vcmpunord_spd vcmpneq_uspd vcmpnlt_uqpd vcmpnle_uqpd vcmpord_spd vcmpeq_uspd vcmpnge_uqpd vcmpngt_uqpd vcmpfalse_ospd vcmpneq_ospd vcmpge_oqpd vcmpgt_oqpd vcmptrue_uspd vcmppd vcmpeq_osps vcmpeqps vcmplt_osps vcmpltps vcmple_osps vcmpleps vcmpunord_qps vcmpunordps vcmpneq_uqps vcmpneqps vcmpnlt_usps vcmpnltps vcmpnle_usps vcmpnleps vcmpord_qps vcmpordps vcmpeq_uqps vcmpnge_usps vcmpngeps vcmpngt_usps vcmpngtps vcmpfalse_oqps vcmpfalseps vcmpneq_oqps vcmpge_osps vcmpgeps vcmpgt_osps vcmpgtps vcmptrue_uqps vcmptrueps vcmplt_oqps vcmple_oqps vcmpunord_sps vcmpneq_usps vcmpnlt_uqps vcmpnle_uqps vcmpord_sps vcmpeq_usps vcmpnge_uqps vcmpngt_uqps vcmpfalse_osps vcmpneq_osps vcmpge_oqps vcmpgt_oqps vcmptrue_usps vcmpps vcmpeq_ossd vcmpeqsd vcmplt_ossd vcmpltsd vcmple_ossd vcmplesd vcmpunord_qsd vcmpunordsd vcmpneq_uqsd vcmpneqsd vcmpnlt_ussd vcmpnltsd vcmpnle_ussd vcmpnlesd vcmpord_qsd vcmpordsd vcmpeq_uqsd vcmpnge_ussd vcmpngesd vcmpngt_ussd vcmpngtsd vcmpfalse_oqsd vcmpfalsesd vcmpneq_oqsd vcmpge_ossd vcmpgesd vcmpgt_ossd vcmpgtsd vcmptrue_uqsd vcmptruesd vcmplt_oqsd vcmple_oqsd vcmpunord_ssd vcmpneq_ussd vcmpnlt_uqsd vcmpnle_uqsd vcmpord_ssd vcmpeq_ussd vcmpnge_uqsd vcmpngt_uqsd vcmpfalse_ossd vcmpneq_ossd vcmpge_oqsd vcmpgt_oqsd vcmptrue_ussd vcmpsd vcmpeq_osss vcmpeqss vcmplt_osss vcmpltss vcmple_osss vcmpless vcmpunord_qss vcmpunordss vcmpneq_uqss vcmpneqss vcmpnlt_usss vcmpnltss vcmpnle_usss vcmpnless vcmpord_qss vcmpordss vcmpeq_uqss vcmpnge_usss vcmpngess vcmpngt_usss vcmpngtss vcmpfalse_oqss vcmpfalsess vcmpneq_oqss vcmpge_osss vcmpgess vcmpgt_osss vcmpgtss vcmptrue_uqss vcmptruess vcmplt_oqss vcmple_oqss vcmpunord_sss vcmpneq_usss vcmpnlt_uqss vcmpnle_uqss vcmpord_sss vcmpeq_usss vcmpnge_uqss vcmpngt_uqss vcmpfalse_osss vcmpneq_osss vcmpge_oqss vcmpgt_oqss vcmptrue_usss vcmpss vcomisd vcomiss vcvtdq2pd vcvtdq2ps vcvtpd2dq vcvtpd2ps vcvtps2dq vcvtps2pd vcvtsd2si vcvtsd2ss vcvtsi2sd vcvtsi2ss vcvtss2sd vcvtss2si vcvttpd2dq vcvttps2dq vcvttsd2si vcvttss2si vdivpd vdivps vdivsd vdivss vdppd vdpps vextractf128 vextractps vhaddpd vhaddps vhsubpd vhsubps vinsertf128 vinsertps vlddqu vldqqu vldmxcsr vmaskmovdqu vmaskmovps vmaskmovpd vmaxpd vmaxps vmaxsd vmaxss vminpd vminps vminsd vminss vmovapd vmovaps vmovd vmovq vmovddup vmovdqa vmovqqa vmovdqu vmovqqu vmovhlps vmovhpd vmovhps vmovlhps vmovlpd vmovlps vmovmskpd vmovmskps vmovntdq vmovntqq vmovntdqa vmovntpd vmovntps vmovsd vmovshdup vmovsldup vmovss vmovupd vmovups vmpsadbw vmulpd vmulps vmulsd vmulss vorpd vorps vpabsb vpabsw vpabsd vpacksswb vpackssdw vpackuswb vpackusdw vpaddb vpaddw vpaddd vpaddq vpaddsb vpaddsw vpaddusb vpaddusw vpalignr vpand vpandn vpavgb vpavgw vpblendvb vpblendw vpcmpestri vpcmpestrm vpcmpistri vpcmpistrm vpcmpeqb vpcmpeqw vpcmpeqd vpcmpeqq vpcmpgtb vpcmpgtw vpcmpgtd vpcmpgtq vpermilpd vpermilps vperm2f128 vpextrb vpextrw vpextrd vpextrq vphaddw vphaddd vphaddsw vphminposuw vphsubw vphsubd vphsubsw vpinsrb vpinsrw vpinsrd vpinsrq vpmaddwd vpmaddubsw vpmaxsb vpmaxsw vpmaxsd vpmaxub vpmaxuw vpmaxud vpminsb vpminsw vpminsd vpminub vpminuw vpminud vpmovmskb vpmovsxbw vpmovsxbd vpmovsxbq vpmovsxwd vpmovsxwq vpmovsxdq vpmovzxbw vpmovzxbd vpmovzxbq vpmovzxwd vpmovzxwq vpmovzxdq vpmulhuw vpmulhrsw vpmulhw vpmullw vpmulld vpmuludq vpmuldq vpor vpsadbw vpshufb vpshufd vpshufhw vpshuflw vpsignb vpsignw vpsignd vpslldq vpsrldq vpsllw vpslld vpsllq vpsraw vpsrad vpsrlw vpsrld vpsrlq vptest vpsubb vpsubw vpsubd vpsubq vpsubsb vpsubsw vpsubusb vpsubusw vpunpckhbw vpunpckhwd vpunpckhdq vpunpckhqdq vpunpcklbw vpunpcklwd vpunpckldq vpunpcklqdq vpxor vrcpps vrcpss vrsqrtps vrsqrtss vroundpd vroundps vroundsd vroundss vshufpd vshufps vsqrtpd vsqrtps vsqrtsd vsqrtss vstmxcsr vsubpd vsubps vsubsd vsubss vtestps vtestpd vucomisd vucomiss vunpckhpd vunpckhps vunpcklpd vunpcklps vxorpd vxorps vzeroall vzeroupper pclmullqlqdq pclmulhqlqdq pclmullqhqdq pclmulhqhqdq pclmulqdq vpclmullqlqdq vpclmulhqlqdq vpclmullqhqdq vpclmulhqhqdq vpclmulqdq vfmadd132ps vfmadd132pd vfmadd312ps vfmadd312pd vfmadd213ps vfmadd213pd vfmadd123ps vfmadd123pd vfmadd231ps vfmadd231pd vfmadd321ps vfmadd321pd vfmaddsub132ps vfmaddsub132pd vfmaddsub312ps vfmaddsub312pd vfmaddsub213ps vfmaddsub213pd vfmaddsub123ps vfmaddsub123pd vfmaddsub231ps vfmaddsub231pd vfmaddsub321ps vfmaddsub321pd vfmsub132ps vfmsub132pd vfmsub312ps vfmsub312pd vfmsub213ps vfmsub213pd vfmsub123ps vfmsub123pd vfmsub231ps vfmsub231pd vfmsub321ps vfmsub321pd vfmsubadd132ps vfmsubadd132pd vfmsubadd312ps vfmsubadd312pd vfmsubadd213ps vfmsubadd213pd vfmsubadd123ps vfmsubadd123pd vfmsubadd231ps vfmsubadd231pd vfmsubadd321ps vfmsubadd321pd vfnmadd132ps vfnmadd132pd vfnmadd312ps vfnmadd312pd vfnmadd213ps vfnmadd213pd vfnmadd123ps vfnmadd123pd vfnmadd231ps vfnmadd231pd vfnmadd321ps vfnmadd321pd vfnmsub132ps vfnmsub132pd vfnmsub312ps vfnmsub312pd vfnmsub213ps vfnmsub213pd vfnmsub123ps vfnmsub123pd vfnmsub231ps vfnmsub231pd vfnmsub321ps vfnmsub321pd vfmadd132ss vfmadd132sd vfmadd312ss vfmadd312sd vfmadd213ss vfmadd213sd vfmadd123ss vfmadd123sd vfmadd231ss vfmadd231sd vfmadd321ss vfmadd321sd vfmsub132ss vfmsub132sd vfmsub312ss vfmsub312sd vfmsub213ss vfmsub213sd vfmsub123ss vfmsub123sd vfmsub231ss vfmsub231sd vfmsub321ss vfmsub321sd vfnmadd132ss vfnmadd132sd vfnmadd312ss vfnmadd312sd vfnmadd213ss vfnmadd213sd vfnmadd123ss vfnmadd123sd vfnmadd231ss vfnmadd231sd vfnmadd321ss vfnmadd321sd vfnmsub132ss vfnmsub132sd vfnmsub312ss vfnmsub312sd vfnmsub213ss vfnmsub213sd vfnmsub123ss vfnmsub123sd vfnmsub231ss vfnmsub231sd vfnmsub321ss vfnmsub321sd rdfsbase rdgsbase rdrand wrfsbase wrgsbase vcvtph2ps vcvtps2ph adcx adox rdseed clac stac xstore xcryptecb xcryptcbc xcryptctr xcryptcfb xcryptofb montmul xsha1 xsha256 llwpcb slwpcb lwpval lwpins vfmaddpd vfmaddps vfmaddsd vfmaddss vfmaddsubpd vfmaddsubps vfmsubaddpd vfmsubaddps vfmsubpd vfmsubps vfmsubsd vfmsubss vfnmaddpd vfnmaddps vfnmaddsd vfnmaddss vfnmsubpd vfnmsubps vfnmsubsd vfnmsubss vfrczpd vfrczps vfrczsd vfrczss vpcmov vpcomb vpcomd vpcomq vpcomub vpcomud vpcomuq vpcomuw vpcomw vphaddbd vphaddbq vphaddbw vphadddq vphaddubd vphaddubq vphaddubw vphaddudq vphadduwd vphadduwq vphaddwd vphaddwq vphsubbw vphsubdq vphsubwd vpmacsdd vpmacsdqh vpmacsdql vpmacssdd vpmacssdqh vpmacssdql vpmacsswd vpmacssww vpmacswd vpmacsww vpmadcsswd vpmadcswd vpperm vprotb vprotd vprotq vprotw vpshab vpshad vpshaq vpshaw vpshlb vpshld vpshlq vpshlw vbroadcasti128 vpblendd vpbroadcastb vpbroadcastw vpbroadcastd vpbroadcastq vpermd vpermpd vpermps vpermq vperm2i128 vextracti128 vinserti128 vpmaskmovd vpmaskmovq vpsllvd vpsllvq vpsravd vpsrlvd vpsrlvq vgatherdpd vgatherqpd vgatherdps vgatherqps vpgatherdd vpgatherqd vpgatherdq vpgatherqq xabort xbegin xend xtest andn bextr blci blcic blsi blsic blcfill blsfill blcmsk blsmsk blsr blcs bzhi mulx pdep pext rorx sarx shlx shrx tzcnt tzmsk t1mskc valignd valignq vblendmpd vblendmps vbroadcastf32x4 vbroadcastf64x4 vbroadcasti32x4 vbroadcasti64x4 vcompresspd vcompressps vcvtpd2udq vcvtps2udq vcvtsd2usi vcvtss2usi vcvttpd2udq vcvttps2udq vcvttsd2usi vcvttss2usi vcvtudq2pd vcvtudq2ps vcvtusi2sd vcvtusi2ss vexpandpd vexpandps vextractf32x4 vextractf64x4 vextracti32x4 vextracti64x4 vfixupimmpd vfixupimmps vfixupimmsd vfixupimmss vgetexppd vgetexpps vgetexpsd vgetexpss vgetmantpd vgetmantps vgetmantsd vgetmantss vinsertf32x4 vinsertf64x4 vinserti32x4 vinserti64x4 vmovdqa32 vmovdqa64 vmovdqu32 vmovdqu64 vpabsq vpandd vpandnd vpandnq vpandq vpblendmd vpblendmq vpcmpltd vpcmpled vpcmpneqd vpcmpnltd vpcmpnled vpcmpd vpcmpltq vpcmpleq vpcmpneqq vpcmpnltq vpcmpnleq vpcmpq vpcmpequd vpcmpltud vpcmpleud vpcmpnequd vpcmpnltud vpcmpnleud vpcmpud vpcmpequq vpcmpltuq vpcmpleuq vpcmpnequq vpcmpnltuq vpcmpnleuq vpcmpuq vpcompressd vpcompressq vpermi2d vpermi2pd vpermi2ps vpermi2q vpermt2d vpermt2pd vpermt2ps vpermt2q vpexpandd vpexpandq vpmaxsq vpmaxuq vpminsq vpminuq vpmovdb vpmovdw vpmovqb vpmovqd vpmovqw vpmovsdb vpmovsdw vpmovsqb vpmovsqd vpmovsqw vpmovusdb vpmovusdw vpmovusqb vpmovusqd vpmovusqw vpord vporq vprold vprolq vprolvd vprolvq vprord vprorq vprorvd vprorvq vpscatterdd vpscatterdq vpscatterqd vpscatterqq vpsraq vpsravq vpternlogd vpternlogq vptestmd vptestmq vptestnmd vptestnmq vpxord vpxorq vrcp14pd vrcp14ps vrcp14sd vrcp14ss vrndscalepd vrndscaleps vrndscalesd vrndscaless vrsqrt14pd vrsqrt14ps vrsqrt14sd vrsqrt14ss vscalefpd vscalefps vscalefsd vscalefss vscatterdpd vscatterdps vscatterqpd vscatterqps vshuff32x4 vshuff64x2 vshufi32x4 vshufi64x2 kandnw kandw kmovw knotw kortestw korw kshiftlw kshiftrw kunpckbw kxnorw kxorw vpbroadcastmb2q vpbroadcastmw2d vpconflictd vpconflictq vplzcntd vplzcntq vexp2pd vexp2ps vrcp28pd vrcp28ps vrcp28sd vrcp28ss vrsqrt28pd vrsqrt28ps vrsqrt28sd vrsqrt28ss vgatherpf0dpd vgatherpf0dps vgatherpf0qpd vgatherpf0qps vgatherpf1dpd vgatherpf1dps vgatherpf1qpd vgatherpf1qps vscatterpf0dpd vscatterpf0dps vscatterpf0qpd vscatterpf0qps vscatterpf1dpd vscatterpf1dps vscatterpf1qpd vscatterpf1qps prefetchwt1 bndmk bndcl bndcu bndcn bndmov bndldx bndstx sha1rnds4 sha1nexte sha1msg1 sha1msg2 sha256rnds2 sha256msg1 sha256msg2 hint_nop0 hint_nop1 hint_nop2 hint_nop3 hint_nop4 hint_nop5 hint_nop6 hint_nop7 hint_nop8 hint_nop9 hint_nop10 hint_nop11 hint_nop12 hint_nop13 hint_nop14 hint_nop15 hint_nop16 hint_nop17 hint_nop18 hint_nop19 hint_nop20 hint_nop21 hint_nop22 hint_nop23 hint_nop24 hint_nop25 hint_nop26 hint_nop27 hint_nop28 hint_nop29 hint_nop30 hint_nop31 hint_nop32 hint_nop33 hint_nop34 hint_nop35 hint_nop36 hint_nop37 hint_nop38 hint_nop39 hint_nop40 hint_nop41 hint_nop42 hint_nop43 hint_nop44 hint_nop45 hint_nop46 hint_nop47 hint_nop48 hint_nop49 hint_nop50 hint_nop51 hint_nop52 hint_nop53 hint_nop54 hint_nop55 hint_nop56 hint_nop57 hint_nop58 hint_nop59 hint_nop60 hint_nop61 hint_nop62 hint_nop63',
            literal: 'ip eip rip ' + 'al ah bl bh cl ch dl dh sil dil bpl spl r8b r9b r10b r11b r12b r13b r14b r15b ' + 'ax bx cx dx si di bp sp r8w r9w r10w r11w r12w r13w r14w r15w ' + 'eax ebx ecx edx esi edi ebp esp eip r8d r9d r10d r11d r12d r13d r14d r15d ' + 'rax rbx rcx rdx rsi rdi rbp rsp r8 r9 r10 r11 r12 r13 r14 r15 ' + 'cs ds es fs gs ss ' + 'st st0 st1 st2 st3 st4 st5 st6 st7 ' + 'mm0 mm1 mm2 mm3 mm4 mm5 mm6 mm7 ' + 'xmm0  xmm1  xmm2  xmm3  xmm4  xmm5  xmm6  xmm7  xmm8  xmm9 xmm10  xmm11 xmm12 xmm13 xmm14 xmm15 ' + 'xmm16 xmm17 xmm18 xmm19 xmm20 xmm21 xmm22 xmm23 xmm24 xmm25 xmm26 xmm27 xmm28 xmm29 xmm30 xmm31 ' + 'ymm0  ymm1  ymm2  ymm3  ymm4  ymm5  ymm6  ymm7  ymm8  ymm9 ymm10  ymm11 ymm12 ymm13 ymm14 ymm15 ' + 'ymm16 ymm17 ymm18 ymm19 ymm20 ymm21 ymm22 ymm23 ymm24 ymm25 ymm26 ymm27 ymm28 ymm29 ymm30 ymm31 ' + 'zmm0  zmm1  zmm2  zmm3  zmm4  zmm5  zmm6  zmm7  zmm8  zmm9 zmm10  zmm11 zmm12 zmm13 zmm14 zmm15 ' + 'zmm16 zmm17 zmm18 zmm19 zmm20 zmm21 zmm22 zmm23 zmm24 zmm25 zmm26 zmm27 zmm28 zmm29 zmm30 zmm31 ' + 'k0 k1 k2 k3 k4 k5 k6 k7 ' + 'bnd0 bnd1 bnd2 bnd3 ' + 'cr0 cr1 cr2 cr3 cr4 cr8 dr0 dr1 dr2 dr3 dr8 tr3 tr4 tr5 tr6 tr7 ' + 'r0 r1 r2 r3 r4 r5 r6 r7 r0b r1b r2b r3b r4b r5b r6b r7b ' + 'r0w r1w r2w r3w r4w r5w r6w r7w r0d r1d r2d r3d r4d r5d r6d r7d ' + 'r0h r1h r2h r3h ' + 'r0l r1l r2l r3l r4l r5l r6l r7l r8l r9l r10l r11l r12l r13l r14l r15l',
            pseudo: 'db dw dd dq dt ddq do dy dz ' + 'resb resw resd resq rest resdq reso resy resz ' + 'incbin equ times',
            preprocessor: '%define %xdefine %+ %undef %defstr %deftok %assign %strcat %strlen %substr %rotate %elif %else %endif ' + '%ifmacro %ifctx %ifidn %ifidni %ifid %ifnum %ifstr %iftoken %ifempty %ifenv %error %warning %fatal %rep ' + '%endrep %include %push %pop %repl %pathsearch %depend %use %arg %stacksize %local %line %comment %endcomment ' + '.nolist ' + 'byte word dword qword nosplit rel abs seg wrt strict near far a32 ptr ' + '__FILE__ __LINE__ __SECT__  __BITS__ __OUTPUT_FORMAT__ __DATE__ __TIME__ __DATE_NUM__ __TIME_NUM__ ' + '__UTC_DATE__ __UTC_TIME__ __UTC_DATE_NUM__ __UTC_TIME_NUM__  __PASS__ struc endstruc istruc at iend ' + 'align alignb sectalign daz nodaz up down zero default option assume public ',
            built_in: 'bits use16 use32 use64 default section segment absolute extern global common cpu float ' + '__utf16__ __utf16le__ __utf16be__ __utf32__ __utf32le__ __utf32be__ ' + '__float8__ __float16__ __float32__ __float64__ __float80m__ __float80e__ __float128l__ __float128h__ ' + '__Infinity__ __QNaN__ __SNaN__ Inf NaN QNaN SNaN float8 float16 float32 float64 float80m float80e ' + 'float128l float128h __FLOAT_DAZ__ __FLOAT_ROUND__ __FLOAT__'
          },
          contains: [hljs.COMMENT(';', '$', {relevance: 0}), {
            className: 'number',
            begin: '\\b(?:([0-9][0-9_]*)?\\.[0-9_]*(?:[eE][+-]?[0-9_]+)?|(0[Xx])?[0-9][0-9_]*\\.?[0-9_]*(?:[pP](?:[+-]?[0-9_]+)?)?)\\b',
            relevance: 0
          }, {
            className: 'number',
            begin: '\\$[0-9][0-9A-Fa-f]*',
            relevance: 0
          }, {
            className: 'number',
            begin: '\\b(?:[0-9A-Fa-f][0-9A-Fa-f_]*[HhXx]|[0-9][0-9_]*[DdTt]?|[0-7][0-7_]*[QqOo]|[0-1][0-1_]*[BbYy])\\b'
          }, {
            className: 'number',
            begin: '\\b(?:0[HhXx][0-9A-Fa-f_]+|0[DdTt][0-9_]+|0[QqOo][0-7_]+|0[BbYy][0-1_]+)\\b'
          }, hljs.QUOTE_STRING_MODE, {
            className: 'string',
            begin: '\'',
            end: '[^\\\\]\'',
            relevance: 0
          }, {
            className: 'string',
            begin: '`',
            end: '[^\\\\]`',
            relevance: 0
          }, {
            className: 'string',
            begin: '\\.[A-Za-z0-9]+',
            relevance: 0
          }, {
            className: 'label',
            begin: '^\\s*[A-Za-z._?][A-Za-z0-9_$#@~.?]*(:|\\s+label)',
            relevance: 0
          }, {
            className: 'label',
            begin: '^\\s*%%[A-Za-z0-9_$#@~.?]*:',
            relevance: 0
          }, {
            className: 'argument',
            begin: '%[0-9]+',
            relevance: 0
          }, {
            className: 'built_in',
            begin: '%!\S+',
            relevance: 0
          }]
        };
      };
    }, {}],
    129: [function(require, module, exports) {
      module.exports = function(hljs) {
        var BUILTIN_MODULES = 'ObjectLoader Animate MovieCredits Slides Filters Shading Materials LensFlare Mapping VLCAudioVideo StereoDecoder PointCloud NetworkAccess RemoteControl RegExp ChromaKey Snowfall NodeJS Speech Charts';
        var XL_KEYWORDS = {
          keyword: 'if then else do while until for loop import with is as where when by data constant',
          literal: 'true false nil',
          type: 'integer real text name boolean symbol infix prefix postfix block tree',
          built_in: 'in mod rem and or xor not abs sign floor ceil sqrt sin cos tan asin acos atan exp expm1 log log2 log10 log1p pi at',
          module: BUILTIN_MODULES,
          id: 'text_length text_range text_find text_replace contains page slide basic_slide title_slide title subtitle fade_in fade_out fade_at clear_color color line_color line_width texture_wrap texture_transform texture scale_?x scale_?y scale_?z? translate_?x translate_?y translate_?z? rotate_?x rotate_?y rotate_?z? rectangle circle ellipse sphere path line_to move_to quad_to curve_to theme background contents locally time mouse_?x mouse_?y mouse_buttons'
        };
        var XL_CONSTANT = {
          className: 'constant',
          begin: '[A-Z][A-Z_0-9]+',
          relevance: 0
        };
        var XL_VARIABLE = {
          className: 'variable',
          begin: '([A-Z][a-z_0-9]+)+',
          relevance: 0
        };
        var XL_ID = {
          className: 'id',
          begin: '[a-z][a-z_0-9]+',
          relevance: 0
        };
        var DOUBLE_QUOTE_TEXT = {
          className: 'string',
          begin: '"',
          end: '"',
          illegal: '\\n'
        };
        var SINGLE_QUOTE_TEXT = {
          className: 'string',
          begin: '\'',
          end: '\'',
          illegal: '\\n'
        };
        var LONG_TEXT = {
          className: 'string',
          begin: '<<',
          end: '>>'
        };
        var BASED_NUMBER = {
          className: 'number',
          begin: '[0-9]+#[0-9A-Z_]+(\\.[0-9-A-Z_]+)?#?([Ee][+-]?[0-9]+)?',
          relevance: 10
        };
        var IMPORT = {
          className: 'import',
          beginKeywords: 'import',
          end: '$',
          keywords: {
            keyword: 'import',
            module: BUILTIN_MODULES
          },
          relevance: 0,
          contains: [DOUBLE_QUOTE_TEXT]
        };
        var FUNCTION_DEFINITION = {
          className: 'function',
          begin: '[a-z].*->'
        };
        return {
          aliases: ['tao'],
          lexemes: /[a-zA-Z][a-zA-Z0-9_?]*/,
          keywords: XL_KEYWORDS,
          contains: [hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE, DOUBLE_QUOTE_TEXT, SINGLE_QUOTE_TEXT, LONG_TEXT, FUNCTION_DEFINITION, IMPORT, XL_CONSTANT, XL_VARIABLE, XL_ID, BASED_NUMBER, hljs.NUMBER_MODE]
        };
      };
    }, {}],
    130: [function(require, module, exports) {
      module.exports = function(hljs) {
        var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
        var PHP = {
          begin: /<\?(php)?(?!\w)/,
          end: /\?>/,
          subLanguage: 'php',
          subLanguageMode: 'continuous'
        };
        var TAG_INTERNALS = {
          endsWithParent: true,
          illegal: /</,
          relevance: 0,
          contains: [PHP, {
            className: 'attribute',
            begin: XML_IDENT_RE,
            relevance: 0
          }, {
            begin: '=',
            relevance: 0,
            contains: [{
              className: 'value',
              contains: [PHP],
              variants: [{
                begin: /"/,
                end: /"/
              }, {
                begin: /'/,
                end: /'/
              }, {begin: /[^\s\/>]+/}]
            }]
          }]
        };
        return {
          aliases: ['html', 'xhtml', 'rss', 'atom', 'xsl', 'plist'],
          case_insensitive: true,
          contains: [{
            className: 'doctype',
            begin: '<!DOCTYPE',
            end: '>',
            relevance: 10,
            contains: [{
              begin: '\\[',
              end: '\\]'
            }]
          }, hljs.COMMENT('<!--', '-->', {relevance: 10}), {
            className: 'cdata',
            begin: '<\\!\\[CDATA\\[',
            end: '\\]\\]>',
            relevance: 10
          }, {
            className: 'tag',
            begin: '<style(?=\\s|>|$)',
            end: '>',
            keywords: {title: 'style'},
            contains: [TAG_INTERNALS],
            starts: {
              end: '</style>',
              returnEnd: true,
              subLanguage: 'css'
            }
          }, {
            className: 'tag',
            begin: '<script(?=\\s|>|$)',
            end: '>',
            keywords: {title: 'script'},
            contains: [TAG_INTERNALS],
            starts: {
              end: '\<\/script\>',
              returnEnd: true,
              subLanguage: ''
            }
          }, PHP, {
            className: 'pi',
            begin: /<\?\w+/,
            end: /\?>/,
            relevance: 10
          }, {
            className: 'tag',
            begin: '</?',
            end: '/?>',
            contains: [{
              className: 'title',
              begin: /[^ \/><\n\t]+/,
              relevance: 0
            }, TAG_INTERNALS]
          }]
        };
      };
    }, {}],
    131: [function(require, module, exports) {
      arguments[4][2][0].apply(exports, arguments);
    }, {"dup": 2}],
    132: [function(require, module, exports) {
      arguments[4][3][0].apply(exports, arguments);
    }, {
      "./angular": 131,
      "dup": 3
    }],
    133: [function(require, module, exports) {
      var MainCtrl = function MainCtrl($scope, $parse) {
        $scope.editObject = '{angularjs: 1, is: 2, awesome: 3}';
        $scope.prettyJSON = '';
        $scope.tabWidth = 4;
        var _lastGoodResult = '';
        $scope.toPrettyJSON = function(objStr, tabWidth) {
          var obj;
          try {
            obj = $parse(objStr)({});
          } catch (e) {
            return _lastGoodResult;
          }
          var result = JSON.stringify(obj, null, Number(tabWidth));
          _lastGoodResult = result;
          return result;
        };
      };
      module.exports = MainCtrl;
    }, {}],
    134: [function(require, module, exports) {
      var angular = require('angular');
      angular.module('exampleApp', [require('../../angular-highlightjs')]).controller('MainCtrl', require('./main-ctrl'));
    }, {
      "../../angular-highlightjs": 1,
      "./main-ctrl": 133,
      "angular": 132
    }]
  }, {}, [134]);
})(require('buffer').Buffer, require('process'));