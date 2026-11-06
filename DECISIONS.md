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
| Methods at n = 100 | baseline | Simple random | | | 100 | | | | | | |
| Methods at n = 100 | baseline | Systematic | | | 100 | | | | | | |
| Methods at n = 100 | baseline | Stratified | | | 100 | | | | | | |
| Sample size | baseline | Simple random | | | 1 | | | | | | |
| Sample size | baseline | Simple random | | | 10 | | | | | | |
| Challenge | baseline | (method I challenged) | | | | | | | | | |
| Challenge | modified | (method I challenged) | | | | | | | | | |
| Challenge | baseline | (alternative or correction) | | | | | | | | | |
| Challenge | modified | (alternative or correction) | | | | | | | | | |

The simple random n = 100 row is also the n = 100 sample-size result when the population and
settings match. If I reran it with different settings, I add a separate row. All four challenge
rows use the same n; a challenge baseline row may repeat a matching stage 4 result.

## 4. Findings (in my own words, using my own numbers)

- (a) Method comparison: the three sampling methods compared at n = 100 (bias versus variability, and for which population):
- (b) Sample-size finding: how sample size affects the spread of estimates and the estimation error, and what a larger sample cannot fix:

## 5. Challenge (hypothesis written independently, before consulting my agent)

Hypothesis, written before I consult my agent:

- Date written: 11/5/26
- Method I chose to challenge: Systematic sampling with a random start at n = 100.
- The change to the population or its ordering: In a labeled copy of the file, I will space out the 100 highest-charges smokers so there is one about every 13.38 rows, starting at the top. The other rows keep their original relative order. The true mean does not change, and I will confirm it matches the original.
- Why the selection rule would interact with that change: Systematic sampling picks one row every 13.38 rows from a random starting point. In the copy, the high-cost smokers are spaced the same way. A start near the top of the file lands on almost all of them, and other starts land on almost none.
- Evidence I expect across repeated samples: Using 1,000 Monte Carlo repetitions at n = 100 with a recorded seed, I expect most systematic estimates on the copy to fall below the true mean and a few to fall far above it. The SD and RMSE should be at least double those on the original, and bias should stay near zero. SRS and stratified should stay within 10% of their original SD and RMSE.
- Alternative method or correction I will compare, and why: Stratified sampling on smoker status. It does not use row order. Smokers average $32,050.23 and non-smokers average $8,434.27, so I expect its SD to be at least 25% smaller than SRS on both files.
- Evidence that would contradict my hypothesis: My hypothesis would be wrong if the systematic SD on the copy is less than 1.25 times the SD on the original. It would also be wrong if stratified SD is less than 10% smaller than SRS on either file, or if it changes by more than 10% on the copy.

After I test it:

- Test settings (conditions, methods, alternative method or correction, n, seeds); results are in the table above:
- (c) Challenge interpretation: did the evidence support my hypothesis? Bias versus variability, other explanations, what the alternative or correction showed, and any dated revision (keep the original above):

## 6. AI use

- Tools used:
- What I asked my agent to do, and what I checked myself:
- Automated checks my agent reported (I did not let it interpret my results):
