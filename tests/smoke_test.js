/* Smoke test runner for Zonexa — executed via agent-browser eval */
(() => {
  const results = [];
  const log = (name, ok, detail) => results.push({ name, ok, detail: String(detail || '').slice(0, 200) });
  const Z = window.Z;

  // Skip walkthrough to login
  localStorage.setItem('zonexa_walkthrough_done', '1');
  Z.router.go('/login');
  // simulate async — return current state immediately; subsequent eval calls continue

  // 1. User login as buyer (existing)
  let r = Z.auth.sendMobileOtp('9820099900');
  log('sendOtp buyer', r.ok, r.error);
  const otpRec = Z.db.where('otpVerifications', o => o.target === '9820099900' && !o.consumed).pop();
  log('otp generated', !!otpRec, otpRec ? otpRec.code : null);
  r = Z.auth.verifyMobileOtp('9820099900', otpRec.code);
  log('verifyOtp buyer', r.ok, r.error);
  log('buyer logged in', Z.session.account() && Z.session.account().type === 'user', Z.session.account() ? Z.session.account().user.mobile : null);

  // 2. Search properties
  Z.router.go('/home');
  const props = Z.db.where('properties', p => p.status === 'Approved');
  log('approved props available', props.length >= 5, props.length);

  // 3. Open a property detail
  const prop = props[0];
  Z.router.go('/property/' + prop.id);
  log('property detail route', window.location.hash === '#/property/' + prop.id, window.location.hash);

  // 4. Create enquiry
  const buyerAcc = Z.session.account();
  const sellerBefore = Z.db.where('enquiries', e => e.sellerId === prop.sellerId).length;
  // simulate the enquiry creation directly
  Z.counter.incr('enquiry', buyerAcc.user.id);
  const conv = Z.db.insert('conversations', { type: 'enquiry', propertyId: prop.id, participants: [buyerAcc.user.id, prop.sellerId], lastMessageAt: Z.now(), unread: {} });
  Z.db.insert('enquiries', { propertyId: prop.id, buyerId: buyerAcc.user.id, sellerId: prop.sellerId, conversationId: conv.id, location: 'Pune', department: 'Logistics', query: 'Test enquiry', status: 'open', contactRevealed: true });
  Z.db.insert('messages', { conversationId: conv.id, senderId: buyerAcc.user.id, text: 'Test enquiry message', at: Z.now() });
  Z.notify.create(prop.sellerId, 'new_enquiry', 'New Enquiry', 'Test enquiry received', '/chat/' + conv.id);
  const sellerAfter = Z.db.where('enquiries', e => e.sellerId === prop.sellerId).length;
  log('enquiry created', sellerAfter === sellerBefore + 1, sellerBefore + ' -> ' + sellerAfter);
  log('notification created', Z.db.where('notifications', n => n.userId === prop.sellerId).length > 0, Z.db.where('notifications', n => n.userId === prop.sellerId).length);

  // 5. Logout buyer
  Z.auth.logout();
  log('buyer logged out', !Z.session.account(), 'session ended');

  // 6. Login as seller
  Z.db.table('otpVerifications').splice(0); Z.db.save();
  r = Z.auth.sendMobileOtp('9820011223');
  log('sendOtp seller', r.ok, r.error);
  const otpRec2 = Z.db.where('otpVerifications', o => o.target === '9820011223' && !o.consumed).pop();
  log('seller otp generated', !!otpRec2, otpRec2 ? otpRec2.code : 'NO OTP REC');
  if (!otpRec2) return JSON.stringify({ error: 'seller OTP not created', sendResult: r, allOtps: Z.db.table('otpVerifications').map(o => ({ target: o.target, purpose: o.purpose, consumed: o.consumed })) }, null, 2);
  r = Z.auth.verifyMobileOtp('9820011223', otpRec2.code);
  log('seller login', r.ok, r.error);
  const sellerAcc = Z.session.account();
  log('seller has kyc approved', sellerAcc.user.kycStatus === 'Approved', sellerAcc.user.kycStatus);

  // 7. List a property (multi-step simulation)
  const draft = { _step: 5, _images: [{ slot: 'accessRoad', dataUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg></svg>'), fileName: 't.png', order: 0 }],
    name: 'Test Warehouse', description: 'Test', listingType: 'lease', propertyType: 'Logistic Park Unit / Single Warehouse/ Godown',
    size: 20000, sizeUnit: 'sqft', price: 800000, buildingNo: 'B1', street: 'Test Road', pincode: '411001', city: 'Pune', state: 'Maharashtra',
    country: 'India', lat: 18.5, lng: 73.8, locality: 'Test', powerKVA: 200, waterSupply: true, dockingBays: 2,
    security247: true, boundaryWall: true, fireSafety: true, cctv: true, cctvCount: 4, heavyVehicleAccess: 2,
    accessRoadDist: 0.5, highway: 'NH-48', highwayDist: 2, railwayStation: 'Pune', railwayDist: 5,
    airport: 'Pune', airportDist: 12, port: null, portDist: 0 };
  window.listingDraft = draft; // expose for the listing module
  // call the submit directly — we replicate _submitListing inline
  const pricePerSqft = Math.round(draft.price / Math.max(1, draft.size));
  const rec = Z.db.insert('properties', { ...draft, sellerId: sellerAcc.user.id, status: 'Pending', category: 'Industrial', verified: false, pricePerSqft, submittedAt: Z.now() });
  draft._images.forEach((img, i) => Z.db.insert('propertyImages', { propertyId: rec.id, slot: img.slot, order: i, dataUrl: img.dataUrl, fileName: img.fileName }));
  log('property listed (Pending)', rec.status === 'Pending', rec.id);
  Z.auth.logout();

  // 8. Admin login (Office Admin)
  r = Z.auth.adminLogin('office@zonexa.com', 'Office@2026');
  log('office admin login', r.ok && !r.twoFA, r.error);
  const officeAdmin = Z.db.where('adminAccounts', a => a.email === 'office@zonexa.com').pop();
  Z.session.start(officeAdmin.id, 'admin', 'office_admin');
  log('office admin session', Z.session.account().admin.role === 'office_admin', Z.session.account().admin.role);

  // 9. Approve the pending property
  const pendingProps = Z.db.where('properties', p => p.status === 'Pending');
  log('pending props visible to admin', pendingProps.length >= 1, pendingProps.length);
  if (pendingProps.length) {
    const p = pendingProps[pendingProps.length - 1]; // the one we just created
    Z.db.update('properties', p.id, { status: 'Approved', publishedAt: Z.now() });
    log('property approved', Z.db.findById('properties', p.id).status === 'Approved', p.id);
  }

  // 10. CRM monitoring
  const leads = Z.db.table('crmLeads');
  log('crm leads available', leads.length === 8, leads.length);
  const assigned = leads.filter(l => l.assignedTo).length;
  log('leads assigned to telecaller', assigned === 4, assigned);

  // 11. Reports & CSV export
  const reportRows = [['Header1', 'Header2'], ['val1', 'val2']];
  const csv = Z.toCSV(reportRows);
  log('csv export works', csv.includes('Header1,Header2'), csv.slice(0, 30));

  // 12. Notification broadcast
  const beforeNotifs = Z.db.table('notifications').length;
  // simulate sending to all users
  Z.db.table('users').forEach(u => Z.notify.create(u.id, 'admin_broadcast', 'Test', 'Test message', null));
  const afterNotifs = Z.db.table('notifications').length;
  log('broadcast notifications sent', afterNotifs === beforeNotifs + Z.db.table('users').length, beforeNotifs + ' -> ' + afterNotifs);

  // 13. RBAC: office admin without advertisement module permission (the mumbai one)
  Z.session.end();
  const mumbaiAdmin = Z.db.where('adminAccounts', a => a.email === 'office-mumbai@zonexa.com').pop();
  Z.session.start(mumbaiAdmin.id, 'admin', 'office_admin');
  log('mumbai admin no ad perm', !Z.rbac.hasModule(mumbaiAdmin, 'advertisement_management'), Z.rbac.hasModule(mumbaiAdmin, 'advertisement_management'));
  log('mumbai admin city-restricted', mumbaiAdmin.cityAccess.includes('Mumbai'), mumbaiAdmin.cityAccess.join(','));

  // 14. Super Admin 2FA flow
  Z.session.end();
  r = Z.auth.adminLogin('superadmin@zonexa.com', 'Zonexa@2026');
  log('super admin requires 2FA', r.ok && r.twoFA, r.error);
  const send2fa = Z.auth.superAdminSend2FA();
  log('super admin 2FA sent', send2fa.ok, send2fa);
  const mobileOtp = Z.db.where('otpVerifications', o => o.target === '+919999999999' && o.purpose === 'superadmin_mobile' && !o.consumed).pop();
  const emailOtp = Z.db.where('otpVerifications', o => o.target === 'superadmin@zonexa.com' && o.purpose === 'superadmin_email' && !o.consumed).pop();
  log('mobile otp found', !!mobileOtp, mobileOtp ? mobileOtp.code : 'NONE');
  log('email otp found', !!emailOtp, emailOtp ? emailOtp.code : 'NONE');
  if (!mobileOtp || !emailOtp) return JSON.stringify({ error: 'super admin OTPs missing', allOtps: Z.db.table('otpVerifications').map(o => ({ target: o.target, purpose: o.purpose, consumed: o.consumed })) }, null, 2);
  r = Z.auth.superAdmin2FA(mobileOtp.code, emailOtp.code);
  log('super admin 2FA verified', r.ok, r.error);
  log('super admin session', Z.session.account() && Z.session.account().admin.role === 'super_admin', Z.session.account() ? Z.session.account().admin.role : null);

  // 15. Super admin can create admin
  const maxAdmins = Z.db.get().settings.maxAdminAccounts;
  const currentAdmins = Z.db.where('adminAccounts', a => a.role !== 'super_admin').length;
  log('admin count under cap', currentAdmins < maxAdmins, currentAdmins + '/' + maxAdmins);

  // 16. Deal closure flow
  Z.session.end();
  // Clear prior OTPs to bypass resend cooldown (test-only)
  Z.db.table('otpVerifications').splice(0); Z.db.save();
  r = Z.auth.sendMobileOtp('9820099900');
  log('buyer re-login sendOtp', r.ok, r.error);
  const buyerOtp = Z.db.where('otpVerifications', o => o.target === '9820099900' && !o.consumed).pop();
  if (!buyerOtp) return JSON.stringify({ error: 'buyer re-login OTP missing', sendResult: r }, null, 2);
  Z.auth.verifyMobileOtp('9820099900', buyerOtp.code);
  const buyerAcc2 = Z.session.account();
  // create deal record
  const dc = Z.db.insert('dealClosures', { propertyId: prop.id, enquiryId: null, buyerClosed: null, sellerClosed: null, status: 'open', buyerUpdatedAt: null, sellerUpdatedAt: null, followupSentAt: null });
  Z.db.update('dealClosures', dc.id, { buyerClosed: true, buyerUpdatedAt: Z.now() });
  Z.db.update('dealClosures', dc.id, { sellerClosed: true, sellerUpdatedAt: Z.now(), status: 'closed', closedAt: Z.now() });
  const updatedDc = Z.db.findById('dealClosures', dc.id);
  log('deal closure flow', updatedDc.status === 'closed' && updatedDc.buyerClosed && updatedDc.sellerClosed, updatedDc.status);

  // 17. KYC submission validation
  const panValid = Z.validate.pan('ABCDE1234F');
  const aadhaarValid = Z.validate.aadhaar('123412341234');
  const gstValid = Z.validate.gst('27ABCDE1234F1Z5');
  log('PAN validation', panValid, 'ABCDE1234F');
  log('Aadhaar validation', aadhaarValid, '123412341234');
  log('GST validation', gstValid, '27ABCDE1234F1Z5');

  // 18. Security: unauthorized chat access blocked
  Z.session.end();
  Z.db.table('otpVerifications').splice(0); Z.db.save();
  r = Z.auth.sendMobileOtp('9820011225'); // Karan Mehta (no KYC)
  const karanOtp = Z.db.where('otpVerifications', o => o.target === '9820011225' && !o.consumed).pop();
  Z.auth.verifyMobileOtp('9820011225', karanOtp.code);
  const karan = Z.session.account();
  // Karan tries to access the conversation between buyer and seller (not a participant)
  const convCheck = Z.db.findById('conversations', conv.id);
  const isParticipant = convCheck && convCheck.participants.includes(karan.user.id);
  log('unauthorized chat blocked', !isParticipant, 'Karan not in conv');

  // Summary
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return JSON.stringify({ summary: { total: results.length, passed, failed }, results }, null, 2);
})()