/// <reference path="../browsers/interfaces/jquery.d.ts" />
/// <reference path="../browsers/interfaces/chrome.d.ts" />
/// <reference path="../browsers/interfaces/opera.d.ts" />
var _this = this;
(function () {
    var isChrome = !!_this.chrome;
    var isOpera = !!_this.opera;
    var global = _this;
    if (global.smbInspectorInitialized) {
        return;
    }
    global.smbInspectorInitialized = true;
    function getName(data, id) {
        var res = '';
        if (isOpera) {
            this['$'] = window['$'];
        }
        if (id < 1) {
            id = 0;
        }
        if (data['mode']['isDifficult'] && Object.keys(data['expertReq']).length > 0 && data['expertReq'][id]['if']['query']) {
            if (global['$'](data['expertReq'][id]['if']['query']).size()) {
                if (typeof (data['expertReq'][id]['then']['link']) != 'undefined' &&
                    typeof (data['expertReq'][data['expertReq'][id]['then']['link']]) != 'undefined') {
                    res = getName(data, data['expertReq'][id]['then']['link']);
                }
                else {
                    res = '';
                    if (typeof (data['expertReq'][id]['then']['query']) != "undefined" &&
                        data['expertReq'][id]['then']['query'].length) {
                        res = global['$'](data['expertReq'][id]['then']['query']).text().trim();
                    }
                }
            }
            else {
                if (typeof (data['expertReq'][id]['else']['link']) != 'undefined' &&
                    typeof (data['expertReq'][data['expertReq'][id]['else']['link']]) != 'undefined') {
                    res = getName(data, data['expertReq'][id]['else']['link']);
                }
                else {
                    res = '';
                    if (typeof (data['expertReq'][id]['else']['query']) != "undefined" &&
                        data['expertReq'][id]['else']['query'].length) {
                        res = global['$'](data['expertReq'][id]['else']['query']).text().trim();
                    }
                }
            }
        }
        else if (!data['mode']['isDifficult']) {
            for (var index_el in data['simpleReq']) {
                res = res + ' ' + global['$'](data['simpleReq'][index_el]['name']).text().trim();
            }
        }
        return res;
    }
    function replaceInName(data, res) {
        if (typeof (data['replaceCondition']) != "undefined" &&
            typeof (res) == 'string') {
            for (var index_el in data['replaceCondition']) {
                if (typeof (data['replaceCondition'][index_el]['target']) == "string" &&
                    typeof (data['replaceCondition'][index_el]['text']) == "string") {
                    res = res.replace(new RegExp(data['replaceCondition'][index_el]['target'], 'g'), data['replaceCondition'][index_el]['text']);
                }
            }
        }
        else {
            res = '';
        }
        return res.trim();
    }
    function processMessage(message) {
        if (message.status == "ruleData") {
            console.log("rule: " + message.data);
            var skipCheckActive = 0;
            if (typeof (message.data.urlRules) != 'undefined'
                && message.data.urlRules === true) {
                var product = message.data.product;
                var price = message.data.price;
                skipCheckActive = 2;
            }
            else {
                var price = 0;
                if (typeof (message.data.product) != 'undefined' &&
                    Object.keys(message.data.product).length > 0) {
                    var product = replaceInName(message.data.product, getName(message.data.product, 0));
                }
                else {
                    console.log('Not extract name product, new method.');
                }
            }
            var title = global['$']('title').text();
            if (window.location.host == 'www.google.ru') {
                var title = global['$']('#gbqfq').val();
            }
            var dynamicUrl = 0;
            if (window.location.protocol != 'https:') {
                dynamicUrl = 1;
            }
            if (product) {
                console.log("product name is: " + product);
                sendMessageToExtension('pageData', {
                    product: product,
                    price: price,
                    title: title,
                    dynamicUrl: dynamicUrl,
                    skipCheckActive: skipCheckActive
                });
            }
            else {
                console.warn('product name isn`t found!');
            }
        }
        else if (message.status == 'checkReferrer') {
            sendMessageToExtension('referrer', global.document.referrer);
        }
        else if (message.status == 'checkUrl') {
            var dynamicUrl = 0;
            if (window.location.protocol != 'https:') {
                dynamicUrl = 1;
            }
            if (typeof (message.data.skipTest) == 'undefined') {
                message.data['skipTest'] = false;
            }
            if (message.data.skipTest) {
                sendMessageToExtension('checkUrl', {
                    product: message.data.product,
                    url: message.data.url,
                    dynamicUrl: dynamicUrl,
                    urlRule: true
                });
                return;
            }
            var product = replaceInName(message.data.product, getName(message.data.product, 0));
            if (product) {
                console.log("product name is: " + product);
                sendMessageToExtension('checkUrl', {
                    product: product,
                    url: message.data.url,
                    dynamicUrl: dynamicUrl
                });
            }
            else {
                console.warn('product name isn`t found!');
            }
        }
    }
    function inspectorListener(msg) {
        try {
            var data = JSON.parse(msg.data);
        }
        catch (e) {
            return;
        }
        if (typeof data.action != 'undefined') {
            sendMessageToExtension(data.action, data.data);
        }
    }
    function sendMessageToExtension(type, data) {
        var msg = {
            type: type,
            data: data
        };
        if (isChrome) {
            this.chrome.extension['sendMessage'](msg);
        }
        else if (isOpera) {
            opera.extension.postMessage(msg);
        }
        else {
            // firefox
            self.postMessage(msg, null, null);
        }
    }
    if (isChrome) {
        _this.chrome.extension.onMessage.addListener(processMessage);
    }
    else if (isOpera) {
        opera.extension.addEventListener('message', function (event) {
            processMessage(event.data);
        });
    }
    else {
        //firefox
        self['on']('message', processMessage);
    }
    window.addEventListener("message", inspectorListener, true);
    console.log('inspector registered');
})();
