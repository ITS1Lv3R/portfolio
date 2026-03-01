(function () {
  'use strict';

  const STORAGE_CLIENTS = 'idev_crm_clients';
  const STORAGE_DEALS = 'idev_crm_deals';
  const STORAGE_TASKS = 'idev_crm_tasks';
  const STORAGE_EMPLOYEES = 'idev_crm_employees';
  const STAGES = ['lead', 'negotiation', 'deal', 'done'];
  const ROLES = {
    admin: { label: 'Admin', permissions: 'Full access: clients, deals, tasks, team' },
    manager: { label: 'Manager', permissions: 'Full access: clients, deals, tasks' },
    viewer: { label: 'Viewer', permissions: 'View-only: clients, deals, tasks' }
  };

  const defaultClients = [
    { id: '1', name: 'ООО «Ромашка»', company: 'Ромашка', email: 'info@romashka.ru', phone: '+7 495 111-22-33', createdAt: Date.now() - 86400000 * 5 },
    { id: '2', name: 'Иван Петров', company: 'Фриланс', email: 'ivan@mail.ru', phone: '+7 916 123-45-67', createdAt: Date.now() - 86400000 * 3 },
    { id: '3', name: 'Анна Сидорова', company: 'Сидор и партнёры', email: 'anna@sidor.ru', phone: '+7 903 777-88-99', createdAt: Date.now() - 86400000 }
  ];

  const defaultDeals = [
    { id: 'd1', clientId: '1', title: 'Разработка сайта', amount: 150000, stage: 'negotiation', createdAt: Date.now() - 86400000 * 2 },
    { id: 'd2', clientId: '2', title: 'Telegram-бот', amount: 45000, stage: 'lead', createdAt: Date.now() - 86400000 },
    { id: 'd3', clientId: '3', title: 'Интеграция с 1С', amount: 80000, stage: 'deal', createdAt: Date.now() - 86400000 * 4 },
    { id: 'd4', clientId: '1', title: 'Поддержка и доработки', amount: 25000, stage: 'done', createdAt: Date.now() - 86400000 * 10 }
  ];

  const defaultTasks = [
    { id: 't1', dealId: 'd1', clientId: '1', title: 'Отправить КП по сайту', dueDate: new Date().toISOString().slice(0, 10), done: false },
    { id: 't2', dealId: 'd2', clientId: '2', title: 'Созвон по ТЗ бота', dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), done: false },
    { id: 't3', dealId: null, clientId: null, title: 'Обновить демо-данные в CRM', dueDate: new Date().toISOString().slice(0, 10), done: true }
  ];

  const defaultEmployees = [
    { id: 'e1', name: 'Елена Иванова', email: 'elena@company.ru', role: 'admin' },
    { id: 'e2', name: 'Дмитрий Петров', email: 'dmitry@company.ru', role: 'manager' },
    { id: 'e3', name: 'Мария Сидорова', email: 'maria@company.ru', role: 'manager' },
    { id: 'e4', name: 'Алексей Козлов', email: 'alexey@company.ru', role: 'viewer' }
  ];

  function load(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return defaultValue !== undefined ? defaultValue : [];
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  let clients = load(STORAGE_CLIENTS, defaultClients);
  let deals = load(STORAGE_DEALS, defaultDeals);
  let tasks = load(STORAGE_TASKS, defaultTasks);
  let employees = load(STORAGE_EMPLOYEES, defaultEmployees);

  function persist() {
    save(STORAGE_CLIENTS, clients);
    save(STORAGE_DEALS, deals);
    save(STORAGE_TASKS, tasks);
    save(STORAGE_EMPLOYEES, employees);
    renderAll();
  }

  function getClient(id) {
    return clients.find(function (c) { return c.id === id; });
  }

  function nextId(prefix) {
    return prefix + '_' + Date.now();
  }

  // --- Навигация ---
  document.querySelectorAll('.crm-nav__item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var section = this.getAttribute('data-section');
      document.querySelectorAll('.crm-nav__item').forEach(function (b) { b.classList.remove('is-active'); });
      document.querySelectorAll('.crm-section').forEach(function (s) { s.classList.remove('is-active'); });
      this.classList.add('is-active');
      var el = document.getElementById('section-' + section);
      if (el) el.classList.add('is-active');
    });
  });

  // --- Модалка ---
  var overlay = document.getElementById('modal-overlay');
  var modalContent = document.getElementById('modal-content');

  function openModal(html) {
    modalContent.innerHTML = html;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    var closeBtn = overlay.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  overlay.querySelector('.modal__close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // --- Дашборд и графики ---
  var chartPipeline = null;
  var chartAmounts = null;
  var CHART_COLORS = ['#00e5cc', '#e040b0', '#f0a020', '#22c55e'];
  var STAGE_LABELS = { lead: 'Lead', negotiation: 'Negotiation', deal: 'Deal', done: 'Done' };

  function formatAmount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return String(n);
  }

  function renderDashboard() {
    var leadCount = deals.filter(function (d) { return d.stage === 'lead'; }).length;
    var negCount = deals.filter(function (d) { return d.stage === 'negotiation'; }).length;
    var dealCount = deals.filter(function (d) { return d.stage === 'deal'; }).length;
    var doneCount = deals.filter(function (d) { return d.stage === 'done'; }).length;
    var activeTasks = tasks.filter(function (t) { return !t.done; }).length;
    var totalAmount = deals.filter(function (d) { return d.stage === 'done'; }).reduce(function (sum, d) { return sum + (d.amount || 0); }, 0);

    document.getElementById('stat-clients').textContent = clients.length;
    document.getElementById('stat-leads').textContent = leadCount;
    document.getElementById('stat-negotiation').textContent = negCount;
    document.getElementById('stat-deals').textContent = dealCount;
    document.getElementById('stat-tasks').textContent = activeTasks;
    document.getElementById('stat-total-amount').textContent = totalAmount ? formatAmount(totalAmount) : '0';
    var statEl = document.getElementById('stat-employees');
    if (statEl) statEl.textContent = employees.length;

    var recent = clients.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).slice(0, 5);
    var listEl = document.getElementById('dashboard-recent-list');
    if (recent.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No clients yet. Add one in Clients.</div>';
    } else {
      listEl.innerHTML = recent.map(function (c) {
        var date = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : '—';
        return '<div class="dashboard-recent__item"><span>' + escapeHtml(c.name) + ' — ' + escapeHtml(c.company || '') + '</span><span>' + date + '</span></div>';
      }).join('');
    }

    if (typeof Chart !== 'undefined') {
      var labels = STAGES.map(function (s) { return STAGE_LABELS[s]; });
      var counts = STAGES.map(function (s) { return deals.filter(function (d) { return d.stage === s; }).length; });
      var amounts = STAGES.map(function (s) {
        return deals.filter(function (d) { return d.stage === s; }).reduce(function (sum, d) { return sum + (d.amount || 0); }, 0);
      });

      if (chartPipeline) { chartPipeline.destroy(); chartPipeline = null; }
      var canvasPipeline = document.getElementById('chart-pipeline');
      if (canvasPipeline) {
        chartPipeline = new Chart(canvasPipeline, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{ data: counts, backgroundColor: CHART_COLORS, borderColor: 'rgba(10,10,12,0.9)', borderWidth: 2 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#8888a0', padding: 12 } }
            }
          }
        });
      }

      if (chartAmounts) { chartAmounts.destroy(); chartAmounts = null; }
      var canvasAmounts = document.getElementById('chart-amounts');
      if (canvasAmounts) {
        chartAmounts = new Chart(canvasAmounts, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Amount',
              data: amounts,
              backgroundColor: CHART_COLORS.map(function (c) { return c + 'cc'; }),
              borderColor: CHART_COLORS,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.06)' },
                ticks: { color: '#8888a0' }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#8888a0', maxRotation: 25 }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // --- Клиенты ---
  function formClient(editId) {
    var c = editId ? getClient(editId) : null;
    var name = c ? c.name : '';
    var company = c ? (c.company || '') : '';
    var email = c ? (c.email || '') : '';
    var phone = c ? (c.phone || '') : '';
    return (
      '<h3>' + (c ? 'Edit client' : 'New client') + '</h3>' +
      '<form id="form-client">' +
      '<input type="hidden" name="id" value="' + (editId || '') + '">' +
      '<div class="form-group"><label>Name</label><input type="text" name="name" value="' + escapeHtml(name) + '" required></div>' +
      '<div class="form-group"><label>Company</label><input type="text" name="company" value="' + escapeHtml(company) + '"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email" value="' + escapeHtml(email) + '"></div>' +
      '<div class="form-group"><label>Phone</label><input type="text" name="phone" value="' + escapeHtml(phone) + '"></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn--ghost modal-cancel">Cancel</button>' +
      '<button type="submit" class="btn btn--primary">' + (c ? 'Save' : 'Add') + '</button>' +
      '</div></form>'
    );
  }

  document.getElementById('btn-add-client').addEventListener('click', function () {
    openModal(formClient());
    var form = document.getElementById('form-client');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var id = fd.get('id');
        var data = { name: fd.get('name'), company: fd.get('company'), email: fd.get('email'), phone: fd.get('phone') };
        if (id) {
          var idx = clients.findIndex(function (c) { return c.id === id; });
          if (idx !== -1) {
            clients[idx] = Object.assign({}, clients[idx], data);
          }
        } else {
          data.id = nextId('c');
          data.createdAt = Date.now();
          clients.push(data);
        }
        persist();
        closeModal();
      });
    }
  });

  function deleteClient(id) {
    if (!confirm('Delete this client? Related deals and tasks will be unlinked.')) return;
    clients = clients.filter(function (c) { return c.id !== id; });
    persist();
  }

  function editClient(id) {
    openModal(formClient(id));
    var form = document.getElementById('form-client');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var idx = clients.findIndex(function (c) { return c.id === id; });
        if (idx !== -1) {
          clients[idx] = Object.assign({}, clients[idx], {
            name: fd.get('name'),
            company: fd.get('company'),
            email: fd.get('email'),
            phone: fd.get('phone')
          });
        }
        persist();
        closeModal();
      });
    }
  }

  function renderClients() {
    var tbody = document.getElementById('clients-tbody');
    if (clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No clients. Click Add client.</td></tr>';
      return;
    }
    tbody.innerHTML = clients.map(function (c) {
      var contacts = [c.email, c.phone].filter(Boolean).join(' · ') || '—';
      return (
        '<tr>' +
        '<td>' + escapeHtml(c.name) + '</td>' +
        '<td>' + escapeHtml(c.company || '—') + '</td>' +
        '<td>' + escapeHtml(contacts) + '</td>' +
        '<td class="row-actions">' +
        '<button type="button" class="btn btn--ghost btn--small edit-client" data-id="' + escapeHtml(c.id) + '">Edit</button>' +
        '<button type="button" class="btn btn--ghost btn--small btn--danger delete-client" data-id="' + escapeHtml(c.id) + '">Delete</button>' +
        '</td></tr>'
      );
    }).join('');
    tbody.querySelectorAll('.edit-client').forEach(function (btn) {
      btn.addEventListener('click', function () { editClient(btn.getAttribute('data-id')); });
    });
    tbody.querySelectorAll('.delete-client').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteClient(btn.getAttribute('data-id')); });
    });
  }

  // --- Сделки ---
  function formDeal(editId) {
    var d = editId ? deals.find(function (x) { return x.id === editId; }) : null;
    var clientOptions = clients.map(function (c) {
      return '<option value="' + c.id + '"' + (d && d.clientId === c.id ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
    }).join('');
    return (
      '<h3>' + (d ? 'Edit deal' : 'New deal') + '</h3>' +
      '<form id="form-deal">' +
      '<input type="hidden" name="id" value="' + (editId || '') + '">' +
      '<div class="form-group"><label>Title</label><input type="text" name="title" value="' + (d ? escapeHtml(d.title) : '') + '" required></div>' +
      '<div class="form-group"><label>Client</label><select name="clientId"><option value="">—</option>' + clientOptions + '</select></div>' +
      '<div class="form-group"><label>Amount</label><input type="number" name="amount" value="' + (d ? d.amount : '') + '" min="0" step="1"></div>' +
      '<div class="form-group"><label>Stage</label><select name="stage">' +
      STAGES.map(function (s) {
        var labels = { lead: 'Lead', negotiation: 'Negotiation', deal: 'Deal', done: 'Done' };
        return '<option value="' + s + '"' + (d && d.stage === s ? ' selected' : '') + '>' + (labels[s] || s) + '</option>';
      }).join('') +
      '</select></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn--ghost modal-cancel">Cancel</button>' +
      '<button type="submit" class="btn btn--primary">' + (d ? 'Save' : 'Add') + '</button>' +
      '</div></form>'
    );
  }

  document.getElementById('btn-add-deal').addEventListener('click', function () {
    openModal(formDeal());
    var form = document.getElementById('form-deal');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var id = fd.get('id');
        var data = {
          title: fd.get('title'),
          clientId: fd.get('clientId') || null,
          amount: parseInt(fd.get('amount'), 10) || 0,
          stage: fd.get('stage') || 'lead'
        };
        if (id) {
          var idx = deals.findIndex(function (d) { return d.id === id; });
          if (idx !== -1) deals[idx] = Object.assign({}, deals[idx], data);
        } else {
          data.id = nextId('d');
          data.createdAt = Date.now();
          deals.push(data);
        }
        persist();
        closeModal();
      });
    }
  });

  function updateDealStage(dealId, newStage) {
    var d = deals.find(function (x) { return x.id === dealId; });
    if (d) { d.stage = newStage; persist(); }
  }

  function deleteDeal(id) {
    if (!confirm('Delete this deal?')) return;
    deals = deals.filter(function (d) { return d.id !== id; });
    tasks = tasks.map(function (t) { if (t.dealId === id) t.dealId = null; return t; });
    persist();
  }

  function editDeal(id) {
    openModal(formDeal(id));
    var form = document.getElementById('form-deal');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var idx = deals.findIndex(function (d) { return d.id === id; });
        if (idx !== -1) {
          deals[idx] = Object.assign({}, deals[idx], {
            title: fd.get('title'),
            clientId: fd.get('clientId') || null,
            amount: parseInt(fd.get('amount'), 10) || 0,
            stage: fd.get('stage') || 'lead'
          });
        }
        persist();
        closeModal();
      });
    }
  }

  function renderPipeline() {
    STAGES.forEach(function (stage) {
      var col = document.getElementById('column-' + stage);
      if (!col) return;
      var list = deals.filter(function (d) { return d.stage === stage; });
      col.innerHTML = list.map(function (d) {
        var client = d.clientId ? getClient(d.clientId) : null;
        var clientName = client ? client.name : '—';
        var amount = d.amount ? (d.amount.toLocaleString('en-US')) : '—';
        var options = STAGES.map(function (s) {
          return '<option value="' + s + '"' + (d.stage === s ? ' selected' : '') + '>' + ({ lead: 'Lead', negotiation: 'Negotiation', deal: 'Deal', done: 'Done' }[s]) + '</option>';
        }).join('');
        return (
          '<div class="deal-card" data-deal-id="' + d.id + '">' +
          '<div class="deal-card__title">' + escapeHtml(d.title) + '</div>' +
          '<div class="deal-card__client">' + escapeHtml(clientName) + '</div>' +
          '<div class="deal-card__amount">' + amount + '</div>' +
          '<div class="deal-card__actions">' +
          '<select class="deal-stage-select" data-deal-id="' + d.id + '">' + options + '</select>' +
          '<button type="button" class="btn btn--ghost btn--small edit-deal" data-id="' + d.id + '">Edit</button>' +
          '<button type="button" class="btn btn--ghost btn--small btn--danger delete-deal" data-id="' + d.id + '">×</button>' +
          '</div></div>'
        );
      }).join('');

      col.querySelectorAll('.deal-stage-select').forEach(function (sel) {
        sel.addEventListener('change', function () {
          updateDealStage(sel.getAttribute('data-deal-id'), sel.value);
        });
      });
      col.querySelectorAll('.edit-deal').forEach(function (btn) {
        btn.addEventListener('click', function () { editDeal(btn.getAttribute('data-id')); });
      });
      col.querySelectorAll('.delete-deal').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteDeal(btn.getAttribute('data-id')); });
      });
    });
  }

  // --- Задачи ---
  function formTask(editId) {
    var t = editId ? tasks.find(function (x) { return x.id === editId; }) : null;
    var dealOptions = '<option value="">—</option>' + deals.map(function (d) {
      var c = d.clientId ? getClient(d.clientId) : null;
      var label = d.title + (c ? ' (' + c.name + ')' : '');
      return '<option value="' + d.id + '"' + (t && t.dealId === d.id ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
    var due = t && t.dueDate ? t.dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return (
      '<h3>' + (t ? 'Edit task' : 'New task') + '</h3>' +
      '<form id="form-task">' +
      '<input type="hidden" name="id" value="' + (editId || '') + '">' +
      '<div class="form-group"><label>Task</label><input type="text" name="title" value="' + (t ? escapeHtml(t.title) : '') + '" required></div>' +
      '<div class="form-group"><label>Deal</label><select name="dealId">' + dealOptions + '</select></div>' +
      '<div class="form-group"><label>Due date</label><input type="date" name="dueDate" value="' + due + '"></div>' +
      (t ? '<div class="form-group"><label><input type="checkbox" name="done" ' + (t.done ? 'checked' : '') + '> Done</label></div>' : '') +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn--ghost modal-cancel">Cancel</button>' +
      '<button type="submit" class="btn btn--primary">' + (t ? 'Save' : 'Add') + '</button>' +
      '</div></form>'
    );
  }

  document.getElementById('btn-add-task').addEventListener('click', function () {
    openModal(formTask());
    var form = document.getElementById('form-task');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var id = fd.get('id');
        var dealId = fd.get('dealId') || null;
        var deal = dealId ? deals.find(function (d) { return d.id === dealId; }) : null;
        var data = {
          title: fd.get('title'),
          dealId: dealId,
          clientId: deal ? deal.clientId : null,
          dueDate: fd.get('dueDate') || null,
          done: !!form.querySelector('[name="done"]') && form.querySelector('[name="done"]').checked
        };
        if (id) {
          var idx = tasks.findIndex(function (x) { return x.id === id; });
          if (idx !== -1) tasks[idx] = Object.assign({}, tasks[idx], data);
        } else {
          data.id = nextId('t');
          tasks.push(data);
        }
        persist();
        closeModal();
      });
    }
  });

  function toggleTaskDone(id) {
    var t = tasks.find(function (x) { return x.id === id; });
    if (t) { t.done = !t.done; persist(); }
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    persist();
  }

  function editTask(id) {
    openModal(formTask(id));
    var form = document.getElementById('form-task');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var idx = tasks.findIndex(function (t) { return t.id === id; });
        var dealId = fd.get('dealId') || null;
        var deal = dealId ? deals.find(function (d) { return d.id === dealId; }) : null;
        if (idx !== -1) {
          tasks[idx] = Object.assign({}, tasks[idx], {
            title: fd.get('title'),
            dealId: dealId,
            clientId: deal ? deal.clientId : null,
            dueDate: fd.get('dueDate') || null,
            done: !!form.querySelector('[name="done"]') && form.querySelector('[name="done"]').checked
          });
        }
        persist();
        closeModal();
      });
    }
  }

  function renderTasks() {
    var listEl = document.getElementById('tasks-list');
    var sorted = tasks.slice().sort(function (a, b) {
      var da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      var db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      if (a.done !== b.done) return a.done ? 1 : -1;
      return da - db;
    });
    if (sorted.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No tasks. Click Add task.</div>';
      return;
    }
    listEl.innerHTML = sorted.map(function (t) {
      var deal = t.dealId ? deals.find(function (d) { return d.id === t.dealId; }) : null;
      var meta = [];
      if (t.dueDate) meta.push('Due: ' + new Date(t.dueDate).toLocaleDateString('en-US'));
      if (deal) meta.push('Deal: ' + deal.title);
      return (
        '<div class="task-item' + (t.done ? ' is-done' : '') + '" data-task-id="' + t.id + '">' +
        '<input type="checkbox" class="task-item__checkbox" ' + (t.done ? 'checked' : '') + ' aria-label="Done">' +
        '<div class="task-item__body">' +
        '<div class="task-item__title">' + escapeHtml(t.title) + '</div>' +
        '<div class="task-item__meta">' + (meta.join(' · ') || '') + '</div></div>' +
        '<div class="task-item__actions">' +
        '<button type="button" class="btn btn--ghost btn--small edit-task" data-id="' + t.id + '">Edit</button>' +
        '<button type="button" class="btn btn--ghost btn--small btn--danger delete-task" data-id="' + t.id + '">×</button>' +
        '</div></div>'
      );
    }).join('');

    listEl.querySelectorAll('.task-item__checkbox').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.closest('.task-item').getAttribute('data-task-id');
        toggleTaskDone(id);
      });
    });
    listEl.querySelectorAll('.edit-task').forEach(function (btn) {
      btn.addEventListener('click', function () { editTask(btn.getAttribute('data-id')); });
    });
    listEl.querySelectorAll('.delete-task').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteTask(btn.getAttribute('data-id')); });
    });
  }

  // --- Сотрудники ---
  function formEmployee(editId) {
    var emp = editId ? employees.find(function (e) { return e.id === editId; }) : null;
    var roleOptions = Object.keys(ROLES).map(function (key) {
      return '<option value="' + key + '"' + (emp && emp.role === key ? ' selected' : '') + '>' + ROLES[key].label + '</option>';
    }).join('');
    return (
      '<h3>' + (emp ? 'Edit team member' : 'New team member') + '</h3>' +
      '<form id="form-employee">' +
      '<input type="hidden" name="id" value="' + (editId || '') + '">' +
      '<div class="form-group"><label>Name</label><input type="text" name="name" value="' + (emp ? escapeHtml(emp.name) : '') + '" required></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email" value="' + (emp ? escapeHtml(emp.email) : '') + '" required></div>' +
      '<div class="form-group"><label>Role</label><select name="role">' + roleOptions + '</select></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn--ghost modal-cancel">Cancel</button>' +
      '<button type="submit" class="btn btn--primary">' + (emp ? 'Save' : 'Add') + '</button>' +
      '</div></form>'
    );
  }

  document.getElementById('btn-add-employee').addEventListener('click', function () {
    openModal(formEmployee());
    var form = document.getElementById('form-employee');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var id = fd.get('id');
        var data = { name: fd.get('name'), email: fd.get('email'), role: fd.get('role') || 'viewer' };
        if (id) {
          var idx = employees.findIndex(function (e) { return e.id === id; });
          if (idx !== -1) employees[idx] = Object.assign({}, employees[idx], data);
        } else {
          data.id = nextId('e');
          employees.push(data);
        }
        persist();
        closeModal();
      });
    }
  });

  function deleteEmployee(id) {
    if (!confirm('Remove this team member?')) return;
    employees = employees.filter(function (e) { return e.id !== id; });
    persist();
  }

  function editEmployee(id) {
    openModal(formEmployee(id));
    var form = document.getElementById('form-employee');
    if (form) {
      form.querySelector('.modal-cancel').addEventListener('click', closeModal);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var idx = employees.findIndex(function (e) { return e.id === id; });
        if (idx !== -1) {
          employees[idx] = Object.assign({}, employees[idx], {
            name: fd.get('name'),
            email: fd.get('email'),
            role: fd.get('role') || 'viewer'
          });
        }
        persist();
        closeModal();
      });
    }
  }

  function renderEmployees() {
    var tbody = document.getElementById('employees-tbody');
    if (!tbody) return;
    if (employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No team members. Click Add member.</td></tr>';
      return;
    }
    tbody.innerHTML = employees.map(function (emp) {
      var roleInfo = ROLES[emp.role] || ROLES.viewer;
      return (
        '<tr>' +
        '<td>' + escapeHtml(emp.name) + '</td>' +
        '<td>' + escapeHtml(emp.email) + '</td>' +
        '<td><span class="role-badge role-badge--' + emp.role + '">' + escapeHtml(roleInfo.label) + '</span></td>' +
        '<td class="permissions-cell">' + escapeHtml(roleInfo.permissions) + '</td>' +
        '<td class="row-actions">' +
        '<button type="button" class="btn btn--ghost btn--small edit-employee" data-id="' + escapeHtml(emp.id) + '">Edit</button>' +
        '<button type="button" class="btn btn--ghost btn--small btn--danger delete-employee" data-id="' + escapeHtml(emp.id) + '">Remove</button>' +
        '</td></tr>'
      );
    }).join('');
    tbody.querySelectorAll('.edit-employee').forEach(function (btn) {
      btn.addEventListener('click', function () { editEmployee(btn.getAttribute('data-id')); });
    });
    tbody.querySelectorAll('.delete-employee').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteEmployee(btn.getAttribute('data-id')); });
    });
  }

  function renderAll() {
    renderDashboard();
    renderClients();
    renderPipeline();
    renderTasks();
    renderEmployees();
  }

  renderAll();
})();
