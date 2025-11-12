const POPUP_CLASS = 'telegram-vocab-popup';
let popupElement = null;
let selectedWord = '';
let savedSelectedWord = '';

function removePopup() {
  if (popupElement && popupElement.parentNode) {
    popupElement.parentNode.removeChild(popupElement);
  }
  popupElement = null;
  selectedWord = '';
}

function clampPopupPosition(desiredX, desiredY) {
  if (!popupElement) {
    return;
  }

  const margin = 112;
  const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const popupWidth = popupElement.offsetWidth;
  const popupHeight = popupElement.offsetHeight;

  const minLeft = scrollX + margin;
  const minTop = scrollY + 62;
  const maxLeft = scrollX + viewportWidth - popupWidth - margin;
  const maxTop = scrollY + viewportHeight - popupHeight - 62;

  const clampedLeft = Math.min(
    Math.max(desiredX, minLeft),
    Math.max(minLeft, maxLeft)
  );
  const clampedTop = Math.min(
    Math.max(desiredY, minTop),
    Math.max(minTop, maxTop)
  );

  popupElement.style.left = `${clampedLeft}px`;
  popupElement.style.top = `${clampedTop}px`;
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `telegram-vocab-toast ${isError ? 'telegram-vocab-toast--error' : ''}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
    savedSelectedWord = '';
  }, 3000);
}

function createPopup(x, y) {
  popupElement = document.createElement('div');
  popupElement.className = POPUP_CLASS;

  const wordInput = document.createElement('textarea');
  wordInput.className = `${POPUP_CLASS}__word`;
  wordInput.value = selectedWord;
  wordInput.dispatchEvent(new Event('input'));

  const input = document.createElement('textarea');
  input.placeholder = 'Enter meaning...';
  input.className = `${POPUP_CLASS}__input`;
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      button.click();
    }
  });

  const createCheckboxElement = (id) => {
    const spanElement = document.createElement('span');
    spanElement.innerHTML = `
      <span class="${POPUP_CLASS}__radio-item">
        <input type="radio" class="${POPUP_CLASS}__radio" id="${id}" name="format" value="${id}" />
        <label>${id}</label>
      </span>
    `;
    return spanElement;
  }

  const checkboxes = document.createElement('div');
  checkboxes.className = `${POPUP_CLASS}__radio-group`;
  checkboxes.innerHTML = `
    ${createCheckboxElement('hidden').innerHTML}
    ${createCheckboxElement('italic').innerHTML}
    ${createCheckboxElement('bold').innerHTML}
    ${createCheckboxElement('code').innerHTML}
  `;
  
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Save';
  button.className = `${POPUP_CLASS}__button`;

  button.addEventListener('click', () => {
    let meaning = input.value.trim();
    const radios = popupElement.querySelectorAll(`.${POPUP_CLASS}__radio`);
    radios.forEach((radio) => {
      if (radio.checked) {
        format = radio.value;
      }
    });
    console.log(meaning);
  
    const word = wordInput.value.trim();
    if (!word) {
      wordInput.focus();
      return;
    }

    if (!meaning) {
      input.focus();
      return;
    }
    try {
      savedSelectedWord = word;
      selectedWord = word;
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_VOCAB',
          payload: {
            word,
            meaning,
            format,
            pageUrl: window.location.href
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            showToast(`ERROR: <b>${chrome.runtime.lastError.message}</b>`, true);
          } else if (!response?.success) {
            console.error(response?.error || 'Failed to save word.');
            showToast(`ERROR: <b>${response?.error || 'Failed to save word.'}</b>`, true);
          } if (response?.success) {
            showToast(`Saved: <b>"${savedSelectedWord}"</b>`);
          }
        }
      );
          
      removePopup();
    } catch (error) {
      console.error('Error sending message to background script:', error);
    }
  });

  popupElement.appendChild(wordInput);
  popupElement.appendChild(input);
  popupElement.appendChild(checkboxes);
  popupElement.appendChild(button);

  document.body.appendChild(popupElement);

  clampPopupPosition(x, y);

  // requestAnimationFrame(() => input.focus());
}

document.addEventListener('mousedown', (event) => {
  if (popupElement && !event.target.closest(`.${POPUP_CLASS}`)) {
    removePopup();
  }
});

document.addEventListener('mouseup', (event) => {
  if (event.target.closest(`.${POPUP_CLASS}`)) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    removePopup();
    return;
  }

  const text = selection.toString().trim();
  if (!text || text.split(' ').length > 10) {
    removePopup();
    return;
  }

  selectedWord = text.charAt(0).toUpperCase() + text.slice(1);
  
  let pageX = event.pageX + 12;
  let pageY = event.pageY + 12;

  createPopup(pageX, pageY);
});
