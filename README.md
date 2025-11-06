# Telegram Vocabulary Saver

Telegram Vocabulary Saver is a Chrome extension that lets you capture new words as you browse, add a quick definition, and send the entry to a Telegram group or channel through your bot. Highlight any word on a page, jot down the meaning, and the extension pushes the formatted message straight to Telegram so you can keep a running vocabulary log.

https://github.com/user-attachments/assets/ce36b4ff-ff84-4dc0-8e5f-aded7ea80459

## For End Users

### Features

- **One-click capture** &mdash; Highlight a word and submit its meaning from an inline popup injected into any webpage by the content script. The popup is styled via `styles/popup.css` so it stays usable on bright or dark backgrounds.
- **Secure credential storage** &mdash; The extension stores the Telegram bot token and chat ID in Chrome Sync storage, making them available across devices while keeping them outside of your source files.
- **Telegram Markdown formatting** &mdash; Messages are escaped and wrapped with MarkdownV2 spoiler syntax before being sent to the Telegram Bot API to avoid formatting issues and keep the definition hidden until tapped.
- **Guided onboarding** &mdash; If credentials are missing on install or when you try to save a word, the background service worker opens `setup.html` so you can paste in your bot token and chat ID.

### Requirements

- A Telegram bot token obtained from [@BotFather](https://core.telegram.org/bots/features#botfather).
- The numeric ID of the destination chat (for groups, ensure the bot is added and promote it if necessary). You can quickly
  retrieve the ID by inviting [@GetIDsBot](https://t.me/getidsbot) to the chat, sending `/start`, and copying the `chat id`
  value it returns.
- Google Chrome 88+ (Manifest V3 support) or a Chromium-based browser with developer mode.

### Install the extension

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome and toggle **Developer mode** (top right).
3. Choose **Load unpacked** and select the `vocab-to-tele-extension` directory.
4. When prompted, the extension opens the setup page. Paste your bot token and chat ID, then click **Save**.

### Use it

1. Browse to any page and highlight a word or phrase.
2. Release the mouse to reveal the inline popup.
3. Type a short definition or translation and press **Enter** or click **Save**.
4. The entry is sent to your configured Telegram chat. The definition is wrapped in spoiler tags so it stays hidden until you tap it in the chat.

To adjust your credentials later, open the extension's details card on `chrome://extensions` and click **Extension options** to launch `options.html`.

### Quick Troubleshooting

- **No popup appears** &mdash; Make sure your selection contains text; the script ignores empty selections.
- **Credentials missing** &mdash; Visit the options page and re-enter your bot token and chat ID. The background worker will reopen setup when values are missing.
- **Telegram rejects the message** &mdash; Check the spoiler formatting and ensure your bot is added to the target chat. Errors are logged in the service worker console.

## For Developers

### Project structure

```
├── background.js   # Service worker that validates credentials and calls Telegram
├── content.js      # Content script that renders the popup and sends SAVE_VOCAB messages
├── manifest.json   # Chrome extension manifest (Manifest V3)
├── options.html/js # Settings page to edit the bot token and chat ID after setup
├── setup.html/js   # First-run page for entering Telegram credentials
└── styles          # Shared popup styles injected with the content script
```

### How it works

1. **Content selection** &mdash; When you release the mouse after selecting text, `content.js` reads the selection, renders an inline popup beside the cursor, and posts the word/meaning to the background service worker via `chrome.runtime.sendMessage` when you click **Save**.
2. **Credential guard** &mdash; The background worker loads the saved bot token and chat ID from `chrome.storage.sync`. If either is missing it opens the setup page instead of calling Telegram, preventing failed API calls.
3. **Telegram delivery** &mdash; On success, the worker formats the message (`*word* = = ||meaning||`) and issues a `fetch` request to `https://api.telegram.org/bot<token>/sendMessage` with `MarkdownV2` parsing enabled.
4. **Persistence** &mdash; Both `setup.js` and `options.js` use the same storage helper so updating credentials in either place immediately affects subsequent saves.

### Debugging guide

1. **Verify storage**
   - Open `chrome://extensions`, find the extension, and click **service worker** under "Inspect views".
   - In the DevTools console, run `chrome.storage.sync.get(['botToken','chatId']).then(console.log)` to confirm credentials exist.
2. **Check message flow**
   - On the page where you reproduce the issue, open DevTools and inspect the console of the tab. The content script logs any `chrome.runtime.lastError` or API error returned by the background worker.
   - If you do not see the popup, ensure the selection actually contains text; the script removes the popup for empty selections.
3. **Inspect the service worker**
   - In the service worker console, watch for errors printed by `console.error` inside `handleSaveVocab`. Failures include missing credentials and non-OK responses from Telegram.
   - You can manually trigger a call by running `chrome.runtime.sendMessage({type:'SAVE_VOCAB', payload:{word:'test', meaning:'example', pageUrl:location.href}})` from the service worker console.
4. **Validate Telegram API**
   - The worker logs the full API error body when Telegram rejects the request. Common causes include invalid tokens, missing chat permissions, or mis-formatted Markdown. Ensure the bot is part of the chat and try sending a plain text message with `curl` to confirm the token works.
5. **Confirm chat IDs**
   - If you are unsure whether the stored chat ID is correct, temporarily add [@GetIDsBot](https://t.me/getidsbot) to the destination chat and issue `/start`. The bot replies with the numeric chat identifier you should paste into the setup or options page.

After adjusting settings, reload the extension from `chrome://extensions` (click **Reload**) to restart the service worker.

## Chính sách quyền riêng tư

- **Thu thập dữ liệu** &mdash; Tiện ích không thu thập, truyền hoặc bán bất kỳ dữ liệu cá nhân nào. Mọi từ vựng và định nghĩa chỉ được giữ lại trên trang đang mở cho đến khi bạn chủ động gửi chúng đến Telegram.
- **Thông tin được lưu trữ** &mdash; Mã bot và chat ID bạn nhập được lưu bằng `chrome.storage.sync`, cho phép Chrome đồng bộ hóa an toàn giữa các thiết bị. Không có dữ liệu nào khác được lưu.
- **Yêu cầu mạng** &mdash; Yêu cầu duy nhất được gửi ra bên ngoài là đến `https://api.telegram.org/bot<token>/sendMessage` để bot Telegram đã được bạn phê duyệt chuyển tiếp từ vựng tới cuộc trò chuyện đã cấu hình.
- **Chia sẻ với bên thứ ba** &mdash; Không có thông tin nào được chia sẻ với các bên khác ngoài Telegram và tiện ích không truy cập lịch sử duyệt web hoặc nội dung nào khác ngoài phần văn bản bạn đã bôi đen.

### Contributing

1. Fork the repository and create a new branch.
2. Make your changes, ensuring the popup remains unobtrusive and the Telegram flow is preserved.
3. Submit a pull request describing the update and how to test it.

### Contributors

- @your-github-handle (maintainer) &mdash; feel free to add yourself when you contribute.

### License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
