import { logExtensionPresence } from 'utils/utilsModular';
import { trackEvent } from 'utils/analytics';

let messagePresets = [];

const removeHeader = () => {
  const header = document.querySelector('.main_SteamPageHeader_3EaXO');
  if (header !== null) header.remove();
};

const addChatPresets = () => {
  document.querySelectorAll('.DropTarget.chatWindow.MultiUserChat').forEach((chatDialog) => {
    let presetMessageSelect = chatDialog.querySelector('.messagePreset');
    if (!presetMessageSelect) {
      const chatEntryDiv = chatDialog.querySelector('.chatEntry.Panel.Focusable');

      if (chatEntryDiv) {
        presetMessageSelect = document.createElement('select');
        presetMessageSelect.classList.add('messagePreset');
        const disabledPlaceHolderOption = document.createElement('option');
        disabledPlaceHolderOption.setAttribute('disabled', '');
        disabledPlaceHolderOption.setAttribute('selected', '');
        disabledPlaceHolderOption.text = 'Select a message to send...';
        presetMessageSelect.appendChild(disabledPlaceHolderOption);

        messagePresets.forEach((message, index) => {
          const option = document.createElement('option');
          option.value = index.toString();
          option.text = `${message.substring(0, 50)}...`;
          presetMessageSelect.appendChild(option);
        });

        chatEntryDiv.insertAdjacentElement('afterbegin', presetMessageSelect);
        presetMessageSelect.addEventListener('change', () => {
          const messageArea = chatEntryDiv.querySelector('textarea');
          const submitButton = chatEntryDiv.querySelector('button[type=submit]');

          if (messageArea && submitButton) {
            messageArea.value = messagePresets[presetMessageSelect.selectedIndex];
            messageArea.dispatchEvent(new Event('input', {
              bubbles: true,
              cancelable: true,
            }));
            submitButton.click();
          }
        });
      }
    }
  });
};

chrome.storage.local.get(['removeWebChatHeader', 'showChatPresetMessages', 'chatPresetMessages'], ({
  removeWebChatHeader, chatPresetMessages, showChatPresetMessages,
}) => {
  if (removeWebChatHeader) {
    const tryToRemoveHeaderPeriodically = setInterval(() => {
      removeHeader();
    }, 5000);

    setTimeout(() => {
      clearInterval(tryToRemoveHeaderPeriodically);
    }, 60000);
  }

  if (showChatPresetMessages) {
    messagePresets = chatPresetMessages;
    addChatPresets();
    setTimeout(addChatPresets, 10000);
    setInterval(addChatPresets, 30000);
  }
});

logExtensionPresence();
trackEvent({
  type: 'pageview',
  action: 'WebChat',
});
