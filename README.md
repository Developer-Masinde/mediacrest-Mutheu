# Hypertension Risk Predictor

A small, self-contained system that predicts a patient's risk of elevated
systolic blood pressure (**SBP &ge; 120 mmHg**) from basic clinic screening
data. Built as the applied companion to a Data Analysis & AI Fundamentals
capstone (Mediacrest Training College / AfyaTech Analytics scenario).

It has two parts, both driven by the **same trained model**:

| Part | What it is | Where |
|---|---|---|
| **Python pipeline** | Trains a Logistic Regression model, evaluates it, exports it | `src/`, `model/` |
| **Web calculator** | A static HTML/CSS/JS page that runs that exact model in the browser &mdash; no server, no API, deployable free on GitHub Pages | `webapp/` |

## Project structure

```
hypertension-risk-predictor/
├── data/
│   └── htn_dat.csv          # screening dataset (synthetic placeholder -- swap in real data)
├── src/
│   ├── train_model.py       # trains + evaluates the model, exports it for Python and JS
│   └── predict_cli.py       # command-line prediction for one patient
├── model/
│   ├── htn_lr_model.joblib  # trained scikit-learn pipeline (generated)
│   └── model_params.json    # portable model parameters (generated)
├── webapp/
│   ├── index.html           # the calculator page
│   ├── style.css
│   ├── script.js            # runs the model client-side
│   └── model_params.js      # same params as JS, auto-generated (do not edit by hand)
├── requirements.txt
└── README.md
```

## 1. Train the model (Python)

```bash
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python src/train_model.py
```

This prints test-set metrics and writes/refreshes:
- `model/htn_lr_model.joblib`
- `model/model_params.json`
- `webapp/model_params.js` &larr; **run this whenever you retrain**, so the web calculator stays in sync with the model.

## 2. Predict from the command line

```bash
python src/predict_cli.py \
  --bmi 29.4 --age 52 --married 1 --male_gender 1 \
  --hgb_centered -0.8 --log_creat_centered 0.3 \
  --adv_HIV 0 --arv_naive 1 --urban_clinic 0
```

## 3. Run the web calculator locally

No build step needed &mdash; it's plain HTML/CSS/JS.

```bash
cd webapp
python -m http.server 8000
# open http://localhost:8000 in a browser
```

## 4. Deploy the web calculator for free (GitHub Pages)

1. Push this repo to GitHub (see below).
2. In the repo, go to **Settings &rarr; Pages**.
3. Under "Build and deployment", set **Source: Deploy from a branch**, branch `main`, folder `/webapp`.
4. Save &mdash; GitHub gives you a public URL in a minute or two.

## Pushing this to GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Initial commit: hypertension risk predictor"
git branch -M main
git remote add origin https://github.com/<your-username>/hypertension-risk-predictor.git
git push -u origin main
```

## Using your real dataset

Replace `data/htn_dat.csv` with the real `htn_dat.csv` (same column names),
then re-run `python src/train_model.py`. Everything downstream &mdash; the
CLI, the saved model, and the web calculator &mdash; will automatically
reflect the retrained model; no other code changes needed.

## Notes

- The bundled `data/htn_dat.csv` is a **synthetic placeholder** dataset with
  the same columns as the real screening data, generated only so the whole
  pipeline runs end-to-end out of the box. Swap in the real data before
  drawing any real conclusions.
- This is a training/prototype tool, not a certified medical device.
