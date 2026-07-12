-- テストデータ投入（初回起動時のみ挿入。既にデータが存在する場合は何もしない）

-- カラム
INSERT INTO columns (title, position, created_at, updated_at)
SELECT '未着手', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM columns WHERE title = '未着手');

INSERT INTO columns (title, position, created_at, updated_at)
SELECT '作業中', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM columns WHERE title = '作業中');

INSERT INTO columns (title, position, created_at, updated_at)
SELECT '完了', 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM columns WHERE title = '完了');

-- ラベル（プリセット）
INSERT INTO labels (name, color, is_preset, created_at, updated_at)
SELECT 'バグ', '#e74c3c', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM labels WHERE name = 'バグ');

INSERT INTO labels (name, color, is_preset, created_at, updated_at)
SELECT '機能追加', '#2ecc71', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM labels WHERE name = '機能追加');

INSERT INTO labels (name, color, is_preset, created_at, updated_at)
SELECT '調査', '#3498db', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM labels WHERE name = '調査');

-- カード（column_id は上記 INSERT の順番依存のため subquery で取得。title で重複投入を防止）
INSERT INTO cards (column_id, title, description, due_date, priority, color, position, created_at, updated_at)
SELECT
  (SELECT id FROM columns WHERE title = '未着手' LIMIT 1),
  'ログイン機能を実装する',
  'JWTを使ったログイン・ログアウト機能を実装する',
  '2026-07-01',
  'HIGH',
  NULL,
  1,
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM cards WHERE title = 'ログイン機能を実装する');

INSERT INTO cards (column_id, title, description, due_date, priority, color, position, created_at, updated_at)
SELECT
  (SELECT id FROM columns WHERE title = '未着手' LIMIT 1),
  'データベース設計を見直す',
  'Cardテーブルのインデックス設計を最適化する',
  NULL,
  'MEDIUM',
  NULL,
  2,
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM cards WHERE title = 'データベース設計を見直す');

INSERT INTO cards (column_id, title, description, due_date, priority, color, position, created_at, updated_at)
SELECT
  (SELECT id FROM columns WHERE title = '作業中' LIMIT 1),
  'カード一覧取得APIを実装する',
  'GET /api/columns でカラムとカードの一覧を返すエンドポイントを実装中',
  '2026-06-25',
  'HIGH',
  NULL,
  1,
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM cards WHERE title = 'カード一覧取得APIを実装する');

INSERT INTO cards (column_id, title, description, due_date, priority, color, position, created_at, updated_at)
SELECT
  (SELECT id FROM columns WHERE title = '完了' LIMIT 1),
  'Docker環境を構築する',
  'PostgreSQL + Spring Boot の Docker Compose 環境を整備した',
  NULL,
  'LOW',
  NULL,
  1,
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM cards WHERE title = 'Docker環境を構築する');

-- チェックリスト項目（card_id + text の組み合わせで重複投入を防止）
INSERT INTO checklist_items (card_id, text, completed, position, created_at, updated_at)
SELECT
  (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
  'Spring Security の依存関係を追加',
  false,
  1,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items
  WHERE text = 'Spring Security の依存関係を追加'
    AND card_id = (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1)
);

INSERT INTO checklist_items (card_id, text, completed, position, created_at, updated_at)
SELECT
  (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
  'JWT ライブラリを選定する',
  false,
  2,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items
  WHERE text = 'JWT ライブラリを選定する'
    AND card_id = (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1)
);

INSERT INTO checklist_items (card_id, text, completed, position, created_at, updated_at)
SELECT
  (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
  'ログインエンドポイントを実装',
  false,
  3,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items
  WHERE text = 'ログインエンドポイントを実装'
    AND card_id = (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1)
);

INSERT INTO checklist_items (card_id, text, completed, position, created_at, updated_at)
SELECT
  (SELECT id FROM cards WHERE title = 'Docker環境を構築する' LIMIT 1),
  'docker-compose.yml を作成',
  true,
  1,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items
  WHERE text = 'docker-compose.yml を作成'
    AND card_id = (SELECT id FROM cards WHERE title = 'Docker環境を構築する' LIMIT 1)
);

INSERT INTO checklist_items (card_id, text, completed, position, created_at, updated_at)
SELECT
  (SELECT id FROM cards WHERE title = 'Docker環境を構築する' LIMIT 1),
  'ヘルスチェックを設定',
  true,
  2,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items
  WHERE text = 'ヘルスチェックを設定'
    AND card_id = (SELECT id FROM cards WHERE title = 'Docker環境を構築する' LIMIT 1)
);

-- カードとラベルの紐付け（card_id + label_id の組み合わせで重複投入を防止）
INSERT INTO card_labels (card_id, label_id)
SELECT
  (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
  (SELECT id FROM labels WHERE name = '機能追加' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM card_labels
  WHERE card_id = (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1)
    AND label_id = (SELECT id FROM labels WHERE name = '機能追加' LIMIT 1)
);

INSERT INTO card_labels (card_id, label_id)
SELECT
  (SELECT id FROM cards WHERE title = 'データベース設計を見直す' LIMIT 1),
  (SELECT id FROM labels WHERE name = '調査' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM card_labels
  WHERE card_id = (SELECT id FROM cards WHERE title = 'データベース設計を見直す' LIMIT 1)
    AND label_id = (SELECT id FROM labels WHERE name = '調査' LIMIT 1)
);

INSERT INTO card_labels (card_id, label_id)
SELECT
  (SELECT id FROM cards WHERE title = 'カード一覧取得APIを実装する' LIMIT 1),
  (SELECT id FROM labels WHERE name = '機能追加' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM card_labels
  WHERE card_id = (SELECT id FROM cards WHERE title = 'カード一覧取得APIを実装する' LIMIT 1)
    AND label_id = (SELECT id FROM labels WHERE name = '機能追加' LIMIT 1)
);
