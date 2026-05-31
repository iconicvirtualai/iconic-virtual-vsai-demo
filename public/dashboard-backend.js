// ============================================================
// ICONIC VIRTUAL AI — DASHBOARD BACKEND PATCH v2.0
// Fixes all 31 audit issues:
// 1. Firebase Firestore live data binding for all dashboard tiles
// 2. Orders: filters, actions (delete/cancel/download), pagination, CSV export
// 3. Payment: Stripe Checkout integration (replace mock confirmPurchase)
// 4. Credits: Firestore persistence on every purchase and usage
// 5. Auth: real signOut, forgot password, SSO (Google/Apple), Remember Me
// 6. Settings: profile/preferences/notifications save to Firestore + Firebase Auth
// 7. Email triggers via Firebase callable functions
// 8. Support ticket submission to Firestore
// 9. Referral: dynamic link, clipboard copy, share dialogs
// 10. Notifications: Firestore real-time feed
// 11. History/Activity: Firestore events log
// 12. Projects: real CRUD
// 13. Activity chart: weekly data from Firestore
// 14. Team data: from Firestore (not hardcoded)
// 15. All broken buttons wired
// ============================================================

(function() {
  'use strict';

  // ---- CONFIG ----
  var STRIPE_PUBLIC_KEY = 'pk_live_REPLACE_WITH_YOUR_STRIPE_PUBLIC_KEY';
  var FIREBASE_FUNCTIONS_URL = 'https://us-central1-iconic-virtual-ai.cloudfunctions.net';

  // ---- FIREBASE v9 COMPAT (already loaded by parent page) ----
  // The parent page uses Firebase compat SDK via CDN
  // We reference the same global firebase object
  function getAuth() {
    return window.firebase && window.firebase.auth ? window.firebase.auth() : null;
  }
  function getDb() {
    return window.firebase && window.firebase.firestore ? window.firebase.firestore() : null;
  }
  function getCurrentUser() {
    var auth = getAuth();
    return auth ? auth.currentUser : null;
  }

  // ---- TOAST HELPER ----
  function toast(msg, type) {
    // Use the existing toast function if available, else alert
    if (typeof window.toast === 'function' && window.toast !== showToast) {
      window._origToast(msg, type);
    } else if (typeof showToast === 'function') {
      showToast(msg, type);
    } else {
      console.log('[Toast]', msg, type);
    }
  }

  // ---- FIRESTORE HELPERS ----
  function userDoc(uid) {
    var db = getDb();
    if (!db || !uid) return null;
    return db.collection('users').doc(uid);
  }
  function ordersCol(uid) {
    var db = getDb();
    if (!db || !uid) return null;
    return db.collection('users').doc(uid).collection('orders');
  }
  function activityCol(uid) {
    var db = getDb();
    if (!db || !uid) return null;
    return db.collection('users').doc(uid).collection('activity');
  }
  function projectsCol(uid) {
    var db = getDb();
    if (!db || !uid) return null;
    return db.collection('users').doc(uid).collection('projects');
  }
  function notificationsCol(uid) {
    var db = getDb();
    if (!db || !uid) return null;
    return db.collection('users').doc(uid).collection('notifications');
  }
  function supportCol() {
    var db = getDb();
    if (!db) return null;
    return db.collection('supportTickets');
  }

  // ---- LOG ACTIVITY ----
  function logActivity(uid, type, label, meta) {
    var col = activityCol(uid);
    if (!col) return;
    col.add({
      type: type || 'general',
      label: label || '',
      meta: meta || {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(e) { console.warn('logActivity error', e); });
  }

  // ============================================================
  // SECTION 2: DASHBOARD DATA BINDING — Fix stat tiles
  // ============================================================
  function bindDashboardStats(uid) {
    var db = getDb();
    if (!db || !uid) return;

    // Listen to user document for credits and stats
    db.collection('users').doc(uid).onSnapshot(function(doc) {
      if (!doc.exists) return;
      var data = doc.data();
      var credits = data.credits || 0;

      // Update sidebar counter
      var creditCount = document.getElementById('creditCount');
      if (creditCount) creditCount.textContent = credits;

      // Update dashboard stat tiles (the 4 cards at top)
      var tiles = document.querySelectorAll('.stat-card .stat-value');
      if (tiles.length >= 1) tiles[0].textContent = credits; // Credits Remaining

      // Update the credits callout in Buy Credits section
      var callout = document.querySelector('.info-callout strong');
      if (callout) callout.textContent = 'You have ' + credits + ' credits.';

      // Update welcome name
      var welcomeEl = document.querySelector('.welcome-text h2, .page-header h2, [class*="welcome"] h2');
      var firstName = data.firstName || (data.email ? data.email.split('@')[0] : 'there');
      if (welcomeEl) welcomeEl.textContent = 'Welcome back, ' + firstName + ' 👋';
    }, function(err) { console.warn('User snapshot error:', err); });

    // Listen to orders collection for stats
    db.collection('users').doc(uid).collection('orders').onSnapshot(function(snap) {
      var orders = [];
      snap.forEach(function(doc) { orders.push(Object.assign({id: doc.id}, doc.data())); });

      var now = new Date();
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      var thisMonth = orders.filter(function(o) {
        var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
        return ts >= monthStart;
      });

      var tiles = document.querySelectorAll('.stat-card .stat-value');
      if (tiles.length >= 2) tiles[1].textContent = thisMonth.length; // Stagings This Month
      if (tiles.length >= 4) tiles[3].textContent = orders.length;   // Total Stagings

      // Update recent orders on dashboard
      renderDashboardRecentOrders(orders);

      // Update activity chart
      renderActivityChart(orders);

      // Update order status subtexts
      var subtexts = document.querySelectorAll('.stat-card .stat-sub');
      if (subtexts.length >= 2) subtexts[1].textContent = thisMonth.length + ' this month';
      if (subtexts.length >= 4) subtexts[3].textContent = 'All time';

      // Store orders globally for filters
      window._allOrders = orders;
      // If orders page is visible, re-render it
      if (document.getElementById('sub-orders') && document.getElementById('sub-orders').classList.contains('active')) {
        applyOrderFilters();
      }
    }, function(err) { console.warn('Orders snapshot error:', err); });

    // Listen to projects collection
    db.collection('users').doc(uid).collection('projects').onSnapshot(function(snap) {
      var active = 0;
      snap.forEach(function(doc) {
        var d = doc.data();
        if (d.status === 'active' || d.status === 'In Progress') active++;
      });
      var tiles = document.querySelectorAll('.stat-card .stat-value');
      if (tiles.length >= 3) tiles[2].textContent = active; // Active Projects
      window._allProjects = [];
      snap.forEach(function(doc) { window._allProjects.push(Object.assign({id: doc.id}, doc.data())); });
    }, function(err) { console.warn('Projects snapshot error:', err); });

    // Listen to notifications
    db.collection('users').doc(uid).collection('notifications')
      .orderBy('createdAt', 'desc').limit(20)
      .onSnapshot(function(snap) {
        var notifs = [];
        snap.forEach(function(doc) { notifs.push(Object.assign({id: doc.id}, doc.data())); });
        renderNotifications(notifs, uid);
      }, function(err) { console.warn('Notifications error:', err); });
  }

  // ---- Render recent orders on dashboard ----
  function renderDashboardRecentOrders(orders) {
    var tbody = document.querySelector('#sub-dashboard .data-table tbody, #sub-dashboard table tbody');
    if (!tbody) return;
    var recent = orders.slice().sort(function(a, b) {
      var ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      var tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return tb - ta;
    }).slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:32px">📷</div><div>No orders yet</div><div style="font-size:13px">Stage your first image to see orders here.</div></td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(function(o) {
      var pc = ({complete:'pill-success',processing:'pill-processing',failed:'pill-failed',pending:'pill-queued',draft:'pill-queued'})[o.status] || 'pill-queued';
      var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      var dateStr = ts.toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
      return '<tr class="clickable" onclick="openOrderDetail('' + o.id + '')"><td><span class="thumb"></span></td><td>' + (o.address || 'Untitled') + '</td><td>' + (o.room || '-') + '</td><td>' + (o.style || '-') + '</td><td><span class="pill ' + pc + '">' + (o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Pending') + '</span></td></tr>';
    }).join('');
  }

  // ============================================================
  // SECTION 3: ORDERS PAGE — Filters, Actions, Pagination, Export
  // ============================================================
  window._orderFilterStatus = 'all';
  window._orderFilterDateRange = 'all';
  window._orderFilterStyle = '';
  window._orderSearchQuery = '';
  window._orderPage = 1;
  window._orderPageSize = 10;

  function applyOrderFilters() {
    var orders = window._allOrders || [];
    var filtered = orders.filter(function(o) {
      // Status filter
      if (window._orderFilterStatus && window._orderFilterStatus !== 'all') {
        if ((o.status || '').toLowerCase() !== window._orderFilterStatus) return false;
      }
      // Date filter
      var now = new Date();
      var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      if (window._orderFilterDateRange === '7') {
        var cutoff = new Date(now.getTime() - 7 * 86400000);
        if (ts < cutoff) return false;
      } else if (window._orderFilterDateRange === '30') {
        var cutoff30 = new Date(now.getTime() - 30 * 86400000);
        if (ts < cutoff30) return false;
      } else if (window._orderFilterDateRange === 'year') {
        var yearStart = new Date(now.getFullYear(), 0, 1);
        if (ts < yearStart) return false;
      }
      // Style filter
      if (window._orderFilterStyle && window._orderFilterStyle !== '') {
        if ((o.style || '').toLowerCase() !== window._orderFilterStyle.toLowerCase()) return false;
      }
      // Search
      if (window._orderSearchQuery) {
        var q = window._orderSearchQuery.toLowerCase();
        var match = (o.address || '').toLowerCase().includes(q) ||
          (o.id || '').toLowerCase().includes(q) ||
          (o.room || '').toLowerCase().includes(q) ||
          (o.style || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Sort by date desc
    filtered.sort(function(a, b) {
      var ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      var tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return tb - ta;
    });

    window._filteredOrders = filtered;
    renderOrdersTable(filtered);
    updateOrderTabCounts(orders);
  }

  function updateOrderTabCounts(orders) {
    var counts = {all: orders.length, processing: 0, complete: 0, failed: 0, draft: 0};
    orders.forEach(function(o) {
      var s = (o.status || '').toLowerCase();
      if (s === 'complete' || s === 'completed') counts.complete++;
      else if (s === 'processing') counts.processing++;
      else if (s === 'failed') counts.failed++;
      else if (s === 'draft') counts.draft++;
    });
    // Update tab button labels
    var tabBtns = document.querySelectorAll('#sub-orders .tab-group button, #sub-orders .tab-btn');
    tabBtns.forEach(function(btn) {
      var text = btn.textContent.toLowerCase();
      if (text.includes('all orders') || text.includes('all (')) {
        btn.textContent = 'All Orders (' + counts.all + ')';
      } else if (text.includes('processing')) {
        btn.textContent = 'Processing (' + counts.processing + ')';
      } else if (text.includes('complete')) {
        btn.textContent = 'Complete (' + counts.complete + ')';
      } else if (text.includes('failed')) {
        btn.textContent = 'Failed (' + counts.failed + ')';
      } else if (text.includes('draft')) {
        btn.textContent = 'Draft (' + counts.draft + ')';
      }
    });
  }

  function renderOrdersTable(orders) {
    var page = window._orderPage || 1;
    var pageSize = window._orderPageSize || 10;
    var start = (page - 1) * pageSize;
    var pageOrders = orders.slice(start, start + pageSize);

    var tbody = document.querySelector('#sub-orders .data-table tbody, #sub-orders table tbody');
    if (!tbody) return;

    if (pageOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">No orders match your filters.</td></tr>';
    } else {
      tbody.innerHTML = pageOrders.map(function(o) {
        var pc = ({complete:'pill-success','completed':'pill-success',processing:'pill-processing',failed:'pill-failed',pending:'pill-queued',draft:'pill-queued'})[o.status ? o.status.toLowerCase() : ''] || 'pill-queued';
        var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
        var dateStr = ts.toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
        var status = o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Pending';
        return '<tr class="clickable" onclick="openOrderDetail('' + o.id + '')"><td><input type="checkbox" onclick="event.stopPropagation()"></td><td>' +
          '<span style="font-weight:600;color:var(--primary)">#' + (o.orderId || o.id.substring(0,8).toUpperCase()) + '</span></td><td>' +
          (o.address || 'Untitled') + '</td><td>' + (o.room || '-') + '</td><td>' + (o.style || '-') + '</td><td>' + dateStr + '</td><td>' + (o.credits || 1) + '</td><td><span class="pill ' + pc + '">' + status + '</span></td>' +
          '<td onclick="event.stopPropagation()" style="white-space:nowrap">' +
          '<button class="btn btn-sm btn-secondary" onclick="downloadOrder('' + o.id + '')" title="Download">⬇</button> ' +
          '<button class="btn btn-sm btn-ghost" onclick="cancelOrder('' + o.id + '')" title="Cancel" ' + ((['complete','completed','failed'].includes((o.status||'').toLowerCase())) ? 'disabled' : '') + '>✕</button> ' +
          '<button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteOrder('' + o.id + '')" title="Delete">🗑</button>' +
          '</td></tr>';
      }).join('');
    }

    // Update pagination info
    var info = document.querySelector('#sub-orders .pagination-info, #sub-orders [class*="showing"]');
    if (info) info.textContent = 'Showing ' + (start + 1) + '–' + Math.min(start + pageSize, orders.length) + ' of ' + orders.length + ' orders';
    // Update pagination buttons
    var prevBtn = document.querySelector('#sub-orders button[onclick*="prevPage"], #sub-orders .btn-prev');
    var nextBtn = document.querySelector('#sub-orders button[onclick*="nextPage"], #sub-orders .btn-next');
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = start + pageSize >= orders.length;
  }

  // Override global order filter functions
  window.filterOrdersByStatus = function(status, btn) {
    window._orderFilterStatus = status;
    window._orderPage = 1;
    if (btn) {
      document.querySelectorAll('#sub-orders .tab-group button, #sub-orders .tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    }
    applyOrderFilters();
  };

  window.prevOrderPage = function() {
    if (window._orderPage > 1) { window._orderPage--; applyOrderFilters(); }
  };
  window.nextOrderPage = function() {
    var total = (window._filteredOrders || []).length;
    if (window._orderPage * window._orderPageSize < total) { window._orderPage++; applyOrderFilters(); }
  };

  // Cancel order
  window.cancelOrder = function(orderId) {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');
    if (!confirm('Cancel order #' + orderId + '? This cannot be undone.')) return;
    db.collection('users').doc(user.uid).collection('orders').doc(orderId).update({
      status: 'cancelled',
      cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
      toast('Order cancelled successfully');
      logActivity(user.uid, 'order', 'Cancelled order #' + orderId, {orderId: orderId});
    }).catch(function(e) { toast('Failed to cancel: ' + e.message, 'error'); });
  };

  // Delete order
  window.deleteOrder = function(orderId) {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');
    if (!confirm('Permanently delete order #' + orderId + '? This cannot be undone.')) return;
    db.collection('users').doc(user.uid).collection('orders').doc(orderId).delete()
      .then(function() {
        toast('Order deleted');
        logActivity(user.uid, 'order', 'Deleted order #' + orderId, {orderId: orderId});
      }).catch(function(e) { toast('Failed to delete: ' + e.message, 'error'); });
  };

  // Download order
  window.downloadOrder = function(orderId) {
    var orders = window._allOrders || [];
    var order = orders.find(function(o) { return o.id === orderId; });
    if (order && order.outputUrl) {
      window.open(order.outputUrl, '_blank');
    } else {
      toast('No download available for this order yet', 'error');
    }
  };

  // Export CSV
  window.exportOrdersCSV = function() {
    var orders = window._filteredOrders || window._allOrders || [];
    if (orders.length === 0) return toast('No orders to export', 'error');
    var headers = ['Order ID', 'Address', 'Room', 'Style', 'Status', 'Credits', 'Date'];
    var rows = orders.map(function(o) {
      var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      return [
        o.orderId || o.id,
        o.address || '',
        o.room || '',
        o.style || '',
        o.status || '',
        o.credits || 1,
        ts.toISOString()
      ].map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
    });
    var csv = [headers.join(',')].concat(rows).join('\n');
    var blob = new Blob([csv], {type: 'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'iconic-virtual-orders-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported successfully');
  };

  // Wire up search and filter inputs once DOM is ready
  function wireOrderFilters() {
    var searchInput = document.querySelector('#sub-orders input[placeholder*="Search by address"]');
    if (searchInput && !searchInput._wired) {
      searchInput._wired = true;
      searchInput.addEventListener('input', function() {
        window._orderSearchQuery = this.value;
        window._orderPage = 1;
        applyOrderFilters();
      });
    }
    var dateSelect = document.querySelector('#sub-orders select');
    if (dateSelect && !dateSelect._wired) {
      dateSelect._wired = true;
      dateSelect.addEventListener('change', function() {
        var val = this.value;
        if (val === 'Last 7 days') window._orderFilterDateRange = '7';
        else if (val === 'Last 30 days') window._orderFilterDateRange = '30';
        else if (val === 'This year') window._orderFilterDateRange = 'year';
        else window._orderFilterDateRange = 'all';
        window._orderPage = 1;
        applyOrderFilters();
      });
    }
    var selects = document.querySelectorAll('#sub-orders select');
    if (selects.length >= 2 && !selects[1]._wired) {
      selects[1]._wired = true;
      selects[1].addEventListener('change', function() {
        window._orderFilterStyle = this.value === 'All Styles' ? '' : this.value;
        window._orderPage = 1;
        applyOrderFilters();
      });
    }
    // Wire tab buttons
    var tabBtns = document.querySelectorAll('#sub-orders .tab-group button, #sub-orders .tab-btn');
    tabBtns.forEach(function(btn, i) {
      if (!btn._wired) {
        btn._wired = true;
        btn.addEventListener('click', function() {
          tabBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var text = btn.textContent.toLowerCase();
          if (text.includes('processing')) window._orderFilterStatus = 'processing';
          else if (text.includes('complete')) window._orderFilterStatus = 'complete';
          else if (text.includes('failed')) window._orderFilterStatus = 'failed';
          else if (text.includes('draft')) window._orderFilterStatus = 'draft';
          else window._orderFilterStatus = 'all';
          window._orderPage = 1;
          applyOrderFilters();
        });
      }
    });
    // Wire prev/next
    var allBtns = document.querySelectorAll('#sub-orders button');
    allBtns.forEach(function(btn) {
      if (btn.textContent.includes('Previous') && !btn._wired) {
        btn._wired = true; btn.onclick = window.prevOrderPage;
      }
      if (btn.textContent.includes('Next') && !btn._wired) {
        btn._wired = true; btn.onclick = window.nextOrderPage;
      }
      if (btn.textContent.includes('Export CSV') && !btn._wired) {
        btn._wired = true; btn.onclick = window.exportOrdersCSV;
      }
    });
  }

  // ============================================================
  // SECTION 4: PAYMENT — Stripe Checkout Integration
  // ============================================================
  // Override the existing confirmPurchase to use Stripe
  window._origConfirmPurchase = window.confirmPurchase;

  window.confirmPurchase = function(amount, productType) {
    var user = getCurrentUser();
    if (!user) {
      toast('Please sign in to purchase', 'error');
      return;
    }

    // Check if Stripe is loaded
    if (typeof Stripe === 'undefined') {
      toast('Payment system loading... Please try again in a moment', 'error');
      // Load Stripe.js dynamically
      if (!document.querySelector('script[src*="stripe"]')) {
        var stripeScript = document.createElement('script');
        stripeScript.src = 'https://js.stripe.com/v3/';
        stripeScript.onload = function() { toast('Payment ready. Please click again to purchase.'); };
        document.head.appendChild(stripeScript);
      }
      return;
    }

    // Close any existing modal
    if (typeof closeModal === 'function') closeModal();

    // Show payment modal with card details and Stripe
    var aiPrices = {5: 10, 10: 60, 25: 40, 40: 180, 85: 255, 100: 120, 500: 450};
    var proPrices = {1: 15, 10: 125, 20: 200};
    var prices = productType === 'pro' ? proPrices : aiPrices;
    var priceCents = (prices[amount] || 0) * 100;
    var label = productType === 'pro' 
      ? 'Professional Staging (' + amount + ' image' + (amount > 1 ? 's' : '') + ')'
      : amount + ' Credits';

    // For subscription plans, route to Stripe subscription
    var isSubscription = productType === 'subscription' || productType === 'membership';

    // Create Checkout Session via Firebase callable function
    var loadingModal = document.getElementById('modal');
    var loadingContent = document.getElementById('modalContent');
    if (loadingContent) {
      loadingContent.innerHTML = '<div style="text-align:center;padding:32px"><div class="spinner"></div><p style="margin-top:16px;color:var(--text-muted)">Creating secure checkout...</p></div>';
    }
    if (loadingModal) loadingModal.classList.add('show');

    // Call Firebase function to create Stripe Checkout session
    fetch(FIREBASE_FUNCTIONS_URL + '/createStripeCheckout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window._authToken
      },
      body: JSON.stringify({
        amount: amount,
        productType: productType,
        priceAmount: priceCents,
        label: label,
        userId: user.uid,
        userEmail: user.email,
        successUrl: window.location.origin + '/staging-dashboard.html?payment=success',
        cancelUrl: window.location.origin + '/staging-dashboard.html?payment=cancelled'
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.sessionId || data.url) {
        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          var stripe = Stripe(STRIPE_PUBLIC_KEY);
          stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      } else if (data.error) {
        if (loadingModal) loadingModal.classList.remove('show');
        toast('Payment error: ' + data.error, 'error');
      } else {
        if (loadingModal) loadingModal.classList.remove('show');
        toast('Unable to start checkout. Please contact support.', 'error');
      }
    })
    .catch(function(err) {
      if (loadingModal) loadingModal.classList.remove('show');
      toast('Payment system unavailable. Please try again.', 'error');
      console.error('Stripe checkout error:', err);
    });
  };

  // Handle payment success/cancel from Stripe redirect
  function handleStripeRedirect() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast('Payment successful! Your credits have been added. 🎉');
      // Remove the query param
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh user data
      var user = getCurrentUser();
      if (user) bindDashboardStats(user.uid);
    } else if (params.get('payment') === 'cancelled') {
      toast('Payment was cancelled. No charge was made.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  // ============================================================
  // SECTION 5: CREDITS — Persist to Firestore
  // ============================================================
  // Override updateCredits to write to Firestore
  window._origUpdateCredits = window.updateCredits;
  window.updateCredits = function(amount, productType) {
    var user = getCurrentUser();
    if (!user) {
      // Fallback to DOM update only
      if (productType === 'ai') {
        var el = document.getElementById('creditCount');
        if (el) el.textContent = parseInt(el.textContent || '0') + amount;
      }
      return;
    }
    var db = getDb();
    if (!db) return;
    // Increment credits in Firestore atomically
    db.collection('users').doc(user.uid).update({
      credits: firebase.firestore.FieldValue.increment(amount),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
      console.log('Credits updated in Firestore:', amount);
    }).catch(function(e) {
      console.warn('Credit update error:', e);
      // Fallback to DOM update
      var el = document.getElementById('creditCount');
      if (el) el.textContent = parseInt(el.textContent || '0') + amount;
    });
    // Log the activity
    var prices = {5: 10, 10: 60, 25: 40, 40: 180, 85: 255, 100: 120, 500: 450};
    logActivity(user.uid, 'credit_purchase', 'Purchased ' + amount + ' credits', {amount: amount, productType: productType});
    
    // Trigger email confirmation
    sendEmailNotification(user.uid, 'credit_purchased', {amount: amount, productType: productType});
  };

  // Deduct credit on staging
  window.deductCredit = function(amount, orderId, address, room, style) {
    var user = getCurrentUser();
    if (!user) return;
    var db = getDb();
    if (!db) return;
    var batch = db.batch();
    // Decrement credits
    var userRef = db.collection('users').doc(user.uid);
    batch.update(userRef, {
      credits: firebase.firestore.FieldValue.increment(-amount),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Add order record
    var orderRef = ordersCol(user.uid).doc(orderId || db.collection('users').doc().id);
    batch.set(orderRef, {
      orderId: 'ST-' + Math.random().toString(36).substring(2,8).toUpperCase(),
      address: address || '',
      room: room || '',
      style: style || '',
      status: 'processing',
      credits: amount,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: user.uid
    });
    batch.commit().catch(function(e) { console.warn('Deduct credit error:', e); });
    logActivity(user.uid, 'staging', 'Staged "' + room + '" at ' + address, {orderId: orderId, room: room, style: style});
  };

  // ============================================================
  // SECTION 6: AUTH — Real signOut, Forgot Password, SSO, Remember Me
  // ============================================================
  // Override logout
  window.dashLogout = function() {
    // Clear all auth tokens from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    // Clear in-memory state
    window._allOrders = [];
    window._allProjects = [];
    window._authToken = null;
    // Redirect to login page
    window.location.href = '/login';
  };
  // Also override via data attribute references
  document.querySelectorAll('[onclick*="dashLogout"], a[href*="log-out"]').forEach(function(el) {
    el.onclick = function(e) { e.preventDefault(); window.dashLogout(); };
  });

  

  // ============================================================
    // ============================================================
  // SECTION 3b: STRIPE CHECKOUT — Real purchases via dashboard API
  // ============================================================
  var PRICE_IDS = {
    // AI One-Time
    "small-ai": "price_1SfpAJCRfvDEtw05sLJJV2l6",
    "medium-ai": "price_1SfpB1CRfvDEtw05Ot05yIiM",
    "big-ai": "price_1SfpBoCRfvDEtw05CIjrT22M",
    // Traditional One-Time
    "single-room": "price_1SfpCgCRfvDEtw05OPv3bp4n",
    "small-property": "price_1SfpDMCRfvDEtw054NgbiHCe",
    "large-property": "price_1SfpDpCRfvDEtw05B5SLOA9I",
    // AI Membership
    "ai-starter": "price_1SfomqCRfvDEtw05fsBsZSDo",
    "ai-premium": "price_1SfoqnCRfvDEtw05LVaF8uM5",
    "ai-pro": "price_1SforxCRfvDEtw052rdFBqmK",
    // Traditional Membership
    "t-starter": "price_1Sfow3CRfvDEtw05TKPIkgbZ",
    "t-premium": "price_1Sfp7qCRfvDEtw05c4FxCYlG",
    "t-pro": "price_1Sfp90CRfvDEtw0566rRv8QO"
  };

  window.purchaseCredits = function(planKey) {
    var priceId = PRICE_IDS[planKey];
    if (!priceId) return toast("Unknown plan: " + planKey, "error");
    var token = localStorage.getItem("authToken");
    if (!token) return toast("Please log in first", "error");
    toast("Redirecting to checkout...");
    fetch("/api/dashboard/purchase-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ priceId: priceId })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || "Checkout failed", "error");
      }
    })
    .catch(function(e) { toast("Network error", "error"); });
  };

  // Handle post-purchase fulfillment when returning from Stripe
  (function checkPurchaseReturn() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success" && params.get("session_id")) {
      var sessionId = params.get("session_id");
      var token = localStorage.getItem("authToken");
      if (!token) return;
      fetch("/api/dashboard/fulfill-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ sessionId: sessionId })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) {
          toast(data.message || "Credits added!", "success");
          // Reload profile to update credit count
          if (window.loadUserProfile) window.loadUserProfile();
        } else {
          toast(data.error || "Fulfillment issue", "error");
        }
      })
      .catch(function(e) { console.warn("Fulfill error:", e); });
      // Clean URL
      window.history.replaceState({}, "", "/staging-dashboard.html");
    }
    if (params.get("purchase") === "canceled") {
      toast("Purchase canceled");
      window.history.replaceState({}, "", "/staging-dashboard.html");
    }
  })();

  // ============================================================
  // SECTION 2b: ORDERS & PROJECTS — API-based CRUD
  // ============================================================
  function apiHeaders() {
    return { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("authToken") || "") };
  }

  // Load orders from API
  window.loadOrders = function() {
    fetch("/api/dashboard/orders", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok) return;
      window._allOrders = data.orders || [];
      // Update order count badge
      var badge = document.querySelector("#link-orders .badge");
      if (badge) badge.textContent = data.orders.length;
      // Update stat cards
      var activeEl = document.getElementById("stat-active");
      if (activeEl) activeEl.textContent = data.orders.filter(function(o) { return o.status === "processing"; }).length;
      var totalEl = document.getElementById("stat-total");
      if (totalEl) totalEl.textContent = data.orders.length;
      var monthEl = document.getElementById("stat-stagings-month");
      if (monthEl) {
        var now = new Date();
        var thisMonth = data.orders.filter(function(o) {
          var d = new Date(o.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        monthEl.textContent = thisMonth.length;
      }
      // Render orders table if on orders tab
      if (typeof renderOrdersTable === "function") renderOrdersTable(data.orders);
      if (typeof updateOrderTabCounts === "function") updateOrderTabCounts(data.orders);
      if (typeof renderDashboardRecentOrders === "function") renderDashboardRecentOrders(data.orders);
    })
    .catch(function(e) { console.warn("loadOrders error:", e); });
  };

  // Create order via API
  window.submitNewOrder = function() {
    var address = document.getElementById("newOrderAddress");
    var room = document.getElementById("newOrderRoom");
    var style = document.getElementById("newOrderStyle");
    if (!address || !room || !address.value || !room.value) return toast("Address and room required", "error");
    fetch("/api/dashboard/orders", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ address: address.value, room: room.value, style: style ? style.value : "modern" })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Order created!"); closeModal("newOrder"); window.loadOrders(); }
      else toast(data.error || "Failed to create order", "error");
    })
    .catch(function(e) { toast("Network error", "error"); });
  };

  // Delete order via API
  window.deleteOrder = function(orderId) {
    if (!confirm("Delete this order permanently?")) return;
    fetch("/api/dashboard/orders", {
      method: "DELETE",
      headers: apiHeaders(),
      body: JSON.stringify({ orderId: orderId })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Order deleted"); window.loadOrders(); }
      else toast(data.error || "Delete failed", "error");
    })
    .catch(function(e) { toast("Network error", "error"); });
  };

  // Cancel order via API
  window.cancelOrder = function(orderId) {
    fetch("/api/dashboard/orders", {
      method: "PATCH",
      headers: apiHeaders(),
      body: JSON.stringify({ orderId: orderId, status: "canceled" })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Order canceled"); window.loadOrders(); }
      else toast(data.error || "Cancel failed", "error");
    });
  };

  // Load projects from API
  window.loadProjects = function() {
    fetch("/api/dashboard/projects", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok) return;
      window._allProjects = data.projects || [];
      var activeEl = document.getElementById("stat-active");
      if (activeEl) activeEl.textContent = data.projects.filter(function(p) { return p.status === "active"; }).length;
      if (typeof renderProjectsList === "function") renderProjectsList(data.projects);
    })
    .catch(function(e) { console.warn("loadProjects error:", e); });
  };

  // Create project via API
  window.createProject = function() {
    var name = document.getElementById("projectName");
    var desc = document.getElementById("projectDescription") || document.getElementById("projectDesc");
    if (!name || !name.value) return toast("Project name required", "error");
    fetch("/api/dashboard/projects", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ name: name.value, description: desc ? desc.value : "" })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Project created!"); closeModal("newProject"); window.loadProjects(); }
      else toast(data.error || "Failed", "error");
    })
    .catch(function(e) { toast("Network error", "error"); });
  };

  // Delete project via API
  window.deleteProject = function(projectId) {
    if (!confirm("Delete this project?")) return;
    fetch("/api/dashboard/projects", {
      method: "DELETE",
      headers: apiHeaders(),
      body: JSON.stringify({ projectId: projectId })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Project deleted"); window.loadProjects(); }
      else toast(data.error || "Delete failed", "error");
    });
  };

  // Auto-load orders and projects on dashboard init
  setTimeout(function() {
    if (localStorage.getItem("authToken")) {
      window.loadOrders();
      window.loadProjects();
    }
  }, 800);

// SECTION 6b: PROFILE — Load/save via API
  // ============================================================
  // Load user profile from API on dashboard init
  window.loadUserProfile = function() {
    var token = localStorage.getItem('authToken');
    if (!token) return;
    fetch('/api/user/update-profile', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok || !data.user) return;
      var u = data.user;
      // Update welcome name
      var welcomeEl = document.querySelector('h1[style*="font-size"]');
      if (welcomeEl && u.firstName) {
        welcomeEl.innerHTML = 'Welcome back, ' + u.firstName + ' \uD83D\uDC4B';
      }
      // Update stat cards
      var credEl = document.getElementById('stat-credits');
      if (credEl) credEl.textContent = (u.aiCreditsRemaining || 0) + (u.proImagesRemaining || 0);
      var credSub = document.getElementById('stat-credits-sub');
      if (credSub) credSub.textContent = (u.aiCreditsRemaining || 0) + ' AI | ' + (u.proImagesRemaining || 0) + ' Pro';
      var totalEl = document.getElementById('stat-total');
      if (totalEl) totalEl.textContent = u.totalStagings || 0;
      // Update settings form fields
      var fnInput = document.getElementById('settings-firstName');
      if (fnInput) fnInput.value = u.firstName || '';
      var lnInput = document.getElementById('settings-lastName');
      if (lnInput) lnInput.value = u.lastName || '';
      var emInput = document.getElementById('settings-email');
      if (emInput) emInput.value = u.email || '';
      var phInput = document.getElementById('settings-phone');
      if (phInput) phInput.value = u.phone || '';
      var licInput = document.getElementById('settings-license');
      if (licInput) licInput.value = u.licenseNumber || '';
      // Store profile in memory
      window._userProfile = u;
    })
    .catch(function(e) { console.warn('Profile load error:', e); });
  };

  // Save profile settings
  window.saveProfileSettings = function() {
    var token = localStorage.getItem('authToken');
    if (!token) return toast('Not authenticated', 'error');
    var body = {};
    var fn = document.getElementById('settings-firstName');
    var ln = document.getElementById('settings-lastName');
    var ph = document.getElementById('settings-phone');
    var lic = document.getElementById('settings-license');
    if (fn) body.firstName = fn.value;
    if (ln) body.lastName = ln.value;
    if (ph) body.phone = ph.value;
    if (lic) body.licenseNumber = lic.value;
    fetch('/api/user/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        toast('Profile saved!');
        window._userProfile = data.user;
        // Update welcome name
        if (data.user.firstName) {
          var welcomeEl = document.querySelector('h1[style*="font-size"]');
          if (welcomeEl) welcomeEl.innerHTML = 'Welcome back, ' + data.user.firstName + ' \uD83D\uDC4B';
        }
      } else {
        toast(data.error || 'Save failed', 'error');
      }
    })
    .catch(function(e) { toast('Network error', 'error'); });
  };

  // Change password
  window.changePassword = function() {
    var token = localStorage.getItem('authToken');
    if (!token) return toast('Not authenticated', 'error');
    var curPw = document.getElementById('settings-currentPassword');
    var newPw = document.getElementById('settings-newPassword');
    if (!curPw || !newPw || !curPw.value || !newPw.value) return toast('Fill in both password fields', 'error');
    if (newPw.value.length < 8) return toast('New password must be 8+ characters', 'error');
    fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ currentPassword: curPw.value, newPassword: newPw.value })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        toast('Password updated!');
        curPw.value = '';
        newPw.value = '';
      } else {
        toast(data.error || 'Password change failed', 'error');
      }
    })
    .catch(function(e) { toast('Network error', 'error'); });
  };

  // Auto-load profile when dashboard loads
  setTimeout(function() { if (localStorage.getItem('authToken')) window.loadUserProfile(); }, 500);

// Forgot Password
  window.sendPasswordReset = function() {
    var emailInput = document.getElementById('login-email') || document.querySelector('input[type="email"]');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
      email = prompt('Enter your email address to reset your password:');
    }
    if (!email) return;
    var auth = getAuth();
    if (!auth) return toast('Auth unavailable', 'error');
    auth.sendPasswordResetEmail(email)
      .then(function() { toast('Password reset email sent to ' + email + '. Check your inbox!'); })
      .catch(function(e) { toast(e.message || 'Failed to send reset email', 'error'); });
  };
  // Wire forgot password link
  document.querySelectorAll('a[href*="forgot"], .forgot-password, [onclick*="forgot"]').forEach(function(el) {
    el.onclick = function(e) { e.preventDefault(); window.sendPasswordReset(); };
  });

  // Google SSO
  window.signInWithGoogle = function() {
    var auth = getAuth();
    if (!auth) return toast('Auth unavailable', 'error');
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(provider)
      .then(function(result) {
        var user = result.user;
        // Create/update user doc in Firestore
        var db = getDb();
        if (db) {
          db.collection('users').doc(user.uid).set({
            email: user.email,
            firstName: (user.displayName || '').split(' ')[0] || '',
            lastName: (user.displayName || '').split(' ').slice(1).join(' ') || '',
            photoURL: user.photoURL || '',
            credits: firebase.firestore.FieldValue.increment(0),
            provider: 'google',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, {merge: true});
        }
        setAuth({uid: user.uid, email: user.email, firstName: (user.displayName || '').split(' ')[0]});
        initAuth();
        sendEmailNotification(user.uid, 'welcome', {email: user.email, name: user.displayName});
      })
      .catch(function(e) { toast(e.message || 'Google sign-in failed', 'error'); });
  };

  // Apple SSO
  window.signInWithApple = function() {
    var auth = getAuth();
    if (!auth) return toast('Auth unavailable', 'error');
    var provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    auth.signInWithPopup(provider)
      .then(function(result) {
        var user = result.user;
        var db = getDb();
        if (db) {
          db.collection('users').doc(user.uid).set({
            email: user.email || '',
            provider: 'apple',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, {merge: true});
        }
        setAuth({uid: user.uid, email: user.email});
        initAuth();
      })
      .catch(function(e) { toast(e.message || 'Apple sign-in failed', 'error'); });
  };

  // Wire Google/Apple buttons
  function wireAuthButtons() {
    document.querySelectorAll('button').forEach(function(btn) {
      var text = btn.textContent.trim();
      if (text.includes('Google') && !btn._wired) {
        btn._wired = true;
        btn.onclick = window.signInWithGoogle;
      }
      if (text.includes('Apple') && !btn._wired) {
        btn._wired = true;
        btn.onclick = window.signInWithApple;
      }
    });
  }

  // Remember Me — set Firebase persistence based on checkbox
  function wireRememberMe() {
    var rememberMe = document.getElementById('remember-me') || document.querySelector('input[type="checkbox"][id*="remember"]');
    if (rememberMe && !rememberMe._wired) {
      rememberMe._wired = true;
      rememberMe.addEventListener('change', function() {
        var auth = getAuth();
        if (!auth) return;
        var persistence = this.checked 
          ? firebase.auth.Auth.Persistence.LOCAL 
          : firebase.auth.Auth.Persistence.SESSION;
        auth.setPersistence(persistence).catch(function(e) { console.warn('Persistence error:', e); });
      });
    }
  }

  // Store auth token for API calls
  function updateAuthToken() {
    var auth = getAuth();
    if (auth && auth.currentUser) {
      auth.currentUser.getIdToken().then(function(token) {
        window._authToken = token;
      }).catch(function() { window._authToken = null; });
    }
  }

  // Auth state change listener - connect dashboard to live Firebase auth
  function initFirebaseAuthListener() {
    var auth = getAuth();
    if (!auth) return;
    auth.onAuthStateChanged(function(user) {
      updateAuthToken();
      if (user) {
        // User is signed in - bind live data
        bindDashboardStats(user.uid);
        // Refresh token every hour
        setInterval(updateAuthToken, 3600000);
      }
    });
  }

  // ============================================================
  // SECTION 7: SETTINGS — Persist to Firestore + Firebase Auth
  // ============================================================
  // Override dashSaveProfile
  window.dashSaveProfile = function() {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');

    var fn = (document.getElementById('settings-firstName') || {}).value || '';
    var ln = (document.getElementById('settings-lastName') || {}).value || '';
    var ph = (document.getElementById('settings-phone') || {}).value || '';
    var co = (document.getElementById('settings-brokerage') || {}).value || '';
    var lic = (document.getElementById('settings-license') || document.getElementById('settings-licenseNumber') || {}).value || '';
    var bio = (document.querySelector('#settings-profile textarea') || {}).value || '';

    var updates = {
      firstName: fn.trim(),
      lastName: ln.trim(),
      phone: ph.trim(),
      company: co.trim(),
      licenseNumber: lic.trim(),
      bio: bio.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Update display name in Firebase Auth
    user.updateProfile({ displayName: (fn + ' ' + ln).trim() }).catch(function(e) { console.warn('Auth profile update:', e); });

    db.collection('users').doc(user.uid).update(updates)
      .then(function() {
        toast('Profile saved successfully ✓');
        logActivity(user.uid, 'account', 'Updated profile information', {});
        // Refresh initAuth to update UI
        initAuth();
      })
      .catch(function(e) { toast('Error saving profile: ' + e.message, 'error'); });
  };

  // Save preferences
  window.savePreferences = function() {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');

    var defaultStyle = (document.querySelector('#settings-preferences select') || {}).value || '';
    var autoDisclosure = !!(document.querySelector('#settings-preferences .toggle.on'));

    db.collection('users').doc(user.uid).update({
      preferences: {
        defaultStyle: defaultStyle,
        autoDisclosure: autoDisclosure
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() { toast('Preferences saved ✓'); })
      .catch(function(e) { toast('Error saving preferences: ' + e.message, 'error'); });
  };

  // Save notification settings
  window.saveNotificationSettings = function() {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');

    var toggles = document.querySelectorAll('#settings-notifications .toggle-row');
    var notifSettings = {};
    toggles.forEach(function(row) {
      var label = (row.querySelector('.toggle-info h4') || {}).textContent || '';
      var isOn = !!(row.querySelector('.toggle.on'));
      if (label) notifSettings[label.trim().toLowerCase().replace(/\s+/g, '_')] = isOn;
    });

    db.collection('users').doc(user.uid).update({
      notifications: notifSettings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() { toast('Notification settings saved ✓'); })
      .catch(function(e) { toast('Error saving settings: ' + e.message, 'error'); });
  };

  // Update password
  window.updatePassword = function() {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var currentPass = (document.getElementById('current-password') || document.querySelector('input[placeholder*="Current"]') || {}).value || '';
    var newPass = (document.getElementById('new-password') || document.querySelector('input[placeholder*="New"]') || {}).value || '';
    var confirmPass = (document.getElementById('confirm-password') || document.querySelector('input[placeholder*="Re-enter"]') || {}).value || '';

    if (!currentPass || !newPass) return toast('Please fill in all password fields', 'error');
    if (newPass !== confirmPass) return toast('New passwords do not match', 'error');
    if (newPass.length < 8) return toast('Password must be at least 8 characters', 'error');

    // Re-authenticate then update
    var credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
    user.reauthenticateWithCredential(credential)
      .then(function() { return user.updatePassword(newPass); })
      .then(function() {
        toast('Password updated successfully ✓');
        logActivity(user.uid, 'account', 'Changed account password', {});
      })
      .catch(function(e) {
        if (e.code === 'auth/wrong-password') toast('Current password is incorrect', 'error');
        else toast(e.message || 'Failed to update password', 'error');
      });
  };

  // Save tax info
  window.saveTaxInfo = function() {
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');
    var taxSection = document.getElementById('settings-tax') || document.querySelector('[class*="tax"]');
    var inputs = taxSection ? taxSection.querySelectorAll('input, select') : document.querySelectorAll('#billing-tax input, #billing-tax select');
    var taxData = {};
    inputs.forEach(function(inp) {
      if (inp.id || inp.name) taxData[inp.id || inp.name] = inp.value;
    });
    db.collection('users').doc(user.uid).update({
      taxInfo: taxData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() { toast('Tax information saved ✓'); })
      .catch(function(e) { toast('Error saving tax info: ' + e.message, 'error'); });
  };

  // Wire settings buttons
  function wireSettingsButtons() {
    document.querySelectorAll('button').forEach(function(btn) {
      var text = btn.textContent.trim();
      if (text === 'Save Changes' && !btn._wired) {
        btn._wired = true; btn.onclick = window.dashSaveProfile;
      }
      if (text === 'Save Preferences' && !btn._wired) {
        btn._wired = true; btn.onclick = window.savePreferences;
      }
      if ((text === 'Save Settings' || text === 'Save Notification Settings') && !btn._wired) {
        btn._wired = true; btn.onclick = window.saveNotificationSettings;
      }
      if (text === 'Update Password' && !btn._wired) {
        btn._wired = true; btn.onclick = window.updatePassword;
      }
      if (text === 'Save Tax Info' && !btn._wired) {
        btn._wired = true; btn.onclick = window.saveTaxInfo;
      }
    });
  }

  // ============================================================
  // SECTION 8: EMAIL TRIGGERS — Firebase Callable Functions
  // ============================================================
  function sendEmailNotification(uid, eventType, data) {
    // Calls a Firebase Cloud Function that sends the email
    // The function uses SendGrid/Postmark on the backend
    fetch(FIREBASE_FUNCTIONS_URL + '/sendTransactionalEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (window._authToken || '')
      },
      body: JSON.stringify({
        uid: uid,
        eventType: eventType,
        data: data || {}
      })
    }).catch(function(e) { console.warn('Email notification error:', e); });
  }
  window.sendEmailNotification = sendEmailNotification;

  // ============================================================
  // SECTION 9: SUPPORT TICKET — Real Firestore Submission
  // ============================================================
  window.submitSupportTicket = function() {
    var user = getCurrentUser();
    var db = getDb();
    if (!db) return toast('Database unavailable', 'error');

    var category = (document.querySelector('#sub-support select') || {}).value || 'General';
    var priority = (document.querySelectorAll('#sub-support select')[1] || {}).value || 'Normal';
    var subject = (document.querySelector('#sub-support input[placeholder*="Brief"]') || {}).value || '';
    var message = (document.querySelector('#sub-support textarea') || {}).value || '';

    if (!subject.trim() || !message.trim()) {
      return toast('Please fill in the subject and message', 'error');
    }

    var ticketData = {
      userId: user ? user.uid : 'anonymous',
      userEmail: user ? user.email : 'unknown',
      category: category,
      priority: priority,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ticketId: 'TKT-' + Math.random().toString(36).substring(2,8).toUpperCase()
    };

    var submitBtn = document.querySelector('#sub-support button.btn-primary');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

    db.collection('supportTickets').add(ticketData)
      .then(function(docRef) {
        toast('Ticket ' + ticketData.ticketId + ' submitted! We will respond within 4 hours. ✓');
        // Send confirmation email
        if (user) sendEmailNotification(user.uid, 'support_ticket_created', {ticketId: ticketData.ticketId, subject: subject});
        // Log activity
        if (user) logActivity(user.uid, 'support', 'Submitted support ticket: ' + subject, {ticketId: ticketData.ticketId});
        // Clear form
        var inputs = document.querySelectorAll('#sub-support input[type="text"], #sub-support textarea');
        inputs.forEach(function(inp) { inp.value = ''; });
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Ticket'; }
      })
      .catch(function(e) {
        toast('Failed to submit ticket: ' + e.message, 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Ticket'; }
      });
  };

  // Wire support ticket button
  function wireSupportButtons() {
    document.querySelectorAll('#sub-support button.btn-primary, #sub-support button[onclick*="toast"]').forEach(function(btn) {
      if (btn.textContent.includes('Submit Ticket') && !btn._wired) {
        btn._wired = true;
        btn.onclick = window.submitSupportTicket;
      }
    });
    // Live Chat
    document.querySelectorAll('#sub-support button').forEach(function(btn) {
      if (btn.textContent.includes('Start Chat') && !btn._wired) {
        btn._wired = true;
        btn.onclick = function() {
          // Open Intercom/Crisp or fallback to email
          if (typeof window.Intercom === 'function') {
            window.Intercom('show');
          } else if (typeof window.Crisp === 'object') {
            window.Crisp.chat.open();
          } else {
            window.open('mailto:support@iconicvirtual.ai?subject=Support Request', '_blank');
            toast('Opening email client for support');
          }
        };
      }
      if (btn.textContent.includes('Send Email') && !btn._wired) {
        btn._wired = true;
        btn.onclick = function() {
          window.open('mailto:support@iconicvirtual.ai?subject=Support%20Request&body=Please%20describe%20your%20issue%3A', '_blank');
        };
      }
      if (btn.textContent.includes('Book Time') && !btn._wired) {
        btn._wired = true;
        btn.onclick = function() {
          window.open('https://calendly.com/iconicvirtual/onboarding', '_blank');
        };
      }
    });
  }

  // ============================================================
  // SECTION 10: NOTIFICATIONS — Firestore Real-time
  // ============================================================
  function renderNotifications(notifs, uid) {
    var container = document.querySelector('.notification-list, .notifications-dropdown [class*="list"]');
    if (!container) return;

    if (notifs.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)">No notifications yet</div>';
      return;
    }

    container.innerHTML = notifs.slice(0, 10).map(function(n) {
      var ts = n.createdAt && n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt || 0);
      var timeAgo = formatTimeAgo(ts);
      var icon = {staging_complete: '🌟', credit_purchased: '💳', order_failed: '⚠️', team_joined: '👥', payment: '💳'}[n.type] || '🔔';
      return '<div class="notification-item' + (n.read ? '' : ' unread') + '" onclick="markNotificationRead('' + n.id + '','' + uid + '')">' +
        '<div>' + icon + ' ' + (n.title || 'Notification') + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted)">' + timeAgo + '</div>' +
        '</div>';
    }).join('');

    // Update unread badge
    var unread = notifs.filter(function(n) { return !n.read; }).length;
    var badge = document.querySelector('.notification-badge, [class*="notif-badge"]');
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
  }

  window.markNotificationRead = function(notifId, uid) {
    var db = getDb();
    if (!db || !uid) return;
    db.collection('users').doc(uid).collection('notifications').doc(notifId)
      .update({ read: true }).catch(function(e) { console.warn('Mark read error:', e); });
  };

  window.markAllNotificationsRead = function() {
    var user = getCurrentUser();
    if (!user) return;
    var db = getDb();
    if (!db) return;
    db.collection('users').doc(user.uid).collection('notifications')
      .where('read', '==', false).get()
      .then(function(snap) {
        var batch = db.batch();
        snap.forEach(function(doc) { batch.update(doc.ref, {read: true}); });
        return batch.commit();
      })
      .then(function() { toast('All notifications marked as read'); })
      .catch(function(e) { console.warn('Mark all read error:', e); });
  };

  // Wire mark all read button
  function wireNotificationButtons() {
    document.querySelectorAll('[onclick*="markAllRead"], .mark-all-read').forEach(function(el) {
      if (!el._wired) {
        el._wired = true;
        el.onclick = window.markAllNotificationsRead;
      }
    });
  }

  // ============================================================
  // SECTION 11: HISTORY / ACTIVITY LOG
  // ============================================================
  function bindActivityLog(uid) {
    var db = getDb();
    if (!db || !uid) return;
    db.collection('users').doc(uid).collection('activity')
      .orderBy('createdAt', 'desc').limit(50)
      .onSnapshot(function(snap) {
        var activities = [];
        snap.forEach(function(doc) { activities.push(Object.assign({id: doc.id}, doc.data())); });
        renderActivityLog(activities);
        window._allActivities = activities;
      }, function(err) { console.warn('Activity log error:', err); });
  }

  function renderActivityLog(activities) {
    var container = document.querySelector('#sub-history .activity-list, #sub-history [class*="activity"]');
    if (!container) return;
    if (activities.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No activity recorded yet</div>';
      return;
    }
    container.innerHTML = activities.map(function(a) {
      var ts = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      var timeStr = formatTimeAgo(ts);
      var icon = {staging: '🖼️', credit_purchase: '💳', account: '⚙️', order: '📋', support: '💬'}[a.type] || '•';
      return '<div class="activity-item">' +
        '<div class="activity-icon">' + icon + '</div>' +
        '<div class="activity-info"><div class="activity-label">' + (a.label || '') + '</div>' +
        '<div class="activity-time">' + timeStr + '</div></div>' +
        '</div>';
    }).join('');
  }

  window.exportActivityLog = function() {
    var activities = window._allActivities || [];
    if (activities.length === 0) return toast('No activity to export', 'error');
    var csv = ['Type,Label,Date'].concat(activities.map(function(a) {
      var ts = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      return '"' + (a.type||'') + '","' + (a.label||'').replace(/"/g,'""') + '","' + ts.toISOString() + '"';
    })).join('\n');
    var blob = new Blob([csv], {type: 'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'activity-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // SECTION 12: ACTIVITY CHART — Weekly data from Firestore
  // ============================================================
  function renderActivityChart(orders) {
    var chartContainer = document.querySelector('.activity-chart, .chart-bars, #activityChart');
    if (!chartContainer) return;

    var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var counts = [0,0,0,0,0,0,0];
    var now = new Date();
    var dayOfWeek = now.getDay(); // 0=Sun
    var monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0,0,0,0);

    orders.forEach(function(o) {
      var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      if (ts >= monday) {
        var dayIdx = (ts.getDay() + 6) % 7; // Mon=0
        if (dayIdx < 7) counts[dayIdx]++;
      }
    });

    var max = Math.max.apply(null, counts) || 1;
    chartContainer.innerHTML = days.map(function(day, i) {
      var h = Math.round((counts[i] / max) * 80) + 4;
      return '<div class="chart-day"><div class="chart-bar" style="height:' + h + 'px;background:var(--primary);border-radius:4px 4px 0 0;" title="' + counts[i] + ' stagings"></div><div class="chart-label">' + day + '</div></div>';
    }).join('');
  }

  // ============================================================
  // SECTION 13: REFERRAL — Dynamic link, clipboard, share
  // ============================================================
  function bindReferralData(uid) {
    var db = getDb();
    if (!db || !uid) return;

    db.collection('users').doc(uid).get().then(function(doc) {
      if (!doc.exists) return;
      var data = doc.data();
      var slug = data.referralSlug || uid.substring(0, 8);
      var referralUrl = window.location.origin + '/staging-dashboard.html?ref=' + slug;

      // Update the referral link input
      var linkInput = document.querySelector('#sub-refer input[type="text"], .referral-link-input');
      if (linkInput) linkInput.value = referralUrl;

      // Update stats
      var totalReferrals = data.referralCount || 0;
      var creditsEarned = data.referralCreditsEarned || 0;
      var pending = data.referralPending || 0;

      var statEls = document.querySelectorAll('#sub-refer .stat-card .stat-value');
      if (statEls.length >= 1) statEls[0].textContent = totalReferrals;
      if (statEls.length >= 2) statEls[1].textContent = creditsEarned;
      if (statEls.length >= 3) statEls[2].textContent = pending;
      if (statEls.length >= 4) statEls[3].textContent = '$' + (creditsEarned * 1.2).toFixed(0);
    });

    // Load referrals table from Firestore
    db.collection('referrals').where('referrerId', '==', uid).orderBy('createdAt', 'desc').get()
      .then(function(snap) {
        var refs = [];
        snap.forEach(function(doc) { refs.push(doc.data()); });
        renderReferralsTable(refs);
      }).catch(function(e) { console.warn('Referrals error:', e); });
  }

  function renderReferralsTable(refs) {
    var tbody = document.querySelector('#sub-refer table tbody');
    if (!tbody || refs.length === 0) return;
    tbody.innerHTML = refs.map(function(r) {
      var ts = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0);
      var dateStr = ts.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      var statusPill = r.status === 'Purchased' ? '<span class="pill pill-success">Purchased</span>' : '<span class="pill pill-queued">Pending</span>';
      return '<tr><td>' + (r.name || r.email.split('@')[0]) + '</td><td>' + maskEmail(r.email) + '</td><td>' + dateStr + '</td><td>' + statusPill + '</td><td>' + (r.status === 'Purchased' ? '+10' : '—') + '</td></tr>';
    }).join('');
  }

  function maskEmail(email) {
    if (!email) return '—';
    var parts = email.split('@');
    return parts[0].charAt(0) + '••••@' + parts[1];
  }

  // Copy referral link to clipboard
  window.copyReferralLink = function() {
    var linkInput = document.querySelector('#sub-refer input[type="text"], .referral-link-input');
    var url = linkInput ? linkInput.value : window.location.origin + '/staging-dashboard.html?ref=you';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() { toast('Referral link copied to clipboard! 📋'); });
    } else {
      linkInput && linkInput.select();
      document.execCommand('copy');
      toast('Referral link copied!');
    }
  };

  // Share referral via social
  window.shareReferral = function(platform) {
    var linkInput = document.querySelector('#sub-refer input[type="text"], .referral-link-input');
    var url = encodeURIComponent(linkInput ? linkInput.value : window.location.origin);
    var msg = encodeURIComponent('I've been using Iconic Virtual AI for virtual staging — try it free! ');
    var shareUrls = {
      twitter: 'https://twitter.com/intent/tweet?text=' + msg + url,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
      email: 'mailto:?subject=Try%20Iconic%20Virtual%20AI&body=' + msg + url,
      whatsapp: 'https://api.whatsapp.com/send?text=' + msg + url,
      sms: 'sms:?body=' + msg + url
    };
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Wire referral buttons
  function wireReferralButtons() {
    document.querySelectorAll('#sub-refer button').forEach(function(btn) {
      var text = btn.textContent.trim();
      if (text === 'Copy' && !btn._wired) {
        btn._wired = true; btn.onclick = window.copyReferralLink;
      }
      if (text.includes('Email') && !btn._wired) {
        btn._wired = true; btn.onclick = function() { window.shareReferral('email'); };
      }
      if (text.includes('Twitter') && !btn._wired) {
        btn._wired = true; btn.onclick = function() { window.shareReferral('twitter'); };
      }
      if (text.includes('Facebook') && !btn._wired) {
        btn._wired = true; btn.onclick = function() { window.shareReferral('facebook'); };
      }
      if (text.includes('LinkedIn') && !btn._wired) {
        btn._wired = true; btn.onclick = function() { window.shareReferral('linkedin'); };
      }
      if ((text.includes('WhatsApp') || text.includes('whatsapp')) && !btn._wired) {
        btn._wired = true; btn.onclick = function() { window.shareReferral('whatsapp'); };
      }
      if (text.includes('Text') && !btn._wired) {
        btn._wired = true; btn.onclick = function() { window.shareReferral('sms'); };
      }
    });
  }

  // ============================================================
  // SECTION 14: TEAM — Dynamic from Firestore, fix "Jane Doe" issue
  // ============================================================
  function bindTeamData(uid) {
    var db = getDb();
    if (!db || !uid) return;

    db.collection('users').doc(uid).get().then(function(doc) {
      if (!doc.exists) return;
      var userData = doc.data();

      // Fix current user row — replace hardcoded "Jane Doe" with actual user
      var teamTable = document.querySelector('#sub-team table tbody');
      if (!teamTable) return;
      var rows = teamTable.querySelectorAll('tr');
      if (rows.length > 0) {
        var firstRow = rows[0];
        var cells = firstRow.querySelectorAll('td');
        if (cells.length >= 2) {
          var fullName = ((userData.firstName || '') + ' ' + (userData.lastName || '')).trim() || userData.email || 'You';
          cells[0].textContent = fullName + ' (You)';
          cells[1].textContent = userData.email || '';
        }
      }

      // Load team members from Firestore
      db.collection('users').doc(uid).collection('team')
        .orderBy('addedAt', 'desc').get()
        .then(function(snap) {
          var members = [];
          snap.forEach(function(doc) { members.push(Object.assign({id: doc.id}, doc.data())); });
          renderTeamMembers(members, teamTable, userData);
        }).catch(function(e) { console.warn('Team members error:', e); });
    });
  }

  function renderTeamMembers(members, teamTable, currentUser) {
    if (!teamTable || members.length === 0) return;
    // Keep first row (current user) and add members
    var existingRows = Array.from(teamTable.querySelectorAll('tr'));
    // Remove non-current-user rows
    existingRows.slice(1).forEach(function(r) { r.remove(); });
    
    members.forEach(function(m) {
      var tr = document.createElement('tr');
      var lastActive = m.lastActiveAt && m.lastActiveAt.toDate ? formatTimeAgo(m.lastActiveAt.toDate()) : 'Never';
      tr.innerHTML = '<td>' + (m.firstName || '') + ' ' + (m.lastName || '') + '</td>' +
        '<td>' + (m.email || '') + '</td>' +
        '<td>' + (m.role || 'Editor') + '</td>' +
        '<td>' + (m.stagings || 0) + '</td>' +
        '<td>' + lastActive + '</td>' +
        '<td><a href="#" onclick="manageTeamMember('' + m.id + '')" class="link">Manage</a></td>';
      teamTable.appendChild(tr);
    });
  }

  // Invite team member
  window.inviteTeamMember = function() {
    var email = prompt('Enter the email address to invite:');
    if (!email || !email.includes('@')) return toast('Please enter a valid email address', 'error');
    var role = prompt('Role (Admin/Editor/Viewer)?', 'Editor') || 'Editor';
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return;

    db.collection('users').doc(user.uid).collection('pendingInvites').add({
      email: email.trim().toLowerCase(),
      role: role,
      invitedAt: firebase.firestore.FieldValue.serverTimestamp(),
      invitedBy: user.uid,
      status: 'pending'
    }).then(function() {
      // Send invite email via Cloud Function
      sendEmailNotification(user.uid, 'team_invite', {inviteeEmail: email, role: role});
      toast('Invitation sent to ' + email + '!');
    }).catch(function(e) { toast('Failed to send invite: ' + e.message, 'error'); });
  };

  // Wire invite button
  document.querySelectorAll('#sub-team button').forEach(function(btn) {
    if (btn.textContent.includes('Invite Member') && !btn._wired) {
      btn._wired = true; btn.onclick = window.inviteTeamMember;
    }
  });

  // ============================================================
  // SECTION 15: PROJECTS — Real CRUD operations
  // ============================================================
  function bindProjectsData(uid) {
    // Projects are already bound via bindDashboardStats -> _allProjects
    // Render project list when section is shown
    renderProjectsList();
  }

  function renderProjectsList() {
    var projects = window._allProjects || [];
    var container = document.querySelector('#sub-projects .project-grid, #sub-projects [class*="project-list"]');
    if (!container) return;
    if (projects.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No projects yet. Create your first project!</div>';
      return;
    }
    // Render from Firestore data
    container.innerHTML = projects.map(function(p) {
      var statusClass = {active:'pill-success','In Progress':'pill-success',complete:'pill-queued',Drafting:'pill-queued'}[p.status] || 'pill-queued';
      return '<div class="project-card" onclick="openProject('' + p.id + '')">' +
        '<h3>' + (p.name || 'Untitled Project') + '</h3>' +
        '<div style="color:var(--text-muted);font-size:13px">' + (p.address || '') + '</div>' +
        '<div style="margin-top:8px">' + (p.stagingCount || 0) + ' stagings • <span class="pill ' + statusClass + '">' + (p.status || 'Active') + '</span></div>' +
        '</div>';
    }).join('');
  }

  // Create project
  window.createNewProject = function() {
    var name = prompt('Project name (e.g. "1247 Oak Street"):');
    if (!name) return;
    var address = prompt('Property address:') || '';
    var user = getCurrentUser();
    if (!user) return toast('Please sign in', 'error');
    var db = getDb();
    if (!db) return;

    db.collection('users').doc(user.uid).collection('projects').add({
      name: name.trim(),
      address: address.trim(),
      status: 'active',
      stagingCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
      toast('Project "' + name + '" created! 📁');
      logActivity(user.uid, 'project', 'Created project: ' + name, {name: name});
    }).catch(function(e) { toast('Failed to create project: ' + e.message, 'error'); });
  };

  // Delete project
  window.deleteProject = function(projectId) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    var user = getCurrentUser();
    if (!user) return;
    var db = getDb();
    if (!db) return;
    db.collection('users').doc(user.uid).collection('projects').doc(projectId).delete()
      .then(function() { toast('Project deleted'); })
      .catch(function(e) { toast('Failed to delete: ' + e.message, 'error'); });
  };

  // Wire project buttons
  function wireProjectButtons() {
    document.querySelectorAll('#sub-projects button, button[onclick*="newProject"]').forEach(function(btn) {
      if (btn.textContent.includes('New Project') && !btn._wired) {
        btn._wired = true; btn.onclick = window.createNewProject;
      }
    });
  }

  // ============================================================
  // SECTION 16: QUICK ACTIONS — Wire all remaining stub buttons
  // ============================================================
  function wireQuickActions() {
    document.querySelectorAll('button').forEach(function(btn) {
      var text = btn.textContent.trim();
      // "Invite a friend" quick action
      if (text.includes('Invite a friend') && !btn._wired) {
        btn._wired = true;
        btn.onclick = function() {
          if (typeof showSub === 'function') showSub('refer');
          else if (typeof goto === 'function') goto('refer');
        };
      }
      // Bulk upload
      if (text.includes('Bulk upload') && !btn._wired) {
        btn._wired = true;
        btn.onclick = function() {
          if (typeof showSub === 'function') showSub('stage');
          toast('Use the Stage Now workspace for bulk uploads');
        };
      }
      // Start new project quick action
      if (text.includes('Start new project') && !btn._wired) {
        btn._wired = true;
        btn.onclick = window.createNewProject;
      }
    });
  }

  // ============================================================
  // SECTION 17: BILLING — Load real payment methods and invoices
  // ============================================================
  function bindBillingData(uid) {
    var db = getDb();
    if (!db || !uid) return;

    db.collection('users').doc(uid).get().then(function(doc) {
      if (!doc.exists) return;
      var data = doc.data();
      
      // Update plan info
      var planName = data.plan || 'Free';
      var planEl = document.querySelector('#sub-billing .plan-name, #billing-current h3');
      if (planEl) planEl.textContent = planName + ' Plan';

      // Update credits used
      var credits = data.credits || 0;
      var usedEl = document.querySelector('#sub-billing .credits-used');
      if (usedEl) usedEl.textContent = (data.creditsUsedThisCycle || 0) + ' of ' + (data.monthlyCredits || 0);
    });

    // Load invoices from Firestore
    db.collection('users').doc(uid).collection('invoices')
      .orderBy('createdAt', 'desc').limit(20).get()
      .then(function(snap) {
        var invoices = [];
        snap.forEach(function(doc) { invoices.push(Object.assign({id: doc.id}, doc.data())); });
        if (invoices.length > 0) renderInvoicesTable(invoices);
      }).catch(function(e) { console.warn('Invoices error:', e); });
  }

  function renderInvoicesTable(invoices) {
    var tbody = document.querySelector('#billing-invoices table tbody, #sub-billing table tbody');
    if (!tbody) return;
    tbody.innerHTML = invoices.map(function(inv) {
      var ts = inv.createdAt && inv.createdAt.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt || 0);
      var dateStr = ts.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
      var statusPill = inv.status === 'paid' ? '<span class="pill pill-success">Paid</span>' : '<span class="pill pill-processing">Pending</span>';
      return '<tr><td>' + (inv.invoiceId || inv.id) + '</td><td>' + dateStr + '</td><td>' + (inv.description || '') + '</td><td>$' + ((inv.amount || 0)/100).toFixed(2) + '</td><td>' + statusPill + '</td><td><a href="' + (inv.pdfUrl || '#') + '" target="_blank" class="link">Download PDF</a></td></tr>';
    }).join('');
  }

  // ============================================================
  // SECTION 18: UTILITY FUNCTIONS
  // ============================================================
  function formatTimeAgo(date) {
    if (!date) return '';
    var now = new Date();
    var diff = now - date;
    var seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' minute' + (minutes !== 1 ? 's' : '') + ' ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hour' + (hours !== 1 ? 's' : '') + ' ago';
    var days = Math.floor(hours / 24);
    if (days < 7) return days + ' day' + (days !== 1 ? 's' : '') + ' ago';
    return date.toLocaleDateString('en-US', {month:'short', day:'numeric'});
  }

  // ============================================================
  // SECTION 19: INIT — Run everything on page load
  // ============================================================
  function initBackendPatch() {
    console.log('[Backend Patch v2.0] Initializing...');

    // Handle Stripe redirect
    handleStripeRedirect();

    // Load Stripe.js
    if (!document.querySelector('script[src*="stripe"]')) {
      var stripeScript = document.createElement('script');
      stripeScript.src = 'https://js.stripe.com/v3/';
      document.head.appendChild(stripeScript);
    }

    // Wire all buttons
    wireAuthButtons();
    wireRememberMe();
    wireOrderFilters();
    wireSettingsButtons();
    wireSupportButtons();
    wireReferralButtons();
    wireProjectButtons();
    wireQuickActions();
    wireNotificationButtons();

    // Initialize Firebase auth listener for live data
    initFirebaseAuthListener();

    // If user is already loaded (auth already resolved), bind immediately
    var auth = getAuth();
    if (auth && auth.currentUser) {
      var uid = auth.currentUser.uid;
      bindDashboardStats(uid);
      bindActivityLog(uid);
      bindReferralData(uid);
      bindTeamData(uid);
      bindBillingData(uid);
      updateAuthToken();
    }

    // Watch for section changes to bind data on demand
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            var user = auth && auth.currentUser;
            if (!user) return;
            var uid = user.uid;
            // Re-wire filters when orders section becomes visible
            if (node.id === 'sub-orders' || (node.classList && node.classList.contains('active'))) {
              setTimeout(wireOrderFilters, 100);
              setTimeout(function() { applyOrderFilters(); }, 200);
            }
            if (node.id === 'sub-refer') setTimeout(function() { bindReferralData(uid); wireReferralButtons(); }, 100);
            if (node.id === 'sub-team') setTimeout(function() { bindTeamData(uid); }, 100);
            if (node.id === 'sub-billing') setTimeout(function() { bindBillingData(uid); }, 100);
            if (node.id === 'sub-projects') setTimeout(function() { renderProjectsList(); wireProjectButtons(); }, 100);
            if (node.id === 'sub-history') setTimeout(function() { bindActivityLog(uid); }, 100);
          }
        });
      });
    });
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});

    // Also watch for class changes on sub-sections
    document.querySelectorAll('[id^="sub-"]').forEach(function(section) {
      var sectionObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.attributeName === 'class' && section.classList.contains('active')) {
            var user2 = auth && auth.currentUser;
            if (!user2) return;
            var uid2 = user2.uid;
            var id = section.id;
            if (id === 'sub-orders') { setTimeout(wireOrderFilters, 50); setTimeout(applyOrderFilters, 100); }
            if (id === 'sub-refer') { setTimeout(function() { bindReferralData(uid2); wireReferralButtons(); }, 50); }
            if (id === 'sub-team') setTimeout(function() { bindTeamData(uid2); }, 50);
            if (id === 'sub-billing') setTimeout(function() { bindBillingData(uid2); }, 50);
            if (id === 'sub-projects') setTimeout(function() { renderProjectsList(); }, 50);
            if (id === 'sub-history') setTimeout(function() { bindActivityLog(uid2); }, 50);
          }
        });
      });
      sectionObserver.observe(section, {attributes: true});
    });

    console.log('[Backend Patch v2.0] Initialized. All handlers wired.');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackendPatch);
  } else {
    // DOM already loaded — run with a small delay to let existing scripts finish
    setTimeout(initBackendPatch, 500);
  }

})(); // end IIFE
