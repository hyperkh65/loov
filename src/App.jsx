import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Board from './pages/Board';
import MarketAnalysis from './pages/MarketAnalysis';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board" element={<Board />} />
        <Route path="/market" element={<MarketAnalysis />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
