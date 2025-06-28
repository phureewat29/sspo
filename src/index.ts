#!/usr/bin/env node

import { PromptOptimizer } from "./components/optimizer";
import { SPO_LLM } from "./utils/llmClient";

export { PromptOptimizer, SPO_LLM };
export * from "./utils/dataUtils";
export * from "./utils/llmClient";
export * from "./components/evaluator";

// Simple example usage
async function example() {
  console.log("🤖 SPO TypeScript Implementation");
  console.log("");
  console.log("Example usage:");
  console.log("");
  console.log("1. Command Line:");
  console.log("   npm run optimize -- --template Poem.yaml --name project-1");
  console.log("");
  console.log("2. Programmatic:");
  console.log(`
import { SPO_LLM, PromptOptimizer } from 'sspo';

// Initialize LLM
SPO_LLM.initialize(
  { model: 'gpt-4o-mini', temperature: 0.7 },
  { model: 'gpt-4o-mini', temperature: 0.3 },
  { model: 'gpt-4o-mini', temperature: 0 },
  'base_model'
);

// Create optimizer
const optimizer = new PromptOptimizer(
  'workspace',  // Output directory
  1,           // Initial round
  10,          // Max rounds
  'project-1', // Project name
  'Poem.yaml'  // Template file
);

// Run optimization
await optimizer.optimize();
  `);
}

if (require.main === module) {
  example();
}
