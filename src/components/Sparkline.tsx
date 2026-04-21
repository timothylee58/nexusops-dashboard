interface SparklineProps {
  values: number[];
  color?: string;
  gradientId: string;
}

export function Sparkline({ values, color = "#fbbf24", gradientId }: SparklineProps) {
  const W = 80;
  const H = 32;
  const PAD = 2;
  const data = values.length ? values : [0, 0];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;

  const points = data.map((v, i) => {
    const x = PAD + i * step;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const polyPoints = points.join(" ");
  const areaPoints = `${PAD},${H} ${polyPoints} ${(PAD + (data.length - 1) * step).toFixed(2)},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-8 absolute bottom-2 right-2 pointer-events-none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={polyPoints} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
