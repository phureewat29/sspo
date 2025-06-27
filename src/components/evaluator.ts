import { EVALUATE_PROMPT } from "../prompts/evaluatePrompt";
import { loadMetaData } from "../utils/load";
import { SPO_LLM, RequestType, extractContent } from "../utils/llmClient";
import { QAPair } from "../utils/dataUtils";

export class QuickExecute {
  private prompt: string;
  private llm: SPO_LLM;

  constructor(prompt: string) {
    this.prompt = prompt;
    this.llm = SPO_LLM.getInstance();
  }

  async promptExecute(): Promise<QAPair[]> {
    const [, , qa] = await loadMetaData();
    const answers: QAPair[] = [];

    const fetchAnswer = async (q: string): Promise<QAPair> => {
      const messages = [
        { role: "user" as const, content: `${this.prompt}\n\n${q}` },
      ];
      try {
        const answer = await this.llm.responser(RequestType.EXECUTE, messages);
        return { question: q, answer };
      } catch (error) {
        return { question: q, answer: String(error) };
      }
    };

    const tasks = qa.map((item) => fetchAnswer(item.question));
    const results = await Promise.all(tasks);

    return results;
  }
}

export class QuickEvaluate {
  private llm: SPO_LLM;

  constructor() {
    this.llm = SPO_LLM.getInstance();
  }

  async promptEvaluate(samples: any, newSamples: any): Promise<boolean> {
    const [, requirement, qa] = await loadMetaData();

    let isSwapped = false;
    if (Math.random() < 0.5) {
      [samples, newSamples] = [newSamples, samples];
      isSwapped = true;
    }

    const messages = [
      {
        role: "user" as const,
        content: EVALUATE_PROMPT.replace("{requirement}", requirement)
          .replace("{sample}", JSON.stringify(samples))
          .replace("{new_sample}", JSON.stringify(newSamples))
          .replace("{answers}", JSON.stringify(qa)),
      },
    ];

    try {
      const response = await this.llm.responser(RequestType.EVALUATE, messages);
      const choose = extractContent(response, "choose");
      return isSwapped ? choose === "A" : choose === "B";
    } catch (error) {
      console.error("Evaluation error:", error);
      return false;
    }
  }
}
