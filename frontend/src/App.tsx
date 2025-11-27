import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DebuggerPage from './pages/DebuggerPage';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/debugger" element={<DebuggerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
