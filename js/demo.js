/* ===========================================================
   demo.js — shared demo interactivity for MiniMart ERP
   Client-side only (dummy data). Provides toast notifications,
   modal open/close, row delete, and simple table search so every
   button/link in the demo gives a visible response.
=========================================================== */

function toggleSubMenu(event, menuId) {
    event.preventDefault();
    var subMenu = document.getElementById(menuId);
    var toggle = event.currentTarget;
    var chevron = toggle.querySelector('.chevron');
    var sidebar = document.querySelector('.sidebar');
    var isCollapsed = sidebar && sidebar.classList.contains('collapsed');

    if (isCollapsed) {
        // Icon-only mode: show the sub-items as a floating flyout next to the icon
        // instead of expanding inline (there's no room for labels in a 76px rail).
        var alreadyOpen = subMenu.classList.contains('flyout-open');
        closeAllFlyouts();
        if (!alreadyOpen) {
            var rect = toggle.getBoundingClientRect();
            subMenu.style.position = 'fixed';
            subMenu.style.top = Math.max(rect.top, 8) + 'px';
            subMenu.style.left = (rect.right + 8) + 'px';
            subMenu.style.display = 'block';
            subMenu.classList.add('flyout-open');
        }
        return;
    }

    if (subMenu.style.display === "block") {
        subMenu.style.display = "none";
        if (chevron) chevron.style.transform = "rotate(0deg)";
    } else {
        subMenu.style.display = "block";
        if (chevron) chevron.style.transform = "rotate(180deg)";
    }
}

function closeAllFlyouts() {
    document.querySelectorAll('.sub-menu.flyout-open').forEach(function (sm) {
        sm.classList.remove('flyout-open');
        sm.style.display = 'none';
        sm.style.position = '';
        sm.style.top = '';
        sm.style.left = '';
    });
}

/* Close an open flyout when clicking anywhere outside the sidebar's dropdowns */
document.addEventListener('click', function (e) {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar || !sidebar.classList.contains('collapsed')) return;
    if (!e.target.closest('.dropdown')) closeAllFlyouts();
});

/* ===========================================================
   Sidebar collapse / expand toggle — icon-only rail vs full
   labels, persisted across pages via localStorage.
=========================================================== */
function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    var collapsed = sidebar.classList.toggle('collapsed');
    try { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0'); } catch (e) {}
    closeAllFlyouts();
}

(function restoreSidebarState() {
    try {
        var sidebar = document.querySelector('.sidebar');
        if (sidebar && localStorage.getItem('sidebarCollapsed') === '1') {
            sidebar.classList.add('collapsed');
        }
    } catch (e) {}
})();

/* ===========================================================
   Sidebar menu search — live filter across all nav items
   (top-level links + items inside the Master Data / Laporan
   dropdowns), with highlight, auto-expand, empty state and
   an Enter-to-go-to-first-result shortcut.
=========================================================== */
function highlightText(el, query) {
    var original = el.getAttribute('data-original-text');
    if (original === null) {
        original = el.textContent;
        el.setAttribute('data-original-text', original);
    }
    if (!query) {
        el.textContent = original;
        return;
    }
    var idx = original.toLowerCase().indexOf(query);
    if (idx === -1) {
        el.textContent = original;
        return;
    }
    el.innerHTML = original.substring(0, idx) +
        '<mark>' + original.substring(idx, idx + query.length) + '</mark>' +
        original.substring(idx + query.length);
}

function filterNavMenu(input) {
    var q = input.value.trim().toLowerCase();
    var hasQuery = q.length > 0;
    var wrap = input.closest('.nav-search');
    if (wrap) wrap.classList.toggle('has-value', hasQuery);

    var navMenu = input.closest('.nav-menu');
    if (!navMenu) return;

    var totalVisible = 0;

    // Top-level plain nav items (Dashboard, Riwayat Penjualan, Pembelian, dst.)
    navMenu.querySelectorAll(':scope > a.nav-item').forEach(function (el) {
        var span = el.querySelector('span');
        var text = (span ? span.textContent : el.textContent).toLowerCase();
        var match = !hasQuery || text.indexOf(q) !== -1;
        el.style.display = match ? '' : 'none';
        if (span) highlightText(span, hasQuery ? q : '');
        if (match) totalVisible++;
    });

    // Dropdown groups (Master Data, Laporan)
    navMenu.querySelectorAll(':scope > .dropdown').forEach(function (group) {
        var toggle = group.querySelector('.dropdown-toggle');
        var toggleSpan = toggle.querySelector('span');
        var toggleText = (toggleSpan ? toggleSpan.textContent : toggle.textContent).toLowerCase();
        var toggleMatch = !hasQuery || toggleText.indexOf(q) !== -1;
        var subMenu = group.querySelector('.sub-menu');
        var chevron = toggle.querySelector('.chevron');
        var anySubMatch = false;

        group.querySelectorAll('.sub-item').forEach(function (sub) {
            var t = sub.textContent.toLowerCase();
            var match = !hasQuery || t.indexOf(q) !== -1 || toggleMatch;
            sub.style.display = match ? '' : 'none';
            highlightText(sub, hasQuery ? q : '');
            if (match && hasQuery) anySubMatch = true;
        });

        var groupVisible = toggleMatch || anySubMatch;
        group.style.display = groupVisible ? '' : 'none';
        if (groupVisible) totalVisible++;

        if (hasQuery) {
            var expand = anySubMatch || toggleMatch;
            subMenu.style.display = expand ? 'block' : 'none';
            if (chevron) chevron.style.transform = expand ? 'rotate(180deg)' : 'rotate(0deg)';
        } else {
            var hasActiveSub = group.querySelector('.sub-item.active');
            subMenu.style.display = hasActiveSub ? 'block' : 'none';
            if (chevron) chevron.style.transform = hasActiveSub ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    });

    // Section headers (Modul Utama / Data Master / Laporan & Analitik) — only relevant
    // when searching; hide a header if every item under it is hidden.
    var sections = navMenu.querySelectorAll('.nav-section');
    sections.forEach(function (section, i) {
        if (!hasQuery) { section.style.display = ''; return; }
        var el = section.nextElementSibling;
        var anyVisible = false;
        while (el && !el.classList.contains('nav-section')) {
            if (el.style.display !== 'none') anyVisible = true;
            el = el.nextElementSibling;
        }
        section.style.display = anyVisible ? '' : 'none';
    });

    var emptyState = navMenu.querySelector('.nav-empty-state');
    if (emptyState) emptyState.style.display = (hasQuery && totalVisible === 0) ? 'block' : 'none';
}

function clearNavSearch(btn) {
    var wrap = btn.closest('.nav-search');
    var input = wrap.querySelector('input');
    input.value = '';
    filterNavMenu(input);
    input.focus();
}

function navSearchEnter(event, input) {
    if (event.key !== 'Enter') return;
    var navMenu = input.closest('.nav-menu');
    var links = navMenu.querySelectorAll('a.nav-item:not(.dropdown-toggle)');
    for (var i = 0; i < links.length; i++) {
        if (links[i].offsetParent !== null) {
            window.location.href = links[i].getAttribute('href');
            return;
        }
    }
}

/* ---------- Toast ----------
   Position is configurable per page via <body data-toast-position="...">.
   Default (no attribute): bottom-right corner — the original placement used
   on every standard ERP page. pos.html sets "bottom-center" instead, since
   its cart/pay panel only occupies the right side of the screen, so the
   default bottom-right spot would sit right on top of "Bayar Sekarang".
*/
function getToastPosition() {
    return document.body.getAttribute('data-toast-position') || 'bottom-right';
}

function ensureToastHost() {
    var host = document.getElementById('toastHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        document.body.appendChild(host);
    }
    var base = 'position:fixed;z-index:2000;display:flex;flex-direction:column;gap:10px;max-width:320px;';
    if (getToastPosition() === 'bottom-center') {
        host.style.cssText = base + 'bottom:24px;left:50%;transform:translateX(-50%);align-items:center;';
    } else {
        host.style.cssText = base + 'bottom:20px;right:20px;';
    }
    return host;
}

function showToast(message, type) {
    type = type || 'success';
    var colors = {
        success: { bg: '#10b981', fg: '#fff' },
        info: { bg: '#3b82f6', fg: '#fff' },
        warning: { bg: '#f59e0b', fg: '#fff' },
        danger: { bg: '#ef4444', fg: '#fff' }
    };
    var c = colors[type] || colors.success;
    var host = ensureToastHost();
    var offscreen = 'translateY(10px)'; // both bottom-right and bottom-center slide up from below
    var toast = document.createElement('div');
    toast.style.cssText = 'background:' + c.bg + ';color:' + c.fg + ';padding:12px 18px;border-radius:10px;' +
        'font-size:13px;font-weight:600;box-shadow:0 10px 15px -3px rgba(0,0,0,0.15);min-width:240px;' +
        'display:flex;align-items:center;gap:10px;opacity:0;transform:' + offscreen + ';transition:all 0.25s ease;';
    toast.innerHTML = '<span>' + message + '</span>';
    host.appendChild(toast);
    requestAnimationFrame(function () {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = offscreen;
        setTimeout(function () { toast.remove(); }, 250);
    }, 2800);
}

/* ---------- Modal ---------- */
function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('active');
}
function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
}
// close modal when clicking the dark overlay itself
document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

/* ---------- Generic form submit inside a modal ---------- */
function handleDemoSubmit(event, modalId, successMsg) {
    event.preventDefault();
    closeModal(modalId);
    showToast(successMsg || 'Data berhasil disimpan (demo).', 'success');
    return false;
}

/* ---------- Delete row with confirm ---------- */
function demoDeleteRow(btn, label) {
    if (!confirm('Hapus ' + (label || 'data ini') + '? Tindakan ini hanya simulasi demo.')) return;
    var row = btn.closest('tr');
    if (row) {
        row.style.transition = 'opacity 0.25s ease';
        row.style.opacity = '0';
        setTimeout(function () { row.remove(); }, 250);
    }
    showToast((label || 'Data') + ' berhasil dihapus (demo).', 'danger');
}

/* ---------- Simple live table search ---------- */
function demoFilterTable(input, tbodyId) {
    var q = input.value.toLowerCase();
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.rows, function (row) {
        var text = row.innerText.toLowerCase();
        row.style.display = text.indexOf(q) === -1 ? 'none' : '';
    });
}

/* ---------- Open a modal pre-filled for "Edit" actions ----------
   btn: the Edit button, must carry data-values="a|b|c"
   modalId: the modal to open
   fieldIdsCsv: "inputId1,inputId2,inputId3" matching the order of data-values
*/
function openEditModal(btn, modalId, fieldIdsCsv) {
    var raw = btn.getAttribute('data-values') || '';
    var values = raw.split('|');
    var ids = fieldIdsCsv.split(',');
    ids.forEach(function (id, i) {
        var el = document.getElementById(id.trim());
        if (el && values[i] !== undefined) el.value = values[i];
    });
    var modalTitle = document.querySelector('#' + modalId + ' .modal-title');
    if (modalTitle && modalTitle.dataset.editLabel) {
        modalTitle.textContent = modalTitle.dataset.editLabel;
    }
    openModal(modalId);
}

/* Reset a form + restore modal title to its "add" label, then open it */
function openAddModal(formId, modalId) {
    var form = document.getElementById(formId);
    if (form) form.reset();
    var modalTitle = document.querySelector('#' + modalId + ' .modal-title');
    if (modalTitle && modalTitle.dataset.addLabel) {
        modalTitle.textContent = modalTitle.dataset.addLabel;
    }
    openModal(modalId);
}

/* ---------- Generic "coming soon" for actions not central to the demo ---------- */
function demoAction(message) {
    showToast(message || 'Fitur ini aktif pada versi lengkap.', 'info');
}

/* ---------- Cross-page quick actions ----------
   A dashboard shortcut can link to another page with
   ?openModal=modalId&openForm=formId — on load, that page
   resets the form and opens the modal automatically.
*/
document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var modalId = params.get('openModal');
    var formId = params.get('openForm');
    if (modalId) {
        if (formId) {
            var form = document.getElementById(formId);
            if (form) form.reset();
        }
        openModal(modalId);
    }
});
