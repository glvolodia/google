var _this = this;
/// <reference path="../browsers/interfaces/opera.d.ts" />
if (this.opera && window.top == window['self']) {
    console.log('scripts injected for opera');
    window['addEventListener']("DOMContentLoaded", function (e) {
        _this.opera.extension.postMessage({ action: 'load' });
    }, false);
}
