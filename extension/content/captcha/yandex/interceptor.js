(() => {

    let yandexFunc;
    let yandexFuncProxy;

    Object.defineProperty(window, "smartCaptcha", {
        get: function () {
            initYandexHandler();
            return yandexFunc;
        },
        set: function (f) {
            yandexFunc = f;
        }, configurable: true
    });

    const initYandexHandler = function () {
        setTimeout(function () {
            interceptorFunc();
        }, 200);
    };

    const interceptorFunc = function () {
        const initCaptcha = (arguments) => {
            if (!isCaptchaWidgetRegistered("yandex", arguments.sitekey)) {
                let input = document.querySelector("input[name='smart-token']");
                if (input && !input.id) {
                    input.id = "yandex-input-" + arguments.sitekey;
                }

                registerCaptchaWidget({
                    captchaType: "yandex",
                    widgetId: arguments.sitekey,
                    sitekey: arguments.sitekey,
                    inputId: input.id,
                });
            }
        }

        if (!yandexFunc) {
            yandexFunc = {
                destroy: function (e) {
                    return this
                },
                execute: function (e) {
                    return this
                },
                getResponse: function (e) {
                    return this
                },
                render: function (e) {
                    return this
                },
                reset: function (e) {
                    return this
                },
                showError: function (e) {
                    return this
                },
                subscribe: function (e) {
                    return this
                }
            }

            window.smartCaptcha = yandexFunc;
        }

        if (!yandexFuncProxy) {
            yandexFuncProxy = new Proxy(yandexFunc, {
                get: function (target, prop) {
                    return new Proxy(target[prop], {
                        apply: (target, thisArg, argumentsList) => {
                            initCaptcha(argumentsList);
                            const obj = Reflect.apply(target, thisArg, argumentsList);
                            return obj;
                        }
                    });
                }
            });
        }
    }
})()
