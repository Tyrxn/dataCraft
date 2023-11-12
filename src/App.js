import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './views/Home';
import Options from './views/Options';
import AugmentImages from './views/AugmentImages';
import ColourManipulation from './views/ColourManipulation';
import ResizeImages from './views/ResizeImages';
import CompositeImages from './views/CompositeImages';
import Results from './views/Results';
import Donate from './views/Donate';

function App() {
  return (
    <Router>
          <div className="min-h-screen py-20 px-80 bg-gradient-to-r from-blue-300 to-red-400 font-sans">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/options" element={<Options />} />
              <Route path="/augment-images" element={<AugmentImages />} />
              <Route path="/colour-manipulation" element={<ColourManipulation />} />
              <Route path="/resize-images" element={<ResizeImages />} />
              <Route path="/composite-images" element={<CompositeImages />} />
              <Route path="/results" element={<Results />} />
              <Route path="/donate" element={<Donate />} />
            </Routes>
          </div>
    </Router>
  );
}

export default App;
