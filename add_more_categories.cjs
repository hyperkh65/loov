const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const newCategories = [
    { name: 'LED 평판등', keyword: 'LED 평판등' },
    { name: 'LED 주차장등', keyword: 'LED 주차장등' },
    { name: 'LED 터널등', keyword: 'LED 터널등' },
    { name: 'LED 보안등', keyword: 'LED 보안등' },
    { name: 'LED 경관조명', keyword: 'LED 경관조명' },
    { name: 'LED 스탠드', keyword: 'LED 스탠드' },
    { name: 'LED 바', keyword: 'LED 바' },
    { name: 'LED 모듈', keyword: 'LED 모듈' },
    { name: 'LED 거실등', keyword: 'LED 거실등' },
    { name: 'LED 방등', keyword: 'LED 방등' },
    { name: 'LED 주방등', keyword: 'LED 주방등' },
    { name: 'LED 욕실등', keyword: 'LED 욕실등' },
    { name: 'LED 현관등', keyword: 'LED 현관등' },
    { name: 'LED 센서등', keyword: 'LED 센서등' }
];

async function addCategories() {
    console.log('◈ Adding new categories to expand market coverage...');
    for (const cat of newCategories) {
        const { data, error } = await supabase
            .from('led_categories')
            .upsert({ ...cat, is_active: true }, { onConflict: 'name' });

        if (error) {
            console.error(`! Failed to add ${cat.name}:`, error.message);
        } else {
            console.log(`✓ Added/Updated: ${cat.name}`);
        }
    }
    console.log('◈ Category expansion complete.');
}

addCategories();
