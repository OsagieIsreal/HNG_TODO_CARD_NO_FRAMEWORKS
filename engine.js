/**
 * TaskFlow UI — engine.js
 *
 * Main engine for the TaskFlow UI application.
 * Handles initialization and global functionality.
 */

(function () {
  'use strict';

  // Initialize the application
  function init() {
    console.log('TaskFlow UI initialized');
    // Load components or other global setup here
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());