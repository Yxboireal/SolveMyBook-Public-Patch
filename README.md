# SolveMyBook-Public-Patch

Patch for the discontinued SolveMyBook Chrome extension — replaces the broken backend with your own Anthropic API key so it works again without an account or subscription.

> This patch is released under the MIT License. The original SolveMyBook extension and its assets are property of solvemybook.com and are not covered by this license.

---

## Installation

### 1. Get the original extension
Download `solve-my-book-1_4_0.zip` and unzip it. You should have a folder called `solve-my-book-1_4_0`.

### 2. Download this patch
Click **Code → Download ZIP** on this repo and unzip it.

### 3. Replace these files
Copy the following files from this repo into the `solve-my-book-1_4_0` folder, overwriting when prompted:
```
manifest.json
background.js
contentscript.js
m4d8/e3x9/autosolve.js           ← new file, create if missing
m4d8/e3x9/autosolve_btn.js       ← new file, create if missing
p8g3/s6t1/setup.html             ← new file, create if missing
p8g3/s6t1/setup.js               ← new file, create if missing
p8g3/p9k4/434e26c4.html
p8g3/p9k4/10602258.js
p8g3/p9k4/popup-offline.js       ← new file, create if missing
p8g3/p9k4/autosolve-settings.html ← new file, create if missing
p8g3/p9k4/autosolve-settings.js  ← new file, create if missing
```
### 4. Load in Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `solve-my-book-1_4_0` folder

### 5. Enter your API key
A setup page will open automatically. Paste your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) and click **Save & Activate**.

### 6. Use it
Navigate to any McGraw-Hill SmartBook assignment and click the teal 🎯 button in the bottom-right corner.
