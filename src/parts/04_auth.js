/* ============================================================
   ZONEXA — AUTH (User mobile+OTP, Admin email+pw / Super Admin 2FA)
   ============================================================ */
(function () {
  'use strict';
  const Z = window.Z;

  Z.auth = {
    /* ---------- User mobile OTP login ---------- */
    sendMobileOtp(mobile) {
      if (!Z.validate.mobile(mobile)) return { ok: false, error: 'Enter a valid mobile number' };
      const can = Z.otp.canResend(mobile);
      if (!can.ok) return { ok: false, error: 'Please wait ' + can.wait + ' seconds to resend OTP' };
      Z.otp.request(mobile, 'login', 'sms');
      return { ok: true };
    },
    verifyMobileOtp(mobile, code) {
      const v = Z.otp.verify(mobile, code, 'login');
      if (!v.ok) return v;
      const user = Z.db.where('users', u => u.mobile === mobile).pop();
      if (!user) {
        // new user — pre-create user record with pending profile
        const newUser = Z.db.insert('users', { mobile, role: 'buyer', status: 'active',
          walkThroughCompleted: true, profileCompleted: false });
        Z.session.start(newUser.id, 'user', newUser.role);
        Z.audit('user', newUser.id, 'register_otp_verified', { mobile });
        return { ok: true, newUser: true };
      }
      if (user.status === 'blocked') return { ok: false, error: 'Your account has been blocked. Contact support.' };
      Z.session.start(user.id, 'user', user.role);
      Z.audit('user', user.id, 'login_otp_verified', { mobile });
      return { ok: true, newUser: !user.profileCompleted };
    },

    /* ---------- Email OTP (for company email verification during registration) ---------- */
    sendEmailOtp(email) {
      if (!Z.validate.email(email)) return { ok: false, error: 'Please enter a valid email address' };
      const can = Z.otp.canResend(email);
      if (!can.ok) return { ok: false, error: 'Please wait ' + can.wait + ' seconds to resend OTP' };
      Z.otp.request(email, 'email_verify', 'email');
      return { ok: true };
    },
    verifyEmailOtp(email, code) {
      return Z.otp.verify(email, code, 'email_verify');
    },

    /* ---------- Complete profile (registration step 2) ---------- */
    completeProfile(form) {
      const acc = Z.session.account();
      if (!acc || acc.type !== 'user' || !acc.user) return { ok: false, error: 'Not authenticated' };
      const u = acc.user;
      // validations
      if (!form.firstName || !/^[A-Za-z\s]+$/.test(form.firstName)) return { ok: false, error: 'First name should contain only alphabets' };
      if (!form.lastName || !/^[A-Za-z\s]+$/.test(form.lastName)) return { ok: false, error: 'Last name should contain only alphabets' };
      if (!form.companyName) return { ok: false, error: 'Company name is required' };
      if (!form.companyAddress) return { ok: false, error: 'Company address is required' };
      if (!form.city || !/^[A-Za-z\s]+$/.test(form.city)) return { ok: false, error: 'City should contain only alphabets' };
      if (form.companyEmail && !Z.validate.email(form.companyEmail)) return { ok: false, error: 'Please enter a valid email address' };
      // role assignment
      const intent = form.businessIntent || 'buy';
      let role = 'buyer';
      if (intent === 'sell') role = 'seller';
      else if (intent === 'both') role = 'buyer_seller';
      else if (intent === 'consultant') role = 'consultant';
      Z.db.update('users', u.id, { firstName: form.firstName, lastName: form.lastName,
        companyEmail: form.companyEmail || null, emailVerified: form.emailVerified || false,
        role, status: 'active', profileCompleted: true });
      Z.db.insert('userProfiles', {
        userId: u.id, companyName: form.companyName, companyAddress: form.companyAddress,
        companyLat: form.companyLat || null, companyLng: form.companyLng || null,
        city: form.city, state: form.state || null, designation: form.designation || null,
        profilePictureUrl: form.profilePictureUrl || null, businessIntent: intent,
        propertyRepresentation: form.propertyRepresentation || 'self',
        industries: form.industries || [], pincode: form.pincode || null
      });
      if (role === 'consultant') {
        Z.db.insert('consultants', { userId: u.id, name: form.firstName + ' ' + form.lastName,
          location: form.city, department: form.consultantDept || null,
          topClients: form.topClients || null, profileDesc: form.profileDesc || null,
          contactMobile: u.mobile, status: 'pending', expertise: form.consultantExpertise || [] });
      }
      Z.audit('user', u.id, 'profile_completed', { role });
      Z.notify.create(u.id, 'welcome', 'Welcome to Zonexa!', 'Your profile has been created successfully. Start exploring properties.', '/home');
      return { ok: true };
    },

    /* ---------- Logout ---------- */
    logout() {
      const acc = Z.session.account();
      if (acc && acc.user) Z.audit('user', acc.user.id, 'logout', {});
      Z.session.end();
      Z.router.go('/login');
    },
    adminLogout() {
      const acc = Z.session.account();
      if (acc && acc.admin) Z.audit('admin', acc.admin.id, 'logout', {});
      Z.session.end();
      Z.router.go('/admin/login');
    },

    /* ---------- Admin email+password login ---------- */
    adminLogin(email, password) {
      email = (email || '').trim().toLowerCase();
      const settings = Z.db.get().settings;
      // Super Admin
      const sa = settings.superAdminCreds;
      if (email === sa.email.toLowerCase()) {
        if (password !== sa.password) return { ok: false, error: 'Invalid credentials. Please try again' };
        // require 2FA
        return { ok: true, twoFA: true, isSuperAdmin: true };
      }
      const admin = Z.db.where('adminAccounts', a => a.email.toLowerCase() === email).pop();
      if (!admin) return { ok: false, error: 'Account not found' };
      if (admin.status !== 'active') return { ok: false, error: 'Account is deactivated. Contact Super Admin.' };
      if (admin.password !== password) {
        admin.failedAttempts = (admin.failedAttempts || 0) + 1;
        Z.db.save();
        if (admin.failedAttempts >= 5) {
          Z.db.update('adminAccounts', admin.id, { status: 'locked', lockedUntil: Z.addDays(Z.now(), 1 / 96) });
          return { ok: false, error: 'Too many failed attempts. Account temporarily locked.' };
        }
        return { ok: false, error: 'Invalid credentials. Please try again' };
      }
      Z.db.update('adminAccounts', admin.id, { failedAttempts: 0 });
      return { ok: true, admin };
    },
    /* Super Admin 2FA — both email + mobile OTP must verify */
    superAdmin2FA(mobileCode, emailCode) {
      const settings = Z.db.get().settings;
      const sa = settings.superAdminCreds;
      const mobileTarget = '+919999999999'; // dev placeholder for super admin mobile
      const mv = Z.otp.verify(mobileTarget, mobileCode, 'superadmin_mobile');
      if (!mv.ok) return { ok: false, error: 'Mobile: ' + mv.error };
      const ev = Z.otp.verify(sa.email, emailCode, 'superadmin_email');
      if (!ev.ok) return { ok: false, error: 'Email: ' + ev.error };
      // find or create super admin account row for session bookkeeping
      let admin = Z.db.where('adminAccounts', a => a.role === 'super_admin').pop();
      if (!admin) {
        admin = Z.db.insert('adminAccounts', { email: sa.email, name: 'Super Admin',
          role: 'super_admin', status: 'active', password: sa.password,
          cityAccess: [], permissions: {} });
      }
      // enforce single active session: terminate others
      Z.session.endAllForAccount(admin.id, 'admin');
      Z.session.start(admin.id, 'admin', 'super_admin');
      Z.audit('admin', admin.id, 'superadmin_login', {});
      return { ok: true };
    },
    superAdminSend2FA() {
      const settings = Z.db.get().settings;
      const sa = settings.superAdminCreds;
      Z.otp.request('+919999999999', 'superadmin_mobile', 'sms');
      Z.otp.request(sa.email, 'superadmin_email', 'email');
      return { ok: true };
    },

    /* Admin forgot password (email OTP) */
    adminSendResetOtp(email) {
      email = (email || '').trim().toLowerCase();
      const settings = Z.db.get().settings;
      if (email === settings.superAdminCreds.email.toLowerCase()) return { ok: true };
      const admin = Z.db.where('adminAccounts', a => a.email.toLowerCase() === email).pop();
      if (!admin) return { ok: false, error: 'Account not found' };
      Z.otp.request(email, 'admin_reset', 'email');
      return { ok: true };
    },
    adminResetPassword(email, code, newPassword) {
      email = (email || '').trim().toLowerCase();
      const settings = Z.db.get().settings;
      const v = Z.otp.verify(email, code, 'admin_reset');
      if (!v.ok) return v;
      const pwErr = Z.passwordPolicy(newPassword);
      if (pwErr) return { ok: false, error: pwErr };
      if (email === settings.superAdminCreds.email.toLowerCase()) {
        settings.superAdminCreds.password = newPassword;
        Z.db.save();
      } else {
        const admin = Z.db.where('adminAccounts', a => a.email.toLowerCase() === email).pop();
        if (admin) {
          Z.db.update('adminAccounts', admin.id, { password: newPassword, failedAttempts: 0 });
          Z.session.endAllForAccount(admin.id, 'admin');
        }
      }
      return { ok: true };
    }
  };
})();
