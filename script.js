const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const cursorGlow = document.querySelector(".cursor-glow");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.addEventListener("pointermove", (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const patternData = {
  spender: {
    title: "Impulse Spender",
    tip: "Pause before any non-essential purchase for 24 hours. Add items to a list first, not straight to checkout. Emotional urgency becomes weaker with time."
  },
  avoider: {
    title: "Money Avoider",
    tip: "Set one fixed weekly money check for 10 minutes. Avoidance usually makes stress grow, while short check-ins create control."
  },
  rescuer: {
    title: "Over-Helper",
    tip: "Support others without harming your own stability. Create a personal limit for lending and never lend from money needed for essentials."
  },
  risker: {
    title: "Risk Chaser",
    tip: "Fast-money thinking often hides long-term loss. Use a rule: if it pressures you to act quickly, stop and verify before any payment."
  },
  planner: {
    title: "Planner in Progress",
    tip: "You already value structure. Strengthen consistency by automating one habit: weekly saving, expense tracking, or a no-spend day."
  }
};

const patternChoices = document.querySelectorAll(".pattern-card");
const patternResult = document.getElementById("patternResult");

patternChoices.forEach((button) => {
  button.addEventListener("click", () => {
    patternChoices.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const key = button.dataset.pattern;
    const result = patternData[key];

    patternResult.innerHTML = `
      <h3>${result.title}</h3>
      <p>${result.tip}</p>
    `;
  });
});

const beliefBtn = document.getElementById("beliefBtn");
const beliefOutput = document.getElementById("beliefOutput");

if (beliefBtn && beliefOutput) {
  beliefBtn.addEventListener("click", () => {
    beliefOutput.innerHTML = `
      <p><strong>Reflection prompts:</strong></p>
      <ul class="bullet-list">
        <li>Is this idea a fact, or only a repeated belief?</li>
        <li>Where did I first learn this message about money?</li>
        <li>Does this belief protect me, limit me, or push me into extremes?</li>
        <li>What would a calmer, more balanced version of this belief sound like?</li>
      </ul>
    `;
  });
}

const budgetForm = document.getElementById("budgetForm");
const fillExampleBtn = document.getElementById("fillExample");

const currency = (value) => `₸${Math.round(value).toLocaleString()}`;

const setBar = (id, labelId, percent) => {
  const safePercent = Math.max(0, Math.min(percent, 100));
  const bar = document.getElementById(id);
  const label = document.getElementById(labelId);
  if (bar) bar.style.width = `${safePercent}%`;
  if (label) label.textContent = `${safePercent.toFixed(0)}%`;
};

const calculateBudget = (event) => {
  if (event) event.preventDefault();

  const income = Number(document.getElementById("income").value) || 0;
  const needs = Number(document.getElementById("needs").value) || 0;
  const essentials = Number(document.getElementById("essentials").value) || 0;
  const wants = Number(document.getElementById("wants").value) || 0;
  const savings = Number(document.getElementById("savings").value) || 0;
  const debt = Number(document.getElementById("debt").value) || 0;

  const total = needs + essentials + wants + savings + debt;
  const remaining = income - total;

  const remainingValue = document.getElementById("remainingValue");
  const budgetMessage = document.getElementById("budgetMessage");

  if (remainingValue) remainingValue.textContent = currency(remaining);

  if (income <= 0) {
    budgetMessage.textContent = "Add an income value to see meaningful results.";
    setBar("barNeeds", "labelNeeds", 0);
    setBar("barEssentials", "labelEssentials", 0);
    setBar("barWants", "labelWants", 0);
    setBar("barSavings", "labelSavings", 0);
    setBar("barDebt", "labelDebt", 0);
    return;
  }

  setBar("barNeeds", "labelNeeds", (needs / income) * 100);
  setBar("barEssentials", "labelEssentials", (essentials / income) * 100);
  setBar("barWants", "labelWants", (wants / income) * 100);
  setBar("barSavings", "labelSavings", (savings / income) * 100);
  setBar("barDebt", "labelDebt", (debt / income) * 100);

  if (remaining > 0 && savings > 0) {
    budgetMessage.textContent = "Good start. You still have money left and your plan includes savings.";
  } else if (remaining === 0) {
    budgetMessage.textContent = "Your budget is balanced, but it leaves no buffer for surprise costs.";
  } else if (remaining < 0) {
    budgetMessage.textContent = "You are spending more than you earn. Reduce wants, review fixed costs, or increase income sources.";
  } else {
    budgetMessage.textContent = "You are within budget, but adding savings would make the plan safer.";
  }
};

if (budgetForm) {
  budgetForm.addEventListener("submit", calculateBudget);
}

if (fillExampleBtn) {
  fillExampleBtn.addEventListener("click", () => {
    document.getElementById("income").value = 120000;
    document.getElementById("needs").value = 35000;
    document.getElementById("essentials").value = 28000;
    document.getElementById("wants").value = 22000;
    document.getElementById("savings").value = 20000;
    document.getElementById("debt").value = 5000;
    calculateBudget();
  });
}

const slcTabButtons = document.querySelectorAll(".tab-btn");
const slcPanels = document.querySelectorAll(".tab-panel");

slcTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    slcTabButtons.forEach((item) => item.classList.remove("active"));
    slcPanels.forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    const activePanel = document.getElementById(target);
    if (activePanel) activePanel.classList.add("active");
  });
});

const quizData = [
  {
    question: "A budget means you can never enjoy spending money.",
    options: ["Myth", "Fact"],
    answer: "Myth",
    explanation: "A budget is a plan, not a punishment. It helps you decide where enjoyment fits without harming essentials."
  },
  {
    question: "If an offer says “act now or lose everything,” that pressure is a warning sign.",
    options: ["Myth", "Fact"],
    answer: "Fact",
    explanation: "Urgency is one of the most common tools used in scams and manipulation."
  },
  {
    question: "Saving only matters when you already earn a lot.",
    options: ["Myth", "Fact"],
    answer: "Myth",
    explanation: "Small, regular saving builds habit and protection, even before income becomes high."
  },
  {
    question: "Borrowing from friends can still create serious pressure and conflict.",
    options: ["Myth", "Fact"],
    answer: "Fact",
    explanation: "Informal debt can affect trust, relationships, and mental comfort just as much as formal debt."
  },
  {
    question: "Emotional stress can influence spending decisions.",
    options: ["Myth", "Fact"],
    answer: "Fact",
    explanation: "Stress, guilt, boredom, and reward-seeking often shape money choices before logic catches up."
  }
];

let quizIndex = 0;
let quizScore = 0;
let answeredCurrent = false;

const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");
const quizCount = document.getElementById("quizCount");
const quizProgress = document.getElementById("quizProgress");
const nextQuestionBtn = document.getElementById("nextQuestion");

function renderQuiz() {
  const current = quizData[quizIndex];
  answeredCurrent = false;

  quizQuestion.textContent = current.question;
  quizCount.textContent = `Question ${quizIndex + 1} of ${quizData.length}`;
  quizProgress.style.width = `${(quizIndex / quizData.length) * 100}%`;
  quizFeedback.textContent = "";
  nextQuestionBtn.disabled = true;

  quizOptions.innerHTML = "";
  current.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => handleQuizAnswer(button, option));
    quizOptions.appendChild(button);
  });
}

function handleQuizAnswer(button, option) {
  if (answeredCurrent) return;
  answeredCurrent = true;

  const current = quizData[quizIndex];
  const buttons = quizOptions.querySelectorAll(".quiz-option");

  buttons.forEach((btn) => {
    const isCorrect = btn.textContent === current.answer;
    btn.disabled = true;
    btn.classList.toggle("correct", isCorrect);
    if (btn === button && !isCorrect) {
      btn.classList.add("incorrect");
    }
  });

  if (option === current.answer) {
    quizScore += 1;
  }

  quizFeedback.textContent = current.explanation;
  nextQuestionBtn.disabled = false;
  quizProgress.style.width = `${((quizIndex + 1) / quizData.length) * 100}%`;
}

if (nextQuestionBtn) {
  nextQuestionBtn.addEventListener("click", () => {
    quizIndex += 1;

    if (quizIndex < quizData.length) {
      renderQuiz();
      return;
    }

    quizQuestion.textContent = `Final score: ${quizScore} / ${quizData.length}`;
    quizOptions.innerHTML = "";
    quizFeedback.textContent =
      quizScore === quizData.length
        ? "Excellent. You can use this result as a fun audience ending."
        : "Good job. Use the explanations above as discussion points in your presentation.";
    quizCount.textContent = "Quiz complete";
    nextQuestionBtn.disabled = true;
  });
}

if (quizQuestion && quizOptions) {
  renderQuiz();
}
