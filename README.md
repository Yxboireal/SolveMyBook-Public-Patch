# SolveMyBook-Public-Patch

Patch for the discontinued SolveMyBook Chrome extension — replaces the broken backend with your own Anthropic API key so it works again without an account or subscription.

> This patch is released under the MIT License. The original SolveMyBook extension and its assets are property of solvemybook.com and are not covered by this license.
### ⚠️ Educational Use & Disclaimer

This project was created **strictly for educational purposes** to demonstrate how discontinued browser extensions can be patched to use modern AI APIs, and as a learning exercise in Chrome extension development, reverse engineering, and prompt engineering with LLMs.

**This tool is intended to be used as a study aid** to help you understand course material by showing you correct answers and explanations, not to replace learning.

**By using this extension you acknowledge that:**
- You are responsible for how you use this tool and any consequences that may arise
- Automating answers on graded assignments may violate your institution's academic integrity policy or McGraw-Hill's terms of service
- The authors of this patch take **no responsibility** for academic penalties, account bans, or any other consequences resulting from misuse
- AI-generated answers are not guaranteed to be correct always verify answers against your course material

**Use responsibly.** The goal is to understand the material, not skip it. Consider using the autosolve feature to check your own answers rather than replace them entirely.

> *This patch is an independent project and is not affiliated with, endorsed by, or connected to Anthropic, McGraw-Hill, or solvemybook.com in any way.*
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

### 7. Limitations
This patch works well for the most common SmartBook question types but has some limitations to be aware of:

**Supported question types:**
- Multiple choice (single answer)
- Select all that apply
- Fill in the blank (single and multiple blanks)

**Not supported:**
- Drag and drop / matching questions — the extension will get stuck and not advance
- Diagram-based questions — where you click on parts of an image or label a diagram
- Ordered sequence questions — where you drag items into the correct order
- Hotspot questions — where you click a specific region of an image

**Other limitations:**
- The extension only works on **McGraw-Hill SmartBook** pages (`learning.mheducation.com`). It will not work on other platforms.
- It requires an **active internet connection** to reach the Anthropic API — it is not truly offline, just account-free.
- AI answers are not guaranteed to be correct. Sonnet and Haiku are strong models but can still make mistakes, especially on highly specific or niche topics.
- If McGraw-Hill updates their website frontend, selectors may break and require a patch update.
- The extension must remain as an **unpacked extension** — it cannot be published to the Chrome Web Store.
