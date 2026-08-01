// Household Energy Usage & Cost Calculator Application Core
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // State Management
  const state = {
    appliances: [...DEFAULT_APPLIANCES],
    currency: CURRENCIES.USD,
    tariffMode: 'flat', // 'flat' | 'tiered' | 'tou'
    flatRate: 0.16,
    tierRates: { tier1: 0.12, tier2: 0.18, tier3: 0.28 },
    touRates: { peak: 0.25, offPeak: 0.10, peakShare: 35 },
    fixedFee: 12.00,
    taxPct: 5.0,
    activeTab: 'tab-appliances',
    filterRoom: 'all',
    // Simulator states
    simTemp: 0,
    simSolar: 0,
    simLed: 0,
    simShift: 0
  };

  // Chart instances
  let roomChart = null;
  let topApplianceChart = null;

  // DOM Elements
  const presetSelect = document.getElementById('presetSelect');
  const currencySelect = document.getElementById('currencySelect');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnReset = document.getElementById('btnReset');
  const filterRoomSelect = document.getElementById('filterRoomSelect');

  // Metrics DOM
  const metricCost = document.getElementById('metricCost');
  const metricDailyCost = document.getElementById('metricDailyCost');
  const metricKwh = document.getElementById('metricKwh');
  const metricDailyKwh = document.getElementById('metricDailyKwh');
  const metricCo2 = document.getElementById('metricCo2');
  const metricTrees = document.getElementById('metricTrees');
  const metricSavings = document.getElementById('metricSavings');
  const metricSavingsPct = document.getElementById('metricSavingsPct');

  // Load saved state from LocalStorage if available
  loadStateFromLocalStorage();

  // Navigation Tabs Listener
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const activePanel = document.getElementById(tabId);
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');

    if (tabId === 'tab-analytics') {
      renderCharts();
    }
  }

  // Tariff mode selection
  document.querySelectorAll('.tariff-mode-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.tariff-mode-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.tariffMode = card.getAttribute('data-mode');

      document.getElementById('flatTariffConfig').style.display = state.tariffMode === 'flat' ? 'block' : 'none';
      document.getElementById('tieredTariffConfig').style.display = state.tariffMode === 'tiered' ? 'block' : 'none';
      document.getElementById('touTariffConfig').style.display = state.tariffMode === 'tou' ? 'block' : 'none';

      recalculateAndRender();
    });
  });

  // Event Listeners for Preset & Currency
  presetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== 'custom' && PRESET_PROFILES[val]) {
      state.appliances = JSON.parse(JSON.stringify(PRESET_PROFILES[val].appliances));
      showToast(`Loaded preset profile: ${PRESET_PROFILES[val].name}`);
      recalculateAndRender();
    }
  });

  currencySelect.addEventListener('change', (e) => {
    const currKey = e.target.value;
    if (CURRENCIES[currKey]) {
      state.currency = CURRENCIES[currKey];
      state.flatRate = state.currency.ratePerKwh;
      document.getElementById('inputFlatRate').value = state.flatRate.toFixed(2);
      updateCurrencySymbols();
      recalculateAndRender();
      showToast(`Switched currency to ${state.currency.name} (${state.currency.symbol})`);
    }
  });

  function updateCurrencySymbols() {
    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = state.currency.symbol;
    });
  }

  // Reset Button
  btnReset.addEventListener('click', () => {
    if (confirm('Reset all appliances and tariff settings to default?')) {
      state.appliances = JSON.parse(JSON.stringify(DEFAULT_APPLIANCES));
      state.tariffMode = 'flat';
      state.simTemp = 0;
      state.simSolar = 0;
      state.simLed = 0;
      state.simShift = 0;
      presetSelect.value = 'custom';
      recalculateAndRender();
      showToast('App state has been reset to defaults.');
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
    const daysPerWeek = parseFloat(document.getElementById('newAppDays').value);

    if (!name || isNaN(watts) || isNaN(hoursPerDay)) return;

    const newApp = {
      id: 'custom_' + Date.now(),
      name,
      room,
      watts,
      hoursPerDay,
      daysPerWeek: isNaN(daysPerWeek) ? 7 : daysPerWeek,
      tip: `Custom appliance added (${watts}W, ${hoursPerDay}h/day).`
    };

    state.appliances.push(newApp);
    addApplianceForm.reset();
    document.getElementById('newAppDays').value = 7;
    presetSelect.value = 'custom';
    showToast(`Added "${name}" to list.`);
    recalculateAndRender();
  });

  // Filter appliances table by room
  filterRoomSelect.addEventListener('change', (e) => {
    state.filterRoom = e.target.value;
    renderApplianceTable();
  });

  // Inputs change listener for tariffs
  document.getElementById('inputFlatRate').addEventListener('input', (e) => {
    state.flatRate = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });

  document.getElementById('tier1Rate').addEventListener('input', (e) => {
    state.tierRates.tier1 = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });
  document.getElementById('tier2Rate').addEventListener('input', (e) => {
    state.tierRates.tier2 = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });
  document.getElementById('tier3Rate').addEventListener('input', (e) => {
    state.tierRates.tier3 = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });

  document.getElementById('touPeakRate').addEventListener('input', (e) => {
    state.touRates.peak = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });
  document.getElementById('touOffPeakRate').addEventListener('input', (e) => {
    state.touRates.offPeak = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });
  document.getElementById('touPeakShare').addEventListener('input', (e) => {
    state.touRates.peakShare = parseFloat(e.target.value) || 0;
    document.getElementById('touPeakShareVal').textContent = `${state.touRates.peakShare}%`;
    recalculateAndRender();
  });

  document.getElementById('fixedMonthlyFee').addEventListener('input', (e) => {
    state.fixedFee = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });
  document.getElementById('taxPercentage').addEventListener('input', (e) => {
    state.taxPct = parseFloat(e.target.value) || 0;
    recalculateAndRender();
  });

  // Simulator Sliders listeners
  document.getElementById('simTempSlider').addEventListener('input', (e) => {
    state.simTemp = parseInt(e.target.value);
    document.getElementById('simTempVal').textContent = state.simTemp > 0 ? `+${state.simTemp}°C Saved` : `+0°C (Default)`;
    updateSimulatorResults();
  });

  document.getElementById('simSolarSlider').addEventListener('input', (e) => {
    state.simSolar = parseFloat(e.target.value);
    document.getElementById('simSolarVal').textContent = state.simSolar > 0 ? `${state.simSolar} kW Installed` : `0 kW (No Solar)`;
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

  // Export CSV
  btnExportCsv.addEventListener('click', exportToCsv);

  // Calculations Core
  function calculateApplianceMonthlyKwh(app) {
    const ratio = app.dutyCycleRatio || (app.isDutyCycle ? 0.45 : 1.0);
    const dailyHours = app.hoursPerDay * ratio;
    const weeklyHours = dailyHours * (app.daysPerWeek || 7);
    const monthlyHours = (weeklyHours / 7) * 30;
    return (app.watts * monthlyHours) / 1000;
  }

  function calculateTariffCost(totalKwh) {
    let energyCharge = 0;

    if (state.tariffMode === 'flat') {
      energyCharge = totalKwh * state.flatRate;
    } else if (state.tariffMode === 'tiered') {
      const tier1Kwh = Math.min(totalKwh, 150);
      const tier2Kwh = Math.max(0, Math.min(totalKwh - 150, 200));
      const tier3Kwh = Math.max(0, totalKwh - 350);

      energyCharge = (tier1Kwh * state.tierRates.tier1) +
                     (tier2Kwh * state.tierRates.tier2) +
                     (tier3Kwh * state.tierRates.tier3);
    } else if (state.tariffMode === 'tou') {
      const peakKwh = totalKwh * (state.touRates.peakShare / 100);
      const offPeakKwh = totalKwh - peakKwh;
      energyCharge = (peakKwh * state.touRates.peak) + (offPeakKwh * state.touRates.offPeak);
    }

    const subtotal = energyCharge + state.fixedFee;
    const totalCost = subtotal * (1 + (state.taxPct / 100));
    return Math.max(0, totalCost);
  }

  function recalculateAndRender() {
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

    // Carbon emissions: total kWh * co2 factor
    const co2Kg = totalMonthlyKwh * state.currency.co2Factor;
    // 1 mature tree absorbs ~22kg CO2 per year (~1.83kg per month)
    const treesNeeded = Math.ceil(co2Kg / 1.83);

    const symbol = state.currency.symbol;

    metricCost.textContent = `${symbol}${monthlyCost.toFixed(2)}`;
    metricDailyCost.textContent = `Daily Avg: ${symbol}${dailyCost.toFixed(2)}`;

    metricKwh.textContent = `${totalMonthlyKwh.toFixed(1)} kWh`;
    metricDailyKwh.textContent = `Daily Avg: ${dailyKwh.toFixed(1)} kWh`;

    metricCo2.textContent = `${co2Kg.toFixed(1)} kg CO₂`;
    metricTrees.textContent = `≈ ${treesNeeded} trees needed to offset/yr`;

    // Estimate potential savings from tips & recommendations
    const savingsEst = calculateTotalPotentialSavings(totalMonthlyKwh, monthlyCost);
    metricSavings.textContent = `${symbol}${savingsEst.monthly.toFixed(2)} / mo`;
    const savingsPct = monthlyCost > 0 ? ((savingsEst.monthly / monthlyCost) * 100).toFixed(0) : 0;
    metricSavingsPct.textContent = `Up to ${savingsPct}% bill reduction`;
  }

  function renderApplianceTable() {
    const tbody = document.getElementById('applianceTableBody');
    tbody.innerHTML = '';

    const filtered = state.filterRoom === 'all' 
      ? state.appliances 
      : state.appliances.filter(a => a.room === state.filterRoom);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">No appliances found in this room category.</td></tr>`;
      return;
    }

    filtered.forEach((app, index) => {
      const monthlyKwh = calculateApplianceMonthlyKwh(app);
      // Rough cost proportional to share of total kWh
      const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
      const totalCost = calculateTariffCost(totalKwh);
      const appCost = totalKwh > 0 ? (monthlyKwh / totalKwh) * totalCost : 0;

      const roomInfo = ROOM_CATEGORIES[app.room] || { name: app.room, color: '#9ca3af' };
      const symbol = state.currency.symbol;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:600;">${app.name}</div>
          <small style="color:var(--text-muted); font-size:0.75rem;">${app.tip || ''}</small>
        </td>
        <td>
          <span class="room-badge" style="border-left: 3px solid ${roomInfo.color};">
            ${roomInfo.name}
          </span>
        </td>
        <td>
          <input type="number" value="${app.watts}" min="1" max="10000" style="width:75px;" data-index="${index}" data-field="watts"> W
        </td>
        <td>
          <input type="number" value="${app.hoursPerDay}" min="0.1" max="24" step="0.1" style="width:65px;" data-index="${index}" data-field="hoursPerDay"> hrs/d
        </td>
        <td><strong>${monthlyKwh.toFixed(1)}</strong> kWh</td>
        <td style="color:var(--primary); font-weight:600;">${symbol}${appCost.toFixed(2)}</td>
        <td>
          <button class="action-btn-icon btn-delete" data-index="${index}" title="Remove Appliance">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Table input update listeners
    tbody.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && state.appliances[idx]) {
          state.appliances[idx][field] = val;
          recalculateAndRender();
        }
      });
    });

    // Delete buttons
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const removed = state.appliances.splice(idx, 1);
        if (removed.length) showToast(`Removed "${removed[0].name}"`);
        presetSelect.value = 'custom';
        recalculateAndRender();
      });
    });
  }

  // Energy Saving Advice Engine
  function generateEnergySavingTips() {
    const tips = [];
    const symbol = state.currency.symbol;

    // Check HVAC consumption
    const hvacApps = state.appliances.filter(a => a.room === 'hvac');
    const hvacKwh = hvacApps.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);

    if (hvacKwh / (totalKwh || 1) > 0.3) {
      const savAmount = calculateTariffCost(totalKwh) * 0.15;
      tips.push({
        title: 'Optimize HVAC Thermostat & Airflow',
        desc: 'Heating and cooling account for over 30% of your total energy bill. Raising your AC temperature by 2°C or setting fan speed to Auto reduces HVAC load significantly.',
        savings: `${symbol}${savAmount.toFixed(2)} / month`,
        level: 'high',
        icon: 'thermometer-sun'
      });
    }

    // Check Water Heater
    const waterHeater = state.appliances.find(a => a.name.toLowerCase().includes('water') || a.name.toLowerCase().includes('geyser'));
    if (waterHeater && waterHeater.hoursPerDay > 1) {
      const whKwh = calculateApplianceMonthlyKwh(waterHeater);
      const savAmount = (whKwh * 0.25) * (state.flatRate || 0.16);
      tips.push({
        title: 'Install Smart Water Heater Timer Switch',
        desc: `Your ${waterHeater.name} runs for ${waterHeater.hoursPerDay} hours daily. Connecting an automated timer to heat water only prior to usage prevents costly standby tank heat loss.`,
        savings: `${symbol}${savAmount.toFixed(2)} / month`,
        level: 'medium',
        icon: 'clock'
      });
    }

    // Check Lighting
    const lightingApps = state.appliances.filter(a => a.room === 'lighting' || a.name.toLowerCase().includes('bulb') || a.name.toLowerCase().includes('light'));
    const incandescent = lightingApps.find(a => a.watts >= 60 && !a.name.toLowerCase().includes('led'));
    if (incandescent) {
      tips.push({
        title: 'Upgrade High-Wattage Lighting to LED',
        desc: 'Replacing standard incandescent bulbs with modern LED equivalents cuts lighting energy usage by up to 85% while lasting 10x longer.',
        savings: `${symbol}${(calculateApplianceMonthlyKwh(incandescent) * 0.8 * state.flatRate).toFixed(2)} / month`,
        level: 'high',
        icon: 'lightbulb'
      });
    }

    // Peak Load Shifting (TOU)
    if (state.tariffMode === 'tou' && state.touRates.peakShare > 25) {
      const peakKwh = totalKwh * (state.touRates.peakShare / 100);
      const shiftSavings = (peakKwh * 0.4) * (state.touRates.peak - state.touRates.offPeak);
      tips.push({
        title: 'Shift Heavy Appliance Runs to Off-Peak Hours',
        desc: 'Run your washing machine, dishwasher, and EV charger during off-peak windows to take advantage of lower utility rates.',
        savings: `${symbol}${shiftSavings.toFixed(2)} / month`,
        level: 'high',
        icon: 'zap'
      });
    }

    // Standby Power Draw
    const electronics = state.appliances.filter(a => a.room === 'entertainment');
    if (electronics.length > 0) {
      tips.push({
        title: 'Eliminate Phantom Standby Loads',
        desc: 'TVs, gaming consoles, and desktop PCs continue drawing 5–10W in standby mode. Connect them to smart power strips that shut off power when not in use.',
        savings: `${symbol}${(15 * state.flatRate).toFixed(2)} / month`,
        level: 'medium',
        icon: 'power'
      });
    }

    // Always include a baseline tip if few appliances
    if (tips.length < 3) {
      tips.push({
        title: 'Clean Appliance Condenser Coils & Air Filters',
        desc: 'Clogged AC filters and dirty refrigerator coils force compressors to run 15% longer. Routine maintenance improves airflow and system longevity.',
        savings: `${symbol}${(totalKwh * 0.05 * state.flatRate).toFixed(2)} / month`,
        level: 'medium',
        icon: 'shield-check'
      });
    }

    return tips;
  }

  function renderEnergyTips() {
    const container = document.getElementById('tipsListContainer');
    container.innerHTML = '';
    const tips = generateEnergySavingTips();

    tips.forEach(t => {
      const card = document.createElement('div');
      card.className = `tip-card ${t.level}`;
      card.innerHTML = `
        <div>
          <div class="tip-header">
            <div class="tip-icon">
              <i data-lucide="${t.icon}"></i>
            </div>
            <div>
              <div class="tip-title">${t.title}</div>
              <span class="badge ${t.level === 'high' ? 'badge-warning' : 'badge-info'}">
                ${t.level.toUpperCase()} IMPACT
              </span>
            </div>
          </div>
          <div class="tip-desc">${t.desc}</div>
        </div>
        <div class="tip-footer">
          <span>Est. Savings:</span>
          <span class="est-savings">${t.savings}</span>
        </div>
      `;
      container.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function calculateTotalPotentialSavings(totalKwh, monthlyCost) {
    const tips = generateEnergySavingTips();
    let totalMonthlySavings = 0;
    tips.forEach(t => {
      const match = t.savings.match(/[\d.]+/);
      if (match) totalMonthlySavings += parseFloat(match[0]);
    });
    return { monthly: Math.min(totalMonthlySavings, monthlyCost * 0.4) };
  }

  // Interactive What-If Simulator Logic
  function updateSimulatorResults() {
    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const baseBill = calculateTariffCost(totalKwh);

    // Apply simulation factors
    // 1. Thermostat shift: -7% HVAC energy per 1 degree
    const hvacKwh = state.appliances.filter(a => a.room === 'hvac').reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const hvacSavingsKwh = hvacKwh * (state.simTemp * 0.07);

    // 2. Solar offset: 120 kWh per 1 kW system
    const solarGenKwh = state.simSolar * 120;

    // 3. LED shift: 50% lighting reduction at 100% conversion
    const lightingKwh = state.appliances.filter(a => a.room === 'lighting').reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const ledSavingsKwh = lightingKwh * (state.simLed / 100) * 0.5;

    // Net optimized kWh
    const simNetKwh = Math.max(0, totalKwh - hvacSavingsKwh - solarGenKwh - ledSavingsKwh);
    
    // 4. If TOU shift applied: adjust TOU peak ratio
    let simBill = 0;
    if (state.tariffMode === 'tou' && state.simShift > 0) {
      const originalPeakShare = state.touRates.peakShare;
      const shiftedPeakShare = Math.max(10, originalPeakShare - (state.simShift * 0.25));
      const peakKwh = simNetKwh * (shiftedPeakShare / 100);
      const offPeakKwh = simNetKwh - peakKwh;
      const energyCharge = (peakKwh * state.touRates.peak) + (offPeakKwh * state.touRates.offPeak);
      simBill = (energyCharge + state.fixedFee) * (1 + (state.taxPct / 100));
    } else {
      simBill = calculateTariffCost(simNetKwh);
    }

    const netSavings = Math.max(0, baseBill - simBill);
    const symbol = state.currency.symbol;

    document.getElementById('simCurrentBill').textContent = `${symbol}${baseBill.toFixed(2)}`;
    document.getElementById('simOptimizedBill').textContent = `${symbol}${simBill.toFixed(2)}`;
    document.getElementById('simNetSavings').textContent = `${symbol}${netSavings.toFixed(2)}/mo`;
  }

  // Render Chart.js Donut & Bar Charts
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Room Donut Chart
    const roomTotals = {};
    Object.keys(ROOM_CATEGORIES).forEach(r => roomTotals[r] = 0);

    state.appliances.forEach(app => {
      const kwh = calculateApplianceMonthlyKwh(app);
      if (roomTotals[app.room] !== undefined) {
        roomTotals[app.room] += kwh;
      } else {
        roomTotals[app.room] = kwh;
      }
    });

    const roomLabels = Object.keys(roomTotals).map(r => ROOM_CATEGORIES[r] ? ROOM_CATEGORIES[r].name : r);
    const roomData = Object.values(roomTotals);
    const roomColors = Object.keys(roomTotals).map(r => ROOM_CATEGORIES[r] ? ROOM_CATEGORIES[r].color : '#9ca3af');

    const ctxRoom = document.getElementById('roomDonutChart');
    if (ctxRoom) {
      if (roomChart) roomChart.destroy();
      roomChart = new Chart(ctxRoom, {
        type: 'doughnut',
        data: {
          labels: roomLabels,
          datasets: [{
            data: roomData,
            backgroundColor: roomColors,
            borderColor: '#151c2e',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af', font: { family: 'Inter', size: 11 } } }
          }
        }
      });
    }

    // 2. Top Appliances Bar Chart
    const sortedApps = [...state.appliances].sort((a, b) => calculateApplianceMonthlyKwh(b) - calculateApplianceMonthlyKwh(a)).slice(0, 5);
    const barLabels = sortedApps.map(a => a.name);
    const barData = sortedApps.map(a => calculateApplianceMonthlyKwh(a).toFixed(1));

    const ctxTop = document.getElementById('topAppliancesBarChart');
    if (ctxTop) {
      if (topApplianceChart) topApplianceChart.destroy();
      topApplianceChart = new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [{
            label: 'Monthly kWh',
            data: barData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }, grid: { display: false } },
            y: { ticks: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  // Export Data to CSV
  function exportToCsv() {
    let csv = 'Appliance,Room Category,Watts,Hours Per Day,Days Per Week,Monthly kWh,Estimated Monthly Cost\n';
    const totalKwh = state.appliances.reduce((acc, a) => acc + calculateApplianceMonthlyKwh(a), 0);
    const totalCost = calculateTariffCost(totalKwh);

    state.appliances.forEach(app => {
      const kwh = calculateApplianceMonthlyKwh(app);
      const cost = totalKwh > 0 ? (kwh / totalKwh) * totalCost : 0;
      const roomName = ROOM_CATEGORIES[app.room] ? ROOM_CATEGORIES[app.room].name : app.room;
      csv += `"${app.name}","${roomName}",${app.watts},${app.hoursPerDay},${app.daysPerWeek},${kwh.toFixed(2)},${cost.toFixed(2)}\n`;
    });

    csv += `\nTotal Monthly Consumption (kWh),,,,,,${totalKwh.toFixed(2)}\n`;
    csv += `Total Monthly Estimated Bill (${state.currency.code}),,,,,,${totalCost.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Household_Energy_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Report exported as CSV.');
  }

  // LocalStorage Helper
  function saveStateToLocalStorage() {
    try {
      localStorage.setItem('energy_calc_state', JSON.stringify({
        appliances: state.appliances,
        currencyCode: state.currency.code,
        tariffMode: state.tariffMode,
        flatRate: state.flatRate,
        tierRates: state.tierRates,
        touRates: state.touRates,
        fixedFee: state.fixedFee,
        taxPct: state.taxPct
      }));
    } catch (e) {
      // LocalStorage unavailable
    }
  }

  function loadStateFromLocalStorage() {
    try {
      const data = localStorage.getItem('energy_calc_state');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.appliances && Array.isArray(parsed.appliances)) state.appliances = parsed.appliances;
        if (parsed.currencyCode && CURRENCIES[parsed.currencyCode]) {
          state.currency = CURRENCIES[parsed.currencyCode];
          currencySelect.value = parsed.currencyCode;
        }
        if (parsed.tariffMode) state.tariffMode = parsed.tariffMode;
        if (parsed.flatRate) state.flatRate = parsed.flatRate;
        if (parsed.tierRates) state.tierRates = parsed.tierRates;
        if (parsed.touRates) state.touRates = parsed.touRates;
        if (parsed.fixedFee !== undefined) state.fixedFee = parsed.fixedFee;
        if (parsed.taxPct !== undefined) state.taxPct = parsed.taxPct;
      }
    } catch (e) {
      // Error loading local storage
    }
  }

  // Toast System
  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Initial Calculation Run
  updateCurrencySymbols();
  recalculateAndRender();
});
