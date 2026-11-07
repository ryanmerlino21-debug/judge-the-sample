import csv from "../data/healthcare_costs.csv?raw";

// Parse the supplied CSV (no quoted fields). `data/` is never modified.
export const RAW_CSV = csv;
export const HEADER_COLUMNS = csv.split(/\r?\n/)[0].split(",");
const [header, ...lines] = csv.trim().split(/\r?\n/);
const cols = header.split(",");
const rows = lines.map((l) => l.split(","));
const col = (name) => rows.map((r) => r[cols.indexOf(name)]);

export const TARGET = "charges";
export const GROUP_COLUMNS = ["age_band", "region", "smoker", "sex"];

export const population = {
  name: "Healthcare costs (baseline)",
  file: "data/healthcare_costs.csv",
  values: col(TARGET).map(Number),
  rowIds: col("row_id").map(Number),
  ages: col("age").map(Number),
  bmi: col("bmi").map(Number),
  children: col("children").map(Number),
  groups: Object.fromEntries(GROUP_COLUMNS.map((c) => [c, col(c)])),
};
