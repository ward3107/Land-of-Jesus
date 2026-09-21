-- Land of Jesus - Demo Seed Data
-- Migration 003: Safe demo data for development/testing
-- IMPORTANT: All data is clearly marked as DEMO/EXAMPLE

-- ==================================================
-- DEMO ORGANIZATIONS
-- ==================================================

INSERT INTO organizations (id, name, legal_name, country) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Parish Association', 'Demo Parish Association Ltd.', 'Israel'),
  ('00000000-0000-0000-0000-000000000002', 'Example Heritage Foundation', 'Example Heritage Foundation', 'Israel');

-- ==================================================
-- DEMO CHURCHES (using slugs for public URLs)
-- ==================================================

INSERT INTO churches (id, slug, name, name_ar, name_he, organization_id, denomination_id, ecclesiastical_authority_id, status, is_published) VALUES
  -- Basilica of the Annunciation, Nazareth (demo data)
  ('10000000-0000-0000-0000-000000000001', 'basilica-annunciation-nazareth', 
   'Basilica of the Annunciation', 
   'كنيسة البشارة', 
   'בזיליקת הבשורה',
   '00000000-0000-0000-0000-000000000001',
   (SELECT id FROM denominations WHERE name = 'Roman Catholic' LIMIT 1),
   (SELECT id FROM ecclesiastical_authorities WHERE name LIKE '%Latin%' LIMIT 1),
   'LOJ_VERIFIED', true),
  
  -- Church of the Nativity, Bethlehem (demo data)
  ('10000000-0000-0000-0000-000000000002', 'church-nativity-bethlehem',
   'Church of the Nativity',
   'كنيسة المهد',
   'כנסיית המולד',
   NULL,
   (SELECT id FROM denominations WHERE name = 'Greek Orthodox' LIMIT 1),
   (SELECT id FROM ecclesiastical_authorities WHERE name LIKE '%Greek Orthodox%' LIMIT 1),
   'LISTED', true),
  
  -- Church of the Holy Sepulchre, Jerusalem (demo data)
  ('10000000-0000-0000-0000-000000000003', 'holy-sepulchre-jerusalem',
   'Church of the Holy Sepulchre',
   'كنيسة القيامة',
   'כנסיית הקבר',
   NULL,
   NULL, -- Multiple denominations
   NULL,
   'DISCOVERED', true);

-- ==================================================
-- DEMO CHURCH LOCATIONS
-- ==================================================

INSERT INTO church_locations (church_id, address_line1, city, region, country, latitude, longitude) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Paulus VI Street', 'Nazareth', 'Northern District', 'Israel', 32.7003, 35.3030),
  ('10000000-0000-0000-0000-000000000002', 'Manger Square', 'Bethlehem', 'West Bank', 'Palestine', 31.7044, 35.2078),
  ('10000000-0000-0000-0000-000000000003', 'Christian Quarter Road', 'Jerusalem', 'Jerusalem District', 'Israel', 31.7784, 35.2294);

-- ==================================================
-- DEMO CHURCH CONTACTS
-- ==================================================

INSERT INTO church_contacts (church_id, email, phone, website) VALUES
  ('10000000-0000-0000-0000-000000000001', 'info@annunciation-nazareth.demo', '+972-4-6000000', 'https://example.com/annunciation'),
  ('10000000-0000-0000-0000-000000000002', NULL, NULL, NULL),
  ('10000000-0000-0000-0000-000000000003', NULL, NULL, NULL);

-- ==================================================
-- DEMO CHURCH VISITING INFO
-- ==================================================

INSERT INTO church_visiting_info (church_id, is_open_to_visitors, opening_hours, admission_info, accessibility_info) VALUES
  ('10000000-0000-0000-0000-000000000001', true, 
   '{"monday": "08:00-12:00,14:00-18:00", "tuesday": "08:00-12:00,14:00-18:00", "wednesday": "08:00-12:00,14:00-18:00", "thursday": "08:00-12:00,14:00-18:00", "friday": "08:00-12:00,14:00-18:00", "saturday": "08:00-12:00,14:00-18:00", "sunday": "08:00-12:00,14:00-18:00"}',
   'Free admission. Guided tours available.',
   'Wheelchair accessible entrance available.'),
  ('10000000-0000-0000-0000-000000000002', true,
   '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-17:00", "sunday": "09:00-17:00"}',
   'Free admission. Dress code enforced.',
   NULL),
  ('10000000-0000-0000-0000-000000000003', true,
   '{"monday": "04:00-19:00", "tuesday": "04:00-19:00", "wednesday": "04:00-19:00", "thursday": "04:00-19:00", "friday": "04:00-19:00", "saturday": "04:00-19:00", "sunday": "04:00-19:00"}',
   'Free admission. Security check required.',
   'Limited accessibility due to historic structure.');

-- ==================================================
-- DEMO CHURCH DESCRIPTIONS
-- ==================================================

INSERT INTO church_descriptions (church_id, locale, overview, story, heritage, community) VALUES
  ('10000000-0000-0000-0000-000000000001', 'en',
   'The Basilica of the Annunciation is a Catholic church in Nazareth, Israel. It is one of the largest churches in the Middle East and marks the traditional site where the Archangel Gabriel announced to Mary that she would bear Jesus.',
   'The current basilica was built in 1969, designed by Italian architect Giovanni Muzio. It stands over the ruins of earlier Byzantine and Crusader churches. The site has been a place of Christian pilgrimage since ancient times.',
   'The basilica features stunning modern architecture with beautiful stained glass windows depicting various theological themes. The grotto below contains the traditional site of the Annunciation.',
   'The church serves the local Catholic community in Nazareth and welcomes pilgrims from around the world. Regular masses are held in multiple languages.'),
  
  ('10000000-0000-0000-0000-000000000001', 'ar',
   'كنيسة البشارة هي كنيسة كاثوليكية تقع في الناصرة، إسرائيل. وهي واحدة من أكبر الكنائس في الشرق الأوسط وتحتفل بالموقع التقليدي حيث بشّر الملاك جبرائيل مريم بأنها ستلد يسوع.',
   'تم بناء البازيليكا الحالية عام 1969، صممها المهندس المعماري الإيطالي جيوفاني موتسيو. تقف على أنقاض كنائس بيزنطية وصليبية سابقة. كان الموقع مكانًا للحج المسيحي منذ العصور القديمة.',
   'تتميز البازيليكا بهندسة معمارية حديثة مذهلة مع نوافذ زجاجية ملونة جميلة تصور موضوعات لاهوتية مختلفة. يحتوي المغارة أدناه على الموقع التقليدي للبشارة.',
   'تخدم الكنيسة المجتمع الكاثوليكي المحلي في الناصرة وترحب بالحجاج من جميع أنحاء العالم. تقام القداس بانتظام بلغات متعددة.'),
  
  ('10000000-0000-0000-0000-000000000001', 'he',
   'בזיליקת הבשורה היא כנסייה קתולית בנצרת, ישראל. זוהי אחת הכנסיות הגדולות במזרח התיכון ומציינת את המקום המסורתי שבו הבשר המלאך גבריאל למרים שהיא תלד את ישו.',
   'הבזיליקה הנוכחית נבנתה ב-1969, בתכנון האדריכל האיטלקי ג''ובאני מוציו. היא ניצבת על חורבות כנסיות ביזנטיות וצלבניות קודמות. האתר היה מקום עלייה לרגל נוצרי מאז ימי קדם.',
   'הבזיליקה מציגה ארכיטקטורה מודרנית מדהימה עם חלונות ויטראז'' יפים המתארים נושאים תיאולוגיים שונים. המערה שמתחת מכילה את האתר המסורתי של הבשורה.',
   'הכנסייה משרתת את הקהילה הקתולית המקומית בנצרת ומקבלת בברכה עולי רגל מכל רחבי העולם. מיסות מתקיימות באופן קבוע בשפות מרובות.');

-- ==================================================
-- DEMO PROJECTS
-- ==================================================

INSERT INTO projects (id, slug, church_id, title, title_ar, title_he, short_description, full_description, category, status, is_published) VALUES
  ('20000000-0000-0000-0000-000000000001', 'basilica-restoration-phase1', 
   '10000000-0000-0000-0000-000000000001',
   'Basilica Restoration - Phase 1',
   'ترميم البازيليكا - المرحلة الأولى',
   'שיקום הבזיליקה - שלב 1',
   'Restoration of the main nave and facade of the Basilica of the Annunciation.',
   'This project focuses on the critical restoration needs of the basilica, including structural repairs, cleaning of the facade, and preservation of original architectural elements. The work will ensure the building remains safe and accessible for future generations.',
   'Restoration',
   'APPROVED',
   true),
  
  ('20000000-0000-0000-0000-000000000002', 'heritage-documentation-project',
   NULL,
   'Holy Land Heritage Documentation',
   'توثيق تراث الأرض المقدسة',
   'תיעוד מורשת ארץ הקודש',
   'Digital documentation of Christian heritage sites across the Holy Land.',
   'A comprehensive initiative to photograph, scan, and document Christian heritage sites, artifacts, and manuscripts throughout Israel and surrounding regions. This digital archive will preserve invaluable historical records for researchers and future generations.',
   'Documentation',
   'IMPLEMENTATION',
   true);

-- ==================================================
-- DEMO PROJECT BUDGETS
-- ==================================================

INSERT INTO project_budgets (project_id, total_amount, currency, raised_amount, budget_items) VALUES
  ('20000000-0000-0000-0000-000000000001', 250000.00, 'USD', 45000.00, 
   '[{"item": "Structural assessment", "amount": 25000}, {"item": "Facade cleaning", "amount": 80000}, {"item": "Stone repair", "amount": 100000}, {"item": "Roof waterproofing", "amount": 45000}]'),
  
  ('20000000-0000-0000-0000-000000000002', 150000.00, 'USD', 78000.00,
   '[{"item": "Photography equipment", "amount": 30000}, {"item": "3D scanning", "amount": 50000}, {"item": "Archive platform", "amount": 40000}, {"item": "Personnel", "amount": 30000}]');

-- ==================================================
-- DEMO PROJECT TIMELINES
-- ==================================================

INSERT INTO project_timelines (project_id, phase, start_date, end_date, is_completed) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Assessment', '2025-01-01', '2025-03-31', true),
  ('20000000-0000-0000-0000-000000000001', 'Facade Work', '2025-04-01', '2025-08-31', false),
  ('20000000-0000-0000-0000-000000000001', 'Interior Restoration', '2025-09-01', '2025-12-31', false),
  
  ('20000000-0000-0000-0000-000000000002', 'Planning', '2024-06-01', '2024-09-30', true),
  ('20000000-0000-0000-0000-000000000002', 'Field Documentation', '2024-10-01', '2025-06-30', false),
  ('20000000-0000-0000-0000-000000000002', 'Platform Development', '2025-03-01', '2025-09-30', false);

-- ==================================================
-- DEMO HERITAGE ITEMS
-- ==================================================

INSERT INTO heritage_items (church_id, title, title_ar, title_he, description, item_type, date_period, is_published) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Annunciation Grotto', 'مغارة البشارة', 'מערת הבשורה', 
   'The natural cave venerated as the place where the Annunciation occurred.', 'Archaeological Site', '1st century (traditional)', true),
  ('10000000-0000-0000-0000-000000000001', 'Bronze Statue of Gabriel', 'تمثال برونزي لجبرائيل', 'פסל ברונזה של גבריאל',
   'Modern bronze sculpture depicting the Archangel Gabriel at the entrance.', 'Artwork', '20th century', true);

-- ==================================================
-- DEMO CHURCH UPDATES
-- ==================================================

INSERT INTO church_updates (church_id, title, title_ar, title_he, content, published_at, is_published) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Christmas Celebrations 2025', 'احتفالات عيد الميلاد 2025', 'חגיגות חג המולד 2025',
   'Join us for special Christmas masses and celebrations. Schedule available on our website.', NOW() - INTERVAL '5 days', true),
  ('10000000-0000-0000-0000-000000000001', 'Restoration Project Update', 'تحديث مشروع الترميم', 'עדכון פרויקט השיקום',
   'Phase 1 of our restoration project has begun. Thank you for your support.', NOW() - INTERVAL '15 days', true);

-- ==================================================
-- DEMO PROJECT UPDATES
-- ==================================================

INSERT INTO project_updates (project_id, title, content, update_type, published_at, is_published) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Assessment Complete', 
   'The structural assessment phase has been completed successfully. Engineers have identified key areas requiring attention.',
   'milestone', NOW() - INTERVAL '10 days', true),
  ('20000000-0000-0000-0000-000000000002', 'First 50 Sites Documented',
   'We have successfully documented our first 50 heritage sites with high-resolution photography and 3D scans.',
   'progress', NOW() - INTERVAL '3 days', true);

-- ==================================================
-- NOTE: User profiles, followers, and other user-specific data
-- should be created through the application, not seeded here.
-- This ensures proper auth integration.
