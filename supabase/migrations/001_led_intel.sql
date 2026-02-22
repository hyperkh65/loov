-- LED 제품 테이블
CREATE TABLE IF NOT EXISTS led_products (
    id BIGSERIAL PRIMARY KEY,
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    price INTEGER,
    maker TEXT DEFAULT 'Unknown',
    category TEXT DEFAULT 'LED',
    image_url TEXT,
    source TEXT DEFAULT 'market_search',
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 가격 이력 테이블
CREATE TABLE IF NOT EXISTS led_price_history (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT REFERENCES led_products(external_id),
    price INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일일 리포트 테이블
CREATE TABLE IF NOT EXISTS led_reports (
    id BIGSERIAL PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    total_products INTEGER,
    total_makers INTEGER,
    total_categories INTEGER,
    overall_avg_price INTEGER,
    overall_min_price INTEGER,
    overall_max_price INTEGER,
    category_stats JSONB,
    top_makers JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_products_maker ON led_products(maker);
CREATE INDEX IF NOT EXISTS idx_products_category ON led_products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON led_products(price);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON led_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON led_price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_reports_date ON led_reports(date);

-- RLS 정책 (공개 읽기, 인증된 사용자만 쓰기)
ALTER TABLE led_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_reports ENABLE ROW LEVEL SECURITY;

-- 모두 읽기 가능
CREATE POLICY "Public read led_products" ON led_products FOR SELECT USING (true);
CREATE POLICY "Public read led_price_history" ON led_price_history FOR SELECT USING (true);
CREATE POLICY "Public read led_reports" ON led_reports FOR SELECT USING (true);

-- 모두 쓰기 가능 (서비스 키 or anon 허용)
CREATE POLICY "Public insert led_products" ON led_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update led_products" ON led_products FOR UPDATE USING (true);
CREATE POLICY "Public insert led_price_history" ON led_price_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert led_reports" ON led_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update led_reports" ON led_reports FOR UPDATE USING (true);
