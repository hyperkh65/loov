import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Board from './pages/Board';
import MarketAnalysis from './pages/MarketAnalysis';
import ProductIntel from './pages/ProductIntel';
import ProcurementIntel from './pages/ProcurementIntel';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board" element={<Board />} />
        <Route path="/market" element={<MarketAnalysis />} />
        <Route path="/intel" element={<ProductIntel />} />
        <Route path="/procurement" element={<ProcurementIntel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
