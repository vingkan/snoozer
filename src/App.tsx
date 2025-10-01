import { lazy, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/app/layout";
import { LoadingPage } from "./components/app/loading";
import { BASENAME, useStaticRedirect } from "./lib/redirect";
import NotFoundPage from "./pages/notfound";

const HomePage = lazy(() => import("./pages/index"));
const ExamplePage = lazy(() => import("./pages/example"));

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function AppPages() {
  useStaticRedirect();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoadingPage>
            <HomePage />
          </LoadingPage>
        }
      />
      <Route
        path="/example"
        element={
          <LoadingPage>
            <ExamplePage />
          </LoadingPage>
        }
      />
      <Route
        path="*"
        element={
          <LoadingPage>
            <NotFoundPage />
          </LoadingPage>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router basename={BASENAME}>
      <Providers>
        <Layout>
          <AppPages />
        </Layout>
      </Providers>
    </Router>
  );
}
