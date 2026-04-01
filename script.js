/**
 * Money Talks - SLC Project Challenges Implementation
 * Core State Management & Interaction Logic
 */

// Centralized State Object
const state = {
    budget: {
        total: 200000,
        pct: {
            housing: 30,
            food: 40,
            transport: 10,
            savings: 20
        }
    },
    riskScreening: {
        currentIdx: 0,
        yesCount: 0,
        questions: [
            "Have you ever needed to gamble with increasing amounts of money to get the same feeling of excitement? [33]",
            "Have you ever lied to family members, friends, or others about how much you gamble? [24]",
            "Have you ever felt restless or irritable when trying to stop, cut down, or control gambling? [11]",
            "Has your gambling ever caused problems at work or in your studies? [14]",
            "Have you ever needed to ask others to bail you out of a desperate money situation caused by gambling? [11]"
        ]
    },
    eduQuiz: {
        currentIdx: 0,
        score: 0,
        questions:", "Flat Inflation"],
                a: 1
            },
            {
                q: "If the inflation rate is 15% and your bank account earns 10%, your buying power will:",
                o:"],
                a: 2
            },
            {
                q: "The strategy of 'not putting all your eggs in one basket' is called:",
                o:", "Market Speculation"],
                a: 1
            }
        ]
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initBudgetPlanner();
    initEduQuiz();
    // Load local storage if exists
    const savedData = localStorage.getItem('moneyTalksState');
    if (savedData) {
        // Option to restore state
    }
});

// --- Budget Planner Logic ---
function initBudgetPlanner() {
    const incomeInput = document.getElementById('monthly-income');
    const sliders = ['housing', 'food', 'transport', 'savings'];

    const updateUI = () => {
        let totalAllocated = 0;
        const totalAmount = parseFloat(incomeInput.value) |

| 0;

        sliders.forEach(key => {
            const pct = parseInt(document.getElementById(`slider-${key}`).value);
            const amtSpan = document.getElementById(`val-${key}`);
            const amount = (totalAmount * (pct / 100)).toLocaleString();
            
            amtSpan.innerText = amount;
            totalAllocated += pct;
        });

        const gauge = document.getElementById('gauge-fill');
        const status = document.getElementById('budget-status');
        
        gauge.style.width = Math.min(totalAllocated, 100) + '%';
        
        if (totalAllocated > 100) {
            gauge.style.backgroundColor = 'var(--danger)';
            status.innerText = `Status: Overallocated (${totalAllocated}%)`;
            status.style.color = 'var(--danger)';
        } else if (totalAllocated < 100) {
            gauge.style.backgroundColor = 'var(--warning)';
            status.innerText = `Status: Incomplete (${totalAllocated}%)`;
            status.style.color = 'var(--warning)';
        } else {
            gauge.style.backgroundColor = 'var(--accent)';
            status.innerText = 'Status: Balanced & Healthy';
            status.style.color = 'var(--accent)';
        }
    };

    incomeInput.addEventListener('input', updateUI);
    sliders.forEach(key => {
        document.getElementById(`slider-${key}`).addEventListener('input', updateUI);
    });
    
    updateUI();
}

// --- Risk Assessment Logic ---
function processRisk(isYes) {
    const rs = state.riskScreening;
    if (isYes) rs.yesCount++;
    rs.currentIdx++;

    if (rs.currentIdx < rs.questions.length) {
        document.getElementById('q-text').innerText = rs.questions[rs.currentIdx];
        document.getElementById('q-progress').style.width = ((rs.currentIdx + 1) / rs.questions.length * 100) + '%';
    } else {
        displayRiskResult();
    }
}

function displayRiskResult() {
    document.getElementById('quiz-container').classList.add('hidden');
    const resultDiv = document.getElementById('quiz-result');
    resultDiv.classList.remove('hidden');
    
    const level = document.getElementById('risk-level');
    const advice = document.getElementById('risk-advice');
    const count = state.riskScreening.yesCount;

    if (count >= 2) {
        level.innerText = "Risk Level: High Priority";
        level.style.color = 'var(--danger)';
        advice.innerText = "Your responses indicate patterns associated with gambling disorder.[33] It is vital to separate your finances from betting. Call 1459 immediately for confidential support.";
    } else if (count === 1) {
        level.innerText = "Risk Level: At-Risk";
        level.style.color = 'var(--warning)';
        advice.innerText = "You have shown one significant warning sign. Use our budget tool to track every Tenge and consider blocking gambling apps on your device.[35]";
    } else {
        level.innerText = "Risk Level: Low";
        level.style.color = 'var(--accent)';
        advice.innerText = "You appear to be in control. Continue prioritizing your academic goals and financial honesty.[9]";
    }
}

function resetRisk() {
    state.riskScreening.currentIdx = 0;
    state.riskScreening.yesCount = 0;
    document.getElementById('q-text').innerText = state.riskScreening.questions;
    document.getElementById('q-progress').style.width = '20%';
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
}

// --- Education Quiz Logic ---
function initEduQuiz() {
    renderEduQuestion();
}

function renderEduQuestion() {
    const qData = state.eduQuiz.questions[state.eduQuiz.currentIdx];
    const container = document.getElementById('edu-options');
    document.getElementById('edu-q').innerText = qData.q;
    
    container.innerHTML = '';
    qData.o.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.style.width = '100%';
        btn.innerText = option;
        btn.onclick = () => handleEduAnswer(idx);
        container.appendChild(btn);
    });
}

function handleEduAnswer(idx) {
    const currentQ = state.eduQuiz.questions[state.eduQuiz.currentIdx];
    if (idx === currentQ.a) {
        state.eduQuiz.score++;
        alert("Correct! [27]");
    } else {
        alert("Incorrect. Financial literacy is the best defense against debt.[10]");
    }

    state.eduQuiz.currentIdx++;
    if (state.eduQuiz.currentIdx < state.eduQuiz.questions.length) {
        renderEduQuestion();
    } else {
        document.getElementById('edu-quiz').innerHTML = `
            <h3>Quiz Complete!</h3>
            <p>Your Score: ${state.eduQuiz.score} / 3</p>
            <button class="btn btn-primary" onclick="location.reload()">Restart Guide</button>
        `;
    }
}
