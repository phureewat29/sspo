import { Command } from "commander";
import { PromptOptimizer } from "./components/optimizer";
import { SPO_LLM } from "./utils/llmClient";

interface Args {
  optModel: string;
  optTemp: number;
  evalModel: string;
  evalTemp: number;
  execModel: string;
  execTemp: number;
  workspace: string;
  initialRound: number;
  maxRounds: number;
  template: string;
  name: string;
  mode: string;
}

function parseArgs(): Args {
  const program = new Command();

  program
    .name("sspo")
    .description("Self-Supervised Prompt Optimization CLI")
    .option("--opt-model <model>", "Model for optimization", "gpt-4o-mini")
    .option("--opt-temp <temperature>", "Temperature for optimization", "0.7")
    .option("--eval-model <model>", "Model for evaluation", "gpt-4o-mini")
    .option("--eval-temp <temperature>", "Temperature for evaluation", "0.3")
    .option("--exec-model <model>", "Model for execution", "gpt-4o-mini")
    .option("--exec-temp <temperature>", "Temperature for execution", "0")
    .option("--workspace <path>", "Path for optimized output", "workspace")
    .option("--initial-round <number>", "Initial round number", "1")
    .option("--max-rounds <number>", "Maximum number of rounds", "10")
    .option("--template <filename>", "Template file name", "Poem.yaml")
    .option("--name <name>", "Project name", "Poem")
    .option(
      "--mode <mode>",
      "Execution model mode: base_model or reasoning_model",
      "base_model"
    );

  program.parse();
  const options = program.opts();

  return {
    optModel: options.optModel,
    optTemp: parseFloat(options.optTemp),
    evalModel: options.evalModel,
    evalTemp: parseFloat(options.evalTemp),
    execModel: options.execModel,
    execTemp: parseFloat(options.execTemp),
    workspace: options.workspace,
    initialRound: parseInt(options.initialRound),
    maxRounds: parseInt(options.maxRounds),
    template: options.template,
    name: options.name,
    mode: options.mode,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();

  SPO_LLM.initialize(
    { model: args.optModel, temperature: args.optTemp },
    { model: args.evalModel, temperature: args.evalTemp },
    { model: args.execModel, temperature: args.execTemp },
    args.mode
  );

  const optimizer = new PromptOptimizer(
    args.workspace,
    args.initialRound,
    args.maxRounds,
    args.name,
    args.template
  );

  await optimizer.optimize();
}

if (require.main === module) {
  main().catch(console.error);
}
