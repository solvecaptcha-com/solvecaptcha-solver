/*
 * Show options page after installation
 */
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            self.open(chrome.runtime.getURL('options/options.html'));
        }
    }
});


var API;

Config.getAll().then(config => {
    if (config.apiKey) {
        initApiClient(config.apiKey);
    }
});

function initApiClient(apiKey) {
    API = new SolveCaptcha({
        apiKey: apiKey,
        service: "api.solvecaptcha.com",
        defaultTimeout: 300,
        pollingInterval: 5,
        softId: 4843,
    });
}

var devtoolsConnections = {};

/*
 * Manage message passing
 */
chrome.runtime.onConnect.addListener(function(port) {
    // Listen to messages sent from page
    port.onMessage.addListener(function (message) {
        // Register initial connection
        switch (message.command) {
            case 'init':
                devtoolsConnections[message.tabId] = port;
                port.onDisconnect.addListener(function() {
                    delete devtoolsConnections[message.tabId];
                });
            break;
            case 'solvecaptcha-devtools':
                for (tabId in devtoolsConnections) {
                    devtoolsConnections[tabId].postMessage(message);
                }
            break;
            case 'recaptcha':
                API.grid(message.params)
                    .then((response) => {
                        port.postMessage({ command: 'recaptcha', request: message, response });
                    })
                    .catch(error => {
                        port.postMessage({ command: 'recaptcha', request: message, error: error.message});
                    });
                break;
            case 'solved':
                console.warn('Captcha already solved')
                break;
            default:
                let messageHandler = port.name + '_' + message.action;
                if (self[messageHandler] === undefined) return;
                self[messageHandler](message)
                    .then((response) => {
                        port.postMessage({action: message.action, request: message, response});
                    })
                    .catch(error => {
                        port.postMessage({action: message.action, request: message, error: error.message});
                    });
        }
    });
});

chrome.runtime.onMessage.addListener(function(message, sender) {
    if (sender && sender.tab) {
        var tabId = sender.tab.id;
        if (tabId in devtoolsConnections) {
            devtoolsConnections[tabId].postMessage(message);
        } else {
            console.log("Tab not found in connection list.");
        }
    } else {
        console.log("sender.tab not defined.");
    }
    return true;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if (tabId in devtoolsConnections && changeInfo.status === 'complete') {
        devtoolsConnections[tabId].postMessage({
            name: 'reloaded'
        });
    }
});

/*
 * Message handlers
 */
async function popup_login(msg) {
    initApiClient(msg.apiKey);

    let info = await API.userInfo();

    if (info.key_type !== "customer") {
        throw new Error("You entered worker key! Switch your account into \"customer\" mode to get right API-KEY");
    }

    info.valute = info.valute.toUpperCase();

    Config.set({
        apiKey: msg.apiKey,
        email:  info.email,
        valute: info.valute,
    });

    return info;
}

async function popup_logout(msg) {
    Config.set({apiKey: null});

    return {};
}

async function popup_getAccountInfo(msg) {
    let config = await Config.getAll();

    if (!config.apiKey) throw new Error("No apiKey");

    let info = await API.userInfo();

    info.valute = info.valute.toUpperCase();

    return info;
}

async function content_solve(msg) {
    return await API[msg.captchaType](msg.params);
}