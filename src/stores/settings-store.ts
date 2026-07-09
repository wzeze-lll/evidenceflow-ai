import { create } from "zustand";
import type { UserSettings } from "@/types";
import { db } from "@/db/database";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  aiProvider: "mock",
  aiApiKey: "",
  aiBaseUrl: "",
  aiModel: "deepseek-v4-pro",
  language: "zh",
  fontSize: "medium",
};

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<UserSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,

  load: async () => {
    try {
      const stored = await db.settings.get("user-settings");
      if (stored) {
        // Auto-fix: migrate old model names to valid ones
        if (stored.aiModel === "deepseek-chat" || stored.aiModel === "gpt-4o") {
          stored.aiModel = "deepseek-v4-pro";
          await db.settings.put({ id: "user-settings", ...stored } as any);
        }
        set({ settings: { ...DEFAULT_SETTINGS, ...stored }, loaded: true });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.settings.put({ id: "user-settings", ...DEFAULT_SETTINGS } as any);
        set({ settings: { ...DEFAULT_SETTINGS }, loaded: true });
      }
    } catch {
      set({ settings: { ...DEFAULT_SETTINGS }, loaded: true });
    }
  },

  update: async (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.settings.put({ id: "user-settings", ...updated } as any);
  },

  reset: async () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.settings.put({ id: "user-settings", ...DEFAULT_SETTINGS } as any);
  },
}));
