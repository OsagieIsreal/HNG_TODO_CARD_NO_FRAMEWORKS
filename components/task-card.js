/**
 * Todo Task Card — Stage 1a Interactive
 *
 * Comprehensive functionality for todo card:
 *  - Theme toggle with persistence
 *  - Edit mode with save/cancel
 *  - Status control with sync
 *  - Priority visual changes
 *  - Expand/collapse descriptions
 *  - Time tracking with overdue detection
 *  - Accessibility and keyboard support
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────
     ELEMENT REFERENCES
  ────────────────────────────────────────────────── */
  const html                = document.documentElement;
  const themeToggleBtn      = document.getElementById('theme-toggle');
  const toggleLabel         = themeToggleBtn.querySelector('.theme-btn__label');

  const taskCard            = document.querySelector('[data-testid="test-todo-card"]');
  const checkbox            = document.querySelector('[data-testid="test-todo-complete-toggle"]');
  const taskTitle           = document.querySelector('[data-testid="test-todo-title"]');
  const statusBadge         = document.querySelector('[data-testid="test-todo-status"]');
  const statusSelect        = document.querySelector('[data-testid="test-todo-status-control"] .status-control__select');
  const timeRemainingEl     = document.querySelector('[data-testid="test-todo-time-remaining"]');
  const overdueIndicator    = document.querySelector('[data-testid="test-todo-overdue-indicator"]');
  const descriptionEl       = document.querySelector('[data-testid="test-todo-description"]');
  const expandToggle        = document.querySelector('[data-testid="test-todo-expand-toggle"]');
  const dueDateEl           = document.querySelector('[data-testid="test-todo-due-date"]');
  const editBtn             = document.querySelector('[data-testid="test-todo-edit-button"]');
  const deleteBtn           = document.querySelector('[data-testid="test-todo-delete-button"]');
  const editForm            = document.querySelector('[data-testid="test-todo-edit-form"]');
  const editTitleInput      = document.querySelector('[data-testid="test-todo-edit-title-input"]');
  const editDescInput       = document.querySelector('[data-testid="test-todo-edit-description-input"]');
  const editPrioritySelect  = document.querySelector('[data-testid="test-todo-edit-priority-select"]');
  const editDueDateInput    = document.querySelector('[data-testid="test-todo-edit-due-date-input"]');
  const saveBtn             = document.querySelector('[data-testid="test-todo-save-button"]');
  const cancelBtn           = document.querySelector('[data-testid="test-todo-cancel-button"]');
  const priorityIndicator   = document.querySelector('[data-testid="test-todo-priority-indicator"]');
  const priorityBadge       = document.querySelector('[data-testid="test-todo-priority"]');

  /* ──────────────────────────────────────────────────
     CENTRAL STATE MANAGEMENT
  ────────────────────────────────────────────────── */

  /**
   * Central state object managing all task data
   * @type {Object}
   */
  const state = {
    // Core task data (initialized from DOM)
    title: taskTitle.textContent.trim(),
    description: descriptionEl.textContent.trim(),
    status: statusBadge.getAttribute('data-status') || 'pending',
    priority: priorityBadge.getAttribute('data-priority') || 'medium',
    dueDate: new Date('2026-04-17T18:00:00'),

    // UI state flags
    isEditing: false,
    isExpanded: false,

    // Theme
    theme: 'dark',
  };

  // Initialize theme from localStorage
  try {
    const saved = localStorage.getItem('todo-card-theme');
    if (saved === 'light' || saved === 'dark') {
      state.theme = saved;
    }
  } catch (_) {
    /* ignore */
  }

  let timeUpdateInterval = null;

  /* ──────────────────────────────────────────────────
     STATE MANAGEMENT HELPERS
  ────────────────────────────────────────────────── */

  /**
   * Updates a single state property and triggers a render
   * @param {string} key - Property name to update
   * @param {*} value - New value for the property
   */
  function updateState(key, value) {
    if (key in state) {
      state[key] = value;
      render();
    } else {
      console.warn(`State property "${key}" does not exist`);
    }
  }

  /**
   * Renders the UI based on current state
   * Called whenever state changes
   */
  function render() {
    renderTitle();
    renderDescription();
    renderStatus();
    renderPriority();
    renderDueDate();
    renderEditingMode();
    renderTimeRemaining();
    renderTheme();
  }

  /**
   * Renders the task title from state
   */
  function renderTitle() {
    taskTitle.textContent = state.title;
  }

  /**
   * Renders the description from state
   */
  function renderDescription() {
    descriptionEl.textContent = state.description;

    // Handle expand/collapse state
    if (state.isExpanded) {
      descriptionEl.classList.add('is-expanded');
      expandToggle.setAttribute('aria-expanded', 'true');
      expandToggle.setAttribute('aria-label', 'Collapse description');
    } else {
      descriptionEl.classList.remove('is-expanded');
      expandToggle.setAttribute('aria-expanded', 'false');
      expandToggle.setAttribute('aria-label', 'Expand description');
    }
  }

  /**
   * Renders status badge and syncs all related UI elements
   */
  function renderStatus() {
    statusBadge.textContent = '';
    statusBadge.setAttribute('data-status', state.status);

    const dot = document.createElement('span');
    dot.className = 'status-badge__dot';
    dot.setAttribute('aria-hidden', 'true');
    statusBadge.appendChild(dot);

    let statusText = 'Pending';
    let ariaLabel = 'Task status: Pending';

    if (state.status === 'done') {
      statusText = 'Done';
      ariaLabel = 'Task status: Done';
      taskCard.classList.add('is-done');
      taskCard.classList.remove('is-in-progress');
      checkbox.checked = true;
    } else if (state.status === 'in-progress') {
      statusText = 'In Progress';
      ariaLabel = 'Task status: In Progress';
      taskCard.classList.add('is-in-progress');
      taskCard.classList.remove('is-done');
      checkbox.checked = false;
    } else {
      ariaLabel = 'Task status: Pending';
      taskCard.classList.remove('is-done', 'is-in-progress');
      checkbox.checked = false;
    }

    statusBadge.appendChild(document.createTextNode(' ' + statusText));
    statusBadge.setAttribute('aria-label', ariaLabel);
    statusSelect.value = state.status;
  }

  /**
   * Renders priority badge from state
   */
  function renderPriority() {
    const capitalizedPriority = state.priority.charAt(0).toUpperCase() + state.priority.slice(1);
    priorityBadge.textContent = capitalizedPriority;
    priorityBadge.setAttribute('data-priority', state.priority);
    if (priorityIndicator) {
      priorityIndicator.setAttribute('data-priority', state.priority);
    }
  }

  /**
   * Renders the due date from state
   */
  function renderDueDate() {
    const date = state.dueDate;
    const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
    const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    dueDateEl.setAttribute('datetime', iso + 'T18:00:00');
    dueDateEl.textContent = `Due ${formatted}`;
  }

  /**
   * Renders the editing mode UI
   */
  function renderEditingMode() {
    if (!editForm) return;

    const cardSections = {
      statusControl: taskCard.querySelector('.status-control'),
      description: taskCard.querySelector('.description-section'),
      meta: taskCard.querySelector('.todo-card__meta'),
      tags: taskCard.querySelector('.tag-list'),
      divider: taskCard.querySelector('.todo-card__divider'),
      actions: taskCard.querySelector('.todo-card__actions')
    };

    if (state.isEditing) {
      // Show edit form, hide card content
      editForm.removeAttribute('hidden');
      Object.values(cardSections).forEach(section => {
        if (section) section.setAttribute('hidden', '');
      });
      // Focus on title input
      editTitleInput?.focus();
    } else {
      // Hide edit form, show card content
      editForm.setAttribute('hidden', '');
      Object.values(cardSections).forEach(section => {
        if (section) section.removeAttribute('hidden');
      });
      // Return focus to edit button
      editBtn?.focus();
    }
  }

  /**
   * Renders the theme from state
   */
  function renderTheme() {
    html.setAttribute('data-theme', state.theme);

    try {
      localStorage.setItem('todo-card-theme', state.theme);
    } catch (_) {
      /* ignore in restricted environments */
    }

    if (state.theme === 'light') {
      toggleLabel.textContent = 'Dark mode';
      themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
      toggleLabel.textContent = 'Light mode';
      themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
      themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
  }

  /* ──────────────────────────────────────────────────
     EDIT MODE
  ────────────────────────────────────────────────── */

  function openEditMode() {
    // If form doesn't exist yet, return early
    if (!editForm) return;

    // Populate form with current values BEFORE setting isEditing
    // This ensures form is ready before focus is set
    editTitleInput.value = state.title;
    editDescInput.value = state.description;
    editPrioritySelect.value = state.priority;

    // Format due date for datetime-local input
    const dt = new Date(state.dueDate);
    const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    editDueDateInput.value = iso;

    // NOW set isEditing to trigger render with populated form
    updateState('isEditing', true);
  }

  function closeEditMode() {
    updateState('isEditing', false);
  }

  function saveChanges() {
    // If form doesn't exist yet, return early
    if (!editForm) return;

    const newTitle = editTitleInput.value.trim();
    const newDesc = editDescInput.value.trim();
    const newPriority = editPrioritySelect.value;
    const newDueDate = new Date(editDueDateInput.value);

    if (!newTitle) {
      alert('Title cannot be empty');
      return;
    }

    // Update state - this will trigger render()
    updateState('title', newTitle);
    updateState('description', newDesc);
    updateState('priority', newPriority);
    updateState('dueDate', newDueDate);
    closeEditMode();
  }

  // Attach edit mode handlers (only if form exists)
  if (editBtn) {
    editBtn.addEventListener('click', openEditMode);
  }
  
  // Handle form submission
  if (editForm) {
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      saveChanges();
    });
  }
  
  // Handle cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeEditMode();
    });
  }

  /* ──────────────────────────────────────────────────
     STATUS CONTROL & SYNCHRONIZATION
  ────────────────────────────────────────────────── */

  statusSelect.addEventListener('change', function () {
    updateState('status', this.value);
  });

  /* ──────────────────────────────────────────────────
     CHECKBOX & STATUS SYNC
  ────────────────────────────────────────────────── */

  checkbox.addEventListener('change', function () {
    const isDone = this.checked;

    if (isDone) {
      updateState('status', 'done');
    } else {
      updateState('status', 'pending');
    }
  });

  /* ──────────────────────────────────────────────────
     EXPAND/COLLAPSE
  ────────────────────────────────────────────────── */

  expandToggle.addEventListener('click', function () {
    const newExpandedState = !state.isExpanded;
    updateState('isExpanded', newExpandedState);
  });

  // Keyboard support for expand toggle
  expandToggle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.click();
    }
  });

  /* ──────────────────────────────────────────────────
     TIME REMAINING LOGIC
  ────────────────────────────────────────────────── */

  /**
   * Given a due date, returns a human-friendly string
   * and a CSS modifier class for colour coding.
   *
   * @param {Date} dueDate
   * @returns {{ text: string, cls: 't--ok' | 't--soon' | 't--overdue' | 't--now', isOverdue: boolean }}
   */
  function computeTimeStatus(dueDate) {
    const now     = new Date();
    const diffMs  = dueDate - now;
    const absMs   = Math.abs(diffMs);

    const totalSeconds = Math.floor(absMs / 1000);
    const totalMinutes = Math.floor(absMs / (1000 * 60));
    const totalHours   = Math.floor(absMs / (1000 * 60 * 60));
    const totalDays    = Math.floor(absMs / (1000 * 60 * 60 * 24));

    // Within 90 seconds → "Due now!"
    if (absMs < 90 * 1000) {
      return { text: 'Due now!', cls: 't--now', isOverdue: false };
    }

    if (diffMs < 0) {
      // ── OVERDUE ──
      if (totalMinutes < 60) {
        const unit = totalMinutes === 1 ? 'minute' : 'minutes';
        return { text: `Overdue by ${totalMinutes} ${unit}`, cls: 't--overdue', isOverdue: true };
      }
      if (totalHours < 24) {
        const unit = totalHours === 1 ? 'hour' : 'hours';
        return { text: `Overdue by ${totalHours} ${unit}`, cls: 't--overdue', isOverdue: true };
      }
      const unit = totalDays === 1 ? 'day' : 'days';
      return { text: `Overdue by ${totalDays} ${unit}`, cls: 't--overdue', isOverdue: true };

    } else {
      // ── FUTURE ──
      if (totalMinutes < 60) {
        const unit = totalMinutes === 1 ? 'minute' : 'minutes';
        return { text: `Due in ${totalMinutes} ${unit}`, cls: 't--soon', isOverdue: false };
      }
      if (totalHours < 24) {
        const unit = totalHours === 1 ? 'hour' : 'hours';
        return { text: `Due in ${totalHours} ${unit}`, cls: 't--soon', isOverdue: false };
      }
      if (totalDays === 1) {
        return { text: 'Due tomorrow', cls: 't--soon', isOverdue: false };
      }
      if (totalDays <= 3) {
        return { text: `Due in ${totalDays} days`, cls: 't--soon', isOverdue: false };
      }
      return { text: `Due in ${totalDays} days`, cls: 't--ok', isOverdue: false };
    }
  }

  const TIME_STATE_CLASSES = ['t--ok', 't--soon', 't--overdue', 't--now'];

  function renderTimeRemaining() {
    // If task is done, show "Completed" and stop updates
    if (state.status === 'done') {
      timeRemainingEl.textContent = 'Completed';
      timeRemainingEl.classList.remove(...TIME_STATE_CLASSES);
      timeRemainingEl.classList.add('t--done');
      overdueIndicator.setAttribute('hidden', '');
      taskCard.classList.remove('is-overdue');
      return;
    }

    const { text, cls, isOverdue } = computeTimeStatus(state.dueDate);

    // Swap CSS class
    timeRemainingEl.classList.remove(...TIME_STATE_CLASSES);
    timeRemainingEl.classList.add(cls);

    // Update visible text
    timeRemainingEl.textContent = text;

    // Update aria-label for screen readers
    timeRemainingEl.setAttribute('aria-label', `Time remaining: ${text}`);

    // Show/hide overdue indicator
    if (isOverdue) {
      overdueIndicator.removeAttribute('hidden');
      overdueIndicator.setAttribute('aria-label', `Overdue: ${text}`);
      taskCard.classList.add('is-overdue');
    } else {
      overdueIndicator.setAttribute('hidden', '');
      taskCard.classList.remove('is-overdue');
    }
  }

  // Initial render immediately on load
  renderTimeRemaining();

  // Refresh every 45 seconds (between 30-60)
  timeUpdateInterval = setInterval(renderTimeRemaining, 45_000);

  /* ──────────────────────────────────────────────────
     INITIALIZATION
  ────────────────────────────────────────────────── */

  // Sync UI with initial state
  // This ensures status badge, priority, checkbox, and theme are properly initialized
  renderStatus();
  renderPriority();
  renderTheme();

  /* ──────────────────────────────────────────────────
     THEME TOGGLE
  ────────────────────────────────────────────────── */

  themeToggleBtn.addEventListener('click', function () {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    updateState('theme', newTheme);
  });

  /* ──────────────────────────────────────────────────
     DELETE BUTTON
  ────────────────────────────────────────────────── */

  deleteBtn.addEventListener('click', function () {
    alert('Delete clicked');
  });

  /* ──────────────────────────────────────────────────
     CLEANUP
  ────────────────────────────────────────────────── */

  // Clear interval on unload
  window.addEventListener('beforeunload', function () {
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval);
    }
  });

}());
