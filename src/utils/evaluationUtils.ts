import { QuickEvaluate, QuickExecute } from '../components/evaluator';
import { QAPair } from './dataUtils';

const EVALUATION_REPETITION = 4;

function countTokens(sample: any): number {
  if (!sample) {
    return 0;
  }
  // Simple token count approximation (in a real implementation, you'd use tiktoken equivalent)
  const text = JSON.stringify(sample.answers);
  return Math.ceil(text.length / 4); // Rough approximation: 1 token ≈ 4 characters
}

export class EvaluationUtils {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async executePrompt(optimizer: any, promptPath: string): Promise<any> {
    optimizer.prompt = await optimizer.promptUtils.loadPrompt(optimizer.round, promptPath);
    const executor = new QuickExecute(optimizer.prompt);

    const answers = await executor.promptExecute();
    const curRound = optimizer.round;

    const newData = {
      round: curRound,
      answers,
      prompt: optimizer.prompt
    };

    return newData;
  }

  async evaluatePrompt(
    optimizer: any,
    samples: any | null,
    newSamples: any,
    path: string,
    data: any[],
    initial: boolean = false
  ): Promise<[boolean, QAPair[]]> {
    const evaluator = new QuickEvaluate();
    const newToken = countTokens(newSamples);

    let succeed: boolean;
    
    if (initial === true) {
      succeed = true;
    } else {
      const evaluationResults: boolean[] = [];
      
      for (let i = 0; i < EVALUATION_REPETITION; i++) {
        const result = await evaluator.promptEvaluate(samples, newSamples);
        evaluationResults.push(result);
      }

      console.log(`Evaluation Results: ${evaluationResults}`);

      const trueCount = evaluationResults.filter(result => result === true).length;
      const falseCount = evaluationResults.filter(result => result === false).length;
      succeed = trueCount > falseCount;
    }

    const newData = optimizer.dataUtils.createResultData(
      newSamples.round,
      newSamples.answers,
      newSamples.prompt,
      succeed,
      newToken
    );

    data.push(newData);

    const resultPath = optimizer.dataUtils.getResultsFilePath(path);
    await optimizer.dataUtils.saveResults(resultPath, data);

    const answers = newSamples.answers;

    return [succeed, answers];
  }
}
