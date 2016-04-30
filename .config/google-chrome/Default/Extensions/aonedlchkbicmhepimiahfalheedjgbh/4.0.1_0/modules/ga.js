/// <reference path="../browsers/ApiInterface.d.ts" />
/// <reference path="utils.ts" />
var tn;
(function (tn) {
    var GoogleAnalytics = (function () {
        function GoogleAnalytics(browserApi, _utils) {
            this._utils = _utils;
            //        private _clidCode = 'UA-7675869-46';//hamstersoft
            //        private _code = 'UA-39042957-4'; //tutnedorogo
            //
            this._clidCode = 'UA-7675869-46';
            this._intersectionCode = 'UA-39042957-16';
            this._ad_code = 'UA-39042957-11';
            this._code = 'UA-39042957-4';
            this._statCode = 'UA-39042957-22';
            this._code_new = 'UA-74524137-1';
            this._metka = 'pomoshnik';
            this._apiUtils = browserApi.utils;
            this._storage = browserApi.storage;
        }
        GoogleAnalytics.prototype._track = function (path) {
            if (!path) {
                console.error('path for tracking is not defined!');
                return;
            }
            var country = this._storage.get('country_code') || 'ru';
            // удаляем пробелы и все спецсимволы (кроме "/.-_") и добавляем корень /Results/
            var _old_path = country + '/' + path.replace(/[^\wа-я\/\.\-_ ]/ig, '');
            this._apiUtils.trackInGA(this._code, _old_path, 'main', this._storage.get("user_id"));
            console.log('GA: TRACK[' + _old_path + ']');
        };
        GoogleAnalytics.prototype._track_event = function (action, label) {
            if (!label) {
                console.error('label for tracking event is not defined!');
                return;
            }
            this._apiUtils.trackEventInGA(this._code_new, action, label, 'main_new', this._storage.get("user_id"));
            console.log('GA: TRACK_EVENT[' + action + ':' + label + ']');
        };
        GoogleAnalytics.prototype._getCurrentDate = function () {
            var pad = function (number) {
                number = '' + number;
                return number.length == 2 ? number : '0' + number;
            };
            var dt = new Date();
            var year = dt.getUTCFullYear();
            var month = dt.getUTCMonth() + 1;
            var day = dt.getDate();
            return year + '-' + pad(month) + '-' + pad(day);
        };
        GoogleAnalytics.prototype.trackInstall = function (version) {
            this._track('Install/' + version);
            var path = this._metka + '/Install/' + version;
            this._apiUtils.trackInGA(this._ad_code, path, 'ad');
            this._track_event('Install', version);
        };
        GoogleAnalytics.prototype.trackIntersection = function (name) {
            this._apiUtils.trackInGA(this._intersectionCode, '/Intersection/' + name, 'intersection');
            this._track_event('Intersection', name);
        };
        GoogleAnalytics.prototype.trackFirstRunToday = function (version) {
            this._track('FirstRunToday/' + version);
            var path = this._metka + '/FirstRunToday/' + version;
            this._apiUtils.trackInGA(this._ad_code, path, 'ad');
            this._track_event('FirstRunToday', version);
        };
        GoogleAnalytics.prototype.trackDoShopping = function (url) {
            var host = this._utils.parseUri(url).host;
            host = host.match(/^(www\.)?(.+?)$/)[2]; // trim www
            if (host == 'google.ru' || host == 'yandex.ru')
                return;
            this._apiUtils.trackInGA(this._statCode, 'DoShopping/' + host, 'stat');
            this._track_event('DoShopping', host);
        };
        GoogleAnalytics.prototype.trackBrowserName = function (browser) {
            this._apiUtils.trackInGA(this._statCode, 'BrowserName/' + browser, 'stat');
            this._track_event('BrowserName', browser);
        };
        GoogleAnalytics.prototype.trackRequestSent = function (title) {
            this._track('SearchRequest/' + title);
            this._track_event('SearchRequest', title);
        };
        GoogleAnalytics.prototype.trackFound = function (model, host) {
            this._track('Found/' + host + '/' + model);
            this._track_event('Found', host + '/' + model);
        };
        GoogleAnalytics.prototype.trackNotFound = function (url) {
            this._track('NotFound/' + url);
            this._track_event('NotFound', url);
        };
        GoogleAnalytics.prototype.trackUpdate = function (version) {
            this._track('Update/' + version + '/' + this._getCurrentDate());
            this._track_event('Update', version);
        };
        GoogleAnalytics.prototype.trackClidChanged = function (oldClid, newClid) {
            var path = 'ClidChanged/' + oldClid + '/' + newClid;
            this._apiUtils.trackInGA(this._clidCode, path, 'clid');
            this._track_event('ClidChanged', oldClid + '/' + newClid);
        };
        GoogleAnalytics.prototype.trackAviahotelPageView = function (host) {
            this._track('AviaHotels/PageView/' + host);
            this._track_event('AviaHotels/PageView', host);
        };
        GoogleAnalytics.prototype.trackAviahotelVisitor = function (host) {
            this._track('AviaHotels/Visitors/' + host);
            this._track_event('AviaHotels/Visitors', host);
        };
        GoogleAnalytics.prototype.trackUsaShopPageView = function (host) {
            this._track('UsaShops/PageView/' + host);
            this._track_event('UsaShops/PageView/', host);
        };
        GoogleAnalytics.prototype.trackUsaShopVisitor = function (host) {
            this._track('UsaShop/Visitors/' + host);
            this._track_event('UsaShops/PageView/', host);
        };
        return GoogleAnalytics;
    }());
    tn.GoogleAnalytics = GoogleAnalytics;
})(tn || (tn = {}));
exports.tn = tn;
