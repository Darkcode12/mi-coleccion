'use strict';

// ===== STATE =====
let items = JSON.parse(localStorage.getItem('coleccion_items') || '[]');
let typeFilter = 'all';
let statusFilter = 'all';
let imgTab = 'url';
let fileDataUrl = null;
let currentDetailId = null;

// ===== SAVE =====
function save() {
  localStorage.setItem('coleccion_items', JSON.stringify(items));
}

// ===== HELPERS =====
const statusLabel = { playing: 'Jugando/Viendo', completed: 'Completado', wishlist: 'Wishlist' };
const statusClass = { playing: 's-playing', completed: 's-completed', wishlist: 's-wishlist' };
const typeIcon  = { game: '🎮', movie: '🎬' };
const typeLabel = { game: 'Videojuego', movie: 'Película / Serie' };

// ===== RENDER =====
function render() {
  const filtered = items.filter(i =>
    (typeFilter === 'all' || i.type === typeFilter) &&
    (statusFilter === 'all' || i.status === statusFilter)
  );

  document.getElementById('cnt-all').textContent = items.length;
  ['playing','completed','wishlist'].forEach(s => {
    document.getElementById('cnt-'+s).textContent = items.filter(i => i.status === s).length;
  });

  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  grid.innerHTML = filtered.map(item => `
    <div class="card" data-id="${item.id}">
      <div class="card-cover">
        ${item.img
          ? `<img src="${item.img}" alt="${escHtml(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none;font-size:38px">${typeIcon[item.type]||'📦'}</span>`
          : `<span>${typeIcon[item.type]||'📦'}</span>`
        }
      </div>
      <div class="card-info">
        <div class="card-name">${escHtml(item.name)}</div>
        <span class="card-status ${statusClass[item.status]}">${statusLabel[item.status]}</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== ADD MODAL =====
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('inp-name').focus();
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  resetForm();
}
function resetForm() {
  document.getElementById('inp-name').value = '';
  document.getElementById('inp-url').value = '';
  document.getElementById('url-preview').style.display = 'none';
  document.getElementById('file-preview').style.display = 'none';
  document.getElementById('file-label').textContent = 'Toca para elegir una imagen';
  fileDataUrl = null;
  setImgTab('url', document.querySelector('.itab[data-tab="url"]'));
}

// ===== IMG TABS =====
function setImgTab(tab, el) {
  imgTab = tab;
  document.querySelectorAll('.itab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-url').style.display = tab === 'url' ? '' : 'none';
  document.getElementById('tab-file').style.display = tab === 'file' ? '' : 'none';
}

document.querySelectorAll('.itab').forEach(btn => {
  btn.addEventListener('click', () => setImgTab(btn.dataset.tab, btn));
});

// URL preview
document.getElementById('inp-url').addEventListener('input', () => {
  const url = document.getElementById('inp-url').value.trim();
  const img = document.getElementById('url-preview');
  if (url) { img.src = url; img.style.display = 'block'; } else { img.style.display = 'none'; }
});

// File upload
document.getElementById('inp-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    fileDataUrl = ev.target.result;
    const img = document.getElementById('file-preview');
    img.src = fileDataUrl;
    img.style.display = 'block';
    document.getElementById('file-label').textContent = file.name;
  };
  reader.readAsDataURL(file);
});

// ===== SAVE ITEM =====
function addItem() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) { document.getElementById('inp-name').focus(); return; }
  const type = document.getElementById('inp-type').value;
  const status = document.getElementById('inp-status').value;
  let img = null;
  if (imgTab === 'url') {
    img = document.getElementById('inp-url').value.trim() || null;
  } else {
    img = fileDataUrl || null;
  }
  items.unshift({ id: Date.now(), name, type, status, img, createdAt: new Date().toISOString() });
  save();
  render();
  closeModal();
}

// ===== DETAIL MODAL =====
function openDetail(id) {
  const item = items.find(i => i.id == id);
  if (!item) return;
  currentDetailId = id;

  const cover = document.getElementById('detail-cover');
  cover.innerHTML = item.img
    ? `<img src="${item.img}" alt="${escHtml(item.name)}" />`
    : `<span>${typeIcon[item.type]||'📦'}</span>`;

  document.getElementById('detail-name').textContent = item.name;
  document.getElementById('detail-meta').textContent = typeLabel[item.type] || '';

  const sel = document.getElementById('detail-status-sel');
  sel.innerHTML = `
    <option value="playing" ${item.status==='playing'?'selected':''}>Jugando / Viendo</option>
    <option value="completed" ${item.status==='completed'?'selected':''}>Completado</option>
    <option value="wishlist" ${item.status==='wishlist'?'selected':''}>Wishlist</option>
  `;

  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('open');
  currentDetailId = null;
}

document.getElementById('detail-status-sel').addEventListener('change', e => {
  if (!currentDetailId) return;
  const item = items.find(i => i.id == currentDetailId);
  if (item) { item.status = e.target.value; save(); render(); }
});

document.getElementById('btnDelete').addEventListener('click', () => {
  if (!currentDetailId) return;
  items = items.filter(i => i.id != currentDetailId);
  save(); render(); closeDetail();
});

// ===== EVENTS =====
document.getElementById('btnOpenModal').addEventListener('click', openModal);
document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnSave').addEventListener('click', addItem);
document.getElementById('btnCloseDetail').addEventListener('click', closeDetail);

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});
document.getElementById('detailOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
});

// Enter key in name field
document.getElementById('inp-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') addItem();
});

// ===== FILTERS =====
document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    typeFilter = btn.dataset.type;
    render();
  });
});

document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    statusFilter = btn.dataset.status;
    render();
  });
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ===== INIT =====
window.addEventListener('load', () => {
  render();
  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
  }, 900);
});
