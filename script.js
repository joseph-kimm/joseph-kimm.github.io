(function () {
  'use strict';

  var zCounter = 100;
  var topWindowId = null;
  var isMobile = function () { return window.innerWidth < 768; };

  // --- Window Management ---

  function centerWindow(win) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var rect = win.getBoundingClientRect();
    win.style.left = Math.max(12, (vw - rect.width) / 2) + 'px';
    win.style.top = Math.max(12, (vh - rect.height) / 2) + 'px';
  }

  function bringToFront(win) {
    win.style.zIndex = ++zCounter;
    topWindowId = win.id;
  }

  function openWindow(id) {
    var win = document.getElementById('window-' + id);
    if (!win) return;

    // If already open, just bring to front
    if (win.style.display !== 'none' && win.classList.contains('is-visible')) {
      bringToFront(win);
      return;
    }

    win.style.display = 'flex';
    centerWindow(win);
    bringToFront(win);

    // Trigger animation on next frame
    requestAnimationFrame(function () {
      win.classList.remove('is-closing');
      win.classList.add('is-visible');
    });
  }

  function closeWindow(win) {
    win.classList.remove('is-visible');
    win.classList.add('is-closing');

    function onEnd() {
      win.style.display = 'none';
      win.classList.remove('is-closing');
      win.removeEventListener('transitionend', onEnd);
      if (topWindowId === win.id) {
        topWindowId = null;
      }
    }

    win.addEventListener('transitionend', onEnd);
  }

  // --- Drag ---

  function makeDraggable(win) {
    var header = win.querySelector('.window-header');
    if (!header) return;

    var isDragging = false;
    var startX, startY, startLeft, startTop;

    function onStart(e) {
      if (e.target.closest('.window-close')) return;
      if (isMobile()) return;

      isDragging = true;
      var clientX = e.clientX != null ? e.clientX : e.touches[0].clientX;
      var clientY = e.clientY != null ? e.clientY : e.touches[0].clientY;
      startX = clientX;
      startY = clientY;
      startLeft = win.offsetLeft;
      startTop = win.offsetTop;

      bringToFront(win);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
      if (!isDragging) return;
      e.preventDefault();

      var clientX = e.clientX != null ? e.clientX : e.touches[0].clientX;
      var clientY = e.clientY != null ? e.clientY : e.touches[0].clientY;

      var newLeft = startLeft + (clientX - startX);
      var newTop = startTop + (clientY - startY);

      // Clamp so at least 60px of the window stays visible
      var maxLeft = window.innerWidth - 60;
      var maxTop = window.innerHeight - 60;
      newLeft = Math.max(-win.offsetWidth + 60, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    }

    function onEnd() {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    }

    header.addEventListener('mousedown', onStart);
    header.addEventListener('touchstart', onStart, { passive: true });
  }

  // --- Init ---

  document.addEventListener('DOMContentLoaded', function () {
    // Folder click -> open window
    document.querySelectorAll('.folder').forEach(function (folder) {
      folder.addEventListener('click', function () {
        var windowId = this.getAttribute('data-window');
        openWindow(windowId);
      });
    });

    // Set up all windows (close buttons, drag, z-index)
    document.querySelectorAll('.window').forEach(function (win) {
      // Close button
      var closeBtn = win.querySelector('.window-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          closeWindow(win);
        });
      }

      // Click on window -> bring to front
      win.addEventListener('mousedown', function () {
        bringToFront(win);
      });

      // Make draggable
      makeDraggable(win);

      // Init z-index for already-visible windows
      if (win.classList.contains('is-visible')) {
        bringToFront(win);
      }
    });

    // Tab switching
    document.querySelectorAll('.tabs').forEach(function (tabBar) {
      var win = tabBar.closest('.window');
      tabBar.querySelectorAll('.tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          // Deactivate all tabs in this bar
          tabBar.querySelectorAll('.tab').forEach(function (t) {
            t.classList.remove('is-active');
          });
          // Hide all tab panes in this window
          win.querySelectorAll('.window-content').forEach(function (pane) {
            pane.style.display = 'none';
          });
          // Activate clicked tab and show its pane
          tab.classList.add('is-active');
          var pane = document.getElementById('tab-' + tab.getAttribute('data-tab'));
          if (pane) pane.style.display = '';
        });
      });
    });

    // Journal buttons -> open journal window
    document.querySelectorAll('.project-btn[data-journal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var journalId = this.getAttribute('data-journal');
        openWindow(journalId);
      });
    });

    // Escape key -> close topmost window
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && topWindowId) {
        var win = document.getElementById(topWindowId);
        if (win && win.style.display !== 'none') {
          closeWindow(win);
        }
      }
    });
  });
})();
