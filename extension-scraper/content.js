// This script runs on Coupang Partners (https://partners.coupang.com/)
// and Coupang Product page (https://www.coupang.com/vp/products/...)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_SCRAPING') {
        startScrapingFlow();
        sendResponse({ message: '수집을 시작했습니다.' });
    }
});

async function startScrapingFlow() {
    console.log('[CoupangToNotion] Scraping started...');

    // 1. Find product cards on the partners page
    // The selectors below are estimates based on common patterns.
    // User may need to adjust these.
    const cards = document.querySelectorAll('.product-card, [class*="product-item"]');
    if (cards.length === 0) {
        chrome.runtime.sendMessage({ action: 'UPDATE_STATUS', text: '오류: 상품 카드를 찾을 수 없습니다.' });
        return;
    }

    const limit = 4; // limit to 4 items as requested
    const itemsToProcess = Array.from(cards).slice(0, limit);

    for (let i = 0; i < itemsToProcess.length; i++) {
        const card = itemsToProcess[i];
        chrome.runtime.sendMessage({ action: 'UPDATE_STATUS', text: `상품 ${i + 1}/${itemsToProcess.length} 처리 중...` });

        try {
            // 2. Click "Create Link" button to get the affiliate link
            // Often there's a button with text "링크 생성"
            const createLinkBtn = findButtonByText(card, '링크 생성');
            if (!createLinkBtn) continue;

            createLinkBtn.click();
            await sleep(1000); // Wait for modal/popup

            // Extract Affiliate Link from the popup
            const affiliateLinkInput = document.querySelector('input[class*="link-url"], input[value*="link.coupang.com"]');
            const affiliateLink = affiliateLinkInput ? affiliateLinkInput.value : '';

            // Close modal if exists
            const closeBtn = document.querySelector('.modal-close, button[class*="close"]');
            if (closeBtn) closeBtn.click();
            await sleep(500);

            // 3. Click "Product Info" or similar to get the original Coupang URL
            // Or sometimes it's just a link on the image/title
            const infoLink = card.querySelector('a[href*="coupang.com/vp/products"]');
            const referenceUrl = infoLink ? infoLink.href : '';

            if (!referenceUrl || !affiliateLink) {
                console.warn('Skipping item due to missing links', { referenceUrl, affiliateLink });
                continue;
            }

            // 4. Get Review Images from the product page
            // We'll open the page in the background or navigate
            const productInfo = await scrapeProductDetails(referenceUrl);

            // 5. Save to Notion
            const finalData = {
                productName: productInfo.name || '상품명 없음',
                referenceUrl: referenceUrl,
                affiliateLink: affiliateLink,
                photos: productInfo.images || []
            };

            await chrome.runtime.sendMessage({ action: 'SAVE_TO_NOTION', data: finalData });

        } catch (err) {
            console.error('Error processing card', err);
        }
    }

    chrome.runtime.sendMessage({ action: 'UPDATE_STATUS', text: '수집 완료!' });
}

async function scrapeProductDetails(url) {
    // To get review images, we need to load the product page and potentially click the review tab.
    // This is best handled by opening a temporary tab.
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'OPEN_PRODUCT_TAB', url }, (response) => {
            resolve(response || { name: '', images: [] });
        });
    });
}

function findButtonByText(parent, text) {
    const buttons = parent.querySelectorAll('button, a');
    return Array.from(buttons).find(b => b.textContent.includes(text));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
