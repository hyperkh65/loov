create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text not null,
  author text not null,
  views integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists market_data (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null,
  value numeric not null,
  description text,
  date timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table posts enable row level security;
create policy "Public posts are viewable by everyone." on posts for select using (true);
create policy "Anyone can insert posts." on posts for insert with check (true);
create policy "Anyone can update posts views." on posts for update using (true);

alter table market_data enable row level security;
create policy "Public market data is viewable by everyone." on market_data for select using (true);
create policy "Anyone can insert market data." on market_data for insert with check (true);
