import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import DataExplorer from './pages/DataExplorer';
import FactorLab from './pages/FactorLab';
import FactorStrategy from './pages/FactorStrategy';
import BacktestReport from './pages/BacktestReport';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DataExplorer />} />
              <Route path="/factor-lab" element={<FactorLab />} />
              <Route path="/strategy" element={<FactorStrategy />} />
              <Route path="/report" element={<BacktestReport />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;

