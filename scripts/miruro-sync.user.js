// ==UserScript==
// @name         Miruro Sync Player
// @namespace    anilens
// @version      1.0.0
// @description  Sync anime playback between two viewers on Miruro — one dub, one sub
// @author       AniLens
// @match        https://www.miruro.tv/*
// @match        https://miruro.tv/*
// @match        https://kwik.cx/*
// @match        https://*.kwik.cx/*
// @match        https://vidstack.io/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('[MiruroSync] Script IIFE starting...');

  // Defensive GM API wrappers (fallback if grants fail)
  const gmGet = (typeof GM_getValue === 'function')
    ? GM_getValue
    : (_key, def) => def;
  const gmSet = (typeof GM_setValue === 'function')
    ? GM_setValue
    : () => {};
  const gmDelete = (typeof GM_deleteValue === 'function')
    ? GM_deleteValue
    : () => {};

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    // Change this to your relay URL after deploying to Railway:
    //   wss://YOUR-APP-NAME.up.railway.app
    // Local testing only: ws://localhost:8787
    WS_URL: 'wss://tail-shopper-mel-dress.trycloudflare.com',
    SYNC_INTERVAL: 500,         // How often we broadcast state (ms)
    SEEK_THRESHOLD: 1.5,        // Seconds drift before we correct
    DEBOUNCE_MS: 800,           // Ignore events after applying partner seek/play/pause
    RECONNECT_DELAY: 3000,      // Auto-reconnect after disconnect
    MAX_RECONNECT_ATTEMPTS: 10,
  };

  // ============================================
  // STATE
  // ============================================
  const state = {
    ws: null,
    roomId: gmGet('miruroSyncRoom', null),
    isHost: false,
    partnerConnected: false,
    isIframe: window.self !== window.top,
    lastSyncTime: 0,
    ignoreNextEvent: false,
    ignoreUntil: 0,
    reconnectAttempts: 0,
    reconnectTimer: null,
    syncIntervalId: null,
    video: null,
    ui: null,
    pendingRoomId: null,
    pendingIsHost: false,
    iframeRetries: 0,
    didAutoResume: false,
    videoRetryTimer: null,
    attachVideoListenerPending: false,
  };

  // ============================================
  // UTILITIES
  // ============================================
  const log = (...args) => console.log('[MiruroSync]', ...args);
  const warn = (...args) => console.warn('[MiruroSync]', ...args);
  const generateRoomId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

  // ============================================
  // WEBSOCKET
  // ============================================
  function connect(roomId, isHost = false) {
    if (state.ws?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }
    if (!roomId) {
      warn('No room ID provided');
      return;
    }

    state.roomId = roomId;
    state.isHost = isHost;
    gmSet('miruroSyncRoom', roomId);
    log(`Connecting to room ${roomId}...`);
    updateDebugInfo('ws', 'CONNECTING...');

    try {
      state.ws = new WebSocket(`${CONFIG.WS_URL}?room=${roomId}`);
    } catch (e) {
      warn('Failed to create WebSocket:', e);
      scheduleReconnect();
      return;
    }

    state.ws.onopen = () => {
      log('Connected to sync room');
      updateDebugInfo('ws', 'CONNECTED ✓');
      state.reconnectAttempts = 0;
      updateStatus('connected');

      // Announce presence
      send({ type: 'hello', isHost });

      // Start broadcasting our state
      startSyncLoop();
    };

    state.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        log('WS recv:', msg.type, msg);
        updateDebugInfo('lastMsg', msg.type);
        handleMessage(msg);
      } catch (e) {
        warn('Invalid message:', event.data, e);
      }
    };

    state.ws.onclose = () => {
      warn('Disconnected from sync room');
      updateDebugInfo('ws', 'DISCONNECTED');
      state.partnerConnected = false;
      updateStatus('disconnected');
      stopSyncLoop();
      scheduleReconnect();
    };

    state.ws.onerror = (err) => {
      warn('WebSocket error:', err);
      updateDebugInfo('ws', 'ERROR');
      updateStatus('error');
    };
  }

  function send(data) {
    if (state.ws?.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify(data));
    }
  }

  function scheduleReconnect() {
    if (state.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
      updateStatus('failed');
      return;
    }
    state.reconnectAttempts++;
    log(`Reconnecting in ${CONFIG.RECONNECT_DELAY}ms (attempt ${state.reconnectAttempts})...`);
    updateStatus('reconnecting');

    state.reconnectTimer = setTimeout(() => {
      if (state.roomId) connect(state.roomId, state.isHost);
    }, CONFIG.RECONNECT_DELAY);
  }

  // ============================================
  // MESSAGE HANDLER
  // ============================================
  function handleMessage(msg) {
    // Ignore our own echo
    if (msg.from === 'self') return;

    switch (msg.type) {
      case 'hello':
        state.partnerConnected = true;
        updateStatus('partner-connected');
        log('Partner joined');
        // Send our current state so partner catches up
        broadcastState();
        break;

      case 'state':
        applyPartnerState(msg);
        break;

      case 'seek':
        applySeek(msg.time);
        break;

      case 'play':
        applyPlay();
        break;

      case 'pause':
        applyPause();
        break;

      case 'bye':
        state.partnerConnected = false;
        updateStatus('partner-left');
        log('Partner left');
        break;

      case 'navigate':
        if (!state.isHost && msg.url && msg.url !== location.href) {
          log(`Host navigated to ${msg.url}, following...`);
          // Navigate the top-level window (works whether we're in iframe or parent)
          window.top.location.href = msg.url;
        }
        break;
    }
  }

  // ============================================
  // VIDEO SYNC LOGIC
  // ============================================
  function applyPartnerState(msg) {
    if (!state.video) {
      warn('applyPartnerState: no video element');
      return;
    }
    if (state.ignoreNextEvent) {
      log('Ignoring partner state (debounce)');
      return;
    }

    const myTime = state.video.currentTime;
    const partnerTime = msg.currentTime;
    const diff = Math.abs(myTime - partnerTime);

    log(`Partner state: time=${partnerTime.toFixed(2)}, playing=${msg.playing}, myTime=${myTime.toFixed(2)}, diff=${diff.toFixed(2)}`);

    // Only seek if we're significantly out of sync
    if (diff > CONFIG.SEEK_THRESHOLD) {
      log(`Syncing: partner at ${partnerTime.toFixed(2)}, we're at ${myTime.toFixed(2)}`);
      applySeek(partnerTime);
    }

    // Note: play/pause is handled by explicit 'play'/'pause' messages only.
    // We don't enforce it here to avoid fighting the user's own controls.
  }

  function setIgnore() {
    state.ignoreUntil = Date.now() + CONFIG.DEBOUNCE_MS;
  }

  function applySeek(time) {
    if (!state.video) return;
    setIgnore();
    state.video.currentTime = time;
  }

  function applyPlay() {
    if (!state.video) return;
    setIgnore();
    const playPromise = state.video.play();
    if (playPromise) playPromise.catch(() => {});
  }

  function applyPause() {
    if (!state.video) return;
    setIgnore();
    state.video.pause();
  }

  function broadcastState() {
    if (!state.video) return;
    send({
      type: 'state',
      currentTime: state.video.currentTime,
      playing: !state.video.paused,
      duration: state.video.duration,
    });
  }

  function startSyncLoop() {
    stopSyncLoop();
    state.syncIntervalId = setInterval(broadcastState, CONFIG.SYNC_INTERVAL);
  }

  function stopSyncLoop() {
    if (state.syncIntervalId) {
      clearInterval(state.syncIntervalId);
      state.syncIntervalId = null;
    }
  }

  // ============================================
  // VIDEO EVENT LISTENERS
  // ============================================
  function attachVideoListeners() {
    // Cancel any previous pending retry to avoid stacked loops
    if (state.videoRetryTimer) {
      clearTimeout(state.videoRetryTimer);
      state.videoRetryTimer = null;
    }
    const video = findVideo();
    if (!video) {
      warn('No video element found. Retrying in 2s...');
      updateDebugInfo('video', 'NOT FOUND - retrying...');
      state.videoRetryTimer = setTimeout(attachVideoListeners, 2000);
      return;
    }

    if (state.video === video) {
      // Already attached to this element
      return;
    }

    state.video = video;
    log('Video element found and attached');
    updateDebugInfo('video', 'FOUND ✓');

    // Only send events when WE trigger them (not from partner sync)
    video.addEventListener('play', () => {
      if (Date.now() < state.ignoreUntil) return;
      send({ type: 'play' });
      broadcastState();
    });

    video.addEventListener('pause', () => {
      if (Date.now() < state.ignoreUntil) return;
      if (video.ended) return;
      send({ type: 'pause' });
      broadcastState();
    });

    video.addEventListener('seeked', () => {
      if (Date.now() < state.ignoreUntil) return;
      send({ type: 'seek', time: video.currentTime });
      broadcastState();
    });

    // Detect buffering and pause sync briefly
    video.addEventListener('waiting', () => {
      log('Video buffering...');
      stopSyncLoop();
    });

    video.addEventListener('playing', () => {
      if (state.ws?.readyState === WebSocket.OPEN) {
        startSyncLoop();
      }
    });

    // Auto-rebroadcast when episode changes (SPA navigation)
    if (!state._observer) {
      state._observer = new MutationObserver(() => {
        const newVideo = findVideo();
        if (newVideo && newVideo !== state.video) {
          log('New video detected, reattaching...');
          state.video = newVideo;
          attachVideoListeners();
        }
      });
      state._observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function findVideo() {
    // Try multiple selectors for Miruro's player
    const selectors = [
      'video',
      'video[src]',
      'video[data-src]',
      '.video-js video',
      '.vjs-tech',
      '[class*="player"] video',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        log(`Found video with selector: ${sel}`);
        return el;
      }
    }
    return null;
  }

  // ============================================
  // UI
  // ============================================
  function createUI() {
    if (document.getElementById('miruro-sync-ui')) return;

    const container = document.createElement('div');
    container.id = 'miruro-sync-ui';
    container.innerHTML = `
      <style>
        #miruro-sync-ui {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: rgba(15, 15, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          min-width: 240px;
          color: #fff;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          transition: opacity 0.2s;
        }
        #miruro-sync-ui h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #miruro-sync-ui .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #666;
          transition: background 0.3s;
        }
        #miruro-sync-ui .status-dot.connected { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
        #miruro-sync-ui .status-dot.disconnected { background: #f87171; }
        #miruro-sync-ui .status-dot.reconnecting { background: #fbbf24; animation: pulse 1s infinite; }
        #miruro-sync-ui .status-dot.partner-connected { background: #60a5fa; box-shadow: 0 0 6px #60a5fa; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        #miruro-sync-ui input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 13px;
          margin-bottom: 8px;
          box-sizing: border-box;
        }
        #miruro-sync-ui input:focus {
          outline: none;
          border-color: #60a5fa;
        }
        #miruro-sync-ui button {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 6px;
          transition: opacity 0.2s;
        }
        #miruro-sync-ui button:hover { opacity: 0.85; }
        #miruro-sync-ui .btn-primary {
          background: #3b82f6;
          color: #fff;
        }
        #miruro-sync-ui .btn-secondary {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        #miruro-sync-ui .btn-danger {
          background: #ef4444;
          color: #fff;
        }
        #miruro-sync-ui .room-id {
          font-family: monospace;
          background: rgba(255,255,255,0.08);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 18px;
          text-align: center;
          letter-spacing: 2px;
          margin: 8px 0;
          user-select: all;
        }
        #miruro-sync-ui .info {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-top: 8px;
          line-height: 1.4;
        }
        #miruro-sync-ui .hidden { display: none; }
      </style>

      <h3>
        <span class="status-dot" id="sync-status-dot"></span>
        Miruro Sync
      </h3>

      <div id="sync-panel-create">
        <button class="btn-primary" id="btn-create-room">Create Room</button>
        <button class="btn-secondary" id="btn-show-join">Join Room</button>
        <div class="info">Create a room and share the ID, or join an existing room.</div>
      </div>

      <div id="sync-panel-join" class="hidden">
        <input type="text" id="room-input" placeholder="Enter room ID..." maxlength="12">
        <button class="btn-primary" id="btn-join-room">Join Room</button>
        <button class="btn-secondary" id="btn-back">Back</button>
      </div>

      <div id="sync-panel-active" class="hidden">
        <div class="room-id" id="room-display"></div>
        <div class="info" id="room-status">Waiting for partner...</div>
        <button class="btn-danger" id="btn-leave-room">Leave Room</button>
        <div class="info" id="sync-debug-info" style="margin-top:12px;font-size:10px;opacity:0.7;font-family:monospace;">Debug: initializing...</div>
      </div>
    `;

    document.body.appendChild(container);
    state.ui = container;

    // Wire up buttons
    document.getElementById('btn-show-join').addEventListener('click', () => {
      showPanel('join');
    });

    document.getElementById('btn-create-room').addEventListener('click', () => {
      const roomId = generateRoomId();
      state.isHost = true;
      gmSet('miruroSyncRoom', roomId);
      gmSet('miruroSyncIsHost', true);
      showPanel('active');
      document.getElementById('room-display').textContent = roomId;
      updateStatus('connecting');
      state.iframeRetries = 0;
      tellIframeToConnect(roomId, true);
    });

    document.getElementById('btn-join-room').addEventListener('click', () => {
      const roomId = document.getElementById('room-input').value.trim().toUpperCase();
      if (!roomId) return;
      state.isHost = false;
      gmSet('miruroSyncRoom', roomId);
      gmSet('miruroSyncIsHost', false);
      showPanel('active');
      document.getElementById('room-display').textContent = roomId;
      updateStatus('connecting');
      state.iframeRetries = 0;
      tellIframeToConnect(roomId, false);
    });

    document.getElementById('btn-back').addEventListener('click', () => {
      showPanel('create');
    });

    document.getElementById('btn-leave-room').addEventListener('click', () => {
      leaveRoom();
      gmDelete('miruroSyncRoom');
      gmDelete('miruroSyncIsHost');
      showPanel('create');
    });

    // Allow Enter key on input
    document.getElementById('room-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-join-room').click();
    });
  }

  function showPanel(name) {
    document.getElementById('sync-panel-create').classList.add('hidden');
    document.getElementById('sync-panel-join').classList.add('hidden');
    document.getElementById('sync-panel-active').classList.add('hidden');
    document.getElementById(`sync-panel-${name}`).classList.remove('hidden');
  }

  function updateStatus(status) {
    if (state.isIframe) {
      window.parent.postMessage({ source: 'miruro-sync', action: 'status', status }, '*');
      return;
    }
    const dot = document.getElementById('sync-status-dot');
    if (!dot) return;
    dot.className = 'status-dot';
    if (status) dot.classList.add(status);

    const statusText = document.getElementById('room-status');
    if (!statusText) return;

    const messages = {
      'connecting': 'Connecting...',
      'connected': 'Connected. Waiting for partner...',
      'partner-connected': 'Partner connected! Sync active.',
      'disconnected': 'Disconnected.',
      'reconnecting': 'Reconnecting...',
      'partner-left': 'Partner left. Waiting...',
      'error': 'Connection error.',
      'waiting-iframe': 'Waiting for video player to load...',
      'failed': 'Failed to connect after multiple attempts.',
    };
    statusText.textContent = messages[status] || status;
    updateDebugInfo('status', status);
  }

  // Debug info panel
  const debugInfo = {};
  function updateDebugInfo(key, value) {
    debugInfo[key] = value;
    const el = document.getElementById('sync-debug-info');
    if (el) {
      el.textContent = Object.entries(debugInfo).map(([k, v]) => `${k}: ${v}`).join(' | ');
    }
  }

  function leaveRoom() {
    send({ type: 'bye' });
    stopSyncLoop();
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    if (state.ws) {
      state.ws.close();
      state.ws = null;
    }
    state.roomId = null;
    state.partnerConnected = false;
    gmDelete('miruroSyncRoom');
  }

  // ============================================
  // PARENT ↔ IFRAME COMMUNICATION
  // ============================================

  function findVideoIframe() {
    const candidates = document.querySelectorAll('iframe');
    const videoDomains = ['kwik.cx', 'youtube', 'youtube-nocookie', 'vidstack', 'streamtape', 'filemoon', 'mp4upload', 'doodstream', 'voe.sx', 'vidcloud', 'megacloud', 'rapid-cloud'];
    for (const iframe of candidates) {
      const src = iframe.src || iframe.getAttribute('src') || '';
      if (src && videoDomains.some(d => src.includes(d))) return iframe;
    }
    // fallback: any iframe with a real src
    for (const iframe of candidates) {
      const src = iframe.src || iframe.getAttribute('src') || '';
      if (src && src.startsWith('http')) return iframe;
    }
    return null;
  }

  function tellIframeToConnect(roomId, isHost) {
    if (state.isIframe) return;
    state.pendingRoomId = roomId;
    state.pendingIsHost = isHost;
    const iframe = findVideoIframe();
    if (iframe && iframe.contentWindow) {
      state.iframeRetries = 0;
      iframe.contentWindow.postMessage({ source: 'miruro-sync', action: 'connect', roomId, isHost }, '*');
      log('Sent connect request to iframe');
    } else {
      state.iframeRetries++;
      if (state.iframeRetries > 50) {
        updateStatus('error');
        log('Iframe not found after 50 retries (10s). Is the video loaded?');
        return;
      }
      updateStatus('waiting-iframe');
      log(`Iframe not found yet, retry #${state.iframeRetries}...`);
      setTimeout(() => tellIframeToConnect(roomId, isHost), 200);
    }
  }

  function tellIframeToLeave() {
    if (state.isIframe) return;
    state.pendingRoomId = null;
    const iframe = findVideoIframe();
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ source: 'miruro-sync', action: 'leave' }, '*');
    }
  }

  window.addEventListener('message', (event) => {
    if (event.data?.source !== 'miruro-sync') return;

    if (state.isIframe) {
      if (event.data.action === 'connect') {
        log(`Received connect command: room=${event.data.roomId}`);
        connect(event.data.roomId, event.data.isHost);
      } else if (event.data.action === 'leave') {
        log('Received leave command');
        leaveRoom();
      } else if (event.data.action === 'broadcast-navigate') {
        log(`Broadcasting navigate to ${event.data.url}`);
        send({ type: 'navigate', url: event.data.url });
      }
    } else {
      if (event.data.action === 'status') {
        updateStatus(event.data.status);
      } else if (event.data.action === 'state') {
        updateDebugInfo('partner', `${event.data.playing ? '▶' : '⏸'} ${event.data.currentTime?.toFixed(1)}s`);
      } else if (event.data.action === 'iframe-ready') {
        log('Iframe reported ready');
        // Resume connection using current room (in-memory or just-restored)
        const roomId = state.pendingRoomId || state.roomId;
        if (roomId) {
          tellIframeToConnect(roomId, state.isHost);
        }
      }
    }
  });

  // ============================================
  // KEYBOARD SHORTCUT
  // ============================================
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+S toggles the sync UI
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      const ui = document.getElementById('miruro-sync-ui');
      if (ui) {
        ui.style.display = ui.style.display === 'none' ? 'block' : 'none';
      }
    }
  });

  // ============================================
  // INIT
  // ============================================
  function init() {
    try {
      log('Initializing Miruro Sync...');
      alert('[Miruro Sync] Script loaded. Panel should appear shortly.');
      if (!document.body) {
        log('document.body not ready, retrying...');
        setTimeout(init, 500);
        return;
      }

      if (state.isIframe) {
        log('[Iframe] Miruro Sync loaded');
        attachVideoListeners();
        window.parent.postMessage({ source: 'miruro-sync', action: 'iframe-ready' }, '*');
      } else {
        log('[Parent] Miruro Sync loaded');
        createUI();
        attachVideoListeners();
        // Auto-resume from saved room ONCE per page load
        const savedRoom = gmGet('miruroSyncRoom', null);
        const savedIsHost = gmGet('miruroSyncIsHost', false);
        const onWatchPage = /\/watch\//.test(location.pathname);
        if (savedRoom && !state.didAutoResume && onWatchPage) {
          state.didAutoResume = true;
          log(`Auto-resuming saved room: ${savedRoom} (host: ${savedIsHost})`);
          state.isHost = savedIsHost;
          showPanel('active');
          document.getElementById('room-display').textContent = savedRoom;
          updateStatus('connecting');
          state.iframeRetries = 0;
          tellIframeToConnect(savedRoom, savedIsHost);
        }
      }

      log('Miruro Sync initialized');
    } catch (err) {
      warn('init() failed:', err);
    }
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

  // ============================================
  // SPA NAVIGATION DETECTION (instant, not polling)
  // ============================================
  function onUrlChange(url) {
    log(`Navigation detected: ${url}`);

    // Host broadcasts immediately before page changes
    if (state.isHost && state.roomId && state.ws?.readyState === WebSocket.OPEN) {
      log(`Broadcasting navigation: ${url}`);
      send({ type: 'navigate', url });
    }

    // Re-init after DOM settles
    setTimeout(init, 1500);
  }

  // Intercept pushState / replaceState (SPA routing)
  const _pushState = history.pushState.bind(history);
  const _replaceState = history.replaceState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    onUrlChange(location.href);
  };
  history.replaceState = function (...args) {
    _replaceState(...args);
    onUrlChange(location.href);
  };
  window.addEventListener('popstate', () => onUrlChange(location.href));

  // Safety net: broadcast on actual page unload too
  window.addEventListener('beforeunload', () => {
    if (state.isHost && state.roomId && state.ws?.readyState === WebSocket.OPEN) {
      send({ type: 'navigate', url: location.href });
    }
  });

})();
