-- 조달 인텔리전스 확장 스키마

-- 1. 회사 테이블 (제조사/공급사)
CREATE TABLE IF NOT EXISTS pro_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    biz_no TEXT UNIQUE, -- 사업자번호
    name TEXT NOT NULL,
    company_type TEXT, -- manufacturer, distributor
    address TEXT,
    representative TEXT,
    contacts JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 조달 제품 마스터
CREATE TABLE IF NOT EXISTS pro_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prdct_idnt_no TEXT UNIQUE NOT NULL, -- 물품식별번호 (G2B)
    name TEXT NOT NULL,
    category_lv1 TEXT,
    category_lv2 TEXT,
    company_id UUID REFERENCES pro_companies(id),
    status TEXT DEFAULT 'active', -- active, suspended, deleted
    image_url TEXT,
    source_registered_at TIMESTAMPTZ,
    source_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 정규화된 제품 사양 (Snapshots by date)
CREATE TABLE IF NOT EXISTS pro_product_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
    as_of_date DATE DEFAULT CURRENT_DATE,
    power_w NUMERIC,
    luminous_flux_lm NUMERIC,
    efficacy_lm_per_w NUMERIC,
    cct_k INTEGER,
    cri INTEGER,
    beam_angle TEXT,
    ip_rating TEXT,
    ik_rating TEXT,
    lifetime_hours INTEGER,
    warranty_years INTEGER,
    notes_raw_text TEXT,
    parse_confidence NUMERIC,
    UNIQUE(product_id, as_of_date)
);

-- 4. 인증 정보
CREATE TABLE IF NOT EXISTS pro_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
    cert_type TEXT, -- KC, KS, 고효율, NEP, 친환경 등
    cert_no TEXT,
    issued_at DATE,
    expires_at DATE,
    status TEXT DEFAULT 'valid',
    cert_image_url TEXT,
    UNIQUE(product_id, cert_type, cert_no)
);

-- 5. 가격 스냅샷 (계약단가/납품단가)
CREATE TABLE IF NOT EXISTS pro_price_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
    as_of_date DATE DEFAULT CURRENT_DATE,
    price_type TEXT, -- contract_unit_price, delivery_unit_price
    unit_price INTEGER,
    currency TEXT DEFAULT 'KRW',
    unit_name TEXT DEFAULT 'EA',
    source_ref TEXT, -- 계약번호 등
    UNIQUE(product_id, as_of_date, price_type)
);

-- 6. 변경 이벤트 로그 (UI/알림용)
CREATE TABLE IF NOT EXISTS pro_change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES pro_products(id) ON DELETE CASCADE,
    event_type TEXT, -- price_change, spec_change, cert_change, new_product, status_change
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    before_value JSONB,
    after_value JSONB,
    diff_summary TEXT,
    severity TEXT DEFAULT 'medium' -- low, medium, high
);

-- 7. 제품 카테고리 요약 (시장판 통계 데이터)
CREATE TABLE IF NOT EXISTS pro_market_overviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT,
    as_of_date DATE DEFAULT CURRENT_DATE,
    total_companies INTEGER,
    total_products INTEGER,
    min_price INTEGER,
    median_price INTEGER,
    top_10_percent_price INTEGER,
    avg_efficacy NUMERIC,
    metrics JSONB,
    UNIQUE(category_name, as_of_date)
);

-- 8. 인덱스 설정
CREATE INDEX idx_pro_products_company ON pro_products(company_id);
CREATE INDEX idx_pro_products_cat ON pro_products(category_lv2);
CREATE INDEX idx_pro_specs_product ON pro_product_specs(product_id);
CREATE INDEX idx_pro_prices_product ON pro_price_snapshots(product_id);
CREATE INDEX idx_pro_events_product ON pro_change_events(product_id);
CREATE INDEX idx_pro_events_date ON pro_change_events(detected_at);

-- RLS 활성화 및 공개 읽기 허용
ALTER TABLE pro_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_market_overviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pro_companies" ON pro_companies FOR SELECT USING (true);
CREATE POLICY "Public read pro_products" ON pro_products FOR SELECT USING (true);
CREATE POLICY "Public read pro_product_specs" ON pro_product_specs FOR SELECT USING (true);
CREATE POLICY "Public read pro_certifications" ON pro_certifications FOR SELECT USING (true);
CREATE POLICY "Public read pro_price_snapshots" ON pro_price_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read pro_change_events" ON pro_change_events FOR SELECT USING (true);
CREATE POLICY "Public read pro_market_overviews" ON pro_market_overviews FOR SELECT USING (true);

-- 모든 테이블에 대해 익명 쓰기 허용 (내부 스크립트용, 운영 시 수정 필요)
CREATE POLICY "Internal write pro_companies" ON pro_companies FOR ALL WITH CHECK (true);
CREATE POLICY "Internal write pro_products" ON pro_products FOR ALL WITH CHECK (true);
CREATE POLICY "Internal write pro_product_specs" ON pro_product_specs FOR ALL WITH CHECK (true);
CREATE POLICY "Internal write pro_certifications" ON pro_certifications FOR ALL WITH CHECK (true);
CREATE POLICY "Internal write pro_price_snapshots" ON pro_price_snapshots FOR ALL WITH CHECK (true);
CREATE POLICY "Internal write pro_change_events" ON pro_change_events FOR ALL WITH CHECK (true);
CREATE POLICY "Internal write pro_market_overviews" ON pro_market_overviews FOR ALL WITH CHECK (true);
