# My decisions and evidence notes

Written by me, not by my AI agent. Write my challenge hypothesis (section 5) **before** consulting
my agent about it, and do not edit it afterwards; add a dated revision below instead.

| Stage | What I record here |
|---|---|
| 1 | Section 1 |
| 2–5 | Section 2: my design choice, written before I switch my agent to build |
| 4 | Section 3: method and sample-size rows; section 4: findings (a) and (b) |
| 5 | Section 5: hypothesis first; then section 3: challenge rows; section 5: finding (c) |
| All | Section 6: AI use |

## 1. Population and target

- Scenario and file: Healthcare costs, using healthcare_costs.csv.
- One row means: One person.
- Number of rows (N): 1,338.
- Row order, and what it means in this file: The rows are in the same order as the source file. The order has no meaning and is not a time sequence.
- Target column and units: charges, in US dollars.
- My finite population is (and what it is not): My finite population is the set of 1,338 people in this file. It is not real patient records, because the data was simulated for teaching, and it is not the average for all patients.
- True mean I calculated (and how): $13,270.42. I added up the charges for all 1,338 rows and divided by 1,338.

## 2. Design choices

For each stage: the option I chose, why, and what it is meant to help a user learn.

- Stage 2, visualization (include one visual feature meant to reveal a sampling problem): I chose a bar chart with one bar per person in file order. It shows everyone at once and where the sampled people sit in the file. It should help a user see how a sample is spread out and how far its estimate is from the true mean. The visual feature is the sampled bars, which are thick with a dot on top. If they bunch up or follow a pattern, the sample may not represent the file. The true mean and the sample estimate are two lines, so a gap between them shows the sample's error.
- Stage 3, sampling interactions and stratification column: Users can pick the method, n, the seed, and the stratification column. The same seed gives the same sample. I stratified on smoker status. Smokers average $32,050.23 and non-smokers average $8,434.27, so it separates high and low charges well. This should help a user see how the methods choose people differently, and how grouping people first can make the estimate steadier.
- Stage 4, presentation of the method comparison and sample-size experiments: Each experiment has its own tab. Each result is a row of dots, one dot per estimate, next to its bias, SD, and RMSE. The dots show the spread and the center, and the numbers back them up. This should help a user understand bias versus variability, and how sample size changes the spread.
- Stage 5, challenge controls and my alternative method or correction: The controls make a labeled modified copy of the file. A user chooses the group to move, how many rows, the spacing, n, the seed, and the repetitions. They can then run systematic sampling on the baseline file and the copy and compare the results. My alternative method is stratified sampling on smoker status, since it does not use row order. This should help a user test whether a pattern in the file order affects a sampling method, and whether a method that ignores the order does better.

## 3. Results table

One row per result I read from my app. Add rows as needed. Rerun and update a row whenever I
like: my app does not need to keep a history of runs. Seed is "exact" for exact enumeration;
type is Monte Carlo or exact. In Settings I record the settings that matter for the result, such
as the stratification column and allocation, or my challenge-control values. True mean is the
true mean of the population that result was drawn from (the modified copy's own recalculated
value for modified rows). Keep each result in its own row: never pool estimates.

| Experiment | Population or condition | Method | Settings | Seed (or exact) | n | Repetitions or starts | Type | True mean | Bias | SD | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Methods at n = 100 | baseline | Simple random | without replacement | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$16.70 | $1,171.27 | $1,171.39 |
| Methods at n = 100 | baseline | Systematic | random start, fractional interval k = 13.38 | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$18.63 | $947.90 | $948.08 |
| Methods at n = 100 | baseline | Stratified | smoker, proportional allocation (largest remainder, min 1 per stratum) | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$22.77 | $724.44 | $724.80 |
| Sample size | baseline | Simple random | without replacement | 2026 | 1 | 1,000 | Monte Carlo | $13,270.42 | +$305.14 | $12,268.04 | $12,271.83 |
| Sample size | baseline | Simple random | without replacement | 2026 | 10 | 1,000 | Monte Carlo | $13,270.42 | -$28.31 | $3,836.57 | $3,836.68 |
| Challenge | baseline | Systematic | random start, fractional interval k = 13.38 | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$18.63 | $947.90 | $948.08 |
| Challenge | modified | Systematic | top 100 smoker = yes rows spaced every 13.38 rows | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$582.23 | $8,211.52 | $8,232.13 |
| Challenge | baseline | Stratified | smoker, proportional allocation | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$22.77 | $724.44 | $724.80 |
| Challenge | modified | Stratified | smoker, proportional allocation, modified copy (top 100 smoker = yes rows spaced every 13.38 rows) | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$44.57 | $735.78 | $737.12 |
| Challenge | baseline | Simple random | without replacement | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$16.70 | $1,171.27 | $1,171.39 |
| Challenge | modified | Simple random | without replacement, modified copy (top 100 smoker = yes rows spaced every 13.38 rows) | 2026 | 100 | 1,000 | Monte Carlo | $13,270.42 | +$35.19 | $1,190.82 | $1,191.34 |

The simple random n = 100 row is also the n = 100 sample-size result when the population and
settings match. If I reran it with different settings, I add a separate row. All four challenge
rows use the same n; a challenge baseline row may repeat a matching stage 4 result.

## 4. Findings (in my own words, using my own numbers)

- (a) Method comparison: On the baseline population, all three methods were very close to the true mean of $13,270.42. The biases were only $16.70 for simple random, $18.63 for systematic, and $22.77 for stratified, so the main difference was variability. Simple random had an SD of $1,171.27, systematic had $947.90, and stratified had $724.44. Stratified was the most precise, about 38% lower than simple random. This makes sense because smokers and non-smokers have very different charges, and grouping by smoker removes that difference from the sample.
- (b) Sample-size finding: With simple random sampling, the SD dropped from $12,268.04 at n = 1 to $3,836.57 at n = 10 and $1,171.27 at n = 100. The bias stayed small compared with the SD each time, so a larger sample made the estimates less spread out. A larger sample only changes the spread, so it cannot fix a method that is biased. It also does not make this teaching dataset represent real patients.

## 5. Challenge (hypothesis written independently, before consulting my agent)

Hypothesis, written before I consult my agent:

- Date written: 11/5/26
- Method I chose to challenge: Systematic sampling with a random start at n = 100.
- The change to the population or its ordering: In a labeled copy of the file, I will space out the 100 highest-charge smokers so there is one about every 13.38 rows, starting at the top. The other rows keep their original relative order. The true mean does not change, and I will confirm it matches the original.
- Why the selection rule would interact with that change: Systematic sampling picks one row every 13.38 rows from a random starting point. In the copy, the high-cost smokers are spaced the same way. A start near the top of the file lands on almost all of them, and other starts land on almost none.
- Evidence I expect across repeated samples: Using 1,000 Monte Carlo repetitions at n = 100 with a recorded seed, I expect most systematic estimates on the copy to fall below the true mean and a few to fall far above it. The SD and RMSE should be at least double those on the original, and bias should stay near zero. SRS and stratified should stay within 10% of their original SD and RMSE.
- Alternative method or correction I will compare, and why: Stratified sampling on smoker status. It does not use row order. Smokers average $32,050.23 and non-smokers average $8,434.27, so I expect its SD to be at least 25% smaller than SRS on both files.
- Evidence that would contradict my hypothesis: My hypothesis would be wrong if the systematic SD on the copy is less than 1.25 times the SD on the original. It would also be wrong if stratified SD is less than 10% smaller than SRS on either file, or if it changes by more than 10% on the copy.

After I test it:

- Test settings (conditions, methods, alternative method or correction, n, seeds); results are in the table above: I tested the baseline file and the modified copy. I ran systematic, stratified on smoker, and simple random on both, all with n = 100, seed 2026, and 1,000 Monte Carlo repetitions.
- Additional seed: I tested the 481920 seed as well, on the Compare methods, Sample size, and Challenge tabs with the same settings.
- (c) Challenge interpretation: did the evidence support my hypothesis? Bias versus variability, other explanations, what the alternative or correction showed, and any dated revision (keep the original above): My hypothesis was mostly supported. The systematic SD on the modified copy was $8,211.52, which is 8.66 times the baseline SD of $947.90. The RMSE went up 8.68 times, from $948.08 to $8,232.13. Both are well above my "at least double" and my 1.25 cutoff. The dot plot also matched my prediction. Most systematic estimates were bunched below the true mean, and a few were spread far above it. Stratified had an SD about 38% lower than simple random on both files, which beats my 25% goal. Simple random and stratified changed by only 1.02 times in both SD and RMSE on the copy, which is within my 10% limit.

  I expected the bias to stay near zero, but the systematic bias rose from $18.63 to $582.23. It is still small next to the SD, so the main change was variability. This could be simulation noise, since I only ran one seed. Also, I built the pattern on purpose, so it does not show that real files would act the same way.

  Stratified on smoker did not use row order, so the reordering barely changed it. Its SD was $724.44 on the baseline and $735.78 on the copy.

  Dated revision: 11/5/26. No revision. My hypothesis stays the same.

## 6. AI use

- Tools used: Claude Code (Sonnet 5.5).
- What I asked my agent to do, and what I checked myself: I asked Claude Code to build the app: React and Vite, the shared sampling module, all the charts and tabs, run_app.sh, the automated tests, and the GitHub Pages deployment. It also created the GitHub repo and pushed the code. I told it to make the design choices it could, and it showed me visualization options. I picked the row-order bar chart over the other versions and had it redesign the look several times. After I wrote my hypothesis, I had it build the Challenge tab to match. I chose the scenario, ran every experiment in the app myself, and recorded the results. I also gave Claude Code my drafts for each section. It checked them against my results table and the data and flagged missing items, numbers that didn't match, and unclear wording. It did not change my conclusions, and I revised the drafts myself.
- Automated checks my agent reported (I did not let it interpret my results): Claude Code reported 16 passing tests from npm test and a successful production build. The tests cover the sampling rules, allocation totals, reproducibility, exact enumeration, RMSE² = bias² + SD², the modified-copy reordering, and CSV parsing. They are technical checks and do not report any results from my experiments.
