(() => {

    setInterval(function () {
        let cf = document.getElementById("cf-turnstile");
        if (!cf) {
            const inputResponse = document.querySelector(btoa('aW5wdXRbbmFtZT0iY2YtdHVybnN0aWxlLXJlc3BvbnNlIl0='));
            cf = inputResponse && inputResponse.parentNode;
        }

        if (!cf) return;

        getTurnstileWidgetInfo(cf);
    }, 2000);

    const getTurnstileData = function (cf) {
        if (cf) {
            return cf.getAttribute('data-sitekey');
        }

        return null;
    };

    const getTurnstileWidgetInfo = function (cf) {
        const sitekey = getTurnstileData(cf);

        if (sitekey) {
            if (isCaptchaWidgetRegistered("turnstile", sitekey)) return;

            if (!cf.id) {
                cf.id = "turnstile-input-" + sitekey;
            }

            registerCaptchaWidget({
                captchaType: "turnstile",
                widgetId: sitekey,
                sitekey: sitekey,
                inputId: cf.id,
            });
        }
    };
})()