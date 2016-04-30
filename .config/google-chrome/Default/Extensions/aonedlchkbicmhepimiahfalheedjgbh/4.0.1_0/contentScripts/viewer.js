/// <reference path="../browsers/interfaces/jquery.d.ts" />
/// <reference path="../browsers/interfaces/chrome.d.ts" />
/// <reference path="../browsers/interfaces/opera.d.ts" />
var ff_self = self;
var viewer;
(function (viewer) {
    var isChrome = !!window.chrome;
    var isOpera = !!window.opera;
    var isInjected = false;
    var _opera_not_include = '';
    var minHeight = '40px';
    var maxHeight = '100%';
    var classIFrame = 'tndFrame';
    var lastMessage;
    var foundSovetnik = false;
    function frameListener(msg) {
        if (!isInjected) {
            return;
        }
        try {
            var data = JSON.parse(msg.data);
        }
        catch (e) {
            return;
        }
        if (data.action == 0) {
            window.jQuery('#' + classIFrame).css('height', minHeight);
        }
        else if (data.action == 1) {
            window.jQuery('#' + classIFrame).css('height', maxHeight);
        }
        else if (typeof (data.action) == 'object' && data.action.hasOwnProperty('action')) {
            var action = data.action.action;
            if (action == 'setHeight') {
                var height = data.action.height;
                window.jQuery('#' + classIFrame).css('height', height);
            }
            if (action == 'setMinHeight') {
                minHeight = data.action.height;
                window.jQuery('#' + classIFrame).parent().css('height', minHeight);
            }
        }
        else {
            sendMessageToExtension(data.action, data.data);
        }
    }
    function processMessage(message) {
        if (message.classFrame.length > 0) {
            classIFrame = message.classFrame;
        }
        if (window.jQuery('#' + classIFrame).length) {
            if (typeof (message.data['force'] != 'undefined') && message.data['force'] == true) {
                window.jQuery('#' + classIFrame).remove();
            }
            else {
                return;
            }
        }
        else {
            window.jQuery('<meta name="tndStatus" content="found"/>').appendTo('head');
            window.jQuery('<meta name="modelName" content="' + message.data.modelName + '"/>').appendTo('head');
            var cssFlag = false;
            if (typeof message.data.cssBeforeShow != 'undefined') {
                for (var index_el in message.data.cssBeforeShow) {
                    if (typeof (message.data.cssBeforeShow[index_el]['path']) == "string" &&
                        typeof (message.data.cssBeforeShow[index_el]['css']) == "string" &&
                        typeof (message.data.cssBeforeShow[index_el]['value']) == "string") {
                        cssFlag = true;
                        if (typeof (message.data.cssBeforeShow[index_el]['scroll']) != 'undefined'
                            && message.data.cssBeforeShow[index_el]['scroll']) {
                            window.jQuery(document).scroll(function () {
                                window.jQuery(message.data.cssBeforeShow[index_el]['path']).css(message.data.cssBeforeShow[index_el]['css'], message.data.cssBeforeShow[index_el]['value']);
                            });
                        }
                        else {
                            window.jQuery(message.data.cssBeforeShow[index_el]['path']).css(message.data.cssBeforeShow[index_el]['css'], message.data.cssBeforeShow[index_el]['value']);
                        }
                    }
                }
            }
            _opera_not_include = 'start';
            if (!cssFlag && typeof message.data.jsBeforeShow == 'string' && message.data.jsBeforeShow != '') {
                eval(message.data.jsBeforeShow);
            }
            _opera_not_include = 'end';
            if (message.data.categoryID > 0) {
                sendMessageToModule('productInfo', {
                    'productName': message.data.modelName,
                    'catID': message.data.categoryID,
                    'catName': message.data.categoryName
                });
            }
            setListenSovetnik();
        }
        var iframe = window.jQuery('<iframe id="' + classIFrame + '" scrolling="no" frameborder="0">')
            .attr('src', message.data.responseUrl)
            .css(message.data.style);
        var styles = iframe.attr('style');
        styles += "display:block !important;";
        styles += "width: 100% !important;";
        styles += "overflow: auto !important;";
        styles += "visibility: visible !important;";
        iframe.attr('style', styles);
        var pos = message.data.position;
        if (typeof pos == 'string') {
            //var actions = {top: 'prepend', bottom: 'append'};
            //var action = actions[message.data.position];
            var action = 'append'; // Solutions for z-index context
            var body = window.jQuery('body');
            if (pos == 'bottom') {
                body.css('marginBottom', '30px');
            }
            if (window.document.location.host === 'www.google.ru' && pos == 'top') {
                var s = window.document.createElement('style');
                s.innerHTML = 'body div#mngb {position: relative !important}';
                document.getElementsByTagName('body')[0].appendChild(s);
            }
            var wrapper = window.jQuery('<div>').css(message.data.divStyle).append(iframe);
            body[action](wrapper);
        }
        else if (Array.isArray(pos)) {
            var rowHeight = pos[2];
            var otherHeight = pos[3];
            maxHeight = (otherHeight + rowHeight * message.data.count) + 'px';
            var elm = window.jQuery(pos[1]);
            elm['append'](iframe);
        }
        isInjected = true;
        lastMessage = message;
    }
    function setListenSovetnik() {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var obj_html = document.querySelector('html');
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type == "attributes" && (/^mbr\-/.test(mutation.attributeName)) && !foundSovetnik) {
                    foundSovetnik = true;
                    sendMessageToExtension('foundSovetnik', lastMessage.data);
                }
            });
        });
        observer.observe(obj_html, {
            attributes: true
        });
    }
    function sendMessageToModule(msg, data) {
        var msg = {
            status: msg,
            data: data
        };
        if (isChrome) {
            this.chrome.extension['sendMessage'](msg);
        }
        else if (isOpera) {
            opera.extension.postMessage(msg);
        }
        else {
            self.postMessage(msg, null, null);
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
    function onExtensionMessage(callback, statusFilter) {
        function callIfNeed(msg) {
            if (msg.status == statusFilter) {
                callback(msg);
            }
        }
        if (isChrome) {
            chrome.extension.onMessage.addListener(callIfNeed);
        }
        else if (isOpera) {
            opera.extension.addEventListener('message', function (event) { return callIfNeed(event.data); });
        }
        else {
            ff_self['on']('message', callIfNeed);
        }
    }
    onExtensionMessage(processMessage, 'frameData');
    onExtensionMessage(function () {
        window.jQuery('<meta name="tndStatus" content="notFound"/>').appendTo('head');
    }, 'notFound');
    onExtensionMessage(function () {
        window.jQuery('<meta name="tndStatus" content="notShop"/>').appendTo('head');
    }, 'notShop');
    window['addEventListener']("message", frameListener, true);
})(viewer || (viewer = {}));
