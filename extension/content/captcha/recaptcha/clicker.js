(() => {
    const background = chrome.runtime.connect({name: "content"});
    const repeatTries = 10;

    const consoleTime = "clicker";

    let isInit = true;
    let tries = 0;
    let dims = -1;
    let question = '';
    let lastData = '';
    let puzzleStep = 0;
    let tileSelect = null;
    let previousID = null;
    let detectedImages = [];

    function __main() {
        background.onMessage.addListener(async function (msg) {
            if (msg.command !== 'recaptcha') {
                return;
            }

            if (msg.error) {
                reload();
                lastData = '';
                tries++;
                return;
            }

            await handleResponseGrid(msg.response);
        });

        setInterval(async () => {
            const config = await Config.getAll();
            if (!(config.isPluginEnabled && config.enabledForRecaptchaV2 && config.recaptchaV2Type === 'click')) {
                return;
            }

            if (findAnchor() && isInit) {
                initCaptcha();
            }

            if (hasImage()) {
                if (!await detectTile()) {
                    return;
                }

                const data = await solveTiles();
                if (!data) return;
                await sendImages(data);
            }
        }, 1000);
    }

    function findAnchor() {
        return document.querySelector('#recaptcha-anchor');
    }

    function hasImage() {
        return document.querySelector('#rc-imageselect') !== null;
    }

    function initCaptcha() {
        if (hasSolved()) {
            tries = 0;
            return;
        }
        clickIamRobot();
        isInit = false;
    }

    function hasSolved() {
        const anchor = findAnchor();
        let checked;
        if (anchor != null) {
            checked = anchor.getAttribute('aria-checked') === 'true';
        }

        if (checked) {
            tries = 0;
            if (!isInit) {
                background.postMessage({
                    command: 'solved'
                });
                isInit = true;
            }
        }

        return false;
    }

    function clickIamRobot() {
        const anchor = findAnchor();
        if (anchor != null) {
            anchor.click();
        }
    }

    function detectTile() {
        return new Promise((resolve) => {
            const tile = document.querySelectorAll('.rc-imageselect-tile');
            const dynamic = document.querySelectorAll('.rc-imageselect-dynamic-selected');
            if (tile.length > 0 && dynamic.length === 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    function solveTiles() {
        return new Promise((resolve) => {
            if (tries >= repeatTries) {
                return resolve(false);
            }

            question = getQuestion();
            if (!question) {
                return resolve(false);
            }

            if (isErrorSelectMore()) {
                nextTile().catch(console.error);
                return resolve(false);
            }

            if (isErrorDynamicMore()) {
                nextTile().catch(console.error);
                return resolve(false);
            }

            const imgTiles = Array.from(document.querySelectorAll('.rc-imageselect-tile img'));
            const cntTiles = imgTiles.length;

            let singleImage = null;
            let isMulti = false;

            if (cntTiles !== 9 && cntTiles !== 16) {
                return resolve(false);
            }

            dims = cntTiles === 9 ? 3 : 4;
            const multiImages = Array(cntTiles).fill(null);
            for (let i = 0; i < cntTiles; i++) {
                let img = imgTiles[i];
                if (img.naturalWidth >= 300) {
                    singleImage = img.getAttribute('src');
                } else if (img.naturalWidth === 100) {
                    multiImages[i] = img.getAttribute('src');
                    isMulti = true;
                }
            }

            const data = JSON.stringify([singleImage, multiImages]);
            if (lastData === data) {
                return resolve(false);
            }

            lastData = data;
            puzzleStep = 0;

            resolve({
                question: question,
                rows: dims,
                cols: dims,
                url: singleImage,
                urls: multiImages
            });
        });
    }

    function getQuestion() {
        const question = document.querySelector('.rc-imageselect-instructions').innerText.split("\n");
        if (question[question.length - 1].indexOf('Click ') !== -1 || question[question.length - 1].indexOf('click skip')!== -1) {
            question.pop();
        }

        return question.join(' ');
    }

    function isErrorSelectMore() {
        return document.querySelector('.rc-imageselect-error-select-more').style.display !== 'none';
    }

    function isErrorDynamicMore() {
        return document.querySelector('.rc-imageselect-error-dynamic-more').style.display !== 'none';
    }

    async function nextTile() {
        let tiles = Array.from(document.querySelectorAll('.rc-imageselect-tile'));
        const cl = getInRange(0, tiles.length);
        tiles[cl].click();
        await clickByElement([tiles[cl]], tileSelect);
        tileSelect = tiles[cl];
        await verify();
    }

    function getInRange(from, to) {
        let len = to - from + 1;
        return Math.floor(Math.random() * len + from);
    }

    function transformCoordsTarget(elem, coords, selected = null) {
        const result = [];
        if (selected) {
            result.push(getPoint(selected));
        } else {
            result.push({
                x: getInRange(420, 530),
                y: getInRange(200, 300)
            });
        }

        const elemPoint = getPoint(elem);
        for (let i = 0; i < coords.length; i++) {
            const point = coords[i];
            result.push({
                x: elemPoint.x + point.x * 1,
                y: elemPoint.y + point.y * 1,
            });
        }

        return result;
    }

    async function clickByElement(images, selected = null) {
        let coords = getAllCoords(images, false, selected);
        await clickByCoords(coords);
    }

    function getAllCoords(images, single, selected) {
        const result = [];
        if (selected) {
            result.push(getPoint(selected));
        } else {
            result.push({
                x: single ? getInRange(420, 530) : getInRange(10, 100),
                y: single ? getInRange(200, 300) : getInRange(5, 200)
            });
        }

        for (let i = 0; i < images.length; i++) {
            let point = getPoint(images[i]);
            result.push(point);
        }

        return result;
    }

    async function clickByCoords(coords) {
        for (let i = 0; i < coords.length - 1; i++) {
            await mouseMoveImitationClick(coords[i], coords[i + 1]);
        }
    }

    async function mouseMoveImitationClick(from, to) {
        mouseMove(from, to);
        await wait(getInRange(50, 100));
        eventMouseDown(to);
        await wait(getInRange(50, 100));
        eventMouseUp(to);
    }

    async function mouseMoveClick(from, to) {
        mouseMove(from, to);
        await wait(getInRange(50, 100));
        eventMouseClick(to);
    }

    function eventMouseClick(point) {
        const event = document.createEvent('MouseEvent');
        const element = document.elementFromPoint(point.x, point.y);
        event.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            point.x, point.y, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        element.dispatchEvent(event);
    }

    function mouseMove(from, to) {
        let displacement = getDisplacement(from, to, getInRange(10, 20));
        for (let i = 0; i < displacement.length; i++) {
            document.body.dispatchEvent(new MouseEvent('mousemove', {
                bubbles: true,
                clientX: displacement[i].x,
                clientY: displacement[i].y
            }));
        }
    }

    function getDisplacement(from, to, range = 30) {
        let offset = [];
        let rangeDistance = 0;
        let path = 1;
        for (let i = 0; i < range; ++i) {
            offset.push(rangeDistance);
            if (i < range / 10) {
                path += getInRange(60, 100);
            } else if (i >= range * 9 / 10) {
                path -= getInRange(60, 100);
                path = Math.max(20, path);
            }
            rangeDistance += path;
        }

        let result = [];
        let startPoint = [from.x, from.y];
        let rangePoint = [(from.x + to.x) / 2 + getInRange(30, 100), (from.y + to.y) / 2 + getInRange(30, 100)];
        let lastPoint = [(from.x + to.x) / 2 + getInRange(30, 100), (from.y + to.y) / 2 + getInRange(30, 100)];
        let toPoint = [to.x, to.y];

        for (let path of offset) {
            let [x, y] = pointInRange(path / rangeDistance, startPoint, rangePoint, lastPoint, toPoint);
            result.push({
                x: x,
                y: y
            });
        }

        return result;
    }

    function pointInRange(range, startPoint, rangePoint, lastPoint, toPoint) {
        let [startPointX, startPointY] = startPoint;
        let [toPointX, toPointY] = toPoint;
        let [rangePointX, rangePointY] = rangePoint;
        let [lastPointX, lastPointY] = lastPoint;
        const x = startPointX * Math.pow(1 - range, 3) + 3 * rangePointX * range * Math.pow(1 - range, 2) + 3 * lastPointX * range * range * (1 - range) + toPointX * Math.pow(range, 3);
        const y = startPointY * Math.pow(1 - range, 3) + 3 * rangePointY * range * Math.pow(1 - range, 2) + 3 * lastPointY * Math.pow(range, 2) * (1 - range) + toPointY * Math.pow(range, 3);
        return [x, y];
    }

    function reload() {
        let btn = document.querySelector('#recaptcha-reload-button');
        if (btn != null) {
            btn.click();
        }
    }

    function getPoint(elem) {
        let rect;
        if (elem != null) {
            rect = elem.getBoundingClientRect();
        }

        if (rect) {
            return {
                x: rect.left + window.scrollX - document.documentElement.clientLeft + getInRange(-5, 5),
                y: rect.top + window.scrollY - document.documentElement.clientTop + getInRange(-5, 5),
            };
        } else {
            return {
                x: 0,
                y: 0
            };
        }
    }

    function eventMouseDown(point) {
        document.body.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, clientX: point.x, clientY: point.y}));
    }

    function eventMouseUp(point) {
        document.body.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, clientX: point.x, clientY: point.y}));
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getImageData(url) {
        return new Promise((resolve, reject) => {
            let img = new Image;
            img.src = url;
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
                const data = canvas.toDataURL();
                resolve(data);
            };
            img.onerror = (e) => {
                reject(e);
            };
        });
    }

    function isShowError() {
        const elem = document.querySelector('.rc-imageselect-incorrect-response');
        return elem == null || elem.style.display !== '';

    }

    async function sendImages(params) {
        if (!isShowError()) {
            tries++;
        }

        let {question: question, url: url, urls: urls} = params;
        const isMulti = urls.findIndex((u) => u != null) !== -1;
        if (!isMulti) {
            const image = await getImageData(url);
            await sendImageToSolve({
                question: question,
                image: image
            });
        } else {
            let image = await getImageData(url);
            for (let index = 0; index < urls.length; index++) {
                if (urls[index]) {
                    detectedImages.push(urls[index]);
                    const imageTile = await getImageData(urls[index]);
                    image = await mergeImageWithTile(image, imageTile, index);
                }
            }

            await sendImageToSolve({
                question: question,
                image: image
            });
        }
    }

    function mergeImageWithTile(imageMain, imageTile, index) {
        return new Promise((resolve, reject) => {
            const imageObj1 = new Image();
            imageObj1.src = imageMain;
            imageObj1.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = imageObj1.width;
                canvas.height = imageObj1.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(imageObj1, 0, 0, dims * 100, dims * 100);
                const imageObj2 = new Image();
                imageObj2.src = imageTile;
                imageObj2.onload = function() {
                    const left = index % dims;
                    const top = Math.floor(index / dims);
                    ctx.drawImage(imageObj2, left * 100, top * 100, 100, 100);
                    const data = canvas.toDataURL("image/png");
                    resolve(data);
                }
                imageObj2.onerror = (e) => {
                    reject(e);
                };
            }
            imageObj1.onerror = (e) => {
                reject(e);
            };
        });
    }

    async function sendImageToSolve(data) {
        const params = {
            method: 'base64',
            recaptcha: 1,
            body: data.image.slice(data.image.indexOf(';base64,') + 8),
            textinstructions: data.question,
            recaptcharows: dims,
            recaptchacols: dims,
            img_type: 'recaptcha',
            previousID: previousID
        };

        console.log('send params', params);
        console.time(consoleTime);
        background.postMessage({
            command: 'recaptcha',
            params: params
        });
    }

    function parseSolution(str) {
        const regex = /(\d+)/gm;
        let m;
        const result = [];
        while ((m = regex.exec(str)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            if (m[1]) {
                result.push(m[1]);
            }
        }

        return result;
    }

    async function handleResponseGrid(response) {
        console.log('response', response);
        console.timeEnd(consoleTime);

        let solution = [];
        if (response && response.code) {
            solution = parseSolution(response.code);
        }
        if (!solution.length) {
            await verify();
        } else {
            previousID = response.captchaId;
            let tiles = Array.from(document.querySelectorAll('.rc-imageselect-tile'));
            for (let i = 0; i < solution.length; i++) {
                tiles[solution[i] - 1].click();
                await wait(100);
            }

            await verify();
        }
    }

    /**
     * @deprecated
     */
    async function handleResponseCoordinates(response) {
        let coords = response && response.code;
        if (!coords) return;
        console.log('coords', coords);

        let target = document.querySelector('.rc-imageselect-target');
        const absoluteCoords = transformCoordsTarget(target, coords);
        console.log('absoluteCoords', absoluteCoords);

        await clickByCoords(absoluteCoords);

        await wait(1500);
        await verify();
    }

    async function verify() {
        let canContinue = true;
        if (dims === 3 && puzzleStep === 0) {
            canContinue = await detectTile();
        }

        if (canContinue) {
            let btn = document.querySelector('#recaptcha-verify-button');
            if (btn != null) {
                btn.click();
                tileSelect = null;
                previousID = null;
                isInit = true;
            }

            detectedImages = [];
            await clickByElement([document.querySelector('#recaptcha-verify-button')], tileSelect);
            question = getQuestion();
        }
    }

    __main();
})();