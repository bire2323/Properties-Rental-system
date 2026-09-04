import { useTheme } from '../../../hooks/useTheme'

const chartPoints = (values, maxValue) => values
    .map((value, index) => {
        const x = 30 + index * 80
        const y = 170 - (value / maxValue) * 140
        return `${x},${y}`
    })
    .join(' ')

export default function PropertyOverviewChart({ chartData = null }) {
    const { isDark } = useTheme()
    const labels = chartData?.labels || []
    const added = chartData?.added || []
    const rented = chartData?.rented || []
    const maxValue = Math.max(1, ...added, ...rented)

    const hasData = labels.length > 0 || added.length > 0 || rented.length > 0

    return (
        <section className={`rounded-xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`border-b px-6 py-4 flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Property Overview
                </h2>
                <button className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    This Month
                </button>
            </div>

            <div className="p-6">
                <div className={`flex items-center gap-6 pb-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Properties Added
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Properties Rented
                    </div>
                </div>

                {hasData ? (
                    <div className={`relative h-64 overflow-hidden rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <svg viewBox="0 0 620 220" className="h-full w-full">
                            {[0, 1, 2, 3, 4].map((line) => (
                                <line
                                    key={line}
                                    x1="30"
                                    x2="590"
                                    y1={30 + line * 35}
                                    y2={30 + line * 35}
                                    stroke={isDark ? '#475569' : '#e5e7eb'}
                                    strokeDasharray="3 5"
                                />
                            ))}
                            {[0, 1, 2, 3, 4, 5, 6].map((line) => (
                                <line
                                    key={`v-${line}`}
                                    x1={30 + line * 80}
                                    x2={30 + line * 80}
                                    y1="20"
                                    y2="180"
                                    stroke={isDark ? '#334155' : '#f1f5f9'}
                                />
                            ))}

                            <polyline
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                                points={chartPoints(added, maxValue)}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            <polyline
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2.5"
                                points={chartPoints(rented, maxValue)}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />

                            {labels.map((label, i) => (
                                <text
                                    key={label + i}
                                    x={30 + i * 80}
                                    y="200"
                                    fontSize="11"
                                    textAnchor="middle"
                                    fill={isDark ? '#94a3b8' : '#7c8798'}
                                >
                                    {label}
                                </text>
                            ))}
                        </svg>
                    </div>
                ) : (
                    <div className={`flex h-64 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                        No property activity yet.
                    </div>
                )}
            </div>
        </section>
    )
}
