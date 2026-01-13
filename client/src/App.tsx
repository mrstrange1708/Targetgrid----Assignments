import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LeadList from './pages/LeadList';
import LeadDetail from './pages/LeadDetail';
import RuleConfig from './pages/RuleConfig';
import EventUpload from './pages/EventUpload';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/leads" replace />} />
          <Route path="leads" element={<LeadList />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="rules" element={<RuleConfig />} />
          <Route path="upload" element={<EventUpload />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
export default App;
