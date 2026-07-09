import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { AppLayout, FullPageLayout } from "@/components/layout/AppLayout";
import { useSettingsStore } from "@/stores/settings-store";

// Eager-loaded pages (always needed)
import { Dashboard } from "@/pages/Dashboard";

// Lazy-loaded pages for code splitting
const Welcome = lazy(() => import("@/pages/Welcome").then((m) => ({ default: m.Welcome })));
const DocumentLibrary = lazy(() => import("@/pages/DocumentLibrary").then((m) => ({ default: m.DocumentLibrary })));
const AIReader = lazy(() => import("@/pages/AIReader").then((m) => ({ default: m.AIReader })));
const EvidenceChain = lazy(() => import("@/pages/EvidenceChain").then((m) => ({ default: m.EvidenceChain })));
const ConflictRadar = lazy(() => import("@/pages/ConflictRadar").then((m) => ({ default: m.ConflictRadar })));
const ConsensusMap = lazy(() => import("@/pages/ConsensusMap").then((m) => ({ default: m.ConsensusMap })));
const DecisionBrief = lazy(() => import("@/pages/DecisionBrief").then((m) => ({ default: m.DecisionBrief })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Full page layout (no sidebar) */}
      <Route element={<FullPageLayout />}>
        <Route
          path="/welcome"
          element={
            <Suspense fallback={<PageLoader />}>
              <Welcome />
            </Suspense>
          }
        />
      </Route>

      {/* App layout with sidebar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/documents"
          element={
            <Suspense fallback={<PageLoader />}>
              <DocumentLibrary />
            </Suspense>
          }
        />
        <Route
          path="/reader"
          element={
            <Suspense fallback={<PageLoader />}>
              <AIReader />
            </Suspense>
          }
        />
        <Route
          path="/evidence"
          element={
            <Suspense fallback={<PageLoader />}>
              <EvidenceChain />
            </Suspense>
          }
        />
        <Route
          path="/conflicts"
          element={
            <Suspense fallback={<PageLoader />}>
              <ConflictRadar />
            </Suspense>
          }
        />
        <Route
          path="/consensus"
          element={
            <Suspense fallback={<PageLoader />}>
              <ConsensusMap />
            </Suspense>
          }
        />
        <Route
          path="/brief"
          element={
            <Suspense fallback={<PageLoader />}>
              <DecisionBrief />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { load } = useSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
