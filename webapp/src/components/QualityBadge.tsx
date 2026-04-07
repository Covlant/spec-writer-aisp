type QualityBadgeProps = {
  tier: string;
  tierName: string;
  delta: number;
};

const TIER_STYLES: Record<string, string> = {
  '◊⁺⁺': 'bg-purple-600/20 text-purple-300 border-purple-500/40',
  '◊⁺': 'bg-amber-600/20 text-amber-300 border-amber-500/40',
  '◊': 'bg-gray-600/20 text-gray-300 border-gray-500/40',
  '◊⁻': 'bg-orange-800/20 text-orange-300 border-orange-600/40',
  '⊘': 'bg-red-600/20 text-red-300 border-red-500/40',
};

export function QualityBadge({ tier, tierName, delta }: QualityBadgeProps) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES['⊘'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border ${style}`}
    >
      <span className="font-mono font-semibold">{tier}</span>
      <span>{tierName}</span>
      <span className="text-xs opacity-70">δ={delta.toFixed(2)}</span>
    </span>
  );
}
