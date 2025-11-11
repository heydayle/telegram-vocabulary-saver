const TELEGRAM_API_BASE = 'https://api.telegram.org';

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

async function getCredentials() {
  const { botToken, chatId } = await storageGet(['botToken', 'chatId']);
  return { botToken, chatId };
}

function openSetupPage() {
  const url = chrome.runtime.getURL('setup.html');
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

async function handleSaveVocab(message) {
  const { botToken, chatId } = await getCredentials();

  if (!botToken || !chatId) {
    await openSetupPage();
    throw new Error('Telegram credentials are not set. Redirecting to setup.');
  }

  const { word, meaning, format, pageUrl } = message.payload || {};

  if (!word || !meaning) {
    throw new Error('Word and meaning are required.');
  }

  const formatMessage = (escapeMarkdownMeaning) => {
    let meaningFormatted = escapeMarkdownMeaning;
    
    if (!format) return escapeMarkdownMeaning;
    switch (format) {
        case 'italic':
          meaningFormatted = `\"\_${escapeMarkdownMeaning}\_\"`;
          break;
        case 'bold':
          meaningFormatted = `\*${escapeMarkdownMeaning}\*`;
          break;
        case 'code':
          meaningFormatted = `\`\`\`${escapeMarkdownMeaning}\`\`\``;
          break;
        case 'hidden':
          meaningFormatted = `\|\|${escapeMarkdownMeaning}\|\|`;
          break;
        default:
          break;
      }
    return meaningFormatted;
  }
  
  
  const messageFormatted = `*${escapeMarkdown(word)}* ${escapeMarkdown('=')} ${formatMessage(escapeMarkdown(meaning))}`
  const text = `${messageFormatted}`;

  const endpoint = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error: ${errorText}`);
  }

  return true;
}

function escapeMarkdown(text) {
  if (!text) {
    return '';
  }
  return text.replace(/([*_\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'SAVE_VOCAB') {
    (async () => {
      try {
        await handleSaveVocab(message);
        sendResponse({ success: true });
      } catch (error) {
        console.error(error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
  return undefined;
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const { botToken, chatId } = await getCredentials();
    if (!botToken || !chatId) {
      await openSetupPage();
    }
  }
});

