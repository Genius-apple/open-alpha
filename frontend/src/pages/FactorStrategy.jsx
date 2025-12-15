import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Play, Plus, Trash2, TrendingUp, Activity, BarChart2, Award, FileText, FolderOpen, X } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Reuse components from FactorLab (MiniMetric, TabBtn)
// Ideally these should be in a shared components folder
const MiniMetric = ({ label, value, highlight }) => (
    <div className={`p-2 rounded-lg border ${highlight ? 'bg-primary/10 border-primary/30' : 'bg-background border-border'} flex flex-col`}>
        <span className="text-xs text-gray-500 mb-1">{label}</span>
        <span className={`text-lg font-mono font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
            {value || '-'}
        </span>
    </div>
);

const TabBtn = ({ id, label, icon: Icon, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active === id
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-400 hover:text-foreground'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </button>
);

const FactorStrategy = () => {
    const [savedReports, setSavedReports] = useState([]);
    const [selectedFactors, setSelectedFactors] = useState([]); // [{id, name, expression, weight}]
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('equity');
    const [symbol, setSymbol] = useState('BTC');
    const [showLoadModal, setShowLoadModal] = useState(false); // Modal state

    // Fetch saved reports on mount
    useEffect(() => {
        axios.get('http://localhost:8000/api/reports')
            .then(res => setSavedReports(res.data.reports || []))
            .catch(err => console.error("Failed to fetch reports", err));
    }, []);

    const runStrategy = async () => {
        setLoading(true);
        try {
            const payload = {
                symbol: symbol,
                factors: selectedFactors.map(f => ({
                    expression: f.expression,
                    weight: parseFloat(f.weight)
                }))
            };

            const res = await axios.post('http://localhost:8000/api/combine', payload);
            setResult(res.data);
        } catch (e) {
            alert("Error: " + (e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    const saveStrategy = async () => {
        const name = prompt("Enter strategy name:");
        if (name) {
            try {
                const reportPayload = {
                    name: `[Strategy] ${name}`,
                    description: `Combined Strategy (${selectedFactors.length} factors)`,
                    result: {
                        ...result,
                        strategy_config: selectedFactors // Save weights!
                    }
                };

                await axios.post('http://localhost:8000/api/reports', reportPayload);
                alert("Strategy saved successfully!");
            } catch (e) {
                alert("Failed to save: " + e.message);
            }
        }
    };

    return (
        <div className="h-full flex flex-col p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Factor Strategy
                    </h1>
                    <p className="text-sm text-gray-400">构建多因子组合策略</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-surface border border-border rounded-lg p-1">
                        <span className="px-2 text-xs text-gray-500">Target</span>
                        <select
                            value={symbol} onChange={(e) => setSymbol(e.target.value)}
                            className="bg-transparent text-sm font-bold focus:outline-none"
                        >
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                {/* Left: Composition */}
                <div className="col-span-4 bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
                        <h3 className="font-bold">因子组合</h3>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowLoadModal(true)}
                                className="p-1 hover:bg-white/10 rounded-full text-blue-400"
                                title="Load Saved Factor"
                            >
                                <FolderOpen className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setSelectedFactors([...selectedFactors, { id: Date.now(), expression: "", weight: 1.0 }])}
                                className="p-1 hover:bg-white/10 rounded-full text-primary"
                                title="Add New Factor"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Load Modal */}
                    {showLoadModal && (
                        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                                <div className="p-4 border-b border-border flex justify-between items-center">
                                    <h3 className="font-bold text-lg">Load Saved Factor</h3>
                                    <button onClick={() => setShowLoadModal(false)} className="hover:text-white text-gray-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {savedReports.filter(r => r.expression || r.description?.includes('|')).length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">No saved factors found.</div>
                                    ) : (
                                        savedReports.filter(r => r.expression || r.description?.includes('|')).map(report => (
                                            <div key={report.id}
                                                onClick={() => {
                                                    // Try to extract expression: explicitly saved OR regex from description
                                                    let expr = report.expression;
                                                    if (!expr && report.description) {
                                                        const parts = report.description.split('|');
                                                        if (parts.length > 1) expr = parts[1].trim();
                                                    }

                                                    if (expr) {
                                                        setSelectedFactors([...selectedFactors, {
                                                            id: Date.now(),
                                                            expression: expr,
                                                            weight: 1.0
                                                        }]);
                                                        setShowLoadModal(false);
                                                    }
                                                }}
                                                className="p-3 bg-background border border-border rounded-lg hover:border-primary cursor-pointer transition-colors group"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-sm text-white group-hover:text-primary">{report.name}</span>
                                                    <span className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono truncate">
                                                    {report.expression || report.description}
                                                </div>
                                                <div className="flex gap-2 mt-2 text-[10px] text-gray-400">
                                                    <span className={report.ic_mean > 0.02 ? 'text-green-400' : ''}>IC: {report.ic_mean?.toFixed(3)}</span>
                                                    <span className={report.sharpe > 1 ? 'text-green-400' : ''}>Sharpe: {report.sharpe?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedFactors.map((factor, idx) => (
                            <div key={factor.id} className="bg-background rounded-lg p-3 border border-border">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-mono text-gray-500">Factor {idx + 1}</span>
                                    <button
                                        onClick={() => setSelectedFactors(selectedFactors.filter(f => f.id !== factor.id))}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        className="w-full bg-surface border border-border rounded p-2 text-xs font-mono focus:border-primary outline-none"
                                        placeholder="Enter expression (e.g. close/ts_delay(close,20)-1)"
                                        value={factor.expression}
                                        onChange={(e) => {
                                            const newFactors = [...selectedFactors];
                                            newFactors[idx].expression = e.target.value;
                                            setSelectedFactors(newFactors);
                                        }}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">Weight:</span>
                                        <input
                                            type="number" step="0.1"
                                            className="w-20 bg-surface border border-border rounded p-1 text-xs text-center focus:border-primary outline-none"
                                            value={factor.weight}
                                            onChange={(e) => {
                                                const newFactors = [...selectedFactors];
                                                newFactors[idx].weight = e.target.value;
                                                setSelectedFactors(newFactors);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {selectedFactors.length === 0 && (
                            <div className="text-center text-gray-500 py-10 text-sm">
                                点击 + 添加因子
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-border bg-black/20 space-y-2">
                        <button
                            onClick={runStrategy}
                            disabled={loading || selectedFactors.length === 0}
                            className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            <span>{loading ? "Calculating..." : "Run Composition"}</span>
                        </button>

                        {result && (
                            <button
                                onClick={saveStrategy}
                                className="w-full flex items-center justify-center space-x-2 bg-surface hover:bg-white/5 border border-border px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Save Strategy</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Results */}
                <div className="col-span-8 bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
                    {!result ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <Layers className="w-16 h-16 mb-4 opacity-20" />
                            <p>运行组合策略以查看结果</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 p-3 border-b border-border flex-shrink-0">
                                <MiniMetric label="Total Return" value={(result.metrics.total_return * 100).toFixed(1) + "%"} highlight={result.metrics.total_return > 0} />
                                <MiniMetric label="Sharpe" value={result.metrics.sharpe?.toFixed(2)} highlight={result.metrics.sharpe > 1.5} />
                                <MiniMetric label="Sortino" value={result.metrics.sortino?.toFixed(2)} />
                                <MiniMetric label="IC Combined" value={result.metrics.ic_mean?.toFixed(4)} highlight={Math.abs(result.metrics.ic_mean) > 0.03} />
                                <MiniMetric label="ICIR" value={result.metrics.ic_ir?.toFixed(2)} highlight={Math.abs(result.metrics.ic_ir) > 1} />
                                <MiniMetric label="Win Rate" value={((result.metrics.win_rate || 0) * 100).toFixed(1) + "%"} />
                                <MiniMetric label="Turnover" value={((result.metrics.turnover || 0) * 100).toFixed(1) + "%"} />
                                <MiniMetric label="AutoCorr" value={result.metrics.factor_autocorr?.toFixed(2)} />
                                <MiniMetric label="t-stat" value={result.metrics.t_stat?.toFixed(2)} />
                                <MiniMetric label="p-pvalue" value={result.metrics.p_value?.toFixed(3)} />
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-border flex-shrink-0">
                                <TabBtn id="equity" label="收益曲线" icon={TrendingUp} active={activeTab} set={setActiveTab} />
                                <TabBtn id="ic_analysis" label="IC分析" icon={Activity} active={activeTab} set={setActiveTab} />
                                <TabBtn id="stats" label="因子详情" icon={Activity} active={activeTab} set={setActiveTab} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4 min-h-0 overflow-auto">
                                {activeTab === 'equity' && (
                                    <div className="h-full flex flex-col gap-4">
                                        <div className="h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={result.equity_curve}>
                                                    <defs>
                                                        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                                                    <YAxis stroke="#10b981" fontSize={10} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                                                        itemStyle={{ color: '#e4e4e7' }}
                                                    />
                                                    <Area type="monotone" dataKey="equity" stroke="#10b981" fill="url(#eqGrad)" strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ic_analysis' && (
                                    <div className="h-full flex flex-col gap-4 overflow-y-auto">
                                        <div className="h-48 border border-border rounded p-2">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">Rolling ICIR (60d)</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={result.equity_curve}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="date" hide />
                                                    <YAxis stroke="#60a5fa" fontSize={10} domain={['auto', 'auto']} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                                    <Line type="monotone" dataKey="rolling_icir" stroke="#60a5fa" dot={false} strokeWidth={1} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="h-48 border border-border rounded p-2">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">Cumulative IC (Alpha Consistency)</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={result.equity_curve}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="date" hide />
                                                    <YAxis stroke="#f472b6" fontSize={10} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                                    <Area type="monotone" dataKey="cumulative_ic" stroke="#f472b6" fill="#f472b6" fillOpacity={0.1} strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-400">单因子贡献</h4>
                                        <div className="rounded-lg border border-border overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-black/20 text-gray-500">
                                                    <tr>
                                                        <th className="p-3">Expression</th>
                                                        <th className="p-3">Weight</th>
                                                        <th className="p-3">Individual IC</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {result.factor_details?.map((f, i) => (
                                                        <tr key={i} className="hover:bg-white/5">
                                                            <td className="p-3 font-mono text-xs truncate max-w-xs" title={f.expression}>{f.expression}</td>
                                                            <td className="p-3">{f.weight}</td>
                                                            <td className={`p-3 ${f.ic > 0.02 ? 'text-green-400' : 'text-gray-400'}`}>{f.ic?.toFixed(4)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FactorStrategy;
