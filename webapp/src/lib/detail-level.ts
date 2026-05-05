import type { DetailLevel, Gap, SpecItem } from './types';

export const DETAIL_LEVELS: DetailLevel[] = [1, 2, 3, 4, 5];

export function getItemRenderedLevel(
  item: SpecItem,
  globalLevel: DetailLevel,
): DetailLevel {
  return item.viewOverride ?? globalLevel;
}

export function getItemMaxFilledLevel(item: SpecItem): DetailLevel | 0 {
  let max: DetailLevel | 0 = 0;
  for (const lvl of DETAIL_LEVELS) {
    if (item.levels[lvl]?.trim()) max = lvl;
  }
  return max;
}

export function getItemRenderedContent(
  item: SpecItem,
  globalLevel: DetailLevel,
): { level: DetailLevel | 0; content: string } {
  const target = getItemRenderedLevel(item, globalLevel);
  for (let lvl = target; lvl >= 1; lvl--) {
    const content = item.levels[lvl as DetailLevel];
    if (content?.trim()) return { level: lvl as DetailLevel, content };
  }
  return { level: 0, content: '' };
}

export function getGapMaxFilledLevel(gap: Gap): DetailLevel {
  if (gap.status === 'integrated') return 5;
  if (gap.feedback || gap.suggestion) return 4;
  if (gap.answer?.trim()) return 3;
  if (gap.context?.trim()) return 2;
  return 1;
}

export function getGapRenderedLevel(
  gap: Gap,
  globalLevel: DetailLevel,
): DetailLevel {
  return gap.viewOverride ?? globalLevel;
}

export type LevelDistribution = Record<DetailLevel, number>;

export function getAggregateDistribution(
  items: SpecItem[],
  gaps: Gap[],
): { distribution: LevelDistribution; average: number; total: number } {
  const distribution: LevelDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let count = 0;

  for (const item of items) {
    const max = getItemMaxFilledLevel(item);
    if (max === 0) continue;
    distribution[max] += 1;
    sum += max;
    count += 1;
  }
  for (const gap of gaps) {
    const max = getGapMaxFilledLevel(gap);
    distribution[max] += 1;
    sum += max;
    count += 1;
  }

  return {
    distribution,
    average: count > 0 ? sum / count : 0,
    total: count,
  };
}
