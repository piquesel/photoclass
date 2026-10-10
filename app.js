// app.js

const STORAGE_DATA = 'photosclasse_data';
const STORAGE_POS  = 'photosclasse_positions';

let currentClassId = null;
let isEditMode     = false;
let dragState      = null;

// ── Initialisation ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (CONFIG.debug) {
    document.getElementById('debugBadge').classList.remove('hidden');
  }
  if (CONFIG.debug || sessionStorage.getItem('auth') === '1') {
    showApp();
  }
  initDragController();
});

// ── Authentification ──────────────────────────────────────────────────────────

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login() {
  if (CONFIG.debug) { showApp(); return; }

  const value = document.getElementById('loginPassword').value;
  if (!value) return;

  const hash = await hashPassword(value);
  if (hash === CONFIG.passwordHash) {
    sessionStorage.setItem('auth', '1');
    showApp();
  } else {
    const el = document.getElementById('loginError');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
  }
}

function logout() {
  sessionStorage.removeItem('auth');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginPassword').value = '';
}

// ── Démarrage de l'app ────────────────────────────────────────────────────────

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderTabs();
  switchClass(CONFIG.classes[0].id);
}

function renderTabs() {
  document.getElementById('tabs').innerHTML = CONFIG.classes.map(cls => `
    <button id="tab-${cls.id}" onclick="switchClass('${cls.id}')"
      class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
             transition text-gray-400 hover:text-white hover:bg-gray-700">
      ${cls.label}
    </button>
  `).join('');
}

function switchClass(classId) {
  currentClassId = classId;

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('bg-blue-600', 'text-white');
    b.classList.add('text-gray-400');
  });
  const tab = document.getElementById(`tab-${classId}`);
  tab.classList.add('bg-blue-600', 'text-white');
  tab.classList.remove('text-gray-400');

  const cls = CONFIG.classes.find(c => c.id === classId);
  document.getElementById('formTitle').textContent = cls.label;
  document.getElementById('classPhoto').src = cls.photo;

  renderMarkers();
  renderForm();
}

// ── Positions des marqueurs ───────────────────────────────────────────────────

function loadPositions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_POS) || '{}'); }
  catch { return {}; }
}

function savePositions(all) {
  localStorage.setItem(STORAGE_POS, JSON.stringify(all));
}

function getClassPositions(classId) {
  const all = loadPositions();
  return all[classId] || CONFIG.positions[classId] || generateDefaultPositions(classId);
}

function generateDefaultPositions(classId) {
  const cls = CONFIG.classes.find(c => c.id === classId);
  const n = cls.count;
  const cols = Math.ceil(Math.sqrt(n * 1.7));
  const rows = Math.ceil(n / cols);
  const xPad = 6, yPad = 10;
  const xStep = cols > 1 ? (100 - 2 * xPad) / (cols - 1) : 0;
  const yStep = rows > 1 ? (100 - 2 * yPad) / (rows - 1) : 0;
  const pos = {};
  for (let i = 0; i < n; i++) {
    pos[i + 1] = {
      x: xPad + (i % cols) * xStep,
      y: yPad + Math.floor(i / cols) * yStep,
    };
  }
  return pos;
}

function persistPosition(classId, id, x, y) {
  const all = loadPositions();
  if (!all[classId]) all[classId] = getClassPositions(classId);
  all[classId][id] = { x, y };
  savePositions(all);
}

function resetPositions() {
  const all = loadPositions();
  delete all[currentClassId];
  savePositions(all);
  renderMarkers();
}

// ── Rendu des marqueurs ───────────────────────────────────────────────────────

function renderMarkers() {
  const cls = CONFIG.classes.find(c => c.id === currentClassId);
  const pos = getClassPositions(currentClassId);
  const layer = document.getElementById('markersLayer');

  layer.innerHTML = '';
  layer.style.pointerEvents = isEditMode ? 'auto' : 'auto';

  for (let i = 1; i <= cls.count; i++) {
    const p = pos[i] || { x: 5, y: 5 };
    const m = document.createElement('div');
    m.className = 'marker' + (isEditMode ? ' edit-mode' : '');
    m.id = `marker-${i}`;
    m.dataset.id = i;
    m.textContent = i;
    m.style.left = p.x + '%';
    m.style.top  = p.y + '%';

    m.addEventListener('mouseenter', () => setHighlight(i, true));
    m.addEventListener('mouseleave', () => setHighlight(i, false));

    layer.appendChild(m);
  }
}

function setHighlight(id, on) {
  const marker = document.getElementById(`marker-${id}`);
  const row    = document.getElementById(`row-${id}`);
  if (marker) marker.classList.toggle('highlighted', on);
  if (row) {
    row.classList.toggle('highlighted', on);
    if (on) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ── Drag & drop (contrôleur unique sur le layer) ──────────────────────────────

function initDragController() {
  const layer = document.getElementById('markersLayer');

  const onStart = (e) => {
    if (!isEditMode) return;
    const marker = e.target.closest('.marker');
    if (!marker) return;
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragState = {
      id: marker.dataset.id,
      startCX: cx, startCY: cy,
      startL: parseFloat(marker.style.left),
      startT: parseFloat(marker.style.top),
    };
    marker.classList.add('grabbing');
  };

  const onMove = (e) => {
    if (!dragState) return;
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = document.getElementById('photoContainer').getBoundingClientRect();
    const nx = Math.max(0, Math.min(100, dragState.startL + (cx - dragState.startCX) / rect.width  * 100));
    const ny = Math.max(0, Math.min(100, dragState.startT + (cy - dragState.startCY) / rect.height * 100));
    const m = document.getElementById(`marker-${dragState.id}`);
    if (m) { m.style.left = nx + '%'; m.style.top = ny + '%'; }
  };

  const onEnd = () => {
    if (!dragState) return;
    const m = document.getElementById(`marker-${dragState.id}`);
    if (m) {
      m.classList.remove('grabbing');
      persistPosition(currentClassId, dragState.id,
        parseFloat(m.style.left), parseFloat(m.style.top));
    }
    dragState = null;
  };

  layer.addEventListener('mousedown',  onStart);
  layer.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousemove',  onMove);
  document.addEventListener('touchmove',  onMove, { passive: false });
  document.addEventListener('mouseup',  onEnd);
  document.addEventListener('touchend', onEnd);
}

function toggleEditMode(on) {
  isEditMode = on;
  document.getElementById('editBanner').classList.toggle('hidden', !on);
  renderMarkers();
}

// ── Formulaire de saisie ──────────────────────────────────────────────────────

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_DATA) || '{}'); }
  catch { return {}; }
}

function persistField(classId, id, field, value) {
  const data = loadData();
  if (!data[classId]) data[classId] = {};
  if (!data[classId][id]) data[classId][id] = {};
  data[classId][id][field] = value;
  localStorage.setItem(STORAGE_DATA, JSON.stringify(data));
}

function renderForm() {
  const cls     = CONFIG.classes.find(c => c.id === currentClassId);
  const data    = loadData();
  const clsData = data[currentClassId] || {};
  const list    = document.getElementById('namesList');

  list.innerHTML = '';
  for (let i = 1; i <= cls.count; i++) {
    const p = clsData[i] || {};
    const row = document.createElement('div');
    row.id = `row-${i}`;
    row.className = 'name-row px-1 py-1 transition-colors rounded-md';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 flex-shrink-0 bg-blue-600/80 rounded-full flex items-center justify-center
                     text-xs font-bold leading-none">${i}</span>
        <input type="text" placeholder="Prénom" value="${esc(p.prenom || '')}"
          class="flex-1 min-w-0 bg-gray-700 border border-gray-600/70 rounded px-2 py-1 text-sm
                 focus:outline-none focus:border-blue-500 transition"
          oninput="persistField('${currentClassId}', ${i}, 'prenom', this.value)">
        <input type="text" placeholder="Nom" value="${esc(p.nom || '')}"
          class="flex-1 min-w-0 bg-gray-700 border border-gray-600/70 rounded px-2 py-1 text-sm
                 focus:outline-none focus:border-blue-500 transition"
          oninput="persistField('${currentClassId}', ${i}, 'nom', this.value)">
      </div>
      <div class="flex items-center gap-2 mt-0.5 pl-8">
        <input type="text" placeholder="Commentaire (surnom, signe distinctif…)" value="${esc(p.commentaire || '')}"
          class="flex-1 min-w-0 bg-gray-700/60 border border-gray-600/50 rounded px-2 py-0.5 text-xs
                 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/70 transition"
          oninput="persistField('${currentClassId}', ${i}, 'commentaire', this.value)">
      </div>
    `;

    row.addEventListener('mouseenter', () => setHighlight(i, true));
    row.addEventListener('mouseleave', () => setHighlight(i, false));

    list.appendChild(row);
  }
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Envoi vers Google Sheets ──────────────────────────────────────────────────

async function saveData() {
  const cls     = CONFIG.classes.find(c => c.id === currentClassId);
  const clsData = (loadData()[currentClassId]) || {};

  const rows = [];
  for (let i = 1; i <= cls.count; i++) {
    const p = clsData[i] || {};
    rows.push({ id: i, prenom: p.prenom || '', nom: p.nom || '', commentaire: p.commentaire || '' });
  }

  const payload = {
    classe:    cls.label,
    classId:   currentClassId,
    rows,
    timestamp: new Date().toISOString(),
  };

  if (CONFIG.debug || !CONFIG.sheetsUrl) {
    console.log('%c[DEBUG] Payload à envoyer à Google Sheets :', 'color:#86efac;font-weight:bold', payload);
    toast('Mode debug — données affichées dans la console', 'info');
    return;
  }

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Envoi…';

  try {
    await fetch(CONFIG.sheetsUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload),
    });
    toast('Données enregistrées dans Google Sheets !', 'success');
  } catch (err) {
    console.error(err);
    toast('Erreur réseau — vérifiez la console.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enregistrer';
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function toast(msg, type = 'info') {
  const colors = { success: 'bg-green-700', error: 'bg-red-700', info: 'bg-blue-700' };
  const el = document.createElement('div');
  el.className = `toast fixed bottom-5 right-5 ${colors[type]} text-white
                  px-4 py-3 rounded-xl shadow-xl text-sm z-50`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  }, 3000);
}
