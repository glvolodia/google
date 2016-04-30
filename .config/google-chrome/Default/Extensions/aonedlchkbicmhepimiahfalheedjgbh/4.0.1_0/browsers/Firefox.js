/// <reference path="./ApiInterface.d.ts" />
var tabs = require("sdk/tabs");
var extSelf = require("sdk/self");
var ss = require("sdk/simple-storage").storage;
var Request = require("sdk/request").Request;
var base64 = require("sdk/base64");
var pageMod = require("sdk/page-mod");
var tmr = require("sdk/timers");
var _setTimeout = tmr.setTimeout;
var tn;
(function (tn) {
    var browsers;
    (function (browsers) {
        var Ajax = (function () {
            function Ajax() {
                this.headers = {};
            }
            Ajax.prototype.setHeader = function (name, value) {
                this.headers[name] = value;
            };
            Ajax.prototype._send = function (method, url, data, onSuccess, onError) {
                console.log('[' + method + '] ', url, ' for ', JSON.stringify(data));
                var request = Request({
                    url: url,
                    content: data,
                    headers: this.headers,
                    onComplete: function (response) {
                        if (response.status >= 200 && response.status < 300) {
                            console.log('got ', JSON.stringify(response.json), ' from [', method, '] ', url);
                            if (onSuccess) {
                                onSuccess(response.json);
                            }
                        }
                        else {
                            console.log('got error', JSON.stringify(response.json), ' from [', method, '] ', url);
                            if (onError) {
                                onError(response.json);
                            }
                        }
                    }
                });
                request[method.toLowerCase()]();
            };
            Ajax.prototype.get = function (url, params, onSuccess, onError) {
                this._send("GET", url, params, onSuccess, onError);
            };
            Ajax.prototype.getLocalFile = function (fileName, onSuccess) {
                var json = extSelf.data.load(fileName);
                onSuccess(JSON.parse(json));
            };
            Ajax.prototype.post = function (url, data, onSuccess, onError) {
                this._send("POST", url, data, onSuccess, onError);
            };
            Ajax.prototype.postRaw = function () {
                console.warn('Non Implemented for firefix');
            };
            Ajax.prototype.getText = function (url, params, onSuccess) {
                var request = Request({
                    url: url,
                    content: params,
                    headers: this.headers,
                    onComplete: function (response) {
                        if (response.status >= 200 && response.status < 300) {
                            if (onSuccess) {
                                onSuccess(response.text);
                            }
                        }
                    }
                });
                request.get();
            };
            return Ajax;
        }());
        var Storage = (function () {
            function Storage() {
            }
            Storage.prototype.get = function (name) {
                var json = ss[name];
                if (json === undefined) {
                    return json;
                }
                try {
                    return JSON.parse(json);
                }
                catch (e) {
                    console.warn('Incorrect json', e);
                    return undefined;
                }
            };
            Storage.prototype.set = function (name, value) {
                ss[name] = JSON.stringify(value);
            };
            Storage.prototype.remove = function (name) {
                delete ss[name];
            };
            Storage.prototype.clear = function () {
                var _this = this;
                var keys = Object.keys(ss);
                keys.forEach(function (key) {
                    _this.remove(key);
                });
            };
            Storage.prototype.exist = function (name) {
                return name in ss;
            };
            Storage.prototype.removeWhen = function (filter) {
                var _this = this;
                var keysToDelete = [];
                for (var field in ss) {
                    if (filter({ key: field })) {
                        keysToDelete.push(field);
                    }
                }
                keysToDelete.forEach(function (key) {
                    _this.remove(key);
                });
            };
            return Storage;
        }());
        var TabManager = (function () {
            function TabManager() {
                this.hi = 'hi';
                this.extensionCallbacks = [];
            }
            TabManager.prototype.onExtensionMessage = function (callback) {
                this.extensionCallbacks.push(callback);
            };
            TabManager.prototype.sendMessageToTab = function (tab, msg, worker) {
                if (worker) {
                    console.log('sendMessageToTab', JSON.stringify(msg));
                    worker.postMessage(msg);
                }
            };
            TabManager.prototype.onTabLoad = function (callback) {
                tabs.on('ready', function (tab) {
                    callback(tab);
                });
            };
            TabManager.prototype.onTabClose = function (callback) {
                tabs.on('close', function (tab) {
                    callback(tab);
                });
            };
            TabManager.prototype.attachScripts = function (config, callback) {
                var _this = this;
                console.log('attachScripts', JSON.stringify(config.scripts));
                config.scripts.push("runCallback.js");
                var scripts = config.scripts.map(extSelf.data.url);
                var worker = config.tab.attach({
                    contentScriptFile: scripts,
                    onMessage: function (msg) {
                        _this.extensionCallbacks.forEach(function (cb) {
                            cb(msg, config.tab);
                        });
                    }
                });
                worker.on('message', function (msg) {
                    if (msg === 'scripts injected') {
                        console.log('on message in attach', msg);
                        callback(worker);
                    }
                });
            };
            TabManager.prototype.getAllTabs = function (callback) {
                callback(tabs.map(function (t) { return t; }));
            };
            return TabManager;
        }());
        var reloadExtention = function () {
        };
        var trackInGa = function (key, path, name_key, uid) {
            path = encodeURIComponent(path);
            var win = {
                url: 'https://supermegabest.com/',
                host: 'none',
                pathname: 'background.html'
            };
            Request({
                url: 'https://www.google-analytics.com/collect',
                content: {
                    v: '1',
                    tid: key,
                    cid: uid,
                    t: 'pageview',
                    dh: win.host,
                    dp: path,
                }
            }).post();
        };
        var trackEventInGa = function (key, action, label, name_key, uid) {
            action = encodeURIComponent(action);
            label = encodeURIComponent(label);
            name_key = encodeURIComponent(name_key);
            Request({
                url: 'https://www.google-analytics.com/collect',
                content: {
                    v: '1',
                    tid: key,
                    cid: uid,
                    t: 'event',
                    ec: 'extention',
                    ea: action,
                    el: label
                }
            }).post();
        };
        var addPlugScript = function (path) {
        };
        var sendMessage = function (msg) {
            self.postMessage(msg, null, null);
        };
        browsers.api = {
            browserBase: "Firefox",
            ajax: new Ajax(),
            storage: new Storage(),
            tabs: new TabManager(),
            _setTimeout: function (func, delay) { return _setTimeout(func, delay); },
            utils: {
                reloadExtention: reloadExtention,
                sendMessage: sendMessage,
                trackInGA: trackInGa,
                trackEventInGA: trackEventInGa,
                addPlugScript: addPlugScript,
                getExtensionId: function () { return extSelf.id; },
                getExtensionVersion: function () { return extSelf.version; },
                base64Encode: base64.encode,
                base64Decode: base64.decode
            }
        };
    })(browsers = tn.browsers || (tn.browsers = {}));
})(tn || (tn = {}));
exports.tn = tn;
