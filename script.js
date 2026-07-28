const MODEL_PARAMS = {
  feature_order: [
    "BMI",
    "age",
    "married",
    "male_gender",
    "hgb_centered",
    "log_creat_centered",
    "adv_HIV",
    "arv_naive",
    "urban_clinic",
  ],
  feature_meta: {
    BMI: { label: "BMI (kg/m2)", type: "number", step: 0.1, min: 10, max: 60 },
    age: { label: "Age (years)", type: "number", step: 1, min: 15, max: 100 },
    married: { label: "Married", type: "binary" },
    male_gender: { label: "Gender: Male", type: "binary" },
    hgb_centered: {
      label: "Hemoglobin, centered (g/dL from clinic mean)",
      type: "number",
      step: 0.1,
      min: -6,
      max: 6,
    },
    log_creat_centered: {
      label: "Log-Creatinine, centered (from clinic mean)",
      type: "number",
      step: 0.05,
      min: -2,
      max: 2,
    },
    adv_HIV: { label: "Advanced HIV status", type: "binary" },
    arv_naive: { label: "ARV-naive (no prior ARV treatment)", type: "binary" },
    urban_clinic: { label: "Clinic location: Urban", type: "binary" },
  },
  scaler_mean: [
    26.87439516129032, 46.90524193548387, 0.5826612903225806,
    0.5020161290322581, 0.04262096774193549, 0.025282258064516127,
    0.1592741935483871, 0.41330645161290325, 0.4939516129032258,
  ],
  scaler_scale: [
    5.130208765038691, 15.318036120424463, 0.49311977356642883,
    0.49999593520720276, 1.553351328022747, 0.4081435460733794,
    0.3659315848869813, 0.4924268764680235, 0.4999634156751147,
  ],
  coefficients: [
    0.8897392029384276, 1.3712557426982364, -0.19974636029891965,
    0.5720463654322945, -0.40327903561737477, 0.2271543858637419,
    0.45284404685150126, -0.22716923676061648, -0.29865458149163493,
  ],
  intercept: -0.164320260782196,
  test_metrics: {
    accuracy: 0.734,
    precision: 0.667,
    recall: 0.731,
    specificity: 0.736,
    f1: 0.697,
    roc_auc: 0.833,
  },
};

(function () {
  const {
    feature_order,
    feature_meta,
    scaler_mean,
    scaler_scale,
    coefficients,
    intercept,
    test_metrics,
  } = MODEL_PARAMS;

  const form = document.getElementById("risk-form");
  const fieldsContainer = document.getElementById("fields-container");
  const footerAuc = document.getElementById("footer-auc");
  footerAuc.textContent = test_metrics.roc_auc.toFixed(3);

  const DEFAULTS = {
    BMI: 26,
    age: 45,
    married: 1,
    male_gender: 0,
    hgb_centered: 0,
    log_creat_centered: 0,
    adv_HIV: 0,
    arv_naive: 1,
    urban_clinic: 1,
  };

  feature_order.forEach((key) => {
    const meta = feature_meta[key];
    const field = document.createElement("div");
    field.className = "field";

    const label = document.createElement("label");
    label.textContent = meta.label;
    label.setAttribute("for", key);
    field.appendChild(label);

    if (meta.type === "number") {
      const input = document.createElement("input");
      input.type = "number";
      input.id = key;
      input.name = key;
      input.step = meta.step;
      input.min = meta.min;
      input.max = meta.max;
      input.value = DEFAULTS[key];
      input.required = true;
      field.appendChild(input);
    } else {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.id = key;
      hidden.name = key;
      hidden.value = DEFAULTS[key];

      const toggle = document.createElement("div");
      toggle.className = "toggle";
      const btnNo = document.createElement("button");
      btnNo.type = "button";
      btnNo.textContent = "No";
      const btnYes = document.createElement("button");
      btnYes.type = "button";
      btnYes.textContent = "Yes";

      function setVal(v) {
        hidden.value = v;
        btnYes.classList.toggle("active", v === 1);
        btnNo.classList.toggle("active", v === 0);
      }
      btnYes.addEventListener("click", () => setVal(1));
      btnNo.addEventListener("click", () => setVal(0));
      setVal(DEFAULTS[key]);

      toggle.appendChild(btnNo);
      toggle.appendChild(btnYes);
      field.appendChild(toggle);
      field.appendChild(hidden);
    }

    fieldsContainer.appendChild(field);
  });

  function predict(values) {
    let logit = intercept;
    const contributions = [];

    feature_order.forEach((key, i) => {
      const z = (values[key] - scaler_mean[i]) / scaler_scale[i];
      const contribution = coefficients[i] * z;
      logit += contribution;
      contributions.push({ key, label: feature_meta[key].label, contribution });
    });

    const proba = 1 / (1 + Math.exp(-logit));
    contributions.sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
    );
    return { proba, contributions };
  }

  const resultEmpty = document.getElementById("result-empty");
  const resultBody = document.getElementById("result-body");
  const probValue = document.getElementById("prob-value");
  const gaugeFill = document.getElementById("gauge-fill");
  const riskLabel = document.getElementById("risk-label");
  const breakdownList = document.getElementById("breakdown-list");

  function render(proba, contributions) {
    resultEmpty.hidden = true;
    resultBody.hidden = false;

    const pct = proba * 100;
    probValue.textContent = pct.toFixed(1) + "%";

    const circumference = 283;
    const offset = circumference - circumference * Math.min(proba, 1);
    gaugeFill.style.strokeDashoffset = offset;
    gaugeFill.style.stroke = proba >= 0.5 ? "#c94c4c" : "#028090";

    if (proba >= 0.5) {
      riskLabel.textContent = "Elevated risk \u2014 flag for follow-up";
      riskLabel.className = "risk-label elevated";
    } else {
      riskLabel.textContent = "Normal range";
      riskLabel.className = "risk-label normal";
    }

    breakdownList.innerHTML = "";
    contributions.slice(0, 4).forEach((c) => {
      const li = document.createElement("li");
      const dirUp = c.contribution > 0;
      li.innerHTML = `<span>${c.label}</span><span class="dir ${dirUp ? "up" : "down"}">${dirUp ? "\u2191 raises risk" : "\u2193 lowers risk"}</span>`;
      breakdownList.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = {};
    feature_order.forEach((key) => {
      values[key] = parseFloat(document.getElementById(key).value);
    });
    const { proba, contributions } = predict(values);
    render(proba, contributions);
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    feature_order.forEach((key) => {
      const meta = feature_meta[key];
      document.getElementById(key).value = DEFAULTS[key];
      if (meta.type !== "number") {
        const field = document.getElementById(key).parentElement;
        const [btnNo, btnYes] = field.querySelectorAll(".toggle button");
        btnYes.classList.toggle("active", DEFAULTS[key] === 1);
        btnNo.classList.toggle("active", DEFAULTS[key] === 0);
      }
    });
    resultBody.hidden = true;
    resultEmpty.hidden = false;
  });
})();
