import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Search, Database, Activity, AlertCircle } from 'lucide-react';
// Correct import for lightweight-charts v5+
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

const DataExplorer = () => {
    const [structure, setStructure] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [selectedInterval, setSelectedInterval] = useState(null);
    const [dates, setDates] = useState({ start: '', end: '' });
    const [chartData, setChartData] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [chartError, setChartError] = useState(null);

    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/structure');
                setStructure(res.data);
            } catch (err) {
                console.error('Failed to fetch structure:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStructure();
    }, []);

    // Chart initialization function - Updated for lightweight-charts v5
    const initChart = useCallback(() => {
        // Clear any existing chart
        if (chartInstanceRef.current) {
            try {
                chartInstanceRef.current.remove();
            } catch (e) {
                console.warn('Error removing old chart:', e);
            }
            chartInstanceRef.current = null;
        }

        if (!chartContainerRef.current || !chartData || chartData.length === 0) {
            console.log('Cannot init chart: container or data missing');
            return;
        }

        setChartError(null);

        try {
            const container = chartContainerRef.current;

            // Get actual dimensions
            const rect = container.getBoundingClientRect();
            const width = Math.max(rect.width, 400);
            const height = Math.max(rect.height, 300);

            console.log(`Creating chart: ${width}x${height}, ${chartData.length} candles`);

            const chart = createChart(container, {
                width: width,
                height: height,
                layout: {
                    background: { type: ColorType.Solid, color: '#18181b' },
                    textColor: '#d4d4d8',
                },
                grid: {
                    vertLines: { color: '#27272a' },
                    horzLines: { color: '#27272a' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    borderColor: '#27272a',
                },
                rightPriceScale: {
                    borderColor: '#27272a',
                },
                crosshair: {
                    mode: 0,
                },
            });

            // NEW API for v5: use addSeries with CandlestickSeries type
            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            });

            // Format and validate data
            const formattedData = chartData
                .filter(d => d.time != null && d.open != null && d.high != null && d.low != null && d.close != null)
                .map(d => ({
                    time: Math.floor(Number(d.time)),
                    open: Number(d.open),
                    high: Number(d.high),
                    low: Number(d.low),
                    close: Number(d.close),
                }))
                .sort((a, b) => a.time - b.time);

            console.log(`Setting ${formattedData.length} valid candles`);

            if (formattedData.length > 0) {
                candleSeries.setData(formattedData);
                chart.timeScale().fitContent();
            } else {
                setChartError('No valid candle data');
            }

            chartInstanceRef.current = chart;

            // Handle resize
            const handleResize = () => {
                if (chartInstanceRef.current && container) {
                    const newRect = container.getBoundingClientRect();
                    chartInstanceRef.current.applyOptions({
                        width: Math.max(newRect.width, 400),
                        height: Math.max(newRect.height, 300),
                    });
                }
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
            };

        } catch (error) {
            console.error('Chart initialization error:', error);
            setChartError(`Chart error: ${error.message}`);
        }
    }, [chartData]);

    // Effect to init chart when data changes
    useEffect(() => {
        if (chartData && chartData.length > 0) {
            // Delay to ensure container is rendered
            const timer = setTimeout(() => {
                initChart();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [chartData, initChart]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (chartInstanceRef.current) {
                try {
                    chartInstanceRef.current.remove();
                } catch (e) { }
                chartInstanceRef.current = null;
            }
        };
    }, []);

    const loadData = async () => {
        if (!selectedSymbol || !selectedInterval) return;
        setDataLoading(true);
        setChartError(null);

        // Clear existing chart before loading new data
        if (chartInstanceRef.current) {
            try {
                chartInstanceRef.current.remove();
            } catch (e) { }
            chartInstanceRef.current = null;
        }
        setChartData(null);

        try {
            const params = { symbol: selectedSymbol, interval: selectedInterval };
            if (dates.start) params.start = dates.start;
            if (dates.end) params.end = dates.end;

            console.log('Loading data:', params);
            const res = await axios.get('http://localhost:8000/api/data', { params });

            if (res.data?.data?.length > 0) {
                console.log(`Received ${res.data.data.length} data points`);
                setChartData(res.data.data);
            } else {
                setChartError('No data returned from server');
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            setChartError(err.response?.data?.detail || err.message);
        } finally {
            setDataLoading(false);
        }
    };

    const symbols = Object.keys(structure);
    const filteredSymbols = symbols.filter(s => s.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header / Selector */}
            <div className="bg-surface p-4 rounded-xl border border-border flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Symbol</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm w-40 focus:outline-none focus:border-primary text-foreground"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Active Symbol</label>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-bold min-w-[100px]">
                        <Database className="w-4 h-4 text-primary" />
                        {selectedSymbol || "None"}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Timeframe</label>
                    <select
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary min-w-[100px]"
                        value={selectedInterval || ''}
                        onChange={e => setSelectedInterval(e.target.value)}
                        disabled={!selectedSymbol}
                    >
                        <option value="">Select</option>
                        {selectedSymbol && structure[selectedSymbol]?.map(int => (
                            <option key={int} value={int}>{int}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                    <input
                        type="date"
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                        value={dates.start}
                        onChange={e => setDates({ ...dates, start: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">End Date</label>
                    <input
                        type="date"
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                        value={dates.end}
                        onChange={e => setDates({ ...dates, end: e.target.value })}
                    />
                </div>

                <button
                    onClick={loadData}
                    disabled={!selectedSymbol || !selectedInterval || dataLoading}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-bold ml-auto disabled:opacity-50 transition-colors"
                >
                    {dataLoading ? "Loading..." : "Load Data"}
                </button>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left: Symbol List */}
                <div className="w-64 bg-surface border border-border rounded-xl flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 border-b border-border text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Available Assets ({filteredSymbols.length})
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="text-center p-4 text-gray-500">Loading...</div>
                        ) : filteredSymbols.map(sym => (
                            <div
                                key={sym}
                                onClick={() => { setSelectedSymbol(sym); setSelectedInterval(structure[sym]?.[0] || ''); }}
                                className={`px-3 py-2 rounded-lg cursor-pointer text-sm flex justify-between items-center transition-colors ${selectedSymbol === sym
                                        ? 'bg-primary text-white'
                                        : 'hover:bg-white/5 text-gray-300'
                                    }`}
                            >
                                <span className="font-medium">{sym}</span>
                                <span className="text-xs opacity-50">{structure[sym]?.length} TFs</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Chart */}
                <div className="flex-1 bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
                    {chartError ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-8">
                            <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                            <p className="font-bold mb-2">Chart Error</p>
                            <p className="text-sm text-center opacity-75 max-w-md">{chartError}</p>
                            <button
                                onClick={loadData}
                                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : dataLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-4"></div>
                            <p>Loading chart data...</p>
                        </div>
                    ) : !chartData ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <Activity className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a symbol and load data</p>
                            <p className="text-xs mt-2 opacity-50">Use mouse wheel to zoom, drag to pan</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0 bg-black/20">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <span className="text-primary">{selectedSymbol}</span>
                                        <span className="text-sm px-2 py-0.5 rounded bg-gray-700 font-mono">{selectedInterval}</span>
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {chartData.length} candles | Scroll to zoom, drag to pan
                                    </p>
                                </div>
                            </div>
                            {/* Chart Container */}
                            <div
                                ref={chartContainerRef}
                                className="flex-1"
                                style={{ minHeight: '400px' }}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataExplorer;
