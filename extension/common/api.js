class SolveCaptcha {

    constructor(options) {
        if (typeof options == "string") {
            options = { apiKey: options }
        }

        let defaultOptions = {
            apiKey: "",
            service: "api.solvecaptcha.com",
            softId: 0,
            defaultTimeout: 120,
            recaptchaTimeout: 600,
            pollingInterval: 10,
        }

        for (let key in defaultOptions) {
            this[key] = options[key] === undefined ? defaultOptions[key] : options[key];
        }
    }

    normal(captcha) {
        return this.solve(captcha, { timeout: this.defaultTimeout });
    }

    recaptcha(captcha) {
        return this.solve(captcha, { timeout: this.recaptchaTimeout });
    }

    recaptcha_audio(captcha) {
        captcha.method = "audio";
        return this.solve(captcha, { timeout: this.recaptchaTimeout });
    }

    geetest(captcha) {
        return this.solve(captcha);
    }

    geetest_v4(captcha) {
        return this.solve(captcha);
    }


    keycaptcha(captcha) {
        return this.solve(captcha);
    }

    arkoselabs(captcha) {
        return this.solve(captcha);
    }

    lemin(captcha) {
        return this.solve(captcha);
    }

    yandex(captcha) {
        return this.solve(captcha);
    }

    capy(captcha) {
        return this.solve(captcha);
    }

    amazon_waf(captcha) {
        return this.solve(captcha);
    }

    turnstile(captcha) {
        return this.solve(captcha);
    }

    mt_captcha(captcha) {
        return this.solve(captcha);
    }

    coordinates(captcha) {
        return this.solve(captcha);
    }

    grid(captcha) {
        return this.solve(captcha, { pollingInterval: 1 });
    }

    async solve(captcha, waitOptions) {
        let result = {};
        result.captchaId = await this.send(captcha);
        result.code = await this.waitForResult(result.captchaId, waitOptions);
        return result;
    }

    async send(captcha) {
        this.sendAttachDefaultParams(captcha);
        let files = this.extractFiles(captcha);
        Config.mapParams(captcha, captcha.method);
        Config.mapParams(files, captcha.method);
        return await this.in(captcha, files);
    }

    async waitForResult(id, waitOptions) {
        if (!waitOptions) {
            waitOptions = {
                timeout: this.defaultTimeout,
                pollingInterval: this.pollingInterval,
            }
        }

        let startedAt = this.getTime();

        let timeout = waitOptions.timeout === undefined ? this.defaultTimeout : waitOptions.timeout;
        let pollingInterval = waitOptions.pollingInterval === undefined ? this.pollingInterval : waitOptions.pollingInterval;

        while (true) {
            if (this.getTime() - startedAt < timeout) {
                await new Promise(resolve => setTimeout(resolve, pollingInterval * 1000));
            } else {
                break;
            }

            try {
                let code = await this.getResult(id);
                if (code) return code;
            } catch (e) {
                throw e;
            }
        }

        throw new Error('Timeout ' + timeout + ' seconds reached');
    }

    getTime() {
        return parseInt(Date.now() / 1000);
    }

    async getResult(id) {
        try {
            return await this.res({
                action: "get",
                id: id,
            });
        } catch (e) {
            if (e.message === "CAPCHA_NOT_READY") {
                return null;
            }

            throw e;
        }
    }

    async balance() {
        let balance = await this.res({ action: "getbalance" });

        return parseFloat(balance);
    }

    async userInfo() {
        return await this.res({ action: "userinfo" });
    }

    async report(id, isCorrect) {
        let action = isCorrect ? "reportgood" : "reportbad";

        return await this.res({ action, id });
    }

    sendAttachDefaultParams(captcha) {
        if (this.softId > 0) {
            captcha.softId = this.softId;
        }
    }

    extractFiles(captcha) {
        let files = {};

        let fileKeys = ['file', 'hintImg'];

        for (let i = 1; i < 10; i++) {
            fileKeys.push('file_' + i);
        }

        fileKeys.forEach(function (key) {
            if (captcha[key] !== undefined /* && is_file($captcha[$key]) */) {
                files[key] = captcha[key];
                delete captcha[key];
            }
        });

        return files;
    }

    async in(captcha, files) {
        return await this.request('POST', '/in.php', captcha, files);
    }

    async res(data) {
        return await this.request('GET', '/res.php', data);
    }

    async request(method, path, data, files) {
        data.key = this.apiKey;
        data.header_acao = 1;
        data.json = 1;

        let url = "https://" + this.service + path;

        let options = {
            method: method,
        };

        if (method === 'GET') {
            let kv = [];

            for (let key in data) {
                kv.push(key + '=' + encodeURIComponent(data[key]));
            }

            url += '?' + kv.join('&');
        } else {
            let formData = new FormData();

            for (let key in data) {
                if (typeof data[key] == 'object') {
                    for (let ok in data[key]) {
                        formData.append(key + "[" + ok + "]", data[key][ok]);
                    }
                } else {
                    formData.append(key, data[key]);
                }
            }

            options.body = formData;
        }

        let response;

        try {
            response = await fetch(url, options);
        } catch (e) {
            throw new Error("API_CONNECTION_ERROR");
        }

        if (!response.ok) {
            throw new Error('API_HTTP_CODE_' + response.status);
        }

        let json;

        try {
            json = await response.json();
        } catch (e) {
            throw new Error("API_INCORRECT_RESPONSE");
        }

        if (json.status === 0) {
            throw new Error(json.request);
        }

        return json.request || json;
    }

}
