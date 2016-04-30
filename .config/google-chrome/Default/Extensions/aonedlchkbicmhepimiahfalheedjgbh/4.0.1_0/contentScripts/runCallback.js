/// <reference path="../browsers/interfaces/jquery.d.ts" />
/// <reference path="../browsers/interfaces/chrome.d.ts" />
/// <reference path="../browsers/interfaces/opera.d.ts" />
if (!this.chrome && !this.opera) {
    console.log('scripts injected for ff');
    // only for firefox
    self.postMessage('scripts injected', null, null);
}
