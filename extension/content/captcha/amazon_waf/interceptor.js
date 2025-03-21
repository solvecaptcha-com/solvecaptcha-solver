(() => {

    let awsInstance;
    let awsInstanceProxy;

    Object.defineProperty(window, "CaptchaScript", {
        get: function () {
            return interceptorFunc();
        },
        set: function (f) {
            awsInstance = f;
        },
    });

    let interceptorFunc = function () {

        const findScript = function (scriptUrl) {
            const scripts = document.querySelectorAll("script");
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].getAttribute("src");
                if (typeof src === "string" && src.indexOf(scriptUrl) > 0) {
                    return src;
                }
            }

            return null;
        }

        const initHelper = function (inputId, arguments) {
            const args = arguments[1] ? arguments[1] : arguments;

            registerCaptchaWidget({
                captchaType: "amazon_waf",
                inputId: inputId,
                widgetId: inputId,
                pageurl: window.location.href,
                sitekey: args.key,
                iv: args.iv,
                context: args.context,
                challenge_script: findScript('/challenge.js'),
                captcha_script: findScript('/captcha.js'),
            });
        };

        if (awsInstance) {
            awsInstanceProxy = new Proxy(awsInstance, {
                get: function (target, prop) {
                    return new Proxy(target[prop], {
                        apply: (target, thisArg, argumentsList) => {
                            const obj = Reflect.apply(target, thisArg, argumentsList);
                            if (target.name === 'renderCaptcha') {
                                if (!target.id) {
                                    target.id = "captcha-container";
                                }

                                setTimeout(() => {
                                    initHelper(target.id, window.gokuProps || argumentsList[2]);
                                }, 100);
                            }
                            return obj;
                        }
                    });
                }
            });
        }

        return awsInstanceProxy;
    }
})()
