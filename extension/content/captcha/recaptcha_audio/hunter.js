(() => {
    let autoClicked = false;

    setInterval(function () {
        const clickButton = document.querySelector('.recaptcha-checkbox-border');
        if (clickButton && !autoClicked) {
            clickButton.click();
            autoClicked = true;
        }

        const helpButton = document.querySelector('#recaptcha-help-button');
        if (helpButton) {
            helpButton.remove();

            const helpButtonHolder = document.querySelector('.help-button-holder');
            if (!helpButtonHolder.id) {
                let widgetId = parseInt(Date.now() / 1000);
                helpButtonHolder.id = "help-button-holder-" + widgetId;

                solveWithAudio(widgetId).catch(console.error);
            }
        }
    }, 1000);

    const solveWithAudio = async function (widgetId) {
        const blocked = await isBlocked();
        if (blocked) return;

        const audioElement = await getAudioElement(widgetId);
        if (audioElement) {
            const audioUrl = audioElement.src;
            const audioBody = await downloadAudio(audioUrl);
            addWidgetInfo(audioBody, widgetId);
        }
    }

    const isBlocked = function (timeout = 0) {
        const selector = '.rc-doscaptcha-body';
        return new Promise(resolve => {
            setTimeout(function () {
                resolve(document.querySelector(selector));
            }, timeout)
        });
    }

    const getAudioElement = async function (widgetId) {
        const audioSelector = 'audio#audio-source';
        let audioElement = document.querySelector(audioSelector);
        if (!audioElement) {
            const audioButton = document.querySelector('#recaptcha-audio-button');
            await dispatchEnter(audioButton);
            audioElement = document.querySelector(audioSelector);

            const result = await Promise.race([
                new Promise(resolve => {
                    findNode(document, audioSelector, 5000).then(
                        el => {
                            delay(500).then(() => resolve({audioElement: el}));
                        }
                    );
                }),
                new Promise(resolve => {
                    isBlocked(10000).then(blocked => resolve({blocked}));
                })
            ]);

            if (result.blocked) {
                return;
            }

            audioElement = result.audioElement;
            createButtonStart(widgetId, audioElement);
        }
    }

    function createButtonStart(widgetId, audioElement) {
        const buttonStart = document.createElement('div');
        buttonStart.classList = 'button-holder twcpt-button-holder';
        buttonStart.innerHTML = '<button style="background: transparent;cursor: pointer;" class="rc-button"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAABVNJREFUeJzFV21olWUYXopUpn0YgREVfZMRRGNr5/3YOSeVCi2UNIp+9KeC6l+/JMyFQVAR9idIEClQaqPGXO7sPB/vxznHHd123Ga2phmWCUZWEnNMY+rbdT3vzgGV1bsdoQceDnue93nu677u+7nuew0NCUeqVz7hlvZUbD+csqQ6byl97vKpznPfLZaKzV1dy5Le/Z/D6pVvuaW+cScIo0QzLEStpT0nbCGeqtu4LfTaTGV/1Lqnz1wOTyfAwGn8Xj6xbks1Caai9N59ke35p1u0vq0+74UKs/uHIscP/rC1XpkOgqUzzabdu5fSoKX1JoQhyg4NR7ZSG+ZuPYqugkdHsiMHIlvKrqTHGiuVBWDjVHZ4JMLvtroAWFIf5kUAsDvpMaura7El9F/LR79HyNT2uQPAsJUeMwCU7kl6BuFYBOYOIgS/A8DHdQEAhaOPMwRKJQbA0VIuX7uiUrlhpRDX1QUAnh8kAITim7oumuvA8xpZfvA7AlD/CwDmAJMJIXintlYq3eEUi6udMHzd8cM33SB4GWsZp1S66YoaX98RzYfnpZTWz/NvJwjWOGFRQBMmKTQUKGpEZrAStfaVIzsIT2L/M0f4jVcEQOPWrQsau7sXWtu2LXYLxe50/4AxykkAAMLXEWEvygwM1vbcsHDB9oKP1nd0zK8bhNXb+4BTKB43l8MIjI7bvr/d0cE6R+tlKc+7kx47XvAK1nsJJr2vH8wMQ7oDj5owZ+OUVej/iUz/IC4doGdfuIXC7dX9tiiaZ42NXWQAgFrdIDyQAVsMDxjSELR5cwIAMfEM3fDI0v7mGit+4UW3UNIoNidtz5uw/eAXt1hsb5EyzX2EbiESUxsQqAeWlJtntjLDgII9a+KKiUT83DACcQGtu6o5wMQzv6iU/K61vBeSrT/gt+mOjkWO5x8heNND5Lx7Zum9LhsK4WVzLne9ASVVLq4LyhgFyFP47ls2I6x++DYyopXPv2vuyOdXEiTvsZS3JblxpRwY+dsczMv3ptdemo6pMY4sD5EPt3LP1fpR5MoxJiB7BoJBOB42oIWsZMEYi1piAPh4J58YL0op1RQD0INpUqy9iA1HKhev10AL8QbDQHYYIrDzaXzO2xgDUKeTA1DqJDI+soUcZzFBdbsRF5wx754A4KklgkcuOpOXrxkA0wxRwrnuKLWaeYLzU4kB1IxI9ev0JXdzDUkVGwAT2OsGsGu4z1Aw4UweUJji358MMK1dEzI0sskZkNMMSDXO2k4G2OsxvjRAIGw8H5PyPgNYyudIM+m/lAH0lE/PngGpd1RzAAnWHK+pftNoEgD22Jo3C3EX91L5/JrqHkHEYPQnsTN6U7YyNOscSMGDs8z6lFTvc82R3gvVV1AF0KTU/Q1tbfNSQqyrgeMriNl5cJqd4UzMzqHEAMxBpYqmG/b8P1vy+SVmTcivTHeEfMCFFzB/BtAfME+YHIHx7BB0Ih93wikpV/HlxDqgP5wVAMjnM6b6UQmV18E1VjcUnR2UWE6qXHWyJCNk522hNvLblvb2JWDqWKyEwVkWrVkBiD0WPRnEj0Asz68pmev7q1Ahv4byHQVDv8HAKF7NVksI8zTJmBMUytWqyP+sZm2cA13PLaD1KFkgCFzag+Lz0L+eCQJ0SoUfWT1pHHmxa07GqwPe3IukOmw6H4CA11OgttNR/quOEDa9hk6sALAN6AfKfIKx50PsB7qezOWurgsAR1Nn581OobCThaXa9ZAVSjIz3qwjB6otGsIxaQfB23UbvnRYOsyi5/sSjehxZP0Z8xL49rV3DsxMIFyHsL/F4fNMOP4BMp5w/4vcCfsAAAAASUVORK5CYII="></button>';
        document.querySelector('.rc-buttons').append(buttonStart);
        document.querySelector('.twcpt-button-holder button').addEventListener('click', async () => {
            await simulateAudioInput(audioElement);
            const audioUrl = audioElement.src;
            const audioBody = await downloadAudio(audioUrl);
            addWidgetInfo(audioBody, widgetId);
        });
    }

    const findNode = function (node, selector, timeout) {
        return new Promise(resolve => {
            const ms = 100;
            const timer = setInterval(() => {
                const el = node.querySelector(selector)
                if (el || timeout <= 0) {
                    clearInterval(timer);
                    resolve(el);
                }
                timeout -= ms;
            }, ms);
        })
    }

    const simulateAudioInput = async function (audioElement) {
        if (!audioElement) {
            return;
        }

        audioElement.muted = true;
        const muteAudio = function () {
            audioElement.muted = true;
        };
        const unmuteAudio = function () {
            removeCallbacks();
            audioElement.muted = false;
        };

        audioElement.addEventListener('playing', muteAudio, {
            capture: true,
            once: true
        });
        audioElement.addEventListener('ended', unmuteAudio, {
            capture: true,
            once: true
        });

        const removeCallbacks = function () {
            window.clearTimeout(timeoutId);
            audioElement.removeEventListener('playing', muteAudio);
            audioElement.removeEventListener('ended', unmuteAudio);
        };

        const timeoutId = window.setTimeout(unmuteAudio, 10000);
        const playButton = document.querySelector(
            '.rc-audiochallenge-play-button > button'
        );
        await dispatchEnter(playButton);
    }

    const dispatchEnter = async function (node) {
        node.focus();
        await delay(200);
        await simulateKeyboardEnter(node);
    }

    const simulateKeyboardEnter = function (node) {
        const keyEvent = {
            code: 'Enter',
            key: 'Enter',
            keyCode: 13,
            which: 13,
            view: window,
            bubbles: true,
            composed: true,
            cancelable: true
        };

        node.focus();
        node.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
        node.dispatchEvent(new KeyboardEvent('keypress', keyEvent));
        node.click();
    }

    const delay = function (timeout) {
        return new Promise(resolve => window.setTimeout(resolve, timeout));
    }

    const downloadAudio = async function (audioUrl) {
        const audioRsp = await fetch(audioUrl);
        const audioContent = await audioRsp.arrayBuffer();
        return btoa(String.fromCharCode.apply(null, new Uint8Array(audioContent)));
    }

    const addWidgetInfo = function (body, widgetId) {
        document.querySelector('.twcpt-button-holder').style = 'animation: blink 1s linear infinite;';

        registerCaptchaWidget({
            captchaType: "recaptcha_audio",
            widgetId: widgetId,
            containerId: "help-button-holder-" + widgetId,
            body: body,
            lang: document.documentElement.lang
        });

        return widgetId;
    }
})()