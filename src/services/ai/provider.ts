import type { AIProvider } from "./types";
import { MockProvider } from "./mock-provider";
import { OpenAICompatibleProvider } from "./openai-provider";
import { useSettingsStore } from "@/stores/settings-store";

export function createAIProvider(): AIProvider {
  const settings = useSettingsStore.getState().settings;

  // If no API key is set, use Mock provider
  if (!settings.aiApiKey || settings.aiProvider === "mock") {
    return new MockProvider();
  }

  const baseUrlMap: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    deepseek: "https://api.deepseek.com/v1",
    custom: settings.aiBaseUrl || "",
  };

  const baseUrl = baseUrlMap[settings.aiProvider] || baseUrlMap.deepseek;

  if (!baseUrl) {
    return new MockProvider();
  }

  return new OpenAICompatibleProvider(
    {
      apiKey: settings.aiApiKey,
      baseUrl,
      model: settings.aiModel || "deepseek-chat",
    },
    `${settings.aiProvider} provider`,
    settings.aiProvider
  );
}

export function getAIProvider(): AIProvider {
  return createAIProvider();
}
