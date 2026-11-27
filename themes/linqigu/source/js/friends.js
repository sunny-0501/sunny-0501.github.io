(() => {
  'use strict';
  const legacyGuestbook = document.querySelector('[data-guestbook-redirect]');
  if (legacyGuestbook) {
    const destination = new URL(legacyGuestbook.dataset.guestbookRedirect, window.location.href);
    if (destination.origin === window.location.origin) window.location.replace(destination.href);
    return;
  }
  const mailbox = document.querySelector('details#guestbook');
  const revealMailbox = () => {
    if (window.location.hash !== '#guestbook' || !mailbox) return;
    mailbox.open = true;
    requestAnimationFrame(() => mailbox.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  revealMailbox();
  window.addEventListener('hashchange', revealMailbox);
  document.querySelectorAll('a[href="#guestbook"]').forEach((link) => {
    link.addEventListener('click', () => { if (mailbox) mailbox.open = true; });
  });
  const message = document.querySelector('#guestbookMessage');
  const count = document.querySelector('#guestbookCount');
  message?.addEventListener('input', () => { if (count) count.textContent = `${message.value.length} / 1200`; });
  const siteInfo = document.querySelector('#friendSiteInfo');
  const copyButton = document.querySelector('[data-copy-site]');
  const copyStatus = document.querySelector('#siteCopyStatus');
  copyButton?.addEventListener('click', async () => {
    if (!siteInfo) return;
    try {
      await navigator.clipboard.writeText(siteInfo.textContent);
      if (copyStatus) copyStatus.textContent = '本站信息已复制，可以粘贴到你的友链页。';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(siteInfo);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      if (copyStatus) copyStatus.textContent = '请按 Ctrl / ⌘ + C 复制已选中的站点信息。';
    }
  });
  document.querySelectorAll('.harbor-friend__avatar img').forEach((avatar) => {
    const hideBrokenAvatar = () => { avatar.hidden = true; };
    avatar.addEventListener('error', hideBrokenAvatar, { once: true });
    if (avatar.complete && !avatar.naturalWidth) hideBrokenAvatar();
  });
})();
