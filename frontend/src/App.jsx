import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InputModule from './pages/InputModule';
import EnrichmentView from './pages/EnrichmentView';
import ReportView from './pages/ReportView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analyze" element={<InputModule />} />
          <Route path="enrichment" element={<EnrichmentView />} />
          <Route path="reports" element={<ReportView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
