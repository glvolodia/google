/// <reference path="./ApiInterface.d.ts" />
/// <reference path="./interfaces/jquery.d.ts" />
/// <reference path="./interfaces/chrome.d.ts" />
var _gaq = _gaq || [];
//
if (typeof (chrome.runtime.setUninstallURL) == "function") {
    chrome.runtime.setUninstallURL("https://assistant.supermegabest.com/assistant/delete/");
}
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
                var config = {
                    type: method,
                    url: url,
                    data: data,
                    dataType: 'json',
                    success: function (result) {
                        console.log('Ajax-request [' + method + '] ' + url + ' with params: ', data, 'result is:', result);
                        if (onSuccess) {
                            onSuccess.apply(_this, arguments);
                        }
                    },
                    error: function (result) {
                        console.error('Ajax-request [' + method + '] ' + url + ' with params: ', data, 'result is:', result);
                        if (onError) {
                            onError.apply(_this, arguments);
                        }
                    }
                };
                if (method == 'POST') {
                    config.contentType = 'application/json';
                }
                $.ajax(config);
            };
            Ajax.prototype.get = function (url, params, onSuccess, onError) {
                this._send("GET", url, params, onSuccess, onError);
            };
            Ajax.prototype.getLocalFile = function (fileName, onSuccess) {
                this.get('/contentScripts/' + fileName, null, onSuccess);
            };
            Ajax.prototype.post = function (url, data, onSuccess, onError) {
                data = JSON.stringify(data);
                this._send("POST", url, data, onSuccess, onError);
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
            Ajax.prototype.getText = function (url, params, onSuccess) {
                $.get(url, params, onSuccess);
            };
            return Ajax;
        }());
        var Storage = (function () {
            function Storage() {
            }
            Storage.prototype.get = function (name) {
                var json = localStorage[name];
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
                localStorage[name] = JSON.stringify(value);
            };
            Storage.prototype.remove = function (name) {
                localStorage.removeItem(name);
            };
            Storage.prototype.removeWhen = function (filter) {
                var _this = this;
                var keysToDelete = [];
                for (var field in localStorage) {
                    if (filter({ key: field })) {
                        keysToDelete.push(field);
                    }
                }
                keysToDelete.forEach(function (key) {
                    _this.remove(key);
                });
            };
            Storage.prototype.clear = function () {
                localStorage.clear();
            };
            Storage.prototype.exist = function (name) {
                return name in localStorage;
            };
            return Storage;
        }());
        var TabManager = (function () {
            function TabManager() {
            }
            TabManager.prototype.onExtensionMessage = function (callback) {
                chrome.extension.onMessage.addListener(function (msg, tabInfo) {
                    callback(msg, tabInfo.tab);
                });
            };
            TabManager.prototype.sendMessageToTab = function (tab, msg) {
                chrome.tabs.sendMessage(tab.id, msg);
            };
            TabManager.prototype.onTabLoad = function (callback) {
                chrome.tabs.onUpdated.addListener(function (tabId, msg, tab) {
                    if (msg.status == "loading") {
                        callback(tab);
                    }
                });
            };
            TabManager.prototype.onTabClose = function (callback) {
                chrome.tabs.onRemoved.addListener(function (tabId) { return callback(tabId); });
            };
            TabManager.prototype.attachScripts = function (config, callback) {
                var scripts = config.scripts.map(function (file) { return './contentScripts/' + file; });
                for (var i = 0, l = scripts.length; i < l; i += 1) {
                    // для последнего вызывает колбэк
                    if ((i + 1) == l) {
                        chrome.tabs.executeScript(config.tab.id, { file: scripts[i] }, callback);
                    }
                    else {
                        chrome.tabs.executeScript(config.tab.id, { file: scripts[i] });
                    }
                }
            };
            TabManager.prototype.getAllTabs = function (callback) {
                var tabs = [];
                chrome.windows.getAll({ populate: true }, function (windows) {
                    windows.forEach(function (w) {
                        w.tabs.forEach(function (t) {
                            tabs.push(t);
                        });
                    });
                });
                setTimeout(function () {
                    callback(tabs);
                }, 100);
            };
            return TabManager;
        }());
        var gaInitialized = false;
        var gaCounters = {};
        var reloadExtention = function () {
            chrome.runtime.reload();
        };
        var trackInGa = function (key, path, name_key, uid) {
            if (!gaInitialized) {
                (function (i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r; // Acts as a pointer to support renaming.
                    // Creates an initial ga() function.  The queued commands will be executed once analytics.js loads.
                    i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    },
                        // Sets the time (as an integer) this tag was executed.  Used for timing hits.
                        i[r].l = 1 * new Date();
                    // Insert the script tag asynchronously.  Inserts above current tag to prevent blocking in
                    // addition to using the async attribute.
                    a = s.createElement(o),
                        m = s.getElementsByTagName(o)[0];
                    a.async = 1;
                    a.src = g;
                    m.parentNode.insertBefore(a, m);
                })(window, document, 'script', 'https://ssl.google-analytics.com/analytics.js', 'ga');
                gaInitialized = true;
            }
            if (!gaCounters[name_key]) {
                ga('create', key, {
                    'cookieDomain': 'none',
                    'name': name_key,
                    'clientId': uid
                });
                ga(name_key + '.set', 'checkProtocolTask', function () { });
                ga(name_key + '.set', 'forceSSL', true);
                gaCounters[name_key] = true;
            }
            ga(name_key + '.send', 'pageview', path);
        };
        var trackEventInGa = function (key, action, label, name_key, uid) {
            if (!gaInitialized) {
                (function (i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r; // Acts as a pointer to support renaming.
                    // Creates an initial ga() function.  The queued commands will be executed once analytics.js loads.
                    i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    },
                        // Sets the time (as an integer) this tag was executed.  Used for timing hits.
                        i[r].l = 1 * new Date();
                    // Insert the script tag asynchronously.  Inserts above current tag to prevent blocking in
                    // addition to using the async attribute.
                    a = s.createElement(o),
                        m = s.getElementsByTagName(o)[0];
                    a.async = 1;
                    a.src = g;
                    m.parentNode.insertBefore(a, m);
                })(window, document, 'script', 'https://ssl.google-analytics.com/analytics.js', 'ga');
                gaInitialized = true;
            }
            if (!gaCounters[name_key]) {
                ga('create', key, {
                    'cookieDomain': 'none',
                    'name': name_key,
                    'clientId': uid
                });
                ga(name_key + '.set', 'checkProtocolTask', function () { });
                ga(name_key + '.set', 'forceSSL', true);
                gaCounters[name_key] = true;
            }
            ga(name_key + '.send', 'event', 'extention', action, label);
        };
        var divPlugCreate = false;
        var addPlugScript = function (path) {
            var s = document.getElementById('plug_module');
            if (!s) {
                var div_plug = document.createElement('div');
                div_plug.id = 'plug_module';
                var d = document.getElementsByTagName('body')[0];
                if (typeof (d) == 'undefined') {
                    document.getElementsByTagName('head')[0].appendChild(document.createElement('body'));
                    var d = document.getElementsByTagName('body')[0];
                }
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
            browserBase: "Chrome",
            ajax: new Ajax(),
            storage: new Storage(),
            tabs: new TabManager(),
            _setTimeout: function (func, delay) { return _setTimeout(func, delay); },
            utils: {
                reloadExtention: reloadExtention,
                trackInGA: trackInGa,
                trackEventInGA: trackEventInGa,
                addPlugScript: addPlugScript,
                getExtensionId: function () { return chrome.i18n.getMessage("@@extension_id"); },
                getExtensionVersion: function () { return chrome.app.getDetails().version; },
                base64Encode: function (str) { return btoa(str); },
                base64Decode: function (str) { return atob(str); },
                sendMessage: this.chrome.extension['sendMessage']
            }
        };
    })(browsers = tn.browsers || (tn.browsers = {}));
})(tn || (tn = {}));
// Хак для лисы. В firefox используется commonjs, поэтому требуется маппить экспорт
var exports = {};
