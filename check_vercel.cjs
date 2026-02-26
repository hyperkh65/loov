const puppeteer = require('puppeteer');
(async () => {
    const urls = ['https://loov-jn8p8t84e-seankims-projects-b0237f8a.vercel.app'];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE LOG ERROR:', msg.text());
        } else {
            console.log('PAGE LOG:', msg.text());
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
    console.log('navigating...');
    await page.goto(urls[0], { waitUntil: 'networkidle2' });
    console.log('waited...');

    // Check if the screen is actually just a black screen without any DOM content?
    const html = await page.content();
    console.log('Body HTML length:', html.length);
    const hasCanvas = await page.$('canvas');
    console.log('Has Canvas?', !!hasCanvas);

    await browser.close();
})();
