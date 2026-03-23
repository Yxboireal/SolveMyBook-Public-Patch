chrome.storage.local.get("anthropicApiKey", function(r) {
  if (r.anthropicApiKey) {
    document.getElementById("apikey").value = r.anthropicApiKey;
  }
});

document.getElementById("saveBtn").addEventListener("click", function() {
  var key = document.getElementById("apikey").value.trim();
  var errEl = document.getElementById("error");
  var successEl = document.getElementById("success");
  var btn = document.getElementById("saveBtn");

  errEl.style.display = "none";
  successEl.style.display = "none";

  if (!key) {
    errEl.textContent = "Please enter your API key.";
    errEl.style.display = "block";
    return;
  }

  if (!key.startsWith("sk-ant-")) {
    errEl.textContent = "That doesn't look like an Anthropic key (should start with sk-ant-).";
    errEl.style.display = "block";
    return;
  }

  btn.textContent = "Saving...";
  btn.disabled = true;

  chrome.storage.local.set({
    anthropicApiKey: key,
    accessMessage: "success-offline",
    lastCheckedToken: Date.now()
  }, function() {
    if (chrome.runtime.lastError) {
      errEl.textContent = "Error saving: " + chrome.runtime.lastError.message;
      errEl.style.display = "block";
      btn.textContent = "Save & Activate";
      btn.disabled = false;
    } else {
      successEl.style.display = "block";
      btn.textContent = "Saved \u2713";
    }
  });
});
