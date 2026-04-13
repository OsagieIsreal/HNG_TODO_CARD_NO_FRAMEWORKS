/**
 * Todo Task Card — script.js
 *
 * Covers:
 *  - Theme toggle (dark ↔ light) with localStorage persistence
 *  - Time-remaining calculation & live updates (~60s interval)
 *  - Checkbox: strike-through title + status change
 *  - Edit button: console.log
 *  - Delete button: alert
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────
     CONFIG
     Change DUE_DATE to test different time-remaining
     states (overdue, due now, due soon, far future).
  ────────────────────────────────────────────────── */
  const DUE_DATE = new Date('2026-04-17T18:00:00');

  /* ──────────────────────────────────────────────────
     ELEMENT REFERENCES
  ────────────────────────────────────────────────── */
  const html            = document.documentElement;
  const themeToggleBtn  = document.getElementById('theme-toggle');
  const toggleLabel     = themeToggleBtn.querySelector('.theme-btn__label');

  const checkbox        = document.querySelector('[data-testid="test-todo-complete-toggle"]');
  const taskTitle       = document.querySelector('[data-testid="test-todo-title"]');
  const statusBadge     = document.querySelector('[data-testid="test-todo-status"]');
  const timeRemainingEl = document.querySelector('[data-testid="test-todo-time-remaining"]');
  const editBtn         = document.querySelector('[data-testid="test-todo-edit-button"]');
  const deleteBtn       = document.querySelector('[data-testid="test-todo-delete-button"]');

  /* ──────────────────────────────────────────────────
     THEME TOGGLE
  ────────────────────────────────────────────────── */

  /**
   * Apply a theme and persist it.
   * @param {'dark'|'light'} theme
   */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);

    try {
      localStorage.setItem('todo-card-theme', theme);
    } catch (_) { /* ignore in restricted environments */ }

    if (theme === 'light') {
      toggleLabel.textContent = 'Dark mode';
      themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      toggleLabel.textContent = 'Light mode';
      themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
      themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // Restore saved theme preference on load
  (function restoreSavedTheme() {
    try {
      const saved = localStorage.getItem('todo-card-theme');
      if (saved === 'light' || saved === 'dark') {
        applyTheme(saved);
      }
    } catch (_) { /* ignore */ }
  }());

  themeToggleBtn.addEventListener('click', function () {
    const current = html.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ──────────────────────────────────────────────────
     TIME REMAINING LOGIC
  ────────────────────────────────────────────────── */

  /**
   * Given a due date, returns a human-friendly string
   * and a CSS modifier class for colour coding.
   *
   * @param {Date} dueDate
   * @returns {{ text: string, cls: 't--ok' | 't--soon' | 't--overdue' | 't--now' }}
   */
  function computeTimeStatus(dueDate) {
    const now     = new Date();
    const diffMs  = dueDate - now;        // positive = future, negative = past
    const absMs   = Math.abs(diffMs);

    // Helper: round up to nearest whole unit
    const totalSeconds = Math.floor(absMs / 1000);
    const totalMinutes = Math.floor(absMs / (1000 * 60));
    const totalHours   = Math.floor(absMs / (1000 * 60 * 60));
    const totalDays    = Math.floor(absMs / (1000 * 60 * 60 * 24));

    // Within 90 seconds either way → "Due now!"
    if (absMs < 90 * 1000) {
      return { text: 'Due now!', cls: 't--now' };
    }

    if (diffMs < 0) {
      // ── OVERDUE ──
      if (totalMinutes < 60) {
        const unit = totalMinutes === 1 ? 'minute' : 'minutes';
        return { text: `Overdue by ${totalMinutes} ${unit}`, cls: 't--overdue' };
      }
      if (totalHours < 24) {
        const unit = totalHours === 1 ? 'hour' : 'hours';
        return { text: `Overdue by ${totalHours} ${unit}`, cls: 't--overdue' };
      }
      const unit = totalDays === 1 ? 'day' : 'days';
      return { text: `Overdue by ${totalDays} ${unit}`, cls: 't--overdue' };

    } else {
      // ── FUTURE ──
      if (totalMinutes < 60) {
        const unit = totalMinutes === 1 ? 'minute' : 'minutes';
        return { text: `Due in ${totalMinutes} ${unit}`, cls: 't--soon' };
      }
      if (totalHours < 24) {
        const unit = totalHours === 1 ? 'hour' : 'hours';
        return { text: `Due in ${totalHours} ${unit}`, cls: 't--soon' };
      }
      if (totalDays === 1) {
        return { text: 'Due tomorrow', cls: 't--soon' };
      }
      if (totalDays <= 3) {
        return { text: `Due in ${totalDays} days`, cls: 't--soon' };
      }
      return { text: `Due in ${totalDays} days`, cls: 't--ok' };
    }
  }

  const TIME_STATE_CLASSES = ['t--ok', 't--soon', 't--overdue', 't--now'];

  function renderTimeRemaining() {
    const { text, cls } = computeTimeStatus(DUE_DATE);

    // Swap CSS class
    timeRemainingEl.classList.remove(...TIME_STATE_CLASSES);
    timeRemainingEl.classList.add(cls);

    // Update visible text
    timeRemainingEl.textContent = text;

    // Update aria-label for screen readers
    timeRemainingEl.setAttribute('aria-label', `Time remaining: ${text}`);
  }

  // Initial render immediately on load
  renderTimeRemaining();

  // Refresh every 60 seconds
  setInterval(renderTimeRemaining, 60_000);

  /* ──────────────────────────────────────────────────
     CHECKBOX — complete / un-complete
  ────────────────────────────────────────────────── */

  checkbox.addEventListener('change', function () {
    const isDone = this.checked;

    // Strike-through title
    taskTitle.classList.toggle('is-done', isDone);

    // Update status badge text & data attribute
    if (isDone) {
      statusBadge.textContent = '';                      // clear first
      statusBadge.setAttribute('data-status', 'done');
      statusBadge.setAttribute('aria-label', 'Task status: Done');

      // Re-inject dot then text (dot is a child span)
      const dot = document.createElement('span');
      dot.className = 'status-badge__dot';
      dot.setAttribute('aria-hidden', 'true');
      statusBadge.appendChild(dot);
      statusBadge.appendChild(document.createTextNode(' Done'));
    } else {
      statusBadge.textContent = '';
      statusBadge.setAttribute('data-status', 'pending');
      statusBadge.setAttribute('aria-label', 'Task status: Pending');

      const dot = document.createElement('span');
      dot.className = 'status-badge__dot';
      dot.setAttribute('aria-hidden', 'true');
      statusBadge.appendChild(dot);
      statusBadge.appendChild(document.createTextNode(' Pending'));
    }
  });

  /* ──────────────────────────────────────────────────
     EDIT BUTTON
  ────────────────────────────────────────────────── */

  editBtn.addEventListener('click', function () {
    console.log('edit clicked');
  });

  /* ──────────────────────────────────────────────────
     DELETE BUTTON
  ────────────────────────────────────────────────── */

  deleteBtn.addEventListener('click', function () {
    alert('Delete clicked');
  });

}());
