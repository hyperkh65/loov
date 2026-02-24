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
    ai_commentary TEXT,
    waste_items JSONB,
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

-- 기존 정책 삭제 후 생성 (Idempotent)
DROP POLICY IF EXISTS "Public read led_products" ON led_products;
CREATE POLICY "Public read led_products" ON led_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read led_price_history" ON led_price_history;
CREATE POLICY "Public read led_price_history" ON led_price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read led_reports" ON led_reports;
CREATE POLICY "Public read led_reports" ON led_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert led_products" ON led_products;
CREATE POLICY "Public insert led_products" ON led_products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update led_products" ON led_products;
CREATE POLICY "Public update led_products" ON led_products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public insert led_price_history" ON led_price_history;
CREATE POLICY "Public insert led_price_history" ON led_price_history FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert led_reports" ON led_reports;
CREATE POLICY "Public insert led_reports" ON led_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update led_reports" ON led_reports;
CREATE POLICY "Public update led_reports" ON led_reports FOR UPDATE USING (true);

-- 작업 상태 테이블 (관리용)
CREATE TABLE IF NOT EXISTS led_collection_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'IDLE',
    progress TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    result_summary JSONB
);

-- 기존 정책 삭제 후 생성
DROP POLICY IF EXISTS "Public access led_collection_jobs" ON led_collection_jobs;
ALTER TABLE led_collection_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access led_collection_jobs" ON led_collection_jobs FOR ALL USING (true);

-- 초기 데이터
INSERT INTO led_collection_jobs (id, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'IDLE')
ON CONFLICT (id) DO NOTHING;

-- 새 컬럼 추가 (테이블이 이미 있는 경우를 대비)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='led_reports' AND column_name='ai_commentary') THEN
        ALTER TABLE led_reports ADD COLUMN ai_commentary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='led_reports' AND column_name='waste_items') THEN
        ALTER TABLE led_reports ADD COLUMN waste_items JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='led_products' AND column_name='specs') THEN
        ALTER TABLE led_products ADD COLUMN specs JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='led_products' AND column_name='seller_count') THEN
        ALTER TABLE led_products ADD COLUMN seller_count INTEGER DEFAULT 1;
    END IF;
END $$;

