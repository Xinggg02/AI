
import { PricingTier, TierBreakdown } from './types';

export const calculateTieredBreakdown = (totalKwh: number, tiers: PricingTier[], isSummer: boolean): TierBreakdown[] => {
  let remainingKwh = totalKwh;
  let prevLimit = 0;
  const breakdown: TierBreakdown[] = [];

  for (const tier of tiers) {
    const tierLimit = tier.limit - prevLimit;
    const currentTierKwh = Math.max(0, Math.min(remainingKwh, tierLimit));
    
    if (currentTierKwh > 0 || prevLimit === 0) {
      const rate = isSummer ? tier.rateSummer : tier.rateNonSummer;
      breakdown.push({
        range: tier.limit === Infinity ? `${prevLimit}+` : `${prevLimit}-${tier.limit}`,
        kwh: currentTierKwh,
        rate,
        cost: currentTierKwh * rate
      });
    }

    remainingKwh -= currentTierKwh;
    prevLimit = tier.limit;
    if (remainingKwh <= 0 && tier.limit !== Infinity) break;
  }

  return breakdown;
};

export const calculateMonthlyKwh = (
  watts: number,
  hours: number,
  count: number,
  runningRate: number
): number => {
  return (watts * hours * count * 30 * runningRate) / 1000;
};
