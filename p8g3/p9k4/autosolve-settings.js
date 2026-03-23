// AutoSolve Settings JS - Modified by Ahmed Abdullah

const DEFAULT = {
  confidenceLevel: ['high'],
  gradeRange: { min: 80, max: 100 },
  autosolveAdvanceDelay: { min: 1000, max: 3000 },
  autosolveSubmitDelay:  { min: 1000, max: 3000 }
};

// ---- Load saved settings ----
chrome.storage.local.get(
  ['autosolveConfidenceLevel','autosolveGradeRange','autosolveAdvanceDelay','autosolveSubmitDelay'],
  (r) => {
    // Confidence pills
    const conf = r.autosolveConfidenceLevel || DEFAULT.confidenceLevel;
    document.querySelectorAll('.conf-pill').forEach(pill => {
      if (conf.includes(pill.dataset.level)) pill.classList.add('active');
    });

    // Grade range
    const grade = r.autosolveGradeRange || DEFAULT.gradeRange;
    setRange('gradeMin', 'gradeMinVal', grade.min, '%');
    setRange('gradeMax', 'gradeMaxVal', grade.max, '%');
    updateGradePreview();

    // Answer delay (submit)
    const submit = r.autosolveSubmitDelay || DEFAULT.autosolveSubmitDelay;
    setRange('answerMin', 'answerMinVal', submit.min / 1000, 's');
    setRange('answerMax', 'answerMaxVal', submit.max / 1000, 's');

    // Advance delay
    const advance = r.autosolveAdvanceDelay || DEFAULT.autosolveAdvanceDelay;
    setRange('advanceMin', 'advanceMinVal', advance.min / 1000, 's');
    setRange('advanceMax', 'advanceMaxVal', advance.max / 1000, 's');
  }
);

// ---- Helper ----
function setRange(sliderId, valId, value, unit) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(valId);
  if (slider && display) {
    slider.value = value;
    display.textContent = value + unit;
  }
}

function updateGradePreview() {
  const min = document.getElementById('gradeMin').value;
  const max = document.getElementById('gradeMax').value;
  document.getElementById('gradePreview').textContent =
    `Targets ${min}–${max}% correct answers`;
}

// ---- Confidence pills toggle ----
document.querySelectorAll('.conf-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    pill.classList.toggle('active');
    // Ensure at least one is always selected
    const active = document.querySelectorAll('.conf-pill.active');
    if (active.length === 0) pill.classList.add('active');
  });
});

// ---- Range slider live updates ----
function bindRange(sliderId, valId, unit, onUpdate) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(valId);
  slider.addEventListener('input', () => {
    display.textContent = slider.value + unit;
    if (onUpdate) onUpdate();
    // Enforce min <= max pairs
    enforceMinMax();
  });
}

bindRange('gradeMin', 'gradeMinVal', '%', updateGradePreview);
bindRange('gradeMax', 'gradeMaxVal', '%', updateGradePreview);
bindRange('answerMin', 'answerMinVal', 's');
bindRange('answerMax', 'answerMaxVal', 's');
bindRange('advanceMin', 'advanceMinVal', 's');
bindRange('advanceMax', 'advanceMaxVal', 's');

function enforceMinMax() {
  // Grade
  let gMin = parseFloat(document.getElementById('gradeMin').value);
  let gMax = parseFloat(document.getElementById('gradeMax').value);
  if (gMin > gMax) {
    document.getElementById('gradeMax').value = gMin;
    document.getElementById('gradeMaxVal').textContent = gMin + '%';
    updateGradePreview();
  }
  // Answer
  let aMin = parseFloat(document.getElementById('answerMin').value);
  let aMax = parseFloat(document.getElementById('answerMax').value);
  if (aMin > aMax) {
    document.getElementById('answerMax').value = aMin;
    document.getElementById('answerMaxVal').textContent = aMin + 's';
  }
  // Advance
  let dMin = parseFloat(document.getElementById('advanceMin').value);
  let dMax = parseFloat(document.getElementById('advanceMax').value);
  if (dMin > dMax) {
    document.getElementById('advanceMax').value = dMin;
    document.getElementById('advanceMaxVal').textContent = dMin + 's';
  }
}

// ---- Save ----
document.getElementById('saveBtn').addEventListener('click', () => {
  const activePills = [...document.querySelectorAll('.conf-pill.active')].map(p => p.dataset.level);

  const settings = {
    autosolveConfidenceLevel: activePills,
    autosolveGradeRange: {
      min: parseInt(document.getElementById('gradeMin').value),
      max: parseInt(document.getElementById('gradeMax').value)
    },
    autosolveSubmitDelay: {
      min: Math.round(parseFloat(document.getElementById('answerMin').value) * 1000),
      max: Math.round(parseFloat(document.getElementById('answerMax').value) * 1000)
    },
    autosolveAdvanceDelay: {
      min: Math.round(parseFloat(document.getElementById('advanceMin').value) * 1000),
      max: Math.round(parseFloat(document.getElementById('advanceMax').value) * 1000)
    }
  };

  chrome.storage.local.set(settings, () => {
    const badge = document.getElementById('savedBadge');
    badge.style.display = 'block';
    setTimeout(() => badge.style.display = 'none', 2000);
  });
});

// ---- Back button ----
document.getElementById('returnHome').addEventListener('click', () => {
  window.location.href = chrome.runtime.getURL('p8g3/p9k4/5664f73a.html');
});
