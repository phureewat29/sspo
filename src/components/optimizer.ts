import * as path from 'path';
import { PROMPT_OPTIMIZE_PROMPT } from '../prompts/optimizePrompt';
import { setFileName, loadMetaData } from '../utils/load';
import { DataUtils } from '../utils/dataUtils';
import { EvaluationUtils } from '../utils/evaluationUtils';
import { SPO_LLM, RequestType, extractContent } from '../utils/llmClient';
import { PromptUtils } from '../utils/promptUtils';

export class PromptOptimizer {
  private name: string;
  private rootPath: string;
  private topScores: any[] = [];
  private round: number;
  private maxRounds: number;
  private template: string;
  private prompt: string = '';

  public promptUtils: PromptUtils;
  public dataUtils: DataUtils;
  public evaluationUtils: EvaluationUtils;
  private llm: SPO_LLM;

  constructor(
    optimizedPath: string = '',
    initialRound: number = 1,
    maxRounds: number = 10,
    name: string = '',
    template: string = ''
  ) {
    this.name = name;
    this.rootPath = path.join(optimizedPath, this.name);
    this.topScores = [];
    this.round = initialRound;
    this.maxRounds = maxRounds;
    this.template = template;

    this.promptUtils = new PromptUtils(this.rootPath);
    this.dataUtils = new DataUtils(this.rootPath);
    this.evaluationUtils = new EvaluationUtils(this.rootPath);
    this.llm = SPO_LLM.getInstance();
  }

  async optimize(): Promise<void> {
    for (let optRound = 0; optRound < this.maxRounds; optRound++) {
      await this.optimizePrompt();
      this.round += 1;
    }

    await this.showFinalResult();
  }

  async showFinalResult(): Promise<void> {
    const bestRound = await this.dataUtils.getBestRound();

    console.log('\n' + '='.repeat(50));
    console.log('\n🏆 OPTIMIZATION COMPLETED - FINAL RESULTS 🏆\n');
    console.log(`\n📌 Best Performing Round: ${bestRound?.round}`);
    console.log(`\n🎯 Final Optimized Prompt:\n${bestRound?.prompt}`);
    console.log('\n' + '='.repeat(50) + '\n');
  }

  private async optimizePrompt(): Promise<string | void> {
    const promptPath = path.join(this.rootPath, 'prompts');
    setFileName(this.template);
    const data = await this.dataUtils.loadResults(promptPath);

    if (this.round === 1) {
      await this.handleFirstRound(promptPath, data);
      return;
    }

    const directory = await this.promptUtils.createRoundDirectory(promptPath, this.round);
    const newPrompt = await this.generateOptimizedPrompt();
    this.prompt = newPrompt;

    console.log(`\nRound ${this.round} Prompt: ${this.prompt}\n`);
    await this.promptUtils.writePrompt(directory, this.prompt);

    const [success, answers] = await this.evaluateNewPrompt(promptPath, data, directory);
    this.logOptimizationResult(success);

    return this.prompt;
  }

  private async handleFirstRound(promptPath: string, data: any[]): Promise<void> {
    console.log('\n⚡ RUNNING Round 1 PROMPT ⚡\n');
    const directory = await this.promptUtils.createRoundDirectory(promptPath, this.round);

    const [prompt] = await loadMetaData();
    this.prompt = prompt;
    await this.promptUtils.writePrompt(directory, this.prompt);

    const newSamples = await this.evaluationUtils.executePrompt(this, directory);
    const [, answers] = await this.evaluationUtils.evaluatePrompt(
      this,
      null,
      newSamples,
      promptPath,
      data,
      true
    );
    await this.promptUtils.writeAnswers(directory, answers);
  }

  private async generateOptimizedPrompt(): Promise<string> {
    const [, requirements, qa, count] = await loadMetaData();
    const samples = await this.dataUtils.getBestRound();

    console.log(`\n🚀Round ${this.round} OPTIMIZATION STARTING 🚀\n`);
    console.log(`\nSelecting prompt for round ${samples?.round} and advancing to the iteration phase\n`);

    const goldenAnswer = this.dataUtils.listToMarkdown(qa);
    const bestAnswer = this.dataUtils.listToMarkdown(samples?.answers || []);

    const optimizePrompt = PROMPT_OPTIMIZE_PROMPT
      .replace('{prompt}', samples?.prompt || '')
      .replace('{answers}', bestAnswer)
      .replace('{requirements}', requirements)
      .replace('{golden_answers}', goldenAnswer)
      .replace('{count}', count);

    const response = await this.llm.responser(
      RequestType.OPTIMIZE,
      [{ role: 'user', content: optimizePrompt }]
    );

    const modification = extractContent(response, 'modification');
    console.log(`Modification of ${this.round} round: ${modification}`);

    const prompt = extractContent(response, 'prompt');
    return prompt || '';
  }

  private async evaluateNewPrompt(
    promptPath: string,
    data: any[],
    directory: string
  ): Promise<[boolean, any[]]> {
    console.log('\n⚡ RUNNING OPTIMIZED PROMPT ⚡\n');
    const newSamples = await this.evaluationUtils.executePrompt(this, directory);

    console.log('\n📊 EVALUATING OPTIMIZED PROMPT 📊\n');
    const samples = await this.dataUtils.getBestRound();
    const [success, answers] = await this.evaluationUtils.evaluatePrompt(
      this,
      samples,
      newSamples,
      promptPath,
      data,
      false
    );

    await this.promptUtils.writeAnswers(directory, answers);
    return [success, answers];
  }

  private logOptimizationResult(success: boolean): void {
    console.log('\n🎯 OPTIMIZATION RESULT 🎯\n');
    console.log(`\nRound ${this.round} Optimization: ${success ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  }
}
