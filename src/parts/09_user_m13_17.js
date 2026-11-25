/* ============================================================
   ZONEXA USER APP — MODULES 13-17: Deal Closure, Notifications, Profile/Settings, Enquiries
   ============================================================ */
(function () {
  'use strict';
  const Z = window.Z;
  const R = Z.router;

  /* ---------- MODULE 15: Deal Closure ---------- */
  function renderDealClosures(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Deal Closure', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('') });
    // Buyer side: enquiries where user is buyer
    const enquiries = Z.db.where('enquiries', e => e.buyerId === acc.user.id);
    // Seller side: properties owned
    const myProps = Z.db.where('properties', p => p.sellerId === acc.user.id && p.status === 'Approved');
    const settings = Z.db.get().settings;
    content.innerHTML = `
      <div class="card card-pad mb-16">
        <h3 style="margin:0 0 8px">Deal Closure Status</h3>
        <p class="muted text-sm">Track final outcomes of enquiries and visits. Notifications are sent 1.5 months after enquiry, then every 15 days until both sides confirm closure. Closed properties remain visible for ${settings.dealClosedVisibilityDays} days, then are unpublished.</p>
      </div>
      <div class="card card-pad mb-16">
        <h3 style="margin:0 0 12px">Buyer-side deals</h3>
        ${enquiries.length === 0 ? '<div class="text-sm muted">No enquiries yet.</div>' :
        `<div class="table-wrap"><table class="z-table">
          <thead><tr><th>Property</th><th>Enquiry Date</th><th>Days Since</th><th>Buyer Says</th><th>Seller Says</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${enquiries.map(e => {
      const p = Z.db.findById('properties', e.propertyId);
      const dc = _getOrCreateDeal(e.propertyId, e.id);
      const days = Z.daysBetween(e.createdAt, Z.now());
      return `<tr>
        <td>${p ? Z.escape(p.name) : '—'}</td>
        <td>${Z.fmtDate(e.createdAt)}</td>
        <td>${days}</td>
        <td>${dc.buyerClosed === true ? '<span class="badge badge-green">Yes</span>' : dc.buyerClosed === false ? '<span class="badge badge-red">No</span>' : '<span class="badge badge-gray">Pending</span>'}</td>
        <td>${dc.sellerClosed === true ? '<span class="badge badge-green">Yes</span>' : dc.sellerClosed === false ? '<span class="badge badge-red">No</span>' : '<span class="badge badge-gray">Pending</span>'}</td>
        <td><span class="badge ${dc.status === 'closed' ? 'badge-green' : 'badge-orange'}">${dc.status === 'closed' ? 'Closed' : 'Open'}</span></td>
        <td><button class="btn btn-sm btn-outline" data-bclose="${dc.id}">Update</button></td>
      </tr>`;
    }).join('')}</tbody></table></div>`}
      </div>
      <div class="card card-pad">
        <h3 style="margin:0 0 12px">Seller-side deals (your properties)</h3>
        ${myProps.length === 0 ? '<div class="text-sm muted">No approved properties.</div>' :
        `<div class="table-wrap"><table class="z-table">
          <thead><tr><th>Property</th><th>Enquiries</th><th>Seller Says</th><th>Buyer Confirms</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${myProps.map(p => {
      const propEnqs = Z.db.where('enquiries', e => e.propertyId === p.id);
      const dc = _getOrCreateDeal(p.id, null);
      const buyerConfirms = propEnqs.filter(e => {
        const d = _getOrCreateDeal(p.id, e.id); return d.buyerClosed === true;
      }).length;
      return `<tr>
        <td>${Z.escape(p.name)}</td>
        <td>${propEnqs.length}</td>
        <td>${dc.sellerClosed === true ? '<span class="badge badge-green">Yes</span>' : dc.sellerClosed === false ? '<span class="badge badge-red">No</span>' : '<span class="badge badge-gray">Pending</span>'}</td>
        <td>${buyerConfirms}/${propEnqs.length}</td>
        <td><span class="badge ${dc.status === 'closed' ? 'badge-green' : 'badge-orange'}">${dc.status === 'closed' ? 'Closed' : 'Open'}</span></td>
        <td><button class="btn btn-sm btn-outline" data-sclose="${dc.id}">Update</button></td>
      </tr>`;
    }).join('')}</tbody></table></div>`}
      </div>`;
    document.querySelectorAll('[data-bclose]').forEach(b => b.onclick = () => _openDealUpdate(b.dataset.bclose, 'buyer'));
    document.querySelectorAll('[data-sclose]').forEach(b => b.onclick = () => _openDealUpdate(b.dataset.sclose, 'seller'));
  }
  function _getOrCreateDeal(propertyId, enquiryId) {
    let dc = Z.db.where('dealClosures', d => d.propertyId === propertyId &&
      (enquiryId ? d.enquiryId === enquiryId : !d.enquiryId)).pop();
    if (!dc) dc = Z.db.insert('dealClosures', { propertyId, enquiryId: enquiryId || null,
      buyerClosed: null, sellerClosed: null, status: 'open', buyerUpdatedAt: null, sellerUpdatedAt: null,
      followupSentAt: null });
    return dc;
  }
  function _openDealUpdate(dealId, side) {
    const dc = Z.db.findById('dealClosures', dealId);
    const p = Z.db.findById('properties', dc.propertyId);
    Z.modal.open(`<div class="modal-head"><h3>Update Deal Status</h3><button class="close-x" onclick="Z.modal.close()">&times;</button></div>
      <div class="modal-body">
        <div class="card card-pad mb-16" style="background:var(--z-surface-2)"><div class="fw-700">${Z.escape(p.name)}</div>
        <div class="text-sm muted">${Z.escape(p.locality)}, ${Z.escape(p.city)}</div></div>
        <div class="field"><label>Has the deal been closed?</label></div>
        <div class="flex gap-8">
          <button type="button" class="btn btn-outline" data-dc="true">✓ Yes, deal closed</button>
          <button type="button" class="btn btn-outline" data-dc="false">✗ No</button>
        </div>
        <div class="text-xs muted mt-8">A deal is marked "closed" only when both buyer AND seller confirm. On closure, the property will remain visible for ${Z.db.get().settings.dealClosedVisibilityDays} days before being unpublished.</div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" onclick="Z.modal.close()">Cancel</button></div>`);
    document.querySelectorAll('[data-dc]').forEach(b => b.onclick = () => {
      const val = b.dataset.dc === 'true';
      const patch = side === 'buyer' ? { buyerClosed: val, buyerUpdatedAt: Z.now() } : { sellerClosed: val, sellerUpdatedAt: Z.now() };
      const updated = Z.db.update('dealClosures', dc.id, patch);
      if (updated.buyerClosed === true && updated.sellerClosed === true) {
        Z.db.update('dealClosures', dc.id, { status: 'closed', closedAt: Z.now() });
        // schedule unpublish — mark with expiry date; in real backend this is a scheduled job
        const settings = Z.db.get().settings;
        Z.db.update('properties', p.id, { dealClosedAt: Z.now(),
          scheduledUnpublishAt: Z.addDays(Z.now(), settings.dealClosedVisibilityDays) });
        Z.toast.success('Deal marked as closed! Property will be unpublished in ' + settings.dealClosedVisibilityDays + ' days.');
      } else {
        Z.toast.success('Deal status updated');
      }
      Z.modal.close(); R.go('/deals');
    });
  }

  /* ---------- MODULE 16: Notifications ---------- */
  function renderNotifications(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Notifications', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('notifications') });
    const notifs = Z.db.where('notifications', n => n.userId === acc.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unread = notifs.filter(n => !n.read).length;
    content.innerHTML = `
      <div class="flex-between mb-16">
        <div class="section-title">Notifications ${unread ? `<span class="badge badge-red">${unread} new</span>` : ''}</div>
        <button class="btn btn-outline btn-sm" id="markAllRead">Mark all read</button>
      </div>
      ${notifs.length === 0 ? Z.ui.empty('🔔', 'No notifications', 'You will see alerts here when something happens') :
        `<div class="card">${notifs.map(n => `
          <div class="card-pad" style="border-bottom:1px solid var(--z-border);${n.read ? '' : 'background:#F0F7FF'}">
            <div class="flex-between">
              <div class="fw-700">${Z.escape(n.title)} ${!n.read ? '<span class="dot" style="background:var(--z-danger)"></span>' : ''}</div>
              <span class="text-xs muted">${Z.relTime(n.createdAt)}</span>
            </div>
            <div class="text-sm muted mt-8">${Z.escape(n.message)}</div>
            ${n.link ? `<a href="#${n.link}" class="text-sm mt-8 inline-block">View details ›</a>` : ''}
          </div>`).join('')}</div>`}
    `;
    document.getElementById('markAllRead').onclick = () => {
      notifs.forEach(n => Z.db.update('notifications', n.id, { read: true }));
      Z.toast.success('All marked as read'); R.go('/notifications');
    };
    // notif bell dot
    setTimeout(() => {
      const dot = document.getElementById('notifDot');
      if (dot) dot.classList.toggle('hidden', unread === 0);
    }, 0);
  }

  /* ---------- MODULE 17: Profile & Settings ---------- */
  function renderProfile(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Profile & Settings', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('profile') });
    const u = Z.db.findById('users', acc.user.id);
    const prof = Z.db.where('userProfiles', p => p.userId === u.id).pop();
    const kyc = Z.db.where('kycApplications', k => k.userId === u.id).pop();
    const myProps = Z.db.where('properties', p => p.sellerId === u.id);
    const myEnquiries = Z.db.where('enquiries', e => e.buyerId === u.id);
    const enqReceived = Z.db.where('enquiries', e => e.sellerId === u.id);
    const myReqs = Z.db.where('requirements', r => r.userId === u.id);
    content.innerHTML = `
      <div class="card card-pad mb-16">
        <div class="flex-between wrap gap-12">
          <div class="flex-center gap-16">
            <div class="avatar lg" style="background:${prof && prof.profilePictureUrl ? 'transparent' : 'var(--z-primary-light)'};${prof && prof.profilePictureUrl ? `background-image:url('${prof.profilePictureUrl}');background-size:cover` : ''}">${prof && prof.profilePictureUrl ? '' : Z.escape((u.firstName || 'U').charAt(0))}</div>
            <div>
              <h2 style="margin:0">${Z.escape(u.firstName + ' ' + u.lastName)}</h2>
              <div class="muted">${Z.escape(prof ? prof.designation + ' at ' + prof.companyName : 'User')}</div>
              <div class="text-sm muted">+91 ${Z.escape(u.mobile)} ${u.emailVerified ? '· ✓ Email Verified' : ''}</div>
              <div class="text-sm muted mt-8">KYC: <span class="badge ${u.kycStatus === 'Approved' ? 'badge-green' : u.kycStatus === 'Rejected' ? 'badge-red' : u.kycStatus === 'Pending' ? 'badge-orange' : 'badge-gray'}">${u.kycStatus || 'Not Submitted'}</span></div>
            </div>
          </div>
          <button class="btn btn-outline" id="editProfileBtn">✎ Edit Profile</button>
        </div>
      </div>
      <div class="row">
        <div class="card card-pad" style="flex:1">
          <h3 style="margin:0 0 12px">Quick Stats</h3>
          <div class="stat-grid" style="grid-template-columns:repeat(2,1fr)">
            <div class="stat"><div class="lbl">My Properties</div><div class="val">${myProps.length}</div></div>
            <div class="stat"><div class="lbl">My Enquiries</div><div class="val">${myEnquiries.length}</div></div>
            <div class="stat"><div class="lbl">Enquiries Received</div><div class="val">${enqReceived.length}</div></div>
            <div class="stat"><div class="lbl">My Requirements</div><div class="val">${myReqs.length}</div></div>
          </div>
        </div>
      </div>
      <div class="card card-pad mt-16">
        <h3 style="margin:0 0 12px">Account</h3>
        <a href="#/enquiries" class="btn btn-outline btn-block mb-8 left">📬 My Enquiries</a>
        <a href="#/enquiries-received" class="btn btn-outline btn-block mb-8 left">📥 Enquiries Received</a>
        <a href="#/deals" class="btn btn-outline btn-block mb-8 left">🤝 Deal Closure Status</a>
        <a href="#/notifications" class="btn btn-outline btn-block mb-8 left">🔔 Notification Settings</a>
        <a href="#/support" class="btn btn-outline btn-block mb-8 left">🛟 Customer Support</a>
        <a href="#/privacy" class="btn btn-outline btn-block mb-8 left">🔒 Privacy Policy</a>
        <button class="btn btn-outline btn-block mb-8 left" id="logoutBtn">🚪 Logout</button>
        <button class="btn btn-danger btn-block" id="deleteAccBtn">🗑 Delete Account</button>
      </div>`;
    document.getElementById('editProfileBtn').onclick = () => _openEditProfile(u, prof);
    document.getElementById('logoutBtn').onclick = async () => {
      if (await Z.modal.confirm({ title: 'Logout?', message: 'You will be signed out of this session.' })) Z.auth.logout();
    };
    document.getElementById('deleteAccBtn').onclick = async () => {
      const ok = await Z.modal.confirm({
        title: 'Delete Account?',
        message: 'This will permanently deactivate your account. Your data will be retained as per our data-retention policy but you will lose access.',
        danger: true, confirmText: 'Delete My Account'
      });
      if (!ok) return;
      const reason = await new Promise(resolve => {
        Z.modal.open(`<div class="modal-head"><h3>Reason for deletion</h3><button class="close-x" onclick="Z.modal.close()">&times;</button></div>
          <div class="modal-body"><div class="field">${Z.ui.select('delReason', '', ['No longer using the platform', 'Found a property',
          'Privacy concerns', 'Too many notifications', 'Other'].map(s => ({ value: s, label: s })))}</div></div>
          <div class="modal-foot"><button class="btn btn-primary" id="confirmDelR">Confirm</button></div>`);
        document.getElementById('confirmDelR').onclick = () => {
          resolve(document.querySelector('select[name=delReason]').value);
          Z.modal.close();
        };
      });
      Z.db.update('users', u.id, { status: 'deleted', deletedAt: Z.now(), deletionReason: reason });
      Z.session.endAllForAccount(u.id, 'user');
      Z.audit('user', u.id, 'account_deleted', { reason });
      Z.session.end();
      Z.toast.success('Account scheduled for deletion');
      R.go('/login');
    };
  }
  function _openEditProfile(u, prof) {
    Z.modal.open(`<div class="modal-head"><h3>Edit Profile</h3><button class="close-x" onclick="Z.modal.close()">&times;</button></div>
      <div class="modal-body">
        <div class="row">
          <div class="field"><label>First Name</label>${Z.ui.input('firstName', u.firstName)}</div>
          <div class="field"><label>Last Name</label>${Z.ui.input('lastName', u.lastName)}</div>
        </div>
        <div class="field"><label>Company Name</label>${Z.ui.input('companyName', prof ? prof.companyName : '')}</div>
        <div class="field"><label>Designation</label>${Z.ui.input('designation', prof ? prof.designation : '')}</div>
        <div class="field"><label>City</label>${Z.ui.select('city', prof ? prof.city : '', Z.ui.cities.map(c => ({ value: c, label: c })))}</div>
        <div class="field"><label>Company Address</label>${Z.ui.textarea('companyAddress', prof ? prof.companyAddress : '')}</div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" onclick="Z.modal.close()">Cancel</button>
        <button class="btn btn-primary" id="saveProfile">Save</button></div>`);
    document.getElementById('saveProfile').onclick = () => {
      const f = Z.ui.serializeForm(document.querySelector('.modal-body'));
      Z.db.update('users', u.id, { firstName: f.firstName, lastName: f.lastName });
      if (prof) Z.db.update('userProfiles', prof.id, { companyName: f.companyName, designation: f.designation,
        city: f.city, companyAddress: f.companyAddress });
      Z.modal.close(); Z.toast.success('Profile updated'); R.go('/profile');
    };
  }
  function renderEnquiries(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'My Enquiries', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('profile') });
    const enqs = Z.db.where('enquiries', e => e.buyerId === acc.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    content.innerHTML = `
      <div class="section-title mb-16">My Enquiries (${enqs.length})</div>
      ${enqs.length === 0 ? Z.ui.empty('📬', 'No enquiries yet', 'Enquire on a property to start a conversation') :
      `<div class="card">${enqs.map(e => {
      const p = Z.db.findById('properties', e.propertyId);
      const seller = Z.db.findById('users', e.sellerId);
      const msgs = Z.db.where('messages', m => m.conversationId === e.conversationId).length;
      return `<div class="card-pad" style="border-bottom:1px solid var(--z-border)">
        <div class="flex-between">
          <div><div class="fw-700">${p ? Z.escape(p.name) : '—'}</div>
          <div class="text-sm muted">${Z.escape(seller ? seller.firstName + ' ' + seller.lastName : 'Unknown')} · ${Z.fmtDate(e.createdAt)}</div>
          <div class="text-xs muted">${msgs} messages · status: ${e.status}</div></div>
          <a class="btn btn-sm btn-primary" href="#/chat/${e.conversationId}">Open Chat</a>
        </div></div>`;
    }).join('')}</div>`}`;
  }
  function renderEnquiriesReceived(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Enquiries Received', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('profile') });
    const enqs = Z.db.where('enquiries', e => e.sellerId === acc.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    content.innerHTML = `
      <div class="section-title mb-16">Enquiries Received (${enqs.length})</div>
      ${enqs.length === 0 ? Z.ui.empty('📥', 'No enquiries yet', 'List a property to receive enquiries') :
      `<div class="card">${enqs.map(e => {
      const p = Z.db.findById('properties', e.propertyId);
      const buyer = Z.db.findById('users', e.buyerId);
      return `<div class="card-pad" style="border-bottom:1px solid var(--z-border)">
        <div class="flex-between">
          <div><div class="fw-700">${p ? Z.escape(p.name) : '—'}</div>
          <div class="text-sm muted">From: ${Z.escape(buyer ? buyer.firstName + ' ' + buyer.lastName : 'Unknown')} · ${Z.fmtDate(e.createdAt)}</div>
          <div class="text-sm mt-8">"${Z.escape(e.query)}"</div></div>
          <a class="btn btn-sm btn-primary" href="#/chat/${e.conversationId}">Reply</a>
        </div></div>`;
    }).join('')}</div>`}`;
  }
  function renderSupport(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Customer Support', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('profile') });
    content.innerHTML = `
      <div class="card card-pad">
        <h2 style="margin:0 0 12px">Customer Support</h2>
        <p class="muted">We're here to help. Reach out through any of these channels.</p>
        <div class="kv-grid mt-16">
          <div class="k">Email</div><div class="v">support@zonexa.com</div>
          <div class="k">Phone</div><div class="v">+91 98200 00000</div>
          <div class="k">Support Hours</div><div class="v">Mon–Sat, 10:00 AM – 7:00 PM IST</div>
        </div>
        <div class="divider"></div>
        <h3>Raise a ticket</h3>
        <form id="supportForm">
          <div class="field"><label>Subject</label>${Z.ui.input('subject', '', { placeholder: 'Brief subject' })}</div>
          <div class="field"><label>Message</label>${Z.ui.textarea('message', '', { rows: 4 })}</div>
          <button class="btn btn-primary">Submit Ticket</button>
        </form>
      </div>`;
    document.getElementById('supportForm').onsubmit = e => { e.preventDefault(); Z.toast.success('Support ticket submitted. We will respond within 24 hours.'); R.go('/profile'); };
  }
  function renderPrivacy(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Privacy Policy', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('profile') });
    content.innerHTML = `
      <div class="card card-pad">
        <h2 style="margin:0 0 12px">Privacy Policy</h2>
        <p>Zonexa is committed to protecting your privacy. This policy describes how we collect, use, store and protect your data.</p>
        <h3 class="mt-16">Data We Collect</h3>
        <p class="muted text-sm">We collect personal information (name, mobile, email), company details, KYC documents (PAN, Aadhaar, GST, CIN), property listing data and usage analytics.</p>
        <h3 class="mt-16">How We Use It</h3>
        <p class="muted text-sm">To verify your identity, enable property listings, facilitate buyer-seller communication, prevent fraud and improve our services.</p>
        <h3 class="mt-16">Document Security</h3>
        <p class="muted text-sm">All KYC documents are stored securely with restricted access. PAN and Aadhaar documents are never publicly exposed. Only authorized administrators can review them.</p>
        <h3 class="mt-16">Data Retention</h3>
        <p class="muted text-sm">We retain your data as long as your account is active. Deleted accounts are deactivated; certain records may be retained as required by law.</p>
        <h3 class="mt-16">Contact</h3>
        <p class="muted text-sm">For privacy concerns, contact: privacy@zonexa.com</p>
      </div>`;
  }

  /* ---------- Notification settings ---------- */
  function renderNotifSettings(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({ title: 'Notification Settings', accBadge: Z.ui.accountBadge(acc), nav: Z._userNav('profile') });
    const templates = Z.db.table('notificationTemplates');
    let prefs = Z.db.where('userProfiles', p => p.userId === acc.user.id).pop();
    if (!prefs) prefs = Z.db.insert('userProfiles', { userId: acc.user.id, notifPrefs: {} });
    if (!prefs.notifPrefs) { Z.db.update('userProfiles', prefs.id, { notifPrefs: {} }); prefs.notifPrefs = {}; }
    content.innerHTML = `
      <div class="card card-pad">
        <h2 style="margin:0 0 12px">Notification Settings</h2>
        <p class="muted text-sm">Enable or disable specific notification types. Critical security notifications cannot be disabled.</p>
        <div class="divider"></div>
        ${templates.map(t => `
          <div class="flex-between" style="padding:10px 0;border-bottom:1px solid var(--z-border)">
            <div><div class="fw-700">${Z.escape(t.title)}</div><div class="text-xs muted">${Z.escape(t.body)}</div></div>
            <label class="checkbox-row"><input type="checkbox" data-tpl="${t.key}" ${prefs.notifPrefs[t.key] !== false ? 'checked' : ''}></label>
          </div>`).join('')}
        <button class="btn btn-primary mt-16" id="saveNotif">Save Preferences</button>
      </div>`;
    document.getElementById('saveNotif').onclick = () => {
      const newPrefs = {};
      document.querySelectorAll('[data-tpl]').forEach(cb => { newPrefs[cb.dataset.tpl] = cb.checked; });
      Z.db.update('userProfiles', prefs.id, { notifPrefs: newPrefs });
      Z.toast.success('Notification preferences saved');
    };
  }

  /* Routes */
  R.add('/deals', renderDealClosures);
  R.add('/notifications', renderNotifications);
  R.add('/notifications/settings', renderNotifSettings);
  R.add('/profile', renderProfile);
  R.add('/enquiries', renderEnquiries);
  R.add('/enquiries-received', renderEnquiriesReceived);
  R.add('/support', renderSupport);
  R.add('/privacy', renderPrivacy);
})();
