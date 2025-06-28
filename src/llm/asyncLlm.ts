import OpenAI from "openai";
import * as yaml from "js-yaml";
import * as fs from "fs-extra";

export interface LLMConfigOptions {
  model?: string;
  temperature?: number;
  key?: string;
  base_url?: string;
  top_p?: number;
  api_key?: string;
}

export class LLMConfig {
  public model: string;
  public temperature: number;
  public key: string;
  public base_url: string;
  public top_p: number;

  constructor(config: LLMConfigOptions) {
    this.model = config.model || "gpt-4o-mini";
    this.temperature = config.temperature || 1;
    this.key = config.key || config.api_key || "";
    this.base_url = config.base_url || "https://oneapi.deepwisdom.ai/v1";
    this.top_p = config.top_p || 1;
  }
}

export class LLMsConfig {
  private static _instance: LLMsConfig | null = null;
  private static _defaultConfig: LLMsConfig | null = null;
  private configs: { [key: string]: any } = {};

  constructor(configDict?: { [key: string]: any }) {
    this.configs = configDict || {};
  }

  static default(): LLMsConfig {
    if (this._defaultConfig === null) {
      const configPaths = [
        "src/config/config.yaml",
        "config/config.yaml",
        "config.yaml",
        "./src/config/config.yaml",
      ];

      let configFile: string | null = null;
      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          configFile = configPath;
          break;
        }
      }

      if (configFile === null) {
        throw new Error(
          "No default configuration file found in the expected locations"
        );
      }

      const configData = yaml.load(fs.readFileSync(configFile, "utf8")) as any;
      const models = configData.models || configData;

      this._defaultConfig = new LLMsConfig(models);
    }

    return this._defaultConfig;
  }

  get(llmName: string): LLMConfig {
    if (!(llmName in this.configs)) {
      throw new Error(`Configuration for ${llmName} not found`);
    }

    const config = this.configs[llmName];
    const llmConfig: LLMConfigOptions = {
      model: llmName,
      temperature: config.temperature || 1,
      key: config.api_key,
      base_url: config.base_url || "https://oneapi.deepwisdom.ai/v1",
      top_p: config.top_p || 1,
    };

    return new LLMConfig(llmConfig);
  }

  addConfig(name: string, config: any): void {
    this.configs[name] = config;
  }

  getAllNames(): string[] {
    return Object.keys(this.configs);
  }
}

export class ModelPricing {
  private static readonly PRICES: {
    [key: string]: { input: number; output: number };
  } = {
    "gpt-4o": { input: 0.0025, output: 0.01 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gpt-4o-mini-2024-07-18": { input: 0.00015, output: 0.0006 },
    "gpt-4.1": { input: 0.002, output: 0.008 },
    "gpt-4.1-mini": { input: 0.0004, output: 0.0016 },
    "gpt-4.1-nano": { input: 0.0001, output: 0.0004 },
  };

  static getPrice(modelName: string, tokenType: "input" | "output"): number {
    if (modelName in this.PRICES) {
      return this.PRICES[modelName][tokenType];
    }

    for (const key in this.PRICES) {
      if (modelName.includes(key)) {
        return this.PRICES[key][tokenType];
      }
    }

    return 0;
  }
}

export interface UsageRecord {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  prices: {
    input_price: number;
    output_price: number;
  };
}

export class TokenUsageTracker {
  public totalInputTokens = 0;
  public totalOutputTokens = 0;
  public totalCost = 0;
  public usageHistory: UsageRecord[] = [];

  addUsage(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): UsageRecord {
    const inputCost =
      (inputTokens / 1000) * ModelPricing.getPrice(model, "input");
    const outputCost =
      (outputTokens / 1000) * ModelPricing.getPrice(model, "output");
    const totalCost = inputCost + outputCost;

    const usageRecord: UsageRecord = {
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: totalCost,
      prices: {
        input_price: ModelPricing.getPrice(model, "input"),
        output_price: ModelPricing.getPrice(model, "output"),
      },
    };

    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalCost += totalCost;
    this.usageHistory.push(usageRecord);

    return usageRecord;
  }

  getSummary() {
    return {
      total_input_tokens: this.totalInputTokens,
      total_output_tokens: this.totalOutputTokens,
      total_tokens: this.totalInputTokens + this.totalOutputTokens,
      total_cost: this.totalCost,
      call_count: this.usageHistory.length,
      history: this.usageHistory,
    };
  }
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class AsyncLLM {
  private config: LLMConfig;
  private client: OpenAI;
  private sysMsg: string | null;
  private usageTracker: TokenUsageTracker;
  private mode: string;

  constructor(
    config: LLMConfig | string,
    systemMsg?: string,
    mode: string = "base_model"
  ) {
    if (typeof config === "string") {
      const llmName = config;
      this.config = LLMsConfig.default().get(llmName);
    } else {
      this.config = config;
    }

    this.client = new OpenAI({
      apiKey: this.config.key,
      baseURL: this.config.base_url,
    });

    this.sysMsg = systemMsg || null;
    this.usageTracker = new TokenUsageTracker();
    this.mode = mode;
  }

  async call(messages: ChatMessage[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages:
        messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: this.config.temperature,
      top_p: this.config.top_p,
    });

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    const usageRecord = this.usageTracker.addUsage(
      this.config.model,
      inputTokens,
      outputTokens
    );

    let ret: string;
    if (this.mode === "reasoning_model") {
      try {
        // Type assertion for reasoning content (may not exist in all models)
        const responseWithReasoning = response.choices[0]?.message as any;
        if (responseWithReasoning.reasoning_content) {
          ret = `Thought:\n${responseWithReasoning.reasoning_content}\n Answer:\n${response.choices[0]?.message.content}`;
          console.log(ret);
        } else {
          console.log(
            "The 'reasoning content' field is missing from the model. Please check the parameters."
          );
          ret = response.choices[0]?.message.content || "";
        }
      } catch (error) {
        console.log(
          "The 'reasoning content' field is missing from the model. Please check the parameters."
        );
        ret = response.choices[0]?.message.content || "";
      }
    } else {
      ret = response.choices[0]?.message.content || "";
    }

    console.log(
      `Token usage: ${inputTokens} input + ${outputTokens} output = ${
        inputTokens + outputTokens
      } total`
    );
    console.log(
      `Cost: $${usageRecord.total_cost.toFixed(
        6
      )} ($${usageRecord.input_cost.toFixed(
        6
      )} for input, $${usageRecord.output_cost.toFixed(6)} for output)`
    );

    return ret;
  }

  getUsageSummary() {
    return this.usageTracker.getSummary();
  }
}

export function createLLMInstance(
  llmConfig: LLMConfig | string | LLMConfigOptions
): AsyncLLM {
  if (llmConfig instanceof LLMConfig) {
    return new AsyncLLM(llmConfig);
  } else if (typeof llmConfig === "string") {
    return new AsyncLLM(llmConfig);
  } else if (typeof llmConfig === "object") {
    const config = new LLMConfig(llmConfig);
    return new AsyncLLM(config);
  } else {
    throw new TypeError(
      "llmConfig must be an LLMConfig instance, a string, or an object"
    );
  }
}
