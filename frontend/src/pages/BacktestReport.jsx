import { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Calendar, ChevronRight, Award, X, TrendingUp, Activity, BarChart2, Trash2, Trophy, ArrowUpDown, Check, AlertTriangle } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const BacktestReport = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sortBy, setSortBy] = useState('score');
    const [viewMode, setViewMode] = useState('grid'); // grid or ranking

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/reports?sort_by=${sortBy}`);
            setReports(res.data.reports || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [sortBy]);

    const openReport = async (reportId) => {
        setDetailLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/reports/${reportId}`);
            setSelectedReport(res.data);
        } catch (err) {
            console.error(err);
            alert('加载报告失败');
        } finally {
            setDetailLoading(false);
        }
    };

    const deleteReport = async (reportId, e) => {
        e?.stopPropagation();
        if (!confirm('确认删除该报告?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/reports/${reportId}`);
            fetchReports();
        } catch (err) {
            console.error(err);
        }
    };

    const closeDetail = () => setSelectedReport(null);

    const getRadarData = (metrics) => {
        if (!metrics) return [];
        return [
            { subject: 'IC', value: Math.min(Math.abs(metrics.ic_mean || 0) / 0.1 * 100, 100) },
            { subject: 'Stability', value: Math.min((metrics.ic_ir || 0) / 2 * 100, 100) },
            { subject: 'Sharpe', value: Math.min(Math.max(metrics.sharpe || 0, 0) / 2 * 100, 100) },
            { subject: 'Win Rate', value: (metrics.win_rate || 0.5) * 100 },
            { subject: 'Low DD', value: Math.max(0, (1 + (metrics.max_drawdown || 0)) * 100) },
        ];
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-bold">🥇 1st</span>;
        if (rank === 2) return <span className="bg-gray-400/20 text-gray-300 px-2 py-0.5 rounded text-xs font-bold">🥈 2nd</span>;
        if (rank === 3) return <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs font-bold">🥉 3rd</span>;
        return <span className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded text-xs">#{rank}</span>;
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        因子排行榜
                    </h1>
                    <p className="text-sm text-gray-400">已保存 {reports.length} 个因子报告</p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Sort Selector */}
                    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
                        <ArrowUpDown className="w-4 h-4 text-gray-500 ml-2" />
                        {['score', 'ic_mean', 'sharpe', 'win_rate'].map(key => (
                            <button
                                key={key}
                                onClick={() => setSortBy(key)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${sortBy === key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {key === 'score' ? '综合分' : key === 'ic_mean' ? 'IC' : key === 'sharpe' ? 'Sharpe' : 'Win Rate'}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-surface border border-border rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('ranking')}
                            className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'ranking' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            排名表
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            卡片
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500 text-center py-12">加载中...</div>
            ) : reports.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>暂无保存的报告</p>
                    <p className="text-sm mt-2">在 Factor Lab 运行回测后点击 "Save" 保存</p>
                </div>
            ) : viewMode === 'ranking' ? (
                /* Ranking Table View */
                <div className="bg-surface border border-border rounded-xl overflow-hidden flex-1">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-black/20 text-left">
                                <th className="p-4 text-gray-400 font-medium">排名</th>
                                <th className="p-4 text-gray-400 font-medium">因子名称</th>
                                <th className="p-4 text-gray-400 font-medium text-center">综合分</th>
                                <th className="p-4 text-gray-400 font-medium text-center">IC</th>
                                <th className="p-4 text-gray-400 font-medium text-center">ICIR</th>
                                <th className="p-4 text-gray-400 font-medium text-center">Sharpe</th>
                                <th className="p-4 text-gray-400 font-medium text-center">Win Rate</th>
                                <th className="p-4 text-gray-400 font-medium text-center">有效性</th>
                                <th className="p-4 text-gray-400 font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="border-b border-border/50 hover:bg-white/5 cursor-pointer transition-colors"
                                    onClick={() => openReport(report.id)}
                                >
                                    <td className="p-4">{getRankBadge(report.rank)}</td>
                                    <td className="p-4">
                                        <div className="font-medium">{report.name}</div>
                                        <div className="text-xs text-gray-500">{report.description}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold text-lg ${report.score >= 70 ? 'text-green-400' : report.score >= 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {report.score}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono">{report.ic_mean?.toFixed(4)}</td>
                                    <td className="p-4 text-center font-mono">{report.ic_ir?.toFixed(2)}</td>
                                    <td className="p-4 text-center font-mono">{report.sharpe?.toFixed(2)}</td>
                                    <td className="p-4 text-center font-mono">{((report.win_rate || 0) * 100).toFixed(1)}%</td>
                                    <td className="p-4 text-center">
                                        {report.is_valid ? (
                                            <Check className="w-5 h-5 text-green-400 mx-auto" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-yellow-400 mx-auto" />
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={(e) => deleteReport(report.id, e)}
                                            className="p-2 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Grid Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
                    {reports.map(report => (
                        <div
                            key={report.id}
                            onClick={() => openReport(report.id)}
                            className="bg-surface border border-border rounded-xl p-6 hover:border-primary transition-colors cursor-pointer group relative"
                        >
                            <button
                                onClick={(e) => deleteReport(report.id, e)}
                                className="absolute top-3 right-3 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex justify-between items-start mb-4 pr-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {getRankBadge(report.rank)}
                                        {report.is_valid && <Check className="w-4 h-4 text-green-400" />}
                                    </div>
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{report.name}</h3>
                                    <p className="text-sm text-gray-400">{report.description}</p>
                                </div>
                                <div className="bg-secondary/10 text-secondary text-xs font-bold px-2 py-1 rounded">
                                    {report.score}分
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
                                <div className="bg-background rounded p-2">
                                    <div className="text-gray-500">IC</div>
                                    <div className="font-mono font-bold">{report.ic_mean?.toFixed(3)}</div>
                                </div>
                                <div className="bg-background rounded p-2">
                                    <div className="text-gray-500">ICIR</div>
                                    <div className="font-mono font-bold">{report.ic_ir?.toFixed(2)}</div>
                                </div>
                                <div className="bg-background rounded p-2">
                                    <div className="text-gray-500">Sharpe</div>
                                    <div className="font-mono font-bold">{report.sharpe?.toFixed(2)}</div>
                                </div>
                                <div className="bg-background rounded p-2">
                                    <div className="text-gray-500">胜率</div>
                                    <div className="font-mono font-bold">{((report.win_rate || 0) * 100).toFixed(0)}%</div>
                                </div>
                            </div>

                            <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(report.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedReport.name}</h2>
                                <p className="text-sm text-gray-400">{selectedReport.description} | {new Date(selectedReport.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg">
                                    <Award className="w-5 h-5" />
                                    <span className="font-bold text-xl">Score: {selectedReport.data?.metrics?.score}</span>
                                </div>
                                <button onClick={closeDetail} className="p-2 hover:bg-white/10 rounded-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {detailLoading ? (
                                <div className="text-center text-gray-500 py-12">加载中...</div>
                            ) : selectedReport.data ? (
                                <div className="space-y-6">
                                    {/* Validity Banner */}
                                    {selectedReport.data.metrics?.is_valid_factor !== undefined && (
                                        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${selectedReport.data.metrics.is_valid_factor
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {selectedReport.data.metrics.is_valid_factor ? '✓ 有效因子' : '⚠ 有效性问题'}: {selectedReport.data.metrics.validity_reason}
                                        </div>
                                    )}

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                                        <MetricCard label="IC Mean" value={selectedReport.data.metrics?.ic_mean?.toFixed(4)} />
                                        <MetricCard label="ICIR" value={selectedReport.data.metrics?.ic_ir?.toFixed(2)} />
                                        <MetricCard label="t-stat" value={selectedReport.data.metrics?.t_stat?.toFixed(2)} />
                                        <MetricCard label="p-value" value={selectedReport.data.metrics?.p_value?.toFixed(3)} />
                                        <MetricCard label="Sharpe" value={selectedReport.data.metrics?.sharpe?.toFixed(2)} />
                                        <MetricCard label="Sortino" value={selectedReport.data.metrics?.sortino?.toFixed(2)} />
                                        <MetricCard label="胜率" value={((selectedReport.data.metrics?.win_rate || 0) * 100).toFixed(1) + '%'} />
                                        <MetricCard label="最大回撤" value={((selectedReport.data.metrics?.max_drawdown || 0) * 100).toFixed(1) + '%'} />
                                    </div>

                                    {/* Charts */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Equity Curve */}
                                        <div className="bg-background rounded-xl p-4">
                                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-primary" /> 收益曲线
                                            </h3>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={selectedReport.data.equity_curve || []}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                                                        <YAxis stroke="#10b981" fontSize={10} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                                                        <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Radar Chart */}
                                        <div className="bg-background rounded-xl p-4">
                                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                <Award className="w-4 h-4 text-secondary" /> 因子画像
                                            </h3>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData(selectedReport.data.metrics)}>
                                                        <PolarGrid stroke="#27272a" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 11 }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Rolling IC */}
                                        <div className="bg-background rounded-xl p-4">
                                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-pink-400" /> 滚动IC
                                            </h3>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={selectedReport.data.equity_curve || []}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                                                        <YAxis stroke="#f472b6" fontSize={10} domain={[-0.5, 0.5]} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                                                        <Line type="step" dataKey="rolling_ic" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Quantile Returns */}
                                        <div className="bg-background rounded-xl p-4">
                                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                                <BarChart2 className="w-4 h-4 text-emerald-400" /> 分层收益
                                            </h3>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={
                                                        Object.entries(selectedReport.data.metrics?.quantile_returns || {})
                                                            .map(([k, v]) => ({ name: k, value: v * 100 }))
                                                            .sort((a, b) => a.name.localeCompare(b.name))
                                                    }>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                        <XAxis dataKey="name" stroke="#71717a" />
                                                        <YAxis stroke="#71717a" />
                                                        <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} formatter={(v) => v.toFixed(4) + '%'} />
                                                        <Bar dataKey="value" fill="#10b981" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">无数据</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value }) => (
    <div className="bg-background rounded-lg p-3 text-center">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-mono font-bold text-foreground">{value || '-'}</div>
    </div>
);

export default BacktestReport;
