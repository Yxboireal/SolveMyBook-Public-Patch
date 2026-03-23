// SolveMyBook Offline — Popup JS
// Modified by Ahmed Abdullah

const STORAGE_KEYS = [
  'activated','autosolveConfidenceLevel','autosolveGradeRange',
  'autosolveSubmitDelay','autosolveAdvanceDelay','autosolveRunning'
];

// ---- Load saved state ----
chrome.storage.local.get(STORAGE_KEYS, r => {
  // Enable toggle
  const sw = document.getElementById('switch');
  if (sw) sw.checked = !!r.activated;

  // Confidence pills
  const conf = r.autosolveConfidenceLevel || ['high'];
  document.querySelectorAll('.conf-pill').forEach(p => {
    p.classList.toggle('active', conf.includes(p.dataset.level));
  });

  // Grade accuracy — use min of gradeRange
  const grade = r.autosolveGradeRange || { min: 100, max: 100 };
  const accMin = document.getElementById('accMin');
  accMin.value = grade.min;
  updateAccLabel();

  // Delays
  const sub = r.autosolveSubmitDelay  || { min:1000, max:3000 };
  const adv = r.autosolveAdvanceDelay || { min:1000, max:3000 };
  document.getElementById('ansMin').value = sub.min / 1000;
  document.getElementById('ansMax').value = sub.max / 1000;
  document.getElementById('advMin').value = adv.min / 1000;
  document.getElementById('advMax').value = adv.max / 1000;
  updateDelayLabels();

  // If was running, update UI
  if (r.autosolveRunning) setRunningUI(true);
});

// ---- Enable toggle ----
document.getElementById('switch').addEventListener('change', e => {
  const on = e.target.checked;
  chrome.storage.local.set({ activated: on });
  chrome.tabs.query({ active:true, currentWindow:true }, tabs => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 't7b4', enabled: on }, () => { chrome.runtime.lastError; });
    }
  });
  const snap = document.getElementById('snapshotButton');
  const chat = document.getElementById('aiChatButton');
  if (on) { snap.classList.remove('disabled'); chat.classList.remove('disabled'); }
  else     { snap.classList.add('disabled');    chat.classList.add('disabled'); }
});

// Apply initial disabled state
chrome.storage.local.get('activated', r => {
  if (r.activated) {
    document.getElementById('snapshotButton').classList.remove('disabled');
    document.getElementById('aiChatButton').classList.remove('disabled');
  }
});

// ---- Settings gear → open settings page ----
document.getElementById('settingsBox').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('p8g3/p9k4/63bbb077.html') });
});

// ---- Snapshot & Chat ----
document.getElementById('snapshotButton').addEventListener('click', () => {
  chrome.tabs.query({ active:true, currentWindow:true }, async tabs => {
    if (!tabs[0]) return;
    try {
      await chrome.tabs.sendMessage(tabs[0].id, { action:'ping' });
      chrome.tabs.sendMessage(tabs[0].id, { action:'capture_screenshot' });
      setTimeout(() => window.close(), 10);
    } catch(e) {}
  });
});
document.getElementById('aiChatButton').addEventListener('click', () => {
  chrome.storage.local.set({ sidePanelData:{ state:'empty' } });
  chrome.runtime.sendMessage({ action:'openSidePanel' }, () => { chrome.runtime.lastError; });
});

// ---- AutoSolve panel toggle ----
const trigger  = document.getElementById('autosolve-trigger');
const panel    = document.getElementById('autosolve-panel');
const chevron  = document.getElementById('trigger-chevron');
let panelOpen  = false;

trigger.addEventListener('click', () => {
  panelOpen = !panelOpen;
  panel.classList.toggle('open', panelOpen);
  chevron.classList.toggle('rotated', panelOpen);
});

// ---- Confidence pills ----
document.querySelectorAll('.conf-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    pill.classList.toggle('active');
    const active = [...document.querySelectorAll('.conf-pill.active')];
    if (!active.length) pill.classList.add('active');
    saveSettings();
  });
});

// ---- Accuracy slider ----
function updateAccLabel() {
  const v = document.getElementById('accMin').value;
  document.getElementById('accMinVal').textContent = `${v}%–100%`;
}
document.getElementById('accMin').addEventListener('input', () => { updateAccLabel(); saveSettings(); });

// ---- Delay sliders ----
function updateDelayLabels() {
  const an = +document.getElementById('ansMin').value;
  const ax = +document.getElementById('ansMax').value;
  const dn = +document.getElementById('advMin').value;
  const dx = +document.getElementById('advMax').value;
  document.getElementById('ansVal').textContent = `${an}s – ${Math.max(an,ax)}s`;
  document.getElementById('advVal').textContent = `${dn}s – ${Math.max(dn,dx)}s`;
}
['ansMin','ansMax','advMin','advMax'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { updateDelayLabels(); saveSettings(); });
});

function saveSettings() {
  const conf = [...document.querySelectorAll('.conf-pill.active')].map(p => p.dataset.level);
  const accV = +document.getElementById('accMin').value;
  const anN  = Math.round(+document.getElementById('ansMin').value * 1000);
  const anX  = Math.round(Math.max(+document.getElementById('ansMin').value, +document.getElementById('ansMax').value) * 1000);
  const adN  = Math.round(+document.getElementById('advMin').value * 1000);
  const adX  = Math.round(Math.max(+document.getElementById('advMin').value, +document.getElementById('advMax').value) * 1000);

  chrome.storage.local.set({
    autosolveConfidenceLevel: conf,
    autosolveGradeRange:      { min: accV, max: 100 },
    autosolveSubmitDelay:     { min: anN,  max: anX },
    autosolveAdvanceDelay:    { min: adN,  max: adX }
  });
}

// ---- Timer ----
let timerInterval = null;
let startTime     = null;

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    document.getElementById('run-timer').textContent = `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('run-timer').textContent = '';
}

// ---- Running UI state ----
function setRunningUI(on) {
  const dot   = document.getElementById('run-dot');
  const label = document.getElementById('run-label');
  const stats = document.getElementById('run-stats');
  const start = document.getElementById('btn-start');
  const stop  = document.getElementById('btn-stop');
  const trig  = document.getElementById('autosolve-trigger');

  dot.classList.toggle('active', on);
  label.textContent = on ? 'Running...' : 'Not running';
  stats.style.display = on ? 'block' : 'none';
  start.classList.toggle('running', on);
  stop.classList.toggle('visible', on);

  // Change trigger button colour when running
  if (on) {
    trig.style.background = 'linear-gradient(117deg,#ef4444,#f87171)';
    startTimer();
  } else {
    trig.style.background = '';
    stopTimer();
  }
}

// ---- Start button ----
document.getElementById('btn-start').addEventListener('click', () => {
  saveSettings();
  setRunningUI(true);
  chrome.storage.local.set({ autosolveRunning: true });

  chrome.tabs.query({ active:true, currentWindow:true }, tabs => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action:'START_SMB_AUTOSOLVE' }, () => { chrome.runtime.lastError; });
  });

  // Update trigger label
  document.querySelector('.trigger-label').textContent = 'Auto-Solve Running';
});

// ---- Stop button ----
document.getElementById('btn-stop').addEventListener('click', () => {
  setRunningUI(false);
  chrome.storage.local.set({ autosolveRunning: false });

  chrome.tabs.query({ active:true, currentWindow:true }, tabs => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action:'STOP_SMB_AUTOSOLVE' }, () => { chrome.runtime.lastError; });
  });

  document.querySelector('.trigger-label').textContent = 'Start Auto-Solve';
  // Reset stats display
  document.getElementById('stat-correct').textContent = '0';
  document.getElementById('stat-wrong').textContent   = '0';
  document.getElementById('stat-pct').textContent     = '—';
});

// ---- Listen for stat updates from content script ----
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'autosolve_stats') {
    document.getElementById('stat-correct').textContent = msg.correct || 0;
    document.getElementById('stat-wrong').textContent   = msg.wrong   || 0;
    const total = (msg.correct || 0) + (msg.wrong || 0);
    document.getElementById('stat-pct').textContent = total > 0
      ? Math.round(msg.correct / total * 100) + '%' : '—';
  }
  if (msg.action === 'autosolve_done') {
    setRunningUI(false);
    chrome.storage.local.set({ autosolveRunning: false });
    document.querySelector('.trigger-label').textContent = 'Start Auto-Solve';
  }
});

// Remove the loading class so the popup renders properly
document.querySelector('.main-body')?.classList.remove('loading');
