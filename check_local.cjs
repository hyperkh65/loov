const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Catch errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE LOG ERROR:', msg.text());
        }
    });
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });

    console.log('navigating to local preview...');
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    console.log('Wait completed.');

    // Check root content
    const rootHtml = await page.$eval('#root', el => el.innerHTML);
    console.log('Root HTML length:', rootHtml.length);
    console.log('Root HTML snippet:', rootHtml.substring(0, 500));

    await browser.close();
})();
