const screens = {
  welcome: document.getElementById("welcomeScreen"),
  audit: document.getElementById("auditScreen"),
  results: document.getElementById("resultsScreen")
};

const steps = Array.from(document.querySelectorAll(".audit-step"));
const startButton = document.getElementById("startButton");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");
const printButton = document.getElementById("printButton");
const form = document.getElementById("auditForm");

let currentStep = 0;

const categoryNames = {
  rental: "Rental performance",
  presentation: "Property presentation",
  appeal: "Tenant appeal",
  maintenance: "Maintenance and compliance",
  strategy: "Investment planning"
};

const categoryRecommendations = {
  rental: [
    "Arrange an updated rental market assessment.",
    "Review pricing, presentation and advertising strategy before the next vacancy.",
    "Compare current rent with recent comparable properties."
  ],
  presentation: [
    "Consider updating professional advertising photography.",
    "Prepare a small presentation improvement plan before the next campaign.",
    "Review paintwork, flooring, gardens, lighting and window coverings."
  ],
  appeal: [
    "Review cost-effective features currently valued by local tenants.",
    "Prioritise improvements that support comfort, security and storage.",
    "Compare the property with competing rentals in the same price range."
  ],
  maintenance: [
    "Create a preventative maintenance and compliance priority list.",
    "Confirm smoke alarm and water-efficiency documentation is current where applicable.",
    "Review outstanding repairs before they become more costly."
  ],
  strategy: [
    "Review landlord insurance and ensure the cover remains suitable.",
    "Speak with a qualified accountant about depreciation opportunities.",
    "Discuss equity and future investment plans with a broker or financial adviser."
  ]
};

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateStep() {
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });

  const percent = Math.round(((currentStep + 1) / steps.length) * 100);
  document.getElementById("stepLabel").textContent = `Step ${currentStep + 1} of ${steps.length}`;
  document.getElementById("progressPercent").textContent = `${percent}% complete`;
  document.getElementById("progressBar").style.width = `${percent}%`;

  backButton.style.visibility = currentStep === 0 ? "hidden" : "visible";
  nextButton.textContent = currentStep === steps.length - 1 ? "View My Results" : "Continue";

  document.getElementById("detailsError").textContent = "";
  document.getElementById("questionError").textContent = "";
}

function validateCurrentStep() {
  if (currentStep === 0) {
    const currentRent = Number(document.getElementById("currentRent").value);
    const marketRent = Number(document.getElementById("marketRent").value);
    const propertyValue = Number(document.getElementById("propertyValue").value);
    const vacancyDays = Number(document.getElementById("vacancyDays").value);

    if (
      !Number.isFinite(currentRent) || currentRent < 0 ||
      !Number.isFinite(marketRent) || marketRent < 0 ||
      !Number.isFinite(propertyValue) || propertyValue <= 0 ||
      !Number.isFinite(vacancyDays) || vacancyDays < 0 || vacancyDays > 365
    ) {
      document.getElementById("detailsError").textContent =
        "Please complete all financial fields using valid numbers.";
      return false;
    }
    return true;
  }

  const requiredGroups = new Set(
    Array.from(steps[currentStep].querySelectorAll('input[type="radio"][required]'))
      .map(input => input.name)
  );

  const missing = Array.from(requiredGroups).some(name => {
    return !steps[currentStep].querySelector(`input[name="${name}"]:checked`);
  });

  if (missing) {
    document.getElementById("questionError").textContent =
      "Please answer every question before continuing.";
    return false;
  }

  return true;
}

function collectScores() {
  const scores = {
    rental: { points: 0, max: 0 },
    presentation: { points: 0, max: 0 },
    appeal: { points: 0, max: 0 },
    maintenance: { points: 0, max: 0 },
    strategy: { points: 0, max: 0 }
  };

  document.querySelectorAll(".question[data-category]").forEach(question => {
    const category = question.dataset.category;
    const selected = question.querySelector('input[type="radio"]:checked');
    if (selected) {
      scores[category].points += Number(selected.value);
      scores[category].max += 5;
    }
  });

  Object.keys(scores).forEach(category => {
    const data = scores[category];
    data.percent = data.max ? Math.round((data.points / data.max) * 100) : 0;
  });

  return scores;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(value);
}

function getScoreLevel(score) {
  if (score >= 85) {
    return {
      label: "Strong Performer",
      summary: "Your property appears to be performing strongly. Focus on maintaining the current standard and reviewing longer-term opportunities."
    };
  }

  if (score >= 70) {
    return {
      label: "Performing Well",
      summary: "Your property is performing well, with several areas that may be worth reviewing."
    };
  }

  if (score >= 50) {
    return {
      label: "Opportunity to Improve",
      summary: "Your answers indicate opportunities to strengthen rental performance, tenant appeal or property planning."
    };
  }

  return {
    label: "Property Review Recommended",
    summary: "A detailed property review may help identify the highest-priority actions and potential improvements."
  };
}

function createRecommendations(scores) {
  const sortedCategories = Object.entries(scores)
    .sort((a, b) => a[1].percent - b[1].percent)
    .map(([category]) => category);

  const recommendations = [];
  for (const category of sortedCategories) {
    for (const recommendation of categoryRecommendations[category]) {
      if (!recommendations.includes(recommendation)) {
        recommendations.push(recommendation);
      }
      if (recommendations.length === 3) {
        return recommendations;
      }
    }
  }

  return recommendations;
}

function renderResults() {
  const scores = collectScores();
  const totalPercent = Math.round(
    Object.values(scores).reduce((sum, item) => sum + item.percent, 0) /
    Object.keys(scores).length
  );

  const currentRent = Number(document.getElementById("currentRent").value);
  const marketRent = Number(document.getElementById("marketRent").value);
  const propertyValue = Number(document.getElementById("propertyValue").value);
  const vacancyDays = Number(document.getElementById("vacancyDays").value);
  const suburb = document.getElementById("suburb").value.trim();

  const grossYield = ((currentRent * 52) / propertyValue) * 100;
  const annualIncrease = Math.max(0, (marketRent - currentRent) * 52);
  const vacancyCost = (currentRent / 7) * vacancyDays;
  const level = getScoreLevel(totalPercent);

  document.getElementById("scoreNumber").textContent = totalPercent;
  document.getElementById("scoreBadge").textContent = level.label;
  document.getElementById("scoreSummary").textContent = level.summary;
  document.getElementById("yieldResult").textContent = `${grossYield.toFixed(2)}%`;
  document.getElementById("increaseResult").textContent = formatCurrency(annualIncrease);
  document.getElementById("vacancyResult").textContent = formatCurrency(vacancyCost);
  document.getElementById("resultSuburb").textContent = suburb
    ? `Indicative results for your property in ${suburb}.`
    : "Your indicative property audit results.";

  const categoryScores = document.getElementById("categoryScores");
  categoryScores.innerHTML = "";

  Object.entries(scores).forEach(([category, data]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
      <div class="category-meta">
        <span>${categoryNames[category]}</span>
        <strong>${data.percent}%</strong>
      </div>
      <div class="category-track" aria-label="${categoryNames[category]} ${data.percent}%">
        <div class="category-fill" style="width: ${data.percent}%"></div>
      </div>
    `;
    categoryScores.appendChild(row);
  });

  const recommendationList = document.getElementById("recommendationList");
  recommendationList.innerHTML = "";
  createRecommendations(scores).forEach(recommendation => {
    const item = document.createElement("li");
    item.textContent = recommendation;
    recommendationList.appendChild(item);
  });

  const subject = encodeURIComponent("Property Audit Review");
  const body = encodeURIComponent(
    `Hi Teagan,\n\nI completed the Property Performance Audit and would like to discuss my results.\n\nSuburb: ${suburb || "Not provided"}\nScore: ${totalPercent}/100\nCurrent weekly rent: ${formatCurrency(currentRent)}\nEstimated market rent: ${formatCurrency(marketRent)}\nEstimated gross yield: ${grossYield.toFixed(2)}%\n\nMy preferred contact number is:\n\nThank you.`
  );

  /*
    IMPORTANT:
    Replace the email address below with your correct business email address.
  */
  document.getElementById("reviewButton").href =
    `mailto:YOUR-EMAIL-ADDRESS@example.com?subject=${subject}&body=${body}`;
}

startButton.addEventListener("click", () => {
  currentStep = 0;
  updateStep();
  showScreen("audit");
});

backButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    updateStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextButton.addEventListener("click", () => {
  if (!validateCurrentStep()) {
    return;
  }

  if (currentStep < steps.length - 1) {
    currentStep += 1;
    updateStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  renderResults();
  showScreen("results");
});

restartButton.addEventListener("click", () => {
  form.reset();
  currentStep = 0;
  updateStep();
  showScreen("welcome");
});

printButton.addEventListener("click", () => {
  window.print();
});

updateStep();
