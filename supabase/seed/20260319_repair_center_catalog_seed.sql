begin;

insert into public.repair_catalog_brands (category, brand_name, slug, active)
values
  ('phone', 'Apple', 'apple-phone', true),
  ('tablet', 'Apple', 'apple-tablet', true),
  ('laptop', 'Apple', 'apple-laptop', true),
  ('phone', 'Samsung', 'samsung-phone', true),
  ('laptop', 'Dell', 'dell-laptop', true),
  ('laptop', 'HP', 'hp-laptop', true),
  ('laptop', 'Lenovo', 'lenovo-laptop', true)
on conflict (slug) do update
set
  category = excluded.category,
  brand_name = excluded.brand_name,
  active = excluded.active,
  updated_at = now();

with model_seed as (
  select *
  from (values
    ('apple-phone', 'phone', 'iPhone 11 Series', 'iPhone 11', 'iphone-11', 2019, true, true, true, false, true, null),
    ('apple-phone', 'phone', 'iPhone 12 Series', 'iPhone 12', 'iphone-12', 2020, true, true, true, false, true, null),
    ('apple-phone', 'phone', 'iPhone 13 Series', 'iPhone 13', 'iphone-13', 2021, true, true, true, false, true, null),
    ('apple-phone', 'phone', 'iPhone 14 Series', 'iPhone 14', 'iphone-14', 2022, true, true, true, false, true, null),
    ('apple-phone', 'phone', 'iPhone 14 Pro Series', 'iPhone 14 Pro', 'iphone-14-pro', 2022, true, true, true, false, true, 'face-id-risk'),
    ('apple-phone', 'phone', 'iPhone 15 Series', 'iPhone 15', 'iphone-15', 2023, true, true, true, false, true, null),
    ('apple-phone', 'phone', 'iPhone 15 Pro Series', 'iPhone 15 Pro', 'iphone-15-pro', 2023, true, true, true, false, true, 'face-id-risk'),
    ('apple-phone', 'phone', 'iPhone 16 Series', 'iPhone 16', 'iphone-16', 2024, true, true, true, false, true, null),
    ('samsung-phone', 'phone', 'Galaxy S23 Series', 'Galaxy S23', 'galaxy-s23', 2023, true, true, true, false, true, null),
    ('samsung-phone', 'phone', 'Galaxy FE Series', 'Galaxy S24 FE', 'galaxy-s24-fe', 2024, true, true, true, false, true, null),
    ('samsung-phone', 'phone', 'Galaxy Ultra Series', 'Galaxy S24 Ultra', 'galaxy-s24-ultra', 2024, true, true, true, false, true, 'frame-risk'),
    ('samsung-phone', 'phone', 'Galaxy S25 Series', 'Galaxy S25', 'galaxy-s25', 2025, true, true, true, false, true, null),
    ('apple-tablet', 'tablet', 'iPad Standard', 'iPad 10th Gen', 'ipad-10th-gen', 2022, true, true, true, false, true, null),
    ('apple-tablet', 'tablet', 'iPad Air', 'iPad Air M2', 'ipad-air-m2', 2024, true, true, true, false, true, 'laminated-display'),
    ('apple-tablet', 'tablet', 'iPad Pro', 'iPad Pro 11-inch M4', 'ipad-pro-11-m4', 2024, true, true, true, false, true, 'laminated-display'),
    ('apple-laptop', 'laptop', 'MacBook Air', 'MacBook Air 13-inch M2', 'macbook-air-m2-13', 2022, false, true, false, true, true, 'top-case-risk'),
    ('apple-laptop', 'laptop', 'MacBook Pro', 'MacBook Pro 14-inch M3', 'macbook-pro-14-m3', 2023, false, true, false, true, true, 'top-case-risk'),
    ('dell-laptop', 'laptop', 'Inspiron', 'Dell Inspiron 15', 'dell-inspiron-15', 2023, false, true, false, true, true, null),
    ('hp-laptop', 'laptop', 'Pavilion', 'HP Pavilion 15', 'hp-pavilion-15', 2023, false, true, false, true, true, null),
    ('lenovo-laptop', 'laptop', 'ThinkPad', 'ThinkPad T14', 'thinkpad-t14', 2023, false, true, false, true, true, null)
  ) as t(brand_slug, category, family_name, model_name, model_key, model_year, supports_screen, supports_battery, supports_charging, supports_keyboard, supports_software, quote_only_flags)
)
insert into public.repair_catalog_models (
  brand_id,
  category,
  family_name,
  model_name,
  model_key,
  model_year,
  active,
  supports_screen,
  supports_battery,
  supports_charging,
  supports_keyboard,
  supports_software,
  quote_only_flags
)
select
  b.id,
  m.category,
  m.family_name,
  m.model_name,
  m.model_key,
  m.model_year,
  true,
  m.supports_screen,
  m.supports_battery,
  m.supports_charging,
  m.supports_keyboard,
  m.supports_software,
  m.quote_only_flags
from model_seed m
join public.repair_catalog_brands b on b.slug = m.brand_slug
on conflict (model_key) do update
set
  brand_id = excluded.brand_id,
  category = excluded.category,
  family_name = excluded.family_name,
  model_name = excluded.model_name,
  model_year = excluded.model_year,
  active = excluded.active,
  supports_screen = excluded.supports_screen,
  supports_battery = excluded.supports_battery,
  supports_charging = excluded.supports_charging,
  supports_keyboard = excluded.supports_keyboard,
  supports_software = excluded.supports_software,
  quote_only_flags = excluded.quote_only_flags,
  updated_at = now();

insert into public.repair_types (
  repair_key,
  repair_name,
  category,
  price_mode_default,
  requires_parts,
  requires_manual_review_by_default,
  warranty_days_default,
  active
)
values
  ('screen', 'Screen replacement', null, 'range', true, false, 90, true),
  ('battery', 'Battery replacement', null, 'fixed', true, false, 90, true),
  ('charging', 'Charging port repair', null, 'range', true, false, 90, true),
  ('camera', 'Rear camera repair', 'phone', 'range', true, false, 90, true),
  ('software', 'Software restore / cleanup', null, 'fixed', false, false, 30, true),
  ('diagnostic', 'No power / deeper inspection', null, 'manual', false, true, 0, true),
  ('ssd-upgrade', 'SSD install + setup', 'laptop', 'range', true, false, 90, true),
  ('keyboard', 'Keyboard replacement', 'laptop', 'range', true, false, 90, true)
on conflict (repair_key) do update
set
  repair_name = excluded.repair_name,
  category = excluded.category,
  price_mode_default = excluded.price_mode_default,
  requires_parts = excluded.requires_parts,
  requires_manual_review_by_default = excluded.requires_manual_review_by_default,
  warranty_days_default = excluded.warranty_days_default,
  active = excluded.active,
  updated_at = now();

with pricing_seed as (
  select *
  from (values
    ('iphone-11', 'screen', 'range', 'premium_aftermarket', 55.00, 69.00, 0.00, 10.00, 20.00, null, 129.00, 159.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-11', 'battery', 'fixed', 'premium_aftermarket', 35.00, 69.00, 0.00, 5.00, 10.00, 99.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-11', 'charging', 'range', 'premium_aftermarket', 28.00, 79.00, 0.00, 10.00, 12.00, null, 109.00, 139.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-11', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 79.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('iphone-12', 'screen', 'range', 'premium_aftermarket', 64.00, 69.00, 0.00, 10.00, 20.00, null, 139.00, 169.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-12', 'battery', 'fixed', 'premium_aftermarket', 39.00, 69.00, 0.00, 5.00, 12.00, 109.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-12', 'charging', 'range', 'premium_aftermarket', 30.00, 79.00, 0.00, 10.00, 14.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-12', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 79.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('iphone-13', 'screen', 'range', 'premium_aftermarket', 70.00, 69.00, 0.00, 10.00, 20.00, null, 159.00, 189.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-13', 'battery', 'fixed', 'premium_aftermarket', 40.00, 69.00, 0.00, 5.00, 12.00, 119.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-13', 'charging', 'range', 'premium_aftermarket', 32.00, 79.00, 0.00, 10.00, 16.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-13', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 79.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('iphone-14', 'screen', 'range', 'premium_aftermarket', 85.00, 69.00, 0.00, 10.00, 20.00, null, 169.00, 209.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-14', 'battery', 'fixed', 'premium_aftermarket', 45.00, 69.00, 0.00, 5.00, 15.00, 129.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-14', 'charging', 'range', 'premium_aftermarket', 34.00, 79.00, 0.00, 10.00, 18.00, null, 119.00, 159.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-14', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 79.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('iphone-14-pro', 'screen', 'range', 'premium_aftermarket', 120.00, 79.00, 0.00, 15.00, 25.00, null, 229.00, 279.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-14-pro', 'battery', 'fixed', 'premium_aftermarket', 50.00, 69.00, 0.00, 10.00, 10.00, 139.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-14-pro', 'charging', 'range', 'premium_aftermarket', 36.00, 89.00, 0.00, 15.00, 18.00, null, 129.00, 169.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-14-pro', 'camera', 'range', 'premium_aftermarket', 95.00, 89.00, 0.00, 15.00, 20.00, null, 179.00, 249.00, 25.00, 14.95, 3, 5, 90),

    ('iphone-15', 'screen', 'range', 'premium_aftermarket', 130.00, 79.00, 0.00, 15.00, 25.00, null, 189.00, 239.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-15', 'battery', 'fixed', 'premium_aftermarket', 55.00, 69.00, 0.00, 10.00, 10.00, 139.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-15', 'charging', 'range', 'premium_aftermarket', 38.00, 89.00, 0.00, 15.00, 18.00, null, 129.00, 169.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-15', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 89.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('iphone-15-pro', 'screen', 'range', 'premium_aftermarket', 160.00, 89.00, 0.00, 20.00, 25.00, null, 249.00, 319.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-15-pro', 'battery', 'fixed', 'premium_aftermarket', 59.00, 69.00, 0.00, 10.00, 10.00, 149.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-15-pro', 'charging', 'range', 'premium_aftermarket', 42.00, 89.00, 0.00, 15.00, 18.00, null, 139.00, 179.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-15-pro', 'camera', 'range', 'premium_aftermarket', 120.00, 89.00, 0.00, 20.00, 20.00, null, 199.00, 269.00, 25.00, 14.95, 3, 5, 90),

    ('iphone-16', 'screen', 'range', 'premium_aftermarket', 145.00, 79.00, 0.00, 15.00, 25.00, null, 199.00, 249.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-16', 'battery', 'fixed', 'premium_aftermarket', 60.00, 69.00, 0.00, 10.00, 10.00, 149.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-16', 'charging', 'range', 'premium_aftermarket', 44.00, 89.00, 0.00, 15.00, 18.00, null, 139.00, 179.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-16', 'software', 'fixed', null, 0.00, 89.00, 0.00, 0.00, 0.00, 89.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('galaxy-s23', 'screen', 'range', 'premium_aftermarket', 95.00, 79.00, 0.00, 12.00, 18.00, null, 169.00, 199.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s23', 'battery', 'fixed', 'premium_aftermarket', 42.00, 69.00, 0.00, 8.00, 10.00, 119.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('galaxy-s23', 'charging', 'range', 'premium_aftermarket', 30.00, 79.00, 0.00, 10.00, 14.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s23', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 79.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('galaxy-s24-fe', 'screen', 'fixed', 'premium_aftermarket', 70.00, 79.00, 0.00, 10.00, 10.00, 129.00, null, null, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s24-fe', 'battery', 'fixed', 'premium_aftermarket', 44.00, 69.00, 0.00, 8.00, 8.00, 119.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('galaxy-s24-fe', 'charging', 'range', 'premium_aftermarket', 30.00, 79.00, 0.00, 10.00, 14.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),

    ('galaxy-s24-ultra', 'screen', 'range', 'premium_aftermarket', 150.00, 89.00, 0.00, 20.00, 20.00, null, 249.00, 289.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s24-ultra', 'battery', 'range', 'premium_aftermarket', 55.00, 69.00, 0.00, 10.00, 10.00, null, 129.00, 159.00, 25.00, 14.95, 2, 4, 90),
    ('galaxy-s24-ultra', 'camera', 'range', 'premium_aftermarket', 110.00, 89.00, 0.00, 15.00, 20.00, null, 189.00, 259.00, 25.00, 14.95, 3, 5, 90),

    ('galaxy-s25', 'screen', 'range', 'premium_aftermarket', 115.00, 79.00, 0.00, 15.00, 20.00, null, 189.00, 229.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s25', 'battery', 'fixed', 'premium_aftermarket', 49.00, 69.00, 0.00, 10.00, 10.00, 129.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('galaxy-s25', 'charging', 'range', 'premium_aftermarket', 32.00, 79.00, 0.00, 10.00, 14.00, null, 119.00, 159.00, 25.00, 14.95, 3, 5, 90),

    ('ipad-10th-gen', 'screen', 'range', 'premium_aftermarket', 90.00, 79.00, 0.00, 15.00, 15.00, null, 169.00, 229.00, 25.00, 14.95, 4, 6, 90),
    ('ipad-10th-gen', 'battery', 'range', 'premium_aftermarket', 55.00, 79.00, 0.00, 10.00, 10.00, null, 129.00, 159.00, 25.00, 14.95, 3, 5, 90),
    ('ipad-10th-gen', 'charging', 'range', 'premium_aftermarket', 34.00, 89.00, 0.00, 15.00, 10.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),
    ('ipad-10th-gen', 'software', 'fixed', null, 0.00, 79.00, 0.00, 0.00, 0.00, 79.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('ipad-air-m2', 'screen', 'range', 'premium_aftermarket', 160.00, 89.00, 0.00, 20.00, 20.00, null, 249.00, 329.00, 25.00, 14.95, 4, 6, 90),
    ('ipad-air-m2', 'battery', 'range', 'premium_aftermarket', 70.00, 89.00, 0.00, 10.00, 10.00, null, 149.00, 189.00, 25.00, 14.95, 3, 5, 90),
    ('ipad-air-m2', 'software', 'fixed', null, 0.00, 89.00, 0.00, 0.00, 0.00, 89.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('ipad-pro-11-m4', 'screen', 'range', 'premium_aftermarket', 250.00, 99.00, 0.00, 25.00, 25.00, null, 349.00, 499.00, 25.00, 14.95, 4, 6, 90),
    ('ipad-pro-11-m4', 'battery', 'range', 'premium_aftermarket', 90.00, 99.00, 0.00, 15.00, 10.00, null, 169.00, 219.00, 25.00, 14.95, 3, 5, 90),
    ('ipad-pro-11-m4', 'software', 'fixed', null, 0.00, 89.00, 0.00, 0.00, 0.00, 99.00, null, null, 25.00, 14.95, 1, 2, 30),

    ('macbook-air-m2-13', 'battery', 'range', 'premium_aftermarket', 110.00, 99.00, 0.00, 15.00, 15.00, null, 199.00, 249.00, 45.00, 24.95, 3, 5, 90),
    ('macbook-air-m2-13', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('macbook-air-m2-13', 'diagnostic', 'manual', null, 0.00, 99.00, 0.00, 0.00, 0.00, null, null, null, 45.00, 24.95, null, null, 0),

    ('macbook-pro-14-m3', 'battery', 'range', 'premium_aftermarket', 130.00, 109.00, 0.00, 20.00, 20.00, null, 229.00, 289.00, 45.00, 24.95, 3, 5, 90),
    ('macbook-pro-14-m3', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 109.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('macbook-pro-14-m3', 'keyboard', 'range', 'top_case', 180.00, 129.00, 0.00, 20.00, 25.00, null, 299.00, 399.00, 45.00, 24.95, 4, 7, 90),
    ('macbook-pro-14-m3', 'diagnostic', 'manual', null, 0.00, 109.00, 0.00, 0.00, 0.00, null, null, null, 45.00, 24.95, null, null, 0),

    ('dell-inspiron-15', 'battery', 'range', 'premium_aftermarket', 65.00, 99.00, 0.00, 10.00, 10.00, null, 139.00, 199.00, 45.00, 24.95, 3, 5, 90),
    ('dell-inspiron-15', 'ssd-upgrade', 'range', 'client_nvme', 60.00, 79.00, 0.00, 10.00, 10.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),
    ('dell-inspiron-15', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('dell-inspiron-15', 'keyboard', 'range', 'premium_aftermarket', 55.00, 99.00, 0.00, 15.00, 10.00, null, 149.00, 239.00, 45.00, 24.95, 3, 5, 90),

    ('hp-pavilion-15', 'battery', 'range', 'premium_aftermarket', 70.00, 99.00, 0.00, 10.00, 10.00, null, 149.00, 209.00, 45.00, 24.95, 3, 5, 90),
    ('hp-pavilion-15', 'ssd-upgrade', 'range', 'client_nvme', 60.00, 79.00, 0.00, 10.00, 10.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),
    ('hp-pavilion-15', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('hp-pavilion-15', 'keyboard', 'range', 'premium_aftermarket', 60.00, 99.00, 0.00, 15.00, 10.00, null, 159.00, 249.00, 45.00, 24.95, 3, 5, 90),

    ('thinkpad-t14', 'battery', 'range', 'premium_aftermarket', 75.00, 99.00, 0.00, 10.00, 10.00, null, 149.00, 209.00, 45.00, 24.95, 3, 5, 90),
    ('thinkpad-t14', 'keyboard', 'range', 'premium_aftermarket', 70.00, 99.00, 0.00, 15.00, 10.00, null, 159.00, 249.00, 45.00, 24.95, 3, 5, 90),
    ('thinkpad-t14', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('thinkpad-t14', 'diagnostic', 'manual', null, 0.00, 99.00, 0.00, 0.00, 0.00, null, null, null, 45.00, 24.95, null, null, 0)
  ) as t(model_key, repair_key, price_mode, part_grade, part_cost, labor_base, complexity_fee, risk_buffer, markup_amount, public_price_fixed, public_price_min, public_price_max, deposit_amount, return_shipping_fee, turnaround_min_business_days, turnaround_max_business_days, warranty_days)
)
insert into public.pricing_rules (
  model_id,
  repair_type_id,
  price_mode,
  part_grade,
  part_cost,
  labor_base,
  complexity_fee,
  risk_buffer,
  markup_amount,
  public_price_fixed,
  public_price_min,
  public_price_max,
  deposit_amount,
  return_shipping_fee,
  turnaround_min_business_days,
  turnaround_max_business_days,
  warranty_days,
  active
)
select
  m.id,
  rt.id,
  p.price_mode,
  p.part_grade,
  p.part_cost,
  p.labor_base,
  p.complexity_fee,
  p.risk_buffer,
  p.markup_amount,
  p.public_price_fixed,
  p.public_price_min,
  p.public_price_max,
  p.deposit_amount,
  p.return_shipping_fee,
  p.turnaround_min_business_days,
  p.turnaround_max_business_days,
  p.warranty_days,
  true
from pricing_seed p
join public.repair_catalog_models m on m.model_key = p.model_key
join public.repair_types rt on rt.repair_key = p.repair_key
on conflict (model_id, repair_type_id) do update
set
  price_mode = excluded.price_mode,
  part_grade = excluded.part_grade,
  part_cost = excluded.part_cost,
  labor_base = excluded.labor_base,
  complexity_fee = excluded.complexity_fee,
  risk_buffer = excluded.risk_buffer,
  markup_amount = excluded.markup_amount,
  public_price_fixed = excluded.public_price_fixed,
  public_price_min = excluded.public_price_min,
  public_price_max = excluded.public_price_max,
  deposit_amount = excluded.deposit_amount,
  return_shipping_fee = excluded.return_shipping_fee,
  turnaround_min_business_days = excluded.turnaround_min_business_days,
  turnaround_max_business_days = excluded.turnaround_max_business_days,
  warranty_days = excluded.warranty_days,
  active = excluded.active,
  updated_at = now();

with condition_seed as (
  select *
  from (values
    ('screen', 'liquid_damage', 'Yes', 'force_manual_review', 0.00, 'Screen quotes should go to manual review when liquid damage is reported.'),
    ('battery', 'liquid_damage', 'Yes', 'force_manual_review', 0.00, 'Battery jobs should go to manual review when liquid damage is reported.'),
    ('charging', 'liquid_damage', 'Yes', 'force_manual_review', 0.00, 'Charging issues combined with liquid exposure need manual review.'),
    ('diagnostic', 'powers_on', 'No', 'force_manual_review', 0.00, 'No-power diagnostics stay manual review by default.')
  ) as t(repair_key, condition_key, condition_value, price_adjustment_type, price_adjustment_amount, note)
)
insert into public.pricing_rule_conditions (
  pricing_rule_id,
  condition_key,
  condition_value,
  price_adjustment_type,
  price_adjustment_amount,
  note
)
select
  pr.id,
  c.condition_key,
  c.condition_value,
  c.price_adjustment_type,
  c.price_adjustment_amount,
  c.note
from condition_seed c
join public.repair_types rt on rt.repair_key = c.repair_key
join public.pricing_rules pr on pr.repair_type_id = rt.id
on conflict do nothing;

commit;
