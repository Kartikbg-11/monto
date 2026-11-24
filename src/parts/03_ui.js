/* ============================================================
   ZONEXA — SHARED UI COMPONENTS + LAYOUT
   ============================================================ */
(function () {
  'use strict';

  const Z = window.Z;

  Z.ui = {
    propertyTypes: {
      buy: ['Industrial Land / Logistic Plot / BTS Plot', 'Industrial Building',
        'Agricultural land suitable for industrial purpose', 'Logistic Park Unit / Single Warehouse/ Godown',
        'Factory Shed', 'Data Centre Plot / Building', 'Cold Storage',
        'Commercial Office (Phase 3)', 'Commercial Showroom'],
      lease: ['Industrial Land / Logistic Plot / BTS Plot', 'Industrial Building',
        'Logistic Park Unit / Single Warehouse/ Godown', 'Factory Shed',
        'Data Centre Plot / Building', 'Cold Storage', 'Commercial Office (Phase 3)', 'Commercial Showroom']
    },
    industries: ['Industrial (Pharmacy)', 'Industrial (Chemical)', 'Industrial (Auto)', 'Logistics',
      'Data Center', 'Pre-Lease', 'Land'],
    cities: ['Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Nagpur', 'Thane', 'Navi Mumbai',
      'Delhi', 'Gurugram', 'Noida', 'Bengaluru', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Kolkata'],
    states: ['Maharashtra', 'Delhi', 'Haryana', 'Uttar Pradesh', 'Karnataka',
      'Telangana', 'Tamil Nadu', 'Gujarat', 'West Bengal'],
    pinColor(cat) {
      if (/land|plot|agricultural/i.test(cat)) return 'var(--z-land)';
      if (/factory|industrial building|shed/i.test(cat)) return 'var(--z-factory)';
      if (/warehouse|godown|logistic park|cold storage/i.test(cat)) return 'var(--z-warehouse)';
      return 'var(--z-text-muted)';
    },
    pinClass(cat) {
      if (/land|plot|agricultural/i.test(cat)) return 'land';
      if (/factory|industrial building|shed/i.test(cat)) return 'factory';
      if (/warehouse|godown|logistic park|cold storage/i.test(cat)) return 'warehouse';
      return 'other';
    },
    propIcon(cat) {
      if (/land|plot|agricultural/i.test(cat)) return '🌳';
      if (/factory|shed/i.test(cat)) return '🏭';
      if (/warehouse|godown|logistic park|cold storage/i.test(cat)) return '📦';
      if (/office|showroom|data centre/i.test(cat)) return '🏢';
      return '🏠';
    },

    /* ---------- Sidebar + topbar layout ---------- */
    layout({ nav, title, accBadge, onMenu }) {
      const acc = Z.session.account();
      let html = `<div class="app" id="appRoot">
        <aside class="sidebar collapsed" id="sidebar">${nav || ''}</aside>
        <div class="main">
          <div class="topbar">
            <div class="flex-center">
              <button class="icon-btn menu-toggle" id="menuToggle">☰</button>
              <span class="page-title">${Z.escape(title || '')}</span>
            </div>
            <div class="right">${accBadge || ''}</div>
          </div>
          <div class="content" id="pageContent"></div>
        </div>
      </div>`;
      document.getElementById('app').innerHTML = html;
      document.getElementById('menuToggle').onclick = () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
      };
      document.getElementById('pageContent').innerHTML = '';
      return document.getElementById('pageContent');
    },

    navLink(href, ico, label, active) {
      return `<a class="nav-link ${active ? 'active' : ''}" href="#${href}">
        <span class="ico">${ico}</span><span>${Z.escape(label)}</span></a>`;
    },
    navSection(label, links) {
      return `<div class="nav-section"><div class="label">${Z.escape(label)}</div>${links}</div>`;
    },

    accountBadge(acc) {
      if (acc.type === 'user') {
        const u = acc.user || {};
        const initials = ((u.firstName || '').charAt(0) || 'U') + ((u.lastName || '').charAt(0) || '');
        return `<div class="flex-center gap-8">
          <button class="icon-btn" id="notifBtn" title="Notifications">🔔<span id="notifDot" class="hidden" style="color:var(--z-danger)">●</span></button>
          <a href="#/profile" class="flex-center gap-8" style="color:var(--z-text);text-decoration:none">
            <div class="avatar">${Z.escape(initials.toUpperCase())}</div>
            <div style="line-height:1.2">
              <div class="fw-700" style="font-size:13px">${Z.escape((u.firstName || '') + ' ' + (u.lastName || ''))}</div>
              <div class="text-xs muted">${Z.escape(u.role || 'User')}</div>
            </div>
          </a>
          <button class="btn btn-sm btn-outline" onclick="Z.auth.logout()">Logout</button>
        </div>`;
      } else {
        const a = acc.admin || {};
        const initials = (a.name || 'A').slice(0, 2).toUpperCase();
        return `<div class="flex-center gap-8">
          <a href="#/admin/profile" class="flex-center gap-8" style="color:var(--z-text);text-decoration:none">
            <div class="avatar" style="background:var(--z-accent)">${Z.escape(initials)}</div>
            <div style="line-height:1.2">
              <div class="fw-700" style="font-size:13px">${Z.escape(a.name || '')}</div>
              <div class="text-xs muted">${Z.escape(a.role === 'super_admin' ? 'Super Admin' : a.role === 'office_admin' ? 'Office Admin' : 'Telecaller')}</div>
            </div>
          </a>
          <button class="btn btn-sm btn-outline" onclick="Z.auth.adminLogout()">Logout</button>
        </div>`;
      }
    },

    /* ---------- Reusable inputs ---------- */
    field(label, inputHtml, opts) {
      opts = opts || {};
      return `<div class="field">
        ${label ? `<label>${Z.escape(label)}${opts.required ? '<span class="req">*</span>' : ''}</label>` : ''}
        ${inputHtml}
        ${opts.hint ? `<div class="hint">${Z.escape(opts.hint)}</div>` : ''}
        ${opts.error ? `<div class="err">${Z.escape(opts.error)}</div>` : ''}
      </div>`;
    },
    input(name, value, opts) {
      opts = opts || {};
      return `<input class="input ${opts.invalid ? 'invalid' : ''}" name="${name}" value="${Z.escape(value || '')}"
        ${opts.placeholder ? 'placeholder="' + Z.escape(opts.placeholder) + '"' : ''}
        ${opts.type ? 'type="' + opts.type + '"' : ''}
        ${opts.required ? 'required' : ''} ${opts.maxlength ? 'maxlength="' + opts.maxlength + '"' : ''}>`;
    },
    select(name, value, options, opts) {
      opts = opts || {};
      const optsHtml = (options || []).map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return `<option value="${Z.escape(v)}" ${v === value ? 'selected' : ''}>${Z.escape(l)}</option>`;
      }).join('');
      return `<select class="select ${opts.invalid ? 'invalid' : ''}" name="${name}" ${opts.required ? 'required' : ''}>
        ${opts.placeholder !== false ? `<option value="">${Z.escape(opts.placeholder || 'Select...')}</option>` : ''}${optsHtml}</select>`;
    },
    textarea(name, value, opts) {
      opts = opts || {};
      return `<textarea class="textarea ${opts.invalid ? 'invalid' : ''}" name="${name}" ${opts.rows ? 'rows="' + opts.rows + '"' : ''}
        ${opts.placeholder ? 'placeholder="' + Z.escape(opts.placeholder) + '"' : ''}>${Z.escape(value || '')}</textarea>`;
    },
    checkbox(name, checked, label) {
      return `<label class="checkbox-row"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}> <span>${Z.escape(label)}</span></label>`;
    },

    /* ---------- Pagination ---------- */
    pagination(page, totalPages, onGo) {
      if (totalPages <= 1) return '';
      let html = '<div class="pagination">';
      html += `<button ${page <= 1 ? 'disabled' : ''} data-pg="${page - 1}">‹</button>`;
      const show = [];
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) show.push(i);
      }
      show.forEach((p, idx) => {
        if (idx > 0 && p - show[idx - 1] > 1) html += '<button disabled>…</button>';
        html += `<button class="${p === page ? 'active' : ''}" data-pg="${p}">${p}</button>`;
      });
      html += `<button ${page >= totalPages ? 'disabled' : ''} data-pg="${page + 1}">›</button>`;
      html += '</div>';
      setTimeout(() => {
        document.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => onGo(Number(b.dataset.pg)));
      }, 0);
      return html;
    },

    /* ---------- Empty state ---------- */
    empty(icon, title, msg, action) {
      return `<div class="empty"><div class="ico">${icon}</div><h3>${Z.escape(title)}</h3>
        <p>${Z.escape(msg || '')}</p>${action || ''}</div>`;
    },

    /* ---------- Tab bar ---------- */
    tabs(tabs, activeKey, onTab) {
      let html = '<div class="tab-bar">';
      tabs.forEach(t => {
        html += `<div class="tab ${t.key === activeKey ? 'active' : ''}" data-tab="${t.key}">${Z.escape(t.label)}${t.count != null ? ` (${t.count})` : ''}</div>`;
      });
      html += '</div>';
      setTimeout(() => {
        document.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => onTab(el.dataset.tab));
      }, 0);
      return html;
    },

    /* ---------- Skeleton ---------- */
    skeletons(n) {
      n = n || 3;
      let html = '<div class="prop-grid">';
      for (let i = 0; i < n; i++) html += `<div class="card"><div class="skeleton" style="height:170px"></div>
        <div class="card-pad"><div class="skeleton" style="height:18px;width:60%"></div>
        <div class="skeleton" style="height:14px;width:40%;margin-top:8px"></div>
        <div class="skeleton" style="height:22px;width:50%;margin-top:12px"></div></div></div>`;
      return html + '</div>';
    },

    /* ---------- Property card ---------- */
    propertyCard(p, listerName, listerVerified) {
      const img = (Z.db.where('propertyImages', i => i.propertyId === p.id).sort((a, b) => (a.order || 0) - (b.order || 0)))[0];
      const thumb = img && img.dataUrl ? img.dataUrl : null;
      const cat = p.propertyType || '';
      const pinClass = Z.ui.pinClass(cat);
      const pinColors = { land: 'var(--z-land)', factory: 'var(--z-factory)', warehouse: 'var(--z-warehouse)', other: 'var(--z-text-muted)' };
      const icon = Z.ui.propIcon(cat);
      return `<div class="prop-card" onclick="location.hash='#/property/${p.id}'">
        <div class="prop-thumb" ${thumb ? `style="background-image:url('${thumb}');background-size:cover;background-position:center"` : ''}>
          ${thumb ? '' : `<div class="ph">${icon}</div>`}
          <span class="tag">${p.listingType === 'buy' ? 'Buy' : 'Lease'}</span>
          ${listerVerified ? `<span class="verified">✓ Verified</span>` : ''}
          <span class="pin-dot" style="position:absolute;bottom:10px;left:10px;background:${pinColors[pinClass]};width:10px;height:10px;border-radius:50%;border:2px solid #fff"></span>
        </div>
        <div class="prop-body">
          <div class="name">${Z.escape(p.name)}</div>
          <div class="loc">📍 ${Z.escape([p.locality, p.city].filter(Boolean).join(', '))}</div>
          <div class="price">${Z.moneyShort(p.price)} ${p.listingType === 'lease' ? '/mo' : ''}
            <small>· ${Z.moneyShort(Math.round(p.price / Math.max(1, p.size)))}/sqft</small></div>
          <div class="prop-meta">
            <span>${icon} ${Z.escape(cat.split(' / ')[0])}</span>
            <span>📐 ${p.size ? p.size.toLocaleString('en-IN') : '-'} ${p.sizeUnit || 'sqft'}</span>
          </div>
        </div>
      </div>`;
    },

    /* ---------- Form helpers ---------- */
    serializeForm(formEl) {
      const out = {};
      // FormData requires an actual <form>; filter panels are <div>s, so gather named
      // inputs/selects/textareas manually when given a non-form container.
      const els = (formEl && formEl.tagName === 'FORM')
        ? Array.from(formEl.elements)
        : Array.from((formEl || document).querySelectorAll('input, select, textarea'));
      els.forEach(el => {
        if (!el.name) return;
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (!el.checked) return;
        }
        if (el.type === 'checkbox') {
          // handled below via data-array / data-bool
          return;
        }
        if (out[el.name] !== undefined) {
          if (!Array.isArray(out[el.name])) out[el.name] = [out[el.name]];
          out[el.name].push(el.value);
        } else {
          out[el.name] = el.value;
        }
      });
      // checkboxes that are arrays
      (formEl || document).querySelectorAll('input[type=checkbox][data-array]').forEach(cb => {
        const k = cb.dataset.array;
        if (!out[k]) out[k] = [];
        if (cb.checked) out[k].push(cb.value);
      });
      // single checkboxes -> boolean
      (formEl || document).querySelectorAll('input[type=checkbox][data-bool]').forEach(cb => {
        out[cb.dataset.bool] = cb.checked;
      });
      return out;
    },

    /* ---------- Filter chip ---------- */
    chip(label, onRemove) {
      const id = 'chip' + Math.random().toString(36).slice(2, 8);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.querySelector('.x').onclick = onRemove;
      }, 0);
      return `<span class="chip" id="${id}">${Z.escape(label)} <span class="x" style="cursor:pointer">✕</span></span>`;
    },

    /* ---------- Loading spinner inline ---------- */
    spinner() {
      return `<div class="center" style="padding:24px"><div class="skeleton" style="height:24px;width:120px;margin:0 auto"></div></div>`;
    }
  };
})();
