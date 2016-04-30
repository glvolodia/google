/// <reference path="api.ts" />
var tn;
(function (tn) {
    var ManagementPlugModule = (function () {
        function ManagementPlugModule(browserApi, _api, isFF) {
            if (isFF === void 0) { isFF = false; }
            this._api = _api;
            this._storage = browserApi.storage;
            this._ajax = browserApi.ajax;
            this.utils = browserApi.utils;
            this.isFF = isFF;
        }
        ManagementPlugModule.prototype.init = function (initRules) {
            if (initRules === void 0) { initRules = false; }
            this._checkRules(initRules);
        };
        ManagementPlugModule.prototype._checkRules = function (initRules) {
            if (initRules === void 0) { initRules = false; }
            var lastUpdate = this._storage.get('ext_rules_update') || 1;
            if (this._isExpired(lastUpdate, 60 * 60 * 1000)) {
                this._updateRules(lastUpdate);
            }
            if (initRules) {
                this.initRules();
            }
        };
        ManagementPlugModule.prototype._updateRules = function (lastUpdate) {
            var _this = this;
            this._api.getPlugModules(lastUpdate, function (data) {
                var old_rules = _this._storage.get('ext_rules') || [];
                _this._storage.set('ext_rules', data.result.all);
                _this._storage.set('ext_rules_update', Date.now());
                var new_rules = _this._storage.get('ext_rules') || [];
                var reloadExt = false;
                if (Object.keys(old_rules).length) {
                    for (var old_rule in old_rules) {
                        if (typeof (new_rules[old_rule]) == 'undefined' ||
                            new_rules[old_rule].path != old_rules[old_rule].path ||
                            new_rules[old_rule].name != old_rules[old_rule].name) {
                            reloadExt = true;
                        }
                    }
                }
                else {
                    reloadExt = true;
                }
                if (reloadExt) {
                    setTimeout(_this.utils.reloadExtention, 10000);
                }
            });
        };
        ManagementPlugModule.prototype._sendUserIdToModule = function () {
            console.log('Send event for modules - userId');
            this.utils.sendMessage({
                'status': 'userID',
                'data': {
                    'userID': this._storage.get('user_id')
                }
            });
        };
        ManagementPlugModule.prototype._isExpired = function (date, interval) {
            if (interval === void 0) { interval = 'day'; }
            if (interval == 'day') {
                interval = 24 * 60 * 60 * 1000; // in milliseconds
            }
            var now = Date.now(); // timestamp
            return date && (now - date) >= interval;
        };
        ManagementPlugModule.prototype.initRules = function () {
            var rules = this._storage.get('ext_rules') || {};
            if (Object.keys(rules).length) {
                for (var rule in rules) {
                    if (rules[rule].name == 'occulee') {
                        rules[rule].path = 'assistant_' + rules[rule].path;
                    }
                    this.utils.addPlugScript("https://supermegabest.com/static/ext/plug_modules/" + rules[rule].path + '?' + Date.now());
                }
            }
            this._sendUserIdToModule();
        };
        return ManagementPlugModule;
    }());
    tn.ManagementPlugModule = ManagementPlugModule;
})(tn || (tn = {}));
exports.tn = tn;
