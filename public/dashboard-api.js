// dashboard-api.js — API-based dashboard functions (runs independently of Firebase Client SDK)
// This file is loaded separately to avoid IIFE crash issues in dashboard-backend.js
(function() {
  "use strict";

  function apiHeaders() {
    return { "Content-Type": "application/json", "Authorization": "Bearer " + (localStorage.getItem("authToken") || "") };
  }

  // ---- STRIPE CHECKOUT ----
  var PRICE_IDS = {
    "small-ai": "price_1SfpAJCRfvDEtw05sLJJV2l6",
    "medium-ai": "price_1SfpB1CRfvDEtw05Ot05yIiM",
    "big-ai": "price_1SfpBoCRfvDEtw05CIjrT22M",
    "single-room": "price_1SfpCgCRfvDEtw05OPv3bp4n",
    "small-property": "price_1SfpDMCRfvDEtw054NgbiHCe",
    "large-property": "price_1SfpDpCRfvDEtw05B5SLOA9I",
    "ai-starter": "price_1SfomqCRfvDEtw05fsBsZSDo",
    "ai-premium": "price_1SfoqnCRfvDEtw05LVaF8uM5",
    "ai-pro": "price_1SforxCRfvDEtw052rdFBqmK",
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
      headers: apiHeaders(),
      body: JSON.stringify({ priceId: priceId })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok && data.url) window.location.href = data.url;
      else toast(data.error || "Checkout failed", "error");
    })
    .catch(function(e) { toast("Network error", "error"); });
  };

  // ---- POST-PURCHASE FULFILLMENT ----
  (function checkPurchaseReturn() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success" && params.get("session_id")) {
      var token = localStorage.getItem("authToken");
      if (!token) return;
      fetch("/api/dashboard/fulfill-purchase", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ sessionId: params.get("session_id") })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ok) { toast(data.message || "Credits added!"); if (window.loadUserProfile) window.loadUserProfile(); }
        else toast(data.error || "Fulfillment issue", "error");
      });
      window.history.replaceState({}, "", "/staging-dashboard.html");
    }
    if (params.get("purchase") === "canceled") {
      toast("Purchase canceled");
      window.history.replaceState({}, "", "/staging-dashboard.html");
    }
  })();

  // ---- PROFILE ----
  window.loadUserProfile = function() {
    var token = localStorage.getItem("authToken");
    if (!token) return;
    fetch("/api/user/update-profile", { method: "GET", headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok || !data.user) return;
      var u = data.user;
      var welcomeEl = document.querySelector("h1");
      if (welcomeEl && u.firstName && welcomeEl.textContent.indexOf("Welcome") > -1) {
        welcomeEl.innerHTML = "Welcome back, " + u.firstName + " \uD83D\uDC4B";
      }
      var credEl = document.getElementById("stat-credits");
      if (credEl) credEl.textContent = (u.aiCreditsRemaining || 0) + (u.proImagesRemaining || 0);
      var credSub = document.getElementById("stat-credits-sub");
      if (credSub) credSub.textContent = (u.aiCreditsRemaining || 0) + " AI | " + (u.proImagesRemaining || 0) + " Pro";
      var totalEl = document.getElementById("stat-total");
      if (totalEl) totalEl.textContent = u.totalStagings || 0;
      window._userProfile = u;
    })
    .catch(function(e) { console.warn("Profile load error:", e); });
  };

  window.saveProfileSettings = function() {
    var token = localStorage.getItem("authToken");
    if (!token) return toast("Not authenticated", "error");
    var body = {};
    var fields = ["settings-firstName","settings-lastName","settings-phone","settings-license"];
    var keys = ["firstName","lastName","phone","licenseNumber"];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el) body[keys[i]] = el.value;
    }
    fetch("/api/user/update-profile", { method: "POST", headers: apiHeaders(), body: JSON.stringify(body) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Profile saved!"); window._userProfile = data.user; }
      else toast(data.error || "Save failed", "error");
    });
  };

  window.changePassword = function() {
    var token = localStorage.getItem("authToken");
    if (!token) return toast("Not authenticated", "error");
    var curPw = document.getElementById("settings-currentPassword");
    var newPw = document.getElementById("settings-newPassword");
    if (!curPw || !newPw || !curPw.value || !newPw.value) return toast("Fill in both password fields", "error");
    fetch("/api/user/change-password", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ currentPassword: curPw.value, newPassword: newPw.value }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Password updated!"); curPw.value = ""; newPw.value = ""; }
      else toast(data.error || "Failed", "error");
    });
  };

  // ---- ORDERS ----
  window.loadOrders = function(filter) {
    fetch("/api/dashboard/orders", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok) return;
      window._allOrders = data.orders || [];
      var orders = data.orders || [];
      var badge = document.querySelector("#link-orders .badge");
      if (badge) badge.textContent = orders.length;
      var totalEl = document.getElementById("stat-total");
      if (totalEl) totalEl.textContent = orders.length;
      var monthEl = document.getElementById("stat-stagings-month");
      if (monthEl) {
        var now = new Date();
        var thisMonth = orders.filter(function(o) { var d = new Date(o.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
        monthEl.textContent = thisMonth.length;
      }
      // Render orders table
      window.renderOrdersFromAPI(orders, filter);
    });
  };

  window.renderOrdersFromAPI = function(orders, filter) {
    // Filter orders
    var filtered = orders;
    if (filter && filter !== "all") filtered = orders.filter(function(o) { return o.status === filter; });
    // Update tab counts
    var tabs = document.querySelectorAll("#sub-orders .tab-btn");
    if (tabs.length >= 5) {
      tabs[0].textContent = "All Orders (" + orders.length + ")";
      tabs[1].textContent = "Processing (" + orders.filter(function(o){return o.status==="processing"}).length + ")";
      tabs[2].textContent = "Complete (" + orders.filter(function(o){return o.status==="completed"||o.status==="paid"}).length + ")";
      tabs[3].textContent = "Failed (" + orders.filter(function(o){return o.status==="failed"}).length + ")";
      tabs[4].textContent = "Draft (" + orders.filter(function(o){return o.status==="draft"}).length + ")";
    }
    // Find the orders table panel
    var tablePanel = document.querySelector("#sub-orders .panel[style*=\"padding: 0\"]") || document.querySelector("#sub-orders .panel table");
    if (!tablePanel) { var panels = document.querySelectorAll("#sub-orders .panel"); tablePanel = panels[panels.length - 1]; }
    if (!tablePanel) return;
    // Build table HTML
    var html = '<div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px"><input type="checkbox" id="selectAllOrders" onchange="toggleSelectAllOrders(this.checked)"> <span style="font-size:13px;color:var(--text-muted)">Select All</span> <button class="btn btn-sm btn-ghost" onclick="bulkDeleteOrders()" style="margin-left:auto;color:var(--danger);font-size:13px">Delete Selected</button></div>';
    if (filtered.length === 0) {
      html += '<div style="text-align:center;padding:60px 20px;color:var(--text-muted)"><p style="font-size:48px;margin-bottom:16px">📋</p><p>No orders yet</p></div>';
    } else {
      html += '<table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid var(--border);text-align:left"><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)"></th><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)">ADDRESS</th><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)">ROOM</th><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)">STYLE</th><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)">STATUS</th><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)">DATE</th><th style="padding:12px 16px;font-size:12px;color:var(--text-muted)">ACTIONS</th></tr></thead><tbody>';
      filtered.forEach(function(o) {
        var statusColor = o.status === "completed" || o.status === "paid" ? "var(--success)" : o.status === "failed" ? "var(--danger)" : o.status === "processing" ? "#f59e0b" : "var(--text-muted)";
        html += '<tr style="border-bottom:1px solid var(--border)" data-order-id="' + o.id + '"><td style="padding:12px 16px"><input type="checkbox" class="order-checkbox" value="' + o.id + '"></td><td style="padding:12px 16px">' + (o.address || "-") + '</td><td style="padding:12px 16px">' + (o.room || "-") + '</td><td style="padding:12px 16px">' + (o.style || "-") + '</td><td style="padding:12px 16px"><span style="background:' + statusColor + ';color:white;padding:4px 10px;border-radius:20px;font-size:12px">' + (o.status || "draft") + '</span></td><td style="padding:12px 16px;font-size:13px;color:var(--text-muted)">' + new Date(o.createdAt).toLocaleDateString() + '</td><td style="padding:12px 16px"><button class="btn btn-sm btn-ghost" onclick="cancelOrder(\x27' + o.id + '\x27)" title="Cancel">✕</button> <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteOrder(\x27' + o.id + '\x27)" title="Delete">🗑</button></td></tr>';
      });
      html += '</tbody></table>';
    }
    tablePanel.innerHTML = html;
  };

  // Bulk actions
  window.toggleSelectAllOrders = function(checked) {
    document.querySelectorAll(".order-checkbox").forEach(function(cb) { cb.checked = checked; });
  };

  window.bulkDeleteOrders = function() {
    var selected = Array.from(document.querySelectorAll(".order-checkbox:checked")).map(function(cb) { return cb.value; });
    if (selected.length === 0) return toast("No orders selected", "error");
    if (!confirm("Delete " + selected.length + " order(s) permanently?")) return;
    var done = 0;
    selected.forEach(function(id) {
      fetch("/api/dashboard/orders", { method: "DELETE", headers: apiHeaders(), body: JSON.stringify({ orderId: id }) })
      .then(function(r) { return r.json(); })
      .then(function() { done++; if (done === selected.length) { toast(done + " orders deleted"); window.loadOrders(); } });
    });
  };

  // Wire order filter tabs
  window.filterOrders = function(status) {
    window.renderOrdersFromAPI(window._allOrders || [], status);
  };

  window.submitNewOrder = function() {
    var address = document.getElementById("newOrderAddress");
    var projectName = document.getElementById("newOrderProjectName");
    var notes = document.getElementById("newOrderNotes");
    if (!address || !address.value) return toast("Address is required", "error");
    fetch("/api/dashboard/orders", { method: "POST", headers: apiHeaders(), body: JSON.stringify({
      address: address.value,
      room: projectName ? projectName.value || "General" : "General",
      style: "modern",
      notes: notes ? notes.value : ""
    }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Order created!"); if (typeof closeModal === "function") closeModal(); window.loadOrders(); }
      else toast(data.error || "Failed to create order", "error");
    })
    .catch(function(e) { toast("Network error: " + e.message, "error"); });
  };

  window.deleteOrder = function(orderId) {
    if (!confirm("Delete this order permanently?")) return;
    fetch("/api/dashboard/orders", { method: "DELETE", headers: apiHeaders(), body: JSON.stringify({ orderId: orderId }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast("Order deleted"); window.loadOrders(); } else toast(data.error, "error"); });
  };

  window.cancelOrder = function(orderId) {
    fetch("/api/dashboard/orders", { method: "PATCH", headers: apiHeaders(), body: JSON.stringify({ orderId: orderId, status: "canceled" }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast("Order canceled"); 

  window.updateOrderStatus = function(orderId, newStatus) {
    fetch("/api/dashboard/orders", { method: "PATCH", headers: apiHeaders(), body: JSON.stringify({ orderId: orderId, status: newStatus }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast("Status updated to " + newStatus); window.loadOrders(); } else toast(data.error, "error"); });
  };
window.loadOrders(); } });
  };

  // ---- PROJECTS ----
  window.loadProjects = function() {
    fetch("/api/dashboard/projects", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok) return;
      window._allProjects = data.projects || [];
      var activeEl = document.getElementById("stat-active");
      if (activeEl) activeEl.textContent = data.projects.filter(function(p) { return p.status === "active"; }).length;
      // Render projects list
      var container = document.querySelector("#sub-projects .panel") || document.querySelector("#sub-projects");
      if (!container) return;
      var projects = data.projects || [];
      var html = '<div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px"><input type="checkbox" id="selectAllProjects" onchange="toggleSelectAllProjects(this.checked)"> <span style="font-size:13px;color:var(--text-muted)">Select All</span> <button class="btn btn-sm btn-ghost" onclick="bulkDeleteProjects()" style="margin-left:auto;color:var(--danger);font-size:13px">Delete Selected</button></div>';
      if (projects.length === 0) {
        html += '<div style="text-align:center;padding:60px 20px;color:var(--text-muted)"><p style="font-size:48px;margin-bottom:16px">📁</p><p>No projects yet. Click \x22Start new project\x22 to create one.</p></div>';
      } else {
        projects.forEach(function(p) {
          html += '<div style="display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border);gap:12px"><input type="checkbox" class="project-checkbox" value="' + p.id + '"><div style="flex:1"><strong>' + (p.name || "Untitled") + '</strong><p style="font-size:13px;color:var(--text-muted);margin:4px 0">' + (p.description || p.address || "No description") + '</p><span style="font-size:12px;color:var(--text-muted)">' + new Date(p.createdAt).toLocaleDateString() + ' · ' + (p.totalStagings || 0) + ' stagings</span></div><button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteProject(\x27' + p.id + '\x27)">🗑 Delete</button></div>';
        });
      }
      // Find first panel in projects sub
      var panels = document.querySelectorAll("#sub-projects .panel");
      if (panels.length > 0) panels[panels.length - 1].innerHTML = html;
    });
  };

  window.toggleSelectAllProjects = function(checked) {
    document.querySelectorAll(".project-checkbox").forEach(function(cb) { cb.checked = checked; });
  };

  window.bulkDeleteProjects = function() {
    var selected = Array.from(document.querySelectorAll(".project-checkbox:checked")).map(function(cb) { return cb.value; });
    if (selected.length === 0) return toast("No projects selected", "error");
    if (!confirm("Delete " + selected.length + " project(s)?")) return;
    var done = 0;
    selected.forEach(function(id) {
      fetch("/api/dashboard/projects", { method: "DELETE", headers: apiHeaders(), body: JSON.stringify({ projectId: id }) })
      .then(function(r) { return r.json(); })
      .then(function() { done++; if (done === selected.length) { toast(done + " projects deleted"); window.loadProjects(); } });
    });
  };

  window.createProject = function() {
    // Get inputs from the modal content (they have no IDs)
    var modal = document.getElementById("modalContent");
    if (!modal) return toast("Modal not found", "error");
    var inputs = modal.querySelectorAll("input, textarea");
    var name = inputs[0] ? inputs[0].value : "";
    var address = inputs[1] ? inputs[1].value : "";
    var desc = inputs[2] ? inputs[2].value : "";
    if (!name) return toast("Project name required", "error");
    fetch("/api/dashboard/projects", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ name: name, description: desc, address: address }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) { toast("Project created!"); if (typeof closeModal === "function") closeModal(); window.loadProjects(); }
      else toast(data.error || "Failed", "error");
    })
    .catch(function(e) { toast("Network error: " + e.message, "error"); });
  };

  window.deleteProject = function(projectId) {
    if (!confirm("Delete this project?")) return;
    fetch("/api/dashboard/projects", { method: "DELETE", headers: apiHeaders(), body: JSON.stringify({ projectId: projectId }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast("Project deleted"); window.loadProjects(); } });
  };

  // ---- LOGOUT (override) ----
  window.dashLogout = function() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    window._allOrders = [];
    window._allProjects = [];
    window.location.href = "/login";
  };

    // ---- TEAM ----
  window.loadTeam = function() {
    fetch("/api/dashboard/team", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) window._teamMembers = data.members || []; });
  };

  window.inviteTeamMember = function() {
    var email = document.getElementById("inviteEmail");
    var role = document.getElementById("inviteRole");
    if (!email || !email.value) return toast("Email required", "error");
    fetch("/api/dashboard/team", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ email: email.value, role: role ? role.value : "viewer" }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast("Invitation sent!"); email.value = ""; window.loadTeam(); } else toast(data.error, "error"); });
  };

  window.removeTeamMember = function(memberId) {
    if (!confirm("Remove this team member?")) return;
    fetch("/api/dashboard/team", { method: "DELETE", headers: apiHeaders(), body: JSON.stringify({ memberId: memberId }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast("Member removed"); window.loadTeam(); } });
  };

  // ---- REFERRALS ----
  window.sendReferral = function() {
    var email = document.getElementById("referralEmail");
    if (!email || !email.value) return toast("Email required", "error");
    fetch("/api/dashboard/support", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: "referral", email: email.value }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast(data.message || "Referral sent!"); email.value = ""; } else toast(data.error, "error"); });
  };

  window.loadReferrals = function() {
    fetch("/api/dashboard/support?action=referrals", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) window._referrals = data.referrals || []; });
  };

  // ---- SUPPORT ----
  window.submitSupportTicket = function() {
    var subject = document.getElementById("ticketSubject");
    var message = document.getElementById("ticketMessage");
    if (!subject || !message || !subject.value || !message.value) return toast("Subject and message required", "error");
    fetch("/api/dashboard/support", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: "ticket", subject: subject.value, message: message.value }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast(data.message || "Ticket submitted!"); subject.value = ""; message.value = ""; } else toast(data.error, "error"); });
  };

  window.sendChatMessage = function() {
    var input = document.getElementById("chatInput");
    if (!input || !input.value) return;
    var msg = input.value;
    input.value = "";
    // Add to UI immediately
    var chatBox = document.getElementById("chatMessages");
    if (chatBox) chatBox.innerHTML += '<div style="text-align:right;margin:8px 0"><span style="background:var(--primary);color:white;padding:8px 14px;border-radius:12px;display:inline-block;max-width:80%">' + msg + '</span></div>';
    fetch("/api/dashboard/support", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: "chat", message: msg }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (!data.ok) toast("Message failed", "error"); });
  };

  window.loadChatMessages = function() {
    fetch("/api/dashboard/support?action=chat", { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok) return;
      var chatBox = document.getElementById("chatMessages");
      if (!chatBox) return;
      chatBox.innerHTML = "";
      (data.messages || []).forEach(function(m) {
        var isUser = m.sender === "user";
        chatBox.innerHTML += '<div style="text-align:' + (isUser ? "right" : "left") + ';margin:8px 0"><span style="background:' + (isUser ? "var(--primary)" : "#f0f0f0") + ';color:' + (isUser ? "white" : "#333") + ';padding:8px 14px;border-radius:12px;display:inline-block;max-width:80%">' + m.message + '</span></div>';
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  };

  // ---- ACTIVITY HISTORY ----
  window.loadActivity = function(type) {
    var url = "/api/dashboard/activity?type=" + (type || "all");
    fetch(url, { headers: apiHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.ok) return;
      window._activities = data.activities || [];
      var container = document.getElementById("activityList");
      if (!container) return;
      if (data.activities.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No activity yet</p>'; return; }
      container.innerHTML = data.activities.map(function(a) {
        return '<div style="display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)"><span>' + (a.description || a.label || a.type) + '</span><span style="color:var(--text-muted);font-size:13px">' + new Date(a.timestamp || a.createdAt).toLocaleDateString() + '</span></div>';
      }).join("");
    });
  };

  window.exportActivityCSV = function() {
    if (!window._activities || !window._activities.length) return toast("No activity to export");
    var csv = "Type,Description,Date\n";
    window._activities.forEach(function(a) {
      csv += (a.type || "") + "," + (a.description || a.label || "").replace(/,/g, " ") + "," + (a.timestamp || a.createdAt || "") + "\n";
    });
    var blob = new Blob([csv], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "activity-log.csv";
    a.click();
    toast("CSV exported!");
  };

  // ---- BILLING UPGRADE ----
  window.upgradePlan = function() {
    // Redirect to Buy Credits tab with membership pricing selected
    if (typeof showSub === "function") showSub("credits");
    // Auto-click the Membership Pricing tab after a short delay
    setTimeout(function() {
      var memTab = document.querySelector('[onclick*="Membership"]') || Array.from(document.querySelectorAll("button, div")).find(function(el) { return el.textContent.trim() === "Membership Pricing"; });
      if (memTab) memTab.click();
    }, 300);
  };

  // ---- GOOGLE CALENDAR BOOKING ----
  window.bookPhoneCall = function() {
    window.open("https://calendar.app.google/SRuqvxgGHy36jbHn8", "_blank");
  };


  // Override modal buttons that use fake inline onclick
  setTimeout(function() {
    // Find and fix the Create Project button
    var observer = new MutationObserver(function() {
      var btns = document.querySelectorAll("#modalContent button, #modal button");
      btns.forEach(function(b) {
        if (b.textContent.trim() === "Create Project" && b.getAttribute("data-fixed") !== "true") {
          b.setAttribute("data-fixed", "true");
          b.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.createProject(); };
        }
        if (b.textContent.trim() === "Create Order" && b.getAttribute("data-fixed") !== "true") {
          b.setAttribute("data-fixed", "true");
          b.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.submitNewOrder(); };
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }, 1000);

// ---- AUTO-INIT ----
  setTimeout(function() {
    if (localStorage.getItem("authToken")) {
      window.loadUserProfile();
      window.loadOrders();
      window.loadProjects();
      window.loadTeam();
      window.loadReferrals();
    }
  }, 600);

})();
