import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import Loading from "./components/common/Loading";

// Lazy load pages
const Landing = lazy(() => import("./pages/Landing"));
const YouTube = lazy(() => import("./pages/YouTube"));
const Facebook = lazy(() => import("./pages/Facebook"));
const Instagram = lazy(() => import("./pages/Instagram"));
const TikTok = lazy(() => import("./pages/TikTok"));
const Twitter = lazy(() => import("./pages/Twitter"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ContactUs = lazy(() => import("./pages/ContactUs"));

function App() {
  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                style: {
                  background: "#10b981",
                },
              },
              error: {
                style: {
                  background: "#ef4444",
                },
              },
            }}
          />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="youtube" element={<YouTube />} />
                <Route path="facebook" element={<Facebook />} />
                <Route path="instagram" element={<Instagram />} />
                <Route path="tiktok" element={<TikTok />} />
                <Route path="twitter" element={<Twitter />} />
              </Route>
              {/* Standalone pages with their own Header/Footer */}
              <Route path="about" element={<AboutUs />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="contact" element={<ContactUs />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
