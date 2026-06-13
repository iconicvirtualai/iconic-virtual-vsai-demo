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
      var totalCredits = (u.aiCreditsRemaining || 0) + (u.proImagesRemaining || 0);
      var credEl = document.getElementById("stat-credits");
      if (credEl) credEl.textContent = totalCredits;
      var credSub = document.getElementById("stat-credits-sub");
      if (credSub) credSub.textContent = (u.aiCreditsRemaining || 0) + " AI | " + (u.proImagesRemaining || 0) + " Pro";
      // Also update sidebar creditCount and buy-credits proTokenBalance (hardcoded to 42 in HTML)
      var creditCountEl = document.getElementById("creditCount");
      if (creditCountEl) creditCountEl.textContent = totalCredits;
      var proTokenEl = document.getElementById("proTokenBalance");
      if (proTokenEl) proTokenEl.textContent = totalCredits;
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
        html += '<tr style="border-bottom:1px solid var(--border);cursor:pointer" onclick="viewOrder(\x27' + o.id + '\x27)" data-order-id="' + o.id + '"><td style="padding:12px 16px"><input type="checkbox" class="order-checkbox" value="' + o.id + '"></td><td style="padding:12px 16px">' + (o.address || "-") + '</td><td style="padding:12px 16px">' + (o.room || "-") + '</td><td style="padding:12px 16px">' + (o.style || "-") + '</td><td style="padding:12px 16px"><span style="background:' + statusColor + ';color:white;padding:4px 10px;border-radius:20px;font-size:12px">' + (o.status || "draft") + '</span></td><td style="padding:12px 16px;font-size:13px;color:var(--text-muted)">' + new Date(o.createdAt).toLocaleDateString() + '</td><td style="padding:12px 16px"><button class="btn btn-sm btn-ghost" onclick="cancelOrder(\x27' + o.id + '\x27)" title="Cancel">✕</button> <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteOrder(\x27' + o.id + '\x27)" title="Delete">🗑</button></td></tr>';
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
      // Hide ALL static project panels and render into a dedicated container
      var projSection = document.getElementById("sub-projects");
      if (!projSection) return;
      // Hide all static panels (they contain hardcoded demo data)
      projSection.querySelectorAll(".panel").forEach(function(p) { p.style.display = "none"; });
      // Create or find our dynamic container
      var container = document.getElementById("projectsDynamic");
      if (!container) {
        container = document.createElement("div");
        container.id = "projectsDynamic";
        container.className = "panel";
        container.style.padding = "0";
        projSection.appendChild(container);
      }
      container.style.display = "block";
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
      container.innerHTML = html;
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
    var token = localStorage.getItem("authToken");
    if (!token) return toast("Not authenticated", "error");
    var subject = document.getElementById("ticketSubject");
    var message = document.getElementById("ticketMessage");
    var category = document.getElementById("ticketCategory");
    if (!subject || !message || !subject.value || !message.value) return toast("Subject and message required", "error");
    fetch("/api/dashboard/support", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: "ticket", subject: subject.value, message: message.value, category: category ? category.value : "General" }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast(data.message || "Ticket submitted!"); subject.value = ""; message.value = ""; } else toast(data.error, "error"); });
  };

  window.submitEmailSupport = function() {
    var token = localStorage.getItem("authToken");
    if (!token) return toast("Not authenticated", "error");
    var subject = document.getElementById("emailSubject") || document.getElementById("ticketSubject");
    var message = document.getElementById("emailMessage") || document.getElementById("ticketMessage");
    if (!subject || !message || !subject.value || !message.value) return toast("Subject and message required", "error");
    fetch("/api/dashboard/support", { method: "POST", headers: apiHeaders(), body: JSON.stringify({ action: "email", subject: subject.value, message: message.value }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.ok) { toast(data.message || "Email sent!"); subject.value = ""; message.value = ""; } else toast(data.error, "error"); });
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


  

  // ---- ORDER DETAIL VIEW ----
  window.viewOrder = function(orderId) {
    var order = (window._allOrders || []).find(function(o) { return o.id === orderId; });
    if (!order) return toast("Order not found", "error");
    // Show the order detail sub-panel
    var detailSection = document.getElementById("sub-orderDetail");
    if (detailSection) {
      detailSection.innerHTML = '<div style="margin-bottom:20px"><button class="btn btn-secondary" onclick="showSub(\x27orders\x27)" style="margin-bottom:20px">\u2190 Back to Orders</button></div>' +
        '<div class="panel" style="padding:32px"><h2 style="margin-bottom:24px">Order Details</h2>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">' +
        '<div><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Address</label><p style="font-weight:600">' + (order.address || "-") + '</p></div>' +
        '<div><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Room/Project</label><p style="font-weight:600">' + (order.room || order.projectName || "-") + '</p></div>' +
        '<div><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Style</label><p style="font-weight:600">' + (order.style || "-") + '</p></div>' +
        '<div><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Status</label><p><select onchange="updateOrderStatus(\x27' + order.id + '\x27, this.value)" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border)"><option value="draft"' + (order.status==="draft"?" selected":"") + '>Draft</option><option value="processing"' + (order.status==="processing"?" selected":"") + '>Processing</option><option value="completed"' + (order.status==="completed"||order.status==="paid"?" selected":"") + '>Completed</option><option value="failed"' + (order.status==="failed"?" selected":"") + '>Failed</option><option value="canceled"' + (order.status==="canceled"?" selected":"") + '>Canceled</option></select></p></div>' +
        '<div><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Created</label><p>' + new Date(order.createdAt).toLocaleString() + '</p></div>' +
        '<div><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Payment</label><p style="font-weight:600">' + (order.paymentStatus || "unpaid") + '</p></div>' +
        '</div>' +
        (order.notes ? '<div style="margin-bottom:24px"><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Notes</label><p>' + order.notes + '</p></div>' : "") +
        (order.customerName ? '<div style="margin-bottom:24px"><label style="font-size:12px;color:var(--text-muted);text-transform:uppercase">Customer</label><p>' + order.customerName + (order.customerEmail ? " (" + order.customerEmail + ")" : "") + '</p></div>' : "") +
        '<div style="border-top:1px solid var(--border);padding-top:24px;margin-top:24px"><h3 style="margin-bottom:16px">Invoice</h3>' +
        '<table style="width:100%;border-collapse:collapse"><tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:8px 0;font-size:13px;color:var(--text-muted)">Item</th><th style="text-align:right;padding:8px 0;font-size:13px;color:var(--text-muted)">Amount</th></tr>' +
        '<tr><td style="padding:12px 0">' + (order.planName || order.type || "Staging Service") + ' - ' + (order.address || "") + '</td><td style="text-align:right;padding:12px 0;font-weight:600">' + (order.amountTotal ? "$" + (order.amountTotal / 100).toFixed(2) : order.credits ? order.credits + " credits" : "Pending") + '</td></tr>' +
        '<tr style="border-top:2px solid var(--border)"><td style="padding:12px 0;font-weight:700">Total</td><td style="text-align:right;padding:12px 0;font-weight:700;font-size:18px">' + (order.amountTotal ? "$" + (order.amountTotal / 100).toFixed(2) : "Pending") + '</td></tr></table></div>' +
        (order.receiptUrl ? '<a href="' + order.receiptUrl + '" target="_blank" class="btn btn-primary" style="margin-top:16px">View Receipt</a>' : "") +
        (order.paymentStatus === "unpaid" ? '<button class="btn btn-primary" style="margin-top:16px" onclick="toast(\x27Payment integration pending\x27)">Pay Now</button>' : "") +
        '<button class="btn btn-ghost" style="margin-top:16px;margin-left:8px;color:var(--danger)" onclick="deleteOrder(\x27' + order.id + '\x27); showSub(\x27orders\x27);">Delete Order</button>' +
        '</div>';
      if (typeof showSub === "function") showSub("orderDetail");
    }
  };
// ============================================================
  // WIRE ALL STATIC DASHBOARD ELEMENTS TO LIVE API FUNCTIONS
  // ============================================================
  setTimeout(function() {
    // MutationObserver to catch modal buttons and dynamically added elements
    var observer = new MutationObserver(function() {
      // Fix modal buttons
      document.querySelectorAll("#modalContent button, #modal button").forEach(function(b) {
        if (b.getAttribute("data-fixed") === "true") return;
        var txt = b.textContent.trim();
        if (txt === "Create Project") { b.setAttribute("data-fixed","true"); b.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.createProject(); }; }
        if (txt === "Create Order") { b.setAttribute("data-fixed","true"); b.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.submitNewOrder(); }; }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ---- SETTINGS TAB ----
    // Wire Save Profile button
    document.querySelectorAll("#sub-settings button").forEach(function(b) {
      var txt = b.textContent.trim().toLowerCase();
      if ((txt.indexOf("save") > -1 && txt.indexOf("profile") > -1) || txt === "save changes") {
        b.onclick = function(e) { e.preventDefault(); window.saveProfileSettings(); };
      }
      if (txt.indexOf("change password") > -1 || txt.indexOf("update password") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.changePassword(); };
      }
    });

    // ---- BILLING TAB ----
    // Replace static billing content with live data
    var billingPlan = document.querySelector("#sub-billing .stat-value, #sub-billing h2, #sub-billing h3");
    if (window._userProfile) {
      var u = window._userProfile;
      // Find billing elements and update
      document.querySelectorAll("#sub-billing").forEach(function(section) {
        var planEls = section.querySelectorAll("h2, h3, .stat-value");
        planEls.forEach(function(el) {
          if (el.textContent.indexOf("Professional") > -1 || el.textContent.indexOf("$49") > -1) {
            el.textContent = u.activePlan || "Free Plan";
          }
        });
        var renewEls = section.querySelectorAll("p, span");
        renewEls.forEach(function(el) {
          if (el.textContent.indexOf("renewal") > -1 || el.textContent.indexOf("Renewal") > -1) {
            el.textContent = u.planRenewalDate ? "Renews " + new Date(u.planRenewalDate).toLocaleDateString() : "No active subscription";
          }
        });
      });
    }
    // Wire Upgrade Plan button
    document.querySelectorAll("#sub-billing button").forEach(function(b) {
      if (b.textContent.trim().indexOf("Upgrade") > -1 || b.textContent.trim().indexOf("Change Plan") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.upgradePlan(); };
      }
    });

    // ---- HISTORY TAB ----
    // Wire history sub-tab buttons
    document.querySelectorAll("#sub-history .tab-btn, #sub-history button").forEach(function(b) {
      var txt = b.textContent.trim().toLowerCase();
      if (txt.indexOf("all activ") > -1) b.onclick = function() { window.loadActivity("all"); };
      else if (txt.indexOf("staging") > -1) b.onclick = function() { window.loadActivity("staging"); };
      else if (txt.indexOf("credit") > -1 || txt.indexOf("purchase") > -1) b.onclick = function() { window.loadActivity("credit_purchase"); };
      else if (txt.indexOf("account") > -1) b.onclick = function() { window.loadActivity("account_change"); };
      else if (txt.indexOf("login") > -1) b.onclick = function() { window.loadActivity("login"); };
      else if (txt.indexOf("export") > -1) b.onclick = function() { window.exportActivityCSV(); };
    });
    // Create activity list container if not exists
    var historySection = document.getElementById("sub-history");
    if (historySection && !document.getElementById("activityList")) {
      var panels = historySection.querySelectorAll(".panel");
      if (panels.length > 0) {
        var lastPanel = panels[panels.length - 1];
        lastPanel.id = "activityList";
      }
    }
    // Auto-load history
    window.loadActivity("all");

    // ---- TEAM TAB ----
    // Wire invite button
    document.querySelectorAll("#sub-team button").forEach(function(b) {
      var txt = b.textContent.trim().toLowerCase();
      if (txt.indexOf("invite") > -1 || txt.indexOf("send invite") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.inviteTeamMember(); };
      }
    });
    // Wire invite email/role inputs by finding them in the team section
    var teamInputs = document.querySelectorAll("#sub-team input[type=email], #sub-team input[type=text]");
    teamInputs.forEach(function(inp) {
      if (inp.placeholder && (inp.placeholder.toLowerCase().indexOf("email") > -1 || inp.type === "email")) inp.id = "inviteEmail";
    });
    var teamSelects = document.querySelectorAll("#sub-team select");
    teamSelects.forEach(function(sel) { if (!sel.id) sel.id = "inviteRole"; });
    // Wire remove buttons
    document.querySelectorAll("#sub-team .btn-danger, #sub-team [onclick*=remove], #sub-team button").forEach(function(b) {
      if (b.textContent.trim().toLowerCase().indexOf("remove") > -1) {
        b.onclick = function(e) { e.preventDefault(); toast("Use the dynamically rendered team list to manage members"); };
      }
    });
    // Render team from API
    window.loadTeam();

    // ---- SUPPORT TAB ----
    // Wire Send Email / Submit Ticket
    document.querySelectorAll("#sub-support button").forEach(function(b) {
      var txt = b.textContent.trim().toLowerCase();
      if (txt.indexOf("submit") > -1 || txt.indexOf("send ticket") > -1 || txt.indexOf("submit ticket") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.submitSupportTicket(); };
      }
      if (txt.indexOf("send email") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.submitEmailSupport(); };
      }
      if (txt.indexOf("send") > -1 && txt.indexOf("message") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.sendChatMessage(); };
      }
      if (txt.indexOf("book") > -1 || txt.indexOf("schedule") > -1 || txt.indexOf("phone") > -1 || txt.indexOf("call") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.bookPhoneCall(); };
      }
    });
    // Wire chat input
    var chatInputs = document.querySelectorAll("#sub-support input[type=text], #sub-support textarea");
    chatInputs.forEach(function(inp, i) {
      if (i === 0 && !inp.id) inp.id = "chatInput";
    });
    // Wire support ticket fields
    var supportInputs = document.querySelectorAll("#sub-support input, #sub-support textarea");
    supportInputs.forEach(function(inp) {
      if (inp.placeholder) {
        if (inp.placeholder.toLowerCase().indexOf("subject") > -1) inp.id = "ticketSubject";
        if (inp.placeholder.toLowerCase().indexOf("message") > -1 || inp.placeholder.toLowerCase().indexOf("describe") > -1) inp.id = "ticketMessage";
      }
    });

    // ---- REFER & EARN TAB ----
    document.querySelectorAll("#sub-refer button").forEach(function(b) {
      var txt = b.textContent.trim().toLowerCase();
      if (txt.indexOf("send") > -1 || txt.indexOf("invite") > -1 || txt.indexOf("refer") > -1) {
        b.onclick = function(e) { e.preventDefault(); window.sendReferral(); };
      }
      if (txt.indexOf("copy") > -1) {
        b.onclick = function(e) {
          e.preventDefault();
          var link = "https://www.iconicvirtual.ai/login?ref=" + (localStorage.getItem("userId") || "");
          navigator.clipboard.writeText(link).then(function() { toast("Referral link copied!"); });
        };
      }
    });
    // Wire referral email input
    var referInputs = document.querySelectorAll("#sub-refer input[type=email], #sub-refer input[type=text]");
    referInputs.forEach(function(inp) { if (!inp.id) inp.id = "referralEmail"; });

    // ---- NOTIFICATION BELL ----
    // Clear static notifications
    var notifDropdown = document.querySelector(".notif-dropdown, #notifDropdown");
    if (notifDropdown) {
      notifDropdown.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">No new notifications</div>';
    }

  }, 1500);

// ---- AUTO-INIT ----
  setTimeout(function() {
    if (localStorage.getItem("authToken")) {
      window.loadUserProfile();
      // Hide static panels before loading
      document.querySelectorAll("#sub-orders .panel").forEach(function(p) { if (!p.id) p.style.display = "none"; });
      document.querySelectorAll("#sub-projects .panel").forEach(function(p) { if (!p.id) p.style.display = "none"; });
      window.loadOrders();
      window.loadProjects();
      window.loadTeam();
      window.loadReferrals();
    }
  }, 600);

})();
