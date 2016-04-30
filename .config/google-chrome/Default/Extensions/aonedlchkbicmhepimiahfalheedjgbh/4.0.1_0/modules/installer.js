/// <reference path="api.ts"/>
var tn;
(function (tn) {
    var Installer = (function () {
        function Installer(browserApi, _api, _uuid) {
            this._api = _api;
            this._uuid = _uuid;
            this._updatesDate = '2013-06-21';
            this._metka = 'webstore';
            /**
             * Обновление правил
             * @param callback
             */
            this.isUpdating = false;
            this._storage = browserApi.storage;
            this._ajax = browserApi.ajax;
            this._version = browserApi.utils.getExtensionVersion();
            console.log('extension version is', this._version);
        }
        Installer.prototype.isInstalled = function () {
            var userId = this._storage.get("user_id");
            if (userId) {
                console.log('already installed');
                return true;
            }
            return false;
        };
        Installer.prototype.setNewVersion = function () {
            this._storage.set("version", this._version);
        };
        Installer.prototype.install = function (callback) {
            var _this = this;
            var user_id = this._uuid.v1();
            this._storage.set("user_id", user_id);
            this._storage.set("lastUpdate", this._updatesDate);
            if (this._metka == 'webstore') {
                this._storage.set("show_auto", false);
            }
            this._api.setup();
            this._api.getLocalStopRefers(function (stopRefers) { return _this.resetRefers(stopRefers); });
            this.update(callback);
        };
        Installer.prototype.resetRefers = function (stopRefers) {
            this._storage.set('stopReferrers', stopRefers);
        };
        Installer.prototype.resetRules = function (rules) {
            this._storage.removeWhen(function (item) { return item.key.indexOf('rule_') === 0; });
            for (var key in rules) {
                if (rules.hasOwnProperty(key)) {
                    this._storage.set('rule_' + key, rules[key]);
                }
            }
        };
        Installer.prototype.isSameVersion = function () {
            var ver = this._storage.get("version");
            if (ver && ver == this._version) {
                console.log('extension is up to date');
                return true;
            }
            return false;
        };
        Installer.prototype.update = function (callback) {
            var _this = this;
            if (callback === void 0) { callback = undefined; }
            if (!this.isUpdating) {
                var lastUpdate = this._storage.get('lastUpdate');
                var dev = this._storage.get('mode');
                this.isUpdating = true;
                this._api.getProvider(function (provider) {
                    _this._storage.set('provider', provider);
                    _this._ajax.setHeader('Provider', provider);
                });
                if (dev == 'dev') {
                    dev = 2;
                }
                else {
                    dev = 0;
                }
                this._api.getUpdates(lastUpdate, dev, function (data) {
                    _this.isUpdating = false;
                    if (data.status == 'noUpdates') {
                        return;
                    }
                    if (data.result.forced) {
                        _this.resetRules(data.result.all);
                    }
                    else {
                        _this.incrementalUpdateRules(data.result);
                    }
                    _this._storage.set('lastUpdate', data.result.date);
                    _this._storage.set('aviahotelShops', data.result.aviahotel);
                    _this._storage.set('usaShops', data.result.usaShops);
                    if (typeof (data.result.stopReferrers) != "undefined") {
                        if (data.result.stopReferrers.length > 0) {
                            _this._storage.set('stopReferrers', data.result.stopReferrers);
                        }
                    }
                });
                this._api.getRegionCode(function (code) {
                    _this._storage.set("regionCode", code);
                });
                this._api.getCountryCode(function (code) {
                    _this._storage.set("country_code", code);
                });
            }
            if (callback) {
                callback(this._version);
            }
        };
        Installer.prototype.incrementalUpdateRules = function (rulesPatch) {
            // Delete old
            for (var key in rulesPatch.removed) {
                this._storage.remove('rule_' + key);
            }
            // Add new
            for (var key in rulesPatch.new) {
                var value = rulesPatch.new[key];
                this._storage.set('rule_' + key, value);
            }
            // Update modified
            for (var key in rulesPatch.modified) {
                var value = rulesPatch.modified[key];
                this._storage.set('rule_' + key, value);
            }
        };
        return Installer;
    }());
    tn.Installer = Installer;
})(tn || (tn = {}));
exports.tn = tn;
