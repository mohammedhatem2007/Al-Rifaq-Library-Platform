create table if not exists public.platform_settings (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10, 2) not null default 0,
  originalprice numeric(10, 2),
  discount numeric(10, 2),
  image text not null default '',
  description text not null default '',
  instock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  id text primary key,
  name text not null,
  fee numeric(10, 2) not null default 0 check (fee >= 0),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
      alter publication supabase_realtime add table public.products;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'delivery_zones') then
      alter publication supabase_realtime add table public.delivery_zones;
    end if;
  end if;
end
$$;

create table if not exists public.payment_settings (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.products to anon, authenticated;
grant select, insert, update, delete on public.delivery_zones to anon, authenticated;
grant select, insert, update, delete on public.payment_settings to anon, authenticated;

alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.payment_settings enable row level security;

drop policy if exists "Public settings read" on public.platform_settings;
drop policy if exists "Public settings write" on public.platform_settings;
drop policy if exists "Public settings update" on public.platform_settings;
create policy "Public settings read" on public.platform_settings for select using (true);
create policy "Public settings write" on public.platform_settings for insert with check (true);
create policy "Public settings update" on public.platform_settings for update using (true) with check (true);

drop policy if exists "Public products read" on public.products;
drop policy if exists "Public products write" on public.products;
drop policy if exists "Public products update" on public.products;
drop policy if exists "Public products delete" on public.products;
create policy "Public products read" on public.products for select using (true);
create policy "Public products write" on public.products for insert with check (true);
create policy "Public products update" on public.products for update using (true) with check (true);
create policy "Public products delete" on public.products for delete using (true);

drop policy if exists "Public delivery zones read" on public.delivery_zones;
drop policy if exists "Public delivery zones insert" on public.delivery_zones;
drop policy if exists "Public delivery zones update" on public.delivery_zones;
drop policy if exists "Public delivery zones delete" on public.delivery_zones;
create policy "Public delivery zones read" on public.delivery_zones for select using (true);
create policy "Public delivery zones insert" on public.delivery_zones for insert with check (true);
create policy "Public delivery zones update" on public.delivery_zones for update using (true) with check (true);
create policy "Public delivery zones delete" on public.delivery_zones for delete using (true);

drop policy if exists "Public payment settings read" on public.payment_settings;
drop policy if exists "Public payment settings insert" on public.payment_settings;
drop policy if exists "Public payment settings update" on public.payment_settings;
drop policy if exists "Public payment settings delete" on public.payment_settings;
create policy "Public payment settings read" on public.payment_settings for select using (true);
create policy "Public payment settings insert" on public.payment_settings for insert with check (true);
create policy "Public payment settings update" on public.payment_settings for update using (true) with check (true);
create policy "Public payment settings delete" on public.payment_settings for delete using (true);