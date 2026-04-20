-- users に姓名カラムを追加
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_name TEXT;
