
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const notion = new Client({ auth: process.env.VITE_NOTION_TOKEN });
const dbId = process.env.VITE_NOTION_MARKET_DB_ID;

async function testSync() {
    try {
        console.log("Testing Notion Sync...");
        const response = await notion.pages.create({
            parent: { database_id: dbId },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: `Test Sync - ${new Date().toLocaleString()}`
                            }
                        }
                    ]
                }
            }
        });
        console.log("Success! Page created:", response.url);
    } catch (error) {
        console.error("Notion Sync Failed:", error.message);
    }
}

testSync();
