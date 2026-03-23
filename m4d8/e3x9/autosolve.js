// ============================================================
// SolveMyBook Offline - Autosolve Engine
// Modified by Ahmed Abdullah
// Supports: Multiple Choice (single + select-all), Fill-in-the-Blank
// ============================================================

(async function initAutosolve() {
  if (!window.location.href.includes('mheducation.com')) return;

  const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL_FAST   = 'claude-haiku-4-5-20251001';  // for simple MC
  const MODEL_SMART  = 'claude-sonnet-4-5';           // for FITB, select-all, retries

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randomDelay(minMs, maxMs) { return sleep(randomBetween(minMs, maxMs)); }

  async function getApiKey() {
    return new Promise(r => chrome.storage.local.get('anthropicApiKey', s => r(s.anthropicApiKey || null)));
  }

  async function getSettings() {
    return new Promise(r => {
      chrome.storage.local.get([
        'autosolveConfidenceLevel','autosolveGradeRange',
        'autosolveAdvanceDelay','autosolveSubmitDelay'
      ], s => r({
        confidenceLevels: s.autosolveConfidenceLevel || ['high'],
        gradeRange:       s.autosolveGradeRange       || { min: 100, max: 100 },
        submitDelay:      s.autosolveSubmitDelay       || { min: 1000, max: 3000 },
        advanceDelay:     s.autosolveAdvanceDelay      || { min: 1000, max: 3000 }
      }));
    });
  }

  function pickConfidence(levels) {
    return levels[Math.floor(Math.random() * levels.length)];
  }

  // Grade range: only intentionally wrong if we're already ABOVE max
  // Fix: at 100% we should NEVER get wrong answers
  function shouldAnswerCorrectly(gradeRange, stats) {
    if (gradeRange.min >= 100) return true; // 100% = always correct
    const total = stats.correct + stats.incorrect;
    if (total === 0) return true;
    const rate = stats.correct / total;
    const min = gradeRange.min / 100;
    const max = gradeRange.max / 100;
    if (rate < min) return true;
    if (rate > max) return false;
    // Randomly decide, weighted toward staying within range
    return Math.random() < (min + max) / 2;
  }

  // ---- Find advance / complete button ----
  function getAdvanceButton(confidenceLevel) {
    const allBtns = [...document.querySelectorAll('button')];

    // "Complete Assignment" button — highest priority when visible
    const completeBtn = allBtns.find(b => {
      const t = b.innerText.trim().toLowerCase();
      return (t.includes('complete assignment') || t.includes('complete')) && !b.disabled;
    });
    if (completeBtn) return { btn: completeBtn, type: 'complete' };

    // "Next Question" button
    const nextBtn = allBtns.find(b => {
      const t = b.innerText.trim().toLowerCase();
      return (t === 'next question' || t === 'next' || t === 'continue') && !b.disabled;
    });
    if (nextBtn) return { btn: nextBtn, type: 'next' };

    // Confidence button
    const confBtn = document.querySelector(
      `[data-automation-id="confidence-buttons--${confidenceLevel}_confidence"]:not([disabled])`
    ) || document.querySelector('.btn-confidence:not([disabled])');
    if (confBtn) return { btn: confBtn, type: 'confidence' };

    return null;
  }

  async function waitForAdvanceButton(confidenceLevel, maxMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const result = getAdvanceButton(confidenceLevel);
      if (result) return result;
      await sleep(200);
    }
    return null;
  }

  // ---- Check if assignment is complete ----
  function isAssignmentComplete() {
    // Progress bar shows all complete
    const progress = document.querySelector('[class*="progress"], .progress-bar');
    const progressText = document.querySelector('[class*="concept"]')?.innerText || '';
    if (progressText.match(/(\d+) of \1/)) return true; // "12 of 12"

    // Complete Assignment button visible
    const completeBtn = [...document.querySelectorAll('button')].find(b =>
      b.innerText.trim().toLowerCase().includes('complete assignment') && !b.disabled
    );
    if (completeBtn) return true;

    return false;
  }

  // ---- Question reader ----
  function getCurrentQuestion() {
    const items = [...document.querySelectorAll('aa-air-item')];
    if (!items.length) return null;

    const visible = items.find(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= -200 && rect.top < window.innerHeight && rect.width > 0;
    }) || items[0];

    if (!visible) return null;

    const questionEl = visible.querySelector('.dlc_question');
    if (!questionEl) return null;

    const cls = visible.className || '';
    const isFillBlank = cls.includes('fill_in_the_blank') || cls.includes('fill_in') || !!visible.querySelector('.fitb-input');

    // Detect "select all that apply" vs single-select
    // Checkbox inputs = select-all, radio inputs = single select
    const checkboxInputs = [...visible.querySelectorAll('input[type="checkbox"]')];
    const radioInputs    = [...visible.querySelectorAll('input[type="radio"]')];
    const isSelectAll    = checkboxInputs.length > 0 && radioInputs.length === 0;
    const isMC           = (cls.includes('multiple_choice') || !!visible.querySelector('.choice-row')) && !isFillBlank;

    // All fitb inputs
    const fitbInputs = [...visible.querySelectorAll('.fitb-input, input[type="text"].fitb-input')];

    // Build question text
    let questionForAI = '';
    if (isFillBlank && fitbInputs.length > 0) {
      const clone = visible.cloneNode(true);
      clone.querySelectorAll('.lr-tray, [class*="tray"], [class*="feedback"], [class*="resource"]').forEach(el => el.remove());
      let blankIdx = 0;
      clone.querySelectorAll('input[type="text"], .fitb-input').forEach(inp => {
        const span = document.createElement('span');
        span.textContent = ' [BLANK_' + (blankIdx + 1) + '] ';
        inp.parentNode.replaceChild(span, inp);
        blankIdx++;
      });
      const qArea = clone.querySelector('.dlc_question') || clone;
      questionForAI = qArea.innerText
        .replace(/Fill in the blank question\.?/gi, '')
        .replace(/\nBlank\n/g, ' [BLANK] ')
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    } else {
      questionForAI = questionEl.innerText
        .replace(/\nBlank\n/g, ' [BLANK] ')
        .replace(/\n+/g, ' ')
        .trim();
    }

    // MC choices
    const choiceEls = [...visible.querySelectorAll('.choice-row')];
    const choices = choiceEls.map((row, idx) => {
      const input = row.querySelector('input[type="checkbox"], input[type="radio"], .form-check-input');
      return {
        idx,
        text:      row.querySelector('.choiceText')?.innerText?.trim() || '',
        input,
        isCheckbox: input?.type === 'checkbox',
        clickable: row.querySelector('._clickable') || row,
        letter:    String.fromCharCode(65 + idx)
      };
    }).filter(c => c.text);

    // Already answered?
    const alreadyAnswered = isFillBlank
      ? fitbInputs.length > 0 && fitbInputs.every(inp => inp.value.trim().length > 0)
      : choices.some(c => c.input?.checked);

    const resultShown = !!document.querySelector('.correct-answer, [class*="correct-answer"], .your-answer');

    return {
      el: visible,
      questionForAI,
      isFillBlank,
      isMC,
      isSelectAll,
      choices,
      fitbInputs,
      alreadyAnswered,
      resultShown
    };
  }

  // ---- Ask Claude — single-select MC ----
  async function askClaudeMC(question, choices) {
    const key = await getApiKey();
    if (!key) throw new Error('NO_API_KEY');
    const list = choices.map(c => `${c.letter}. ${c.text}`).join('\n');
    const prompt = `You are answering a McGraw-Hill SmartBook multiple choice question. Reply with ONLY the single letter of the correct answer (A, B, C, or D). Do not explain. Do not add punctuation. Just the letter.

Question: ${question}

${list}`;
    const resp = await fetch(ANTHROPIC_API_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:MODEL_FAST, max_tokens:10, messages:[{role:'user',content:prompt}] })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    return (await resp.json()).content?.[0]?.text?.trim() || '';
  }

  // ---- Ask Claude — select ALL that apply ----
  async function askClaudeSelectAll(question, choices) {
    const key = await getApiKey();
    if (!key) throw new Error('NO_API_KEY');
    const list = choices.map(c => `${c.letter}. ${c.text}`).join('\n');
    const prompt = `You are answering a McGraw-Hill SmartBook "select ALL that apply" question. There may be one or more correct answers. Reply with ONLY the letters of every correct answer, separated by commas (example: A,C or B,C,D). No explanation, no punctuation other than commas.

Question: ${question}

${list}`;
    const resp = await fetch(ANTHROPIC_API_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:MODEL_SMART, max_tokens:20, messages:[{role:'user',content:prompt}] })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const text = (await resp.json()).content?.[0]?.text?.trim() || '';
    // Parse letters: "A,C,D" or "A, C, D" or "A C D"
    return text.toUpperCase().match(/[A-Z]/g) || [];
  }

  // ---- Ask Claude — FITB ----
  async function askClaudeFITB(question, blankCount) {
    const key = await getApiKey();
    if (!key) throw new Error('NO_API_KEY');
    let prompt;
    if (blankCount === 1) {
      prompt = `You are answering a McGraw-Hill SmartBook fill-in-the-blank question. Reply with ONLY the exact word or short phrase that fills the blank. Use precise medical/scientific terminology if applicable. No punctuation, no explanation, no full sentences.

Question: ${question}`;
    } else {
      prompt = `McGraw-Hill SmartBook fill-in-the-blank with ${blankCount} blanks (marked [BLANK_1], [BLANK_2], etc).
Reply with ONLY the answers in order, one per line:
1: answer
2: answer

Question: ${question}

Answers:`;
    }
    const resp = await fetch(ANTHROPIC_API_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:MODEL_SMART, max_tokens:60, messages:[{role:'user',content:prompt}] })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const text = (await resp.json()).content?.[0]?.text?.trim() || '';
    if (blankCount === 1) return [text];
    const answers = [];
    for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
      const m = line.match(/^\d+[:.]\s*(.+)$/);
      if (m) answers.push(m[1].trim());
    }
    if (answers.length < blankCount) {
      return text.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).slice(0, blankCount);
    }
    return answers.slice(0, blankCount);
  }

  // ---- Type into input (Angular-compatible) ----
  function typeIntoInput(input, text) {
    input.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(input, text); else input.value = text;
    input.dispatchEvent(new Event('input',  { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles:true, key:'a' }));
    input.dispatchEvent(new KeyboardEvent('keyup',   { bubbles:true, key:'a' }));
    input.blur();
  }

  function clickChoice(choice) {
    choice.clickable.click();
    if (choice.input && !choice.input.checked) {
      choice.input.click();
      choice.input.dispatchEvent(new Event('change', { bubbles:true }));
    }
  }

  function pickWrongChoice(choices, correctLetters) {
    const wrong = choices.filter(c => !correctLetters.includes(c.letter));
    return wrong.length ? [wrong[Math.floor(Math.random() * wrong.length)]] : [];
  }

  // ---- Broadcast ----
  function broadcastStats(stats) {
    // postMessage reaches other content scripts on the same page
    window.postMessage({ __SMB_ACTION__: 'autosolve_stats', correct: stats.correct, wrong: stats.incorrect }, '*');
    // also try runtime for popup if open
    try { chrome.runtime.sendMessage({ action:'autosolve_stats', correct:stats.correct, wrong:stats.incorrect }); } catch(e){}
  }
  function broadcastDone() {
    window.postMessage({ __SMB_ACTION__: 'autosolve_done' }, '*');
    try { chrome.runtime.sendMessage({ action:'autosolve_done' }); } catch(e){}
  }

  // No overlay — panel handles status
  function showStatus(msg, color, stats) {}
  function hideStatus() {}

  // ---- Main loop ----
  let isRunning = false;
  let stopRequested = false;

  async function autosolveLoop() {
    isRunning = true;
    stopRequested = false;
    const stats = { correct:0, incorrect:0, get total(){ return this.correct+this.incorrect; } };

    await sleep(1000);

    while (!stopRequested) {
      try {
        const settings = await getSettings();
        const confLevel = pickConfidence(settings.confidenceLevels);

        // Check for Complete Assignment button first
        const completeBtn = [...document.querySelectorAll('button')].find(b =>
          b.innerText.trim().toLowerCase().includes('complete assignment') && !b.disabled
        );
        if (completeBtn) {
          await randomDelay(settings.advanceDelay.min, settings.advanceDelay.max);
          completeBtn.click();
          await sleep(2000);
          // Signal done
          broadcastDone();
          broadcastStats(stats);
          isRunning = false;
          return;
        }

        const q = getCurrentQuestion();

        if (!q) {
          // No question found — check one more time for complete button
          await sleep(1500);
          const cb = [...document.querySelectorAll('button')].find(b =>
            b.innerText.trim().toLowerCase().includes('complete assignment') && !b.disabled
          );
          if (cb) { cb.click(); await sleep(1000); broadcastDone(); broadcastStats(stats); isRunning = false; return; }
          broadcastDone(); broadcastStats(stats);
          break;
        }

        // Result showing or already answered → advance
        if (q.resultShown || (q.alreadyAnswered && getAdvanceButton(confLevel))) {
          await randomDelay(settings.advanceDelay.min, settings.advanceDelay.max);
          const adv = getAdvanceButton(confLevel);
          if (adv) {
            if (adv.type === 'complete') {
              adv.btn.click();
              await sleep(1000);
              broadcastDone(); broadcastStats(stats);
              isRunning = false; return;
            }
            adv.btn.click();
            await randomDelay(800, 1600);
          } else await sleep(1500);
          continue;
        }

        if (q.alreadyAnswered) { await sleep(1500); continue; }

        // =========== FILL IN THE BLANK ===========
        if (q.isFillBlank && q.fitbInputs.length > 0) {
          const count = q.fitbInputs.length;
          const answers = await askClaudeFITB(q.questionForAI, count);
          const goCorrect = shouldAnswerCorrectly(settings.gradeRange, stats);

          if (goCorrect) {
            stats.correct++; broadcastStats(stats);
            await randomDelay(settings.submitDelay.min, settings.submitDelay.max);
            for (let i = 0; i < q.fitbInputs.length; i++) {
              typeIntoInput(q.fitbInputs[i], answers[i] || answers[0] || 'unknown');
              if (i < q.fitbInputs.length - 1) await sleep(300);
            }
          } else {
            stats.incorrect++; broadcastStats(stats);
            await randomDelay(settings.submitDelay.min, settings.submitDelay.max);
            q.fitbInputs.forEach(inp => typeIntoInput(inp, 'unknown'));
          }

          const adv = await waitForAdvanceButton(confLevel, 8000);
          if (adv) {
            await randomDelay(settings.advanceDelay.min, settings.advanceDelay.max);
            if (adv.type === 'complete') { adv.btn.click(); await sleep(1000); broadcastDone(); broadcastStats(stats); isRunning=false; return; }
            adv.btn.click(); await randomDelay(800, 1600);
          } else await sleep(2500);

        // =========== SELECT ALL THAT APPLY ===========
        } else if (q.isSelectAll && q.choices.length > 0) {
          const correctLetters = await askClaudeSelectAll(q.questionForAI, q.choices);
          const goCorrect = shouldAnswerCorrectly(settings.gradeRange, stats);

          let toClick;
          if (goCorrect) {
            stats.correct++; broadcastStats(stats);
            toClick = q.choices.filter(c => correctLetters.includes(c.letter));
            if (!toClick.length) toClick = [q.choices[0]]; // fallback
          } else {
            stats.incorrect++; broadcastStats(stats);
            toClick = pickWrongChoice(q.choices, correctLetters);
            if (!toClick.length) toClick = [q.choices[0]];
          }

          await randomDelay(settings.submitDelay.min, settings.submitDelay.max);
          for (const choice of toClick) {
            clickChoice(choice);
            await sleep(200);
          }

          const adv = await waitForAdvanceButton(confLevel, 8000);
          if (adv) {
            await randomDelay(settings.advanceDelay.min, settings.advanceDelay.max);
            if (adv.type === 'complete') { adv.btn.click(); await sleep(1000); broadcastDone(); broadcastStats(stats); isRunning=false; return; }
            adv.btn.click(); await randomDelay(800, 1600);
          } else await sleep(2500);

        // =========== SINGLE SELECT MC ===========
        } else if (q.isMC && q.choices.length > 0) {
          const answer     = await askClaudeMC(q.questionForAI, q.choices);
          const corrLetter  = answer.replace(/[^A-Za-z]/g,'').toUpperCase().charAt(0);
          const corrChoice  = q.choices.find(c => c.letter === corrLetter);
          const goCorrect   = shouldAnswerCorrectly(settings.gradeRange, stats);

          let chosen;
          if (goCorrect) {
            stats.correct++; broadcastStats(stats);
            chosen = corrChoice || q.choices[0];
          } else {
            stats.incorrect++; broadcastStats(stats);
            const wrong = q.choices.filter(c => c.letter !== corrLetter);
            chosen = wrong.length ? wrong[Math.floor(Math.random()*wrong.length)] : (corrChoice || q.choices[0]);
          }

          await randomDelay(settings.submitDelay.min, settings.submitDelay.max);
          clickChoice(chosen);

          const adv = await waitForAdvanceButton(confLevel, 6000);
          if (adv) {
            await randomDelay(settings.advanceDelay.min, settings.advanceDelay.max);
            if (adv.type === 'complete') { adv.btn.click(); await sleep(1000); broadcastDone(); broadcastStats(stats); isRunning=false; return; }
            adv.btn.click(); await randomDelay(800, 1600);
          } else await sleep(2500);

        // =========== UNKNOWN ===========
        } else {
          await sleep(2000);
          const adv = getAdvanceButton(confLevel);
          if (adv) {
            if (adv.type === 'complete') { adv.btn.click(); await sleep(1000); broadcastDone(); broadcastStats(stats); isRunning=false; return; }
            adv.btn.click(); await sleep(1200);
          }
        }

      } catch(err) {
        if (err.message === 'NO_API_KEY') { broadcastDone(); break; }
        await sleep(3000);
      }
    }

    isRunning = false;
    broadcastDone();
    broadcastStats(stats);
    try { chrome.runtime.sendMessage({ action:'autoSolve', isActive:false, url:location.href }); } catch(e){}
  }

  window.smbAutosolve = {
    start:     autosolveLoop,
    stop:      () => { stopRequested = true; },
    isRunning: () => isRunning
  };

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === 'f3p9' || msg.action === 'START_SMB_AUTOSOLVE') { if (!isRunning) autosolveLoop(); }
    if (msg.action === 'g8t4' || msg.action === 'STOP_SMB_AUTOSOLVE')  { stopRequested = true; }
  });

  console.log('[SolveMyBook Offline] AutoSolve ready — MC + Select-All + FITB');
})();
