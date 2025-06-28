import { AsyncLLM, LLMsConfig, ChatMessage } from '../llm/asyncLlm';

export enum RequestType {
  OPTIMIZE = 'optimize',
  EVALUATE = 'evaluate',
  EXECUTE = 'execute'
}

export class SPO_LLM {
  private static _instance: SPO_LLM | null = null;
  
  private evaluateLlm: AsyncLLM;
  private optimizeLlm: AsyncLLM;
  private executeLlm: AsyncLLM;

  constructor(
    optimizeKwargs: { [key: string]: any },
    evaluateKwargs: { [key: string]: any },
    executeKwargs: { [key: string]: any },
    mode: string = 'base_model'
  ) {
    this.evaluateLlm = new AsyncLLM(this.loadLlmConfig(evaluateKwargs));
    this.optimizeLlm = new AsyncLLM(this.loadLlmConfig(optimizeKwargs));
    this.executeLlm = new AsyncLLM(this.loadLlmConfig(executeKwargs), undefined, mode);
  }

  private loadLlmConfig(kwargs: { [key: string]: any }): any {
    const model = kwargs.model;
    if (!model) {
      throw new Error("'model' parameter is required");
    }

    try {
      const modelConfig = LLMsConfig.default().get('gpt-4o-mini');
      if (!modelConfig) {
        throw new Error(`Model gpt-4o-mini not found in configuration`);
      }

      const config = { ...modelConfig };

      for (const [key, value] of Object.entries(kwargs)) {
        if (key in config) {
          (config as any)[key] = value;
        }
      }

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error loading configuration for model '${model}': ${error.message}`);
      }
      throw new Error(`Error loading configuration for model '${model}': Unknown error`);
    }
  }

  async responser(requestType: RequestType, messages: ChatMessage[]): Promise<string> {
    const llmMapping = {
      [RequestType.OPTIMIZE]: this.optimizeLlm,
      [RequestType.EVALUATE]: this.evaluateLlm,
      [RequestType.EXECUTE]: this.executeLlm
    };

    const llm = llmMapping[requestType];
    if (!llm) {
      const validTypes = Object.values(RequestType).join(', ');
      throw new Error(`Invalid request type. Valid types: ${validTypes}`);
    }

    const response = await llm.call(messages);
    return response;
  }

  static initialize(
    optimizeKwargs: { [key: string]: any },
    evaluateKwargs: { [key: string]: any },
    executeKwargs: { [key: string]: any },
    mode: string
  ): void {
    this._instance = new SPO_LLM(optimizeKwargs, evaluateKwargs, executeKwargs, mode);
  }

  static getInstance(): SPO_LLM {
    if (this._instance === null) {
      throw new Error('SPO_LLM not initialized. Call initialize() first.');
    }
    return this._instance;
  }
}

export function extractContent(xmlString: string, tag: string): string | null {
  const pattern = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
  const match = xmlString.match(pattern);
  return match ? match[1].trim() : null;
}
