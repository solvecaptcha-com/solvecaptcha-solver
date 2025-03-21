(() => {

    let mtcaptchaInstance;

    let nextWidgetId = 1;

    Object.defineProperty(window, "mtcaptchaConfig", {
        get: function () {
            return interceptorFunc();
        },
        set: function (f) {
            nextWidgetId++;
            mtcaptchaInstance = f;
        },
    });

    let interceptorFunc = function () {
        const initHelper = function () {
            if (!mtcaptchaInstance.widgetId) {
                mtcaptchaInstance.widgetId = nextWidgetId;
                registerCaptchaWidget({
                    captchaType: "mt_captcha",
                    sitekey: mtcaptchaInstance.sitekey,
                    widgetId: mtcaptchaInstance.widgetId,
                });
            }
        };

        initHelper();

        return mtcaptchaInstance;
    }
})()

window.addEventListener('message', event => {
    if (event.data.name === 'mt_captcha_answer') {
        const input = document.querySelector('input[name=mtcaptcha-verifiedtoken]');
        if (input) {
            input.value = event.data.answer;
        }
    }
})