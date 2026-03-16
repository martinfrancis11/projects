import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import OnboardingModal from './components/OnboardingModal';
import Home from './pages/Home';
import FabricLibrary from './pages/FabricLibrary';
import FabricDetail from './pages/FabricDetail';
import Scanner from './pages/Scanner';
import BrandDirectory from './pages/BrandDirectory';
import Community from './pages/Community';
import HealthInsights from './pages/HealthInsights';
import Premium from './pages/Premium';
import ScanHistory from './pages/ScanHistory';
import './App.css';

export default function App() {
  const [showHelp, setShowHelp] = useState(false);

  const openHelp = () => {
    localStorage.removeItem('fw_onboarding_done');
    setShowHelp(true);
  };

  const closeHelp = () => {
    localStorage.setItem('fw_onboarding_done', '1');
    setShowHelp(false);
  };

  return (
    <div className="app">
      <Navbar onHelp={openHelp} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fabrics" element={<FabricLibrary />} />
          <Route path="/fabrics/:id" element={<FabricDetail />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/brands" element={<BrandDirectory />} />
          <Route path="/community" element={<Community />} />
          <Route path="/health" element={<HealthInsights />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/history" element={<ScanHistory />} />
        </Routes>
      </main>
      <OnboardingModal key={showHelp} onClose={closeHelp} />
    </div>
  );
}
