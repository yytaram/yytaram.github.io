/* ═══════════════════════════════════════════
   FinGuide — Financial Literacy for Young Adults
   script.js — All interactivity
   ═══════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n) => '$' + Math.round(n).toLocaleString();

/* ─────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────── */
const scrollBar = $('#scrollProgress');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
  scrollBar.style.width = pct + '%';
}, { passive: true });

/* ─────────────────────────────────────────
   NAVIGATION — scroll behavior
───────────────────────────────────────── */
const nav = $('#mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// Smooth close mobile nav on link click
$$('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* ─────────────────────────────────────────
   HAMBURGER MENU
───────────────────────────────────────── */
const hamburger = $('#hamburger');
const mobileNav = $('#mobileNav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open');
});

/* ─────────────────────────────────────────
   INTERSECTION OBSERVER — Reveal animations
───────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.reveal-up').forEach(el => revealObserver.observe(el));

/* ─────────────────────────────────────────
   COUNTER ANIMATION — Stats bar
───────────────────────────────────────── */
let countersStarted = false;

const counterObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !countersStarted) {
    countersStarted = true;
    $$('.stat-num').forEach(el => animateCounter(el));
    counterObserver.disconnect();
  }
}, { threshold: 0.5 });

const statsBar = $('.stats-bar');
if (statsBar) counterObserver.observe(statsBar);

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─────────────────────────────────────────
   CHALLENGE CARDS — Expand / Collapse
───────────────────────────────────────── */
$$('.c-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.c-card');
    const isOpen = card.classList.contains('open');

    // Close all others
    $$('.c-card.open').forEach(openCard => {
      if (openCard !== card) {
        openCard.classList.remove('open');
        openCard.querySelector('.c-toggle').setAttribute('aria-expanded', 'false');
      }
    });

    card.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', !isOpen);
  });
});

/* ─────────────────────────────────────────
   BUDGET CALCULATOR
───────────────────────────────────────── */
const needsSlider   = $('#needsSlider');
const wantsSlider   = $('#wantsSlider');
const needsDisplay  = $('#needsValDisplay');
const wantsDisplay  = $('#wantsValDisplay');
const savingsDisplay = $('#savingsValDisplay');
const savingsFill   = $('#savingsReadonlyFill');
const splitWarning  = $('#splitWarning');

function updateSliderTrack(slider, color) {
  const min = +slider.min;
  const max = +slider.max;
  const val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--border) ${pct}%)`;
}

function syncBudgetSliders() {
  const needs   = parseInt(needsSlider.value, 10);
  const wants   = parseInt(wantsSlider.value, 10);
  const savings = 100 - needs - wants;

  needsDisplay.textContent  = needs  + '%';
  wantsDisplay.textContent  = wants  + '%';

  updateSliderTrack(needsSlider, 'var(--needs-clr)');
  updateSliderTrack(wantsSlider, 'var(--wants-clr)');

  if (savings < 0) {
    savingsDisplay.textContent = '0%';
    savingsFill.style.width = '0%';
    splitWarning.style.display = 'block';
  } else {
    savingsDisplay.textContent = savings + '%';
    savingsFill.style.width = savings + '%';
    splitWarning.style.display = 'none';
  }
}

needsSlider.addEventListener('input', () => {
  const needs = parseInt(needsSlider.value, 10);
  const wants = parseInt(wantsSlider.value, 10);
  if (needs + wants > 95) {
    wantsSlider.value = Math.max(5, 95 - needs);
  }
  syncBudgetSliders();
});

wantsSlider.addEventListener('input', () => {
  const needs = parseInt(needsSlider.value, 10);
  const wants = parseInt(wantsSlider.value, 10);
  if (needs + wants > 95) {
    needsSlider.value = Math.max(20, 95 - wants);
  }
  syncBudgetSliders();
});

syncBudgetSliders();

$('#calcBudgetBtn').addEventListener('click', () => {
  const income = parseFloat($('#income').value);
  if (!income || income <= 0) {
    $('#income').focus();
    $('#income').style.borderColor = 'var(--red)';
    setTimeout(() => ($('#income').style.borderColor = ''), 2000);
    return;
  }

  const needs   = parseInt(needsSlider.value, 10);
  const wants   = parseInt(wantsSlider.value, 10);
  const savings = Math.max(0, 100 - needs - wants);

  const needsAmt   = income * needs   / 100;
  const wantsAmt   = income * wants   / 100;
  const savingsAmt = income * savings / 100;

  $('#needsLabelLegend').textContent   = `Needs (${needs}%)`;
  $('#wantsLabelLegend').textContent   = `Wants (${wants}%)`;
  $('#savingsLabelLegend').textContent = `Savings (${savings}%)`;

  $('#needsAmount').textContent   = fmt(needsAmt)   + ' / month';
  $('#wantsAmount').textContent   = fmt(wantsAmt)   + ' / month';
  $('#savingsAmount').textContent = fmt(savingsAmt) + ' / month';
  $('#yearlyTotal').textContent   = fmt(savingsAmt * 12);

  $('#chartCenterLabel').textContent = `${needs}/${wants}/${savings}`;

  animatePieChart(needs, wants, savings);
});

/* Pie / Donut Chart */
function animatePieChart(needsPct, wantsPct, savingsPct) {
  const canvas = $('#budgetChart');
  const ctx = canvas.getContext('2d');
  const total = needsPct + wantsPct + savingsPct;

  let progress = 0;
  const duration = 900;
  let startTime = null;

  function frame(ts) {
    if (!startTime) startTime = ts;
    progress = Math.min((ts - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    drawDonut(ctx, canvas,
      needsPct   * eased / 100,
      wantsPct   * eased / 100,
      savingsPct * eased / 100,
      total
    );

    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function drawDonut(ctx, canvas, needsFrac, wantsFrac, savingsFrac, total) {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = 120;
  const r = 72;

  ctx.clearRect(0, 0, W, H);

  if (total <= 0) {
    // Draw empty grey ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.arc(cx, cy, r, Math.PI * 2, 0, true);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    return;
  }

  const slices = [
    { frac: needsFrac,   color: '#f0b429' },
    { frac: wantsFrac,   color: '#3ecf8e' },
    { frac: savingsFrac, color: '#6f8dff' },
  ];

  let angle = -Math.PI / 2;
  const gap = 0.03; // small gap between slices

  slices.forEach(({ frac, color }) => {
    if (frac <= 0) return;
    const sweep = frac * Math.PI * 2;
    const startA = angle + gap / 2;
    const endA   = angle + sweep - gap / 2;

    ctx.beginPath();
    ctx.moveTo(
      cx + r * Math.cos(startA),
      cy + r * Math.sin(startA)
    );
    ctx.arc(cx, cy, R, startA, endA);
    ctx.arc(cx, cy, r, endA, startA, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    angle += sweep;
  });
}

// Draw initial empty donut on load
(function initChart() {
  const canvas = $('#budgetChart');
  const ctx = canvas.getContext('2d');
  drawDonut(ctx, canvas, 0, 0, 0, 0);
})();

/* ─────────────────────────────────────────
   SAVINGS GOAL CALCULATOR
───────────────────────────────────────── */
$('#calcSavingsBtn').addEventListener('click', () => {
  const goalName    = $('#goalName').value.trim() || 'Your Goal';
  const goalAmount  = parseFloat($('#goalAmount').value);
  const currentSav  = parseFloat($('#currentSavings').value) || 0;
  const monthly     = parseFloat($('#monthlyContrib').value);
  const annualRate  = parseFloat($('#interestRate').value) || 0;

  // Validation
  if (!goalAmount || goalAmount <= 0 || !monthly || monthly <= 0) {
    ['#goalAmount', '#monthlyContrib'].forEach(id => {
      const el = $(id);
      if (!el.value || parseFloat(el.value) <= 0) {
        el.style.borderColor = 'var(--red)';
        el.focus();
        setTimeout(() => (el.style.borderColor = ''), 2000);
      }
    });
    return;
  }

  if (currentSav >= goalAmount) {
    showSavingsResult(goalName, 0, currentSav, goalAmount, 0, 0, annualRate);
    return;
  }

  const monthlyRate = annualRate / 100 / 12;
  let balance = currentSav;
  let months = 0;
  let totalContribs = 0;
  const MAX_MONTHS = 600; // 50 years cap

  while (balance < goalAmount && months < MAX_MONTHS) {
    balance = balance * (1 + monthlyRate) + monthly;
    totalContribs += monthly;
    months++;
  }

  const interestEarned = balance - currentSav - totalContribs;

  showSavingsResult(goalName, months, currentSav, goalAmount, totalContribs, interestEarned, annualRate);
});

function showSavingsResult(name, months, current, goal, totalContribs, interest, rate) {
  const resultEl      = $('#savingsResult');
  const placeholder   = $('#savingsPlaceholder');

  $('#srGoalName').textContent = name;

  if (months === 0) {
    $('#srMonths').textContent    = '🎉';
    $('#srTargetDate').textContent = "You've already reached your goal!";
    $('#srMonths').style.fontSize  = '3rem';
  } else {
    $('#srMonths').textContent = months;
    $('#srMonths').style.fontSize  = '';

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);
    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    $('#srTargetDate').textContent = `Goal reached: ${dateStr}`;
  }

  // Progress bar
  const pct = Math.min((current / goal) * 100, 100);
  setTimeout(() => {
    $('#srProgressFill').style.width = pct + '%';
  }, 100);

  $('#srCurrentLabel').textContent = fmt(current) + ' saved';
  $('#srGoalLabel').textContent    = fmt(goal) + ' goal';

  // Breakdown
  const finalTotal = current + totalContribs + interest;
  $('#bdStart').textContent    = fmt(current);
  $('#bdContribs').textContent = fmt(totalContribs);
  $('#bdInterest').textContent = fmt(interest);
  $('#bdTotal').textContent    = fmt(finalTotal);

  placeholder.style.display   = 'none';
  resultEl.classList.add('visible');
}

/* ─────────────────────────────────────────
   QUIZ
───────────────────────────────────────── */
const QUESTIONS = [
  {
    q: 'What does the "50" in the 50/30/20 budget rule stand for?',
    opts: ['50% for savings', '50% for needs (essentials)', '50% for investments', '50% for wants'],
    ans: 1,
    exp: 'The 50/30/20 rule allocates 50% of after-tax income to needs like rent, food, and utilities.'
  },
  {
    q: 'What is a credit score used for?',
    opts: ['Measuring how much money you have', 'Measuring your creditworthiness', 'Calculating your annual income', 'Tracking your spending habits'],
    ans: 1,
    exp: 'A credit score (300–850) represents how reliably you repay borrowed money. It affects loans, rentals, and sometimes employment.'
  },
  {
    q: 'What is compound interest?',
    opts: ['Interest paid only on the original amount', 'A type of bank fee', 'Interest earned on both principal and previously earned interest', 'A government savings program'],
    ans: 2,
    exp: 'Compound interest means you earn interest on interest — making your money grow exponentially over time. This is why starting early matters so much.'
  },
  {
    q: 'What is the recommended size of an emergency fund?',
    opts: ['1 month of expenses', '3–6 months of living expenses', 'Exactly $10,000', '12 months of expenses'],
    ans: 1,
    exp: 'Financial experts recommend keeping 3–6 months of essential living expenses in a liquid (easily accessible) account for emergencies.'
  },
  {
    q: 'What does APR stand for?',
    opts: ['Annual Profit Rate', 'Average Payment Ratio', 'Annual Percentage Rate', 'Adjusted Price Return'],
    ans: 2,
    exp: 'APR (Annual Percentage Rate) is the yearly interest rate charged on borrowed money. A high APR means borrowing is more expensive.'
  },
  {
    q: 'Which investment typically delivers higher returns over the long term?',
    opts: ['Standard savings accounts', 'Government bonds', 'Diversified stock index funds', 'Checking accounts'],
    ans: 2,
    exp: 'Historically, diversified stock index funds have returned ~7–10% annually over the long term — far outperforming savings accounts or bonds.'
  },
  {
    q: 'What percentage of your credit score is made up by payment history?',
    opts: ['15%', '25%', '35%', '45%'],
    ans: 2,
    exp: 'Payment history (35%) is the single most important factor in your credit score. Paying on time is the most impactful thing you can do.'
  },
  {
    q: 'What is the difference between gross and net income?',
    opts: [
      'Gross is after taxes; net is before taxes',
      'Gross is before any deductions; net is what you actually take home',
      'They are exactly the same',
      'Gross is monthly; net is yearly'
    ],
    ans: 1,
    exp: 'Gross income is your earnings before tax and other deductions. Net income (take-home pay) is what you actually receive after deductions.'
  },
  {
    q: 'What is diversification in investing?',
    opts: [
      'Putting all your money in a single high-performing stock',
      'Changing your investments every month',
      'Spreading money across different asset types to reduce risk',
      'Only investing in government bonds'
    ],
    ans: 2,
    exp: 'Diversification spreads your investment across different assets (stocks, bonds, sectors) so that a loss in one area doesn\'t wipe out your entire portfolio.'
  },
  {
    q: 'What does the "Rule of 72" tell you?',
    opts: [
      'Retire with 72x your annual income',
      'Save 72% of every paycheck',
      'Divide 72 by your interest rate to estimate how long it takes money to double',
      'Spend no more than 72 dollars a day'
    ],
    ans: 2,
    exp: 'The Rule of 72 is a quick estimate: divide 72 by your annual interest rate to find roughly how many years it takes an investment to double. At 7%, money doubles in ~10 years.'
  }
];

let currentQ    = 0;
let score       = 0;
let answered    = false;

function loadQuestion(index) {
  const q = QUESTIONS[index];
  answered = false;

  $('#quizCounter').textContent    = `Question ${index + 1} of ${QUESTIONS.length}`;
  $('#quizProgFill').style.width   = ((index + 1) / QUESTIONS.length * 100) + '%';
  $('#quizQuestion').textContent   = q.q;
  $('#quizFeedback').textContent   = '';
  $('#quizFeedback').className     = 'quiz-feedback';
  $('#quizNextBtn').style.display  = 'none';

  const optionsEl = $('#quizOptions');
  optionsEl.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.innerHTML = `<span class="opt-letter">${letters[i]}</span>${opt}`;
    btn.addEventListener('click', () => handleAnswer(i, q));
    optionsEl.appendChild(btn);
  });
}

function handleAnswer(chosen, q) {
  if (answered) return;
  answered = true;

  const opts = $$('.quiz-opt');
  opts.forEach(btn => btn.disabled = true);

  const isCorrect = chosen === q.ans;
  if (isCorrect) score++;

  opts[chosen].classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) opts[q.ans].classList.add('correct');

  const fb = $('#quizFeedback');
  fb.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'wrong');
  fb.textContent = (isCorrect ? '✓ Correct! ' : '✗ Not quite. ') + q.exp;

  $('#quizNextBtn').style.display = 'flex';

  if (currentQ === QUESTIONS.length - 1) {
    $('#quizNextBtn').textContent = 'See Results →';
  } else {
    $('#quizNextBtn').innerHTML = 'Next Question <span>→</span>';
  }
}

$('#quizNextBtn').addEventListener('click', () => {
  currentQ++;
  if (currentQ < QUESTIONS.length) {
    loadQuestion(currentQ);
  } else {
    showQuizResult();
  }
});

function showQuizResult() {
  $('#quizActive').style.display  = 'none';
  const resultEl = $('#quizResult');
  resultEl.style.display = 'block';

  $('#resultScoreNum').textContent = score;
  drawResultRing(score, QUESTIONS.length);

  let grade, msg;
  if (score === 10) {
    grade = 'Financial Expert! 🏆';
    msg   = "Perfect score! You have an exceptional grasp of personal finance. Keep it up and teach others what you know.";
  } else if (score >= 8) {
    grade = 'Well Done! 🌟';
    msg   = `You scored ${score}/10 — you clearly understand the fundamentals of money management. Review the challenges you missed to become even sharper.`;
  } else if (score >= 6) {
    grade = 'Getting There! 📈';
    msg   = `${score}/10 — A solid foundation, but a few gaps to fill. Check out the challenges above to strengthen your knowledge.`;
  } else if (score >= 4) {
    grade = 'Keep Learning! 📚';
    msg   = `${score}/10 — You've made a start! Financial literacy is a skill that builds over time. Explore the 7 challenges to level up fast.`;
  } else {
    grade = 'Just Starting Out 🌱';
    msg   = `${score}/10 — Don't worry — everyone starts somewhere. Work through the 7 challenges above and retake the quiz. You'll be surprised how quickly you improve.`;
  }

  $('#resultGrade').textContent = grade;
  $('#resultMsg').textContent   = msg;
  animateResultRing(score, QUESTIONS.length);
}

function drawResultRing(score, total, progress = 0) {
  const canvas = $('#resultRing');
  const ctx    = canvas.getContext('2d');
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  const R  = 68;
  const r  = 50;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.arc(cx, cy, r, Math.PI * 2, 0, true);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();

  // Score arc
  const endAngle = -Math.PI / 2 + (score / total) * Math.PI * 2 * progress;
  if (score > 0 && progress > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, endAngle);
    ctx.arc(cx, cy, r, endAngle, -Math.PI / 2, true);
    ctx.fillStyle = score >= 7 ? '#3ecf8e' : score >= 5 ? '#f0b429' : '#ff5c5c';
    ctx.shadowColor = score >= 7 ? '#3ecf8e' : score >= 5 ? '#f0b429' : '#ff5c5c';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function animateResultRing(score, total) {
  let p = 0;
  const duration = 1200;
  const start = performance.now();

  function frame(ts) {
    p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    drawResultRing(score, total, eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

$('#retakeQuizBtn').addEventListener('click', () => {
  currentQ = 0;
  score    = 0;
  answered = false;
  $('#quizResult').style.display = 'none';
  $('#quizActive').style.display = 'block';
  loadQuestion(0);
});

// Init quiz
loadQuestion(0);

/* ─────────────────────────────────────────
   SMOOTH SCROLL — nav links
───────────────────────────────────────── */
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH  = nav.offsetHeight;
    const top   = target.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ─────────────────────────────────────────
   RANGE SLIDER — live visual track update
───────────────────────────────────────── */
// Initial track render
updateSliderTrack(needsSlider, 'var(--needs-clr)');
updateSliderTrack(wantsSlider, 'var(--wants-clr)');

function updateSliderTrack(slider, color) {
  const min = +slider.min;
  const max = +slider.max;
  const val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background =
    `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--border) ${pct}%)`;
}

/* ─────────────────────────────────────────
   HERO — Staggered text reveal on load
───────────────────────────────────────── */
window.addEventListener('load', () => {
  // Trigger hero elements that are above the fold
  setTimeout(() => {
    $$('.hero-eyebrow, .hero-heading span, .hero-desc, .hero-actions').forEach(el => {
      el.classList.add('visible');
    });
  }, 200);
});
