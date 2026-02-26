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

    console.log('navigating to production...');
    await page.goto('https://loov-ten.vercel.app/', { waitUntil: 'networkidle0' });
    console.log('Wait completed.');

    // Check root content
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log('Body HTML length:', bodyHtml.length);
    console.log('Body HTML snippet:', bodyHtml.substring(0, 500));
    const title = await page.title()
    console.log("Title: ", title)

    await browser.close();
})();
