CaptchaProcessors.register({

    captchaType: "yandex",

    canBeProcessed: function (widget, config) {
        if (!config.enabledForYandex) return false;

        if (!widget.sitekey) return false;

        return true;
    },

    attachButton: function (widget, config, button) {
        let helper = this.getHelper(widget, config);
        if (helper.find('.solvecaptcha').length !== 0) {
            return;
        }

        button.css({
            width: helper.outerWidth() + "px"
        });

        button[0].dataset.disposable = true;

        helper.append(button);
    },

    clickButton: function(widget, config, button) {
        if (config.autoSolveYandex) button.click();
    },

    getName: function (widget, config) {
        return `Yandex Smart Captcha`;
    },

    getParams: function (widget, config) {
        return {
            method: "yandex",
            url: location.href,
            sitekey: widget.sitekey
        };
    },

    getParamsV2: function (widget, config) {
        return {
            type: "YandexSmartCaptchaTaskProxyless",
            websiteKey: widget.sitekey,
            websiteURL: location.href,
        };
    },

    onSolved: function (widget, answer, config) {
        let helper = this.getHelper(widget, config);
        helper.find("input[name=smart-token]").each(function() {
            $(this).val(answer);
        });
    },

    getForm: function (widget) {
        return this.getHelper(widget).closest("form");
    },

    getCallback: function (widget) {
        return null;
    },

    getHelper: function (widget, config) {
        if (config.buttonPosition === 'fixed') {
            return $(document.body);
        }
        let container = $("#" + widget.inputId);
        return container.parent();
    },

});
