begin;

-- Add new brands
insert into public.repair_catalog_brands (category, brand_name, slug, active)
values
  ('phone', 'Google', 'google-phone', true),
  ('phone', 'OnePlus', 'oneplus-phone', true),
  ('tablet', 'Samsung', 'samsung-tablet', true)
on conflict (slug) do update
set
  category = excluded.category,
  brand_name = excluded.brand_name,
  active = excluded.active,
  updated_at = now();

-- Add new models
with model_seed as (
  select *
  from (values
    -- Google Phones
    ('google-phone', 'phone', 'Pixel Series', 'Pixel 7', 'pixel-7', 2022, true, true, true, false, true, null::text),
    ('google-phone', 'phone', 'Pixel Series', 'Pixel 7 Pro', 'pixel-7-pro', 2022, true, true, true, false, true, null),
    ('google-phone', 'phone', 'Pixel Series', 'Pixel 8', 'pixel-8', 2023, true, true, true, false, true, null),
    ('google-phone', 'phone', 'Pixel 8 Pro Series', 'Pixel 8 Pro', 'pixel-8-pro', 2023, true, true, true, false, true, null),
    ('google-phone', 'phone', 'Pixel 9 Series', 'Pixel 9', 'pixel-9', 2024, true, true, true, false, true, null),
    ('google-phone', 'phone', 'Pixel 9 Pro Series', 'Pixel 9 Pro', 'pixel-9-pro', 2024, true, true, true, false, true, null),

    -- OnePlus Phones
    ('oneplus-phone', 'phone', 'OnePlus 11 Series', 'OnePlus 11', 'oneplus-11', 2023, true, true, true, false, true, null),
    ('oneplus-phone', 'phone', 'OnePlus 12 Series', 'OnePlus 12', 'oneplus-12', 2024, true, true, true, false, true, null),

    -- Samsung Phones (additional)
    ('samsung-phone', 'phone', 'Galaxy A Series', 'Galaxy A54', 'galaxy-a54', 2023, true, true, true, false, true, null),
    ('samsung-phone', 'phone', 'Galaxy A Series', 'Galaxy A55', 'galaxy-a55', 2024, true, true, true, false, true, null),
    ('samsung-phone', 'phone', 'Galaxy S25 Ultra Series', 'Galaxy S25 Ultra', 'galaxy-s25-ultra', 2025, true, true, true, false, true, 'frame-risk'),
    ('samsung-phone', 'phone', 'Galaxy Z Flip Series', 'Galaxy Z Flip 5', 'galaxy-z-flip-5', 2023, true, true, false, false, true, 'folding-display'),
    ('samsung-phone', 'phone', 'Galaxy Z Fold Series', 'Galaxy Z Fold 5', 'galaxy-z-fold-5', 2023, true, true, false, false, true, 'folding-display'),

    -- Apple Phones (additional)
    ('apple-phone', 'phone', 'iPhone 16 Pro Series', 'iPhone 16 Pro', 'iphone-16-pro', 2024, true, true, true, false, true, 'face-id-risk'),
    ('apple-phone', 'phone', 'iPhone 16 Pro Max Series', 'iPhone 16 Pro Max', 'iphone-16-pro-max', 2024, true, true, true, false, true, 'face-id-risk'),
    ('apple-phone', 'phone', 'iPhone SE Series', 'iPhone SE (3rd Gen)', 'iphone-se-3', 2022, true, true, true, false, true, null),

    -- Samsung Tablets
    ('samsung-tablet', 'tablet', 'Galaxy Tab S Series', 'Galaxy Tab S9', 'galaxy-tab-s9', 2023, true, true, true, false, true, null),
    ('samsung-tablet', 'tablet', 'Galaxy Tab A Series', 'Galaxy Tab A9', 'galaxy-tab-a9', 2023, true, true, true, false, true, null),

    -- Apple Tablets (additional)
    ('apple-tablet', 'tablet', 'iPad Mini', 'iPad Mini 6th Gen', 'ipad-mini-6', 2021, true, true, true, false, true, null),
    ('apple-tablet', 'tablet', 'iPad Pro', 'iPad Pro 12.9-inch M2', 'ipad-pro-12-m2', 2022, true, true, false, false, true, 'laminated-display'),

    -- Laptops (additional)
    ('apple-laptop', 'laptop', 'MacBook Air', 'MacBook Air 15-inch M3', 'macbook-air-m3-15', 2024, false, true, false, true, true, 'top-case-risk'),
    ('apple-laptop', 'laptop', 'MacBook Pro', 'MacBook Pro 16-inch M3 Pro', 'macbook-pro-16-m3-pro', 2023, false, true, false, true, true, 'top-case-risk'),
    ('dell-laptop', 'laptop', 'XPS', 'Dell XPS 13', 'dell-xps-13', 2024, false, true, false, true, true, null),
    ('dell-laptop', 'laptop', 'Latitude', 'Dell Latitude 14', 'dell-latitude-14', 2023, false, true, false, true, true, null),
    ('hp-laptop', 'laptop', 'EliteBook', 'HP EliteBook 840', 'hp-elitebook-840', 2023, false, true, false, true, true, null),
    ('hp-laptop', 'laptop', 'Spectre', 'HP Spectre x360', 'hp-spectre-x360', 2024, false, true, false, true, true, null),
    ('lenovo-laptop', 'laptop', 'ThinkPad', 'ThinkPad X1 Carbon', 'thinkpad-x1-carbon', 2023, false, true, false, true, true, null),
    ('lenovo-laptop', 'laptop', 'IdeaPad', 'Lenovo IdeaPad 5', 'lenovo-ideapad-5', 2023, false, true, false, true, true, null)
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

-- Add pricing rules for new models
with pricing_seed as (
  select *
  from (values
    -- Pixel 7: screen/battery/charging
    ('pixel-7', 'screen', 'range', 'premium_aftermarket', 75.00, 69.00, 0.00, 10.00, 15.00, null::numeric, 139.00, 169.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-7', 'battery', 'fixed', 'premium_aftermarket', 38.00, 69.00, 0.00, 5.00, 10.00, 99.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('pixel-7', 'charging', 'range', 'premium_aftermarket', 30.00, 79.00, 0.00, 10.00, 12.00, null, 109.00, 139.00, 25.00, 14.95, 3, 5, 90),

    -- Pixel 7 Pro: screen/battery/charging/camera
    ('pixel-7-pro', 'screen', 'range', 'premium_aftermarket', 95.00, 79.00, 0.00, 12.00, 18.00, null, 169.00, 209.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-7-pro', 'battery', 'fixed', 'premium_aftermarket', 42.00, 69.00, 0.00, 8.00, 10.00, 119.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('pixel-7-pro', 'charging', 'range', 'premium_aftermarket', 32.00, 79.00, 0.00, 10.00, 14.00, null, 119.00, 149.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-7-pro', 'camera', 'range', 'premium_aftermarket', 85.00, 79.00, 0.00, 12.00, 18.00, null, 149.00, 219.00, 25.00, 14.95, 3, 5, 90),

    -- Pixel 8: screen/battery/charging
    ('pixel-8', 'screen', 'range', 'premium_aftermarket', 85.00, 79.00, 0.00, 12.00, 18.00, null, 159.00, 199.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-8', 'battery', 'fixed', 'premium_aftermarket', 42.00, 69.00, 0.00, 8.00, 10.00, 109.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('pixel-8', 'charging', 'range', 'premium_aftermarket', 34.00, 79.00, 0.00, 10.00, 14.00, null, 119.00, 149.00, 25.00, 14.95, 3, 5, 90),

    -- Pixel 8 Pro: screen/battery/charging
    ('pixel-8-pro', 'screen', 'range', 'premium_aftermarket', 110.00, 79.00, 0.00, 15.00, 20.00, null, 189.00, 239.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-8-pro', 'battery', 'range', 'premium_aftermarket', 48.00, 69.00, 0.00, 10.00, 12.00, null, 119.00, 149.00, 25.00, 14.95, 2, 4, 90),
    ('pixel-8-pro', 'charging', 'range', 'premium_aftermarket', 36.00, 89.00, 0.00, 12.00, 16.00, null, 129.00, 159.00, 25.00, 14.95, 3, 5, 90),

    -- Pixel 9: screen/battery/charging
    ('pixel-9', 'screen', 'range', 'premium_aftermarket', 120.00, 79.00, 0.00, 15.00, 20.00, null, 199.00, 249.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-9', 'battery', 'fixed', 'premium_aftermarket', 55.00, 69.00, 0.00, 10.00, 10.00, 139.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('pixel-9', 'charging', 'range', 'premium_aftermarket', 38.00, 89.00, 0.00, 12.00, 18.00, null, 129.00, 169.00, 25.00, 14.95, 3, 5, 90),

    -- Pixel 9 Pro: screen/battery/charging
    ('pixel-9-pro', 'screen', 'range', 'premium_aftermarket', 150.00, 89.00, 0.00, 20.00, 25.00, null, 249.00, 309.00, 25.00, 14.95, 3, 5, 90),
    ('pixel-9-pro', 'battery', 'range', 'premium_aftermarket', 60.00, 69.00, 0.00, 10.00, 12.00, null, 129.00, 159.00, 25.00, 14.95, 2, 4, 90),
    ('pixel-9-pro', 'charging', 'range', 'premium_aftermarket', 42.00, 89.00, 0.00, 15.00, 18.00, null, 139.00, 169.00, 25.00, 14.95, 3, 5, 90),

    -- OnePlus 11: screen/battery/charging
    ('oneplus-11', 'screen', 'range', 'premium_aftermarket', 90.00, 79.00, 0.00, 12.00, 18.00, null, 169.00, 209.00, 25.00, 14.95, 3, 5, 90),
    ('oneplus-11', 'battery', 'fixed', 'premium_aftermarket', 42.00, 69.00, 0.00, 8.00, 10.00, 109.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('oneplus-11', 'charging', 'range', 'premium_aftermarket', 32.00, 79.00, 0.00, 10.00, 14.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),

    -- OnePlus 12: screen/battery/charging
    ('oneplus-12', 'screen', 'range', 'premium_aftermarket', 110.00, 79.00, 0.00, 15.00, 20.00, null, 189.00, 239.00, 25.00, 14.95, 3, 5, 90),
    ('oneplus-12', 'battery', 'range', 'premium_aftermarket', 50.00, 69.00, 0.00, 10.00, 12.00, null, 119.00, 149.00, 25.00, 14.95, 2, 4, 90),
    ('oneplus-12', 'charging', 'range', 'premium_aftermarket', 36.00, 89.00, 0.00, 12.00, 16.00, null, 119.00, 159.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy A54 (budget): screen/battery/charging
    ('galaxy-a54', 'screen', 'range', 'premium_aftermarket', 45.00, 69.00, 0.00, 8.00, 10.00, null, 89.00, 129.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-a54', 'battery', 'fixed', 'premium_aftermarket', 32.00, 59.00, 0.00, 5.00, 8.00, 89.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('galaxy-a54', 'charging', 'range', 'premium_aftermarket', 25.00, 69.00, 0.00, 8.00, 10.00, null, 99.00, 129.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy A55 (budget): screen/battery/charging
    ('galaxy-a55', 'screen', 'range', 'premium_aftermarket', 50.00, 69.00, 0.00, 10.00, 10.00, null, 99.00, 139.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-a55', 'battery', 'fixed', 'premium_aftermarket', 35.00, 59.00, 0.00, 5.00, 10.00, 99.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('galaxy-a55', 'charging', 'range', 'premium_aftermarket', 28.00, 69.00, 0.00, 8.00, 10.00, null, 99.00, 139.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy S25 Ultra: screen/battery/charging/camera
    ('galaxy-s25-ultra', 'screen', 'range', 'premium_aftermarket', 170.00, 89.00, 0.00, 20.00, 25.00, null, 269.00, 319.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s25-ultra', 'battery', 'range', 'premium_aftermarket', 60.00, 69.00, 0.00, 12.00, 12.00, null, 139.00, 159.00, 25.00, 14.95, 2, 4, 90),
    ('galaxy-s25-ultra', 'charging', 'range', 'premium_aftermarket', 45.00, 89.00, 0.00, 15.00, 18.00, null, 139.00, 169.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-s25-ultra', 'camera', 'range', 'premium_aftermarket', 125.00, 89.00, 0.00, 18.00, 22.00, null, 209.00, 269.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy Z Flip 5 (folding): screen/battery
    ('galaxy-z-flip-5', 'screen', 'range', 'premium_aftermarket', 220.00, 99.00, 0.00, 30.00, 30.00, null, 349.00, 449.00, 25.00, 14.95, 4, 7, 90),
    ('galaxy-z-flip-5', 'battery', 'range', 'premium_aftermarket', 70.00, 89.00, 0.00, 15.00, 15.00, null, 159.00, 199.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy Z Fold 5 (folding): screen/battery
    ('galaxy-z-fold-5', 'screen', 'range', 'premium_aftermarket', 280.00, 109.00, 0.00, 35.00, 35.00, null, 399.00, 499.00, 25.00, 14.95, 5, 8, 90),
    ('galaxy-z-fold-5', 'battery', 'range', 'premium_aftermarket', 75.00, 89.00, 0.00, 15.00, 15.00, null, 169.00, 199.00, 25.00, 14.95, 3, 5, 90),

    -- iPhone 16 Pro: screen/battery/charging/camera
    ('iphone-16-pro', 'screen', 'range', 'premium_aftermarket', 170.00, 89.00, 0.00, 20.00, 25.00, null, 259.00, 319.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-16-pro', 'battery', 'fixed', 'premium_aftermarket', 62.00, 69.00, 0.00, 10.00, 12.00, 149.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-16-pro', 'charging', 'range', 'premium_aftermarket', 46.00, 89.00, 0.00, 15.00, 20.00, null, 139.00, 179.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-16-pro', 'camera', 'range', 'premium_aftermarket', 130.00, 89.00, 0.00, 20.00, 22.00, null, 209.00, 269.00, 25.00, 14.95, 3, 5, 90),

    -- iPhone 16 Pro Max: screen/battery/charging/camera
    ('iphone-16-pro-max', 'screen', 'range', 'premium_aftermarket', 185.00, 89.00, 0.00, 22.00, 28.00, null, 279.00, 319.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-16-pro-max', 'battery', 'fixed', 'premium_aftermarket', 65.00, 69.00, 0.00, 12.00, 12.00, 159.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-16-pro-max', 'charging', 'range', 'premium_aftermarket', 48.00, 89.00, 0.00, 15.00, 20.00, null, 149.00, 179.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-16-pro-max', 'camera', 'range', 'premium_aftermarket', 140.00, 89.00, 0.00, 22.00, 25.00, null, 219.00, 269.00, 25.00, 14.95, 3, 5, 90),

    -- iPhone SE (3rd Gen): screen/battery/charging
    ('iphone-se-3', 'screen', 'range', 'premium_aftermarket', 50.00, 59.00, 0.00, 8.00, 12.00, null, 99.00, 139.00, 25.00, 14.95, 3, 5, 90),
    ('iphone-se-3', 'battery', 'fixed', 'premium_aftermarket', 30.00, 59.00, 0.00, 5.00, 8.00, 89.00, null, null, 25.00, 14.95, 2, 4, 90),
    ('iphone-se-3', 'charging', 'range', 'premium_aftermarket', 28.00, 69.00, 0.00, 8.00, 10.00, null, 99.00, 129.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy Tab S9: screen/battery/charging
    ('galaxy-tab-s9', 'screen', 'range', 'premium_aftermarket', 150.00, 89.00, 0.00, 18.00, 20.00, null, 249.00, 329.00, 25.00, 14.95, 4, 6, 90),
    ('galaxy-tab-s9', 'battery', 'range', 'premium_aftermarket', 65.00, 79.00, 0.00, 12.00, 12.00, null, 139.00, 179.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-tab-s9', 'charging', 'range', 'premium_aftermarket', 38.00, 89.00, 0.00, 12.00, 12.00, null, 119.00, 149.00, 25.00, 14.95, 3, 5, 90),

    -- Galaxy Tab A9: screen/battery/charging
    ('galaxy-tab-a9', 'screen', 'range', 'premium_aftermarket', 80.00, 79.00, 0.00, 12.00, 12.00, null, 149.00, 199.00, 25.00, 14.95, 4, 6, 90),
    ('galaxy-tab-a9', 'battery', 'range', 'premium_aftermarket', 50.00, 69.00, 0.00, 10.00, 10.00, null, 129.00, 149.00, 25.00, 14.95, 3, 5, 90),
    ('galaxy-tab-a9', 'charging', 'range', 'premium_aftermarket', 32.00, 79.00, 0.00, 10.00, 10.00, null, 109.00, 139.00, 25.00, 14.95, 3, 5, 90),

    -- iPad Mini 6th Gen: screen/battery/charging
    ('ipad-mini-6', 'screen', 'range', 'premium_aftermarket', 100.00, 79.00, 0.00, 15.00, 15.00, null, 179.00, 239.00, 25.00, 14.95, 4, 6, 90),
    ('ipad-mini-6', 'battery', 'range', 'premium_aftermarket', 55.00, 79.00, 0.00, 10.00, 10.00, null, 129.00, 169.00, 25.00, 14.95, 3, 5, 90),
    ('ipad-mini-6', 'charging', 'range', 'premium_aftermarket', 34.00, 89.00, 0.00, 12.00, 10.00, null, 109.00, 149.00, 25.00, 14.95, 3, 5, 90),

    -- iPad Pro 12.9-inch M2: screen/battery
    ('ipad-pro-12-m2', 'screen', 'range', 'premium_aftermarket', 280.00, 99.00, 0.00, 25.00, 30.00, null, 379.00, 499.00, 25.00, 14.95, 4, 6, 90),
    ('ipad-pro-12-m2', 'battery', 'range', 'premium_aftermarket', 95.00, 99.00, 0.00, 15.00, 10.00, null, 179.00, 219.00, 25.00, 14.95, 3, 5, 90),

    -- MacBook Air 15-inch M3: battery/keyboard/software
    ('macbook-air-m3-15', 'battery', 'range', 'premium_aftermarket', 120.00, 99.00, 0.00, 15.00, 18.00, null, 209.00, 269.00, 45.00, 24.95, 3, 5, 90),
    ('macbook-air-m3-15', 'keyboard', 'range', 'top_case', 160.00, 119.00, 0.00, 18.00, 22.00, null, 269.00, 359.00, 45.00, 24.95, 4, 7, 90),
    ('macbook-air-m3-15', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),

    -- MacBook Pro 16-inch M3 Pro: battery/keyboard/software
    ('macbook-pro-16-m3-pro', 'battery', 'range', 'premium_aftermarket', 145.00, 109.00, 0.00, 22.00, 22.00, null, 249.00, 299.00, 45.00, 24.95, 3, 5, 90),
    ('macbook-pro-16-m3-pro', 'keyboard', 'range', 'top_case', 195.00, 139.00, 0.00, 22.00, 28.00, null, 329.00, 399.00, 45.00, 24.95, 4, 7, 90),
    ('macbook-pro-16-m3-pro', 'software', 'fixed', null, 0.00, 109.00, 0.00, 0.00, 0.00, 109.00, null, null, 45.00, 24.95, 1, 2, 30),

    -- Dell XPS 13: battery/keyboard/software/ssd-upgrade
    ('dell-xps-13', 'battery', 'range', 'premium_aftermarket', 80.00, 99.00, 0.00, 12.00, 12.00, null, 159.00, 219.00, 45.00, 24.95, 3, 5, 90),
    ('dell-xps-13', 'keyboard', 'range', 'premium_aftermarket', 70.00, 109.00, 0.00, 15.00, 15.00, null, 179.00, 269.00, 45.00, 24.95, 3, 5, 90),
    ('dell-xps-13', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('dell-xps-13', 'ssd-upgrade', 'range', 'client_nvme', 65.00, 79.00, 0.00, 10.00, 12.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),

    -- Dell Latitude 14: battery/keyboard/software/ssd-upgrade
    ('dell-latitude-14', 'battery', 'range', 'premium_aftermarket', 70.00, 99.00, 0.00, 10.00, 10.00, null, 149.00, 209.00, 45.00, 24.95, 3, 5, 90),
    ('dell-latitude-14', 'keyboard', 'range', 'premium_aftermarket', 60.00, 99.00, 0.00, 12.00, 12.00, null, 149.00, 249.00, 45.00, 24.95, 3, 5, 90),
    ('dell-latitude-14', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('dell-latitude-14', 'ssd-upgrade', 'range', 'client_nvme', 60.00, 79.00, 0.00, 10.00, 10.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),

    -- HP EliteBook 840: battery/keyboard/software/ssd-upgrade
    ('hp-elitebook-840', 'battery', 'range', 'premium_aftermarket', 75.00, 99.00, 0.00, 12.00, 12.00, null, 159.00, 219.00, 45.00, 24.95, 3, 5, 90),
    ('hp-elitebook-840', 'keyboard', 'range', 'premium_aftermarket', 65.00, 109.00, 0.00, 15.00, 12.00, null, 169.00, 259.00, 45.00, 24.95, 3, 5, 90),
    ('hp-elitebook-840', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('hp-elitebook-840', 'ssd-upgrade', 'range', 'client_nvme', 60.00, 79.00, 0.00, 10.00, 10.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),

    -- HP Spectre x360: battery/keyboard/software/ssd-upgrade
    ('hp-spectre-x360', 'battery', 'range', 'premium_aftermarket', 85.00, 99.00, 0.00, 12.00, 15.00, null, 169.00, 229.00, 45.00, 24.95, 3, 5, 90),
    ('hp-spectre-x360', 'keyboard', 'range', 'premium_aftermarket', 75.00, 119.00, 0.00, 18.00, 15.00, null, 189.00, 279.00, 45.00, 24.95, 3, 5, 90),
    ('hp-spectre-x360', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('hp-spectre-x360', 'ssd-upgrade', 'range', 'client_nvme', 65.00, 79.00, 0.00, 10.00, 12.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),

    -- ThinkPad X1 Carbon: battery/keyboard/software/ssd-upgrade
    ('thinkpad-x1-carbon', 'battery', 'range', 'premium_aftermarket', 85.00, 99.00, 0.00, 12.00, 12.00, null, 169.00, 229.00, 45.00, 24.95, 3, 5, 90),
    ('thinkpad-x1-carbon', 'keyboard', 'range', 'premium_aftermarket', 75.00, 109.00, 0.00, 15.00, 15.00, null, 179.00, 269.00, 45.00, 24.95, 3, 5, 90),
    ('thinkpad-x1-carbon', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('thinkpad-x1-carbon', 'ssd-upgrade', 'range', 'client_nvme', 65.00, 79.00, 0.00, 10.00, 12.00, null, 149.00, 229.00, 45.00, 24.95, 2, 4, 90),

    -- Lenovo IdeaPad 5: battery/keyboard/software/ssd-upgrade
    ('lenovo-ideapad-5', 'battery', 'range', 'premium_aftermarket', 60.00, 89.00, 0.00, 10.00, 10.00, null, 139.00, 189.00, 45.00, 24.95, 3, 5, 90),
    ('lenovo-ideapad-5', 'keyboard', 'range', 'premium_aftermarket', 55.00, 99.00, 0.00, 12.00, 10.00, null, 149.00, 239.00, 45.00, 24.95, 3, 5, 90),
    ('lenovo-ideapad-5', 'software', 'fixed', null, 0.00, 99.00, 0.00, 0.00, 0.00, 99.00, null, null, 45.00, 24.95, 1, 2, 30),
    ('lenovo-ideapad-5', 'ssd-upgrade', 'range', 'client_nvme', 55.00, 79.00, 0.00, 10.00, 10.00, null, 149.00, 219.00, 45.00, 24.95, 2, 4, 90)
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

commit;
