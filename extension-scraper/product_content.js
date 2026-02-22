// This script runs on Coupang Product pages
// Wait for the page and specifically the review images to load

(async function () {
    console.log('[CoupangToNotion] Product scraping active...');

    try {
        // 1. Get Product Name
        const nameEl = document.querySelector('.prod-buy-header__title');
        const productName = nameEl ? nameEl.textContent.trim() : document.title;

        // 2. Scroll to and find review images
        // Note: Coupang reviews might be lazy-loaded or require clicking the review tab.
        // For the skeleton, we look for common review image containers.

        // Attempt to click review tab if images not found
        const reviewTab = document.querySelector('li[data-tab="review"]');
        if (reviewTab) reviewTab.click();

        await sleep(2000); // wait for content to load

        // Find review images. Coupang often uses specific classes for review photos.
        const imageElements = document.querySelectorAll('.sdp-review__article__list__photos__item__img, .sdp-review__article__list__attachment__list__item img');

        const imageUrls = Array.from(imageElements)
            .map(img => img.src.replace('//', 'https://'))
            .filter(src => src.includes('review')) // filter for review images
            .slice(0, 4);

        console.log('[CoupangToNotion] Scraped Data:', { productName, imageUrls });

        chrome.runtime.sendMessage({
            action: 'PRODUCT_DATA_READY',
            data: {
                name: productName,
                images: imageUrls
            }
        });

    } catch (err) {
        console.error('[CoupangToNotion] Error scraping product', err);
        chrome.runtime.sendMessage({
            action: 'PRODUCT_DATA_READY',
            data: { name: 'Error', images: [], error: err.message }
        });
    }
})();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
