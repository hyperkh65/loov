document.addEventListener('DOMContentLoaded', () => {
    const notionKeyInput = document.getElementById('notionKey');
    const dbIdInput = document.getElementById('dbId');
    const saveBtn = document.getElementById('saveBtn');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    chrome.storage.local.get(['notionKey', 'dbId'], (res) => {
        if (res.notionKey) notionKeyInput.value = res.notionKey;
        if (res.dbId) dbIdInput.value = res.dbId;
    });

    saveBtn.addEventListener('click', () => {
        const notionKey = notionKeyInput.value.trim();
        const dbId = dbIdInput.value.trim();

        chrome.storage.local.set({ notionKey, dbId }, () => {
            statusDiv.textContent = '설정이 저장되었습니다.';
            setTimeout(() => { statusDiv.textContent = ''; }, 2000);
        });
    });

    scrapeBtn.addEventListener('click', async () => {
        statusDiv.textContent = '수집을 시작합니다...';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('partners.coupang.com')) {
            statusDiv.textContent = '오류: 쿠팡 파트너스 페이지에서 실행해 주세요.';
            return;
        }

        chrome.tabs.sendMessage(tab.id, { action: 'START_SCRAPING' }, (response) => {
            if (chrome.runtime.lastError) {
                statusDiv.textContent = '오류: 페이지를 새로고침 후 다시 시도해 주세요.';
            } else {
                statusDiv.textContent = response.message || '수집 중...';
            }
        });
    });
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'UPDATE_STATUS') {
        document.getElementById('status').textContent = msg.text;
    }
});
