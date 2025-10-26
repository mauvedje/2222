interface CombinedPremiumItem {
  name: string;
  combinedPremium: number;
}

interface SpreadPremiumItem {
  name: string;
  spreadPremium: number;
}

interface PremiumData {
  id: number;
  combinedPremiumArray: CombinedPremiumItem[];
  spreadPremiumArray: SpreadPremiumItem[];
}

interface LowestValueResult {
  id: number;
  lowestValue: number;
}

export const getLowestCombinedPremiumArray = (
  dataArray: PremiumData[]
): LowestValueResult[] => {
  return dataArray.map((item) => {
    const lowestCombinedPremium = item.combinedPremiumArray.reduce(
      (min, current) =>
        current.combinedPremium < min.combinedPremium ? current : min
    ).combinedPremium;

    return {
      id: item.id,
      lowestValue: lowestCombinedPremium,
    };
  });
};
