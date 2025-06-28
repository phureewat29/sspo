import * as fs from 'fs-extra';
import * as path from 'path';

export interface QAPair {
  question: string;
  answer: string;
}

export interface ResultData {
  round: number;
  answers: QAPair[];
  prompt: string;
  succeed: boolean;
  tokens: number;
  time: Date;
}

export class DataUtils {
  private rootPath: string;
  private topScores: any[] = [];

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.topScores = [];
  }

  async loadResults(dirPath: string): Promise<any[]> {
    const resultPath = this.getResultsFilePath(dirPath);
    
    if (await fs.pathExists(resultPath)) {
      try {
        const content = await fs.readFile(resultPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return [];
      }
    }
    
    return [];
  }

  async getBestRound(): Promise<any | null> {
    await this.loadScores();
    
    for (const entry of this.topScores) {
      if (entry.succeed) {
        return entry;
      }
    }
    
    return null;
  }

  getResultsFilePath(promptPath: string): string {
    return path.join(promptPath, 'results.json');
  }

  createResultData(
    round: number,
    answers: QAPair[],
    prompt: string,
    succeed: boolean,
    tokens: number
  ): ResultData {
    return {
      round,
      answers,
      prompt,
      succeed,
      tokens,
      time: new Date()
    };
  }

  async saveResults(jsonFilePath: string, data: any): Promise<void> {
    await fs.writeFile(jsonFilePath, JSON.stringify(data, null, 4), 'utf8');
  }

  private async loadScores(): Promise<void> {
    const roundsDir = path.join(this.rootPath, 'prompts');
    const resultFile = path.join(roundsDir, 'results.json');
    this.topScores = [];

    try {
      if (!(await fs.pathExists(resultFile))) {
        console.warn(`Results file not found at ${resultFile}`);
        return;
      }

      const content = await fs.readFile(resultFile, 'utf8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (const row of data) {
          this.topScores.push({
            round: row.round,
            succeed: row.succeed,
            prompt: row.prompt,
            answers: row.answers
          });
        }
      }

      this.topScores.sort((a, b) => b.round - a.round);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          console.error(`Could not find results file: ${resultFile}`);
        } else if (error.name === 'SyntaxError') {
          console.error(`Invalid JSON format in file: ${resultFile}`);
        } else {
          console.error(`Unexpected error loading scores: ${error.message}`);
        }
      }
    }
  }

  listToMarkdown(questionsList: QAPair[]): string {
    let markdownText = '```\n';

    for (let i = 0; i < questionsList.length; i++) {
      const qaPair = questionsList[i];
      const questionNum = i + 1;

      // Add question section
      markdownText += `Question ${questionNum}\n\n`;
      markdownText += `${qaPair.question}\n\n`;

      // Add answer section
      markdownText += `Answer ${questionNum}\n\n`;
      markdownText += `${qaPair.answer}\n\n`;

      // Add separator between QA pairs except for the last one
      if (i < questionsList.length - 1) {
        markdownText += '---\n\n';
      }
    }

    markdownText += '\n```';
    return markdownText;
  }
}
