App link: https://ryanmerlino21-debug.github.io/judge-the-sample/

# Judge the Sample: my sampling app


**Central question:** Which sampling method would you trust for this population, at what sample size, and with what limits?

- **Scenario:** healthcare costs
- **Data file:** `data/healthcare_costs.csv` (source, licence and provenance in `data/README.md`)
- **Seed(s) used for my evidence** (exact enumeration needs no seed): 2026 (I also tested 481920)

## Run it on your computer

```bash
bash run_app.sh
```

Run it in a Bash terminal (macOS/Linux Terminal, or Git Bash/WSL on Windows) inside this folder.
Open the address it prints. Stop it with Ctrl+C.

## What's here

| File | What it is |
|---|---|
| `AGENT_BRIEF.md` | Instructions and rules for the coding agent. It reads this first. |
| `SETUP.md` | Setup, running, backing up and (optional) publishing. |
| `DECISIONS.md` | My own decisions, results table, findings, challenge hypothesis and interpretation. |
| `data/` | The three populations, data dictionary (`README.md`), `manifest.json` and `datasets.json`. |
| `load_data.mjs` | Minimal loader (`node load_data.mjs data/<file>.csv`): prints the size and columns of a dataset. |
| `evidence/` | Screenshots or exported results for my submission. |

My agent adds the React + Vite app (`package.json`, `src/`), the shared sampling module and `run_app.sh`.

## Technical checks

`npm test` runs the automated correctness checks on `src/sampling.js` (sampling invariants, allocation totals, reproducibility, exact enumeration, RMSE² = bias² + SD²). They check the code, not any investigation result.
