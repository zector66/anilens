// ==UserScript==
// @name         Miruro Sync Diagnostic
// @namespace    test
// @version      1.0
// @description  Minimal test to verify Tampermonkey injection works
// @match        https://www.miruro.tv/*
// @match        https://miruro.tv/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('=== SYNC TEST: Script is running ===');
  console.log('URL:', location.href);
  console.log('document.body exists:', !!document.body);

  const div = document.createElement('div');
  div.id = 'sync-test-box';
  div.textContent = 'SYNC TEST: Script Active';
  div.style.cssText = 'position:fixed;top:10px;left:10px;background:#22c55e;color:#fff;padding:16px 24px;border-radius:8px;z-index:999999;font-family:sans-serif;font-size:14px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  document.body.appendChild(div);

  console.log('=== SYNC TEST: Green box should be visible ===');
})();
