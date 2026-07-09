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
    groq: "https://api.groq.com/openai/v1",
    gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
    mistral: "https://api.mistral.ai/v1",
    together: "https://api.together.xyz/v1",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    glm: "https://open.bigmodel.cn/api/paas/v4",
    moonshot: "https://api.moonshot.cn/v1",
    siliconflow: "https://api.siliconflow.cn/v1",
    custom: settings.aiBaseUrl || "",
  };

  const defaultModelMap: Record<string, string> = {
    openai: "gpt-4o",
    deepseek: "deepseek-v4-pro",
    groq: "llama-3.3-70b-versatile",
    gemini: "gemini-2.0-flash",
    mistral: "mistral-large-latest",
    together: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    qwen: "qwen-plus",
    glm: "glm-4-plus",
    moonshot: "moonshot-v1-8k",
    siliconflow: "deepseek-ai/DeepSeek-V3",
  };

  const baseUrl = baseUrlMap[settings.aiProvider] || "";
  if (!baseUrl) return new MockProvider();

  return new OpenAICompatibleProvider(
    {
      apiKey: settings.aiApiKey,
      baseUrl,
      model: settings.aiModel || defaultModelMap[settings.aiProvider] || "gpt-4o",
    },
    settings.aiProvider,
    settings.aiProvider
  );
}

export function getAIProvider(): AIProvider {
  return createAIProvider();
}
