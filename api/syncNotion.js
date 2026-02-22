import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.VITE_NOTION_TOKEN });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { type, data } = req.body;
        const postsDbId = process.env.VITE_NOTION_POSTS_DB_ID;
        const marketDbId = process.env.VITE_NOTION_MARKET_DB_ID;

        if (type === 'post') {
            await notion.pages.create({
                parent: { database_id: postsDbId },
                properties: {
                    Title: { title: [{ text: { content: data.title } }] },
                    Category: { select: { name: data.category || '일반' } },
                    Author: { rich_text: [{ text: { content: data.author } }] },
                    CreatedAt: { date: { start: new Date().toISOString() } },
                    Content: { rich_text: [{ text: { content: data.content } }] }
                }
            });
            return res.status(200).json({ success: true, message: 'Synced post to Notion' });
        } else if (type === 'market') {
            await notion.pages.create({
                parent: { database_id: marketDbId },
                properties: {
                    Title: { title: [{ text: { content: data.title } }] },
                    Category: { select: { name: data.category || '분석' } },
                    Value: { number: Number(data.value) },
                    Description: { rich_text: [{ text: { content: data.description || '' } }] },
                    Date: { date: { start: data.date ? new Date(data.date).toISOString() : new Date().toISOString() } }
                }
            });
            return res.status(200).json({ success: true, message: 'Synced market data to Notion' });
        }

        return res.status(400).json({ error: 'Unknown sync type' });
    } catch (err) {
        console.error('Notion Sync Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
