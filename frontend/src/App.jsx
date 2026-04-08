import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Library from "./pages/Library";
import PracticeRoom from "./pages/PracticeRoom";
import Performance from "./pages/Performance";
import Vibe from "./pages/Vibe";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/library"     element={<Library />} />
        <Route path="/practice"    element={<PracticeRoom />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/vibe"        element={<Vibe />} />
      </Routes>
    </BrowserRouter>
  );
}
