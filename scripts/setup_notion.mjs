import { Client } from '@notionhq/client';
import fs from 'fs';

const token = process.env.VITE_NOTION_TOKEN;
const notion = new Client({ auth: token });

async function setup() {
    try {
        console.log("Searching for parent pages available to this integration...");
        const searchResponse = await notion.search({
            filter: { property: 'object', value: 'page' },
        });

        if (searchResponse.results.length === 0) {
            console.error("No pages found! Please share a page with the integration first before running this script.");
            process.exit(1);
        }

        const parentPageId = searchResponse.results[0].id;
        console.log(`Found parent page ID: ${parentPageId}`);

        // Create 'posts' database
        console.log("Creating 'posts' database...");
        const postsDb = await notion.databases.create({
            parent: { type: 'page_id', page_id: parentPageId },
            title: [{ type: 'text', text: { content: 'LOOV Posts (게시판)' } }],
            properties: {
                Title: { title: {} },
                Category: { select: { options: [{ name: '공지사항', color: 'red' }, { name: '일반', color: 'blue' }] } },
                Author: { rich_text: {} },
                CreatedAt: { date: {} },
                Content: { rich_text: {} }
            }
        });
        console.log(`Created Posts DB with ID: ${postsDb.id}`);

        // Create 'market_data' database
        console.log("Creating 'market_data' database...");
        const marketDb = await notion.databases.create({
            parent: { type: 'page_id', page_id: parentPageId },
            title: [{ type: 'text', text: { content: 'LOOV Market Data' } }],
            properties: {
                Title: { title: {} },
                Category: { select: { options: [{ name: '분석', color: 'green' }, { name: '조달시장', color: 'yellow' }] } },
                Value: { number: { format: 'number' } },
                Description: { rich_text: {} },
                Date: { date: {} },
            }
        });
        console.log(`Created Market Data DB with ID: ${marketDb.id}`);

        console.log("Notion setup complete.");
        // Write .env.local
        const envContent = `\nVITE_NOTION_POSTS_DB_ID=${postsDb.id}\nVITE_NOTION_MARKET_DB_ID=${marketDb.id}\nVITE_NOTION_TOKEN=${token}\n`;
        fs.writeFileSync('./.env.local', envContent, { flag: 'a' });
        console.log("Appended IDs to .env.local");
    } catch (error) {
        console.error("Error setting up Notion databases:", error);
    }
}

setup();
