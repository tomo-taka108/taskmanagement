'use strict';

// ===== グローバルステート =====
const state = {
  columns: [
    { id: 'col-1', name: '未着手', order: 0 },
    { id: 'col-2', name: '作業中', order: 1 },
    { id: 'col-3', name: '完了', order: 2 },
  ],
  cards: [
    {
      id: 'card-1', columnId: 'col-1', order: 0,
      title: 'ログイン画面のUIデザイン',
      description: 'Figmaのデザインに合わせてログイン画面を実装する。レスポンシブ対応も必要。',
      dueDate: '2026-06-10',
      labels: ['label-1', 'label-3'],
      checklist: [
        { id: 'chk-1-1', text: 'Figmaデザイン確認', done: true },
        { id: 'chk-1-2', text: 'HTML/CSS実装', done: true },
        { id: 'chk-1-3', text: 'レスポンシブ対応', done: false },
      ]
    },
    {
      id: 'card-2', columnId: 'col-1', order: 1,
      title: 'APIエンドポイント設計',
      description: 'カラム・カード・ラベルのCRUD API設計を行う。',
      dueDate: '2026-06-20',
      labels: ['label-2'],
      checklist: []
    },
    {
      id: 'card-3', columnId: 'col-2', order: 0,
      title: 'カンバンボード基本実装',
      description: 'Reactでカンバンボードの基本レイアウトを実装中。',
      dueDate: '2026-06-18',
      labels: ['label-2', 'label-4'],
      checklist: [
        { id: 'chk-3-1', text: 'カラム表示', done: true },
        { id: 'chk-3-2', text: 'カード表示', done: true },
        { id: 'chk-3-3', text: 'カード追加', done: false },
        { id: 'chk-3-4', text: 'カード削除', done: false },
      ]
    },
    {
      id: 'card-4', columnId: 'col-2', order: 1,
      title: 'データベーススキーマ作成',
      description: 'MySQLのテーブル定義・マイグレーションスクリプトを作成する。',
      dueDate: '2026-06-14',
      labels: ['label-5'],
      checklist: [
        { id: 'chk-4-1', text: 'ERD作成', done: true },
        { id: 'chk-4-2', text: 'DDL作成', done: false },
      ]
    },
    {
      id: 'card-5', columnId: 'col-3', order: 0,
      title: '開発環境構築',
      description: 'Vite + React + Spring Boot の環境セットアップ完了。',
      dueDate: '2026-06-05',
      labels: ['label-3'],
      checklist: [
        { id: 'chk-5-1', text: 'Vite環境', done: true },
        { id: 'chk-5-2', text: 'Spring Boot環境', done: true },
        { id: 'chk-5-3', text: 'MySQL接続確認', done: true },
      ]
    },
    {
      id: 'card-6', columnId: 'col-3', order: 1,
      title: '要件定義書作成',
      description: '機能要件・非機能要件・画面設計・DB設計・API設計書を作成した。',
      dueDate: '2026-06-13',
      labels: ['label-3'],
      checklist: []
    },
  ],
  labels: [
    { id: 'label-1', name: 'Bug',     color: '#e74c3c' },
    { id: 'label-2', name: 'Feature', color: '#27ae60' },
    { id: 'label-3', name: 'Docs',    color: '#2980b9' },
    { id: 'label-4', name: 'Review',  color: '#f39c12' },
    { id: 'label-5', name: 'Urgent',  color: '#8e44ad' },
  ],
  activeCardId: null,
  filter: { keyword: '', labelId: '', due: '' },
};

// D&Dで使う一時変数
let dragState = {
  type: null,       // 'card' | 'column'
  id: null,
  sourceColId: null,
};

// ===== ID生成 =====
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ===== 日付ユーティリティ =====
function today() {
  return new Date().toISOString().split('T')[0];
}

function weekEnd() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function isOverdue(dateStr) {
  return dateStr && dateStr < today();
}

function isSoon(dateStr) {
  const t = today();
  const w = weekEnd();
  return dateStr && dateStr >= t && dateStr <= w;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function calcProgress(checklist) {
  if (!checklist.length) return 0;
  const done = checklist.filter(c => c.done).length;
  return Math.round((done / checklist.length) * 100);
}

// ===== フィルタ =====
function getVisibleCardIds() {
  const { keyword, labelId, due } = state.filter;
  const t = today();
  const w = weekEnd();

  return new Set(
    state.cards
      .filter(card => {
        if (keyword) {
          const kw = keyword.toLowerCase();
          if (!card.title.toLowerCase().includes(kw) &&
              !card.description.toLowerCase().includes(kw)) return false;
        }
        if (labelId && !card.labels.includes(labelId)) return false;
        if (due === 'overdue' && !(card.dueDate && card.dueDate < t)) return false;
        if (due === 'this-week' && !(card.dueDate && card.dueDate >= t && card.dueDate <= w)) return false;
        return true;
      })
      .map(c => c.id)
  );
}

// ===== レンダリング =====
function renderBoard() {
  const board = document.getElementById('board');
  const addColArea = document.getElementById('add-column-area');

  // カラムを一旦全削除（add-column-area は残す）
  board.querySelectorAll('.column').forEach(el => el.remove());

  const sortedCols = [...state.columns].sort((a, b) => a.order - b.order);
  const visibleIds = getVisibleCardIds();

  sortedCols.forEach(col => {
    const colEl = createColumnEl(col, visibleIds);
    board.insertBefore(colEl, addColArea);
  });

  initDragDrop();
  updateFilterLabelOptions();
}

function createColumnEl(col, visibleIds) {
  const div = document.createElement('div');
  div.className = 'column';
  div.id = `col-${col.id}`;
  div.dataset.colId = col.id;
  div.draggable = true;

  div.innerHTML = `
    <div class="column-header">
      <h3 class="column-title" data-col-id="${col.id}" contenteditable="false" spellcheck="false">${escHtml(col.name)}</h3>
      <button class="col-btn col-rename-btn" data-col-id="${col.id}" title="名前を変更">✏️</button>
      <button class="col-btn col-delete-btn" data-col-id="${col.id}" title="カラムを削除">🗑️</button>
    </div>
    <div class="card-list" data-col-id="${col.id}"></div>
    <button class="add-card-btn" data-col-id="${col.id}">+ カード追加</button>
    <div class="add-card-form hidden" data-col-id="${col.id}">
      <textarea class="new-card-title" placeholder="タイトルを入力..." rows="2"></textarea>
      <div class="add-card-actions">
        <button class="btn-primary confirm-add-card" data-col-id="${col.id}">追加</button>
        <button class="btn-secondary cancel-add-card">キャンセル</button>
      </div>
    </div>
  `;

  // カードを描画
  const cardList = div.querySelector('.card-list');
  const cardsInCol = state.cards
    .filter(c => c.columnId === col.id)
    .sort((a, b) => a.order - b.order);

  cardsInCol.forEach(card => {
    const cardEl = createCardEl(card, visibleIds);
    cardList.appendChild(cardEl);
  });

  // カラムヘッダーのイベント
  div.querySelector('.col-rename-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    startRenameColumn(col.id);
  });
  div.querySelector('.col-delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteColumn(col.id);
  });

  // カラムタイトルのダブルクリック
  const titleEl = div.querySelector('.column-title');
  titleEl.addEventListener('dblclick', () => startRenameColumn(col.id));
  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finishRenameColumn(col.id); }
    if (e.key === 'Escape') { cancelRenameColumn(col.id); }
  });
  titleEl.addEventListener('blur', () => {
    if (titleEl.contentEditable === 'true') finishRenameColumn(col.id);
  });

  // カード追加
  const addCardBtn = div.querySelector('.add-card-btn');
  const addCardForm = div.querySelector('.add-card-form');
  addCardBtn.addEventListener('click', () => {
    addCardBtn.classList.add('hidden');
    addCardForm.classList.remove('hidden');
    addCardForm.querySelector('.new-card-title').focus();
  });
  div.querySelector('.confirm-add-card').addEventListener('click', () => {
    const title = addCardForm.querySelector('.new-card-title').value.trim();
    if (title) addCard(col.id, title);
    resetAddCardForm(div);
  });
  div.querySelector('.cancel-add-card').addEventListener('click', () => resetAddCardForm(div));
  addCardForm.querySelector('.new-card-title').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const title = addCardForm.querySelector('.new-card-title').value.trim();
      if (title) addCard(col.id, title);
      resetAddCardForm(div);
    }
    if (e.key === 'Escape') resetAddCardForm(div);
  });

  return div;
}

function resetAddCardForm(colEl) {
  const form = colEl.querySelector('.add-card-form');
  const btn = colEl.querySelector('.add-card-btn');
  form.querySelector('.new-card-title').value = '';
  form.classList.add('hidden');
  btn.classList.remove('hidden');
}

function createCardEl(card, visibleIds) {
  const div = document.createElement('div');
  div.className = 'card';
  div.id = `card-${card.id}`;
  div.dataset.cardId = card.id;
  div.dataset.colId = card.columnId;
  div.draggable = true;

  if (visibleIds && !visibleIds.has(card.id)) {
    div.classList.add('hidden');
  }

  const labelsHtml = card.labels
    .map(lid => {
      const lbl = state.labels.find(l => l.id === lid);
      return lbl ? `<span class="label-badge" style="background:${lbl.color}">${escHtml(lbl.name)}</span>` : '';
    }).join('');

  let dueMeta = '';
  if (card.dueDate) {
    const overdueClass = isOverdue(card.dueDate) ? 'overdue' : (isSoon(card.dueDate) ? 'soon' : '');
    const icon = isOverdue(card.dueDate) ? '🔴 ' : (isSoon(card.dueDate) ? '⚠️ ' : '📅 ');
    dueMeta = `<span class="card-due ${overdueClass}">${icon}${formatDate(card.dueDate)}</span>`;
  }

  const pct = calcProgress(card.checklist);
  let checklistMeta = '';
  if (card.checklist.length > 0) {
    const done = card.checklist.filter(c => c.done).length;
    checklistMeta = `<span class="card-checklist-meta">☑ ${done}/${card.checklist.length}</span>`;
  }

  let progressHtml = '';
  if (card.checklist.length > 0) {
    progressHtml = `
      <div class="card-progress">
        <span class="progress-pct">${pct}%</span>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  div.innerHTML = `
    ${labelsHtml ? `<div class="card-labels">${labelsHtml}</div>` : ''}
    <p class="card-title">${escHtml(card.title)}</p>
    ${(dueMeta || checklistMeta) ? `<div class="card-meta">${dueMeta}${checklistMeta}</div>` : ''}
    ${progressHtml}
  `;

  div.addEventListener('click', () => openModal(card.id));

  return div;
}

// ===== エスケープ =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== カラム操作 =====
function addColumn(name) {
  const maxOrder = state.columns.reduce((m, c) => Math.max(m, c.order), -1);
  state.columns.push({ id: generateId('col'), name, order: maxOrder + 1 });
  renderBoard();
}

function deleteColumn(colId) {
  const col = state.columns.find(c => c.id === colId);
  if (!col) return;
  const cardCount = state.cards.filter(c => c.columnId === colId).length;
  const msg = cardCount > 0
    ? `「${col.name}」を削除しますか？\n配下の ${cardCount} 枚のカードも削除されます。`
    : `「${col.name}」を削除しますか？`;
  if (!confirm(msg)) return;
  state.columns = state.columns.filter(c => c.id !== colId);
  state.cards = state.cards.filter(c => c.columnId !== colId);
  renderBoard();
}

function startRenameColumn(colId) {
  const titleEl = document.querySelector(`.column-title[data-col-id="${colId}"]`);
  if (!titleEl) return;
  titleEl.contentEditable = 'true';
  titleEl.focus();
  const range = document.createRange();
  range.selectNodeContents(titleEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function finishRenameColumn(colId) {
  const titleEl = document.querySelector(`.column-title[data-col-id="${colId}"]`);
  if (!titleEl) return;
  const newName = titleEl.textContent.trim();
  titleEl.contentEditable = 'false';
  if (!newName) {
    const col = state.columns.find(c => c.id === colId);
    titleEl.textContent = col ? col.name : '';
    return;
  }
  const col = state.columns.find(c => c.id === colId);
  if (col) col.name = newName;
}

function cancelRenameColumn(colId) {
  const titleEl = document.querySelector(`.column-title[data-col-id="${colId}"]`);
  if (!titleEl) return;
  const col = state.columns.find(c => c.id === colId);
  titleEl.textContent = col ? col.name : '';
  titleEl.contentEditable = 'false';
}

// ===== カード操作 =====
function addCard(colId, title) {
  const cardsInCol = state.cards.filter(c => c.columnId === colId);
  const maxOrder = cardsInCol.reduce((m, c) => Math.max(m, c.order), -1);
  state.cards.push({
    id: generateId('card'),
    columnId: colId,
    order: maxOrder + 1,
    title,
    description: '',
    dueDate: '',
    labels: [],
    checklist: [],
  });
  renderBoard();
}

function deleteCard(cardId) {
  state.cards = state.cards.filter(c => c.id !== cardId);
}

// ===== モーダル =====
function openModal(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;
  state.activeCardId = cardId;

  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-desc');
  const dueEl = document.getElementById('modal-due');
  const dueWarning = document.getElementById('modal-due-warning');
  const labelsEl = document.getElementById('modal-labels');
  const checklistList = document.getElementById('checklist-list');

  // タイトル
  titleEl.textContent = card.title;
  titleEl.contentEditable = 'false';

  // タイトルクリックで編集
  titleEl.onclick = () => {
    titleEl.contentEditable = 'true';
    titleEl.focus();
    const r = document.createRange();
    r.selectNodeContents(titleEl);
    r.collapse(false);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  };
  titleEl.onblur = () => { titleEl.contentEditable = 'false'; };
  titleEl.onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
  };

  // 説明
  descEl.value = card.description;

  // 期限日
  dueEl.value = card.dueDate || '';
  updateDueWarning();
  dueEl.oninput = updateDueWarning;

  // ラベル
  labelsEl.innerHTML = '';
  state.labels.forEach(label => {
    const isSelected = card.labels.includes(label.id);
    const item = document.createElement('div');
    item.className = `label-checkbox-item${isSelected ? ' selected' : ''}`;
    item.style.background = label.color;
    item.dataset.labelId = label.id;
    item.innerHTML = `
      <span class="check-icon">✓</span>
      <span>${escHtml(label.name)}</span>
    `;
    item.addEventListener('click', () => {
      item.classList.toggle('selected');
    });
    labelsEl.appendChild(item);
  });

  // チェックリスト
  renderChecklist(card);

  // チェックリスト追加
  document.getElementById('new-checklist-item').value = '';
  document.getElementById('add-checklist-btn').onclick = () => addChecklistItem();
  document.getElementById('new-checklist-item').onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }
  };

  overlay.classList.remove('hidden');
  titleEl.focus();
  titleEl.blur();
}

function updateDueWarning() {
  const dueEl = document.getElementById('modal-due');
  const warning = document.getElementById('modal-due-warning');
  if (dueEl.value && isOverdue(dueEl.value)) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
}

function renderChecklist(card) {
  const list = document.getElementById('checklist-list');
  list.innerHTML = '';
  card.checklist.forEach(item => {
    const li = document.createElement('li');
    li.className = 'checklist-item';
    li.dataset.chkId = item.id;
    li.innerHTML = `
      <input type="checkbox" ${item.done ? 'checked' : ''}>
      <span class="checklist-item-text ${item.done ? 'done' : ''}">${escHtml(item.text)}</span>
      <button class="checklist-item-delete" title="削除">✕</button>
    `;
    li.querySelector('input').addEventListener('change', (e) => {
      item.done = e.target.checked;
      li.querySelector('.checklist-item-text').classList.toggle('done', item.done);
      updateChecklistProgress(card);
    });
    li.querySelector('.checklist-item-delete').addEventListener('click', () => {
      card.checklist = card.checklist.filter(c => c.id !== item.id);
      renderChecklist(card);
    });
    list.appendChild(li);
  });
  updateChecklistProgress(card);
}

function updateChecklistProgress(card) {
  const pct = calcProgress(card.checklist);
  document.getElementById('checklist-pct').textContent = `${pct}%`;
  document.getElementById('checklist-bar').style.width = `${pct}%`;
}

function addChecklistItem() {
  const input = document.getElementById('new-checklist-item');
  const text = input.value.trim();
  if (!text) return;
  const card = state.cards.find(c => c.id === state.activeCardId);
  if (!card) return;
  card.checklist.push({ id: generateId('chk'), text, done: false });
  renderChecklist(card);
  input.value = '';
  input.focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  state.activeCardId = null;
}

function saveModal() {
  const cardId = state.activeCardId;
  if (!cardId) return;
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;

  card.title = document.getElementById('modal-title').textContent.trim() || card.title;
  card.description = document.getElementById('modal-desc').value;
  card.dueDate = document.getElementById('modal-due').value;

  const selectedLabels = [...document.querySelectorAll('.label-checkbox-item.selected')]
    .map(el => el.dataset.labelId);
  card.labels = selectedLabels;

  closeModal();
  renderBoard();
}

// ===== ドラッグ&ドロップ =====
function initDragDrop() {
  // カード D&D
  document.querySelectorAll('.card').forEach(cardEl => {
    cardEl.addEventListener('dragstart', onCardDragStart);
    cardEl.addEventListener('dragend', onDragEnd);
  });

  // カードリスト（ドロップ先）
  document.querySelectorAll('.card-list').forEach(list => {
    list.addEventListener('dragover', onCardListDragOver);
    list.addEventListener('dragleave', onCardListDragLeave);
    list.addEventListener('drop', onCardDrop);
  });

  // カラム D&D
  document.querySelectorAll('.column').forEach(colEl => {
    colEl.addEventListener('dragstart', onColumnDragStart);
    colEl.addEventListener('dragend', onDragEnd);
    colEl.addEventListener('dragover', onColumnDragOver);
    colEl.addEventListener('dragleave', onColumnDragLeave);
    colEl.addEventListener('drop', onColumnDrop);
  });
}

function onCardDragStart(e) {
  if (e.target.closest('.column-header') || e.target.closest('.add-card-form') || e.target.closest('.add-card-btn')) {
    e.preventDefault();
    return;
  }
  const cardEl = e.target.closest('.card');
  if (!cardEl) return;
  dragState.type = 'card';
  dragState.id = cardEl.dataset.cardId;
  dragState.sourceColId = cardEl.dataset.colId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', cardEl.dataset.cardId);
  setTimeout(() => cardEl.classList.add('dragging'), 0);
}

function onCardListDragOver(e) {
  if (dragState.type !== 'card') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const list = e.currentTarget;
  list.classList.add('drag-over');

  // インジケーター
  removeDropIndicators();
  const afterEl = getCardAfterElement(list, e.clientY);
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  if (afterEl) {
    list.insertBefore(indicator, afterEl);
  } else {
    list.appendChild(indicator);
  }
}

function onCardListDragLeave(e) {
  const list = e.currentTarget;
  if (!list.contains(e.relatedTarget)) {
    list.classList.remove('drag-over');
    removeDropIndicators();
  }
}

function onCardDrop(e) {
  if (dragState.type !== 'card') return;
  e.preventDefault();
  e.stopPropagation();

  const list = e.currentTarget;
  list.classList.remove('drag-over');
  removeDropIndicators();

  const toColId = list.dataset.colId;
  const afterEl = getCardAfterElement(list, e.clientY);
  const afterCardId = afterEl ? afterEl.dataset.cardId : null;

  moveCard(dragState.id, toColId, afterCardId);
  dragState = { type: null, id: null, sourceColId: null };
}

function onColumnDragStart(e) {
  if (dragState.type === 'card') return;
  const cardEl = e.target.closest('.card');
  if (cardEl) return;

  const colEl = e.target.closest('.column');
  if (!colEl) return;

  const titleEl = colEl.querySelector('.column-title');
  if (titleEl && titleEl.contentEditable === 'true') return;

  dragState.type = 'column';
  dragState.id = colEl.dataset.colId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', colEl.dataset.colId);
  setTimeout(() => colEl.classList.add('dragging'), 0);
}

function onColumnDragOver(e) {
  if (dragState.type !== 'column') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const colEl = e.currentTarget;
  if (colEl.dataset.colId !== dragState.id) {
    colEl.classList.add('drag-over-column');
  }
}

function onColumnDragLeave(e) {
  const colEl = e.currentTarget;
  if (!colEl.contains(e.relatedTarget)) {
    colEl.classList.remove('drag-over-column');
  }
}

function onColumnDrop(e) {
  if (dragState.type !== 'column') return;
  e.preventDefault();
  e.stopPropagation();

  const targetColEl = e.currentTarget;
  targetColEl.classList.remove('drag-over-column');

  const toColId = targetColEl.dataset.colId;
  if (toColId && toColId !== dragState.id) {
    moveColumn(dragState.id, toColId);
  }
  dragState = { type: null, id: null, sourceColId: null };
}

function onDragEnd(e) {
  document.querySelectorAll('.card.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.column.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.card-list.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.column.drag-over-column').forEach(el => el.classList.remove('drag-over-column'));
  removeDropIndicators();
}

function removeDropIndicators() {
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
}

function getCardAfterElement(container, clientY) {
  const cards = [...container.querySelectorAll('.card:not(.dragging):not(.hidden)')];
  return cards.reduce((closest, card) => {
    const rect = card.getBoundingClientRect();
    const offset = clientY - (rect.top + rect.height / 2);
    if (offset < 0 && offset > (closest.offset || -Infinity)) {
      return { offset, element: card };
    }
    return closest;
  }, {}).element || null;
}

function moveCard(cardId, toColId, afterCardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;

  card.columnId = toColId;

  const cardsInTarget = state.cards
    .filter(c => c.columnId === toColId && c.id !== cardId)
    .sort((a, b) => a.order - b.order);

  if (!afterCardId) {
    // 末尾
    card.order = cardsInTarget.length > 0 ? cardsInTarget[cardsInTarget.length - 1].order + 1 : 0;
  } else {
    const afterIndex = cardsInTarget.findIndex(c => c.id === afterCardId);
    // afterCardId の前に挿入
    cardsInTarget.forEach((c, i) => {
      if (i < afterIndex) c.order = i;
      else c.order = i + 2;
    });
    card.order = afterIndex;
  }

  renderBoard();
}

function moveColumn(fromId, toId) {
  const from = state.columns.find(c => c.id === fromId);
  const to = state.columns.find(c => c.id === toId);
  if (!from || !to) return;

  const fromOrder = from.order;
  const toOrder = to.order;

  if (fromOrder < toOrder) {
    state.columns.forEach(c => {
      if (c.order > fromOrder && c.order <= toOrder) c.order--;
    });
  } else {
    state.columns.forEach(c => {
      if (c.order >= toOrder && c.order < fromOrder) c.order++;
    });
  }
  from.order = toOrder;

  renderBoard();
}

// ===== フィルタ・検索 =====
function applyFilter() {
  const visibleIds = getVisibleCardIds();
  document.querySelectorAll('.card').forEach(cardEl => {
    const id = cardEl.dataset.cardId;
    if (visibleIds.has(id)) {
      cardEl.classList.remove('hidden');
    } else {
      cardEl.classList.add('hidden');
    }
  });
}

function updateFilterLabelOptions() {
  const select = document.getElementById('filter-label');
  const current = select.value;
  select.innerHTML = '<option value="">ラベル: すべて</option>';
  state.labels.forEach(label => {
    const opt = document.createElement('option');
    opt.value = label.id;
    opt.textContent = label.name;
    if (label.id === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// ===== テーマ =====
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

// ===== 初期化 =====
function init() {
  loadTheme();
  renderBoard();

  // テーマ切替
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // カラム追加
  const addColBtn = document.getElementById('add-column-btn');
  const addColForm = document.getElementById('add-column-form');
  const newColInput = document.getElementById('new-column-name');

  addColBtn.addEventListener('click', () => {
    addColBtn.classList.add('hidden');
    addColForm.classList.remove('hidden');
    newColInput.focus();
  });

  document.getElementById('confirm-add-column').addEventListener('click', () => {
    const name = newColInput.value.trim();
    if (name) addColumn(name);
    resetAddColumnForm();
  });

  document.getElementById('cancel-add-column').addEventListener('click', resetAddColumnForm);

  newColInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const name = newColInput.value.trim();
      if (name) addColumn(name);
      resetAddColumnForm();
    }
    if (e.key === 'Escape') resetAddColumnForm();
  });

  function resetAddColumnForm() {
    newColInput.value = '';
    addColForm.classList.add('hidden');
    addColBtn.classList.remove('hidden');
  }

  // モーダル閉じる
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveModal);

  document.getElementById('modal-delete').addEventListener('click', () => {
    const cardId = state.activeCardId;
    if (!cardId) return;
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;
    if (!confirm(`「${card.title}」を削除しますか？`)) return;
    deleteCard(cardId);
    closeModal();
    renderBoard();
  });

  // オーバーレイクリックで閉じる
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('modal-overlay').classList.contains('hidden')) {
      closeModal();
    }
  });

  // 検索
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.filter.keyword = e.target.value;
    applyFilter();
  });

  // ラベルフィルタ
  document.getElementById('filter-label').addEventListener('change', (e) => {
    state.filter.labelId = e.target.value;
    applyFilter();
  });

  // 期限フィルタ
  document.getElementById('filter-due').addEventListener('change', (e) => {
    state.filter.due = e.target.value;
    applyFilter();
  });
}

document.addEventListener('DOMContentLoaded', init);
