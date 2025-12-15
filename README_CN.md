<div align="center">
  <h1>🚀 Open Alpha</h1>
  <p><strong>企业级量化因子分析平台</strong></p>
  
  <p>
    <a href="#功能特性">功能特性</a> •
    <a href="#快速开始">快速开始</a> •
    <a href="#使用文档">使用文档</a> •
    <a href="#项目结构">项目结构</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/python-3.9+-blue.svg" alt="Python">
    <img src="https://img.shields.io/badge/react-19.x-61DAFB.svg" alt="React">
    <img src="https://img.shields.io/badge/fastapi-0.100+-009688.svg" alt="FastAPI">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  </p>
</div>

---

## ✨ 功能特性

### 📊 数据浏览器 (Data Explorer)
- **交互式K线图** - 专业级TradingView风格图表，支持缩放/拖拽
- **多周期支持** - 1H, 4H, 1D等多个时间周期
- **实时数据浏览** - 高效浏览本地市场数据

### 🧪 因子实验室 (Factor Lab)
- **表达式编辑器** - 基于Monaco的代码编辑器，语法高亮
- **50+内置函数** - `ts_delay`, `ts_mean`, `ts_std`, `ts_rank`, `ts_corr` 等
- **一键回测** - 即时因子评估和性能分析
- **交互式帮助** - 内置函数文档和示例

### 📈 高级IC分析
- **时序IC** - 滚动IC相关性
- **截面IC** - 按期间IC分析
- **IC分布** - 直方图可视化
- **统计显著性** - t统计量和p值

### 📊 分层回测
- **分层分析** - 3/5/10分位分层
- **层级指标** - 每层收益率、夏普、胜率
- **单调性检验** - 自动检测因子质量

### 🏆 因子排名
- **综合评分** - 0-100质量评分
- **多维排序** - 按IC、夏普、胜率排序
- **有效性评估** - 自动因子验证
- **排行榜视图** - 比较所有回测因子

---

## 🚀 快速开始

### 环境要求
- Python 3.9+
- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/open-alpha.git
cd open-alpha

# 安装后端依赖
pip install -r backend/requirements.txt

# 安装前端依赖
cd frontend
npm install
cd ..

# 复制环境配置模板
cp .env.example .env
```

### 运行

**方式1: 分终端运行**
```bash
# 终端1 - 后端
python -m backend.main

# 终端2 - 前端
cd frontend && npm run dev
```

**方式2: Windows批处理脚本**
```bash
start_platform.bat
```

### 访问地址
- 🌐 **前端界面**: http://localhost:5173
- 🔌 **后端API**: http://localhost:8000
- 📚 **API文档**: http://localhost:8000/docs

---

## 📖 使用文档

### 因子表达式语法

```python
# 基础价格数据
close, open, high, low, volume

# 时序函数
ts_delay(x, n)      # 延迟n期
ts_mean(x, n)       # 滚动均值
ts_std(x, n)        # 滚动标准差
ts_max(x, n)        # 滚动最大值
ts_min(x, n)        # 滚动最小值
ts_rank(x, n)       # 滚动百分位排名
ts_corr(x, y, n)    # 滚动相关性

# 预处理函数
winsorize(x)        # 去极值
standardize(x)      # Z-score标准化
```

### 示例因子

| 因子名称 | 表达式 | 说明 |
|----------|--------|------|
| 动量因子 | `close / ts_delay(close, 20) - 1` | 20日价格动量 |
| 波动率因子 | `ts_std(close / ts_delay(close, 1) - 1, 20)` | 20日收益波动率 |
| 均值回归 | `(close - ts_mean(close, 20)) / ts_mean(close, 20)` | 均线偏离度 |
| 量价相关 | `ts_corr(close, volume, 20)` | 价格-成交量相关性 |

---

## 📊 回测指标说明

| 指标 | 说明 |
|------|------|
| **IC Mean** | 平均信息系数 |
| **ICIR** | IC信息比率 (IC/IC标准差) |
| **t-statistic** | IC的统计显著性 |
| **Sharpe Ratio** | 夏普比率 (风险调整收益) |
| **Sortino Ratio** | 索提诺比率 (下行风险调整) |
| **Win Rate** | 胜率 |
| **Max Drawdown** | 最大回撤 |

---

## 🏗️ 项目结构

```
open-alpha/
├── backend/
│   ├── main.py           # FastAPI应用入口
│   ├── api/routes.py     # API路由
│   ├── core/
│   │   ├── backtester.py     # 回测引擎
│   │   ├── factor_engine.py  # 因子计算
│   │   ├── data_loader.py    # 数据加载
│   │   └── config.py         # 配置管理
│   └── reports/          # 保存的报告
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DataExplorer.jsx    # 数据浏览
│   │   │   ├── FactorLab.jsx       # 因子研究
│   │   │   └── BacktestReport.jsx  # 报告排名
│   │   ├── components/     # 复用组件
│   │   └── services/       # API服务层
│   └── ...
│
└── data/                 # 市场数据 (feather格式)
```

---

## 🔧 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATA_DIR` | 市场数据路径 | `./data` |
| `REPORTS_DIR` | 报告保存路径 | `./backend/reports` |
| `LOG_LEVEL` | 日志级别 | `INFO` |
| `VITE_API_BASE_URL` | 后端API地址 | `http://localhost:8000/api` |

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">
  <p>为量化研究而生 ❤️</p>
  <p>如果觉得有帮助，请给个 ⭐ Star!</p>
</div>
