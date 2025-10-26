import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./dashboard";
import NotFound from "./notfound";
import LoginPage from "./Login";
import OnBoardingPage from "./Onboarding";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnBoardingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
