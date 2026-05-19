'use client';

interface ChartEntry {
  name: string;
  'Score (%)': number;
}

function getBarColor(score: number) {
  if (score >= 80) return { bar: '#18181b', label: '#18181b' };     // zinc-900 — on track
  if (score >= 50) return { bar: '#71717a', label: '#71717a' };     // zinc-500 — progressing
  return { bar: '#d4d4d8', label: '#a1a1aa' };                      // zinc-300 — at risk
}

export function EmployeeProgressChart({ chartData }: { chartData: ChartEntry[] }) {
  if (!chartData || chartData.length === 0) return null;

  const maxScore = 100;
  const chartHeight = 220;
  const barWidth = Math.min(72, Math.floor(560 / chartData.length) - 20);
  const gap = Math.max(16, Math.floor(560 / chartData.length) - barWidth);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-semibold text-zinc-900 text-[15px]">Goal Progress Overview</h3>
        <p className="text-zinc-500 text-[13px] mt-0.5">Current achievement score per goal</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-900" />
          <span className="text-[11px] text-zinc-500 font-medium">On track (≥80%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-500" />
          <span className="text-[11px] text-zinc-500 font-medium">Progressing (≥50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-300" />
          <span className="text-[11px] text-zinc-500 font-medium">At risk (&lt;50%)</span>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{ minWidth: chartData.length * (barWidth + gap) + 48 }}
        >
          {/* Y axis gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: 40, top: 0 }}>
            {[100, 75, 50, 25, 0].map((val) => (
              <div key={val} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-8 text-right tabular-nums">{val}%</span>
                <div className="flex-1 border-t border-zinc-100" />
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="flex items-end gap-[var(--gap)] pl-10 pb-10" style={{ height: chartHeight + 40, '--gap': `${gap}px` } as any}>
            {chartData.map((entry, i) => {
              const score = entry['Score (%)'];
              const barH = Math.max(4, (score / maxScore) * chartHeight);
              const colors = getBarColor(score);

              return (
                <div key={i} className="flex flex-col items-center group relative" style={{ width: barWidth }}>
                  {/* Score tooltip on hover */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {score}%
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t-md transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ height: barH, backgroundColor: colors.bar }}
                  >
                    {/* Shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  </div>

                  {/* X label */}
                  <div
                    className="mt-2 text-center text-[11px] text-zinc-500 font-medium leading-tight max-w-full truncate"
                    style={{ width: barWidth }}
                    title={entry.name}
                  >
                    {entry.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
