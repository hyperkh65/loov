
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { Client } from "@notionhq/client";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const notion = new Client({ auth: process.env.VITE_NOTION_TOKEN });
const notionDbId = process.env.VITE_NOTION_MARKET_DB_ID;

const CATEGORIES = [
    { name: 'LED 다운라이트', maxPages: 25 },
    { name: 'LED 방등', maxPages: 20 },
    { name: 'LED 거실등', maxPages: 20 },
    { name: 'LED 주방등', maxPages: 15 },
    { name: 'LED 센서등', maxPages: 15 },
    { name: 'LED 투광등', maxPages: 20 },
    { name: 'LED 전구', maxPages: 30 },
    { name: 'LED 스트립', maxPages: 15 },
    { name: 'LED 평면등', maxPages: 15 },
    { name: 'LED 펜던트', maxPages: 20 },
    { name: 'LED 벽등', maxPages: 20 },
    { name: 'LED 작업등', maxPages: 15 },
    { name: 'LED 모듈', maxPages: 15 },
    { name: 'LED T5', maxPages: 15 },
    { name: 'LED 가로등', maxPages: 10 },
    { name: 'LED 욕실등', maxPages: 15 }
];

async function scrapeCategory(page, category) {
    let categoryProducts = [];
    const encoded = encodeURIComponent(category.name);

    console.log(`\n◈ MEGA HARVESTING: [${category.name}]`);

    try {
        // Initial load to check status
        const firstUrl = `https://search.danawa.com/dsearch.php?query=${encoded}&volumeType=allvs&page=1&limit=40`;
        await page.goto(firstUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        const totalCount = await page.evaluate(() => {
            const countEl = document.querySelector('.num_res strong') ||
                document.querySelector('#totCnt') ||
                document.querySelector('.res_cnt') ||
                document.querySelector('span.num_res');
            return countEl ? parseInt(countEl.innerText.replace(/[^0-9]/g, '')) : 0;
        });

        // If count is 0, we still try at least 5 pages as a fallback
        const pagesToScrape = totalCount > 0 ? Math.min(Math.ceil(totalCount / 40), category.maxPages) : 10;
        console.log(`   - Market Volume: Total ${totalCount.toLocaleString()} products found.`);
        console.log(`   - Crawl Plan: Scoping ${pagesToScrape} pages...`);

        for (let p = 1; p <= pagesToScrape; p++) {
            const url = `https://search.danawa.com/dsearch.php?query=${encoded}&volumeType=allvs&page=${p}&limit=40`;
            if (p > 1) {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            }

            const items = await page.evaluate((catName) => {
                const results = [];
                document.querySelectorAll('li.prod_item').forEach(el => {
                    const name = el.querySelector('.prod_name a')?.innerText?.trim();
                    const priceStr = el.querySelector('.price_sect strong')?.innerText?.replace(/[,원\s]/g, '');
                    const price = parseInt(priceStr);
                    const maker = el.querySelector('.text_maker')?.innerText?.trim() || name?.split(' ')[0];
                    const img = el.querySelector('.thumb_image img')?.getAttribute('src') || el.querySelector('.thumb_image img')?.getAttribute('data-original');
                    const productId = el.getAttribute('id')?.replace('productItem', '');
                    const sellerCount = el.querySelector('.cnt_p')?.innerText?.replace(/[^0-9]/g, '') || "1";

                    // Detailed Spec Parsing
                    const specText = el.querySelector('.spec_list')?.innerText?.trim() || "";
                    const specs = {};
                    if (specText) {
                        const parts = specText.split(' / ');
                        parts.forEach(part => {
                            if (part.includes('색온도:')) specs.color_temp = part.replace('색온도:', '').trim();
                            if (part.includes('밝기:')) specs.brightness = part.replace('밝기:', '').trim();
                            if (part.includes('소비전력:')) specs.wattage = part.replace('소비전력:', '').trim();
                            if (part.includes('광효율:')) specs.efficiency = part.replace('광효율:', '').trim();
                            if (part.includes('연색지수:')) specs.cri = part.replace('연색지수:', '').trim();
                            if (part.includes('크기:')) specs.size = part.replace('크기:', '').trim();
                        });
                        // Regex fallback for items like "3인치", "4인치" in name
                        if (!specs.size) {
                            const sizeMatch = name.match(/(\d+(?:\.\d+)?)(?:인치|mm|cm|W)/i);
                            if (sizeMatch) specs.size_hint = sizeMatch[0];
                        }
                    }

                    if (name && price > 0) {
                        results.push({
                            external_id: productId || `dnw-${Math.random().toString(36).substr(2, 9)}`,
                            name,
                            price,
                            maker,
                            category: catName,
                            seller_count: parseInt(sellerCount),
                            image_url: img?.startsWith('//') ? 'https:' + img : img,
                            specs: specs,
                            collected_at: new Date().toISOString()
                        });
                    }
                });
                return results;
            }, category.name);

            if (items.length === 0) {
                console.log(`     > Page ${p}: Empty (Breaking)`);
                break;
            }

            console.log(`     > Page ${p}/${pagesToScrape}: ${items.length} items collected.`);
            categoryProducts.push(...items);

            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
        }
    } catch (e) {
        console.error(`   ! Error in category ${category.name}: ${e.message}`);
    }

    return categoryProducts;
}

async function runMegaHarvester() {
    console.log("◈ INITIALIZING RELENTLESS DATA HARVESTER (MEGA MODE)...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        let allData = [];
        for (const cat of CATEGORIES) {
            const products = await scrapeCategory(page, cat);
            allData.push(...products);
            await new Promise(r => setTimeout(r, 5000)); // Cool down
        }

        const uniqueData = Array.from(new Map(allData.map(p => [p.external_id, p])).values());
        console.log(`\n◈ MEGA HARVEST COMPLETE: ${uniqueData.length} UNIQUE ITEMS`);

        // Chunked Upsert to avoid timeout/size errors
        console.log("◈ UPSERTING TO MASTER DATABASE...");
        const BATCH_SIZE = 100;
        for (let i = 0; i < uniqueData.length; i += BATCH_SIZE) {
            const batch = uniqueData.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('led_products').upsert(batch, { onConflict: 'external_id' });
            if (error) console.error(`   ! Batch error: ${error.message}`);
            else console.log(`   - Batch ${i / BATCH_SIZE + 1} uploaded.`);
        }

        // Notion Final Report
        console.log("◈ LOGGING MEGA HARVEST TO NOTION...");
        await notion.pages.create({
            parent: { database_id: notionDbId },
            properties: {
                Name: {
                    title: [{ text: { content: `MEGA LED Harvest Log - ${new Date().toLocaleDateString()} (${uniqueData.length} Items)` } }]
                }
            },
            children: [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: { rich_text: [{ text: { content: '📦 Mega Collection Complete' } }] }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: { rich_text: [{ text: { content: `A relentless crawl has harvested ${uniqueData.length} unique LED products across ${CATEGORIES.length} categories.` } }] }
                }
            ]
        });

        console.log("◈ MISSION ACCOMPLISHED.");

    } catch (err) {
        console.error("Critical Failure:", err.message);
    } finally {
        await browser.close();
    }
}

runMegaHarvester();
