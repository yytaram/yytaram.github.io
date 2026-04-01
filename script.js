(() => {
  "use strict";

  /* =========================
     State & helpers
  ========================= */

  const STORE_KEY = "moneytalks_v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const nowISO = () => new Date().toISOString().slice(0, 10);

  const safeParse = (s, fallback) => {
    try { return JSON.parse(s); } catch { return fallback; }
  };

  const uid = () => Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);

  const defaultState = () => ({
    version: 1,
    theme: "system",       // system | light | dark
    textScale: 100,        // 90..120
    currency: "KZT",       // KZT | GBP | USD | EUR
    profile: null,         // { personaId, goalId, struggleId, age, income }
    completed: {
      lessons: {},         // lessonId: true
      planDays: {},        // dayId: true
      quiz: {},            // quizId: { bestScore }
      quickWins: {},       // quickWinId: true
    },
    saved: {
      cards: {},           // cardId: true
    },
    tools: {
      budget: {
        income: null,
        needs: null,
        wants: null,
        savings: null,
      },
      emergency: {
        essentials: null,
        months: 3
      },
      debt: {
        method: "avalanche",
        extra: 0,
        debts: [
          // { id, name, balance, apr, min }
        ]
      },
      growth: {
        principal: 0,
        monthly: 0,
        rate: 10,
        years: 5
      },
      scam: {
        answers: {}
      }
    },
    ideas: {},              // guideIdeasId: true
    daily: {
      lastDailyCardDate: null,
      dailyCardId: null
    }
  });

  const loadState = () => {
    const raw = localStorage.getItem(STORE_KEY);
    const st = raw ? safeParse(raw, null) : null;
    const base = defaultState();
    if (!st || typeof st !== "object") return base;

    // Shallow merge with defaults
    return {
      ...base,
      ...st,
      completed: { ...base.completed, ...(st.completed || {}) },
      saved: { ...base.saved, ...(st.saved || {}) },
      tools: { ...base.tools, ...(st.tools || {}) },
      daily: { ...base.daily, ...(st.daily || {}) }
    };
  };

  const state = loadState();

  const saveState = () => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  };

  const toast = (title, body = "", ms = 3600) => {
    const host = $("#toastRegion");
    if (!host) return;

    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <div>
        <div class="toast-title"></div>
        <div class="toast-body"></div>
      </div>
      <button class="toast-x" type="button" aria-label="Dismiss">✕</button>
    `;
    $(".toast-title", el).textContent = title;
    $(".toast-body", el).textContent = body;

    const kill = () => {
      el.style.opacity = "0";
      el.style.transform = "translateY(4px)";
      setTimeout(() => el.remove(), 180);
    };

    $(".toast-x", el).addEventListener("click", kill);
    host.appendChild(el);

    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.style.transition = "opacity 220ms ease, transform 220ms ease";
    });

    if (ms > 0) setTimeout(kill, ms);
  };

  const fmtMoney = (value, currency = state.currency) => {
    const n = Number.isFinite(value) ? value : 0;
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }).format(n);
    } catch {
      // Fallback
      const sym = currency === "KZT" ? "₸" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
      return `${sym}${Math.round(n).toLocaleString("en-GB")}`;
    }
  };

  const fmtNum = (value) => {
    const n = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(n);
  };

  const setTheme = (mode) => {
    state.theme = mode;
    saveState();

    const root = document.documentElement;
    root.removeAttribute("data-theme");

    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    // "system": use no attribute (CSS var defaults + prefers)
  };

  const applyTextScale = (pct) => {
    state.textScale = clamp(pct, 90, 120);
    document.documentElement.style.setProperty("--fs", `${state.textScale}%`);
    saveState();
  };

  const openDialog = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "true"); // minimal fallback
  };

  const closeDialog = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  };

  /* =========================
     Data
  ========================= */

  const CARDS = [
    {
      id: "gambler",
      suit: "♠",
      roman: "I",
      title: "The Gambler",
      badge: "Warning Card",
      quote: "“One more try won't fix the loss.”",
      intro:
        "The Gambler chases quick wins and believes the next bet will fix everything. This card represents the dangerous cycle of risking money on chance — whether through actual gambling, speculative crypto schemes, or any “get rich quick” promise.",
      meaning:
        "This card symbolises the compulsion to chase losses. The gambler's mindset whispers that one more try will turn things around. In reality, each attempt deepens the hole. It's not about luck — it's about recognising when chance has become a trap.",
      warningSigns: [
        "You think about your next bet more than your next meal",
        "You hide financial losses from people close to you",
        "You borrow money to gamble or invest in high‑risk schemes",
        "You feel restless or irritable when you try to stop",
        "You believe you're “due for a win” after a losing streak"
      ],
      leadsTo: [
        "Accumulating debt that spirals out of control",
        "Damaged relationships due to secrecy and broken trust",
        "Mental health decline — anxiety, depression, isolation",
        "Loss of savings, assets, and financial security",
        "Legal trouble from desperate attempts to cover losses"
      ],
      advice: [
        "Set a hard monthly limit on any risk‑based spending — and stick to it",
        "Delete gambling apps and block gambling websites",
        "Track every loss honestly in a journal — see the real numbers",
        "Talk to someone you trust about what's happening",
        "Replace the thrill‑seeking with healthy challenges — sports, learning, building",
        "Remember: the house always wins. The maths is never in your favour."
      ],
      actionToday:
        "Open your bank statement and calculate exactly how much you've spent on gambling or high‑risk bets in the last 3 months. Write that number down. Look at it.",
      scenario:
        "Ayan, 22, started betting on sports matches “just for fun” with 4,000₸ a week. After a few wins, he raised the stakes. Within 4 months, he had lost 960,000₸ — his entire emergency fund. He kept going, convinced the next big match would cover everything. It didn't. It took hitting zero in his account to finally stop and ask for help. His loss was nearly 1,000,000₸.",
      selfCheck: [
        "Have I spent more than I planned on gambling or risky bets this month?",
        "Do I feel the urge to “win back” money I've lost?",
        "Am I being honest with myself and others about my losses?"
      ],
      takeaway: "“Control is the real win.”"
    },
    {
      id: "spender",
      suit: "♥",
      roman: "II",
      title: "The Spender",
      badge: "Warning Card",
      quote: "“Small purchases can become big habits.”",
      intro:
        "The Spender fills emotional voids with purchases. This card represents the pattern of buying things you don't need with money you may not have — driven by impulse, boredom, stress, or social pressure.",
      meaning:
        "This card reveals how spending becomes a coping mechanism. The rush of a new purchase feels like progress, but it fades fast — leaving behind regret and an emptier wallet. The Spender mistakes consumption for fulfilment.",
      warningSigns: [
        "You buy things to feel better when you're stressed or sad",
        "Your closet is full of items you've barely used",
        "You feel guilt or anxiety after making purchases",
        "You avoid checking your bank balance",
        "Sales and discounts feel like “opportunities” you can't miss"
      ],
      leadsTo: [
        "Living paycheque to paycheque despite a decent income",
        "Growing credit card debt from lifestyle inflation",
        "No savings cushion for unexpected expenses",
        "Constant stress about money despite frequent spending",
        "Strained relationships over money habits"
      ],
      advice: [
        "Use the 24‑hour rule: wait a full day before any non‑essential purchase",
        "Before buying, ask: “Will this matter to me in 30 days?”",
        "Make a “Want vs Need” list before shopping",
        "Track emotional triggers — notice when and why you want to buy",
        "Unsubscribe from marketing emails and unfollow shopping influencers",
        "Set a weekly “fun spending” limit and don't exceed it"
      ],
      actionToday:
        "Check your last 10 purchases. How many were planned? How many were impulse? Write down what triggered each impulse buy.",
      scenario:
        "Madina, 24, earned a good salary but could never explain where her money went. She would buy coffee, small accessories, and “little treats” daily — spending 6,000₸–10,000₸ every day without noticing. Over a year, that added up to over 2,500,000₸ on things she barely remembered buying. When she finally tracked her spending for one month, she was shocked.",
      selfCheck: [
        "Do I often buy things I didn't plan to buy?",
        "Have I bought something this week just to feel better?",
        "Can I name three recent purchases that truly added value to my life?"
      ],
      takeaway: "“Spend with purpose.”"
    },
    {
      id: "borrower",
      suit: "♦",
      roman: "III",
      title: "The Borrower",
      badge: "Warning Card",
      quote: "“Easy debt is rarely cheap.”",
      intro:
        "The Borrower takes on debt without fully understanding the cost. This card represents the quiet danger of easy credit — buy now, pay later, personal loans for wants, and the slow weight of compound interest working against you.",
      meaning:
        "This card warns about the illusion of “free money.” Borrowing feels like a solution today but becomes pressure tomorrow. The Borrower trades future freedom for present comfort, often without realising the true price.",
      warningSigns: [
        "You regularly use buy‑now‑pay‑later for everyday purchases",
        "You're unsure exactly how much you owe in total",
        "You make only minimum payments on credit cards",
        "You borrow to maintain a lifestyle, not for true emergencies",
        "You feel anxious when you think about your debts"
      ],
      leadsTo: [
        "Interest payments eating into your actual income",
        "A low credit score that limits future opportunities",
        "Feeling trapped and unable to make life changes",
        "Borrowing from one source to pay another",
        "Years of repayment for purchases you no longer care about"
      ],
      advice: [
        "Before any loan, calculate the total cost including all interest",
        "Never borrow for things that lose value — clothes, gadgets, nights out",
        "Pay more than the minimum on credit cards whenever possible",
        "Build an emergency fund so you don't need to borrow for surprises",
        "Learn the difference between “good debt” (education, assets) and “bad debt” (consumption)",
        "If you're already in debt, make a repayment plan — even small extra payments help"
      ],
      actionToday:
        "Write down every debt you currently have — amount, interest rate, and monthly payment. Calculate how much you'll pay in total if you only make minimum payments.",
      scenario:
        "Dias, 20, used three different buy‑now‑pay‑later services to furnish his first apartment. It seemed painless — small payments spread out over months. But he lost track. When late fees kicked in and payments overlapped, he owed 720,000₸ across three platforms. What felt like 20,000₸ here and there became a monthly burden that took a year to clear.",
      selfCheck: [
        "Do I know exactly how much I owe right now?",
        "Am I borrowing for wants or genuine needs?",
        "Have I calculated what my debt actually costs me over time?"
      ],
      takeaway: "“Protect your future self.”"
    },
    {
      id: "scam",
      suit: "♣",
      roman: "IV",
      title: "The Scam",
      badge: "Warning Card",
      quote: "“Easy money often hides a trap.”",
      intro:
        "The Scam preys on hope, urgency, and trust. This card represents the world of fake opportunities, too‑good‑to‑be‑true offers, pyramid schemes, and digital fraud designed to separate you from your money.",
      meaning:
        "This card reveals how scammers exploit emotions. They create urgency, promise easy returns, and count on you not thinking twice. The Scam works because it targets real desires — financial freedom, quick fixes, belonging.",
      warningSigns: [
        "Someone promises guaranteed high returns with zero risk",
        "You're pressured to act immediately or “miss out”",
        "The opportunity requires you to recruit others to earn",
        "You can't find clear information about who's behind an offer",
        "You're asked to pay upfront for a “guaranteed” opportunity"
      ],
      leadsTo: [
        "Complete loss of invested money with no way to recover it",
        "Identity theft and compromised personal information",
        "Damaged relationships if you recruited friends or family",
        "Emotional trauma — shame, embarrassment, loss of trust",
        "Legal complications if unknowingly involved in fraud"
      ],
      advice: [
        "If it sounds too good to be true, it almost certainly is",
        "Always verify — research any company, offer, or person independently",
        "Never send money or personal information under time pressure",
        "Be sceptical of unsolicited messages about money‑making opportunities",
        "Check official sources: financial regulators, consumer protection sites",
        "Talk to someone you trust before making any big financial decision"
      ],
      actionToday:
        "Think of the last “amazing opportunity” you saw online. Spend 5 minutes researching it using official sources. See what you find.",
      scenario:
        "Amir, 19, received a DM from someone claiming to be a crypto investment mentor. They showed screenshots of huge profits and promised 300% returns in a month. Amir invested 200,000₸. For two weeks, a dashboard showed his “profits” growing. When he tried to withdraw, he was told to pay a “release fee.” He paid another 80,000₸ before realising the entire platform was fake. His 280,000₸ was gone.",
      selfCheck: [
        "Have I been offered something that seemed too good to be true recently?",
        "Do I verify financial claims before acting on them?",
        "Would I feel comfortable explaining this opportunity to a financial adviser?"
      ],
      takeaway: "“Check before you trust.”"
    },
    {
      id: "saver",
      suit: "♦",
      roman: "V",
      title: "The Saver",
      badge: "Positive Habit",
      quote: "“Small amounts become strong habits.”",
      intro:
        "The Saver understands that wealth isn't built overnight. This card represents the quiet power of consistency — putting away small amounts regularly until they become something meaningful.",
      meaning:
        "This card celebrates patience over impulse. The Saver knows that every tenge saved is a vote for your future self. It's not about deprivation — it's about choosing tomorrow's freedom over today's convenience.",
      warningSigns: [
        "You have no savings at all — not even for a small emergency",
        "You tell yourself “I'll start saving next month” repeatedly",
        "Saving feels impossible because you think you need large amounts",
        "You spend your entire income without setting anything aside",
        "You see saving as punishment rather than self‑care"
      ],
      leadsTo: [
        "Financial resilience that grows stronger every month",
        "Peace of mind knowing you have a safety net",
        "The ability to handle unexpected expenses without panic",
        "Compound growth that rewards patience over time",
        "A foundation for bigger goals — travel, education, independence"
      ],
      advice: [
        "Start with just 1,000₸ or 2,000₸ a week — the amount doesn't matter, the habit does",
        "Automate your savings so it happens before you can spend it",
        "Open a separate savings account you don't touch for daily spending",
        "Celebrate milestones — your first 50,000₸, 100,000₸, 150,000₸",
        "Save unexpected money: gifts, refunds, bonuses — put them straight away",
        "Visualise what your savings are building toward — give it purpose"
      ],
      actionToday:
        "Set up an automatic weekly transfer — even 2,000₸ — from your main account to a savings account. Do it right now.",
      scenario:
        "Zarina, 21, felt like saving was pointless on her part‑time income. She started with just 2,000₸ every week, automatically transferred every Monday. She forgot about it most weeks. After one year, she had 104,000₸ — enough to cover an unexpected car repair without stress. “It wasn't the amount,” she said. “It was knowing I had something there when I needed it.”",
      selfCheck: [
        "Do I have any savings set aside right now, even a small amount?",
        "Is saving an automatic habit, or something I think about “someday”?",
        "Can I start smaller than I think I need to?"
      ],
      takeaway: "“Small steps still grow.”"
    },
    {
      id: "planner",
      suit: "♠",
      roman: "VI",
      title: "The Planner",
      badge: "Positive Habit",
      quote: "“A plan creates freedom.”",
      intro:
        "The Planner takes control instead of reacting. This card represents the discipline of knowing where your money goes, making intentional choices, and building a financial system that works for your life.",
      meaning:
        "This card is about awareness and intention. The Planner doesn't restrict joy — they direct it. By understanding their income, expenses, and goals, they create space for both responsibility and enjoyment without guilt or anxiety.",
      warningSigns: [
        "You have no idea where your money goes each month",
        "You avoid looking at your bank statements",
        "You're frequently surprised by bills or running low before payday",
        "You make financial decisions reactively, not proactively",
        "You have goals but no concrete plan to reach them"
      ],
      leadsTo: [
        "Clear understanding of your financial reality",
        "Reduced money‑related stress and anxiety",
        "Ability to say yes to things that matter and no to things that don't",
        "Steady progress toward meaningful financial goals",
        "Confidence in handling whatever life throws at you financially"
      ],
      advice: [
        "Track every expense for one full month — every coffee, every subscription",
        "Separate your spending into Needs, Wants, and Savings",
        "Do a weekly 10‑minute money check‑in with yourself",
        "Use the 50/30/20 rule as a guide: 50% needs, 30% wants, 20% savings/debt",
        "Review subscriptions quarterly — cancel what you don't actively use",
        "Plan for irregular expenses: gifts, car maintenance, annual fees"
      ],
      actionToday:
        "Download your bank transactions from last month. Categorise every purchase into Needs, Wants, and Savings. See where your money actually goes.",
      scenario:
        "Darkhan, 23, earned the same salary as his friends but always seemed more financially comfortable. His secret was a simple spreadsheet he updated every Sunday evening — 10 minutes to review what he spent, adjust his week ahead, and move money to savings. “I don't earn more,” he said. “I just know where it goes.”",
      selfCheck: [
        "Could I tell someone exactly where my money went this month?",
        "Do I have a system for tracking my spending?",
        "When was the last time I sat down and reviewed my finances?"
      ],
      takeaway: "“A plan creates freedom.”"
    }
  ];

  const LESSONS = [
    {
      id: "start-here",
      title: "Start here: Your money map",
      minutes: 8,
      tags: ["planning", "budget", "habits"],
      summary: "Build a simple map: income → essentials → goals → options. Awareness first.",
      sections: [
        {
          heading: "The idea",
          body:
            "Financial literacy starts with clarity. If you don’t know what comes in, what goes out, and what matters, every decision becomes emotional."
        },
        {
          heading: "Do this in 10 minutes",
          bullets: [
            "Write your monthly take‑home income (or average).",
            "List your essentials (rent, food, transport, bills).",
            "List any debt payments.",
            "Pick one priority for 30 days (save 20,000₸ / pay 30,000₸ debt / stop impulse buys)."
          ]
        },
        {
          heading: "Micro‑habit",
          body: "Schedule a weekly 10‑minute money check‑in. The goal is consistency, not perfection."
        }
      ],
      action: "Use the Budget tool to compare your current spending vs a simple guideline."
    },
    {
      id: "spender-habits",
      title: "The Spender: Impulse → habit → drain",
      minutes: 7,
      tags: ["spending", "habits"],
      summary: "Learn the trigger loop and build a friction rule that protects your wallet.",
      relatedCard: "spender",
      sections: [
        { heading: "Pattern", body: "Impulse spending is usually emotional or social: stress, boredom, reward, or “keeping up”." },
        { heading: "One rule that works", body: "Use a 24‑hour pause for non‑essential purchases. If you still want it tomorrow, decide on purpose." },
        {
          heading: "Action",
          bullets: [
            "Check your last 10 purchases.",
            "Mark each as planned or impulse.",
            "Write the trigger (stress, boredom, social, sale).",
            "Pick one trigger to interrupt (e.g., ‘no shopping when tired’)."
          ]
        }
      ],
      action: "Draw The Spender card and download the quote card as a reminder."
    },
    {
      id: "borrower-debt",
      title: "The Borrower: Debt without the maths",
      minutes: 9,
      tags: ["debt", "credit"],
      summary: "Understand the real cost of debt and build a payoff plan you can follow.",
      relatedCard: "borrower",
      sections: [
        {
          heading: "Core truth",
          body: "Debt isn’t evil — but easy credit is rarely cheap. The danger is not knowing the total cost."
        },
        {
          heading: "Quick checklist",
          bullets: [
            "Write down each debt: balance, APR/interest, minimum payment.",
            "Pay more than minimum whenever possible.",
            "Stop adding new debt while paying off old debt (the ‘leaky bucket’ problem)."
          ]
        },
        {
          heading: "Choose a method",
          bullets: [
            "Avalanche: pay highest interest first (usually cheaper).",
            "Snowball: pay smallest balance first (often easier psychologically)."
          ]
        }
      ],
      action: "Use the Debt payoff tool to see a timeline and total interest."
    },
    {
      id: "scam-safety",
      title: "The Scam: Protect your money and identity",
      minutes: 8,
      tags: ["scams", "safety"],
      summary: "Spot red flags, verify claims, and protect your accounts.",
      relatedCard: "scam",
      sections: [
        {
          heading: "Red flags",
          bullets: [
            "Guaranteed returns with zero risk",
            "Pressure and urgency (“act now”)",
            "Upfront payment required",
            "You must recruit others to earn",
            "No clear information about who is behind it"
          ]
        },
        {
          heading: "Safer behaviour",
          bullets: [
            "Pause before paying or sharing details.",
            "Verify independently using official sources.",
            "Use 2‑factor authentication on accounts.",
            "If unsure, ask someone you trust."
          ]
        }
      ],
      action: "Use the Scam shield tool to score risk on an offer."
    },
    {
      id: "gambler-risk",
      title: "The Gambler: Risk that becomes a trap",
      minutes: 10,
      tags: ["gambling", "risk", "habits"],
      summary: "Learn why chasing losses is a pattern — and how to interrupt it.",
      relatedCard: "gambler",
      sections: [
        {
          heading: "What’s happening",
          body: "Chasing losses is a cognitive trap. The feeling of being ‘one win away’ keeps you locked in."
        },
        {
          heading: "Interrupt the cycle",
          bullets: [
            "Set a hard monthly limit on risk‑based spending.",
            "Block apps and sites that trigger you.",
            "Track losses honestly (numbers break denial).",
            "Replace the thrill with something healthier."
          ]
        },
        {
          heading: "Important",
          body: "If you feel out of control, talk to someone you trust and consider professional support."
        }
      ],
      action: "Draw The Gambler card and complete the “One Action for Today”."
    },
    {
      id: "saver-planner-system",
      title: "Saver + Planner: Turn habits into a system",
      minutes: 9,
      tags: ["saving", "planning", "systems"],
      summary: "Automate good behaviour: small savings, simple categories, steady progress.",
      relatedCard: "planner",
      sections: [
        {
          heading: "System beats motivation",
          body: "Motivation changes daily. A system works even on bad days."
        },
        {
          heading: "Build your system",
          bullets: [
            "A weekly automatic transfer (even 2,000₸).",
            "Separate accounts: spending vs savings.",
            "A weekly 10‑minute review.",
            "A simple budget guide (50/30/20 is a starting point)."
          ]
        },
        {
          heading: "Celebrate milestones",
          body: "Milestones keep you going — your first 50,000₸ matters."
        }
      ],
      action: "Use the Emergency fund tool to set a target and a starting amount."
    }
  ];

  const QUICK_WINS = [
    { id: "qw-24h", title: "Try the 24‑hour rule", body: "Before any non‑essential purchase, wait a day. If it still fits your goals tomorrow, decide on purpose." },
    { id: "qw-2fa", title: "Turn on 2‑factor authentication", body: "Protect your bank, email, and social accounts. Most scams start with account access." },
    { id: "qw-sub", title: "Audit subscriptions", body: "List subscriptions. Cancel anything you haven’t used this month. Small leaks add up." },
    { id: "qw-weekly", title: "Schedule a 10‑minute weekly review", body: "Set a recurring reminder. A plan creates freedom." },
    { id: "qw-save", title: "Automate a tiny saving", body: "Set up a weekly transfer — even 1,000₸/2,000₸. The habit matters more than the amount." },
    { id: "qw-scam", title: "Add one verification habit", body: "If an offer creates urgency, pause and verify using official sources before sending money." }
  ];

  const SLC_CHALLENGES = [
    {
      n: 1,
      title: "Clarify values",
      meta: "Values → honesty, responsibility, growth mindset, courage",
      desc:
        "We clarified our group values and presented them with videos to show real‑life translation into action.",
      link: "https://fin-literacy.my.canva.site/"
    },
    {
      n: 2,
      title: "Set the example",
      meta: "Challenge → “I’m financially literate”",
      desc:
        "We started a social challenge on Instagram to encourage small, visible steps toward financial literacy.",
      link: "https://fin-literacy.my.canva.site/2nd-challenge"
    },
    {
      n: 3,
      title: "Envision the future",
      meta: "AI illustration → financially literate world",
      desc:
        "We imagined a world where people manage money well and used AI to illustrate a balanced future.",
      link: "https://fin-literacy.my.canva.site/3rd-challenge"
    },
    {
      n: 4,
      title: "Enlist others",
      meta: "Survey + interviews → real student context",
      desc:
        "We collected survey responses and mini interviews to understand financial literacy and gambling awareness on campus.",
      link: "https://fin-literacy.my.canva.site/4th-challenge"
    },
    {
      n: 5,
      title: "Search for opportunities",
      meta: "Interview/podcast → insight from experience",
      desc:
        "We contacted an experienced addictologist and shared key insights about gambling addiction and financial habits.",
      link: "https://fin-literacy.my.canva.site/5th-challenge"
    },
    {
      n: 6,
      title: "Experiment and take risks",
      meta: "Interactive campaign → campus engagement",
      desc:
        "We ran a campus campaign with an interactive platform to explore decision‑making and money patterns.",
      link: "https://fin-literacy.my.canva.site/6th-challenge"
    },
    {
      n: 7,
      title: "Foster collaboration",
      meta: "Offline lecture → partnership with psychologist",
      desc:
        "We organised an offline lecture with a psychologist, engaging students with expert knowledge and discussion.",
      link: "https://fin-literacy.my.canva.site/7th-challenge"
    }
  ];

  const GUIDE_IDEAS = [
    {
      id: "ideas-modules",
      title: "A structured guide path",
      desc: "Create a “Start Here → Tools → Habits → Safety → Next steps” flow with clear beginner routes."
    },
    {
      id: "ideas-budget-templates",
      title: "Budget templates for students",
      desc: "Add sample budgets (dorm, renting, part‑time income) and a needs/wants checklist."
    },
    {
      id: "ideas-money-diary",
      title: "Money diary challenge",
      desc: "A 7‑day spending diary + reflections: trigger, emotion, decision, result."
    },
    {
      id: "ideas-scam-library",
      title: "Local scam & pyramid alerts",
      desc: "A mini library of common scam patterns + what to do next (reporting routes, verification steps)."
    },
    {
      id: "ideas-gambling-support",
      title: "Gambling & risky bets support page",
      desc: "Practical steps: limiting access, replacing triggers, speaking to someone, and where to get help."
    },
    {
      id: "ideas-community",
      title: "Peer workshops",
      desc: "Short sessions: budgeting 101, debt basics, scam awareness, and habit building."
    },
    {
      id: "ideas-stories",
      title: "Real stories & interviews",
      desc: "Include anonymised student stories, interview snippets, and lessons learned (with consent)."
    },
    {
      id: "ideas-measure",
      title: "Measure impact",
      desc: "Add before/after self‑ratings and a short quiz to track changes in confidence and habits."
    },
    {
      id: "ideas-ch8-10",
      title: "Plan Challenges 8–10",
      desc: "Strengthen others, recognise contributions, and celebrate wins with a public wrap‑up and credits."
    }
  ];

  const RESOURCES = [
    {
      label: "National Bank of Kazakhstan — Knowledge library",
      href: "https://nationalbank.kz/en/news/bilim",
      note: "Educational materials and Q&A topics."
    },
    {
      label: "eGov Kazakhstan — Financial pyramids (info + reporting routes)",
      href: "https://egov.kz/cms/en/articles/fin_1",
      note: "Explains pyramid schemes and how to contact the regulator (including via FingramotaOnline)."
    },
    {
      label: "ARDFM (Kazakhstan) — regulator overview",
      href: "https://www.gov.kz/memleket/entities/ardfm?lang=en",
      note: "Financial consumer protection and market regulation."
    },
    {
      label: "KASE — Stock market fraud memo for citizens (PDF)",
      href: "https://kase.kz/uploads/info_fraud_eng_30ad228d39.pdf",
      note: "Warnings about unlicensed ‘investment’ offers pretending to be official."
    },
    {
      label: "OECD/INFE — International survey of adult financial literacy (PDF)",
      href: "https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/12/oecd-infe-2023-international-survey-of-adult-financial-literacy_8ce94e2c/56003a32-en.pdf",
      note: "Global context on financial literacy skills."
    },
    {
      label: "MoneyHelper (UK) — Beginners' guide to managing your money",
      href: "https://www.moneyhelper.org.uk/en/everyday-money/budgeting/beginners-guide-to-managing-your-money",
      note: "Budgeting basics and practical steps."
    }
  ];

  const QUIZ = {
    id: "money-basics",
    title: "Money basics (5 questions)",
    questions: [
      {
        q: "Which statement best describes a budget?",
        options: [
          "A list of everything you can’t buy",
          "A plan for where your money should go",
          "A way to become rich quickly",
          "A report your bank makes for you"
        ],
        answer: 1,
        explain: "A budget is a plan for your income and expenses — it gives you control and reduces surprises."
      },
      {
        q: "What is a common scam red flag?",
        options: [
          "A company gives you time to decide",
          "A promise of guaranteed high returns with zero risk",
          "Clear contact details and transparent fees",
          "Independent reviews from multiple sources"
        ],
        answer: 1,
        explain: "‘Guaranteed returns’ and ‘no risk’ are classic red flags — real investing always includes risk."
      },
      {
        q: "If you only pay the minimum on a credit card, what often happens?",
        options: [
          "You usually pay it off fastest",
          "Interest can keep you in debt much longer",
          "Your balance can’t increase",
          "It becomes interest‑free"
        ],
        answer: 1,
        explain: "Minimum payments can lead to long payoff times and more interest paid overall."
      },
      {
        q: "The 24‑hour rule helps most with…",
        options: [
          "Making loans cheaper",
          "Avoiding impulse purchases",
          "Doubling your income",
          "Improving exchange rates"
        ],
        answer: 1,
        explain: "It creates a pause so emotions don’t make the decision for you."
      },
      {
        q: "A simple first step to start saving is…",
        options: [
          "Wait until you can save a large amount",
          "Automate small weekly transfers",
          "Spend more to feel motivated",
          "Borrow money to ‘invest’"
        ],
        answer: 1,
        explain: "Small, automated saving builds consistency and reduces friction."
      }
    ]
  };

  /* =========================
     UI rendering
  ========================= */

  const setActiveNav = () => {
    const hash = location.hash || "#home";
    const links = $$(".nav-links a");
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === hash));
  };

  const smoothScrollToHash = () => {
    const id = (location.hash || "#home").slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const computeProgress = () => {
    const totalLessons = LESSONS.length;
    const completedLessons = Object.keys(state.completed.lessons || {}).length;

    const totalPlan = 7;
    const completedPlan = Object.keys(state.completed.planDays || {}).length;

    const totalQuiz = 1;
    const completedQuiz = state.completed.quiz && state.completed.quiz[QUIZ.id] ? 1 : 0;

    // Weighted for a nicer feel
    const weightLessons = 0.55;
    const weightPlan = 0.30;
    const weightQuiz = 0.15;

    const partLessons = totalLessons ? (completedLessons / totalLessons) : 0;
    const partPlan = totalPlan ? (completedPlan / totalPlan) : 0;
    const partQuiz = totalQuiz ? (completedQuiz / totalQuiz) : 0;

    const score = (partLessons * weightLessons) + (partPlan * weightPlan) + (partQuiz * weightQuiz);
    return {
      pct: Math.round(score * 100),
      completedLessons,
      totalLessons,
      completedPlan,
      totalPlan,
      completedQuiz,
      totalQuiz
    };
  };

  const updateProgressUI = () => {
    const p = computeProgress();
    const fill = $("#progressFill");
    const pct = $("#progressPct");
    const bar = $(".progress-bar");

    if (fill) fill.style.width = `${p.pct}%`;
    if (pct) pct.textContent = `${p.pct}%`;
    if (bar) bar.setAttribute("aria-valuenow", String(p.pct));

    renderBadges();
  };

  const renderBadges = () => {
    const host = $("#badgeRow");
    if (!host) return;
    host.innerHTML = "";

    const badges = [];

    const lessonCount = Object.keys(state.completed.lessons || {}).length;
    const planCount = Object.keys(state.completed.planDays || {}).length;
    const savedCards = Object.keys(state.saved.cards || {}).length;

    if (lessonCount >= 1) badges.push({ t: "First lesson", cls: "good" });
    if (lessonCount >= LESSONS.length) badges.push({ t: "All lessons", cls: "good" });
    if (planCount >= 3) badges.push({ t: "3‑day streak", cls: "good" });
    if (planCount >= 7) badges.push({ t: "7‑day reset", cls: "good" });
    if (state.completed.quiz && state.completed.quiz[QUIZ.id]) badges.push({ t: "Quiz done", cls: "warn" });
    if (savedCards >= 1) badges.push({ t: "Saved a card", cls: "warn" });

    if (!badges.length) {
      const el = document.createElement("span");
      el.className = "badge";
      el.textContent = "Start a lesson to earn badges";
      host.appendChild(el);
      return;
    }

    badges.slice(0, 6).forEach(b => {
      const el = document.createElement("span");
      el.className = `badge ${b.cls || ""}`.trim();
      el.textContent = b.t;
      host.appendChild(el);
    });
  };

  const renderQuickWin = () => {
    const host = $("#quickWin");
    if (!host) return;

    const done = state.completed.quickWins || {};
    const remaining = QUICK_WINS.filter(q => !done[q.id]);
    const pick = remaining.length
      ? remaining[Math.floor(Math.random() * remaining.length)]
      : QUICK_WINS[Math.floor(Math.random() * QUICK_WINS.length)];

    host.dataset.qwId = pick.id;
    $(".quick-win-title", host).textContent = pick.title;
    $(".quick-win-body", host).textContent = pick.body;
  };

  const renderLessons = () => {
    const host = $("#learnGrid");
    if (!host) return;

    host.innerHTML = "";
    const completed = state.completed.lessons || {};

    const query = ($("#learnSearch")?.value || "").trim().toLowerCase();

    const filtered = LESSONS.filter(l => {
      if (!query) return true;
      const haystack = `${l.title} ${l.summary} ${(l.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });

    filtered.forEach(lesson => {
      const done = !!completed[lesson.id];
      const el = document.createElement("article");
      el.className = "lesson-card";

      const tagText = (lesson.tags || []).slice(0, 3).map(t => `#${t}`).join(" ");

      el.innerHTML = `
        <div class="lesson-top">
          <div>
            <h3 class="lesson-title"></h3>
            <div class="lesson-meta"></div>
          </div>
          <span class="pill chip ${done ? "good" : ""}">${done ? "Completed" : `${lesson.minutes} min`}</span>
        </div>
        <p class="lesson-desc"></p>
        <div class="lesson-actions">
          <button class="btn small" type="button" data-open-lesson="${lesson.id}">
            <span class="btn-ic" aria-hidden="true">📖</span>
            Open
          </button>
          <button class="btn small ghost" type="button" data-toggle-lesson="${lesson.id}">
            ${done ? "Mark not done" : "Mark done"}
          </button>
        </div>
      `;

      $(".lesson-title", el).textContent = lesson.title;
      $(".lesson-meta", el).textContent = `${tagText}${tagText ? " • " : ""}${lesson.minutes} min`;
      $(".lesson-desc", el).textContent = lesson.summary;

      host.appendChild(el);
    });

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "card";
      empty.innerHTML = `<div class="card-body"><p class="muted">No lessons matched your search.</p></div>`;
      host.appendChild(empty);
    }
  };

  const renderSLC = () => {
    const host = $("#slcTimeline");
    if (!host) return;
    host.innerHTML = "";

    SLC_CHALLENGES.forEach(c => {
      const el = document.createElement("div");
      el.className = "timeline-item";
      el.innerHTML = `
        <div class="timeline-top">
          <div>
            <div class="timeline-title">#${c.n} — ${c.title}</div>
            <div class="timeline-meta">${c.meta}</div>
          </div>
          <span class="pill chip">Done</span>
        </div>
        <p class="timeline-desc"></p>
        <a class="timeline-link" href="${c.link}" target="_blank" rel="noreferrer">
          <span>Open evidence</span> <span aria-hidden="true">↗</span>
        </a>
      `;
      $(".timeline-desc", el).textContent = c.desc;
      host.appendChild(el);
    });
  };

  const renderGuideIdeas = () => {
    const host = $("#guideIdeas");
    if (!host) return;
    host.innerHTML = "";

    const checked = state.ideas || {};

    GUIDE_IDEAS.forEach(item => {
      const el = document.createElement("label");
      el.className = "check-item";
      el.innerHTML = `
        <input type="checkbox" ${checked[item.id] ? "checked" : ""} data-idea="${item.id}" />
        <span class="check-text">
          <span class="check-title"></span>
          <span class="check-desc"></span>
        </span>
      `;
      $(".check-title", el).textContent = item.title;
      $(".check-desc", el).textContent = item.desc;
      host.appendChild(el);
    });
  };

  const renderResources = () => {
    const host = $("#resourceLinks");
    if (!host) return;

    const list = document.createElement("div");
    list.className = "mini-list";

    RESOURCES.forEach(r => {
      const el = document.createElement("div");
      el.className = "mini-item";
      el.innerHTML = `
        <div class="mini-left">
          <div class="mini-title"></div>
          <div class="mini-sub"></div>
        </div>
        <a class="btn small ghost" href="${r.href}" target="_blank" rel="noreferrer">Open ↗</a>
      `;
      $(".mini-title", el).textContent = r.label;
      $(".mini-sub", el).textContent = r.note;
      list.appendChild(el);
    });

    host.innerHTML = "";
    host.appendChild(list);
  };

  const renderCardsGrid = () => {
    const host = $("#cardsGrid");
    if (!host) return;
    host.innerHTML = "";

    CARDS.forEach(card => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "play-card";
      el.setAttribute("data-card", card.id);
      el.setAttribute("aria-label", `${card.title} card`);

      const tone = card.badge.toLowerCase().includes("positive") ? "good" : "warn";

      el.innerHTML = `
        <div class="play-top">
          <div class="play-suit" aria-hidden="true">${card.suit}</div>
          <div class="pill chip ${tone}">
            ${card.badge}
          </div>
        </div>
        <h4 class="play-title">${card.roman}. ${card.title}</h4>
        <p class="play-quote">${card.quote}</p>
        <div class="play-badge">
          <span>${card.suit} ${card.roman}</span>
          <span aria-hidden="true">Open →</span>
        </div>
      `;

      host.appendChild(el);
    });
  };

  const renderSavedCards = () => {
    const host = $("#savedList");
    const empty = $("#savedEmpty");
    const count = $("#savedCount");

    const saved = state.saved.cards || {};
    const ids = Object.keys(saved);

    if (count) count.textContent = String(ids.length);

    if (!host || !empty) return;
    host.innerHTML = "";

    if (!ids.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    ids
      .map(id => CARDS.find(c => c.id === id))
      .filter(Boolean)
      .forEach(c => {
        const row = document.createElement("div");
        row.className = "mini-item";
        row.innerHTML = `
          <div class="mini-left">
            <div class="mini-title"></div>
            <div class="mini-sub"></div>
          </div>
          <div class="row">
            <button class="btn small ghost" type="button" data-open-card="${c.id}">Open</button>
            <button class="btn small danger" type="button" data-unsave-card="${c.id}">Remove</button>
          </div>
        `;
        $(".mini-title", row).textContent = `${c.suit} ${c.title}`;
        $(".mini-sub", row).textContent = c.takeaway;
        host.appendChild(row);
      });
  };

  /* =========================
     Lesson dialog & quiz
  ========================= */

  const openLesson = (lessonId) => {
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return;

    const dlg = $("#lessonDialog");
    const title = $("#lessonTitle");
    const body = $("#lessonBody");
    const mark = $("#lessonMarkDone");

    if (!dlg || !title || !body || !mark) return;

    title.textContent = lesson.title;

    const tone = lesson.relatedCard
      ? (CARDS.find(c => c.id === lesson.relatedCard)?.badge.toLowerCase().includes("positive") ? "good" : "warn")
      : "";

    const done = !!(state.completed.lessons || {})[lessonId];

    body.innerHTML = `
      <div class="row" style="margin-bottom: 10px;">
        <span class="pill chip">${lesson.minutes} min</span>
        ${(lesson.tags || []).slice(0, 5).map(t => `<span class="pill chip">#${escapeHtml(t)}</span>`).join("")}
        ${lesson.relatedCard ? `<span class="pill chip ${tone}">Related card: ${CARDS.find(c => c.id === lesson.relatedCard)?.title || "—"}</span>` : ""}
        <span class="pill chip ${done ? "good" : ""}">${done ? "Completed" : "Not completed"}</span>
      </div>

      ${lesson.sections.map(s => renderSection(s)).join("")}

      <div class="hr"></div>

      <div class="callout good">
        <strong>Try this:</strong> ${escapeHtml(lesson.action || "Pick one small action today.")}
      </div>

      ${lesson.relatedCard ? `
        <div class="row">
          <button class="btn small" type="button" data-open-related-card="${lesson.relatedCard}">
            <span class="btn-ic" aria-hidden="true">🂠</span>
            Open related card
          </button>
        </div>
      ` : ""}
    `;

    mark.textContent = done ? "Mark lesson not complete" : "Mark lesson complete";
    mark.dataset.lesson = lessonId;

    openDialog(dlg);
  };

  const renderSection = (s) => {
    const heading = escapeHtml(s.heading || "");
    const body = s.body ? `<p class="muted">${escapeHtml(s.body)}</p>` : "";
    const bullets = Array.isArray(s.bullets) && s.bullets.length
      ? `<ul class="tick-list">${s.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
      : "";
    return `
      <div style="margin-bottom: 14px;">
        <h4 class="h4" style="margin: 0 0 6px 0;">${heading}</h4>
        ${body}
        ${bullets}
      </div>
    `;
  };

  const escapeHtml = (str) => String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const toggleLessonDone = (lessonId) => {
    state.completed.lessons = state.completed.lessons || {};
    const done = !!state.completed.lessons[lessonId];

    if (done) delete state.completed.lessons[lessonId];
    else state.completed.lessons[lessonId] = true;

    saveState();
    renderLessons();
    updateProgressUI();
  };

  const openQuiz = () => {
    const dlg = $("#quizDialog");
    const body = $("#quizBody");
    if (!dlg || !body) return;

    body.innerHTML = renderQuizUI(QUIZ);
    wireQuiz(body, QUIZ);

    openDialog(dlg);
  };

  const renderQuizUI = (quiz) => {
    return `
      <div class="card inset" style="padding: 14px;">
        <h4 class="h4" style="margin: 0 0 8px 0;">${escapeHtml(quiz.title)}</h4>
        <p class="muted" style="margin: 0 0 12px 0;">Answer, learn, and retry anytime. Your best score saves locally.</p>

        <div id="quizStage"></div>

        <div class="hr"></div>
        <div class="kpi">
          <div class="kpi-row">
            <span class="kpi-k">Best score</span>
            <span class="kpi-v" id="quizBest">—</span>
          </div>
        </div>
      </div>
    `;
  };

  const wireQuiz = (root, quiz) => {
    const stage = $("#quizStage", root);
    const bestEl = $("#quizBest", root);
    const best = state.completed.quiz && state.completed.quiz[quiz.id] ? state.completed.quiz[quiz.id].bestScore : null;
    if (bestEl) bestEl.textContent = best == null ? "—" : `${best}/${quiz.questions.length}`;

    let idx = 0;
    let score = 0;

    const renderQ = () => {
      const q = quiz.questions[idx];
      stage.innerHTML = `
        <div class="row" style="justify-content: space-between; margin-bottom: 10px;">
          <span class="pill chip">Question ${idx + 1}/${quiz.questions.length}</span>
          <span class="pill chip">Score: ${score}</span>
        </div>

        <div class="card inset" style="padding: 14px;">
          <div style="font-weight: 900; margin-bottom: 10px;">${escapeHtml(q.q)}</div>
          <div class="checklist" role="group" aria-label="Quiz options">
            ${q.options.map((opt, i) => `
              <label class="check-item" style="cursor:pointer;">
                <input type="radio" name="q" value="${i}" />
                <span class="check-text">
                  <span class="check-title">${escapeHtml(opt)}</span>
                </span>
              </label>
            `).join("")}
          </div>

          <div class="row" style="margin-top: 12px;">
            <button class="btn small primary" type="button" id="quizSubmit">Submit</button>
            <button class="btn small ghost" type="button" id="quizSkip">Skip</button>
          </div>

          <div class="micro-note" id="quizFeedback" aria-live="polite"></div>
        </div>
      `;

      $("#quizSubmit", stage).addEventListener("click", () => {
        const picked = stage.querySelector('input[name="q"]:checked');
        const feedback = $("#quizFeedback", stage);
        if (!picked) {
          feedback.textContent = "Pick an option first.";
          return;
        }
        const val = Number(picked.value);
        const ok = val === q.answer;
        if (ok) score += 1;

        feedback.innerHTML = ok
          ? `<span style="color: var(--good); font-weight: 900;">Correct.</span> <span class="muted">${escapeHtml(q.explain)}</span>`
          : `<span style="color: var(--warn); font-weight: 900;">Not quite.</span> <span class="muted">${escapeHtml(q.explain)}</span>`;

        $("#quizSubmit", stage).disabled = true;
        $("#quizSkip", stage).disabled = true;

        const nextBtn = document.createElement("button");
        nextBtn.className = "btn small";
        nextBtn.type = "button";
        nextBtn.textContent = idx + 1 === quiz.questions.length ? "See results" : "Next";
        nextBtn.addEventListener("click", () => {
          idx += 1;
          if (idx >= quiz.questions.length) renderResult();
          else renderQ();
        });
        stage.querySelector(".row").appendChild(nextBtn);
      });

      $("#quizSkip", stage).addEventListener("click", () => {
        idx += 1;
        if (idx >= quiz.questions.length) renderResult();
        else renderQ();
      });
    };

    const renderResult = () => {
      const total = quiz.questions.length;
      stage.innerHTML = `
        <div class="callout good">
          <strong>Results:</strong> You scored <strong>${score}/${total}</strong>.
          ${score === total ? "Perfect." : "Nice work — retry to improve."}
        </div>

        <div class="row">
          <button class="btn small primary" type="button" id="quizRetry">Retry</button>
          <button class="btn small" type="button" id="quizSave">Save score</button>
        </div>
      `;

      $("#quizRetry", stage).addEventListener("click", () => {
        idx = 0;
        score = 0;
        renderQ();
      });

      $("#quizSave", stage).addEventListener("click", () => {
        state.completed.quiz = state.completed.quiz || {};
        const prev = state.completed.quiz[quiz.id]?.bestScore ?? null;
        const bestScore = prev == null ? score : Math.max(prev, score);

        state.completed.quiz[quiz.id] = { bestScore };
        saveState();

        if (bestEl) bestEl.textContent = `${bestScore}/${quiz.questions.length}`;

        updateProgressUI();
        toast("Saved", `Best score: ${bestScore}/${quiz.questions.length}`);
      });
    };

    renderQ();
  };

  /* =========================
     Check-in (persona path)
  ========================= */

  const PERSONAS = {
    gambler: { id: "gambler", label: "The Gambler", focus: ["gambler-risk", "scam-safety", "start-here"], tool: "scam" },
    spender: { id: "spender", label: "The Spender", focus: ["spender-habits", "start-here", "saver-planner-system"], tool: "budget" },
    borrower:{ id: "borrower",label: "The Borrower",focus: ["borrower-debt","start-here","saver-planner-system"], tool: "debt" },
    scam:   { id: "scam", label: "The Scam", focus: ["scam-safety","start-here","borrower-debt"], tool: "scam" },
    saver:  { id: "saver", label: "The Saver", focus: ["saver-planner-system","start-here","spender-habits"], tool: "emergency" },
    planner:{ id: "planner", label: "The Planner", focus: ["start-here","saver-planner-system","spender-habits"], tool: "budget" }
  };

  const goalLabel = (g) => ({
    budget: "Build a budget I can follow",
    save: "Start saving (even small)",
    debt: "Start paying down debt",
    safety: "Avoid scams & protect my accounts",
    invest: "Learn investing basics safely",
    habits: "Build better money habits"
  }[g] || g);

  const renderCheckinResult = (profile) => {
    const host = $("#checkinResult");
    const chip = $("#personaChip");
    const saveBtn = $("#savePath");
    const shareBtn = $("#sharePath");

    if (!host || !chip) return;

    const persona = PERSONAS[profile.struggleId] || PERSONAS.planner;
    const recommendedLessons = persona.focus.map(id => LESSONS.find(l => l.id === id)).filter(Boolean);

    chip.textContent = persona.label;
    chip.className = "pill chip";

    host.innerHTML = `
      <div class="callout good">
        <strong>Your persona:</strong> ${escapeHtml(persona.label)}.
        <div class="muted" style="margin-top: 6px;">
          Goal: <strong>${escapeHtml(goalLabel(profile.goalId))}</strong>
          ${profile.income ? ` • Income: <strong>${escapeHtml(fmtMoney(profile.income))}</strong>` : ""}
        </div>
      </div>

      <h4 class="h4">Recommended next steps (in order)</h4>
      <div class="mini-list">
        ${recommendedLessons.map(l => `
          <div class="mini-item">
            <div class="mini-left">
              <div class="mini-title">${escapeHtml(l.title)}</div>
              <div class="mini-sub">${escapeHtml(l.summary)}</div>
            </div>
            <button class="btn small" type="button" data-open-lesson="${escapeHtml(l.id)}">Open</button>
          </div>
        `).join("")}
      </div>

      <div class="hr"></div>

      <h4 class="h4">Recommended tool</h4>
      <div class="callout">
        <strong>Use:</strong> <span class="muted">${escapeHtml(toolName(persona.tool))}</span>
        <div class="row" style="margin-top: 10px;">
          <a class="btn small primary" href="#tools" data-link data-open-tool="${escapeHtml(persona.tool)}">
            Open tool
          </a>
          ${persona.id ? `<button class="btn small ghost" type="button" data-open-card="${escapeHtml(persona.id)}">Open matching card</button>` : ""}
        </div>
      </div>
    `;

    if (saveBtn) saveBtn.disabled = false;
    if (shareBtn) shareBtn.disabled = false;
  };

  /* =========================
     Tools
  ========================= */

  const toolName = (id) => ({
    budget: "Budget builder",
    emergency: "Emergency fund target",
    debt: "Debt payoff simulator",
    growth: "Compound growth calculator",
    scam: "Scam shield"
  }[id] || id);

  const renderToolPanel = (toolId) => {
    const panel = $("#toolPanel");
    if (!panel) return;

    const renderers = {
      budget: renderToolBudget,
      emergency: renderToolEmergency,
      debt: renderToolDebt,
      growth: renderToolGrowth,
      scam: renderToolScam
    };

    panel.innerHTML = "";
    (renderers[toolId] || renderToolBudget)(panel);

    // aria attributes + active tab
    $$(".tab").forEach(t => {
      const isOn = t.dataset.tool === toolId;
      t.setAttribute("aria-selected", isOn ? "true" : "false");
      if (isOn) panel.setAttribute("aria-labelledby", t.id);
    });
  };

  const renderToolBudget = (panel) => {
    const data = state.tools.budget || {};
    const income = data.income ?? (state.profile?.income ?? "");

    panel.innerHTML = `
      <div class="tool-grid">
        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Budget builder</h3>
          <p class="muted" style="margin: 0 0 12px 0;">
            Enter your monthly take‑home income, then compare your budget to a simple guideline (50/30/20).
          </p>

          <form class="form" id="budgetForm">
            <label class="field">
              <span class="label">Monthly take‑home income</span>
              <input name="income" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 250000" value="${escapeHtml(income)}" required />
            </label>

            <div class="form-row">
              <label class="field">
                <span class="label">Needs (essentials)</span>
                <input name="needs" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 120000" value="${escapeHtml(data.needs ?? "")}" />
              </label>
              <label class="field">
                <span class="label">Wants (lifestyle)</span>
                <input name="wants" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 70000" value="${escapeHtml(data.wants ?? "")}" />
              </label>
            </div>

            <label class="field">
              <span class="label">Savings + debt payments</span>
              <input name="savings" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 60000" value="${escapeHtml(data.savings ?? "")}" />
            </label>

            <div class="row">
              <button class="btn small primary" type="submit">Calculate</button>
              <button class="btn small ghost" type="button" id="budgetAutofill">Autofill guideline</button>
              <button class="btn small" type="button" id="budgetSave">Save</button>
            </div>
          </form>

          <div class="micro-note">
            Note: 50/30/20 is a guide, not a rule. Real life varies — especially with rent and family obligations.
          </div>
        </div>

        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Results</h3>
          <div id="budgetResults" class="kpi"></div>
        </div>
      </div>
    `;

    $("#budgetForm").addEventListener("submit", (e) => {
      e.preventDefault();
      calcBudget(panel);
    });

    $("#budgetAutofill").addEventListener("click", () => {
      const f = $("#budgetForm");
      const incomeVal = Number(f.income.value || 0);
      f.needs.value = Math.round(incomeVal * 0.50);
      f.wants.value = Math.round(incomeVal * 0.30);
      f.savings.value = Math.round(incomeVal * 0.20);
      calcBudget(panel);
    });

    $("#budgetSave").addEventListener("click", () => {
      const f = $("#budgetForm");
      state.tools.budget = {
        income: numOrNull(f.income.value),
        needs: numOrNull(f.needs.value),
        wants: numOrNull(f.wants.value),
        savings: numOrNull(f.savings.value),
      };
      saveState();
      toast("Saved", "Budget inputs saved locally.");
      updateProgressUI();
    });

    // initial calc
    calcBudget(panel, true);
  };

  const calcBudget = (panel, quiet = false) => {
    const f = $("#budgetForm", panel);
    const out = $("#budgetResults", panel);
    if (!f || !out) return;

    const income = Number(f.income.value || 0);
    const needs = Number(f.needs.value || 0);
    const wants = Number(f.wants.value || 0);
    const savings = Number(f.savings.value || 0);

    const guideline = {
      needs: income * 0.50,
      wants: income * 0.30,
      savings: income * 0.20
    };

    const total = needs + wants + savings;
    const diff = income - total;

    const pct = (x) => income > 0 ? Math.round((x / income) * 100) : 0;
    const delta = (x, g) => x - g;

    const status = diff === 0 ? "Balanced" : diff > 0 ? "Under‑assigned (leftover)" : "Over‑assigned (shortfall)";

    out.innerHTML = `
      <div class="kpi-row">
        <span class="kpi-k">Income</span>
        <span class="kpi-v">${fmtMoney(income)}</span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">Your total (needs+wants+savings)</span>
        <span class="kpi-v">${fmtMoney(total)}</span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">${status}</span>
        <span class="kpi-v">${fmtMoney(Math.abs(diff))}</span>
      </div>

      <div class="hr"></div>

      <div class="kpi-row">
        <span class="kpi-k">Needs</span>
        <span class="kpi-v">${fmtMoney(needs)} <span class="muted">(${pct(needs)}%)</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">Wants</span>
        <span class="kpi-v">${fmtMoney(wants)} <span class="muted">(${pct(wants)}%)</span></span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">Savings + debt</span>
        <span class="kpi-v">${fmtMoney(savings)} <span class="muted">(${pct(savings)}%)</span></span>
      </div>

      <div class="hr"></div>

      <div class="callout ${diff < 0 ? "warn" : "good"}">
        <strong>Guideline comparison (50/30/20):</strong>
        <div class="muted" style="margin-top: 6px;">
          Needs: ${fmtMoney(guideline.needs)} (${delta(needs, guideline.needs) >= 0 ? "+" : ""}${fmtMoney(delta(needs, guideline.needs))})<br/>
          Wants: ${fmtMoney(guideline.wants)} (${delta(wants, guideline.wants) >= 0 ? "+" : ""}${fmtMoney(delta(wants, guideline.wants))})<br/>
          Savings+Debt: ${fmtMoney(guideline.savings)} (${delta(savings, guideline.savings) >= 0 ? "+" : ""}${fmtMoney(delta(savings, guideline.savings))})
        </div>
      </div>
    `;

    if (!quiet) toast("Budget updated", "Scroll to see your results.");
  };

  const renderToolEmergency = (panel) => {
    const data = state.tools.emergency || {};
    panel.innerHTML = `
      <div class="tool-grid">
        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Emergency fund target</h3>
          <p class="muted" style="margin: 0 0 12px 0;">
            Estimate a safety buffer based on your essential monthly costs.
          </p>

          <form class="form" id="emergencyForm">
            <label class="field">
              <span class="label">Essential monthly expenses</span>
              <input name="essentials" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 140000" value="${escapeHtml(data.essentials ?? "")}" required />
            </label>

            <label class="field">
              <span class="label">Months of cushion</span>
              <select name="months">
                ${[1,2,3,4,5,6,9,12].map(m => `<option value="${m}" ${Number(data.months ?? 3) === m ? "selected" : ""}>${m} month${m===1?"":"s"}</option>`).join("")}
              </select>
            </label>

            <label class="field">
              <span class="label">Weekly saving you can commit (optional)</span>
              <input name="weekly" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 2000" />
            </label>

            <div class="row">
              <button class="btn small primary" type="submit">Calculate</button>
              <button class="btn small" type="button" id="emergencySave">Save</button>
            </div>
          </form>
        </div>

        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Results</h3>
          <div id="emergencyResults" class="kpi"></div>
        </div>
      </div>
    `;

    $("#emergencyForm").addEventListener("submit", (e) => {
      e.preventDefault();
      calcEmergency(panel);
    });

    $("#emergencySave").addEventListener("click", () => {
      const f = $("#emergencyForm");
      state.tools.emergency = {
        essentials: numOrNull(f.essentials.value),
        months: Number(f.months.value || 3)
      };
      saveState();
      toast("Saved", "Emergency fund inputs saved locally.");
      updateProgressUI();
    });

    calcEmergency(panel, true);
  };

  const calcEmergency = (panel, quiet = false) => {
    const f = $("#emergencyForm", panel);
    const out = $("#emergencyResults", panel);
    if (!f || !out) return;

    const essentials = Number(f.essentials.value || 0);
    const months = Number(f.months.value || 3);
    const weekly = Number(f.weekly.value || 0);

    const target = essentials * months;
    const monthlyFromWeekly = weekly * 4.33;

    const monthsToTarget = monthlyFromWeekly > 0 ? (target / monthlyFromWeekly) : null;

    out.innerHTML = `
      <div class="kpi-row">
        <span class="kpi-k">Target</span>
        <span class="kpi-v">${fmtMoney(target)}</span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">Essentials × months</span>
        <span class="kpi-v">${fmtMoney(essentials)} × ${months}</span>
      </div>

      <div class="hr"></div>

      <div class="callout good">
        <strong>Start small:</strong>
        <div class="muted" style="margin-top: 6px;">
          If saving feels hard, start with 1,000₸–2,000₸ weekly and automate it.
        </div>
      </div>

      ${weekly > 0 ? `
        <div class="kpi-row">
          <span class="kpi-k">Your weekly saving</span>
          <span class="kpi-v">${fmtMoney(weekly)}</span>
        </div>
        <div class="kpi-row">
          <span class="kpi-k">Estimated time to target</span>
          <span class="kpi-v">${monthsToTarget ? `${fmtNum(monthsToTarget)} months` : "—"}</span>
        </div>
      ` : `
        <div class="kpi-row">
          <span class="kpi-k">Add a weekly saving amount</span>
          <span class="kpi-v">to estimate time</span>
        </div>
      `}
    `;

    if (!quiet) toast("Emergency fund updated", "Target calculated.");
  };

  const renderToolDebt = (panel) => {
    const data = state.tools.debt || { debts: [] };

    panel.innerHTML = `
      <div class="tool-grid">
        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Debt payoff simulator</h3>
          <p class="muted" style="margin: 0 0 12px 0;">
            Add debts (balance, APR, minimum payment). Choose avalanche or snowball, then simulate payoff.
          </p>

          <div class="card inset" style="padding: 14px;">
            <div class="form">
              <div class="form-row">
                <label class="field">
                  <span class="label">Method</span>
                  <select id="debtMethod">
                    <option value="avalanche" ${data.method === "avalanche" ? "selected" : ""}>Avalanche (highest APR first)</option>
                    <option value="snowball" ${data.method === "snowball" ? "selected" : ""}>Snowball (smallest balance first)</option>
                  </select>
                </label>
                <label class="field">
                  <span class="label">Extra payment per month (optional)</span>
                  <input id="debtExtra" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g., 10000" value="${escapeHtml(data.extra ?? 0)}" />
                </label>
              </div>

              <div class="row">
                <button class="btn small" type="button" id="debtAdd">+ Add debt</button>
                <button class="btn small primary" type="button" id="debtCalc">Simulate</button>
                <button class="btn small" type="button" id="debtSave">Save</button>
              </div>
            </div>
          </div>

          <div class="hr"></div>

          <div id="debtList"></div>
        </div>

        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Results</h3>
          <div id="debtResults" class="kpi"></div>
          <div class="hr"></div>
          <div id="debtSchedule"></div>
        </div>
      </div>
    `;

    const list = $("#debtList", panel);
    const results = $("#debtResults", panel);

    const renderDebtRows = () => {
      const debts = state.tools.debt.debts || [];
      if (!list) return;

      if (!debts.length) {
        list.innerHTML = `
          <div class="empty-state">
            <p class="muted" style="margin:0;">
              No debts added yet. Add one to simulate payoff. (Example: credit card, BNPL, personal loan.)
            </p>
          </div>
        `;
        return;
      }

      list.innerHTML = `
        <div class="mini-list">
          ${debts.map(d => `
            <div class="mini-item" data-debt-row="${escapeHtml(d.id)}">
              <div class="mini-left" style="gap: 8px;">
                <div class="mini-title">
                  <input class="debt-name" type="text" value="${escapeHtml(d.name)}" aria-label="Debt name" />
                </div>
                <div class="row">
                  <label class="field" style="gap: 6px;">
                    <span class="label">Balance</span>
                    <input class="debt-balance" type="number" inputmode="decimal" min="0" step="1" value="${escapeHtml(d.balance)}" />
                  </label>
                  <label class="field" style="gap: 6px;">
                    <span class="label">APR %</span>
                    <input class="debt-apr" type="number" inputmode="decimal" min="0" step="0.01" value="${escapeHtml(d.apr)}" />
                  </label>
                  <label class="field" style="gap: 6px;">
                    <span class="label">Minimum / month</span>
                    <input class="debt-min" type="number" inputmode="decimal" min="0" step="1" value="${escapeHtml(d.min)}" />
                  </label>
                </div>
              </div>
              <div class="row" style="align-items:flex-start;">
                <button class="btn small danger" type="button" data-debt-remove="${escapeHtml(d.id)}">Remove</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;

      // style the inline inputs inside debt list
      $$(".debt-name, .debt-balance, .debt-apr, .debt-min", list).forEach(inp => {
        inp.style.width = "100%";
        inp.style.border = "1px solid var(--border)";
        inp.style.background = "color-mix(in srgb, var(--panel2) 70%, transparent)";
        inp.style.borderRadius = "14px";
        inp.style.padding = "10px 12px";
      });

      $$(".mini-item", list).forEach(row => {
        const id = row.getAttribute("data-debt-row");
        const d = debts.find(x => x.id === id);
        if (!d) return;

        const name = $(".debt-name", row);
        const bal = $(".debt-balance", row);
        const apr = $(".debt-apr", row);
        const min = $(".debt-min", row);

        const sync = () => {
          d.name = name.value.trim() || "Debt";
          d.balance = Number(bal.value || 0);
          d.apr = Number(apr.value || 0);
          d.min = Number(min.value || 0);
        };

        [name, bal, apr, min].forEach(inp => inp.addEventListener("input", sync));

        const rm = row.querySelector("[data-debt-remove]");
        rm.addEventListener("click", () => {
          state.tools.debt.debts = state.tools.debt.debts.filter(x => x.id !== id);
          renderDebtRows();
          results.innerHTML = "";
          $("#debtSchedule", panel).innerHTML = "";
          saveState();
          toast("Removed", "Debt removed.");
        });
      });
    };

    const addDebt = () => {
      state.tools.debt.debts = state.tools.debt.debts || [];
      state.tools.debt.debts.push({
        id: uid(),
        name: "Debt",
        balance: 0,
        apr: 0,
        min: 0
      });
      renderDebtRows();
    };

    $("#debtAdd", panel).addEventListener("click", addDebt);

    $("#debtSave", panel).addEventListener("click", () => {
      state.tools.debt.method = $("#debtMethod", panel).value;
      state.tools.debt.extra = Number($("#debtExtra", panel).value || 0);
      saveState();
      toast("Saved", "Debt tool inputs saved locally.");
    });

    $("#debtCalc", panel).addEventListener("click", () => {
      state.tools.debt.method = $("#debtMethod", panel).value;
      state.tools.debt.extra = Number($("#debtExtra", panel).value || 0);
      saveState();

      const sim = simulateDebtPayoff(state.tools.debt.debts || [], state.tools.debt.method, state.tools.debt.extra);
      renderDebtResults(panel, sim);
    });

    renderDebtRows();
  };

  const simulateDebtPayoff = (debtsRaw, method, extraPayment) => {
    // Defensive copy
    const debts = debtsRaw
      .map(d => ({
        id: d.id,
        name: d.name || "Debt",
        balance: Math.max(0, Number(d.balance || 0)),
        apr: Math.max(0, Number(d.apr || 0)),
        min: Math.max(0, Number(d.min || 0))
      }))
      .filter(d => d.balance > 0 && d.min > 0);

    if (!debts.length) {
      return { ok: false, reason: "Add at least one debt with a balance and minimum payment.", months: 0, totalInterest: 0, schedule: [] };
    }

    const monthlyRate = (apr) => (apr / 100) / 12;

    let month = 0;
    let totalInterest = 0;
    const schedule = [];

    // Avoid infinite loops
    const MAX_MONTHS = 600;

    while (month < MAX_MONTHS) {
      month += 1;

      // Decide priority order for this month
      const openDebts = debts.filter(d => d.balance > 0.01);
      if (!openDebts.length) break;

      let order = [...openDebts];
      if (method === "snowball") order.sort((a, b) => a.balance - b.balance);
      else order.sort((a, b) => b.apr - a.apr); // avalanche default

      // Apply interest
      openDebts.forEach(d => {
        const interest = d.balance * monthlyRate(d.apr);
        d.balance += interest;
        totalInterest += interest;
      });

      // Base payment = sum of minimums
      let extra = Math.max(0, Number(extraPayment || 0));
      let monthPaid = 0;

      // First: pay minimums
      order.forEach(d => {
        const pay = Math.min(d.balance, d.min);
        d.balance -= pay;
        monthPaid += pay;
      });

      // Second: roll extra to the priority target(s)
      let idx = 0;
      while (extra > 0.01 && idx < order.length) {
        const d = order[idx];
        if (d.balance <= 0.01) { idx += 1; continue; }
        const pay = Math.min(d.balance, extra);
        d.balance -= pay;
        extra -= pay;
        monthPaid += pay;
      }

      const remaining = debts.reduce((sum, d) => sum + d.balance, 0);
      schedule.push({
        month,
        paid: monthPaid,
        interest: null, // shown as total interest summary
        remaining
      });

      if (remaining <= 0.01) break;

      // If balances aren't decreasing (bad inputs), exit
      if (month > 6) {
        const recent = schedule.slice(-6);
        const decreasing = recent.every((x, i) => i === 0 ? true : x.remaining < recent[i - 1].remaining + 0.01);
        if (!decreasing) {
          return { ok: false, reason: "Inputs may be too low to reduce balances (try higher minimums or extra payment).", months: month, totalInterest, schedule };
        }
      }
    }

    const ok = debts.reduce((sum, d) => sum + d.balance, 0) <= 0.01;
    return {
      ok,
      reason: ok ? "" : "Simulation reached limit. Increase payments or check inputs.",
      months: month,
      totalInterest,
      schedule
    };
  };

  const renderDebtResults = (panel, sim) => {
    const out = $("#debtResults", panel);
    const schedHost = $("#debtSchedule", panel);
    if (!out || !schedHost) return;

    if (!sim.ok) {
      out.innerHTML = `
        <div class="callout warn">
          <strong>Could not complete:</strong>
          <div class="muted" style="margin-top: 6px;">${escapeHtml(sim.reason || "Check inputs.")}</div>
        </div>
      `;
    } else {
      out.innerHTML = `
        <div class="kpi-row">
          <span class="kpi-k">Payoff time</span>
          <span class="kpi-v">${sim.months} months</span>
        </div>
        <div class="kpi-row">
          <span class="kpi-k">Estimated total interest</span>
          <span class="kpi-v">${fmtMoney(sim.totalInterest)}</span>
        </div>
      `;
    }

    const rows = sim.schedule || [];
    const preview = rows.slice(0, 18);

    if (!rows.length) {
      schedHost.innerHTML = "";
      return;
    }

    schedHost.innerHTML = `
      <div class="card inset" style="padding: 14px;">
        <h4 class="h4" style="margin: 0 0 8px 0;">Schedule preview</h4>
        <p class="muted" style="margin: 0 0 12px 0;">Showing first ${preview.length} months. Export for full data.</p>

        <div class="mini-list">
          ${preview.map(r => `
            <div class="mini-item">
              <div class="mini-left">
                <div class="mini-title">Month ${r.month}</div>
                <div class="mini-sub">Paid: ${fmtMoney(r.paid)} • Remaining: ${fmtMoney(r.remaining)}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="row" style="margin-top: 12px;">
          <button class="btn small" type="button" id="debtExportCsv">Export CSV</button>
        </div>
      </div>
    `;

    $("#debtExportCsv", panel).addEventListener("click", () => {
      const csv = ["month,paid,remaining"].concat(rows.map(r =>
        `${r.month},${Math.round(r.paid)},${Math.round(r.remaining)}`
      )).join("\n");

      downloadTextFile(`debt_schedule_${nowISO()}.csv`, csv, "text/csv");
      toast("Exported", "Downloaded debt schedule CSV.");
    });

    toast("Simulation complete", sim.ok ? `Estimated payoff: ${sim.months} months.` : "Check your inputs.");
  };

  const renderToolGrowth = (panel) => {
    const g = state.tools.growth || { principal: 0, monthly: 0, rate: 10, years: 5 };

    panel.innerHTML = `
      <div class="tool-grid">
        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Compound growth</h3>
          <p class="muted" style="margin: 0 0 12px 0;">
            Explore how steady contributions can grow over time. This is a learning tool — returns are never guaranteed.
          </p>

          <form class="form" id="growthForm">
            <div class="form-row">
              <label class="field">
                <span class="label">Starting amount</span>
                <input name="principal" type="number" inputmode="decimal" min="0" step="1" value="${escapeHtml(g.principal ?? 0)}" />
              </label>
              <label class="field">
                <span class="label">Monthly contribution</span>
                <input name="monthly" type="number" inputmode="decimal" min="0" step="1" value="${escapeHtml(g.monthly ?? 0)}" />
              </label>
            </div>

            <div class="form-row">
              <label class="field">
                <span class="label">Estimated annual return (%)</span>
                <input name="rate" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(g.rate ?? 10)}" />
              </label>
              <label class="field">
                <span class="label">Years</span>
                <input name="years" type="number" inputmode="decimal" min="1" step="1" value="${escapeHtml(g.years ?? 5)}" />
              </label>
            </div>

            <div class="row">
              <button class="btn small primary" type="submit">Calculate</button>
              <button class="btn small" type="button" id="growthSave">Save</button>
            </div>
          </form>
        </div>

        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Chart</h3>
          <div class="card inset" style="padding: 14px;">
            <canvas id="growthCanvas" width="760" height="380" style="width:100%; height:auto; border-radius: 14px; border: 1px solid var(--border);"></canvas>
            <div class="hr"></div>
            <div class="kpi" id="growthResults"></div>
          </div>
        </div>
      </div>
    `;

    $("#growthForm", panel).addEventListener("submit", (e) => {
      e.preventDefault();
      calcGrowth(panel);
    });

    $("#growthSave", panel).addEventListener("click", () => {
      const f = $("#growthForm", panel);
      state.tools.growth = {
        principal: Number(f.principal.value || 0),
        monthly: Number(f.monthly.value || 0),
        rate: Number(f.rate.value || 0),
        years: Number(f.years.value || 1)
      };
      saveState();
      toast("Saved", "Growth tool inputs saved locally.");
    });

    calcGrowth(panel, true);
  };

  const calcGrowth = (panel, quiet = false) => {
    const f = $("#growthForm", panel);
    const canvas = $("#growthCanvas", panel);
    const out = $("#growthResults", panel);
    if (!f || !canvas || !out) return;

    const principal = Number(f.principal.value || 0);
    const monthly = Number(f.monthly.value || 0);
    const rate = Number(f.rate.value || 0);
    const years = clamp(Number(f.years.value || 1), 1, 60);

    const months = years * 12;
    const r = rate / 100 / 12;

    let bal = principal;
    const series = [];
    for (let m = 0; m <= months; m++) {
      if (m > 0) {
        bal = bal * (1 + r) + monthly;
      }
      series.push({ m, bal });
    }

    const totalContrib = principal + monthly * months;
    const gain = bal - totalContrib;

    out.innerHTML = `
      <div class="kpi-row">
        <span class="kpi-k">Ending balance</span>
        <span class="kpi-v">${fmtMoney(bal)}</span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">Total contributed</span>
        <span class="kpi-v">${fmtMoney(totalContrib)}</span>
      </div>
      <div class="kpi-row">
        <span class="kpi-k">Estimated growth</span>
        <span class="kpi-v">${fmtMoney(gain)}</span>
      </div>
    `;

    drawLineChart(canvas, series.map(p => p.bal), {
      title: `Balance over ${years} year${years === 1 ? "" : "s"}`,
      xLabel: "Months",
      yLabel: "Balance"
    });

    if (!quiet) toast("Updated", "Compound growth recalculated.");
  };

  const drawLineChart = (canvas, values, labels = {}) => {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const pad = 46;
    const left = pad, right = W - pad, top = pad, bottom = H - pad;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--panel2").trim() || "#0e1526";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = top + ((bottom - top) * i / gridLines);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const span = Math.max(1, maxV - minV);

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    // Line
    ctx.strokeStyle = "rgba(124,92,255,0.85)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    values.forEach((v, i) => {
      const x = left + (i / (values.length - 1)) * (right - left);
      const y = bottom - ((v - minV) / span) * (bottom - top);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Title and labels
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(labels.title || "Chart", left, 26);

    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(labels.xLabel || "", (left + right) / 2 - 24, H - 14);
    ctx.save();
    ctx.translate(14, (top + bottom) / 2 + 24);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels.yLabel || "", 0, 0);
    ctx.restore();
  };

  const renderToolScam = (panel) => {
    const questions = [
      { id: "guaranteed", text: "They promise guaranteed high returns with zero risk." },
      { id: "urgent", text: "They pressure you to act now or you’ll miss out." },
      { id: "upfront", text: "They ask for upfront payment to “unlock” profit, VIP access, or a “fee”." },
      { id: "recruit", text: "You must recruit others to earn (pyramid‑style)." },
      { id: "unknown", text: "You can’t verify the company/person through official sources." },
      { id: "private", text: "They ask to move the conversation to private DMs, Telegram, etc." },
      { id: "secrecy", text: "They tell you to keep it secret from friends/family." },
      { id: "credentials", text: "They use fake certificates, screenshots, or ‘authority’ claims." }
    ];

    panel.innerHTML = `
      <div class="tool-grid">
        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Scam shield</h3>
          <p class="muted" style="margin: 0 0 12px 0;">
            Tick what’s true about an offer. More red flags → higher risk.
          </p>

          <div class="checklist" id="scamChecklist"></div>

          <div class="row" style="margin-top: 12px;">
            <button class="btn small primary" type="button" id="scamScoreBtn">Score risk</button>
            <button class="btn small ghost" type="button" id="scamResetBtn">Reset</button>
          </div>

          <div class="micro-note">
            If it feels urgent, it’s probably designed to bypass your thinking.
          </div>
        </div>

        <div>
          <h3 class="h3" style="margin: 0 0 6px 0;">Risk score</h3>
          <div id="scamResults" class="kpi"></div>
        </div>
      </div>
    `;

    const host = $("#scamChecklist", panel);
    const answers = state.tools.scam.answers || {};

    host.innerHTML = questions.map(q => `
      <label class="check-item">
        <input type="checkbox" data-scam="${escapeHtml(q.id)}" ${answers[q.id] ? "checked" : ""} />
        <span class="check-text">
          <span class="check-title">${escapeHtml(q.text)}</span>
          <span class="check-desc">Red flag</span>
        </span>
      </label>
    `).join("");

    host.addEventListener("change", (e) => {
      const cb = e.target.closest("input[data-scam]");
      if (!cb) return;
      state.tools.scam.answers = state.tools.scam.answers || {};
      state.tools.scam.answers[cb.dataset.scam] = cb.checked;
      saveState();
    });

    $("#scamScoreBtn", panel).addEventListener("click", () => {
      const picked = $$("input[data-scam]", panel).filter(x => x.checked).length;
      const total = questions.length;

      const score = Math.round((picked / total) * 100);
      let level = "Low";
      let cls = "good";
      let advice = "Still verify. Use official sources and don’t share personal details.";

      if (score >= 70) { level = "High"; cls = "warn"; advice = "Don’t send money. Pause and verify using official sources. Talk to someone you trust."; }
      else if (score >= 40) { level = "Medium"; cls = "warn"; advice = "Proceed with extreme caution. Verify identity, licences, and methods independently."; }

      $("#scamResults", panel).innerHTML = `
        <div class="kpi-row">
          <span class="kpi-k">Flags ticked</span>
          <span class="kpi-v">${picked}/${total}</span>
        </div>
        <div class="kpi-row">
          <span class="kpi-k">Risk</span>
          <span class="kpi-v">${level} (${score}%)</span>
        </div>
        <div class="callout ${cls}">
          <strong>Recommendation:</strong>
          <div class="muted" style="margin-top: 6px;">${escapeHtml(advice)}</div>
        </div>
      `;

      toast("Scam shield", `${level} risk (${picked}/${total} flags).`);
    });

    $("#scamResetBtn", panel).addEventListener("click", () => {
      $$("input[data-scam]", panel).forEach(cb => cb.checked = false);
      state.tools.scam.answers = {};
      saveState();
      $("#scamResults", panel).innerHTML = "";
      toast("Reset", "Scam checklist cleared.");
    });
  };

  const numOrNull = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  /* =========================
     Cards dialog + quote download
  ========================= */

  let currentCardIndex = 0;
  const cardIndexById = (id) => CARDS.findIndex(c => c.id === id);

  const openCard = (cardId) => {
    const idx = cardIndexById(cardId);
    if (idx < 0) return;
    currentCardIndex = idx;

    const card = CARDS[idx];
    const dlg = $("#cardDialog");
    const badge = $("#cardBadge");
    const title = $("#cardTitle");
    const quote = $("#cardQuote");
    const body = $("#cardBody");
    const saveBtn = $("#cardSave");

    const tone = card.badge.toLowerCase().includes("positive") ? "good" : "warn";

    badge.textContent = `${card.suit} ${card.roman} • ${card.badge}`;
    badge.className = `pill chip ${tone}`;
    title.textContent = `${card.title}`;
    quote.textContent = card.quote;

    const saved = !!(state.saved.cards || {})[card.id];
    saveBtn.textContent = saved ? "Saved ✓" : "Save";
    saveBtn.className = saved ? "btn small" : "btn small";

    body.innerHTML = `
      <div class="micro-bar" style="margin-top: 0;">
        <span class="micro-ic" aria-hidden="true">💡</span>
        Tip: Double‑tap / double‑click the title to jump to the next section.
      </div>

      <h4 class="h4" data-card-section>What this card is</h4>
      <p class="muted">${escapeHtml(card.intro)}</p>

      <h4 class="h4" data-card-section>What this card means</h4>
      <p class="muted">${escapeHtml(card.meaning)}</p>

      <h4 class="h4" data-card-section>Warning signs</h4>
      <ul class="tick-list">${card.warningSigns.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>

      <h4 class="h4" data-card-section>What it can lead to / what it builds</h4>
      <ul class="tick-list">${card.leadsTo.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>

      <h4 class="h4" data-card-section>Practical advice</h4>
      <ul class="tick-list">${card.advice.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>

      <h4 class="h4" data-card-section>One action for today</h4>
      <div class="callout good">
        <strong>Do this:</strong>
        <div class="muted" style="margin-top: 6px;">${escapeHtml(card.actionToday)}</div>
      </div>

      <h4 class="h4" data-card-section>Real scenario</h4>
      <p class="muted">${escapeHtml(card.scenario)}</p>

      <h4 class="h4" data-card-section>Self‑check</h4>
      <ul class="tick-list">${card.selfCheck.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>

      <div class="hr"></div>

      <div class="callout ${tone}">
        <strong>Take this message with you:</strong>
        <div class="muted" style="margin-top: 6px; font-weight: 800;">${escapeHtml(card.takeaway)}</div>
      </div>

      <div class="row">
        <button class="btn small" type="button" data-open-tool="${escapeHtml(recommendedToolForCard(card.id))}">
          <span class="btn-ic" aria-hidden="true">🧰</span>
          Recommended tool
        </button>
        <button class="btn small ghost" type="button" data-open-related-lesson="${escapeHtml(relatedLessonForCard(card.id) || "")}">
          <span class="btn-ic" aria-hidden="true">📖</span>
          Related lesson
        </button>
      </div>
    `;

    // Hide related lesson button if none
    const rl = body.querySelector("[data-open-related-lesson]");
    const relId = relatedLessonForCard(card.id);
    if (!relId) rl.style.display = "none";

    // Wire tool open inside dialog
    const toolBtn = body.querySelector("[data-open-tool]");
    toolBtn.addEventListener("click", () => {
      const tool = toolBtn.getAttribute("data-open-tool");
      location.hash = "#tools";
      renderToolPanel(tool);
      toast("Opened tool", toolName(tool));
    });

    // Wire lesson open inside dialog
    if (relId) {
      rl.addEventListener("click", () => openLesson(relId));
    }

    // Double tap/click title to scroll
    attachDoubleTapScroller(title, body);

    openDialog(dlg);
  };

  const attachDoubleTapScroller = (target, scrollEl) => {
    let last = 0;
    const go = () => scrollToNextCardSection(scrollEl);

    const onPointerUp = () => {
      const t = Date.now();
      if (t - last < 320) go();
      last = t;
    };

    // reset by cloning listener each time
    target.onpointerup = null;
    target.ondblclick = null;

    target.addEventListener("pointerup", onPointerUp, { passive: true });
    target.addEventListener("dblclick", go);
  };

  const scrollToNextCardSection = (scrollEl) => {
    const heads = $$("[data-card-section]", scrollEl);
    if (!heads.length) return;

    const currentTop = scrollEl.scrollTop;
    const positions = heads.map(h => h.offsetTop).sort((a, b) => a - b);

    const next = positions.find(p => p > currentTop + 10) ?? positions[0];
    scrollEl.scrollTo({ top: Math.max(0, next - 10), behavior: "smooth" });
  };

  const recommendedToolForCard = (cardId) => {
    if (cardId === "borrower") return "debt";
    if (cardId === "scam") return "scam";
    if (cardId === "gambler") return "scam";
    if (cardId === "spender") return "budget";
    if (cardId === "saver") return "emergency";
    if (cardId === "planner") return "budget";
    return "budget";
  };

  const relatedLessonForCard = (cardId) => {
    const l = LESSONS.find(x => x.relatedCard === cardId);
    return l ? l.id : null;
  };

  const toggleSaveCard = (cardId) => {
    state.saved.cards = state.saved.cards || {};
    const isSaved = !!state.saved.cards[cardId];
    if (isSaved) delete state.saved.cards[cardId];
    else state.saved.cards[cardId] = true;
    saveState();
    renderSavedCards();

    const btn = $("#cardSave");
    if (btn && CARDS[currentCardIndex]?.id === cardId) {
      btn.textContent = isSaved ? "Save" : "Saved ✓";
    }
    toast(isSaved ? "Removed" : "Saved", `${CARDS.find(c => c.id === cardId)?.title || "Card"} ${isSaved ? "removed" : "saved"}.`);
    updateProgressUI();
  };

  const drawRandomCard = () => {
    const idx = Math.floor(Math.random() * CARDS.length);
    openCard(CARDS[idx].id);
  };

  const dailyCardPick = () => {
    const today = nowISO();
    if (state.daily.lastDailyCardDate === today && state.daily.dailyCardId) {
      openCard(state.daily.dailyCardId);
      return;
    }
    const idx = Math.floor(Math.random() * CARDS.length);
    state.daily.lastDailyCardDate = today;
    state.daily.dailyCardId = CARDS[idx].id;
    saveState();
    openCard(CARDS[idx].id);
  };

  const downloadQuoteCardPng = (cardId) => {
    const card = CARDS.find(c => c.id === cardId);
    if (!card) return;

    const W = 1080;
    const H = 1920;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "rgba(20, 28, 52, 1)");
    grad.addColorStop(1, "rgba(10, 12, 24, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Accent glow
    ctx.fillStyle = "rgba(124, 92, 255, 0.26)";
    ctx.beginPath();
    ctx.ellipse(W * 0.25, H * 0.22, 420, 320, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(33, 212, 253, 0.16)";
    ctx.beginPath();
    ctx.ellipse(W * 0.75, H * 0.30, 440, 320, 0, 0, Math.PI * 2);
    ctx.fill();

    // Card frame
    const margin = 90;
    const r = 38;
    roundRect(ctx, margin, margin, W - margin * 2, H - margin * 2, r);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Title
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "800 46px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("MONEY TALKS", margin + 46, margin + 84);

    // Suit mark
    ctx.font = "900 110px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(card.suit, W - margin - 140, margin + 112);

    // Card name + roman
    ctx.font = "800 52px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(`${card.roman}. ${card.title}`, margin + 46, margin + 170);

    // Quote
    ctx.font = "800 64px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const quote = card.takeaway;
    wrapText(ctx, quote, margin + 46, margin + 310, W - margin * 2 - 92, 78);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "600 32px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    wrapText(ctx, "Knowledge is the strongest hand you can play.", margin + 46, H - margin - 160, W - margin * 2 - 92, 42);

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font = "600 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("money talks • financial literacy guide", margin + 46, H - margin - 92);

    const url = canvas.toDataURL("image/png");
    const name = `moneytalks_${card.id}_${nowISO()}.png`;
    downloadDataUrl(name, url);
  };

  const roundRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = String(text).split(/\s+/g);
    let line = "";
    let yy = y;

    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      const w = ctx.measureText(test).width;
      if (w > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = words[i];
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  };

  const downloadDataUrl = (filename, dataUrl) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadTextFile = (filename, text, mime = "text/plain") => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  /* =========================
     Plan
  ========================= */

  const buildDefaultPlan = () => ([
    { id: "d1", title: "Day 1: Money snapshot", desc: "Write income + essential costs + debts. No judgement — just reality." },
    { id: "d2", title: "Day 2: Track spending", desc: "Check last 7 days. Mark needs vs wants. Notice triggers." },
    { id: "d3", title: "Day 3: Create a simple budget", desc: "Use the Budget tool and set one limit you can actually follow." },
    { id: "d4", title: "Day 4: Automate a tiny saving", desc: "Set up a weekly transfer (1,000₸–2,000₸ if needed). Habit first." },
    { id: "d5", title: "Day 5: Debt or safety step", desc: "If you have debt: run the payoff tool. If not: do the scam shield checklist." },
    { id: "d6", title: "Day 6: Cancel one leak", desc: "Cancel an unused subscription or reduce one repeating expense." },
    { id: "d7", title: "Day 7: Review & next month plan", desc: "What worked? What didn’t? Adjust one thing and keep going." }
  ]);

  let planModel = buildDefaultPlan();

  const renderPlan = () => {
    const host = $("#planList");
    const chip = $("#planProgressChip");
    if (!host || !chip) return;

    const done = state.completed.planDays || {};
    const doneCount = Object.keys(done).length;

    chip.textContent = `${doneCount}/7`;
    host.innerHTML = "";

    planModel.forEach(item => {
      const row = document.createElement("div");
      row.className = "plan-item";
      row.innerHTML = `
        <input class="plan-check" type="checkbox" data-plan="${escapeHtml(item.id)}" ${done[item.id] ? "checked" : ""} />
        <div>
          <p class="plan-title"></p>
          <p class="plan-desc"></p>
        </div>
      `;
      $(".plan-title", row).textContent = item.title;
      $(".plan-desc", row).textContent = item.desc;
      host.appendChild(row);
    });

    host.addEventListener("change", (e) => {
      const cb = e.target.closest("input[data-plan]");
      if (!cb) return;
      const id = cb.dataset.plan;
      state.completed.planDays = state.completed.planDays || {};
      if (cb.checked) state.completed.planDays[id] = true;
      else delete state.completed.planDays[id];
      saveState();
      renderPlan();
      updateProgressUI();
    }, { once: true });
  };

  const rebuildPlan = (focus, minutes) => {
    // Adjust descriptions slightly based on focus/minutes
    const m = clamp(minutes, 5, 45);
    const focusHints = {
      balanced: "Keep it simple and consistent.",
      save: "Prioritise saving momentum.",
      debt: "Prioritise reducing debt stress.",
      safety: "Prioritise protection and verification habits.",
      habits: "Prioritise routines that stick.",
      risk: "Prioritise reducing risky bets and chasing losses."
    };

    const hint = focusHints[focus] || focusHints.balanced;

    const base = buildDefaultPlan();
    planModel = base.map((d, i) => {
      let desc = d.desc;

      if (focus === "save" && (i === 3 || i === 6)) desc = desc + " Add a savings target and celebrate a milestone.";
      if (focus === "debt" && (i === 4 || i === 6)) desc = desc + " Pick one repayment method and stick to it for a month.";
      if (focus === "safety" && (i === 4 || i === 0)) desc = desc + " Add 2FA and learn common scam patterns.";
      if (focus === "habits" && (i === 1 || i === 6)) desc = desc + " Track triggers and decide one replacement habit.";
      if (focus === "risk" && (i === 4 || i === 6)) desc = desc + " Reduce access (apps/sites) and talk to someone you trust.";

      desc = `${desc} (${m} min) • ${hint}`;
      return { ...d, desc };
    });

    saveState();
    renderPlan();
    toast("Plan rebuilt", `Focus: ${focus}.`);
  };

  /* =========================
     Import/export
  ========================= */

  const exportAllData = () => {
    const payload = JSON.stringify(state, null, 2);
    downloadTextFile(`moneytalks_backup_${nowISO()}.json`, payload, "application/json");
  };

  const importAllData = async (file) => {
    const text = await file.text();
    const obj = safeParse(text, null);
    if (!obj || typeof obj !== "object") {
      toast("Import failed", "That file doesn’t look like valid JSON.");
      return;
    }

    // naive validation
    if (!("version" in obj) || !("completed" in obj) || !("tools" in obj)) {
      toast("Import failed", "File isn’t in the expected format.");
      return;
    }

    // Overwrite (keeping current defaults if missing)
    const fresh = defaultState();
    Object.assign(state, fresh, obj);

    saveState();
    toast("Imported", "Your data has been restored.");
    reloadUI();
  };

  /* =========================
     Wiring
  ========================= */

  const reloadUI = () => {
    setTheme(state.theme);
    applyTextScale(state.textScale);

    renderQuickWin();
    renderLessons();
    renderCardsGrid();
    renderSavedCards();
    renderSLC();
    renderGuideIdeas();
    renderResources();
    renderPlan();
    updateProgressUI();

    // Tools default
    renderToolPanel("budget");

    // Check-in restore
    if (state.profile) renderCheckinResult(state.profile);
  };

  const initNav = () => {
    const toggle = $("#navToggle");
    const links = $("#navLinks");
    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    links.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-link]");
      if (!a) return;
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });

    window.addEventListener("hashchange", () => {
      setActiveNav();
    });
    setActiveNav();
  };

  const initThemeControls = () => {
    setTheme(state.theme);
    applyTextScale(state.textScale);

    $("#themeToggle")?.addEventListener("click", () => {
      const next = state.theme === "system" ? "dark" : state.theme === "dark" ? "light" : "system";
      setTheme(next);
      toast("Theme", `Set to ${next}.`);
    });
  };

  const initSettingsDialog = () => {
    const dlg = $("#settingsDialog");
    const openBtn = $("#openSettings");
    if (!dlg || !openBtn) return;

    openBtn.addEventListener("click", () => openDialog(dlg));

    // Theme segmented buttons
    $$(".seg-btn", dlg).forEach(btn => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.theme;
        setTheme(t);

        $$(".seg-btn", dlg).forEach(b => b.classList.toggle("active", b === btn));
      });
      btn.classList.toggle("active", btn.dataset.theme === state.theme);
    });

    // Text scale
    const scale = $("#textScale", dlg);
    const scaleVal = $("#textScaleVal", dlg);
    if (scale && scaleVal) {
      scale.value = String(state.textScale);
      scaleVal.textContent = `${state.textScale}%`;
      scale.addEventListener("input", () => {
        const v = Number(scale.value || 100);
        applyTextScale(v);
        scaleVal.textContent = `${state.textScale}%`;
      });
    }

    // Data buttons
    $("#settingsExport", dlg)?.addEventListener("click", exportAllData);
    $("#settingsImport", dlg)?.addEventListener("click", () => $("#importFile")?.click());
    $("#settingsClear", dlg)?.addEventListener("click", () => {
      if (!confirm("Clear all local data (progress, saved cards, tool inputs)?")) return;
      localStorage.removeItem(STORE_KEY);
      Object.assign(state, defaultState());
      saveState();
      toast("Cleared", "Local data cleared.");
      reloadUI();
    });
  };

  const initLearn = () => {
    const learnSearch = $("#learnSearch");
    learnSearch?.addEventListener("input", renderLessons);

    $("#markAllLessonsRead")?.addEventListener("click", () => {
      LESSONS.forEach(l => state.completed.lessons[l.id] = true);
      saveState();
      renderLessons();
      updateProgressUI();
      toast("Demo", "All lessons marked complete.");
    });

    $("#openQuiz")?.addEventListener("click", openQuiz);

    $("#quizReset")?.addEventListener("click", () => {
      const body = $("#quizBody");
      if (!body) return;
      body.innerHTML = renderQuizUI(QUIZ);
      wireQuiz(body, QUIZ);
      toast("Quiz", "Restarted.");
    });
  };

  const initLessonDialog = () => {
    const mark = $("#lessonMarkDone");
    const body = $("#lessonBody");
    if (!mark || !body) return;

    mark.addEventListener("click", () => {
      const id = mark.dataset.lesson;
      if (!id) return;
      toggleLessonDone(id);
      const done = !!state.completed.lessons[id];
      mark.textContent = done ? "Mark lesson not complete" : "Mark lesson complete";
      toast(done ? "Completed" : "Unmarked", LESSONS.find(l => l.id === id)?.title || "Lesson");
      updateProgressUI();
    });

    body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open-related-card]");
      if (!btn) return;
      const cardId = btn.getAttribute("data-open-related-card");
      if (!cardId) return;
      openCard(cardId);
    });
  };

  const initCheckin = () => {
    const form = $("#checkinForm");
    const saveBtn = $("#savePath");
    const shareBtn = $("#sharePath");

    $("#prefillDemo")?.addEventListener("click", () => {
      if (!form) return;
      form.age.value = "19-22";
      form.currency.value = "KZT";
      form.struggle.value = "spender";
      form.goal.value = "budget";
      form.income.value = "250000";
      toast("Prefilled", "Example data added.");
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);

      const profile = {
        age: String(data.get("age") || ""),
        currency: String(data.get("currency") || "KZT"),
        struggleId: String(data.get("struggle") || "planner"),
        goalId: String(data.get("goal") || "budget"),
        income: Number(data.get("income") || 0) || null
      };

      state.currency = profile.currency;
      state.profile = profile;
      saveState();

      renderCheckinResult(profile);
      updateProgressUI();
      toast("Path created", "Your personalised steps are ready.");
    });

    saveBtn?.addEventListener("click", () => {
      if (!state.profile) return;
      toast("Saved", "Your path is saved (locally).");
    });

    shareBtn?.addEventListener("click", async () => {
      if (!state.profile) return;
      const persona = PERSONAS[state.profile.struggleId]?.label || "The Planner";
      const lines = [
        "Money Talks — My Path",
        `Persona: ${persona}`,
        `Goal: ${goalLabel(state.profile.goalId)}`,
        `Currency: ${state.profile.currency}`,
        ...(state.profile.income ? [`Income: ${fmtMoney(state.profile.income)}`] : []),
        "",
        "Recommended lessons:",
        ...(PERSONAS[state.profile.struggleId]?.focus || []).map(id => `• ${LESSONS.find(l => l.id === id)?.title || id}`)
      ].join("\n");

      try {
        await navigator.clipboard.writeText(lines);
        toast("Copied", "Summary copied to clipboard.");
      } catch {
        // Fallback
        downloadTextFile(`moneytalks_path_${nowISO()}.txt`, lines, "text/plain");
        toast("Downloaded", "Clipboard blocked — downloaded a text file instead.");
      }
    });
  };

  const initTools = () => {
    $$(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const tool = tab.dataset.tool;
        renderToolPanel(tool);
      });
    });
    renderToolPanel("budget");
  };

  const initCards = () => {
    $("#drawCard")?.addEventListener("click", drawRandomCard);
    $("#dailyCard")?.addEventListener("click", dailyCardPick);

    $("#viewAllCards")?.addEventListener("click", () => {
      const first = CARDS[0]?.id;
      if (first) openCard(first);
    });

    $("#cardsGrid")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-card]");
      if (!btn) return;
      openCard(btn.dataset.card);
    });

    $("#savedList")?.addEventListener("click", (e) => {
      const open = e.target.closest("[data-open-card]");
      if (open) return openCard(open.dataset.openCard);

      const del = e.target.closest("[data-unsave-card]");
      if (del) return toggleSaveCard(del.dataset.unsaveCard);
    });

    $("#cardPrev")?.addEventListener("click", () => {
      currentCardIndex = (currentCardIndex - 1 + CARDS.length) % CARDS.length;
      openCard(CARDS[currentCardIndex].id);
    });

    $("#cardNext")?.addEventListener("click", () => {
      currentCardIndex = (currentCardIndex + 1) % CARDS.length;
      openCard(CARDS[currentCardIndex].id);
    });

    $("#cardSave")?.addEventListener("click", () => {
      const id = CARDS[currentCardIndex]?.id;
      if (id) toggleSaveCard(id);
    });

    $("#downloadQuote")?.addEventListener("click", () => {
      const id = CARDS[currentCardIndex]?.id;
      if (!id) return;
      downloadQuoteCardPng(id);
      toast("Downloaded", "Quote card saved as PNG.");
    });

    renderCardsGrid();
    renderSavedCards();
  };

  const initPlan = () => {
    renderPlan();

    $("#planMarkAll")?.addEventListener("click", () => {
      state.completed.planDays = state.completed.planDays || {};
      planModel.forEach(p => state.completed.planDays[p.id] = true);
      saveState();
      renderPlan();
      updateProgressUI();
      toast("Done", "All plan days marked complete.");
    });

    $("#planReset")?.addEventListener("click", () => {
      if (!confirm("Reset your 7‑day plan progress?")) return;
      state.completed.planDays = {};
      saveState();
      renderPlan();
      updateProgressUI();
      toast("Reset", "Plan progress cleared.");
    });

    const form = $("#planCustomForm");
    const range = form?.minutes;
    const val = $("#planMinutesVal");

    if (range && val) {
      const update = () => val.textContent = `${range.value} min/day`;
      range.addEventListener("input", update);
      update();
    }

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const focus = form.focus.value;
      const minutes = Number(form.minutes.value || 10);
      rebuildPlan(focus, minutes);
    });
  };

  const initJourney = () => {
    renderSLC();
    renderGuideIdeas();

    $("#guideIdeas")?.addEventListener("change", (e) => {
      const cb = e.target.closest("input[data-idea]");
      if (!cb) return;
      const id = cb.dataset.idea;
      state.ideas = state.ideas || {};
      if (cb.checked) state.ideas[id] = true;
      else delete state.ideas[id];
      saveState();
    });

    $("#ideasCopy")?.addEventListener("click", async () => {
      const picked = GUIDE_IDEAS.filter(x => state.ideas && state.ideas[x.id]);
      const text = picked.length
        ? ["Money Talks — Guide Roadmap", "", ...picked.map(x => `• ${x.title} — ${x.desc}`)].join("\n")
        : "No roadmap items selected yet.";

      try {
        await navigator.clipboard.writeText(text);
        toast("Copied", "Roadmap copied to clipboard.");
      } catch {
        downloadTextFile(`moneytalks_roadmap_${nowISO()}.txt`, text);
        toast("Downloaded", "Clipboard blocked — downloaded a text file instead.");
      }
    });

    $("#ideasReset")?.addEventListener("click", () => {
      if (!confirm("Reset roadmap checklist?")) return;
      state.ideas = {};
      saveState();
      renderGuideIdeas();
      toast("Reset", "Roadmap cleared.");
    });
  };

  const initResources = () => {
    renderResources();
  };

  const initChangelog = () => {
    const dlg = $("#changelogDialog");
    $("#openChangelog")?.addEventListener("click", () => openDialog(dlg));
  };

  const initImportExportButtons = () => {
    $("#exportData")?.addEventListener("click", exportAllData);
    $("#settingsExport")?.addEventListener("click", exportAllData);

    const pickImport = () => $("#importFile")?.click();
    $("#importData")?.addEventListener("click", pickImport);
    $("#settingsImport")?.addEventListener("click", pickImport);

    $("#importFile")?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      await importAllData(file);
      e.target.value = "";
    });
  };

  const initResetProgress = () => {
    $("#resetProgress")?.addEventListener("click", () => {
      if (!confirm("Reset progress (lessons, plan, quiz, saved cards)? Tool inputs and settings will remain.")) return;
      state.completed = defaultState().completed;
      state.saved = defaultState().saved;
      state.profile = null;
      state.ideas = {};
      saveState();
      reloadUI();
      toast("Reset", "Progress reset.");
    });
  };

  const initQuickWinButtons = () => {
    $("#newQuickWin")?.addEventListener("click", () => {
      renderQuickWin();
      toast("New tip", "Try this quick win today.");
    });

    $("#markQuickWinDone")?.addEventListener("click", () => {
      const host = $("#quickWin");
      if (!host) return;
      const id = host.dataset.qwId;
      if (!id) return;
      state.completed.quickWins = state.completed.quickWins || {};
      state.completed.quickWins[id] = true;
      saveState();
      renderQuickWin();
      updateProgressUI();
      toast("Done", "Quick win marked as done.");
    });
  };

  const initGlobalClicks = () => {
    document.body.addEventListener("click", (e) => {
      // Open lesson buttons across the site
      const openLessonBtn = e.target.closest("[data-open-lesson]");
      if (openLessonBtn) {
        openLesson(openLessonBtn.getAttribute("data-open-lesson"));
        return;
      }

      const toggleLessonBtn = e.target.closest("[data-toggle-lesson]");
      if (toggleLessonBtn) {
        toggleLessonDone(toggleLessonBtn.getAttribute("data-toggle-lesson"));
        updateProgressUI();
        return;
      }

      // Open card buttons across the site
      const openCardBtn = e.target.closest("[data-open-card]");
      if (openCardBtn) {
        openCard(openCardBtn.getAttribute("data-open-card"));
        return;
      }

      // Open tool buttons across the site
      const openToolBtn = e.target.closest("[data-open-tool]");
      if (openToolBtn) {
        renderToolPanel(openToolBtn.getAttribute("data-open-tool"));
        location.hash = "#tools";
        return;
      }

      // Smooth scroll for nav links
      const link = e.target.closest("a[data-link]");
      if (link) {
        // Let hash update happen first, then scroll
        setTimeout(() => smoothScrollToHash(), 0);
      }
    });

    window.addEventListener("hashchange", () => {
      setActiveNav();
    });
  };

  /* =========================
     Boot
  ========================= */

  const boot = () => {
    initNav();
    initThemeControls();
    initSettingsDialog();
    initLessonDialog();
    initLearn();
    initCheckin();
    initTools();
    initCards();
    initPlan();
    initJourney();
    initResources();
    initChangelog();
    initImportExportButtons();
    initResetProgress();
    initQuickWinButtons();
    initGlobalClicks();

    renderQuickWin();
    renderLessons();
    renderCardsGrid();
    renderSavedCards();
    renderSLC();
    renderGuideIdeas();
    renderResources();
    renderPlan();
    updateProgressUI();

    // Restore check-in
    if (state.profile) renderCheckinResult(state.profile);

    // Restore theme segment active state
    const dlg = $("#settingsDialog");
    if (dlg) {
      $$(".seg-btn", dlg).forEach(b => b.classList.toggle("active", b.dataset.theme === state.theme));
    }

    // If URL points to a tool open action
    const hash = location.hash || "#home";
    setActiveNav();
    if (hash !== "#home") setTimeout(() => smoothScrollToHash(), 60);
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
