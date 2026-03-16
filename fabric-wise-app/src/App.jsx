import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import FabricLibrary from './pages/FabricLibrary';
import FabricDetail from './pages/FabricDetail';
import Scanner from './pages/Scanner';
import BrandDirectory from './pages/BrandDirectory';
import Community from './pages/Community';
import HealthInsights from './pages/HealthInsights';
import Premium from './pages/Premium';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Navbar />
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
        </Routes>
      </main>
    </div>
  );
}
