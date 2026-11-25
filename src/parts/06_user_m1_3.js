/* ============================================================
   ZONEXA USER APP — MODULES 1-3: Splash, Walkthrough, Login/Register, Home+Search
   ============================================================ */
(function () {
  'use strict';
  const Z = window.Z;
  const R = Z.router;

  /* ---------- MODULE 1: Splash ---------- */
  function renderSplash() {
    document.getElementById('app').innerHTML = `
      <div class="splash-wrap">
        <div class="splash-logo">Z</div>
        <div class="splash-name">ZONEXA</div>
        <div class="splash-tag">Industrial & Commercial Real Estate</div>
        <div class="splash-loading"><div></div></div>
      </div>`;
    setTimeout(() => {
      const acc = Z.session.account();
      if (acc && acc.type === 'user') R.go('/home');
      else {
        const seenWalkthrough = localStorage.getItem('zonexa_walkthrough_done') === '1';
        if (!seenWalkthrough) R.go('/walkthrough');
        else R.go('/login');
      }
    }, 2600);
  }

  /* ---------- MODULE 1.2: Walkthrough ---------- */
  const WALK_SLIDES = [
    { icon: '📣', title: 'Advertise Your Property', text: 'Advertise your industrial & commercial (Phase 3) property to the right users on Zonexa. Reach relevant users searching for properties by location and category.' },
    { icon: '📋', title: 'Property Listing & Management', text: 'Create and manage property listings for Buy or Lease. Add detailed property information and photos. Manage all your listings easily in one place.' },
    { icon: '💬', title: 'Enquiries via Chat', text: 'User enquiries are received through in-app chat. Chat is the primary mode of communication between users and property listers. Connect instantly with chat-based enquiries.' },
    { icon: '✅', title: 'Verification and Trust', text: 'Verified profiles and listings help build trust and genuine connections. Complete your KYC to display a verified badge on your properties.' }
  ];
  let walkIdx = 0;
  function renderWalkthrough() {
    walkIdx = 0;
    _renderWalkSlide();
  }
  function _renderWalkSlide() {
    const s = WALK_SLIDES[walkIdx];
    const isLast = walkIdx === WALK_SLIDES.length - 1;
    document.getElementById('app').innerHTML = `
      <div class="walkthrough-wrap">
        <div class="walk-skip" id="walkSkip">Skip ›</div>
        <div class="walk-card">
          <div class="walk-illust">${s.icon}</div>
          <div class="walk-title">${Z.escape(s.title)}</div>
          <div class="walk-text">${Z.escape(s.text)}</div>
          <div class="walk-dots">${WALK_SLIDES.map((_, i) => `<div class="d ${i === walkIdx ? 'active' : ''}"></div>`).join('')}</div>
          <div class="walk-actions">
            ${walkIdx > 0 ? '<button class="btn btn-outline" id="walkPrev">Back</button>' : ''}
            ${!isLast ? '<button class="btn btn-primary" id="walkNext">Next</button>' : '<button class="btn btn-accent" id="walkDone">Get Started</button>'}
          </div>
        </div>
      </div>`;
    document.getElementById('walkSkip').onclick = _finishWalk;
    if (document.getElementById('walkPrev')) document.getElementById('walkPrev').onclick = () => { walkIdx--; _renderWalkSlide(); };
    const next = document.getElementById('walkNext');
    if (next) next.onclick = () => { walkIdx++; _renderWalkSlide(); };
    const done = document.getElementById('walkDone');
    if (done) done.onclick = _finishWalk;
  }
  function _finishWalk() {
    localStorage.setItem('zonexa_walkthrough_done', '1');
    R.go('/login');
  }

  /* ---------- MODULE 2: Login (Mobile + OTP) ---------- */
  let loginState = { mobile: '', otpSent: false, cooldown: 0, cooldownTimer: null };
  function renderLogin(ctx) {
    const acc = Z.session.account();
    if (acc && acc.type === 'user') return R.go('/home');
    loginState = { mobile: '', otpSent: false, cooldown: 0, cooldownTimer: null };
    document.getElementById('app').innerHTML = `
      <div class="auth-wrap">
        <div class="auth-left">
          <div class="big">Find your next<br>industrial property.</div>
          <div class="lead">Zonexa is a commercial & industrial real-estate platform connecting verified property listers with serious buyers and lessees.</div>
          <div style="margin-top:36px;display:flex;gap:24px">
            <div><div style="font-size:30px;font-weight:800">${Z.db.where('properties', p => p.status === 'Approved').length}+</div><div style="opacity:.7;font-size:12px">Listed Properties</div></div>
            <div><div style="font-size:30px;font-weight:800">${Z.db.where('users', u => u.kycStatus === 'Approved').length}+</div><div style="opacity:.7;font-size:12px">Verified Listers</div></div>
            <div><div style="font-size:30px;font-weight:800">${Z.ui.cities.length}+</div><div style="opacity:.7;font-size:12px">Cities</div></div>
          </div>
        </div>
        <div class="auth-right">
          <div class="auth-card">
            <h1>Welcome to Zonexa</h1>
            <div class="sub">Login or sign up with your mobile number</div>
            <form id="loginForm">
              <div class="field">
                <label>Mobile Number<span class="req">*</span></label>
                <div class="flex-center">
                  <span class="chip" style="font-weight:700">+91</span>
                  <input class="input" id="loginMobile" name="mobile" placeholder="10-digit mobile number"
                    maxlength="10" inputmode="numeric" value="${Z.escape(loginState.mobile || '')}" style="flex:1">
                </div>
                <div class="hint">We'll send you a one-time password</div>
                <div class="err hidden" id="mobileErr"></div>
              </div>
              <div class="field hidden" id="otpField">
                <label>Enter OTP<span class="req">*</span></label>
                <input class="input" id="loginOtp" name="otp" placeholder="6-digit OTP" maxlength="6" inputmode="numeric">
                <div class="hint">Use the OTP shown in the toast above (DEV adapter)</div>
                <div class="err hidden" id="otpErr"></div>
                <div style="margin-top:6px;font-size:12px">
                  <span class="muted">Didn't receive OTP?</span>
                  <a href="#" id="resendLink">Resend OTP <span id="cooldownText"></span></a>
                </div>
              </div>
              <button class="btn btn-primary btn-block btn-lg" id="loginBtn" type="submit">Send OTP</button>
            </form>
            <div style="margin-top:18px;text-align:center" class="text-sm muted">
              Are you an admin? <a href="#/admin/login">Admin login</a>
            </div>
            <div class="card card-pad mt-16" style="background:var(--z-surface-2);font-size:12px">
              <div class="fw-700 mb-8">Demo accounts (DEV):</div>
              <div>Buyer: <b>9820099900</b> · Seller (KYC approved): <b>9820011223</b></div>
              <div>OTP will be shown as a toast on this screen.</div>
            </div>
          </div>
        </div>
      </div>`;

    const mobileInput = document.getElementById('loginMobile');
    mobileInput.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
    document.getElementById('loginForm').onsubmit = (e) => {
      e.preventDefault();
      const mobile = mobileInput.value.trim();
      const otp = document.getElementById('loginOtp').value.trim();
      if (!loginState.otpSent) {
        const r = Z.auth.sendMobileOtp(mobile);
        if (!r.ok) {
          const err = document.getElementById('mobileErr');
          err.textContent = r.error; err.classList.remove('hidden');
          mobileInput.classList.add('invalid');
          return;
        }
        loginState.mobile = mobile; loginState.otpSent = true;
        document.getElementById('otpField').classList.remove('hidden');
        document.getElementById('loginBtn').textContent = 'Verify & Login';
        mobileInput.disabled = true;
        _startCooldown();
        Z.toast.info('OTP sent to ' + mobile + ' (DEV adapter)');
      } else {
        const v = Z.auth.verifyMobileOtp(mobile, otp);
        if (!v.ok) {
          const err = document.getElementById('otpErr');
          err.textContent = v.error; err.classList.remove('hidden');
          document.getElementById('loginOtp').classList.add('invalid');
          return;
        }
        if (v.newUser) {
          Z.toast.success('Mobile verified! Please complete your profile.');
          R.go('/register');
        } else {
          Z.toast.success('Login successful!');
          R.go('/home');
        }
      }
    };
    const resend = document.getElementById('resendLink');
    if (resend) resend.onclick = (e) => {
      e.preventDefault();
      if (loginState.cooldown > 0) return;
      const r = Z.auth.sendMobileOtp(loginState.mobile);
      if (!r.ok) { Z.toast.error(r.error); return; }
      Z.toast.info('New OTP sent');
      _startCooldown();
    };
  }
  function _startCooldown() {
    loginState.cooldown = Z.db.get().settings.otpResendCooldownSeconds;
    const link = document.getElementById('resendLink');
    const text = document.getElementById('cooldownText');
    if (!link) return;
    const tick = () => {
      if (loginState.cooldown > 0) {
        if (text) text.textContent = '(' + loginState.cooldown + 's)';
        loginState.cooldown--;
        setTimeout(tick, 1000);
      } else {
        if (text) text.textContent = '';
      }
    };
    tick();
  }

  /* ---------- MODULE 2.2: Registration / Profile Creation ---------- */
  function renderRegister(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    document.getElementById('app').innerHTML = `
      <div class="auth-wrap">
        <div class="auth-left">
          <div class="big">Complete your<br>Zonexa profile</div>
          <div class="lead">Tell us a bit about yourself so we can connect you with the right properties and opportunities.</div>
        </div>
        <div class="auth-right">
          <div class="auth-card" style="max-width:540px">
            <h1>Create Your Profile</h1>
            <div class="sub">Mobile: <b>+91 ${Z.escape(acc.user.mobile)}</b></div>
            <form id="regForm">
              <div class="row">
                <div class="field"><label>First Name<span class="req">*</span></label>${Z.ui.input('firstName', '', { placeholder: 'Alphabets only' })}</div>
                <div class="field"><label>Last Name<span class="req">*</span></label>${Z.ui.input('lastName', '', { placeholder: 'Alphabets only' })}</div>
              </div>
              <div class="field"><label>Company Name<span class="req">*</span></label>${Z.ui.input('companyName', '', { placeholder: 'Company / firm name' })}</div>
              <div class="row">
                <div class="field"><label>Company Email ID</label>
                  <div class="flex-center gap-8">
                    ${Z.ui.input('companyEmail', '', { placeholder: 'name@company.com', type: 'email' })}
                    <button type="button" class="btn btn-outline btn-sm" id="verifyEmailBtn">Verify</button>
                  </div>
                  <div class="hint" id="emailVerifiedHint">Verify to display verified badge</div>
                </div>
                <div class="field"><label>Designation</label>${Z.ui.input('designation', '', { placeholder: 'e.g. Director' })}</div>
              </div>
              <div class="field"><label>Company Address<span class="req">*</span></label>${Z.ui.textarea('companyAddress', '', { placeholder: 'Full company address' })}</div>
              <div class="row">
                <div class="field"><label>City<span class="req">*</span></label>
                  ${Z.ui.select('city', '', Z.ui.cities.map(c => ({ value: c, label: c })), { placeholder: 'Select city' })}
                </div>
                <div class="field"><label>State</label>${Z.ui.select('state', '', Z.ui.states.map(s => ({ value: s, label: s })), { placeholder: 'Select state' })}</div>
                <div class="field"><label>Pincode</label>${Z.ui.input('pincode', '', { placeholder: '6-digit', maxlength: 6 })}</div>
              </div>
              <div class="field">
                <label>Business Intent<span class="req">*</span></label>
                <div class="flex wrap gap-8" id="intentBox">
                  ${['Buy', 'Sell', 'Both', 'Consultant'].map(o =>
        `<label class="chip" style="cursor:pointer;padding:8px 14px"><input type="radio" name="businessIntent" value="${o.toLowerCase()}" style="margin-right:6px"> ${o}</label>`).join('')}
                </div>
              </div>
              <div class="field">
                <label>Property Representation</label>
                ${Z.ui.select('propertyRepresentation', 'self', [{ value: 'self', label: 'Yourself' }, { value: 'on_behalf', label: 'On Behalf of Others' }], { placeholder: false })}
              </div>
              <div class="field">
                <label>Industry Selection (multi-select)</label>
                <div class="flex wrap gap-8">
                  ${Z.ui.industries.map(i => `<label class="chip" style="cursor:pointer;padding:6px 12px"><input type="checkbox" data-array="industries" value="${Z.escape(i)}" style="margin-right:6px"> ${Z.escape(i)}</label>`).join('')}
                </div>
              </div>
              <div class="field">
                <label>Profile Picture / Live Selfie</label>
                <div class="file-drop" id="selfieDrop">📷 Click to capture / upload a profile picture</div>
                <div id="selfiePreview" class="mt-8"></div>
              </div>
              <div class="field hidden" id="consultantFields">
                <div class="card card-pad" style="background:var(--z-surface-2)">
                  <div class="fw-700 mb-8">Consultant Profile</div>
                  <div class="field"><label>Department / Expertise Area</label>${Z.ui.input('consultantDept', '', { placeholder: 'e.g. Industrial Real Estate' })}</div>
                  <div class="field"><label>Top 5 Clients (Optional)</label>${Z.ui.textarea('topClients', '', { placeholder: 'One per line' })}</div>
                  <div class="field"><label>Brief Profile (5-6 lines)</label>${Z.ui.textarea('profileDesc', '', { rows: 4 })}</div>
                </div>
              </div>
              <button class="btn btn-primary btn-block btn-lg" type="submit">Register</button>
            </form>
          </div>
        </div>
      </div>`;

    // business intent toggle
    document.querySelectorAll('input[name=businessIntent]').forEach(r => r.onchange = () => {
      document.getElementById('consultantFields').classList.toggle('hidden', r.value !== 'consultant' || !r.checked);
    });
    let emailVerified = false;
    document.getElementById('verifyEmailBtn').onclick = () => {
      const email = document.querySelector('input[name=companyEmail]').value.trim();
      if (!email) return Z.toast.error('Please enter email first');
      if (!Z.validate.email(email)) return Z.toast.error('Please enter a valid email address');
      const r = Z.auth.sendEmailOtp(email);
      if (!r.ok) return Z.toast.error(r.error);
      Z.modal.open(`<div class="modal-head"><h3>Verify Email OTP</h3></div>
        <div class="modal-body">
          <p class="muted">An OTP was sent to <b>${Z.escape(email)}</b> (DEV toast).</p>
          <div class="field"><label>Enter OTP</label>${Z.ui.input('verifyOtp', '', { placeholder: '6-digit OTP', maxlength: 6 })}</div>
          <div class="err hidden" id="otpErr2"></div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" id="cancelEmailV">Cancel</button>
          <button class="btn btn-primary" id="confirmEmailV">Verify</button></div>`);
      document.getElementById('cancelEmailV').onclick = Z.modal.close;
      document.getElementById('confirmEmailV').onclick = () => {
        const code = document.querySelector('#verifyOtp').value.trim();
        const v = Z.auth.verifyEmailOtp(email, code);
        if (!v.ok) { const e = document.getElementById('otpErr2'); e.textContent = v.error; e.classList.remove('hidden'); return; }
        emailVerified = true;
        document.getElementById('emailVerifiedHint').innerHTML = '<span class="badge badge-green">✓ Email Verified</span>';
        Z.modal.close(); Z.toast.success('Email verified successfully');
      };
    };
    // selfie
    document.getElementById('selfieDrop').onclick = () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'user';
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        if (f.size > Z.db.get().settings.fileMaxSizeMB * 1024 * 1024) return Z.toast.error('File exceeds size limit');
        const url = await Z.fileToDataURL(f);
        document.getElementById('selfiePreview').innerHTML = `<img src="${url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:2px solid var(--z-border-strong)">`;
        document.getElementById('selfiePreview').dataset.url = url;
      };
      inp.click();
    };
    document.getElementById('regForm').onsubmit = (e) => {
      e.preventDefault();
      const f = Z.ui.serializeForm(e.target);
      if (!f.businessIntent) return Z.toast.error('Please select business intent');
      if (f.companyEmail && !Z.validate.email(f.companyEmail)) return Z.toast.error('Please enter a valid email address');
      const data = {
        ...f,
        industries: Array.isArray(f.industries) ? f.industries : (f.industries ? [f.industries] : []),
        emailVerified,
        profilePictureUrl: document.getElementById('selfiePreview').dataset.url || null
      };
      const r = Z.auth.completeProfile(data);
      if (!r.ok) return Z.toast.error(r.error);
      Z.toast.success('Registration successful!');
      R.go('/home');
    };
  }

  /* ---------- MODULE 3: Home + Search ---------- */
  function renderHome(ctx) {
    const acc = Z.session.account();
    if (!acc || acc.type !== 'user') return R.go('/login');
    const content = Z.ui.layout({
      title: 'Find Properties',
      accBadge: Z.ui.accountBadge(acc),
      nav: _userNav('home')
    });
    // active advertisement on home
    const ad = Z.db.where('advertisements', a => a.status === 'Active' && a.placement === 'home' &&
      new Date(a.startDate) <= new Date() && new Date(a.endDate) >= new Date()).pop();
    const adHtml = ad ? `<div class="banner-ad">
      <div style="font-size:32px">📢</div>
      <div><div class="ttl">${Z.escape(ad.title)}</div><div class="desc">${Z.escape(ad.description)}</div></div>
      <button class="cta" onclick="Z.db.update('advertisements','${ad.id}',{clicks:(Z.db.findById('advertisements','${ad.id}').clicks||0)+1})">Learn More</button>
    </div>` : '';
    content.innerHTML = adHtml + `
      <div class="filter-panel">
        <div class="flex-between mb-8"><div class="fw-700">🔍 Search Properties</div>
          <a href="#/map" class="btn btn-sm btn-outline">🗺 Map View</a></div>
        <div class="filter-grid">
          <div class="field">
            <label>Buy / Lease</label>
            ${Z.ui.select('listingType', ctx.query.listingType || '', [{ value: '', label: 'Buy & Lease' }, { value: 'buy', label: 'Buy' }, { value: 'lease', label: 'Lease' }], { placeholder: false })}
          </div>
          <div class="field">
            <label>City</label>
            ${Z.ui.select('city', ctx.query.city || '', ['', ...Z.ui.cities].map(c => ({ value: c, label: c || 'All Cities' })), { placeholder: false })}
          </div>
          <div class="field">
            <label>Property Type</label>
            ${Z.ui.select('propertyType', ctx.query.propertyType || '', ['', ...Z.ui.propertyTypes.buy].map(t => ({ value: t, label: t || 'All Types' })), { placeholder: false })}
          </div>
          <div class="field">
            <label>Min Budget (₹)</label>${Z.ui.input('minBudget', '', { placeholder: 'e.g. 500000', type: 'number' })}
          </div>
          <div class="field">
            <label>Max Budget (₹)</label>${Z.ui.input('maxBudget', '', { placeholder: 'e.g. 50000000', type: 'number' })}
          </div>
          <div class="field">
            <label>Min Size</label>${Z.ui.input('minSize', '', { placeholder: 'sqft', type: 'number' })}
          </div>
          <div class="field">
            <label>Max Size</label>${Z.ui.input('maxSize', '', { placeholder: 'sqft', type: 'number' })}
          </div>
          <div class="field">
            <label>Connectivity</label>
            <div class="flex wrap gap-8">
              ${['Access Road', 'Highway', 'Railway', 'Airport', 'Port'].map(c =>
        `<label class="chip" style="cursor:pointer;padding:5px 10px"><input type="checkbox" data-array="connectivity" value="${c}" style="margin-right:5px"> ${c}</label>`).join('')}
            </div>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline" id="resetBtn">Reset</button>
          <button class="btn btn-primary" id="searchBtn">Apply Filters</button>
        </div>
      </div>
      <div class="flex-between mb-16">
        <div class="section-title" id="resultTitle">Recommended Properties</div>
        <div class="text-sm muted" id="resultCount"></div>
      </div>
      <div id="results">${Z.ui.skeletons(6)}</div>`;

    const doSearch = () => {
      const f = Z.ui.serializeForm(document.querySelector('.filter-panel'));
      const filters = { listingType: f.listingType, city: f.city, propertyType: f.propertyType,
        minBudget: f.minBudget, maxBudget: f.maxBudget, minSize: f.minSize, maxSize: f.maxSize,
        connectivity: Array.isArray(f.connectivity) ? f.connectivity : (f.connectivity ? [f.connectivity] : []) };
      const results = _filterProperties(filters);
      const guest = !acc.user.profileCompleted;
      document.getElementById('resultTitle').textContent = 'Search Results';
      document.getElementById('resultCount').textContent = results.length + ' properties found';
      // increment ad impression if shown
      if (ad) Z.db.update('advertisements', ad.id, { impressions: (ad.impressions || 0) + 1 });
      _renderPropList('results', results, guest);
    };
    document.getElementById('searchBtn').onclick = doSearch;
    document.getElementById('resetBtn').onclick = () => R.go('/home');
    setTimeout(doSearch, 150);
  }

  function _filterProperties(filters) {
    let props = Z.db.where('properties', p => p.status === 'Approved');
    if (filters.listingType) props = props.filter(p => p.listingType === filters.listingType);
    if (filters.city) props = props.filter(p => p.city === filters.city);
    if (filters.state) props = props.filter(p => p.state === filters.state);
    if (filters.propertyType) props = props.filter(p => p.propertyType === filters.propertyType);
    if (filters.minBudget) props = props.filter(p => p.price >= Number(filters.minBudget));
    if (filters.maxBudget) props = props.filter(p => p.price <= Number(filters.maxBudget));
    if (filters.minSize) props = props.filter(p => p.size >= Number(filters.minSize));
    if (filters.maxSize) props = props.filter(p => p.size <= Number(filters.maxSize));
    if (filters.locality) props = props.filter(p => (p.locality || '').toLowerCase().includes(filters.locality.toLowerCase()));
    if (filters.connectivity && filters.connectivity.length) {
      props = props.filter(p => {
        return filters.connectivity.every(c => {
          if (c === 'Access Road') return p.accessRoadDist != null;
          if (c === 'Highway') return p.highway;
          if (c === 'Railway') return p.railwayStation;
          if (c === 'Airport') return p.airport;
          if (c === 'Port') return p.port;
          return false;
        });
      });
    }
    return props.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  }
  function _renderPropList(targetId, props, guest) {
    const el = document.getElementById(targetId);
    if (!props.length) {
      el.innerHTML = Z.ui.empty('🔍', 'No properties found', 'Try adjusting your filters or expanding your budget range.');
      return;
    }
    // pagination
    const pageSize = 8;
    const totalPages = Math.ceil(props.length / pageSize);
    let page = 1;
    const render = () => {
      const start = (page - 1) * pageSize;
      const slice = props.slice(start, start + pageSize);
      el.innerHTML = `<div class="prop-grid">${slice.map(p => {
        const seller = Z.db.findById('users', p.sellerId);
        const listerVerified = seller && seller.kycStatus === 'Approved';
        return Z.ui.propertyCard(p, seller ? seller.firstName : '', listerVerified);
      }).join('')}</div>${Z.ui.pagination(page, totalPages, p => { page = p; render(); })}`;
    };
    render();
    // guest view tracking
    if (guest) {
      const viewed = Z.counter.get('guest_property_view', Z.deviceId());
      // count actual opens handled in property detail; show warning banner
      const cap = Z.db.get().settings.guestPropertyViewCap;
      if (viewed >= cap) {
        el.insertAdjacentHTML('afterbegin', `<div class="card card-pad mb-16" style="background:#FEF3CD;border-color:#F6E4A6">
          <div class="fw-700">⚠ Guest view limit reached</div>
          <div class="text-sm muted">Please <a href="#/login">login</a> to continue viewing properties.</div>
        </div>`);
      }
    }
  }

  Z.deviceId = function () {
    let id = localStorage.getItem('zonexa_device_id');
    if (!id) { id = 'dev-' + Math.random().toString(36).slice(2, 12); localStorage.setItem('zonexa_device_id', id); }
    return id;
  };

  /* ---------- User nav ---------- */
  function _userNav(active) {
    const links = [
      Z.ui.navLink('/home', '🏠', 'Home', active === 'home'),
      Z.ui.navLink('/map', '🗺️', 'Map View', active === 'map'),
      Z.ui.navLink('/requirements', '📋', 'Requirements', active === 'requirements'),
      Z.ui.navLink('/my-properties', '🏢', 'My Properties', active === 'my-properties'),
      Z.ui.navLink('/kyc', '🪪', 'KYC Verification', active === 'kyc'),
      Z.ui.navLink('/chat', '💬', 'Messages', active === 'chat'),
      Z.ui.navLink('/notifications', '🔔', 'Notifications', active === 'notifications'),
      Z.ui.navLink('/profile', '👤', 'Profile & Settings', active === 'profile')
    ];
    return Z.ui.navSection('User', links.join(''));
  }

  /* Routes registration */
  R.add('/', renderSplash);
  R.add('/walkthrough', renderWalkthrough);
  R.add('/login', renderLogin);
  R.add('/register', renderRegister);
  R.add('/home', renderHome);

  /* expose nav for other modules */
  Z._userNav = _userNav;
})();
