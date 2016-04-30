/// <reference path="./ApiInterface.d.ts" />
/// <reference path="./interfaces/jquery.d.ts" />
/// <reference path="./interfaces/opera.d.ts" />
var _gaq = _gaq || [];
var _setTimeout = setTimeout;
var tn;
(function (tn) {
    var browsers;
    (function (browsers) {
        var Ajax = (function () {
            function Ajax() {
            }
            Ajax.prototype.setHeader = function (name, value) {
                $.ajaxSetup({
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader(name, value);
                    }
                });
            };
            Ajax.prototype._send = function (method, url, data, onSuccess, onError) {
                var _this = this;
                $.ajax({
                    type: method,
                    url: url,
                    data: data,
                    dataType: 'json',
                    success: function () {
                        console.log('got ', data, ' from [', method, '] ', url);
                        if (onSuccess) {
                            onSuccess.apply(_this, arguments);
                        }
                    },
                    error: function () {
                        console.log('got error', data, ' from [', method, '] ', url);
                        if (onError) {
                            onError.apply(_this, arguments);
                        }
                    }
                });
            };
            Ajax.prototype.get = function (url, params, onSuccess, onError) {
                this._send("GET", url, params, onSuccess, onError);
            };
            Ajax.prototype.getLocalFile = function (fileName, onSuccess) {
                this.get('/includes/' + fileName, null, onSuccess);
            };
            Ajax.prototype.post = function (url, data, onSuccess, onError) {
                this._send("POST", url, data, onSuccess, onError);
            };
            Ajax.prototype.getText = function (url, params, onSuccess) {
                console.log('getText');
                $.get(url, params, onSuccess);
            };
            Ajax.prototype.postRaw = function (url, data, mimeType, onSuccess) {
                if (mimeType === void 0) { mimeType = 'text/plain'; }
                console.log('postRaw', url, data, mimeType);
                $.ajax({
                    type: 'POST',
                    url: url,
                    dataType: 'text',
                    contentType: mimeType,
                    data: data,
                    success: function (result) {
                        onSuccess(JSON.parse(result));
                    },
                    error: function (result) {
                        onSuccess(result);
                    }
                });
            };
            return Ajax;
        }());
        browsers.Ajax = Ajax;
        var Storage = (function () {
            function Storage() {
            }
            Storage.prototype.get = function (name) {
                var json = widget.preferences[name];
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
                widget.preferences[name] = JSON.stringify(value);
            };
            Storage.prototype.remove = function (name) {
                delete widget.preferences[name];
            };
            Storage.prototype.clear = function () {
                this.removeWhen(function () { return true; });
            };
            Storage.prototype.exist = function (name) {
                return name in widget.preferences;
            };
            Storage.prototype.removeWhen = function (filter) {
                var _this = this;
                var keysToDelete = [];
                for (var field in widget.preferences) {
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
        browsers.Storage = Storage;
        var TabManager = (function () {
            function TabManager() {
            }
            TabManager.prototype.onExtensionMessage = function (callback) {
                opera.extension.addEventListener("message", function (event) {
                    if (event.data === 'load') {
                        return;
                    }
                    callback(event.data, event.source);
                }, false);
            };
            TabManager.prototype.sendMessageToTab = function (tab, msg) {
                tab.postMessage(msg);
            };
            TabManager.prototype.onTabLoad = function (callback) {
                opera.extension.addEventListener("message", function (event) {
                    if (event.data.action === 'load') {
                        event.source.url = event.origin;
                        callback(event.source);
                    }
                }, false);
            };
            TabManager.prototype.attachScripts = function (config, callback) {
                callback(config.tab, config.tab);
            };
            TabManager.prototype.onTabClose = function (callback) {
                console.warn('Not Implemented');
            };
            TabManager.prototype.getAllTabs = function (callback) {
                callback(opera.extension.tabs.getAll());
            };
            return TabManager;
        }());
        browsers.TabManager = TabManager;
        var gaInitialized = false;
        var reloadExtention = function () {
        };
        var trackInGa_clean = function (key, path) {
            if (!gaInitialized) {
                _gaq.push(['_setAccount', key]);
                _gaq.push(['_setDomainName', 'none']);
                var ga = document.createElement('script');
                ga.type = 'text/javascript';
                ga.async = true;
                ga.src = 'https://ssl.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(ga, s);
                gaInitialized = true;
            }
            _gaq.push(['_trackPageview', path]);
        };
        var trackInGa = function (key, path, name_key, uid) {
            path = encodeURIComponent(path);
            var win = {
                url: 'https://supermegabest.com/',
                host: 'none',
                pathname: 'background.html'
            };
            $.post("https://www.google-analytics.com/collect", {
                v: '1',
                tid: key,
                cid: uid,
                t: 'pageview',
                dh: win.host,
                dp: path,
            });
        };
        var trackEventInGa = function (key, action, label, name_key, uid) {
            action = encodeURIComponent(action);
            label = encodeURIComponent(label);
            name_key = encodeURIComponent(name_key);
            $.post('https://www.google-analytics.com/collect', {
                v: '1',
                tid: key,
                cid: uid,
                t: 'event',
                ec: 'extention',
                ea: action,
                el: label
            });
        };
        var divPlugCreate = false;
        var addPlugScript = function (path) {
            var s = document.getElementById('plug_module');
            if (!s) {
                var div_plug = document.createElement('div');
                div_plug.id = 'plug_module';
                var d = document.getElementsByTagName('body')[0];
                d.appendChild(div_plug);
                divPlugCreate = true;
            }
            else {
                var divPlugCreate = false;
            }
            var checkInserted = document.querySelectorAll('#plug_module script[src="' + path + '"]');
            if (!checkInserted.length) {
                var plug_script = document.createElement('script');
                plug_script.type = 'text/javascript';
                plug_script.async = true;
                plug_script.src = path;
                var s = document.getElementById('plug_module');
                s.appendChild(plug_script);
            }
        };
        browsers.api = {
            browserBase: "Opera",
            ajax: new Ajax(),
            tabs: new TabManager(),
            storage: new tn.browsers.Storage(),
            _setTimeout: function (func, delay) { return _setTimeout(func, delay); },
            utils: {
                reloadExtention: reloadExtention,
                sendMessage: opera.extension.postMessage,
                trackInGA: trackInGa,
                trackEventInGA: trackEventInGa,
                addPlugScript: addPlugScript,
                getExtensionId: function () { return 'TODO'; },
                getExtensionVersion: function () { return widget.version; },
                base64Encode: function (str) { return btoa(str); },
                base64Decode: function (str) { return atob(str); }
            }
        };
    })(browsers = tn.browsers || (tn.browsers = {}));
})(tn || (tn = {}));
// Хак для лисы. В firefox используется commonjs, поэтому требуется маппить экспорт
var exports = {};
