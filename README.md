# SolveMyBook-Public-Patch

Patch for the discontinued SolveMyBook Chrome extension — replaces the broken backend with your own Anthropic API key so it works again without an account or subscription.

> This patch is released under the MIT License. The original SolveMyBook extension and its assets are property of solvemybook.com and are not covered by this license.

---

## Installation

### 1. Get the original extension
Grab the original `solve-my-book.zip` and unzip it. You should have a folder called `solve-my-book`. or something similar depending on the version you have.

### 2. Download this patch
Click **Code → Download ZIP** on this repo and unzip it.

### 3. Replace these files
Copy the following files from this repo into the `solve-my-book` folder, overwriting when prompted:
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
4. Select the new modified `solve-my-book` folder

### 5. Enter your API key
### 5. Enter your API key

A setup page will open automatically when you first install the extension.

**Getting a free Anthropic API key:**
1. Go to [console.anthropic.com](https://console.anthropic.com) and create a free account
2. Click **API Keys** in the left sidebar
3. Click **Create Key**, give it a name, and copy it
4. Paste it into the setup page and click **Save & Activate**

**Do I need to pay?**
Anthropic gives you **$5 free credit** when you sign up — this is more than enough to complete hundreds of assignments. The extension uses two models:
- **Claude Haiku** for multiple choice — roughly **$0.001 per assignment** (fractions of a cent)
- **Claude Sonnet** for fill-in-the-blank — roughly **$0.02 per assignment**

A typical 12-question SmartBook assignment costs **less than $0.05 total**. Your $5 free credit will last a very long time before you need to add any payment method.

You can monitor your usage at [console.anthropic.com](https://console.anthropic.com) under **Usage**.

### 6. Use it
Navigate to any McGraw-Hill SmartBook assignment and click the teal 🎯 button in the bottom-right corner.
