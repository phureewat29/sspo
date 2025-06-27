import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { QAPair } from './dataUtils';

let FILE_NAME = '';
const SAMPLE_K = 3;

export function setFileName(name: string): void {
  FILE_NAME = name;
}

export async function loadMetaData(k: number = SAMPLE_K): Promise<[string, string, QAPair[], string]> {
  // Load yaml file
  const configPath = path.join(__dirname, '..', 'settings', FILE_NAME);

  if (!(await fs.pathExists(configPath))) {
    throw new Error(`Configuration file '${FILE_NAME}' not found in settings directory`);
  }

  let data: any;
  try {
    const fileContent = await fs.readFile(configPath, 'utf8');
    data = yaml.load(fileContent) as any;
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`Error parsing YAML file '${FILE_NAME}': ${error.message}`);
    }
    throw new Error(`Error reading file '${FILE_NAME}': ${error}`);
  }

  const qa: QAPair[] = [];

  for (const item of data.qa) {
    const question = item.question;
    const answer = item.answer;
    qa.push({ question, answer });
  }

  const prompt = data.prompt;
  const requirements = data.requirements;
  let count = data.count;

  if (typeof count === 'number') {
    count = `, within ${count} words`;
  } else {
    count = '';
  }

  // Random sample from qa
  const randomQa = qa.length <= k ? qa : qa.sort(() => 0.5 - Math.random()).slice(0, k);

  return [prompt, requirements, randomQa, count];
}
