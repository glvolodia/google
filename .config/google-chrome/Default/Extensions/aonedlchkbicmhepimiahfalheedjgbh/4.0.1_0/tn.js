/// <reference path="browsers/Chrome.ts"/>
/// <reference path="modules/application.ts"/>
/// <reference path="modules/utils.ts"/>
/// <reference path="modules/logger.ts"/>
/// <reference path="modules/plug_module.ts"/>
/// <reference path="modules/ga.ts"/>
(function () {
    if (window === window['top']) {
        var browserApi = tn.browsers.api;
        if (browserApi.storage.get('mode') != 'dev') {
            console.log = function () {
                return false;
            };
        }
        var ApiClass = tn.Api;
        var utils = tn.utils;
        utils.init(browserApi);
        var InstallerClass = tn.Installer;
        var ExtensionClass = tn.app.Extension;
        var GaClass = tn.GoogleAnalytics;
        var PlugModuleClass = tn.ManagementPlugModule;
        var api = new ApiClass(browserApi);
        var installer = new InstallerClass(browserApi, api, uuid);
        var ga = new GaClass(browserApi, utils);
        var plugModule = new PlugModuleClass(browserApi, api);
        var extension = new ExtensionClass(browserApi, api, utils, installer, ga, plugModule);
        extension.run();
        window['ext'] = extension;
        window['setProvider'] = function (name) {
            browserApi.ajax.setHeader('Provider', name);
            browserApi.storage.set('provider', name);
        };
        window['reload'] = function () {
            localStorage.clear();
            location.reload();
        };
        console.log("tab listener registered");
    }
})();
