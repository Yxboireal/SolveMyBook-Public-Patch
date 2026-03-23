// ============================================================
// SolveMyBook Offline - Modified by Ahmed Abdullah
// Routes all AI calls to the Anthropic API using your own key.
// ============================================================

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL   = "claude-haiku-4-5-20251001";

// Safe sendMessage that swallows "receiving end does not exist" errors
function safeSendMessage(msg, callback) {
  try {
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) { /* swallow - sidepanel not open */ }
      if (callback) callback(resp);
    });
  } catch(e) { /* swallow */ }
}

function safeTabMessage(tabId, msg, callback) {
  try {
    chrome.tabs.sendMessage(tabId, msg, (resp) => {
      if (chrome.runtime.lastError) { /* tab not ready or no content script */ }
      if (callback) callback(resp);
    });
  } catch(e) { /* swallow */ }
}

// ---- Auth bypass - always offline ----
async function u2q1() { return "offline-mode"; }

async function p4k2() {
  await chrome.storage.local.set({ accessMessage: "success-offline", lastCheckedToken: Date.now() });
  return "success-offline";
}

// ---- Anthropic API ----
async function getAnthropicKey() {
  const r = await chrome.storage.local.get("anthropicApiKey");
  return r.anthropicApiKey || null;
}

function payloadToQuestion(payload) {
  let parts = [];
  if (payload.question) parts.push(payload.question);
  if (payload.context)  parts.push("Context: " + payload.context);
  return parts.join("\n\n") || "Please help me with this question.";
}

async function solveWithAnthropic(payload, mode) {
  const key = await getAnthropicKey();
  if (!key) return { success: false, error: "NO_API_KEY", status: 0 };

  const question = payloadToQuestion(payload);
  let systemPrompt = "You are a helpful AI homework assistant. Provide clear, step-by-step solutions and explanations.";
  if (mode === "explain") systemPrompt = "You are a helpful AI tutor. Explain concepts clearly with examples.";

  try {
    const resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: question }]
      })
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      return { success: false, error: errBody.error?.message || "API error", status: resp.status };
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const evt = JSON.parse(data);
          if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            fullText += evt.delta.text;
          }
        } catch (_) {}
      }
    }

    return {
      success: true,
      data: {
        answer: fullText,
        steps: [{ content: fullText }],
        explanation: fullText,
        question: payload.question || "",
        confidence: "high"
      },
      status: 200
    };
  } catch (e) {
    return { success: false, error: e.message, status: 0 };
  }
}

// ---- Non-AI helpers ----
function g4n7(t) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, e => {
    if (chrome.runtime.lastError) return;
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) safeTabMessage(tabs[0].id, { action: "process_screenshot", imageDataUrl: e, options: t });
    });
  });
}

async function t8c3(e) {
  try {
    const { isActive: t, url: r } = e;
    const tabs = await chrome.tabs.query({ url: r });
    if (tabs.length > 0) safeTabMessage(tabs[0].id, { action: t ? "f3p9" : "g8t4", timestamp: Date.now() });
  } catch (e) {}
}

// ---- Message listeners ----
chrome.runtime.onMessage.addListener((t, r, respond) => {
  // Silently ignore lastError from u2q1 cookie read
  u2q1().catch(() => {});

  if (t.action === "ping") return respond({ success: true, pong: true }), true;

  if (t.action === "openChromeExtensions") {
    chrome.tabs.create({ url: "chrome://extensions" }, () => {
      if (chrome.runtime.lastError) return respond({ success: false });
      respond({ success: true });
    });
    return true;
  }

  // AI actions
  if (t.action === "a7e4") {
    solveWithAnthropic(t.api_data, t.api_data?.mode || "solve").then(e => respond(e)).catch(e => respond({ error: e.message }));
    return true;
  }
  if (t.action === "vision_api") {
    solveWithAnthropic(t.api_data, "screenshot").then(e => respond(e)).catch(e => respond({ error: e.message }));
    return true;
  }
  if (t.action === "explain_api") {
    solveWithAnthropic(t.api_data, "explain").then(e => respond(e)).catch(e => respond({ error: e.message }));
    return true;
  }

  if (t.action === "sources_api")          { respond({ success: true, data: { sources: [] }, status: 200 }); return true; }
  if (t.action === "skip-trial-continue")  { respond({ success: true, status: 200 }); return true; }
  if (t.action === "y4d8")                 { respond({ success: false, error: "Offline mode", status: 0 }); return true; }
  if (t.action === "k1p9")                 { respond({ success: true, config: { integrations: [] } }); return true; }

  if (t.action === "invalidateConfigCache") {
    chrome.storage.local.remove(["cachedIntegrationConfig", "lastCheckedIntegrationConfig"])
      .then(() => respond({ success: true })).catch(() => respond({ success: false }));
    return true;
  }

  if (t.action === "executeIntegration") {
    chrome.scripting.executeScript({
      target: { tabId: r.tab.id }, world: "MAIN", args: [chrome.runtime.id],
      func: e => (window.z5p1 = e, window.x7k3 ? { alreadyInstalled: true } : { alreadyInstalled: false })
    }).then(e => e[0]?.result?.alreadyInstalled
      ? Promise.resolve([{ result: { skipped: true } }])
      : chrome.scripting.executeScript({ target: { tabId: r.tab.id }, world: "MAIN", files: ["m4d8/e3x9/72f45396.js"] })
    ).then(e => chrome.scripting.executeScript({
      target: { tabId: r.tab.id }, world: "MAIN",
      args: [t.code, t.className, t.instanceName],
      func: (e, t, r) => {
        try {
          const n = document.createElement("script");
          n.textContent = e;
          (document.head || document.documentElement).appendChild(n);
          n.remove();
          if (window.__EXPORTS__?.[t]) {
            r ? window[r] = new window.__EXPORTS__[t] : new window.__EXPORTS__[t];
            return { success: true };
          }
          return { success: false, error: `Class ${t} not found` };
        } catch (e) { return { success: false, error: e.message }; }
      }
    })).then(e => respond(e?.[0]?.result ?? { success: false }))
      .catch(e => respond({ success: false, error: e.message }));
    return true;
  }

  if (t.action === "f9d3") {
    chrome.scripting.executeScript({
      target: { tabId: r.tab.id }, world: "MAIN",
      args: [t.instanceName, t.methodName, t.args],
      func: async (e, t, r) => {
        const o = window[e];
        if (!o) throw new Error(`Instance ${e} not found`);
        if (typeof o[t] !== "function") throw new Error(`Method ${e}.${t} not found`);
        const n = o[t](...r);
        return n?.then ? await n : n;
      }
    }).then(e => respond({ success: true, result: e?.[0]?.result ?? null }))
      .catch(e => respond({ success: false, error: e.message }));
    return true;
  }

  if (t.action === "getFinalUrl") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      respond({ url: tabs?.[0]?.url || "" });
    });
    return true;
  }

  if (t.action === "sidepanel_trigger_screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
      try {
        const url = tabs[0].url;
        if (url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("https://chromewebstore.google.com/")) {
          safeSendMessage({ action: "screenshot_context_invalid", reason: "chrome_page" }); return;
        }
        await new Promise((res, rej) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "ping" }, r => {
            chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(r);
          });
        });
        safeTabMessage(tabs[0].id, { action: "cleanup_screenshot" });
        safeTabMessage(tabs[0].id, { action: "capture_screenshot" });
      } catch (e) {
        safeSendMessage({ action: "screenshot_context_invalid", reason: "needs_refresh" });
      }
    });
    return true;
  }

  if (t.action === "g4n7") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, e => {
      if (chrome.runtime.lastError) return respond({ success: false });
      respond({ success: true, imageDataUrl: e });
    });
    return true;
  }

  if (t.action === "capture_screenshot") { g4n7(t.options); return; }

  if (t.action === "getAIChatShortcut") {
    chrome.commands.getAll(e => { const c = e.find(e => e.name === "ct_keyboard_ai_chat"); respond({ shortcut: c?.shortcut || null }); });
    return true;
  }
  if (t.action === "getScreenshotShortcut") {
    chrome.commands.getAll(e => { const c = e.find(e => e.name === "ct_keyboard_take_screenshot"); respond({ shortcut: c?.shortcut || null }); });
    return true;
  }

  if (t.action === "openSidePanel") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.sidePanel.open({ tabId: tabs[0].id });
      safeSendMessage({ action: "sidepanel_triggered" });
    });
    return;
  }

  if (t.action === "closeCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs?.length) chrome.tabs.remove(tabs[0].id);
    });
    return;
  }

  if (t.action === "openMicPermissionPage") {
    chrome.tabs.create({ url: "p8g3/s6t1/2882f7fa.html" });
    return;
  }
});

chrome.contextMenus.onClicked.addListener((e, t) => {
  if ("sendToAPI" === e.menuItemId) safeTabMessage(t.id, { action: "sendToAPI" });
  else if ("sendToAPIScreenshot" === e.menuItemId) safeTabMessage(t.id, { action: "capture_screenshot" });
});

chrome.runtime.onInstalled.addListener(e => {
  // Recreate context menus (remove first to avoid duplicate errors)
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "sendToAPI", title: "SolveMyBook", contexts: ["selection"], documentUrlPatterns: ["*://*.mheducation.com/*"] });
    chrome.contextMenus.create({ id: "sendToAPIScreenshot", title: "Screenshot", documentUrlPatterns: ["*://*.mheducation.com/*"] });
  });

  const mhPattern = /^https?:\/\/([a-z0-9-]+\.)*mheducation\.com\/.*$/i;
  chrome.tabs.query({}, tabs => {
    tabs.forEach(t => { if (t.url && mhPattern.test(t.url)) chrome.tabs.reload(t.id); });
  });

  if (e.reason === "install") {
    chrome.storage.local.set({
      activated: true, autoSelect: true, tracking: false,
      textSelection: true, button: true, quickTab: true,
      showAutosolve: true, welcomeContentShown: false,
      textSelectionDisabledDomains: ["docs.google.com", "calendar.google.com", "canva.com"],
      autosolveAdvanceDelay: { min: 1, max: 3 },
      autosolveSubmitDelay: { min: 1, max: 3 },
      autosolveGradeRange: { min: 100, max: 100 },
      autosolveConfidenceLevel: ["high"]
    });
    const lang = chrome.i18n.getUILanguage().split("-")[0];
    chrome.storage.local.set({ selectedLanguage: ["en","es","de","fr","it","nl","pt","ru","hi","ar","sv"].includes(lang) ? lang : "en" });
    chrome.tabs.create({ url: "p8g3/s6t1/setup.html" });
  } else if (e.reason === "update") {
    chrome.storage.local.get("quickTab", r => { if (r.quickTab === undefined) chrome.storage.local.set({ quickTab: true }); });
    chrome.storage.local.get("button", r => { if (r.button === undefined) chrome.storage.local.set({ button: true }); });
  }
});

chrome.commands.onCommand.addListener(e => {
  if ("ct_keyboard_take_screenshot" === e) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) safeTabMessage(tabs[0].id, { action: "capture_screenshot" });
    });
  } else if ("ct_keyboard_ai_chat" === e) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.sidePanel.open({ tabId: tabs[0].id });
      chrome.storage.local.set({ sidePanelData: { state: "empty" } });
    });
  }
});

chrome.runtime.onMessage.addListener((e) => {
  if ("open_new_tab" === e.action) chrome.tabs.create({ url: e.url });
  else if ("autoSolve" === e.action) t8c3(e);
});
