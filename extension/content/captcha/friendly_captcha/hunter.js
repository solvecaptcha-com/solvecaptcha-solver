(() => {
    setInterval(function () {
        let div = document.querySelector("[data-sitekey]") || document.querySelector("[data-apikey]") ;
        if (!div) return;

        if (isCaptchaWidgetRegistered("friendly_captcha", 0)) return;

        let widgetInfo = getKeyCaptchaWidgetInfo(div);
        registerCaptchaWidget(widgetInfo);
    }, 300);

    let getKeyCaptchaWidgetInfo = function(div) {
        if (!div.id) div.id = "friendly_captcha-" + Date.now();

        return {
            captchaType: "friendly_captcha",
            widgetId: 0,
            containerId: div.id,
            sitekey: div.getAttribute('data-sitekey')
        };
    };

})()