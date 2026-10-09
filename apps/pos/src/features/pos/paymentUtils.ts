/**
 * Generates sensible quick cash payment amounts at or above the given total.
 * - First option is always exact amount (Uang pas).
 * - Additional options include standard rounded denominations (5.000, 10.000, 50.000, 100.000).
 */
export function getQuickAmounts(total: number): number[] {
  if (total <= 0) {
    return [0];
  }

  const amounts = new Set<number>();
  amounts.add(total);

  // Ceilings for Indonesian currency bills
  const step5k = Math.ceil(total / 5000) * 5000;
  if (step5k > total) amounts.add(step5k);

  const step10k = Math.ceil(total / 10000) * 10000;
  if (step10k > total) amounts.add(step10k);

  const step20k = Math.ceil(total / 20000) * 20000;
  if (step20k > total) amounts.add(step20k);

  const step50k = Math.ceil(total / 50000) * 50000;
  if (step50k > total) amounts.add(step50k);

  const step100k = Math.ceil(total / 100000) * 100000;
  if (step100k > total) amounts.add(step100k);

  const sorted = Array.from(amounts).sort((a, b) => a - b);
  // Return exact total plus up to 4 sensible bill roundings
  return sorted.slice(0, 5);
}
