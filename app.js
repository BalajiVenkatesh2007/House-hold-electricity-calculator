/**
 * Household Energy Calculator - Application Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Application State
  const state = {
    appliances: [...DEFAULT_APPLIANCES],
    currency: CURRENCY_DATABASE.USD,
    tariffMode: 'flat', // 'flat' | 'tiered' | 'tou'
    flatRate: 0.16,
    tierRates: { tier1: 0.12, tier2: 0.18, tier3: 0.28 },
    touRates: { peak: 0.25, offPeak: 0.10, peakShare: 35 },
    fixedFee: 12.00,
    taxPct: 5.0,
    activeTab: 'tab-appliances',
    filterRoom: 'all',

    // Simulator slider states
    simTemp: 0,
    simSolar: 0,
    simLed: 0,
    simShift: 0
  };

  // Chart instances
  let roomChart = null;
  let topChart = null;

  // DOM Handles
  const homePreset = document.getElementById('homePreset');
  const currencySelect = document.getElementById('currencySelect');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnReset = document.getElementById('btnReset');
  const filterRoom = document.getElementById('filterRoom');

  // Metrics DOM
  const metricCost = document.getElementById('metricCost');
  const metricDailyCost = document.getElementById('metricDailyCost');
  const metricKwh = document.getElementById('metricKwh');
  const metricDailyKwh = document.getElementById('metricDailyKwh');
  const metricCo2 = document.getElementById('metricCo2');
  const metricTrees = document.getElementById('metricTrees');
  const metricSavings = document.getElementById('metricSavings');
  const metricSavingsPct = document.getElementById('metricSavingsPct');

  // Load state from local storage if available
  loadLocalStorageState();

  // Tab navigation listeners
  document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const targetLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    const targetContent = document.getElementById(tabId);
    if (targetLink) targetLink.classList.add('active');
    if (targetContent) targetContent.classList.add('active');

    if (tabId === 'tab-analytics') {
      renderCharts();
    }
  }

  // Tariff mode switcher
  document.querySelectorAll('.tariff-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.tariff-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.tariffMode = card.getAttribute('data-mode');

      document.getElementById('flatConfig').style.display = state.tariffMode === 'flat' ? 'block' : 'none';
      document.getElementById('tieredConfig').style.display = state.tariffMode === 'tiered' ? 'block' : 'none';
      document.getElementById('touConfig').style.display = state.tariffMode === 'tou' ? 'block' : 'none';

      recalculateAll();
    });
  });

  // Preset profile listener
  homePreset.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== 'custom' && PRESET_HOMES[val]) {
      state.appliances = JSON.parse(JSON.stringify(PRESET_HOMES[val].appliances));
      showToast(`Loaded profile: ${PRESET_HOMES[val].name}`);
      recalculateAll();
    }
  });

  // Currency select listener
  currencySelect.addEventListener('change', (e) => {
    const code = e.target.value;
    if (CURRENCY_DATABASE[code]) {
      state.currency = CURRENCY_DATABASE[code];
      state.flatRate = state.currency.rate;
      document.getElementById('flatRateInput').value = state.flatRate.toFixed(2);
      updateCurrencySymbols();
      recalculateAll();
      showToast(`Currency set to ${state.currency.name} (${state.currency.symbol})`);
    }
  });

  function updateCurrencySymbols() {
    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = state.currency.symbol;
    });
  }

  // Reset button
  btnReset.addEventListener('click', () => {
    if (confirm('Reset all appliance data and custom rates to defaults?')) {
      state.appliances = JSON.parse(JSON.stringify(DEFAULT_APPLIANCES));
      state.tariffMode = 'flat';
      state.simTemp = 0;
      state.simSolar = 0;
      state.simLed = 0;
      state.simShift = 0;
      homePreset.value = 'custom';
      recalculateAll();
      showToast('App state has been reset.');
    }
  });

  // Form Add Appliance
  const addApplianceForm = document.getElementById('addApplianceForm');
  addApplianceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newAppName').value.trim();
    const room = document.getElementById('newAppRoom').value;
    const watts = parseFloat(document.getElementById('newAppWatts').value);
    const hoursPerDay = parseFloat(document.getElementById('newAppHours').value);
    const daysPerWeek = parseFloat(document.getElementById('newAppDays').value) || 7;
    const qty = parseInt(document.getElementById('newAppQty').value) || 1;

    if (!name || isNaN(watts) || isNaN(hoursPerDay)) return;

    const newApp = {
      id: 'custom_' + Date.now(),
      name,
      room,
      watts,
      quantity: qty,
      hoursPerDay,
      daysPerWeek,
      dutyCycleRatio: 1.0,
      icon: 'zap',
      tip: `Custom device (${watts}W, ${hoursPerDay}h/day)`
    };

    state.appliances.push(newApp);
    addApplianceForm.reset();
    document.getElementById('newAppDays').value = 7;
    document.getElementById('newAppQty').value = 1;
    homePreset.value = 'custom';
    showToast(`Added "${name}"`);
    recalculateAll();
  });

  // Room Filter Listener
  filterRoom.addEventListener('change', (e) => {
    state.filterRoom = e.target.value;
    renderApplianceTable();
  });

  // Tariff input listeners
  document.getElementById('flatRateInput').addEventListener('input', (e) => {
    state.flatRate = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('tier1Rate').addEventListener('input', (e) => {
    state.tierRates.tier1 = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('tier2Rate').addEventListener('input', (e) => {
    state.tierRates.tier2 = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('tier3Rate').addEventListener('input', (e) => {
    state.tierRates.tier3 = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('touPeakRate').addEventListener('input', (e) => {
    state.touRates.peak = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('touOffPeakRate').addEventListener('input', (e) => {
    state.touRates.offPeak = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('touPeakShare').addEventListener('input', (e) => {
    state.touRates.peakShare = parseFloat(e.target.value) || 0;
    document.getElementById('touPeakShareVal').textContent = `${state.touRates.peakShare}%`;
    recalculateAll();
  });
  document.getElementById('fixedMonthlyFee').addEventListener('input', (e) => {
    state.fixedFee = parseFloat(e.target.value) || 0;
    recalculateAll();
  });
  document.getElementById('taxPercentage').addEventListener('input', (e) => {
    state.taxPct = parseFloat(e.target.value) || 0;
    recalculateAll();
  });

  // Simulator slider listeners
  document.getElementById('simTempSlider').addEventListener('input', (e) => {
    state.simTemp = parseInt(e.target.value);
    document.getElementById('simTempVal').textContent = state.simTemp > 0 ? `+${state.simTemp}°C Saved` : `+0°C (Default)`;
    updateSimulatorResults();
  });
  document.getElementById('simSolarSlider').addEventListener('input', (e) => {
    state.simSolar = parseFloat(e.target.value);
    document.getElementById('simSolarVal').textContent = state.simSolar > 0 ? `${state.simSolar} kW System` : `0 kW (No Solar)`;
    updateSimulatorResults();
  });
  document.getElementById('simLedSlider').addEventListener('input', (e) => {
    state.simLed = parseInt(e.target.value);
    document.getElementById('simLedVal').textContent = `${state.simLed}% Converted`;
    updateSimulatorResults();
  });
  document.getElementById('simShiftSlider').addEventListener('input', (e) => {
    state.simShift = parseInt(e.target.value);
    document.getElementById('simShiftVal').textContent = `${state.simShift}% Shifted`;
    updateSimulatorResults();
  });

  // Export CSV Listener
  btnExportCsv.addEventListener('click', exportToCsv);

  // Calculation Utilities
  function calculateApplianceMonthlyKwh(app) {
    const qty = app.quantity || 1;
    const ratio = app.dutyCycleRatio || 1.0;
    const dailyHours = app.hoursPerDay * ratio;
    const daysPerWk = app.daysPerWeek !== undefined ? app.daysPerWeek : 7;
    const weeklyHours = dailyHours * daysPerWk;
    const monthlyHours = (weeklyHours / 7) * 30;
    return ((app.watts * qty) * monthlyHours) / 1000;
  }

  function calculateTariffCost(totalKwh) {
    let energyCharge = 0;

    if (state.tariffMode === 'flat') {
      energyCharge = totalKwh * state.flatRate;
    } else if (state.tariffMode === 'tiered') {
      const block1 = Math.min(totalKwh, 150);
      const block2 = Math.max(0, Math.min(totalKwh - 150, 200));
      const block3 = Math.max(0, totalKwh - 350);

      energyCharge = (block1 * state.tierRates.tier1) +
                     (block2 * state.tierRates.tier2) +
                     (block3 * state.tierRates.tier3);
    } else if (state.tariffMode === 'tou') {
      const peakKwh = totalKwh * (state.touRates.peakShare / 100);
      const offPeakKwh = totalKwh - peakKwh;
      energyCharge = (peakKwh * state.touRates.peak) + (offPeakKwh * state.touRates.offPeak);
    }

    const subtotal = energyCharge + state.fixedFee;
    const totalCost = subtotal * (1 + (state.taxPct / 100));
    return Math.max(0, totalCost);
  }

  function recalculateAll() {
    renderApplianceTable();
    updateMetrics();
    renderEnergyTips();
    updateSimulatorResults();
    if (state.activeTab === 'tab-analytics') {
      renderCharts();
    }
    saveStateToLocalStorage();
  }

  function updateMetrics() {
    let totalMonthlyKwh = 0;
    state.appliances.forEach(app => {
      totalMonthlyKwh += calculateApplianceMonthlyKwh(app);
    });

    const monthlyCost = calculateTariffCost(totalMonthlyKwh);
    const dailyCost = monthlyCost / 30;
    const dailyKwh = totalMonthlyKwh / 30;

    const co2Kg = totalMonthlyKwh * state.currency.co2;
    const treesNeeded = Math.ceil(co2Kg / 1.83); // ~22kg/yr absorption

    const symbol = state.currency.symbol;

    metricCost.textContent = `${symbol}${monthlyCost.toFixed(2)}`;
    metricDailyCost.textContent = `Daily Average: ${symbol}${dailyCost.toFixed(2)}`;

    metricKwh.textContent = `${totalMonthlyKwh.toFixed(1)} kWh`;
    metricDailyKwh.textContent = `Daily Average: ${dailyKwh.toFixed(1)} kWh`;

    metricCo2.textContent = `${co2Kg.toFixed(1)} kg CO₂`;
    metricTrees.textContent = `≈ ${treesNeeded} trees offset/yr`;

    const savings = calculatePotentialSavings(totalMonthlyKwh, monthlyCost);
    metricSavings.textContent = `${symbol}${savings.monthly.toFixed(2)}`;
    const pct = monthlyCost > 0 ? ((savings.monthly / monthlyCost) * 100).toFixed(0) : 0;
    metricSavingsPct.textContent = `Up to ${pct}% bill reduction`;
  }

  function renderApplianceTable() {
    const tbody = document.getElementById('applianceTableBody');
    tbody.innerHTML = '';

    const filtered = state.filterRoom === 'all' 
      ? state.appliances 
      : state.appliances.filter(a => a.room === state.filterRoom);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted); padding:24px;">No devices found in this room category.</td></tr>`;
      return;
    }

    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const totalCost = calculateTariffCost(totalKwh);

    filtered.forEach((app, index) => {
      // Find actual index in state.appliances array
      const realIndex = state.appliances.findIndex(a => a.id === app.id);
      const activeIdx = realIndex !== -1 ? realIndex : index;

      const monthlyKwh = calculateApplianceMonthlyKwh(app);
      const appCost = totalKwh > 0 ? (monthlyKwh / totalKwh) * totalCost : 0;
      const symbol = state.currency.symbol;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <input type="text" value="${app.name}" data-index="${activeIdx}" data-field="name" style="width:100%; font-weight:600;" placeholder="Appliance Name">
        </td>
        <td>
          <select data-index="${activeIdx}" data-field="room" style="width:100%; font-size:0.85rem;">
            ${Object.keys(ROOM_CATEGORIES).map(rKey => `
              <option value="${rKey}" ${app.room === rKey ? 'selected' : ''}>${ROOM_CATEGORIES[rKey].name}</option>
            `).join('')}
          </select>
        </td>
        <td>
          <input type="number" value="${app.watts}" min="1" max="10000" style="width:75px;" data-index="${activeIdx}" data-field="watts"> W
        </td>
        <td>
          <input type="number" value="${app.hoursPerDay}" min="0.1" max="24" step="0.1" style="width:65px;" data-index="${activeIdx}" data-field="hoursPerDay"> h
        </td>
        <td>
          <input type="number" value="${app.daysPerWeek !== undefined ? app.daysPerWeek : 7}" min="1" max="7" style="width:55px;" data-index="${activeIdx}" data-field="daysPerWeek"> d
        </td>
        <td>
          <input type="number" value="${app.quantity || 1}" min="1" max="50" style="width:55px;" data-index="${activeIdx}" data-field="quantity">
        </td>
        <td><strong>${monthlyKwh.toFixed(1)}</strong> kWh</td>
        <td style="color:var(--primary-emerald); font-weight:600;">${symbol}${appCost.toFixed(2)}</td>
        <td>
          <button class="icon-btn btn-delete" data-index="${activeIdx}" title="Delete Appliance">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Attach listeners for live inline row edits (Name, Room, Watts, Hours, Days, Quantity)
    tbody.querySelectorAll('input, select').forEach(element => {
      const handleEdit = (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        if (isNaN(idx) || !state.appliances[idx]) return;

        let val = e.target.value;
        if (field === 'watts' || field === 'hoursPerDay' || field === 'daysPerWeek' || field === 'quantity') {
          val = parseFloat(val);
          if (isNaN(val)) return;
        }

        state.appliances[idx][field] = val;
        homePreset.value = 'custom';
        
        // Update calculations live
        updateMetrics();
        renderEnergyTips();
        updateSimulatorResults();
        saveStateToLocalStorage();

        // Update the monthly kWh and cost cell for this specific row without re-rendering inputs (prevents focus loss)
        const row = e.target.closest('tr');
        if (row) {
          const app = state.appliances[idx];
          const mKwh = calculateApplianceMonthlyKwh(app);
          const tKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
          const tCost = calculateTariffCost(tKwh);
          const aCost = tKwh > 0 ? (mKwh / tKwh) * tCost : 0;
          const symbol = state.currency.symbol;

          const cells = row.querySelectorAll('td');
          if (cells.length >= 8) {
            cells[6].innerHTML = `<strong>${mKwh.toFixed(1)}</strong> kWh`;
            cells[7].innerHTML = `${symbol}${aCost.toFixed(2)}`;
          }
        }
      };

      element.addEventListener('input', handleEdit);
      element.addEventListener('change', handleEdit);
    });

    // Delete button listeners
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        if (!isNaN(idx) && state.appliances[idx]) {
          const removed = state.appliances.splice(idx, 1);
          if (removed.length) showToast(`Removed "${removed[0].name}"`);
          homePreset.value = 'custom';
          recalculateAll();
        }
      });
    });
  }

  // Energy Saving Advice Engine
  function generateTips() {
    const tips = [];
    const symbol = state.currency.symbol;
    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const totalCost = calculateTariffCost(totalKwh);

    // HVAC check
    const hvacKwh = state.appliances.filter(a => a.room === 'hvac').reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    if (hvacKwh / (totalKwh || 1) > 0.25) {
      tips.push({
        title: 'Optimize Air Conditioning Thermostat',
        desc: 'Cooling/heating accounts for over 25% of your bill. Raising thermostat settings by 2°C saves up to 15% on HVAC energy.',
        savings: `${symbol}${(totalCost * 0.15).toFixed(2)} / month`,
        icon: 'thermometer-sun'
      });
    }

    // Water heater check
    const geyser = state.appliances.find(a => a.name.toLowerCase().includes('geyser') || a.name.toLowerCase().includes('water'));
    if (geyser && geyser.hoursPerDay >= 1.5) {
      tips.push({
        title: 'Install Digital Water Heater Timer',
        desc: 'Geysers draw heavy power. A digital timer prevents continuous reheating standby loss when not taking showers.',
        savings: `${symbol}${(calculateApplianceMonthlyKwh(geyser) * 0.3 * (state.flatRate || 0.16)).toFixed(2)} / month`,
        icon: 'clock'
      });
    }

    // Standby power draw check
    const entCount = state.appliances.filter(a => a.room === 'entertainment').length;
    if (entCount > 0) {
      tips.push({
        title: 'Eliminate Phantom Standby Power Draw',
        desc: 'TVs, gaming rigs, and set-top boxes consume 5–10W constantly while in standby. Use smart power strips to auto-shutoff.',
        savings: `${symbol}${(12 * (state.flatRate || 0.16)).toFixed(2)} / month`,
        icon: 'power'
      });
    }

    // Lighting check
    const halogen = state.appliances.find(a => a.room === 'lighting' && a.watts > 40);
    if (halogen) {
      tips.push({
        title: 'Replace Legacy Bulbs with LEDs',
        desc: 'High-wattage lighting drains unnecessary electricity. Switching to 9W LEDs cuts lighting power usage by 80%.',
        savings: `${symbol}${(calculateApplianceMonthlyKwh(halogen) * 0.75 * state.flatRate).toFixed(2)} / month`,
        icon: 'lightbulb'
      });
    }

    return tips;
  }

  function renderEnergyTips() {
    const container = document.getElementById('tipsGridContainer');
    container.innerHTML = '';
    const tips = generateTips();

    tips.forEach(t => {
      const box = document.createElement('div');
      box.className = 'tip-box';
      box.innerHTML = `
        <div>
          <div class="tip-top">
            <div class="tip-avatar">
              <i data-lucide="${t.icon}"></i>
            </div>
            <div>
              <div class="tip-title-text">${t.title}</div>
              <span class="chip chip-amber">HIGH ROI</span>
            </div>
          </div>
          <div class="tip-body">${t.desc}</div>
        </div>
        <div class="tip-bottom">
          <span>Est. Savings:</span>
          <span class="savings-highlight">${t.savings}</span>
        </div>
      `;
      container.appendChild(box);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function calculatePotentialSavings(totalKwh, totalCost) {
    const tips = generateTips();
    let sum = 0;
    tips.forEach(t => {
      const m = t.savings.match(/[\d.]+/);
      if (m) sum += parseFloat(m[0]);
    });
    return { monthly: Math.min(sum, totalCost * 0.35) };
  }

  // Interactive Simulator Logic
  function updateSimulatorResults() {
    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const baseBill = calculateTariffCost(totalKwh);

    // 1. Thermostat savings
    const hvacKwh = state.appliances.filter(a => a.room === 'hvac').reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const hvacSaved = hvacKwh * (state.simTemp * 0.07);

    // 2. Solar PV generation offset (~120 kWh / month per 1 kW)
    const solarOffset = state.simSolar * 120;

    // 3. LED conversion savings
    const lightKwh = state.appliances.filter(a => a.room === 'lighting').reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const ledSaved = lightKwh * (state.simLed / 100) * 0.5;

    const netKwh = Math.max(0, totalKwh - hvacSaved - solarOffset - ledSaved);
    let simBill = 0;

    if (state.tariffMode === 'tou' && state.simShift > 0) {
      const shiftPeak = Math.max(10, state.touRates.peakShare - (state.simShift * 0.25));
      const peakKwh = netKwh * (shiftPeak / 100);
      const offPeakKwh = netKwh - peakKwh;
      const energyCharge = (peakKwh * state.touRates.peak) + (offPeakKwh * state.touRates.offPeak);
      simBill = (energyCharge + state.fixedFee) * (1 + (state.taxPct / 100));
    } else {
      simBill = calculateTariffCost(netKwh);
    }

    const netSavings = Math.max(0, baseBill - simBill);
    const symbol = state.currency.symbol;

    document.getElementById('simCurrentBill').textContent = `${symbol}${baseBill.toFixed(2)}`;
    document.getElementById('simOptimizedBill').textContent = `${symbol}${simBill.toFixed(2)}`;
    document.getElementById('simNetSavings').textContent = `${symbol}${netSavings.toFixed(2)}/mo`;
  }

  // Chart Rendering
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    // Room Donut Chart
    const roomSums = {};
    Object.keys(ROOM_CATEGORIES).forEach(r => roomSums[r] = 0);

    state.appliances.forEach(app => {
      const kwh = calculateApplianceMonthlyKwh(app);
      if (roomSums[app.room] !== undefined) roomSums[app.room] += kwh;
      else roomSums[app.room] = kwh;
    });

    const labels = Object.keys(roomSums).map(r => ROOM_CATEGORIES[r] ? ROOM_CATEGORIES[r].name : r);
    const dataVals = Object.values(roomSums);
    const colors = Object.keys(roomSums).map(r => ROOM_CATEGORIES[r] ? ROOM_CATEGORIES[r].color : '#94a3b8');

    const ctxRoom = document.getElementById('roomChartCanvas');
    if (ctxRoom) {
      if (roomChart) roomChart.destroy();
      roomChart = new Chart(ctxRoom, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: dataVals, backgroundColor: colors, borderColor: '#131929', borderWidth: 2 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } } }
        }
      });
    }

    // Top Appliances Bar Chart
    const sortedApps = [...state.appliances].sort((a, b) => calculateApplianceMonthlyKwh(b) - calculateApplianceMonthlyKwh(a)).slice(0, 5);
    const barLabels = sortedApps.map(a => a.name);
    const barData = sortedApps.map(a => calculateApplianceMonthlyKwh(a).toFixed(1));

    const ctxTop = document.getElementById('topChartCanvas');
    if (ctxTop) {
      if (topChart) topChart.destroy();
      topChart = new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [{
            label: 'Monthly kWh',
            data: barData,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  // Export CSV
  function exportToCsv() {
    let csv = 'Appliance,Room Category,Watts,Hours Per Day,Days Per Week,Quantity,Monthly kWh,Monthly Cost\n';
    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const totalCost = calculateTariffCost(totalKwh);

    state.appliances.forEach(app => {
      const kwh = calculateApplianceMonthlyKwh(app);
      const cost = totalKwh > 0 ? (kwh / totalKwh) * totalCost : 0;
      const roomName = ROOM_CATEGORIES[app.room] ? ROOM_CATEGORIES[app.room].name : app.room;
      csv += `"${app.name}","${roomName}",${app.watts},${app.hoursPerDay},${app.daysPerWeek || 7},${app.quantity || 1},${kwh.toFixed(2)},${cost.toFixed(2)}\n`;
    });

    csv += `\nTotal Monthly Consumption (kWh),,,,,,,${totalKwh.toFixed(2)}\n`;
    csv += `Total Monthly Cost (${state.currency.code}),,,,,,,${totalCost.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Household_Energy_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Report exported as CSV');
  }

  // LocalStorage state management
  function saveStateToLocalStorage() {
    try {
      localStorage.setItem('hec_state_v2', JSON.stringify({
        appliances: state.appliances,
        currencyCode: state.currency.code,
        tariffMode: state.tariffMode,
        flatRate: state.flatRate,
        tierRates: state.tierRates,
        touRates: state.touRates,
        fixedFee: state.fixedFee,
        taxPct: state.taxPct
      }));
    } catch (e) {}
  }

  function loadLocalStorageState() {
    try {
      const raw = localStorage.getItem('hec_state_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.appliances) state.appliances = parsed.appliances;
        if (parsed.currencyCode && CURRENCY_DATABASE[parsed.currencyCode]) {
          state.currency = CURRENCY_DATABASE[parsed.currencyCode];
          currencySelect.value = parsed.currencyCode;
        }
        if (parsed.tariffMode) state.tariffMode = parsed.tariffMode;
        if (parsed.flatRate) state.flatRate = parsed.flatRate;
        if (parsed.tierRates) state.tierRates = parsed.tierRates;
        if (parsed.touRates) state.touRates = parsed.touRates;
        if (parsed.fixedFee !== undefined) state.fixedFee = parsed.fixedFee;
        if (parsed.taxPct !== undefined) state.taxPct = parsed.taxPct;
      }
    } catch (e) {}
  }

  function showToast(msg) {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = msg;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Initialize
  updateCurrencySymbols();
  recalculateAll();
});
