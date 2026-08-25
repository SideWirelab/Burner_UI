
const phone = document.getElementById('phone');
const toast = document.getElementById('toast');
const homeGrid = document.getElementById('homeGrid');

let isOpen = false;
let phoneUnlocked = false;
let incomingTimer = null;
let reopenTimer = null;
let selectedReplyText = '';

function clearStoryTimers() {
  clearTimeout(incomingTimer);
  clearTimeout(reopenTimer);
  incomingTimer = null;
  reopenTimer = null;
}

function closeIncomingUI() {
  const ids = ['incomingOverlay', 'typingIndicator', 'followupMessage'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
}

function setHomeScreen() {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

  const home = document.getElementById('home');
  const ownerLock = document.getElementById('ownerLock');

  if (home) home.classList.add('active');

  if (phoneUnlocked) {
    if (homeGrid) homeGrid.classList.remove('locked');
    if (ownerLock) ownerLock.classList.add('unlocked');
  } else {
    if (homeGrid) homeGrid.classList.add('locked');
    if (ownerLock) ownerLock.classList.remove('unlocked');
  }
}

function openPhone() {
  if (isOpen) return;

  clearTimeout(reopenTimer);
  reopenTimer = null;

  isOpen = true;
  phone.classList.add('open');
  if (toast) toast.classList.add('show');

  // The owner message only happens during the initial locked-phone sequence.
  const incomingOverlay = document.getElementById('incomingOverlay');
  if (!phoneUnlocked && incomingOverlay && !incomingOverlay.classList.contains('active')) {
    clearTimeout(incomingTimer);
    incomingTimer = setTimeout(() => {
      if (isOpen && !phoneUnlocked) {
        document.getElementById('incomingOverlay').classList.add('active');
      }
    }, 5000);
  }
}

function closePhone() {
  if (!isOpen) return;

  isOpen = false;
  phone.classList.remove('open');
  if (toast) toast.classList.remove('show');
  clearTimeout(incomingTimer);
}

function togglePhone() {
  if (isOpen) {
    closePhone();
  } else {
    openPhone();
  }
}

document.addEventListener('keydown', event => {
  if (event.code === 'Space' || event.key.toLowerCase() === 'b') {
    event.preventDefault();
    togglePhone();
    return;
  }

  if (event.key === 'Escape' && isOpen) {
    closePhone();
  }
});

function openView(id) {
  if (!isOpen) return;

  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

document.querySelectorAll('.app').forEach(app => {
  app.addEventListener('click', event => {
    event.stopPropagation();
    openView(app.dataset.view);
  });
});

function saveConversation(replyText, responseText) {
  const contact = document.getElementById('unknownContact');
  const empty = document.getElementById('emptyInbox');
  const preview = document.getElementById('messagePreview');
  const storedReply = document.getElementById('storedReply');
  const storedResponse = document.getElementById('storedResponse');
  const storedWip = document.getElementById('storedWip');

  if (contact) contact.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  if (preview) preview.textContent = responseText;
  if (storedReply) storedReply.textContent = replyText;
  if (storedResponse) storedResponse.textContent = responseText;
  if (storedWip) storedWip.style.display = 'none';
}

function showTypingAndReply(message, unlockPhone, showWip = false) {
  const overlay = document.getElementById('incomingOverlay');
  const typing = document.getElementById('typingIndicator');
  const followup = document.getElementById('followupBubble');
  const history = document.getElementById('replyHistory');
  const options = document.getElementById('replyOptions');

  if (!overlay || !typing || !followup || !history || !options) return;

  options.style.display = 'none';

  if (selectedReplyText) {
    const you = document.createElement('div');
    you.className = 'bubble you';
    you.textContent = selectedReplyText;
    history.appendChild(you);
  }

  followup.classList.remove('active');
  overlay.classList.add('active');
  typing.classList.add('active');

  setTimeout(() => {
    typing.classList.remove('active');
    followup.textContent = message;
    followup.classList.add('active');
    saveConversation(selectedReplyText, message);

    if (showWip) {
      const wip = document.createElement('div');
      wip.className = 'story-wip';
      wip.textContent = 'Work in progress, story not implemented yet';
      history.appendChild(wip);

      const storedWip = document.getElementById('storedWip');
      if (storedWip) storedWip.style.display = 'block';
    }

    if (!unlockPhone) return;

    // Unlock state is now permanent for this page session.
    phoneUnlocked = true;
    clearTimeout(incomingTimer);

    const ownerLock = document.getElementById('ownerLock');
    if (ownerLock) ownerLock.classList.add('unlocked');
    if (homeGrid) homeGrid.classList.remove('locked');

    // Give the player a moment to see the owner's reply, then close the phone.
    setTimeout(() => {
      closePhone();
      closeIncomingUI();

      // Reopen after a short delay and show the unlock confirmation first.
      reopenTimer = setTimeout(() => {
        setHomeScreen();
        openPhone();

        const unlocked = document.getElementById('unlockedOverlay');
        if (unlocked) {
          unlocked.classList.add('active');
          setTimeout(() => {
            unlocked.classList.remove('active');
          }, 2200);
        }
      }, 1500);
    }, 1800);
  }, 1800);
}

document.querySelectorAll('.reply-btn').forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();

    selectedReplyText = button.textContent.trim();
    const reply = button.dataset.reply;

    if (reply === 'city') {
      showTypingAndReply('Good. Nobody likes rats. Meet me here.', true);
    } else if (reply === 'location') {
      showTypingAndReply(
        "Bullshit. The phone was never there. Meet me here with the cash, or you'll be in big trouble.",
        false,
        true
      );
    }
  });
});

const unknownContact = document.getElementById('unknownContact');
if (unknownContact) {
  unknownContact.addEventListener('click', event => {
    event.stopPropagation();
    openView('conversationView');
  });
}

document.querySelectorAll('[data-back="messages"]').forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();
    openView('messages');
  });
});

document.querySelectorAll('.back').forEach(button => {
  if (button.dataset.back === 'messages') return;

  button.addEventListener('click', event => {
    event.stopPropagation();
    openView('home');
  });
});

const installedApps = new Set();
const appData = {
  market: { label: 'Market', icon: '↗' },
  jobs: { label: 'Jobs', icon: '!' },
  wallet: { label: 'Wallet', icon: '$' }
};

function installApp(appId) {
  if (installedApps.has(appId) || !appData[appId] || !homeGrid) return;

  installedApps.add(appId);

  const app = document.createElement('div');
  app.className = 'app installed-slot';
  app.dataset.view = appId;
  app.innerHTML = `<div class="icon">${appData[appId].icon}</div>${appData[appId].label}`;

  app.addEventListener('click', event => {
    event.stopPropagation();
    openView(appId);
  });

  homeGrid.appendChild(app);
}

document.querySelectorAll('.download-btn').forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();

    if (button.disabled || button.classList.contains('locked')) return;

    const appId = button.dataset.install;
    installApp(appId);

    button.textContent = 'INSTALLED';
    button.classList.add('installed');
    button.disabled = true;
  });
});

function updateClock() {
  const clock = document.getElementById('clock');
  if (!clock) return;

  const now = new Date();
  clock.textContent =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}


let previewSpeed = 47;
let speedDirection = 1;
setInterval(() => {
  previewSpeed += speedDirection * (Math.random() > .5 ? 1 : 0);
  if (previewSpeed >= 53) speedDirection = -1;
  if (previewSpeed <= 42) speedDirection = 1;
  const speed = document.getElementById('previewSpeed');
  if (speed) speed.textContent = String(previewSpeed).padStart(3,'0');
}, 900);

updateClock();
setInterval(updateClock, 1000);

// Initial state: phone closed and owner lock active.
setHomeScreen();
closeIncomingUI();
phone.classList.remove('open');
if (toast) toast.classList.remove('show');


// Physical center-button hitbox: the hardware is baked into the PNG.
// A center press returns to the phone home screen.
const phoneCenterButton = document.getElementById('phoneCenterButton');
if (phoneCenterButton) {
  phoneCenterButton.addEventListener('click', event => {
    event.stopPropagation();
    if (!isOpen) return;
    setHomeScreen();
  });
}
