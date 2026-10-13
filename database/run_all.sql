-- Run from this folder:  mysql -u root -p   then   SOURCE run_all.sql;
-- Tanvi first (creates the DB + base tables), then Maansi. Never run maansi/00_stub_for_testing_only.sql
SOURCE tanvi/01_schema.sql;
SOURCE tanvi/02_sample_data.sql;
SOURCE tanvi/03_triggers.sql;
SOURCE tanvi/04_functions.sql;
SOURCE tanvi/05_procedures.sql;
SOURCE tanvi/06_sample_transactions.sql;
SOURCE tanvi/07_views_queries.sql;
SOURCE maansi/01_schema.sql;
SOURCE maansi/02_functions.sql;
SOURCE maansi/03_views.sql;
SOURCE maansi/04_triggers.sql;
SOURCE maansi/05_procedures.sql;
SOURCE maansi/06_sample_data.sql;
