// OFFLINE PATCH: Auth bypass for popup
async function p4k2() {
  await chrome.storage.local.set({ accessMessage: "success-offline", lastCheckedToken: Date.now() });
  return { data: "success" };
}

async function getAnnouncement() { /* offline - no announcements */ }

function convertTimeAgo(e, n = true) {
  let t;
  return t = 60 <= (t = n ? (new Date - new Date(e)) / 1e3 / 60 : new Date(e)) && t < 1440
    ? Math.floor(t / 60) + "h" : 1440 <= t && t < 43200
    ? Math.floor(t / 60 / 24) + "d" : 43200 <= t
    ? Math.floor(t / 60 / 24 / 30) + "mo" : Math.floor(t) + "min";
}

function e4x1(e = false) {
  // Always call z4m9 with "success" so the popup renders normally
  z4m9(null, "success");
}

e4x1();
