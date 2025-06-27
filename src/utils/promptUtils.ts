import * as fs from 'fs-extra';
import * as path from 'path';
import { QAPair } from './dataUtils';

export class PromptUtils {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async createRoundDirectory(promptPath: string, roundNumber: number): Promise<string> {
    const directory = path.join(promptPath, `round_${roundNumber}`);
    await fs.ensureDir(directory);
    return directory;
  }

  async loadPrompt(roundNumber: number, promptsPath: string): Promise<string> {
    const promptFile = path.join(promptsPath, 'prompt.txt');

    try {
      return await fs.readFile(promptFile, 'utf8');
    } catch (error) {
      console.error(`Error loading prompt for round ${roundNumber}:`, error);
      throw error;
    }
  }

  async writeAnswers(directory: string, answers: QAPair[], name: string = 'answers.txt'): Promise<void> {
    const answersFile = path.join(directory, name);
    let content = '';

    for (const item of answers) {
      content += `Question:\n${item.question}\n`;
      content += `Answer:\n${item.answer}\n`;
      content += '\n';
    }

    await fs.writeFile(answersFile, content, 'utf8');
  }

  async writePrompt(directory: string, prompt: string): Promise<void> {
    const promptFile = path.join(directory, 'prompt.txt');
    await fs.writeFile(promptFile, prompt, 'utf8');
  }
}
