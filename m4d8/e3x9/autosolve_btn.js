// ============================================================
// SolveMyBook Offline - Floating AutoSolve Panel
// Modified by Ahmed Abdullah
// ============================================================

(function() {
  if (!window.location.href.includes('mheducation.com')) return;
  if (document.getElementById('smb-fab-root')) return;

  const style = document.createElement('style');
  style.textContent = `
    #smb-fab-root {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    #smb-fab-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #006B6B;
      border: 2px solid #008080;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,107,107,0.5);
      transition: transform .2s, box-shadow .2s, background .2s;
      font-size: 22px;
      color: white;
      flex-shrink: 0;
    }
    #smb-fab-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(0,107,107,0.7);
      background: #008080;
    }
    #smb-fab-btn.running {
      background: #b91c1c;
      border-color: #dc2626;
      box-shadow: 0 4px 16px rgba(185,28,28,0.5);
    }
    #smb-fab-btn.running:hover {
      background: #dc2626;
      box-shadow: 0 6px 24px rgba(185,28,28,0.7);
    }

    #smb-panel {
      display: none;
      width: 270px;
    }
    #smb-panel.open { display: block; }

    .smb-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Status */
    .smb-status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 12px;
    }
    .smb-dot {
      width: 9px; height: 9px;
      border-radius: 50%;
      background: #d1d5db;
      flex-shrink: 0;
    }
    .smb-dot.active {
      background: #16a34a;
      box-shadow: 0 0 6px #16a34a;
      animation: smb-pulse 1.2s infinite;
    }
    @keyframes smb-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .smb-status-label {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      flex: 1;
    }
    .smb-timer {
      font-size: 12px;
      font-weight: 700;
      color: #006B6B;
      font-variant-numeric: tabular-nums;
    }
    .smb-stats-row {
      display: none;
      font-size: 11px;
      color: #64748b;
      padding: 0 2px;
      font-weight: 500;
    }
    .smb-stats-row span { color: #1e293b; font-weight: 700; }

    /* Divider */
    .smb-div { height: 1px; background: #f1f5f9; }

    /* Section label */
    .smb-label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: .7px;
      margin-bottom: 8px;
    }

    /* Confidence pills */
    .smb-pills { display: flex; gap: 8px; }
    .smb-pill {
      flex: 1;
      padding: 7px 0;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      color: #94a3b8;
      cursor: pointer;
      text-align: center;
      transition: all .15s;
    }
    .smb-pill:hover { border-color: #cbd5e1; color: #64748b; }
    .smb-pill.active.high   { border-color: #006B6B; color: #006B6B; background: #f0fafa; }
    .smb-pill.active.medium { border-color: #d97706; color: #d97706; background: #fffbeb; }
    .smb-pill.active.low    { border-color: #b91c1c; color: #b91c1c; background: #fef2f2; }

    /* Sliders */
    .smb-slider-wrap { display: flex; align-items: center; gap: 10px; }
    .smb-slider-wrap input[type=range] {
      flex: 1;
      height: 4px;
      accent-color: #006B6B;
      cursor: pointer;
    }
    .smb-slider-val {
      font-size: 12px;
      font-weight: 700;
      color: #006B6B;
      min-width: 44px;
      text-align: right;
    }

    /* Delay grid */
    .smb-delay-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .smb-delay-col { display: flex; flex-direction: column; gap: 6px; }
    .smb-delay-col-label {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
    }
    .smb-delay-col input[type=range] {
      width: 100%;
      height: 4px;
      accent-color: #006B6B;
      cursor: pointer;
      display: block;
      margin: 4px 0;
    }
    .smb-delay-display {
      font-size: 11px;
      font-weight: 700;
      color: #006B6B;
    }

    /* Buttons */
    .smb-btn-row { display: flex; gap: 8px; }
    .smb-btn-start {
      flex: 1;
      padding: 11px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      background: #006B6B;
      color: white;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      transition: background .2s;
    }
    .smb-btn-start:hover { background: #008080; }
    .smb-btn-start.hidden { display: none; }
    .smb-btn-stop {
      flex: 1;
      padding: 11px;
      border-radius: 10px;
      border: 2px solid #b91c1c;
      background: transparent;
      color: #b91c1c;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: none;
      transition: all .2s;
    }
    .smb-btn-stop:hover { background: #fef2f2; }
    .smb-btn-stop.visible { display: block; }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'smb-fab-root';
  root.innerHTML = `
    <div id="smb-panel">
      <div class="smb-card">

        <!-- Status -->
        <div>
          <div class="smb-status-row">
            <div class="smb-dot" id="smb-dot"></div>
            <span class="smb-status-label" id="smb-status-label">Not running</span>
            <span class="smb-timer" id="smb-timer"></span>
          </div>
          <div class="smb-stats-row" id="smb-stats">
            ✓ <span id="smb-correct">0</span> correct &nbsp;
            ✗ <span id="smb-wrong">0</span> wrong &nbsp;
            <span id="smb-pct">—</span>
          </div>
        </div>

        <div class="smb-div"></div>

        <!-- Confidence -->
        <div>
          <div class="smb-label">Confidence</div>
          <div class="smb-pills">
            <div class="smb-pill high active" data-level="high">High</div>
            <div class="smb-pill medium" data-level="medium">Medium</div>
            <div class="smb-pill low" data-level="low">Low</div>
          </div>
        </div>

        <!-- Accuracy -->
        <div>
          <div class="smb-label">Target Accuracy</div>
          <div class="smb-slider-wrap">
            <input type="range" id="smb-acc" min="50" max="100" step="5" value="100">
            <span class="smb-slider-val" id="smb-acc-val">100%</span>
          </div>
        </div>

        <!-- Delays -->
        <div>
          <div class="smb-label">Delays (seconds)</div>
          <div class="smb-delay-grid">
            <div class="smb-delay-col">
              <div class="smb-delay-col-label">Answer min / max</div>
              <input type="range" id="smb-ans-min" min="0.5" max="8" step="0.5" value="1">
              <input type="range" id="smb-ans-max" min="0.5" max="8" step="0.5" value="3">
              <div class="smb-delay-display" id="smb-ans-val">1s – 3s</div>
            </div>
            <div class="smb-delay-col">
              <div class="smb-delay-col-label">Advance min / max</div>
              <input type="range" id="smb-adv-min" min="0.5" max="8" step="0.5" value="1">
              <input type="range" id="smb-adv-max" min="0.5" max="8" step="0.5" value="3">
              <div class="smb-delay-display" id="smb-adv-val">1s – 3s</div>
            </div>
          </div>
        </div>

        <div class="smb-div"></div>

        <!-- Actions -->
        <div class="smb-btn-row">
          <button class="smb-btn-start" id="smb-btn-start">▶ Start AutoSolve</button>
          <button class="smb-btn-stop" id="smb-btn-stop">■ Stop</button>
        </div>

      </div>
    </div>

    <button id="smb-fab-btn" title="SolveMyBook AutoSolve">🎯</button>
  `;
  document.body.appendChild(root);

  // ---- Load settings ----
  chrome.storage.local.get([
    'autosolveConfidenceLevel','autosolveGradeRange',
    'autosolveSubmitDelay','autosolveAdvanceDelay'
  ], r => {
    const conf = r.autosolveConfidenceLevel || ['high'];
    document.querySelectorAll('.smb-pill').forEach(p =>
      p.classList.toggle('active', conf.includes(p.dataset.level))
    );
    const grade = r.autosolveGradeRange || { min:100, max:100 };
    document.getElementById('smb-acc').value = grade.min;
    document.getElementById('smb-acc-val').textContent = grade.min + '%';
    const sub = r.autosolveSubmitDelay  || { min:1000, max:3000 };
    const adv = r.autosolveAdvanceDelay || { min:1000, max:3000 };
    document.getElementById('smb-ans-min').value = sub.min / 1000;
    document.getElementById('smb-ans-max').value = sub.max / 1000;
    document.getElementById('smb-adv-min').value = adv.min / 1000;
    document.getElementById('smb-adv-max').value = adv.max / 1000;
    updateDelayLabels();
  });

  // ---- Panel toggle ----
  let panelOpen = false;
  document.getElementById('smb-fab-btn').addEventListener('click', () => {
    panelOpen = !panelOpen;
    document.getElementById('smb-panel').classList.toggle('open', panelOpen);
  });

  // ---- Pills ----
  document.querySelectorAll('.smb-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      if (!document.querySelectorAll('.smb-pill.active').length) pill.classList.add('active');
      saveSettings();
    });
  });

  // ---- Accuracy ----
  document.getElementById('smb-acc').addEventListener('input', function() {
    document.getElementById('smb-acc-val').textContent = this.value + '%';
    saveSettings();
  });

  // ---- Delays ----
  function updateDelayLabels() {
    const an = +document.getElementById('smb-ans-min').value;
    const ax = +document.getElementById('smb-ans-max').value;
    const dn = +document.getElementById('smb-adv-min').value;
    const dx = +document.getElementById('smb-adv-max').value;
    document.getElementById('smb-ans-val').textContent = `${an}s – ${Math.max(an,ax)}s`;
    document.getElementById('smb-adv-val').textContent = `${dn}s – ${Math.max(dn,dx)}s`;
  }
  ['smb-ans-min','smb-ans-max','smb-adv-min','smb-adv-max'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => { updateDelayLabels(); saveSettings(); })
  );

  function saveSettings() {
    const conf = [...document.querySelectorAll('.smb-pill.active')].map(p => p.dataset.level);
    const acc  = +document.getElementById('smb-acc').value;
    const anN  = Math.round(+document.getElementById('smb-ans-min').value * 1000);
    const anX  = Math.round(Math.max(+document.getElementById('smb-ans-min').value, +document.getElementById('smb-ans-max').value) * 1000);
    const adN  = Math.round(+document.getElementById('smb-adv-min').value * 1000);
    const adX  = Math.round(Math.max(+document.getElementById('smb-adv-min').value, +document.getElementById('smb-adv-max').value) * 1000);
    chrome.storage.local.set({
      autosolveConfidenceLevel: conf,
      autosolveGradeRange:      { min:acc, max:100 },
      autosolveSubmitDelay:     { min:anN, max:anX },
      autosolveAdvanceDelay:    { min:adN, max:adX }
    });
  }

  // ---- Timer ----
  let timerInterval = null;
  function startTimer() {
    const t0 = Date.now();
    timerInterval = setInterval(() => {
      const s = Math.floor((Date.now()-t0)/1000);
      document.getElementById('smb-timer').textContent =
        `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerInterval); timerInterval = null;
    document.getElementById('smb-timer').textContent = '';
  }

  // ---- Running state ----
  function setRunning(on) {
    const fab   = document.getElementById('smb-fab-btn');
    const dot   = document.getElementById('smb-dot');
    const label = document.getElementById('smb-status-label');
    const stats = document.getElementById('smb-stats');
    const start = document.getElementById('smb-btn-start');
    const stop  = document.getElementById('smb-btn-stop');

    fab.className   = on ? 'running' : '';
    fab.textContent = on ? '⏹' : '🎯';
    dot.classList.toggle('active', on);
    label.textContent = on ? 'Running...' : 'Not running';
    stats.style.display = on ? 'block' : 'none';
    start.classList.toggle('hidden', on);
    stop.classList.toggle('visible', on);
    if (on) { panelOpen = true; document.getElementById('smb-panel').classList.add('open'); startTimer(); }
    else stopTimer();
  }

  // ---- Start ----
  document.getElementById('smb-btn-start').addEventListener('click', () => {
    saveSettings();
    setRunning(true);
    const engine = window.smbAutosolve;
    if (engine && !engine.isRunning()) {
      engine.start().then(() => setRunning(false));
    }
  });

  // ---- Stop ----
  document.getElementById('smb-btn-stop').addEventListener('click', () => {
    window.smbAutosolve?.stop();
    setRunning(false);
  });

  // ---- Stat updates — listen via postMessage (same-page content script comms) ----
  function updateStats(correct, wrong) {
    const total = (correct||0) + (wrong||0);
    const pct   = total > 0 ? Math.round((correct||0)/total*100) : 0;
    const el_c  = document.getElementById('smb-correct');
    const el_w  = document.getElementById('smb-wrong');
    const el_p  = document.getElementById('smb-pct');
    const stats = document.getElementById('smb-stats');
    if (el_c) el_c.textContent = correct || 0;
    if (el_w) el_w.textContent = wrong   || 0;
    if (el_p) el_p.textContent = total > 0 ? pct + '%' : '—';
    if (stats) stats.style.display = 'block';
  }

  window.addEventListener('message', e => {
    if (!e.data?.__SMB_ACTION__) return;
    if (e.data.__SMB_ACTION__ === 'autosolve_stats') {
      updateStats(e.data.correct, e.data.wrong);
    }
    if (e.data.__SMB_ACTION__ === 'autosolve_done') {
      const correct = +(document.getElementById('smb-correct')?.textContent || 0);
      const wrong   = +(document.getElementById('smb-wrong')?.textContent   || 0);
      const total   = correct + wrong;
      const pct     = total > 0 ? Math.round(correct/total*100) : 100;
      setRunning(false);
      const label = document.getElementById('smb-status-label');
      const stats = document.getElementById('smb-stats');
      if (label) label.textContent = '✓ Done!';
      if (stats) {
        stats.style.display = 'block';
        stats.innerHTML = `<span style="color:#16a34a;font-weight:700">${correct} correct &nbsp;✗ ${wrong} wrong &nbsp;${pct}%</span>`;
      }
      panelOpen = true;
      document.getElementById('smb-panel').classList.add('open');
    }
  });

  // Also handle via runtime for any popup listeners
  try {
    chrome.runtime.onMessage.addListener(msg => {
      if (msg.action === 'autosolve_stats') updateStats(msg.correct, msg.wrong);
    });
  } catch(e) {}

})();
