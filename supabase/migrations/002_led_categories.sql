CREATE TABLE IF NOT EXISTS led_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    keyword TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_scraped_at TIMESTAMPTZ
);

INSERT INTO led_categories (name, keyword) VALUES 
('LED 센서등', 'LED 센서등'),
('LED 다운라이트', 'LED 다운라이트'),
('LED 방등', 'LED 방등'),
('LED 평판등', 'LED 평판등'),
('LED 직부등', 'LED 직부등'),
('LED 주방등', 'LED 주방등'),
('LED 욕실등', 'LED 욕실등'),
('LED 거실등', 'LED 거실등'),
('LED T5', 'LED T5'),
('LED 전구', 'LED 전구'),
('LED 투광기', 'LED 투광기'),
('LED 레일등', 'LED 레일등'),
('LED 취침등', 'LED 취침등'),
('LED 펜던트', 'LED 펜던트')
ON CONFLICT (name) DO NOTHING;
