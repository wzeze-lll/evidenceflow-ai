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
    claude: "https://api.anthropic.com/v1",
    gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
    groq: "https://api.groq.com/openai/v1",
    mistral: "https://api.mistral.ai/v1",
    together: "https://api.together.xyz/v1",
    openrouter: "https://openrouter.ai/api/v1",
    siliconflow: "https://api.siliconflow.cn/v1",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    glm: "https://open.bigmodel.cn/api/paas/v4",
    moonshot: "https://api.moonshot.cn/v1",
    doubao: "https://ark.cn-beijing.volces.com/api/v3",
    minimax: "https://api.minimax.chat/v1",
    stepfun: "https://api.stepfun.com/v1",
    modelscope: "https://api-inference.modelscope.cn/v1",
    baidu: "https://qianfan.baidubce.com/v2",
    nvidia: "https://integrate.api.nvidia.com/v1",
    github: "https://api.githubcopilot.com",
    custom: settings.aiBaseUrl || "",
  };

  const defaultModelMap: Record<string, string> = {
    openai: "gpt-4o",
    deepseek: "deepseek-v4-pro",
    claude: "claude-sonnet-4-20250514",
    gemini: "gemini-2.0-flash",
    groq: "llama-3.3-70b-versatile",
    mistral: "mistral-large-latest",
    together: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    openrouter: "anthropic/claude-sonnet-4",
    siliconflow: "deepseek-ai/DeepSeek-V3",
    qwen: "qwen-plus",
    glm: "glm-4-plus",
    moonshot: "moonshot-v1-8k",
    doubao: "doubao-pro-32k",
    minimax: "abab6.5s-chat",
    stepfun: "step-2-16k",
    modelscope: "qwen/Qwen2.5-72B-Instruct",
    baidu: "ernie-4.0-8k",
    nvidia: "meta/llama-3.3-70b-instruct",
    github: "gpt-4o",
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
