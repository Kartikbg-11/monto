/* ============================================================
   ZONEXA — SEED DATA (super admin, demo admins, properties, leads)
   ============================================================ */
(function () {
  'use strict';
  const Z = window.Z;

  Z.seed = function () {
    const db = Z.db.get();
    if (db.users.length > 0 || db.adminAccounts.length > 0) return false; // already seeded

    /* Super Admin is created lazily on first login, but we add the seed Office Admins + Telecaller */
    const officeAdmin = Z.db.insert('adminAccounts', {
      email: 'office@zonexa.com', name: 'Priya Office', role: 'office_admin',
      status: 'active', password: 'Office@2026', cityAccess: [],
      permissions: {
        user_management: true, user_onboarding: true, property_management: true,
        brokerlist_management: true, advertisement_management: true,
        map_enquiry_config: true, notification_management: true, flag_dispute: true
      }, failedAttempts: 0
    });
    Z.db.insert('adminAccounts', {
      email: 'tele@zonexa.com', name: 'Ravi Tele', role: 'telecaller', status: 'active',
      password: 'Tele@2026', cityAccess: [], permissions: {}, failedAttempts: 0
    });
    Z.db.insert('adminAccounts', {
      email: 'office-mumbai@zonexa.com', name: 'Anjali Mumbai', role: 'office_admin', status: 'active',
      password: 'Office@2026', cityAccess: ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai'],
      permissions: { user_management: true, property_management: true, flag_dispute: true,
        notification_management: true, map_enquiry_config: true, advertisement_management: false,
        brokerlist_management: false, user_onboarding: false }, failedAttempts: 0
    });

    /* Demo sellers + KYC + properties */
    const sellers = [
      { firstName: 'Rohit', lastName: 'Sharma', mobile: '9820011223', company: 'Sharma Industrial Realty',
        city: 'Pune', state: 'Maharashtra', kycApproved: true, pincode: '411001' },
      { firstName: 'Meera', lastName: 'Iyer', mobile: '9820011224', company: 'Iyer Logistics Parks',
        city: 'Mumbai', state: 'Maharashtra', kycApproved: true, pincode: '400701' },
      { firstName: 'Karan', lastName: 'Mehta', mobile: '9820011225', company: 'Mehta Manufacturing',
        city: 'Nashik', state: 'Maharashtra', kycApproved: false, pincode: '422001' }
    ];
    const sellerUsers = sellers.map(s => {
      const u = Z.db.insert('users', { mobile: s.mobile, role: 'buyer_seller', status: 'active',
        firstName: s.firstName, lastName: s.lastName, companyEmail: s.firstName.toLowerCase() + '@' + s.company.toLowerCase().replace(/\s+/g, '') + '.com',
        emailVerified: true, walkThroughCompleted: true, profileCompleted: true });
      Z.db.insert('userProfiles', { userId: u.id, companyName: s.company, companyAddress: 'Plot ' + (Math.floor(Math.random() * 90) + 10) + ', Industrial Area',
        companyLat: 18.5 + Math.random() * 1.2, companyLng: 73.5 + Math.random() * 1.2,
        city: s.city, state: s.state, designation: 'Director', businessIntent: 'both', propertyRepresentation: 'self',
        industries: ['Industrial (Auto)', 'Logistics'], pincode: s.pincode });
      if (s.kycApproved) {
        Z.db.insert('kycApplications', { userId: u.id, status: 'Approved', panNumber: 'ABCDE1234F', panDocUrl: null,
          aadhaarNumber: '123412341234', aadhaarDocUrl: null, gstNumber: '27ABCDE1234F1Z5', gstDocUrl: null,
          submittedAt: Z.addDays(Z.now(), -30), reviewedAt: Z.addDays(Z.now(), -25), reviewedBy: null, rejectionReason: null });
        Z.db.update('users', u.id, { kycStatus: 'Approved' });
      } else {
        Z.db.insert('kycApplications', { userId: u.id, status: 'Pending', panNumber: 'PQRSX5678G', panDocUrl: null,
          aadhaarNumber: '987698769876', aadhaarDocUrl: null, gstNumber: null, gstDocUrl: null,
          submittedAt: Z.addDays(Z.now(), -3), reviewedAt: null, reviewedBy: null, rejectionReason: null });
        Z.db.update('users', u.id, { kycStatus: 'Pending' });
      }
      return u;
    });

    /* Buyer */
    Z.db.insert('users', { mobile: '9820099900', role: 'buyer', status: 'active', firstName: 'Aman', lastName: 'Verma',
      companyEmail: 'aman@buyerco.com', emailVerified: true, walkThroughCompleted: true, profileCompleted: true,
      kycStatus: null });
    Z.db.insert('userProfiles', { userId: Z.db.where('users', u => u.mobile === '9820099900').pop().id,
      companyName: 'Verma Trading', companyAddress: 'MIDC, Pune', city: 'Pune', state: 'Maharashtra',
      designation: 'Procurement Head', businessIntent: 'buy', propertyRepresentation: 'self',
      industries: ['Logistics'], pincode: '411019' });

    /* Properties */
    const propertySeeds = [
      { name: 'Chakan Warehouse W1', listingType: 'lease', propertyType: 'Logistic Park Unit / Single Warehouse/ Godown',
        city: 'Pune', state: 'Maharashtra', locality: 'Chakan', pincode: '410501', lat: 18.78, lng: 73.86,
        size: 50000, sizeUnit: 'sqft', price: 1500000, sellerIdx: 0, status: 'Approved',
        desc: 'Grade-A warehouse with high clear height, docking bays and heavy vehicle access. Premium location in Chakan MIDC.',
        power: 500, water: true, security247: true, boundaryWall: true, fireSafety: true, dockingBays: 6, cctv: true, cctvCount: 12, heavyVehicleAccess: 4,
        accessRoadDist: 0.5, highwayDist: 2, railwayDist: 8, airportDist: 22, portDist: 120 },
      { name: 'Talegaon Factory Shed F2', listingType: 'buy', propertyType: 'Factory Shed',
        city: 'Pune', state: 'Maharashtra', locality: 'Talegaon', pincode: '410507', lat: 18.74, lng: 73.74,
        size: 30000, sizeUnit: 'sqft', price: 120000000, sellerIdx: 0, status: 'Approved',
        desc: 'Industrial factory shed suitable for manufacturing. Steel structure, 3-phase power.',
        power: 250, water: true, security247: false, boundaryWall: true, fireSafety: true, dockingBays: 2, cctv: true, cctvCount: 6, heavyVehicleAccess: 2,
        accessRoadDist: 0.3, highwayDist: 1.5, railwayDist: 5, airportDist: 25, portDist: 130 },
      { name: 'Bhiwandi Industrial Land L3', listingType: 'buy', propertyType: 'Industrial Land / Logistic Plot / BTS Plot',
        city: 'Thane', state: 'Maharashtra', locality: 'Bhiwandi', pincode: '421302', lat: 19.30, lng: 73.06,
        size: 5, sizeUnit: 'acres', price: 250000000, sellerIdx: 1, status: 'Approved',
        desc: 'Ready industrial plot for BTS development. Clear title, MIDC approved.',
        power: 0, water: true, security247: false, boundaryWall: true, fireSafety: false, dockingBays: 0, cctv: false, cctvCount: 0, heavyVehicleAccess: 2,
        accessRoadDist: 1, highwayDist: 3, railwayDist: 12, airportDist: 35, portDist: 60 },
      { name: 'Navi Mumbai Cold Storage C4', listingType: 'lease', propertyType: 'Cold Storage',
        city: 'Navi Mumbai', state: 'Maharashtra', locality: 'Taloja', pincode: '410208', lat: 19.09, lng: 73.10,
        size: 25000, sizeUnit: 'sqft', price: 950000, sellerIdx: 1, status: 'Approved',
        desc: 'Temperature controlled cold storage facility with multiple chambers. -25°C to +4°C.',
        power: 750, water: true, security247: true, boundaryWall: true, fireSafety: true, dockingBays: 4, cctv: true, cctvCount: 8, heavyVehicleAccess: 3,
        accessRoadDist: 0.4, highwayDist: 2.5, railwayDist: 6, airportDist: 30, portDist: 45 },
      { name: 'Nashik Factory Building F5', listingType: 'lease', propertyType: 'Industrial Building',
        city: 'Nashik', state: 'Maharashtra', locality: 'Ambad', pincode: '422010', lat: 19.95, lng: 73.78,
        size: 40000, sizeUnit: 'sqft', price: 800000, sellerIdx: 2, status: 'Pending',
        desc: 'Spacious industrial building suitable for auto components manufacturing.',
        power: 400, water: true, security247: true, boundaryWall: true, fireSafety: true, dockingBays: 3, cctv: true, cctvCount: 10, heavyVehicleAccess: 3,
        accessRoadDist: 0.6, highwayDist: 4, railwayDist: 9, airportDist: 18, portDist: 200 },
      { name: 'Pune Data Centre Plot D6', listingType: 'buy', propertyType: 'Data Centre Plot / Building',
        city: 'Pune', state: 'Maharashtra', locality: 'Hinjewadi', pincode: '411057', lat: 18.59, lng: 73.74,
        size: 3, sizeUnit: 'acres', price: 180000000, sellerIdx: 0, status: 'Approved',
        desc: 'Tier-3 ready data centre plot with redundant power grid connections.',
        power: 2000, water: true, security247: true, boundaryWall: true, fireSafety: true, dockingBays: 1, cctv: true, cctvCount: 16, heavyVehicleAccess: 2,
        accessRoadDist: 0.2, highwayDist: 1, railwayDist: 14, airportDist: 28, portDist: 140 },
      { name: 'Nagpur Warehouse W7', listingType: 'lease', propertyType: 'Logistic Park Unit / Single Warehouse/ Godown',
        city: 'Nagpur', state: 'Maharashtra', locality: 'Wadi', pincode: '440023', lat: 21.16, lng: 79.05,
        size: 35000, sizeUnit: 'sqft', price: 620000, sellerIdx: 1, status: 'Approved',
        desc: 'Logistics warehouse on Wardha Road with easy highway access.',
        power: 300, water: true, security247: true, boundaryWall: true, fireSafety: true, dockingBays: 5, cctv: true, cctvCount: 9, heavyVehicleAccess: 4,
        accessRoadDist: 0.5, highwayDist: 1.2, railwayDist: 7, airportDist: 12, portDist: 700 },
      { name: 'Aurangabad Industrial Land L8', listingType: 'buy', propertyType: 'Agricultural land suitable for industrial purpose',
        city: 'Aurangabad', state: 'Maharashtra', locality: 'Shendra', pincode: '431107', lat: 19.85, lng: 75.36,
        size: 8, sizeUnit: 'acres', price: 96000000, sellerIdx: 2, status: 'Approved',
        desc: 'Agricultural land convertible for industrial use. Near Shendra MIDC.',
        power: 0, water: true, security247: false, boundaryWall: false, fireSafety: false, dockingBays: 0, cctv: false, cctvCount: 0, heavyVehicleAccess: 1,
        accessRoadDist: 1.5, highwayDist: 5, railwayDist: 11, airportDist: 16, portDist: 360 },
      { name: 'Chennai Logistic Park L9', listingType: 'lease', propertyType: 'Logistic Park Unit / Single Warehouse/ Godown',
        city: 'Chennai', state: 'Tamil Nadu', locality: 'Sriperumbudur', pincode: '602105', lat: 12.97, lng: 79.94,
        size: 60000, sizeUnit: 'sqft', price: 1500000, sellerIdx: 0, status: 'Approved',
        desc: 'Grade A logistics park unit on Chennai-Bangalore highway corridor.',
        power: 600, water: true, security247: true, boundaryWall: true, fireSafety: true, dockingBays: 8, cctv: true, cctvCount: 14, heavyVehicleAccess: 6,
        accessRoadDist: 0.3, highwayDist: 1, railwayDist: 9, airportDist: 40, portDist: 35 }
    ];

    propertySeeds.forEach((s, idx) => {
      const seller = sellerUsers[s.sellerIdx];
      const p = Z.db.insert('properties', {
        name: s.name, listingType: s.listingType, propertyType: s.propertyType,
        description: s.desc,
        category: 'Industrial',
        city: s.city, state: s.state, locality: s.locality, pincode: s.pincode,
        buildingNo: 'B-' + (100 + idx), street: s.locality + ' Road', landmark: s.locality + ' MIDC',
        lat: s.lat, lng: s.lng,
        size: s.size, sizeUnit: s.sizeUnit,
        price: s.price, pricePerSqft: s.sizeUnit === 'acres' ? Math.round(s.price / s.size / 43560) : Math.round(s.price / s.size),
        sellerId: seller.id, status: s.status, rejectedReason: null,
        powerKVA: s.power, waterSupply: s.water, security247: s.security247, boundaryWall: s.boundaryWall,
        fireSafety: s.fireSafety, dockingBays: s.dockingBays, cctv: s.cctv, cctvCount: s.cctvCount, heavyVehicleAccess: s.heavyVehicleAccess,
        accessRoadDist: s.accessRoadDist, highway: 'NH-48', highwayDist: s.highwayDist,
        railwayStation: s.locality + ' Stn', railwayDist: s.railwayDist,
        airport: s.city + ' Airport', airportDist: s.airportDist,
        port: s.portDist < 100 ? 'JNPT Port' : null, portDist: s.portDist,
        verified: s.status === 'Approved' && seller.kycApproved,
        views: 0, publishedAt: s.status === 'Approved' ? Z.addDays(Z.now(), -idx - 1) : null,
        submittedAt: Z.addDays(Z.now(), -idx - 5)
      });
      // synthesize a gradient "image" placeholder as a data URL
      const colors = ['#0F4C75', '#00B4A6', '#2E9E5B', '#E8833A', '#2C7BE5', '#6B2DA8', '#1A9E5A', '#DC2F3C', '#3282B8'];
      const c = colors[idx % colors.length];
      // Use encodeURIComponent (not btoa) so emoji/unicode survives into the data URL
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>
        <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c}'/><stop offset='1' stop-color='#0A3556'/></linearGradient></defs>
        <rect width='400' height='240' fill='url(#g)'/><text x='200' y='135' font-family='sans-serif' font-size='40' fill='rgba(255,255,255,.9)' text-anchor='middle'>${Z.escape(s.name)}</text>
        <text x='200' y='175' font-family='sans-serif' font-size='14' fill='rgba(255,255,255,.8)' text-anchor='middle'>${Z.escape(s.city)} - ${s.listingType === 'buy' ? 'Buy' : 'Lease'}</text></svg>`;
      const dataUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
      ['accessRoad', 'externalBuilding', 'internalBuilding', 'office'].forEach((slot, i) => {
        Z.db.insert('propertyImages', { propertyId: p.id, slot, order: i, dataUrl, fileName: slot + '.png' });
      });
    });

    /* Sample requirement */
    const buyer = Z.db.where('users', u => u.mobile === '9820099900').pop();
    Z.db.insert('requirements', {
      userId: buyer.id, title: 'Need 30,000 sqft warehouse in Pune',
      listingType: 'lease', propertyType: 'Logistic Park Unit / Single Warehouse/ Godown',
      minBudget: 700000, maxBudget: 1300000, landMin: null, landMax: null,
      buildingMin: 25000, buildingMax: 35000,
      startDate: Z.today(), endDate: Z.addDays(Z.today(), 60),
      city: 'Pune', state: 'Maharashtra', locality: 'Chakan', lat: 18.78, lng: 73.86,
      pincode: '410501', status: 'Active', views: 47
    });

    /* CRM broker list */
    const crmList = Z.db.insert('crmLists', { name: 'Pune Brokers Batch 1',
      listId: 'ZXLL001', uploadedAt: Z.now(), uploadedBy: null, count: 0 });
    const crmBrokers = [
      { name: 'Sai Realty', mobile: '9830011101', city: 'Pune', state: 'Maharashtra', email: 'sai@realty.in', address: 'FC Road', alt: '' },
      { name: 'Mahesh Properties', mobile: '9830011102', city: 'Pune', state: 'Maharashtra', email: '', address: 'Kothrud', alt: '' },
      { name: 'Shreeji Brokers', mobile: '9830011103', city: 'Mumbai', state: 'Maharashtra', email: 'shreeji@b.in', address: 'Andheri', alt: '' },
      { name: 'Apex Industrial', mobile: '9830011104', city: 'Nashik', state: 'Maharashtra', email: '', address: 'Ambad', alt: '' },
      { name: 'Verma Estates', mobile: '9830011105', city: 'Nagpur', state: 'Maharashtra', email: '', address: 'Wadi', alt: '' },
      { name: 'Pinnacle Realty', mobile: '9830011106', city: 'Pune', state: 'Maharashtra', email: '', address: 'Hinjewadi', alt: '' },
      { name: 'Galaxy Brokers', mobile: '9830011107', city: 'Aurangabad', state: 'Maharashtra', email: '', address: 'Garkheda', alt: '' },
      { name: 'Prime Industrial', mobile: '9830011108', city: 'Chennai', state: 'Tamil Nadu', email: '', address: 'Sriperumbudur', alt: '' }
    ];
    crmBrokers.forEach(b => {
      Z.db.insert('crmLeads', { listId: crmList.id, name: b.name, mobile: b.mobile, city: b.city, state: b.state,
        email: b.email, address: b.address, alternateContact: b.alt,
        assignedTo: null, category: null, latestStatus: null, latestRemark: null, lastContactedAt: null });
    });
    Z.db.update('crmLists', crmList.id, { count: crmBrokers.length });
    // assign a few to telecaller
    const tele = Z.db.where('adminAccounts', a => a.role === 'telecaller').pop();
    Z.db.where('crmLeads', l => l.listId === crmList.id).slice(0, 4).forEach(l => {
      Z.db.update('crmLeads', l.id, { assignedTo: tele.id, assignedAt: Z.now() });
      Z.db.insert('crmAssignments', { leadId: l.id, telecallerId: tele.id, assignedAt: Z.now() });
    });
    // a sample call history entry
    const lead0 = Z.db.where('crmLeads', l => l.assignedTo === tele.id)[0];
    if (lead0) {
      Z.db.insert('crmCallHistory', { leadId: lead0.id, telecallerId: tele.id, status: 'Contacted',
        remark: 'Discussed about industrial warehouse requirement. Interested in Pune area.',
        calledAt: Z.addDays(Z.now(), -1) });
      Z.db.update('crmLeads', lead0.id, { latestStatus: 'Contacted', latestRemark: 'Discussed about industrial warehouse requirement.',
        lastContactedAt: Z.addDays(Z.now(), -1), category: 'Industrial' });
    }

    /* Advertisement sample */
    Z.db.insert('advertisements', { title: 'List Your Industrial Property on Zonexa',
      description: 'Reach verified buyers across Maharashtra. Get your property verified today.',
      imageUrl: null, cities: [], placement: 'home', audience: 'all',
      startDate: Z.today(), endDate: Z.addDays(Z.today(), 30), status: 'Active',
      impressions: 0, clicks: 0, createdBy: null });

    /* Notification templates */
    const templates = [
      { key: 'kyc_approved', title: 'KYC Approved', body: 'Your KYC documents have been approved. You can now list properties.', enabled: true },
      { key: 'kyc_rejected', title: 'KYC Rejected', body: 'Your KYC submission was rejected. Reason: {{reason}}', enabled: true },
      { key: 'property_approved', title: 'Property Approved', body: 'Your property "{{name}}" is now live on Zonexa.', enabled: true },
      { key: 'property_rejected', title: 'Property Rejected', body: 'Your property "{{name}}" was rejected. Reason: {{reason}}', enabled: true },
      { key: 'new_enquiry', title: 'New Enquiry', body: 'You have a new enquiry on your property "{{name}}".', enabled: true },
      { key: 'site_visit_request', title: 'Site Visit Request', body: 'A site visit has been requested for your property "{{name}}".', enabled: true },
      { key: 'site_visit_confirmed', title: 'Site Visit Confirmed', body: 'Your site visit for "{{name}}" has been confirmed.', enabled: true },
      { key: 'property_flagged', title: 'Property Flagged', body: 'A property has been reported. Please review.', enabled: true },
      { key: 'deal_closure_reminder', title: 'Deal Closure Reminder', body: 'Has the deal for "{{name}}" been closed? Please confirm.', enabled: true },
      { key: 'requirement_response', title: 'New Response on Your Requirement', body: 'A new response was received on your requirement.', enabled: true },
      { key: 'daily_property_views', title: 'Daily Property Views', body: 'Your property "{{name}}" received {{count}} views today.', enabled: false }
    ];
    templates.forEach(t => Z.db.insert('notificationTemplates', t));

    Z.audit('system', 'system', 'seed_completed', {});
    return true;
  };
})();
