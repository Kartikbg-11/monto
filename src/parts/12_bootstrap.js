/* ============================================================
   ZONEXA PHASE I — APPLICATION BOOTSTRAP
   Seeds DB on first load, hydrates notification bell, starts router
   ============================================================ */
(function () {
  'use strict';
  const Z = window.Z;

  // Initialize DB
  Z.db.load();
  // Seed if empty
  if (!Z.seed()) {
    // already seeded; nothing to do
  }

  // Refresh notification dot periodically
  function refreshNotifDot() {
    const acc = Z.session.account();
    const dot = document.getElementById('notifDot');
    if (!dot) return;
    if (acc && acc.type === 'user') {
      const unread = Z.db.where('notifications', n => n.userId === acc.user.id && !n.read).length;
      dot.classList.toggle('hidden', unread === 0);
    }
  }
  setInterval(refreshNotifDot, 5000);

  // Default route guard
  Z.router.add('/admin', (ctx, acc) => {
    if (acc && acc.type === 'admin') Z.router.go('/admin/dashboard');
    else Z.router.go('/admin/login');
  });

  // Start
  Z.router.start();

  // If landing at root, splash will handle the redirect
})();
