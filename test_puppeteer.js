const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE LOG ERROR:', msg.text());
        }
    });
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`RESPONSE ERROR: ${response.url()} - ${response.status()}`);
        }
    });
    await page.goto('http://localhost:4173/');
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
