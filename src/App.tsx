import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { BASENAME, useStaticRedirect } from "./utils/redirect";
import { Layout } from "./components/Layout";
import NotFound from "./pages/NotFound";

// Lazy load page components
const HomePage = lazy(() => import("./pages/Home"));

function AppPage() {
  useStaticRedirect();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <HomePage />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router basename={BASENAME}>
      <Layout>
        <AppPage />
      </Layout>
    </Router>
  );
}
