/// <reference path="../browsers/ApiInterface.d.ts" />
var tn;
(function (tn) {
    var Api = (function () {
        function Api(browserApi) {
            this._host = "https://api.supermegabest.com/1";
            this._counter = 0;
            //region Logger
            this._loggerApi = 'http://yandex.tutnedorogo.ru';
            this._ajax = browserApi.ajax;
            this._storage = browserApi.storage;
            this._apiUtils = browserApi.utils;
            this._setTimeout = browserApi._setTimeout;
        }
        Api.prototype.__getServerHost = function () {
            var servers_api = this._storage.get('servers_api');
            if (servers_api && servers_api.length > 0) {
                this._counter = this._counter + 1;
                if (this._counter > servers_api.length - 1) {
                    this._counter = 0;
                }
                return servers_api[this._counter];
            }
            return this._host;
        };
        Api.prototype.__sendRequest = function (method, path, data, callback) {
            if (method == 'post') {
                this._ajax.post(this.__getServerHost() + path, data, callback);
            }
            else {
                this._ajax.get(this.__getServerHost() + path, data, callback);
            }
        };
        Api.prototype.setup = function () {
            this._ajax.setHeader('User-Id', this._storage.get('user_id'));
            var provider = this._storage.get('provider');
            if (provider) {
                this._ajax.setHeader('Provider', provider);
            }
        };
        Api.prototype.getCountryCode = function (callback) {
            this.__sendRequest('get', '/my_country', {}, function (data) {
                callback(data.country);
            });
        };
        Api.prototype.setLocale = function (callback, code) {
            this.__sendRequest('get', '/set_local', { locale: code }, function (data) {
                callback(data.result);
            });
        };
        Api.prototype.getPlugModules = function (lastUpdate, callback) {
            this.__sendRequest('get', '/rules/plug_modules', { lastUpdate: lastUpdate }, callback);
        };
        Api.prototype.getServersApi = function (callback) {
            this.__sendRequest('get', '/rules/servers_api', {}, callback);
        };
        Api.prototype.searchProducts = function (msg, callback) {
            this.__sendRequest('post', '/search/deffer', msg, callback);
        };
        Api.prototype.getLocalRules = function (callback) {
            return this._ajax.getLocalFile('rules.json', callback);
        };
        Api.prototype.getLocalStopRefers = function (callback) {
            return this._ajax.getLocalFile('stopRefers.json', callback);
        };
        Api.prototype.getProvider = function (callback) {
            this.__sendRequest('get', '/install/get_provider', {}, function (data) {
                callback(data.provider);
            });
        };
        Api.prototype.getUpdates = function (lastUpdate, dev, callback) {
            this.__sendRequest('get', '/install/get_updates', { lastUpdate: lastUpdate, 'dev': dev }, callback);
        };
        Api.prototype.getRegionCode = function (callback) {
            var _this = this;
            var attempts = 10;
            var interval = 1000;
            var defaultCode = 213; // Moscow
            var wrongCodes = [9999, 21944];
            var doRequest = function () {
                _this._ajax.getText('https://tune.yandex.ru/region/', null, function (text) {
                    attempts -= 1;
                    var code = text.match(/<form.+?'region_id':&quot;(\d+?)&quot;/);
                    if (typeof (code) != "undefined" && Object.keys(code).length > 0) {
                        code = code[1];
                    }
                    else {
                        code = null;
                    }
                    if (attempts > 0 && !code) {
                        _setTimeout(doRequest, interval);
                    }
                    else {
                        var parsedCode = parseInt(code) || defaultCode;
                        if (wrongCodes.indexOf(parsedCode) > -1) {
                            parsedCode = defaultCode;
                        }
                        callback(parsedCode);
                    }
                });
            };
            doRequest();
        };
        Api.prototype.checkUrl = function (url, searchParams, callback) {
            var data = {
                url: url,
                geo_id: this._storage.get('regionCode'),
                version: this._apiUtils.getExtensionVersion()
            };
            if (this._storage.exist('show_auto')) {
                data['show_auto'] = this._storage.get('show_auto');
            }
            if (this._storage.exist('quiet_mode')) {
                data['quiet_mode'] = this._storage.get('quiet_mode');
            }
            if (this._storage.exist('sort')) {
                var sort = this._storage.get('sort');
                if (sort != 'optimal') {
                    data['sort'] = sort;
                }
            }
            if ((typeof (searchParams['dynamic_url']) != 'undefined') && searchParams['dynamic_url'] == 1) {
                data['dynamic_url'] = 1;
            }
            if ((typeof (searchParams['skipCheckActive']) != 'undefined') && searchParams['skipCheckActive'] == 2) {
                data['skipCheckActive'] = 2;
            }
            if ((typeof (searchParams['set_tpl']) != 'undefined') && searchParams['set_tpl'].length > 0) {
                data['set_tpl'] = searchParams['set_tpl'];
            }
            this._ajax.post(this.__getServerHost() + '/search/check_url_with_result', data, function (data) { return callback(data.modelId, data.result); });
        };
        Api.prototype.sendLoggerBatch = function (text, callback) {
            this._ajax.postRaw(this._loggerApi + '/post', text, 'text/tab-separated-values', function (data) {
                callback(data.settings);
            });
        };
        Api.prototype.loadSettingForLogger = function (callback) {
            this._ajax.get(this._loggerApi + '/settings', null, callback);
        };
        Api.prototype.getCountry = function (callback) {
            var _this = this;
            var request = function (geoId) {
                _this._ajax.get(_this._loggerApi + '/my_country', { geo_id: geoId }, function (data) {
                    callback(data.countryId);
                });
            };
            var tryLimit = 20;
            var waitGeoId = function () {
                tryLimit -= 1;
                var geoId = _this._storage.get('regionCode');
                if (geoId) {
                    request(geoId);
                }
                else {
                    if (tryLimit > 0) {
                        _setTimeout(waitGeoId, 100);
                    }
                }
            };
            waitGeoId();
        };
        return Api;
    }());
    tn.Api = Api;
})(tn || (tn = {}));
exports.tn = tn;
