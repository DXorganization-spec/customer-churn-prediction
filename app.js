/* ============================================
   CHURN AI SAAS — APPLICATION LOGIC
   ============================================ */

// ---- State ----
let currentProbability = null;
let currentPredictionData = null;

// ---- DOM Helpers ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- Validation Rules ----
const validationRules = {
  creditScore: { min: 300, max: 900, name: 'Credit Score' },
  age: { min: 18, max: 100, name: 'Age' },
  tenure: { min: 0, max: 10, name: 'Tenure' },
  balance: { min: 0, max: 10000000, name: 'Balance' },
  salary: { min: 0, max: 10000000, name: 'Salary' },
};

// ---- Validate Input ----
function validateInput(fieldId, value) {
  const rule = validationRules[fieldId];
  if (!rule) return true;
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    showFieldError(fieldId, `${rule.name} must be a number`);
    return false;
  }
  if (num < rule.min || num > rule.max) {
    showFieldError(fieldId, `${rule.name} must be between ${rule.min} and ${rule.max}`);
    return false;
  }
  clearFieldError(fieldId);
  return true;
}

function showFieldError(fieldId, message) {
  const field = $(`#${fieldId}`);
  if (!field) return;
  field.classList.add('error');
  let errorDiv = field.parentElement.querySelector('.field-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    field.parentElement.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

function clearFieldError(fieldId) {
  const field = $(`#${fieldId}`);
  if (!field) return;
  field.classList.remove('error');
  const errorDiv = field.parentElement.querySelector('.field-error');
  if (errorDiv) errorDiv.classList.remove('show');
}

// ---- Slider live values with validation ----
document.addEventListener('DOMContentLoaded', () => {
  const sliders = [
    { id: 'creditScore', display: 'creditScoreVal' },
    { id: 'age', display: 'ageVal' },
    { id: 'tenure', display: 'tenureVal' },
  ];

  sliders.forEach(({ id, display }) => {
    const slider = $(`#${id}`);
    const val = $(`#${display}`);
    if (slider && val) {
      slider.addEventListener('input', () => {
        val.textContent = slider.value;
        validateInput(id, slider.value);
      });
    }
  });

  // Add validation to number inputs
  ['balance', 'salary'].forEach(id => {
    const field = $(`#${id}`);
    if (field) {
      field.addEventListener('blur', () => validateInput(id, field.value));
      field.addEventListener('change', () => validateInput(id, field.value));
    }
  });

  // Save initial state
  saveControlState();
});

// ---- Save/Load UI State ----
function saveControlState() {
  const state = {
    creditScore: $('#creditScore').value,
    age: $('#age').value,
    tenure: $('#tenure').value,
    balance: $('#balance').value,
    salary: $('#salary').value,
    gender: $('#gender').value,
    geography: $('#geography').value,
    numProducts: $('#numProducts').value,
    hasCard: $('#hasCard').value,
    isActive: $('#isActive').value,
  };
  localStorage.setItem('churnUIState', JSON.stringify(state));
}

function loadControlState() {
  const saved = localStorage.getItem('churnUIState');
  if (!saved) return;
  
  const state = JSON.parse(saved);
  Object.entries(state).forEach(([key, value]) => {
    const displayMap = {
      creditScore: 'creditScoreVal',
      age: 'ageVal',
      tenure: 'tenureVal',
    };
    
    const field = $(`#${key}`);
    if (field) field.value = value;
    
    if (displayMap[key]) {
      const display = $(`.#${displayMap[key]}`);
      if (display) display.textContent = value;
    }
  });
}

// Add load on startup
window.addEventListener('load', loadControlState);

// ---- Tab Switching ----
function switchTab(tabName) {
  $$('.tab-btn').forEach((btn) => btn.classList.remove('active'));
  $$('.tab-content').forEach((c) => c.classList.remove('active'));

  const btn = $(`.tab-btn[data-tab="${tabName}"]`);
  const content = $(`#tab-${tabName}`);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

// ---- Risk Level Helper ----
function getRiskLevel(prob) {
  if (prob < 30) return { level: 'Low', color: '#10B981', bgClass: 'emerald', emoji: '🟢', borderColor: 'rgba(16,185,129,0.3)' };
  if (prob < 60) return { level: 'Medium', color: '#F59E0B', bgClass: 'amber', emoji: '🟡', borderColor: 'rgba(245,158,11,0.3)' };
  return { level: 'High', color: '#EF4444', bgClass: 'red', emoji: '🔴', borderColor: 'rgba(239,68,68,0.3)' };
}

// ---- Validate All Inputs ----
function validateAllInputs() {
  const errors = [];
  
  if (!validateInput('creditScore', $('#creditScore').value)) errors.push('creditScore');
  if (!validateInput('age', $('#age').value)) errors.push('age');
  if (!validateInput('tenure', $('#tenure').value)) errors.push('tenure');
  if (!validateInput('balance', $('#balance').value)) errors.push('balance');
  if (!validateInput('salary', $('#salary').value)) errors.push('salary');
  
  return errors.length === 0;
}

// ---- API Call ----
async function handleAnalyze() {
  const btn = $('#analyzeBtn');
  const btnText = $('#analyzeBtnText');
  const errorBanner = $('#errorBanner');
  const errorText = $('#errorText');

  // Validate inputs
  if (!validateAllInputs()) {
    errorBanner.classList.remove('hidden');
    errorText.textContent = 'Please fix the errors in the form before analyzing.';
    return;
  }

  btn.disabled = true;
  btnText.innerHTML = '<div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;"></div> Analyzing...';
  errorBanner.classList.add('hidden');

  const data = {
    CreditScore: parseInt($('#creditScore').value),
    Age: parseInt($('#age').value),
    Tenure: parseInt($('#tenure').value),
    Balance: parseFloat($('#balance').value) || 0,
    NumOfProducts: parseInt($('#numProducts').value),
    HasCrCard: parseInt($('#hasCard').value),
    IsActiveMember: parseInt($('#isActive').value),
    EstimatedSalary: parseFloat($('#salary').value) || 0,
    Geography_Germany: $('#geography').value === 'Germany' ? 1 : 0,
    Geography_Spain: $('#geography').value === 'Spain' ? 1 : 0,
    Gender_Male: $('#gender').value === 'Male' ? 1 : 0,
  };

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || `API error: ${res.status}`);
    }

    const result = await res.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    const prob = (result.churn_probability || 0) * 100;
    currentProbability = prob;
    currentPredictionData = { ...data, probability: prob, prediction: result.prediction };

    renderPredictionResults(prob, result.prediction);
    renderInsights(prob, data);
    renderStrategies(prob);

    // Show risk badge
    const riskBadge = $('#riskBadge');
    riskBadge.classList.remove('hidden');
    $('#riskBadgeText').textContent = `${prob.toFixed(1)}% risk`;
    
    // Save state
    saveControlState();
    
  } catch (err) {
    console.error('Error:', err);
    errorBanner.classList.remove('hidden');
    errorText.textContent = `Error: ${err.message || 'Failed to analyze. Please try again.'}`;
  } finally {
    btn.disabled = false;
    btnText.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> Analyze Now`;
  }
}

// ---- Export Functions ----
function exportPredictionAsJSON() {
  if (!currentPredictionData) {
    alert('No prediction data to export. Please run an analysis first.');
    return;
  }
  
  const dataStr = JSON.stringify(currentPredictionData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadFile(dataBlob, `churn-prediction-${new Date().toISOString().split('T')[0]}.json`);
}

function exportPredictionAsCSV() {
  if (!currentPredictionData) {
    alert('No prediction data to export. Please run an analysis first.');
    return;
  }
  
  const data = currentPredictionData;
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).join(',');
  const csv = `${headers}\n${values}`;
  
  const csvBlob = new Blob([csv], { type: 'text/csv' });
  downloadFile(csvBlob, `churn-prediction-${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function resetForm() {
  if (!confirm('Are you sure you want to reset all values to defaults?')) return;
  
  $('#creditScore').value = 600;
  $('#age').value = 40;
  $('#tenure').value = 5;
  $('#balance').value = 50000;
  $('#salary').value = 50000;
  $('#gender').value = 'Male';
  $('#geography').value = 'France';
  $('#numProducts').value = 2;
  $('#hasCard').value = 1;
  $('#isActive').value = 1;
  
  // Update displays
  $('#creditScoreVal').textContent = 600;
  $('#ageVal').textContent = 40;
  $('#tenureVal').textContent = 5;
  
  // Clear predictions
  $('#predictionResults').classList.add('hidden');
  $('#emptyState').classList.remove('hidden');
  $('#insightsContent').classList.add('hidden');
  $('#insightsEmpty').classList.remove('hidden');
  $('#strategyContent').classList.add('hidden');
  $('#strategyEmpty').classList.remove('hidden');
  $('#riskBadge').classList.add('hidden');
  
  currentProbability = null;
  currentPredictionData = null;
  
  // Clear errors
  $$('.field-error').forEach(e => e.classList.remove('show'));
  
  saveControlState();
}

// ---- Render Prediction Results ----
function renderPredictionResults(prob, prediction) {
  const risk = getRiskLevel(prob);

  // Show results, hide empty state
  $('#predictionResults').classList.remove('hidden');
  $('#emptyState').classList.add('hidden');

  // Prediction card
  const predCard = $('#predictionCard');
  const predIconWrap = $('#predictionIconWrap');
  const predIcon = $('#predictionIcon');
  const predValue = $('#predictionValue');

  if (prediction) {
    predIconWrap.className = 'metric-icon-wrap red-bg';
    predIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    predValue.textContent = 'Churn';
    predValue.style.color = '#F87171';
    predCard.style.borderColor = 'rgba(239,68,68,0.2)';
  } else {
    predIconWrap.className = 'metric-icon-wrap emerald-bg';
    predIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    predValue.textContent = 'No Churn';
    predValue.style.color = '#34D399';
    predCard.style.borderColor = 'rgba(16,185,129,0.2)';
  }

  // Probability
  $('#probabilityValue').textContent = `${prob.toFixed(2)}%`;

  // Risk level
  const riskIconWrap = $('#riskIconWrap');
  riskIconWrap.style.background = `${risk.color}15`;
  $('#riskEmoji').textContent = risk.emoji;
  const riskVal = $('#riskLevelValue');
  riskVal.textContent = risk.level;
  riskVal.style.color = risk.color;
  $('#riskCard').style.borderColor = risk.borderColor;

  // Progress bar
  const progressFill = $('#progressFill');
  const progressPercent = $('#progressPercent');
  progressPercent.textContent = `${prob.toFixed(1)}%`;
  progressPercent.style.color = risk.color;
  setTimeout(() => {
    progressFill.style.width = `${prob}%`;
    progressFill.style.backgroundColor = risk.color;
    progressFill.style.boxShadow = `0 0 10px ${risk.color}60`;
  }, 100);

  // Gauge
  drawGauge(prob);
}

// ---- SVG Gauge Chart ----
function drawGauge(value) {
  const svg = $('#gaugeChart');
  const size = 320;
  const center = size / 2;
  const radius = size / 2 - 24;
  const strokeWidth = 18;
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = endAngle - startAngle;

  const getColor = (v) => {
    if (v < 30) return '#10B981';
    if (v < 60) return '#F59E0B';
    return '#EF4444';
  };

  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const describeArc = (start, end) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const valueAngle = startAngle + (value / 100) * totalAngle;
  const needleEnd = polarToCartesian(valueAngle);
  const color = getColor(value);

  svg.innerHTML = `
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="needleGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- Background arc -->
    <path d="${describeArc(startAngle, endAngle)}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeWidth}" stroke-linecap="round"/>
    <!-- Green zone -->
    <path d="${describeArc(startAngle, startAngle + totalAngle * 0.3)}" fill="none" stroke="#10B981" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.25"/>
    <!-- Yellow zone -->
    <path d="${describeArc(startAngle + totalAngle * 0.3, startAngle + totalAngle * 0.6)}" fill="none" stroke="#F59E0B" stroke-width="${strokeWidth}" opacity="0.25"/>
    <!-- Red zone -->
    <path d="${describeArc(startAngle + totalAngle * 0.6, endAngle)}" fill="none" stroke="#EF4444" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.25"/>
    <!-- Active arc -->
    ${value > 0.5 ? `<path d="${describeArc(startAngle, valueAngle)}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" filter="url(#glow)"/>` : ''}
    <!-- Needle -->
    <line x1="${center}" y1="${center}" x2="${needleEnd.x}" y2="${needleEnd.y}" stroke="${color}" stroke-width="3" stroke-linecap="round" filter="url(#needleGlow)"/>
    <!-- Center dot -->
    <circle cx="${center}" cy="${center}" r="6" fill="${color}"/>
    <circle cx="${center}" cy="${center}" r="3" fill="#0A0E1A"/>
    <!-- Labels -->
    <text x="${size * 0.1}" y="${size * 0.68}" fill="#6B7280" font-size="11" font-family="Inter">0%</text>
    <text x="${size * 0.82}" y="${size * 0.68}" fill="#6B7280" font-size="11" font-family="Inter">100%</text>
  `;

  // Update gauge text
  const gaugeVal = $('#gaugeValue');
  gaugeVal.textContent = `${value.toFixed(1)}%`;
  gaugeVal.style.color = color;
}

// ---- Render Insights ----
function renderInsights(prob, customerData) {
  const risk = getRiskLevel(prob);

  // Show content, hide empty
  $('#insightsContent').classList.remove('hidden');
  $('#insightsEmpty').classList.add('hidden');

  // Interpretation
  const body = $('#interpretationBody');
  const isHigh = prob > 60;
  const isMed = prob > 30;

  body.style.background = `${risk.color}10`;
  body.style.borderColor = risk.borderColor;
  body.innerHTML = `
    <div class="interp-row">
      <span class="interp-emoji">${risk.emoji}</span>
      <div>
        <p class="interp-title" style="color: ${risk.color}">
          ${isHigh ? 'High churn signals detected' : isMed ? 'Moderate churn signals detected' : 'Customer appears stable'}
        </p>
        <p class="interp-desc">
          ${isHigh
            ? 'This customer shows strong indicators of potential churn. Immediate intervention is recommended to prevent loss.'
            : isMed
            ? 'Some risk factors are present. Proactive engagement could help improve retention.'
            : 'Customer engagement metrics are healthy. Continue maintaining positive experience.'}
        </p>
      </div>
    </div>
  `;

  // Feature bars - use actual data if provided
  const creditScore = customerData?.CreditScore || parseInt($('#creditScore').value);
  const age = customerData?.Age || parseInt($('#age').value);
  const balance = customerData?.Balance || parseFloat($('#balance').value) || 0;
  const numProducts = customerData?.NumOfProducts || parseInt($('#numProducts').value);
  const isActive = customerData?.IsActiveMember || parseInt($('#isActive').value);
  const tenure = customerData?.Tenure || parseInt($('#tenure').value);

  const features = [
    { name: 'Credit Score', value: creditScore, max: 900, color: creditScore > 650 ? '#10B981' : creditScore > 450 ? '#F59E0B' : '#EF4444', impact: creditScore > 650 ? 'positive' : creditScore > 450 ? 'neutral' : 'negative' },
    { name: 'Age', value: age, max: 100, color: '#6366F1', impact: age > 40 && age < 55 ? 'negative' : age > 55 ? 'positive' : 'neutral' },
    { name: 'Tenure', value: tenure, max: 10, color: tenure > 5 ? '#10B981' : tenure > 2 ? '#F59E0B' : '#EF4444', impact: tenure > 5 ? 'positive' : tenure > 2 ? 'neutral' : 'negative' },
    { name: 'Balance', value: balance, max: 250000, color: balance > 100000 ? '#F59E0B' : balance > 0 ? '#10B981' : '#6B7280', impact: balance > 100000 ? 'negative' : balance > 0 ? 'positive' : 'neutral' },
    { name: 'Products', value: numProducts, max: 4, color: numProducts > 2 ? '#EF4444' : numProducts > 1 ? '#F59E0B' : '#10B981', impact: numProducts > 2 ? 'negative' : numProducts > 1 ? 'neutral' : 'positive' },
    { name: 'Activity', value: isActive, max: 1, color: isActive ? '#10B981' : '#EF4444', impact: isActive ? 'positive' : 'negative' },
  ];

  const impactSvg = (impact) => {
    if (impact === 'positive') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
    if (impact === 'negative') return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  };

  const barsContainer = $('#featureBars');
  barsContainer.innerHTML = features.map((f, i) => `
    <div class="feature-item" style="animation-delay: ${i * 100}ms">
      <div class="feature-header">
        <div class="feature-name">
          <span>${f.name}</span>
          ${impactSvg(f.impact)}
        </div>
        <span class="feature-val mono" style="color: ${f.color}">
          ${f.name === 'Balance' ? f.value.toLocaleString() : f.name === 'Credit Score' ? f.value.toLocaleString() : f.value}
        </span>
      </div>
      <div class="feature-track">
        <div class="feature-fill" style="width: ${Math.max(2, (f.value / f.max) * 100)}%; background: ${f.color}; box-shadow: 0 0 10px ${f.color}40;"></div>
      </div>
      <div class="feature-range">
        <span>0</span>
        <span>${f.max.toLocaleString()}</span>
      </div>
    </div>
  `).join('');
}

// ---- Render Strategies ----
function renderStrategies(prob) {
  const risk = getRiskLevel(prob);

  // Show content, hide empty
  $('#strategyContent').classList.remove('hidden');
  $('#strategyEmpty').classList.add('hidden');

  const highStrategies = [
    { icon: '🎁', title: 'Offer Incentives', desc: 'Provide exclusive discounts, fee waivers, or bonus rewards to re-engage the customer immediately.', priority: 'Critical' },
    { icon: '🤝', title: 'Personalized Engagement', desc: 'Assign a dedicated relationship manager for 1-on-1 outreach with tailored solutions.', priority: 'Critical' },
    { icon: '🎧', title: 'Priority Support', desc: 'Escalate to VIP support tier with faster response times and dedicated assistance.', priority: 'High' },
    { icon: '🎯', title: 'Win-Back Campaign', desc: 'Launch a targeted email/SMS campaign with personalized offers based on usage history.', priority: 'High' },
  ];

  const medStrategies = [
    { icon: '⭐', title: 'Loyalty Programs', desc: 'Enroll in tiered loyalty program with progressive benefits to increase stickiness.', priority: 'Medium' },
    { icon: '💬', title: 'Proactive Follow-ups', desc: 'Schedule regular check-ins to understand needs and address concerns before they escalate.', priority: 'Medium' },
    { icon: '🔧', title: 'Service Improvement', desc: 'Review and optimize the customer\'s product mix and service experience.', priority: 'Medium' },
    { icon: '⚡', title: 'Feature Education', desc: 'Send targeted tutorials about underused features to increase product engagement.', priority: 'Low' },
  ];

  const lowStrategies = [
    { icon: '📈', title: 'Upsell Opportunities', desc: 'Recommend premium products or additional services that match their profile.', priority: 'Opportunity' },
    { icon: '🏆', title: 'Reward Loyalty', desc: 'Recognize long-term commitment with exclusive perks, early access, or anniversary rewards.', priority: 'Opportunity' },
    { icon: '😊', title: 'Maintain Experience', desc: 'Continue delivering consistent, high-quality service to preserve satisfaction levels.', priority: 'Ongoing' },
    { icon: '💡', title: 'Referral Program', desc: 'Leverage satisfaction by inviting them to refer friends with mutual rewards.', priority: 'Opportunity' },
  ];

  const strategies = prob > 60 ? highStrategies : prob > 30 ? medStrategies : lowStrategies;

  // Status banner
  const banner = $('#statusBanner');
  banner.style.borderColor = risk.borderColor;
  banner.innerHTML = `
    <span class="status-emoji">${risk.emoji}</span>
    <div>
      <p class="status-title" style="color: ${risk.color}">
        ${prob > 60 ? 'Immediate Action Required' : prob > 30 ? 'Monitor & Engage' : 'Stable Customer'}
      </p>
      <p class="status-desc">
        ${prob > 60
          ? 'Deploy retention strategies immediately to prevent customer loss.'
          : prob > 30
          ? 'Proactive engagement recommended to strengthen relationship.'
          : 'Focus on growth opportunities and maintaining satisfaction.'}
      </p>
    </div>
  `;

  // Strategy cards
  const badgeClass = (p) => {
    const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low', Opportunity: 'badge-opportunity', Ongoing: 'badge-ongoing' };
    return map[p] || 'badge-medium';
  };

  const grid = $('#strategyGrid');
  grid.innerHTML = strategies.map((s, i) => `
    <div class="glass-card strategy-card" style="animation: fadeInUp 0.5s ease-out ${i * 100}ms both;">
      <div class="strat-icon" style="background: ${risk.color}15; color: ${risk.color};">
        <span style="font-size: 20px;">${s.icon}</span>
      </div>
      <div>
        <div class="strat-header">
          <span class="strat-title">${s.title}</span>
          <span class="strat-badge ${badgeClass(s.priority)}">${s.priority}</span>
        </div>
        <p class="strat-desc">${s.desc}</p>
      </div>
    </div>
  `).join('');
}
