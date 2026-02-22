chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SAVE_TO_NOTION') {
        saveToNotion(request.data)
            .then(res => sendResponse({ success: true, data: res }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // async response
    }

    if (request.action === 'OPEN_PRODUCT_TAB') {
        handleProductScraping(request.url)
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ name: 'Error', images: [], error: err.message }));
        return true;
    }
});

async function handleProductScraping(url) {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url, active: false }, (tab) => {
            let timer = setTimeout(() => {
                chrome.tabs.remove(tab.id);
                reject(new Error('Tab timeout'));
            }, 20000);

            const listener = (message, sender) => {
                if (sender.tab && sender.tab.id === tab.id && message.action === 'PRODUCT_DATA_READY') {
                    clearTimeout(timer);
                    chrome.runtime.onMessage.removeListener(listener);
                    chrome.tabs.remove(tab.id);
                    resolve(message.data);
                }
            };

            chrome.runtime.onMessage.addListener(listener);
        });
    });
}

async function saveToNotion(data) {
    const settings = await chrome.storage.local.get(['notionKey', 'dbId']);
    if (!settings.notionKey || !settings.dbId) {
        throw new Error('Notion API Key 또는 Database ID가 설정되지 않았습니다.');
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${settings.notionKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
            parent: { database_id: settings.dbId },
            properties: {
                'Name': {
                    title: [{ text: { content: data.productName } }]
                },
                'ReferenceURL': {
                    url: data.referenceUrl
                },
                'AffiliateLink': {
                    url: data.affiliateLink
                },
                'Photo1': {
                    url: data.photos[0] || ''
                },
                'Photo2': {
                    url: data.photos[1] || ''
                },
                'Photo3': {
                    url: data.photos[2] || ''
                },
                'Photo4': {
                    url: data.photos[3] || ''
                },
                'Status': {
                    select: { name: '초안작성' }
                }
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API Error: ${errorData.message}`);
    }

    return await response.json();
}
