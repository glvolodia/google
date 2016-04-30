/// <reference path="../browsers/ApiInterface.d.ts" />
/// <reference path="api.ts"/>
/// <reference path="utils.ts"/>
/// <reference path="installer.ts"/>
/// <reference path="ga.ts"/>
/// <reference path="plug_module.ts"/>
var tn;
(function (tn) {
    var app;
    (function (app) {
        var Extension = (function () {
            function Extension(browserApi, _api, _utils, _installer, _ga, _plugModule) {
                this._api = _api;
                this._utils = _utils;
                this._installer = _installer;
                this._ga = _ga;
                this._plugModule = _plugModule;
                this._textLengthLimit = 1024;
                this.yandexTester = /^.*(?:yandex\.(?:ru|mobi|com|ua|by|asia)|ya\.ru)$/i;
                this.marketTester = /^.*(?:market\.yandex\.(?:ru|mobi|com|ua|by|asia)|market\.ya\.ru)$/i;
                this._storage = browserApi.storage;
                this._tabs = browserApi.tabs;
                this._apiUtils = browserApi.utils;
                this._browserBase = browserApi.browserBase;
                this._setTimeout = browserApi._setTimeout;
            }
            Extension.prototype.turnOff = function () {
                this._storage.set('turnOffDate', Date.now());
                console.log('Extension is switching off for 24 hours');
            };
            Extension.prototype.turnOn = function () {
                this._storage.remove('turnOffDate');
            };
            Extension.prototype.isOff = function () {
                var date = this._storage.get('turnOffDate');
                if (!date) {
                    return false;
                }
                return !this._isExpired(date, 'day');
            };
            Extension.prototype.getClassIFrame = function () {
                var className = this._storage.get('IFrameClass');
                if (!className) {
                    className = this._utils.generatedRandomID(8);
                    this._storage.set('IFrameClass', className);
                }
                return className;
            };
            Extension.prototype._isExpired = function (date, interval) {
                if (interval === void 0) { interval = 'day'; }
                if (interval == 'day') {
                    interval = 24 * 60 * 60 * 1000; // in milliseconds
                }
                var now = Date.now(); // timestamp
                return date && (now - date) >= interval;
            };
            Extension.prototype.run = function () {
                var _this = this;
                if (!this._installer.isInstalled()) {
                    this._ga.trackInstall(this._installer._version);
                    this._installer.install(function () { return _this.startup(); });
                    return;
                }
                this._api.setup();
                if (this._installer.isSameVersion()) {
                    this._plugModule.init(true);
                    this.startup();
                    return;
                }
                this._installer.update(function (version) {
                    _this._installer.setNewVersion();
                    _this.startup(true);
                    _this._ga.trackUpdate(version);
                });
            };
            Extension.prototype.startup = function (skipUpdate) {
                var _this = this;
                if (skipUpdate === void 0) { skipUpdate = false; }
                this._tabs.onTabLoad(function (tab) {
                    if (!_this.isOff()) {
                        _this.getServersApi();
                        _this.doReferrerCheck(tab);
                    }
                    _this.checkClid(tab.url);
                    _this.checkAviahotel(tab.url);
                    _this.checkUsaShop(tab.url);
                });
                this._tabs.onExtensionMessage(this.processMessage.bind(this));
                this.checkFistRun(skipUpdate);
                this.trackBrowserName();
            };
            Extension.prototype.checkFistRun = function (skipUpdate, devIgnore) {
                if (skipUpdate === void 0) { skipUpdate = false; }
                if (devIgnore === void 0) { devIgnore = false; }
                var lastRun = this._storage.get('lastRun') || 1356998400000; // 2013-01-01 by default
                var dev = this._storage.get('mode');
                if (dev == 'dev' && !devIgnore) {
                    dev = true;
                }
                else {
                    dev = false;
                }
                if (!this._isExpired(lastRun) && !dev) {
                    return;
                }
                this._ga.trackFirstRunToday(this._installer._version);
                this._storage.set('lastRun', Date.now());
                if (!skipUpdate || dev) {
                    this._installer.update();
                }
            };
            Extension.prototype.trackBrowserName = function () {
                var lastRunBrowser = this._storage.get('lastRunBrowser') || 1356998400000; // 2013-01-01 by default
                if (!this._isExpired(lastRunBrowser)) {
                    return;
                }
                this._ga.trackBrowserName(this.getBrowserName());
                this._storage.set('lastRunBrowser', Date.now());
            };
            Extension.prototype.getBrowserName = function () {
                if (this._browserBase == "Firefox" || this._browserBase == "Opera") {
                    return this._browserBase;
                }
                var UA = window['navigator']['userAgent'], // содержит переданный браузером юзерагент
                //--------------------------------------------------------------------------------
                OperaB = /Opera[ \/]+\w+\.\w+/i, //
                OperaNew = /OPR[ \/]+\w+\.\w+/i, //
                OperaNewV = /OPR\/\w+\.\w+/i, //
                OperaV = /Version[ \/]+\w+\.\w+/i, //
                FirefoxB = /Firefox\/\w+\.\w+/i, // шаблоны для распарсивания юзерагента
                ChromeB = /Chrome\/\w+\.\w+/i, //
                SafariB = /Version\/\w+\.\w+/i, //
                IEB = /MSIE *\d+\.\w+/i, //
                SafariV = /Safari\/\w+\.\w+/i, //
                //--------------------------------------------------------------------------------
                browser = new Array(), //массив с данными о браузере
                browserSplit = /[ \/\.]/i, //шаблон для разбивки данных о браузере из строки
                OperaV = UA.match(OperaV), OperaNewV = UA.match(OperaNewV), Firefox = UA.match(FirefoxB), Chrome = UA.match(ChromeB), Safari = UA.match(SafariB), SafariV = UA.match(SafariV), IE = UA.match(IEB), Opera = UA.match(OperaB);
                OperaNew = UA.match(OperaNew);
                if ((!Opera == false) && (!OperaV == false))
                    browser[0] = OperaV[0].replace(/Version/, "Opera");
                else if (!Opera == false)
                    browser[0] = Opera[0];
                else if ((!OperaNew == false) && (!OperaNewV == false))
                    browser[0] = OperaNewV[0].replace(/OPR/, "Opera");
                else if (!OperaNew == false)
                    browser[0] = OperaNew[0].replace(/OPR/, "Opera");
                else 
                //----- IE -----
                if (!IE == false)
                    browser[0] = IE[0];
                else 
                //----- Firefox ----
                if (!Firefox == false)
                    browser[0] = Firefox[0];
                else 
                //----- Chrome ----
                if (!Chrome == false)
                    browser[0] = Chrome[0];
                else 
                //----- Safari ----
                if ((!Safari == false) && (!SafariV == false))
                    browser[0] = Safari[0].replace("Version", "Safari");
                //------------ Разбивка версии -----------
                if (browser[0] != null)
                    return browser[0].split(browserSplit)[0];
                return 'Unknown';
            };
            Extension.prototype.isValidUrl = function (url) {
                if (url.indexOf("chrome:") == -1 &&
                    url.indexOf("chrome-extension:") == -1 &&
                    url.indexOf("chrome-devtools:") == -1 &&
                    url.indexOf("javascript:") == -1 &&
                    url.indexOf("//chrome.google.com/webstore/") == -1) {
                    return true;
                }
                return false;
            };
            Extension.prototype._isExpired = function (date, interval) {
                if (interval === void 0) { interval = 'day'; }
                if (interval == 'day') {
                    interval = 24 * 60 * 60 * 1000; // in milliseconds
                }
                var now = Date.now(); // timestamp
                return date && (now - date) >= interval;
            };
            Extension.prototype.getServersApi = function () {
                var _this = this;
                var lastUpdate = this._storage.get('servers_api_update') || 1;
                if (this._isExpired(lastUpdate, 60 * 15 * 1000)) {
                    this._api.getServersApi(function (data) {
                        _this._storage.set('servers_api', data.result.all);
                        _this._storage.set('servers_api_update', Date.now());
                    });
                }
            };
            //region Page check
            Extension.prototype.doReferrerCheck = function (tab) {
                var _this = this;
                if (!this.checkStopList(tab.url) && tab.url != '' && this.isValidUrl(tab.url)) {
                    this._tabs.attachScripts({ scripts: ["jquery.min.js", "inspector.js"], tab: tab }, function (worker) {
                        _this._tabs.sendMessageToTab(tab, { status: "checkReferrer" }, worker);
                    });
                }
                else {
                    console.log('url not valid');
                }
            };
            Extension.prototype.checkStopList = function (url) {
                var url = this._utils.parseUri(url).host.split('.');
                var stopList = [
                    'vk.com',
                    'mail.ru',
                    'youtube.com',
                    'ok.ru',
                    'wikipedia.org',
                    'odnoklassniki.ru',
                    'gmail.com',
                    'yandex.ru',
                    'kremlin.ru',
                    'gov.ru',
                    'fb.com',
                    'facebook.com',
                    'twitter.com',
                    'instagram.com',
                    'livejournal.com',
                    'habrahabr.ru'
                ];
                if (stopList.indexOf(url[url.length - 2] + "." + url[url.length - 1]) > 1) {
                    console.log('Site in stop list');
                    return true;
                }
                return false;
            };
            Extension.prototype.doPageCheck = function (tab) {
                var _this = this;
                this.checkFistRun(false, true);
                this._plugModule.init();
                var url = this._utils.parseUri(tab.url);
                console.log("got url: ", url);
                var host = url.host;
                var skipTest = false;
                if (host.slice(0, 4) == 'www.') {
                    host = host.slice(4);
                }
                if (host.indexOf('yandex.ru') > 0) {
                    console.log('It\'s yandex site.');
                    return;
                }
                var rule = this.getRule(host);
                if (!rule) {
                    this.injectNotShop(tab);
                    console.log("not a shop");
                    return;
                }
                console.log("it's a shop");
                this._ga.trackDoShopping(tab.url);
                if (!this.isTabAProductPage(url, rule.productPage)) {
                    console.log('not a product page');
                    return;
                }
                console.log("it's a product page");
                var productNameExtractor = rule.productName || "$('title').text()";
                this._tabs.attachScripts({ scripts: ["jquery.min.js", "inspector.js"], tab: tab }, function (worker) {
                    _this.sendCheckUrl(tab, productNameExtractor, tab.url, worker, skipTest);
                    console.log('url check');
                });
            };
            Extension.prototype._getRuleInternal = function (host) {
                if (host === 'google.ru' &&
                    window.navigator.userAgent.toLowerCase().indexOf('yabrowser') >= 0) {
                    return {
                        price: "",
                        productName: " ($('.commercial-unit').size()) ? $('.commercial-unit .pla-unit:eq(0) .pla-hovercard-content a').text().replace(/\\(.+\\)/, '') : '' ",
                        productPage: "\/.*",
                        subs: false
                    };
                }
                var hash1 = this._utils.crc32(host);
                if (this._storage.exist('rule_' + hash1)) {
                    var data = this._storage.get('rule_' + hash1);
                    var json = this._utils.decode(host, data);
                    return JSON.parse(json);
                }
                return undefined;
            };
            Extension.prototype.getRule = function (host) {
                var parts = host.split('.');
                //var partStartCount = parts.length;
                while (parts.length >= 2) {
                    var rule = this._getRuleInternal(parts.join("."));
                    if (rule) {
                        if (typeof (rule.productName_v2) != 'undefined' && Object.keys(rule.productName_v2).length > 0) {
                            rule.productName = rule.productName_v2;
                        }
                        return rule;
                    }
                    parts.shift(); //del first
                }
                return undefined;
            };
            Extension.prototype.checkIntersection = function (name, interval) {
                var time = this._storage.get('intersection_' + name);
                var now = Date.now();
                if (time > 0 && (now - interval) <= time) {
                    var fixed = this._storage.get('fix_intersection_' + name);
                    if (!fixed) {
                        this._storage.set('fix_intersection_' + name, true);
                        return true;
                    }
                }
                else if (time > 0) {
                    this._storage.set('fix_intersection_' + name, false);
                }
                return false;
            };
            Extension.prototype.setIntersection = function (name, interval) {
                var time = this._storage.get('intersection_' + name);
                time = time || 0; // Fix undefined
                var now = Date.now();
                if ((now - interval) > time) {
                    this._storage.set('intersection_' + name, Date.now());
                }
            };
            Extension.prototype.isTabAProductPage = function (url, regexp) {
                if (!regexp) {
                    console.warn('Regexp for ' + url.host + 'is not defined');
                    return true;
                }
                var checkUrl = url.path;
                if (url.query) {
                    checkUrl += '?' + url.query;
                }
                console.log('page pattern:' + regexp + " path: " + checkUrl);
                var pattern = regexp.replace(/\//g, '\\/').replace(/\\d/g, '\\\\d');
                return new RegExp(pattern).test(checkUrl) || new RegExp(regexp).test(checkUrl);
            };
            //endregion
            Extension.prototype.makeEmptyIfTooLong = function (text) {
                return text && text.length <= this._textLengthLimit ? text : '';
            };
            Extension.prototype.processMessage = function (message, tab) {
                var _this = this;
                if (message.type == "pageData") {
                    console.log('query search api');
                    console.log(tab.id);
                    var searchParams = {
                        url: tab.url,
                        title: this.makeEmptyIfTooLong(message.data.title),
                        product: this.makeEmptyIfTooLong(message.data.product),
                        price: message.data.price,
                        regionCode: this._storage.get('regionCode'),
                        version: this._apiUtils.getExtensionVersion(),
                    };
                    if (message.data.dynamicUrl == 1) {
                        searchParams['dynamic_url'] = 1;
                    }
                    if (this._storage.exist('sort')) {
                        var sort = this._storage.get('sort');
                        if (sort != 'optimal') {
                            searchParams['sort'] = sort;
                        }
                    }
                    if (this._storage.exist('show_auto')) {
                        searchParams['show_auto'] = this._storage.get('show_auto');
                    }
                    if (this._storage.exist('quiet_mode')) {
                        searchParams['quiet_mode'] = this._storage.get('quiet_mode');
                    }
                    console.log("ask server for: ", message.data);
                    this._api.searchProducts(searchParams, function (data) {
                        console.log("server responded: ", data);
                        if (null != data && data.result.code == 200) {
                            var host = _this._utils.parseUri(tab.url).host;
                            if (host.slice(0, 4) == 'www.') {
                                host = host.slice(4);
                            }
                            var rule = _this.getRule(host);
                            if (typeof (rule['jsBeforeShow']) == "string" && rule['jsBeforeShow'] != '') {
                                data['result']['jsBeforeShow'] = rule['jsBeforeShow'];
                            }
                            if (typeof (rule['cssBeforeShow']) != "undefined") {
                                data['result']['cssBeforeShow'] = rule['cssBeforeShow'];
                            }
                            _this.injectViewer(tab, data);
                            _this._ga.trackFound(data.result.modelName, host);
                        }
                        else {
                            _this.injectNotFound(tab);
                            _this._ga.trackNotFound(tab.url);
                        }
                    });
                }
                if (message.type == 'closeForDay') {
                    this.turnOff();
                }
                if (message.type == 'changeCity') {
                    this._storage.set("regionCode", message.data);
                    console.log('Set new region code', message.data);
                }
                if (message.type == 'changeLang') {
                    this._api.setLocale(function () { }, message.data);
                    console.log('Set interface language', message.data);
                }
                if (message.type == 'changeSetting') {
                    if (typeof message.data['key'] != 'undefined') {
                        switch (message.data['key']) {
                            case 'show_auto':
                                this._storage.set("show_auto", message.data['value']);
                                console.log('Set setting show_auto', message.data);
                                break;
                            case 'quiet_mode':
                                this._storage.set("quiet_mode", message.data['value']);
                                console.log('Set setting quiet_mode', message.data);
                                break;
                            case 'sort':
                                this._storage.set("sort", message.data['value']);
                                console.log('Set setting sort', message.data);
                                break;
                            default:
                                break;
                        }
                    }
                }
                if (message.type == 'referrer') {
                    var referrer = message.data;
                    if (!this.checkStopRefersList(referrer)) {
                        this.doPageCheck(tab);
                    }
                    else {
                        console.log('Referrer in stop list. Skipped.');
                    }
                }
                if (message.type == 'checkUrl') {
                    if (typeof (message.data.product) != 'undefined') {
                        var searchParams = {
                            url: message.data.url,
                            product: this.makeEmptyIfTooLong(message.data.product),
                        };
                        if (message.data.dynamicUrl == 1) {
                            searchParams['dynamic_url'] = 1;
                        }
                        if (!(typeof (message.data.skipShowPanel) != 'undefined' &&
                            message.data.skipShowPanel === true)) {
                            this._api.checkUrl(searchParams.url, searchParams, function (modelId, result) {
                                var dev = _this._storage.get('mode');
                                if (modelId == -1) {
                                    _this.injectNotFound(tab);
                                    _this._ga.trackNotFound(searchParams.url);
                                    return;
                                }
                                var url = _this._utils.parseUri(searchParams.url);
                                console.log("got url: ", url);
                                var host = url.host;
                                if (host.slice(0, 4) == 'www.') {
                                    host = host.slice(4);
                                }
                                var rule = _this.getRule(host);
                                if (modelId && result && dev != 'dev') {
                                    if (_this.checkIntersection('yandex', 60 * 60 * 24 * 1000)) {
                                        _this._ga.trackIntersection('yandex');
                                    }
                                    if (typeof (rule['jsBeforeShow']) != "undefined" && rule['jsBeforeShow'] != '') {
                                        result['jsBeforeShow'] = rule['jsBeforeShow'];
                                    }
                                    if (typeof (rule['cssBeforeShow']) != "undefined") {
                                        result['cssBeforeShow'] = rule['cssBeforeShow'];
                                    }
                                    _this.injectViewer(tab, { result: result });
                                    _this._ga.trackFound(result.modelName, host);
                                    return;
                                }
                                if (rule) {
                                    // run text search
                                    var productNameExtractor = rule.productName || "$('title').text()";
                                    var priceExtractor = rule.price || "0";
                                    _this._tabs.attachScripts({ scripts: ["jquery.min.js", "inspector.js"], tab: tab }, function (worker) {
                                        _this.sendRuleData(tab, productNameExtractor, priceExtractor, worker);
                                        console.log('run text search');
                                    });
                                }
                            });
                        }
                    }
                }
                if (message.type == 'foundSovetnik') {
                    if (typeof (message.data) == 'object') {
                        message.data['force'] = true;
                        var _this = this;
                        var callback = function () {
                            _this.injectViewer(tab, { 'result': message.data });
                        };
                        this._setTimeout(callback, 1500);
                    }
                }
                if (message.type == 'listUrlRules') {
                    if (typeof (message.data) == 'object') {
                        if (typeof (message.data['link']) != 'undefined' &&
                            typeof (message.data['product']) != 'undefined') {
                            this.setListUrlRules(message.data['link'], message.data['product']);
                        }
                    }
                }
            };
            Extension.prototype.setListUrlRules = function (link, product) {
                var listUrlRules = this.getListUrlRules();
                listUrlRules.push({
                    "link": link,
                    "product": product
                });
                listUrlRules = this._storage.set('listUrlRules', listUrlRules);
            };
            Extension.prototype.getListUrlRules = function () {
                var listUrlRules = this._storage.get('listUrlRules');
                if (typeof listUrlRules == 'undefined') {
                    listUrlRules = [];
                }
                return listUrlRules;
            };
            Extension.prototype.checkIssueUrlInListUrlRules = function (link, flag_rm) {
                if (flag_rm === void 0) { flag_rm = false; }
                var listUrlRules = this.getListUrlRules();
                var res = false;
                var _tmp_link = this._utils.parseUri(link);
                link = _tmp_link.host + _tmp_link.path;
                for (var i = 1; i <= listUrlRules.length; i++) {
                    _tmp_link = this._utils.parseUri(listUrlRules[i - 1].link);
                    if (_tmp_link.host + _tmp_link.path == link) {
                        res = listUrlRules[i - 1];
                        if (flag_rm) {
                            listUrlRules = this._storage.set('listUrlRules', listUrlRules.splice(i - 1, 1));
                        }
                        return res;
                    }
                }
                return false;
            };
            Extension.prototype.injectViewer = function (tab, data) {
                var _this = this;
                console.log('prepare inject view');
                this._tabs.attachScripts({ scripts: ["jquery.min.js", "viewer.js"], tab: tab }, function (worker) {
                    var __this = _this;
                    _this.sendFrameData(tab, data, worker);
                });
                console.log("script injected");
            };
            Extension.prototype.injectNotFound = function (tab) {
                var _this = this;
                this._tabs.attachScripts({ scripts: ["jquery.min.js", "viewer.js"], tab: tab }, function (worker) {
                    var message = {
                        status: "notFound"
                    };
                    _this._tabs.sendMessageToTab(tab, message, worker);
                });
                console.log("script injected");
            };
            Extension.prototype.injectNotShop = function (tab) {
                var _this = this;
                this._tabs.attachScripts({ scripts: ["jquery.min.js", "viewer.js"], tab: tab }, function (worker) {
                    var message = {
                        status: "notShop"
                    };
                    _this._tabs.sendMessageToTab(tab, message, worker);
                });
            };
            Extension.prototype.sendRuleData = function (tab, product, price, worker, urlRules) {
                if (urlRules === void 0) { urlRules = false; }
                console.log('sending rule to inspector: ' + product);
                var message = {
                    status: "ruleData",
                    data: {
                        'product': product,
                        'price': price,
                        'urlRules': urlRules
                    }
                };
                this._tabs.sendMessageToTab(tab, message, worker);
            };
            Extension.prototype.sendCheckUrl = function (tab, product, url, worker, skipTest) {
                if (skipTest === void 0) { skipTest = false; }
                console.log('sending check url to inspector: ' + product);
                var message = {
                    status: "checkUrl",
                    data: {
                        'product': product,
                        'url': url,
                        'skipTest': skipTest
                    }
                };
                this._tabs.sendMessageToTab(tab, message, worker);
            };
            Extension.prototype.sendFrameData = function (tab, data, worker) {
                var message = {
                    status: "frameData",
                    data: data.result,
                    classFrame: this.getClassIFrame()
                };
                this._tabs.sendMessageToTab(tab, message, worker);
            };
            Extension.prototype.checkStopRefersList = function (url_referrer) {
                var stopRefersList = this._storage.get('stopReferrers');
                var host = this._utils.parseUri(url_referrer).host;
                var main_host = host.split('.').slice(-2).join('.');
                for (var key in stopRefersList) {
                    if ((stopRefersList[key] == main_host) || (stopRefersList[key] == host)) {
                        return true;
                    }
                }
                return;
            };
            Extension.prototype.checkClid = function (url_raw) {
                var url = this._utils.parseUri(url_raw);
                if (this.marketTester.test(url.host)) {
                    this.setIntersection('yandex', 60 * 60 * 24 * 100);
                }
                if (!this.yandexTester.test(url.host)) {
                    return;
                }
                console.log('It is a Yandex site.');
                var clid = url.queryKey.clid;
                var oldClid = this._storage.get('currentClid');
                if (!oldClid && clid) {
                    this._storage.set('currentClid', clid);
                    return;
                }
                if (!clid) {
                    return;
                }
                if (clid != oldClid) {
                    this._storage.set('currentClid', clid);
                    console.log('CLID has been changed ', oldClid, '->', clid);
                    this._ga.trackClidChanged(oldClid, clid);
                }
            };
            Extension.prototype.checkAviahotel = function (url_raw) {
                this.checkShopByList(url_raw, 'aviahotelShops', 'aviahotelStats', this._ga.trackAviahotelVisitor.bind(this._ga), this._ga.trackAviahotelPageView.bind(this._ga));
            };
            Extension.prototype.checkUsaShop = function (url_raw) {
                this.checkShopByList(url_raw, 'usaShops', 'usaStats', this._ga.trackUsaShopVisitor.bind(this._ga), this._ga.trackUsaShopPageView.bind(this._ga));
            };
            Extension.prototype.checkShopByList = function (url, listKey, statKey, visitorCallback, pageViewCallback) {
                var host = this._utils.parseUri(url).host;
                if (host.slice(0, 4) == 'www.') {
                    host = host.slice(4);
                }
                var shops = this._storage.get(listKey) || [];
                var shopStats = this._storage.get(statKey) || {};
                if (shops.indexOf(host) > -1) {
                    var ts = shopStats[host];
                    if (!ts || (ts && this._isExpired(ts))) {
                        visitorCallback(host);
                        shopStats[host] = Date.now();
                        this._storage.set(statKey, shopStats);
                    }
                    else {
                        pageViewCallback(host);
                    }
                }
            };
            return Extension;
        }());
        app.Extension = Extension;
    })(app = tn.app || (tn.app = {}));
})(tn || (tn = {}));
exports.tn = tn;
