-- テストデータ投入（初回起動時のみ挿入、重複は無視）

-- カラム
INSERT INTO columns (title, position, created_at, updated_at)
VALUES
  ('TODO',       1, NOW(), NOW()),
  ('進行中',     2, NOW(), NOW()),
  ('完了',       3, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ラベル（プリセット）
INSERT INTO labels (name, color, is_preset, created_at, updated_at)
VALUES
  ('バグ',     '#e74c3c', true, NOW(), NOW()),
  ('機能追加', '#2ecc71', true, NOW(), NOW()),
  ('調査',     '#3498db', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- カード（column_id は上記 INSERT の順番依存のため subquery で取得）
INSERT INTO cards (column_id, title, description, due_date, color, position, created_at, updated_at)
VALUES
  (
    (SELECT id FROM columns WHERE title = 'TODO' LIMIT 1),
    'ログイン機能を実装する',
    'JWTを使ったログイン・ログアウト機能を実装する',
    '2026-07-01',
    '#f1c40f',
    1,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM columns WHERE title = 'TODO' LIMIT 1),
    'データベース設計を見直す',
    'Cardテーブルのインデックス設計を最適化する',
    NULL,
    NULL,
    2,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM columns WHERE title = '進行中' LIMIT 1),
    'カード一覧取得APIを実装する',
    'GET /api/columns でカラムとカードの一覧を返すエンドポイントを実装中',
    '2026-06-25',
    '#3498db',
    1,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM columns WHERE title = '完了' LIMIT 1),
    'Docker環境を構築する',
    'PostgreSQL + Spring Boot の Docker Compose 環境を整備した',
    NULL,
    '#2ecc71',
    1,
    NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

-- チェックリスト項目
INSERT INTO checklist_items (card_id, text, completed, position, created_at, updated_at)
VALUES
  (
    (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
    'Spring Security の依存関係を追加',
    false,
    1,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
    'JWT ライブラリを選定する',
    false,
    2,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
    'ログインエンドポイントを実装',
    false,
    3,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM cards WHERE title = 'Docker環境を構築する' LIMIT 1),
    'docker-compose.yml を作成',
    true,
    1,
    NOW(), NOW()
  ),
  (
    (SELECT id FROM cards WHERE title = 'Docker環境を構築する' LIMIT 1),
    'ヘルスチェックを設定',
    true,
    2,
    NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

-- カードとラベルの紐付け
INSERT INTO card_labels (card_id, label_id)
VALUES
  (
    (SELECT id FROM cards WHERE title = 'ログイン機能を実装する' LIMIT 1),
    (SELECT id FROM labels WHERE name = '機能追加' LIMIT 1)
  ),
  (
    (SELECT id FROM cards WHERE title = 'データベース設計を見直す' LIMIT 1),
    (SELECT id FROM labels WHERE name = '調査' LIMIT 1)
  ),
  (
    (SELECT id FROM cards WHERE title = 'カード一覧取得APIを実装する' LIMIT 1),
    (SELECT id FROM labels WHERE name = '機能追加' LIMIT 1)
  )
ON CONFLICT DO NOTHING;
