import { create } from "zustand";
import type { Document, Workspace, ActivityLog } from "@/types";
import { db } from "@/db/database";

interface AppState {
  workspaces: Workspace[];
  recentDocuments: Document[];
  activityLogs: ActivityLog[];
  loaded: boolean;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  evidenceDrawerOpen: boolean;
  evidenceDrawerData: { claimId?: string; evidenceId?: string } | null;
  readerDocId: string | null;

  loadDashboard: () => Promise<void>;
  setReaderDocId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openEvidenceDrawer: (data: { claimId?: string; evidenceId?: string }) => void;
  closeEvidenceDrawer: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  workspaces: [],
  recentDocuments: [],
  activityLogs: [],
  loaded: false,
  sidebarOpen: true,
  commandPaletteOpen: false,
  evidenceDrawerOpen: false,
  evidenceDrawerData: null,
  readerDocId: null,

  loadDashboard: async () => {
    try {
      const [workspaces, documents, logs] = await Promise.all([
        db.workspaces.toArray(),
        db.documents.orderBy("updatedAt").reverse().limit(10).toArray(),
        db.activityLogs.orderBy("timestamp").reverse().limit(20).toArray(),
      ]);
      set({
        workspaces,
        recentDocuments: documents,
        activityLogs: logs,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  openEvidenceDrawer: (data) => set({ evidenceDrawerOpen: true, evidenceDrawerData: data }),
  closeEvidenceDrawer: () => set({ evidenceDrawerOpen: false, evidenceDrawerData: null }),
  setReaderDocId: (id) => set({ readerDocId: id }),
}));
