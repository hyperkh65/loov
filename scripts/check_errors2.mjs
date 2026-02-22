import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.failure()?.errorText || '', request.url()));

        console.log("Navigating to page...");
        await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(e => console.error("Navigation timeout or error:", e.message));
        console.log("Waiting a bit...");
        await new Promise(r => setTimeout(r, 2000));

        await browser.close();
        console.log("Done checking.");
        process.exit(0);
    } catch (err) {
        console.error("Puppeteer Script Error:", err);
        process.exit(1);
    }
})();
