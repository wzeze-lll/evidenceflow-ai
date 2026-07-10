import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSettingsStore } from "@/stores/settings-store";

// Eager-loaded pages (always needed)
import { Dashboard } from "@/pages/Dashboard";
import { Welcome } from "@/pages/Welcome";

// Lazy-loaded pages for code splitting
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
        加载中...
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* App layout with sidebar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/dashboard" element={<Dashboard />} />
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

      {/* 404 catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground/30 mb-4">404</h1>
        <p className="text-lg font-medium mb-2">页面未找到</p>
        <p className="text-sm text-muted-foreground">你访问的页面不存在或已被移除。</p>
      </div>
    </div>
  );
}

export default function App() {
  const { load } = useSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
