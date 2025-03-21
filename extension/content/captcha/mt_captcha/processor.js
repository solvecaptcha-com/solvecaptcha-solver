CaptchaProcessors.register({

    captchaType: "mt_captcha",

    canBeProcessed: function (widget, config) {
        if (!config.enabledForMTCaptcha) return false;

        return true;
    },

    attachButton: function (widget, config, button) {
        let helper = this.getHelper(widget);
        if (helper.querySelector('.solvecaptcha')) {
            return;
        }

        button[0].dataset.disposable = true;
        $(helper).append(button);
        if (config.autoSolveMTCaptcha) button.click();
    },

    getName: function (widget, config) {
        return `MTCaptcha`;
    },

    getParams: function (widget, config) {
        return {
            method: "mt_captcha",
            pageurl: location.href,
            sitekey: widget.sitekey,
        };
    },

    getParamsV2: function (widget, config) {
        return {
            type: "MtCaptchaTaskProxyless",
            websiteURL: location.href,
            websiteKey: widget.sitekey,
        };
    },

    onSolved: function (widget, answer) {
        const input = document.querySelector('input[name=mtcaptcha-verifiedtoken]');
        if (input) {
            input.value = answer;
        }

        const iframes = document.querySelectorAll('iframe');
        if (iframes) {
            iframes.forEach((iframe) => {
                this.setToken(iframe, answer);
                const iframesInner = iframe.querySelectorAll('iframe');
                iframesInner.forEach((iframeInner) => {
                    this.setToken(iframeInner, answer);
                });
            });
        }
    },

    setToken: function (iframe, answer) {
        iframe.contentWindow.postMessage({
            name: 'mt_captcha_answer',
            answer: answer
        }, '*');
    },

    getForm: function (widget) {
        return this.getHelper(widget).closest("form");
    },

    getCallback: function (widget) {
        return null;
    },

    getHelper: function (widget) {
        return document.querySelector('iframe').parentNode;
    },

});
