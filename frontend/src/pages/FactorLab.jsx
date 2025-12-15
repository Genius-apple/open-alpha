import { useState } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Play, TrendingUp, Activity, BarChart2, Award, Layers, FileText, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area
} from 'recharts';
import { FlaskConical } from 'lucide-react';

// Help content for Factor Lab
const HELP_CONTENT = {
    expressions: [
        { name: "close", desc: "收盘价", example: "close" },
        { name: "open", desc: "开盘价", example: "open" },
        { name: "high", desc: "最高价", example: "high" },
        { name: "low", desc: "最低价", example: "low" },
        { name: "volume", desc: "成交量", example: "volume" },
    ],
    functions: [
        { name: "ts_delay(x, n)", desc: "延迟n期", example: "ts_delay(close, 5)" },
        { name: "ts_mean(x, n)", desc: "移动平均", example: "ts_mean(close, 20)" },
        { name: "ts_std(x, n)", desc: "滚动标准差", example: "ts_std(close, 20)" },
        { name: "ts_max(x, n)", desc: "滚动最大", example: "ts_max(high, 10)" },
        { name: "ts_min(x, n)", desc: "滚动最小", example: "ts_min(low, 10)" },
        { name: "ts_rank(x, n)", desc: "滚动排名", example: "ts_rank(close, 20)" },
        { name: "ts_corr(x, y, n)", desc: "滚动相关", example: "ts_corr(close, volume, 20)" },
        { name: "ts_zscore(x, n)", desc: "滚动Z分数", example: "ts_zscore(close, 20)" },
        { name: "ts_returns(x, n)", desc: "n期收益率", example: "ts_returns(close, 5)" },
        { name: "winsorize(x)", desc: "去极值", example: "winsorize(close / ts_delay(close, 1) - 1)" },
        { name: "standardize(x)", desc: "标准化", example: "standardize(close)" },
        { name: "normalize(x)", desc: "归一化0-1", example: "normalize(volume)" },
        { name: "log(x)", desc: "自然对数", example: "log(close)" },
        { name: "sqrt(x)", desc: "平方根", example: "sqrt(volume)" },
        { name: "abs(x)", desc: "绝对值", example: "abs(close - open)" },
        { name: "sign(x)", desc: "符号函数", example: "sign(close - open)" },
    ],
    examples: [
        { name: "动量因子", expr: "close / ts_delay(close, 20) - 1" },
        { name: "波动率因子", expr: "ts_std(ts_returns(close, 1), 20)" },
        { name: "均线偏离", expr: "(close - ts_mean(close, 20)) / ts_mean(close, 20)" },
        { name: "量价相关", expr: "ts_corr(close, volume, 20)" },
        { name: "ATR因子", expr: "(ts_max(high, 14) - ts_min(low, 14)) / close" },
        { name: "Z-Score动量", expr: "ts_zscore(close, 20)" },
        { name: "波动率归一化", expr: "normalize(ts_std(close, 20))" },
    ]
};

const FactorLab = () => {
    const [expression, setExpression] = useState('winsorize(close / ts_delay(close, 20) - 1)');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('equity');
    const [showHelp, setShowHelp] = useState(false);
    const [symbol, setSymbol] = useState('BTC');
    const [interval, setInterval] = useState('1d');
    const [periods, setPeriods] = useState(1);
    const [quantiles, setQuantiles] = useState(5);

    const runFactor = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://localhost:8000/api/evaluate', {
                expression,
                symbol,
                interval,
                periods,
                quantile: quantiles
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Radar Data
    const getRadarData = (metrics) => [
        { subject: 'IC', value: Math.min(Math.abs(metrics.ic_mean || 0) / 0.1 * 100, 100) },
        { subject: 'ICIR', value: Math.min(Math.abs(metrics.ic_ir || 0) / 2 * 100, 100) },
        { subject: 'Sharpe', value: Math.min(Math.max(metrics.sharpe || 0, 0) / 2 * 100, 100) },
        { subject: 'Win Rate', value: (metrics.win_rate || 0.5) * 100 },
        { subject: 'Low DD', value: Math.max(0, (1 + (metrics.max_drawdown || 0)) * 100) },
        { subject: 'Stability', value: (metrics.ic_positive_pct || 0.5) * 100 },
    ];

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FlaskConical className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Factor Laboratory</h1>
                        <p className="text-xs text-gray-400">Advanced Factor Research & Backtest</p>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Parameter Controls */}
                    <select
                        value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="SOL">SOL</option>
                    </select>
                    <select
                        value={interval}
                        onChange={e => setInterval(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="1h">1H</option>
                        <option value="4h">4H</option>
                        <option value="1d">1D</option>
                    </select>
                    <select
                        value={quantiles}
                        onChange={e => setQuantiles(Number(e.target.value))}
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    >
                        <option value={3}>3分层</option>
                        <option value={5}>5分层</option>
                        <option value={10}>10分层</option>
                    </select>

                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-primary"
                        title="使用帮助"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>

                    {result && (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg border border-secondary/20">
                                <Award className="w-5 h-5" />
                                <span className="font-bold text-lg">Score: {result.metrics.score}</span>
                            </div>
                            <button
                                onClick={async () => {
                                    const name = prompt("输入报告名称:", "My Factor");
                                    if (name) {
                                        try {
                                            await axios.post('http://localhost:8000/api/reports', {
                                                name,
                                                description: `${symbol} ${interval} | ${expression.substring(0, 50)}...`,
                                                expression, // Send full expression
                                                result
                                            });
                                            alert("报告保存成功!");
                                        } catch (e) {
                                            alert("保存失败: " + e.message);
                                        }
                                    }
                                }}
                                className="flex items-center space-x-2 bg-surface hover:bg-white/5 border border-border px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Save</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={runFactor}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        <span>{loading ? "Running..." : "Run Backtest"}</span>
                    </button>
                </div>
            </div>

            {/* Help Panel */}
            {showHelp && (
                <div className="bg-surface border border-border rounded-xl p-4 animate-in slide-in-from-top">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            因子表达式使用指南
                        </h3>
                        <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-white/10 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Basic Variables */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 mb-2">基础变量</h4>
                            <div className="space-y-1">
                                {HELP_CONTENT.expressions.map(item => (
                                    <div key={item.name} className="text-xs p-2 bg-background rounded hover:bg-white/5 cursor-pointer"
                                        onClick={() => setExpression(item.example)}>
                                        <code className="text-primary">{item.name}</code>
                                        <span className="text-gray-500 ml-2">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Functions */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 mb-2">时序函数</h4>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {HELP_CONTENT.functions.map(item => (
                                    <div key={item.name} className="text-xs p-2 bg-background rounded hover:bg-white/5 cursor-pointer"
                                        onClick={() => setExpression(item.example)}>
                                        <code className="text-emerald-400">{item.name}</code>
                                        <span className="text-gray-500 ml-2">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Examples */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 mb-2">示例因子 (点击使用)</h4>
                            <div className="space-y-1">
                                {HELP_CONTENT.examples.map(item => (
                                    <div key={item.name} className="text-xs p-2 bg-background rounded hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30"
                                        onClick={() => setExpression(item.expr)}>
                                        <div className="font-medium text-foreground">{item.name}</div>
                                        <code className="text-gray-500">{item.expr}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Left: Editor */}
                <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-border bg-black/20 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-400">Expression Editor</span>
                        <span className="text-xs text-gray-500">支持: winsorize, standardize, ts_* 函数</span>
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            theme="vs-dark"
                            value={expression}
                            onChange={setExpression}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true
                            }}
                        />
                    </div>
                </div>

                {/* Right: Results */}
                <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
                    {error ? (
                        <div className="p-8 text-center text-red-500">
                            <div className="text-xl font-bold mb-2">执行错误</div>
                            <div className="font-mono bg-red-500/10 p-4 rounded-lg text-sm text-left whitespace-pre-wrap">{error}</div>
                        </div>
                    ) : !result ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <Layers className="w-16 h-16 mb-4 opacity-20" />
                            <p>编写因子表达式并点击 Run Backtest</p>
                            <p className="text-xs mt-2 text-gray-600">点击右上角 ? 查看使用帮助</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Validity Banner */}
                            {/* Validity Banner */}
                            {result.metrics.is_valid_factor !== undefined && (
                                <div className="group relative">
                                    <div className={`px-4 py-2 text-sm font-medium flex-shrink-0 cursor-help ${result.metrics.is_valid_factor ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        <div className="flex items-center justify-between">
                                            <span>{result.metrics.is_valid_factor ? '✓ 有效因子' : '⚠ 因子有效性问题'}: {result.metrics.validity_reason}</span>
                                            <span className="text-xs opacity-50 underline decoration-dashed">详情</span>
                                        </div>
                                    </div>

                                    {/* Hover Detail Panel */}
                                    <div className="hidden group-hover:block absolute top-full left-0 w-full z-10 p-4 bg-surface border border-border rounded-b-xl shadow-xl">
                                        <div className="text-xs font-bold text-gray-400 mb-2">各项检验指标</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {result.metrics.validity_checks && Object.entries(result.metrics.validity_checks).map(([key, passed]) => (
                                                <div key={key} className={`flex items-center space-x-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
                                                    <span>{passed ? '✓' : '✗'}</span>
                                                    <span className="text-gray-300 capitalize">
                                                        {key === 'ic_significance' && 'IC显著性 (t>1.96)'}
                                                        {key === 'ic_meaningful' && 'IC有效性 (>0.01)'}
                                                        {key === 'positive_sharpe' && '夏普比率 (>0)'}
                                                        {key === 'above_random' && '胜率 (>48%)'}
                                                        {key === 'sufficient_data' && '数据量 (>100)'}
                                                        {!['ic_significance', 'ic_meaningful', 'positive_sharpe', 'above_random', 'sufficient_data'].includes(key) && key}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metrics Strip */}
                            <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 p-3 border-b border-border flex-shrink-0">
                                <MiniMetric label="IC Mean" value={result.metrics.ic_mean?.toFixed(4)} highlight={Math.abs(result.metrics.ic_mean) > 0.03} />
                                <MiniMetric label="ICIR" value={result.metrics.ic_ir?.toFixed(2)} highlight={Math.abs(result.metrics.ic_ir) > 1} />
                                <MiniMetric label="Sharpe" value={result.metrics.sharpe?.toFixed(2)} highlight={result.metrics.sharpe > 1} />
                                <MiniMetric label="Sortino" value={result.metrics.sortino?.toFixed(2)} />
                                <MiniMetric label="Win Rate" value={((result.metrics.win_rate || 0) * 100).toFixed(1) + "%"} highlight={result.metrics.win_rate > 0.55} />
                                <MiniMetric label="Turnover" value={((result.metrics.turnover || 0) * 100).toFixed(1) + "%"} />
                                <MiniMetric label="AutoCorr" value={result.metrics.factor_autocorr?.toFixed(2)} />
                                <MiniMetric label="t-stat" value={result.metrics.t_stat?.toFixed(2)} highlight={Math.abs(result.metrics.t_stat) > 2} />
                                <MiniMetric label="p-value" value={result.metrics.p_value?.toFixed(3)} highlight={result.metrics.p_value < 0.05} />
                                <MiniMetric label="IC正向占比" value={((result.metrics.ic_positive_pct || 0) * 100).toFixed(0) + "%"} highlight={result.metrics.ic_positive_pct > 0.55} />
                            </div>

                            {/* Tabs Header */}
                            <div className="flex border-b border-border flex-shrink-0">
                                <TabBtn id="equity" label="收益曲线" icon={TrendingUp} active={activeTab} set={setActiveTab} />
                                <TabBtn id="ic" label="IC分析" icon={Activity} active={activeTab} set={setActiveTab} />
                                <TabBtn id="layers" label="分层回测" icon={BarChart2} active={activeTab} set={setActiveTab} />
                                <TabBtn id="radar" label="因子画像" icon={Award} active={activeTab} set={setActiveTab} />
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 p-4 min-h-0 overflow-auto">
                                {activeTab === 'equity' && (
                                    <div className="h-full flex flex-col gap-4">
                                        <div className="h-64">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">累计收益 (Long-Short)</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={result.equity_curve}>
                                                    <defs>
                                                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                                                    <YAxis stroke="#10b981" fontSize={10} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                                                    <Area type="monotone" dataKey="equity" stroke="#10b981" fill="url(#equityGrad)" strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="h-40">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">回撤</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={result.equity_curve}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                                                    <YAxis stroke="#ef4444" fontSize={10} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                                                    <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ic' && (
                                    <div className="h-full flex flex-col gap-4 overflow-y-auto">
                                        <div className="grid grid-cols-2 gap-4 h-48 flex-shrink-0">
                                            <div className="border border-border rounded p-2">
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
                                            <div className="border border-border rounded p-2">
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

                                        <div className="h-48 flex-shrink-0">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">Rolling IC (20-day)</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={result.equity_curve}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                                                    <YAxis stroke="#71717a" fontSize={10} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                                    <Bar dataKey="rolling_ic" fill="#3b82f6" opacity={0.8} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 h-48 flex-shrink-0">
                                            <div className="bg-black/20 p-2 rounded">
                                                <h4 className="text-xs font-bold text-gray-500 mb-2">IC Distribution</h4>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={result.ic_histogram}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                        <XAxis dataKey="range" fontSize={10} stroke="#71717a" />
                                                        <YAxis fontSize={10} stroke="#71717a" />
                                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                                        <Bar dataKey="count" fill="#8b5cf6" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="bg-black/20 p-2 rounded">
                                                <h4 className="text-xs font-bold text-gray-500 mb-2">Monthly IC (Seasonality)</h4>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={result.cs_ic_data}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                        <XAxis dataKey="period" fontSize={10} stroke="#71717a" />
                                                        <YAxis fontSize={10} stroke="#71717a" />
                                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} />
                                                        <Bar dataKey="ic" fill="#ec4899" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'layers' && (
                                    <div className="h-full flex flex-col gap-4">
                                        {/* Quantile Returns Bar */}
                                        <div className="h-48">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">分层平均收益率</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={result.layer_data || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                    <XAxis dataKey="layer" stroke="#71717a" />
                                                    <YAxis stroke="#71717a" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                                        formatter={(v) => (v * 100).toFixed(3) + '%'} />
                                                    <Bar dataKey="mean_return" fill="#10b981" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Layer Details Table */}
                                        <div className="flex-1 overflow-auto">
                                            <h4 className="text-xs font-bold text-gray-500 mb-2">分层详细指标</h4>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-gray-500 border-b border-border">
                                                        <th className="p-2">层级</th>
                                                        <th className="p-2">平均收益</th>
                                                        <th className="p-2">累计收益</th>
                                                        <th className="p-2">夏普</th>
                                                        <th className="p-2">胜率</th>
                                                        <th className="p-2">样本数</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(result.layer_data || []).map((layer, i) => (
                                                        <tr key={layer.layer} className={`border-b border-border/50 ${i === 0 ? 'text-red-400' : i === (result.layer_data?.length - 1) ? 'text-green-400' : ''}`}>
                                                            <td className="p-2 font-bold">{layer.layer}</td>
                                                            <td className="p-2 font-mono">{(layer.mean_return * 100).toFixed(4)}%</td>
                                                            <td className="p-2 font-mono">{(layer.total_return * 100).toFixed(2)}%</td>
                                                            <td className="p-2 font-mono">{layer.sharpe?.toFixed(2)}</td>
                                                            <td className="p-2 font-mono">{(layer.win_rate * 100).toFixed(1)}%</td>
                                                            <td className="p-2">{layer.count}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {result.metrics?.quantile_analysis?.is_monotonic && (
                                                <div className="mt-2 text-xs text-green-400">✓ 分层收益单调递增</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'radar' && (
                                    <div className="h-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData(result.metrics)}>
                                                <PolarGrid stroke="#27272a" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 12 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name="Factor" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} />
                                            </RadarChart>
                                        </ResponsiveContainer>
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

// Components
const MiniMetric = ({ label, value, highlight }) => (
    <div className={`bg-background rounded-lg p-2 text-center ${highlight ? 'ring-1 ring-primary' : ''}`}>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`font-mono font-bold text-sm ${highlight ? 'text-primary' : 'text-foreground'}`}>{value || '-'}</div>
    </div>
);

const TabBtn = ({ id, label, icon: Icon, active, set }) => (
    <button
        onClick={() => set(id)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${active === id
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-gray-400 hover:text-foreground hover:bg-white/5'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export default FactorLab;
