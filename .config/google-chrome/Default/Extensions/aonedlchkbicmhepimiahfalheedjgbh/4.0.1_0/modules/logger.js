/// <reference path="../browsers/ApiInterface.d.ts" />
/// <reference path="api.ts"/>
/// <reference path="utils.ts"/>
/// <reference path="installer.ts"/>
/// <reference path="ga.ts"/>
var tn;
(function (tn) {
    var Record = (function () {
        function Record(url, referrer) {
            this.ts = Math.ceil(Date.now() / 1000);
            this.url = url;
            this.referrer = referrer || '';
        }
        Record.prototype.toRow = function () {
            return [this.ts, this.url, this.referrer].join('\t');
        };
        return Record;
    }());
    tn.Record = Record;
    var oneDay = 1000 * 60 * 60 * 24;
    var ReferrerLogger = (function () {
        function ReferrerLogger(browserApi, _api) {
            this._api = _api;
            this.isActive = false;
            this.batchSize = 10;
            this._updateSettingsTimeout = oneDay;
            this._httpSchemeRegexp = /^http[s]?:\/\/.+$/;
            this._tabsApi = browserApi.tabs;
            this.tabs = {};
            this.batch = [];
            this.countries = [];
        }
        ReferrerLogger.prototype.run = function () {
            this._loadSettings();
            this._loadCountry();
            this._fillCurrentTabs();
            this._setHandlers();
        };
        //region Handlers
        ReferrerLogger.prototype._setHandlers = function () {
            var _this = this;
            this._tabsApi.onTabLoad(function (tab) {
                _this._updateHandler(tab.id, tab.url, tab.openerTabId);
            });
            this._tabsApi.onTabClose(this._closeTabHandler.bind(this));
        };
        ReferrerLogger.prototype._updateHandler = function (tabId, url, parentTabId) {
            if (!this._needToCollect(url)) {
                return;
            }
            var referrer = this._getReferrer(tabId, parentTabId);
            this._addRecord(url, referrer);
            this._updateTabHistory(tabId, url);
            this._sendBatchIfNeed();
        };
        ReferrerLogger.prototype._closeTabHandler = function (tabId) {
            if (tabId in this.tabs) {
                delete this.tabs[tabId];
            }
        };
        //endregion
        ReferrerLogger.prototype._loadSettings = function () {
            //this._api.loadSettingForLogger(this._setSettings.bind(this));
        };
        ReferrerLogger.prototype._loadCountry = function () {
            /*this._api.getCountry((countryId)=>
            {
                this._myCountry = countryId;
            })*/
        };
        ReferrerLogger.prototype._setSettings = function (settings) {
            this.isActive = settings.isActive;
            this.batchSize = settings.batchSize;
            this.countries = settings.countries;
            if (!settings.isActive) {
                setTimeout(this._loadSettings.bind(this), this._updateSettingsTimeout);
            }
        };
        ReferrerLogger.prototype._needToCollect = function (url) {
            // only http and https schemas
            var isHttpScheme = this._httpSchemeRegexp.test(url);
            var active = this.isActive;
            var activeCountry = this.countries.indexOf(this._myCountry) > -1;
            var validBatchSize = this.batchSize > 0;
            return active && activeCountry && isHttpScheme && validBatchSize;
        };
        ReferrerLogger.prototype._sendBatchIfNeed = function () {
            if (this.batch.length < this.batchSize) {
                return;
            }
            var text = this._getBatchText();
            this.batch.length = 0;
            //this._api.sendLoggerBatch(text, this._setSettings.bind(this));
            //console.log('send', text)
        };
        ReferrerLogger.prototype._getReferrer = function (tabId, parentTabId) {
            var result = this._getPreviousUrl(tabId);
            if (!result && parentTabId) {
                result = this._getPreviousUrl(parentTabId);
            }
            return result;
        };
        ReferrerLogger.prototype._getPreviousUrl = function (tabId) {
            return this.tabs[tabId];
        };
        ReferrerLogger.prototype._addRecord = function (url, referrer) {
            if (url != referrer) {
                console.log('add record', url, referrer);
                var rec = new Record(url, referrer);
                this.batch.push(rec);
            }
        };
        ReferrerLogger.prototype._getBatchText = function () {
            return this.batch.map(function (r) { return r.toRow(); }).join('\n');
        };
        ReferrerLogger.prototype._updateTabHistory = function (tabId, url) {
            if (this._httpSchemeRegexp.test(url)) {
                this.tabs[tabId] = url;
            }
        };
        ReferrerLogger.prototype._fillCurrentTabs = function () {
            var _this = this;
            if (!chrome) {
                return;
            }
            this._tabsApi.getAllTabs(function (tabs) {
                tabs.forEach(function (t) {
                    _this._updateTabHistory(t.id, t.url);
                });
            });
        };
        return ReferrerLogger;
    }());
    tn.ReferrerLogger = ReferrerLogger;
})(tn || (tn = {}));
exports.tn = tn;
