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
    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
    });

    console.log('navigating to production...');
    await page.goto('https://loov-ten.vercel.app/', { waitUntil: 'networkidle0' });
    console.log('Wait completed.');

    // Check root content
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log('Body HTML length:', bodyHtml.length);
    console.log('Body HTML snippet:', bodyHtml.substring(0, 500));

    await browser.close();
})();
