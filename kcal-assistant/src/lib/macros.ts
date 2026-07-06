export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

// "Räkna högt": kcal/fat/carbs round up, protein rounds down so an estimate
// can never falsely satisfy the proteingolv. The 1e-9 tolerance keeps float
// noise (0.1 + 0.2) from bumping a value a whole decimal step.
function directedRound(value: number, decimals: number, up: boolean): number {
  const factor = 10 ** decimals;
  const scaled = value * factor;
  const nearest = Math.round(scaled);
  if (Math.abs(scaled - nearest) < 1e-9) return nearest / factor;
  return (up ? Math.ceil(scaled) : Math.floor(scaled)) / factor;
}

export function roundMacros(raw: Macros): Macros {
  return {
    kcal: directedRound(raw.kcal, 0, true),
    protein: directedRound(raw.protein, 1, false),
    fat: directedRound(raw.fat, 1, true),
    carbs: directedRound(raw.carbs, 1, true),
  };
}

export function scaleMacros(base: Macros, factor: number): Macros {
  return roundMacros({
    kcal: base.kcal * factor,
    protein: base.protein * factor,
    fat: base.fat * factor,
    carbs: base.carbs * factor,
  });
}

export function scalePer100g(per100g: Macros, grams: number): Macros {
  return scaleMacros(per100g, grams / 100);
}

export function sumMacros(items: Macros[]): Macros {
  return roundMacros(
    items.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        fat: acc.fat + m.fat,
        carbs: acc.carbs + m.carbs,
      }),
      { kcal: 0, protein: 0, fat: 0, carbs: 0 },
    ),
  );
}
