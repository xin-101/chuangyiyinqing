import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import WritingWorkshop from './pages/WritingWorkshop';
import VisualWorkshop from './pages/VisualWorkshop';
import FusionCreation from './pages/FusionCreation';
import InspirationGraph from './pages/InspirationGraph';
import Projects from './pages/Projects';
import Collaboration from './pages/Collaboration';
import AdminConsole from './pages/AdminConsole';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/writing" element={<WritingWorkshop />} />
          <Route path="/visual" element={<VisualWorkshop />} />
          <Route path="/fusion" element={<FusionCreation />} />
          <Route path="/inspiration" element={<InspirationGraph />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/collaboration" element={<Collaboration />} />
          <Route path="/admin" element={<AdminConsole />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
