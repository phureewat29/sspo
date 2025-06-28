# SSPO | Self-Supervised Prompt Optimization

A **Self-Supervised Prompt Optimization (SSPO)**  implemented in TypeScript. [Research Paper](https://arxiv.org/pdf/2502.06855)

## ✨ Features

- 🏷️ **Zero Supervision** - No ground truth/human feedback required
- ⚡ **Universal Adaptation** - Closed & open-ended tasks supported
- 🔄 **Self-Evolving** - Auto-optimization via LLM-as-judge mechanism

## 🚀 Quick Start

### Prerequisites

- Node.js
- npm
- OpenAI API key

### Installation

```bash
npm install
npm run build
```

### 1. Configure Your API Key ⚙️

Configure LLM parameters in `src/config/config.yaml`:

```yaml
models:
  gpt-4o-mini:
    api_key: "your-api-key-here"
    base_url: "https://api.openai.com/v1"
    temperature: 1
    top_p: 1
```

### 2. Define Your Task 📝

Create a template file in `src/settings/template.yaml`:

```yaml
prompt: |
  Please solve the following problem.

requirements: |
  Generate more detailed explanations and use clear reasoning steps.

count: 50

qa:
  - question: |
      What is 2 + 2?
    answer: |
      4

  - question: |
      Explain photosynthesis.
    answer: |
      Photosynthesis is the process by which plants convert sunlight into energy...
```

### 3. Run Optimization 🔧

#### Option 1: Command Line Interface

```bash
# Basic usage
npm run optimize

# With custom parameters
npm run optimize -- \
  --template template.yaml \
  --name project-1 \
  --max-rounds 5 \
  --opt-model gpt-4o-mini \
  --eval-model gpt-4o-mini
```

Available options:
```bash
--opt-model            Model for optimization (default: gpt-4o-mini)
--opt-temp             Temperature for optimization (default: 0.7)
--eval-model           Model for evaluation (default: gpt-4o-mini)
--eval-temp            Temperature for evaluation (default: 0.3)
--exec-model           Model for execution (default: gpt-4o-mini)
--exec-temp            Temperature for execution (default: 0)
--workspace            Output directory path (default: workspace)
--initial-round        Initial round number (default: 1)
--max-rounds           Maximum number of rounds (default: 10)
--template             Template file name (default: Poem.yaml)
--name                 Project name (default: Poem)
--mode                 Execution model mode: base_model or reasoning_model (default: base_model)
```

#### Option 2: Programmatic Usage

```typescript
import { SPO_LLM, PromptOptimizer } from './src';

// Initialize LLM settings
SPO_LLM.initialize(
  { model: 'gpt-4o-mini', temperature: 0.7 },
  { model: 'gpt-4o-mini', temperature: 0.3 },
  { model: 'gpt-4o-mini', temperature: 0 },
  'base_model'
);

// Create and run optimizer
const optimizer = new PromptOptimizer(
  'workspace',   // Output directory
  1,             // Starting round
  10,            // Maximum optimization rounds
  'poem',   // Project name
  'Poem.yaml'    // Template file
);

await optimizer.optimize();
```

### 4. View Results 📊

```
workspace/
  └── poem/
      └── prompts/
          ├── results.json
          ├── round_1/
          │   ├── answers.txt
          │   └── prompt.txt
          ├── round_2/
          │   ├── answers.txt
          │   └── prompt.txt
          └── ...
```

- `results.json`: Optimization history and success metrics
- `prompt.txt`: Optimized prompt for each round
- `answers.txt`: Generated outputs using the prompt

## 🛠️ Development

### Project Structure

```
src/
├── components/          # Core optimization components
│   ├── optimizer.ts     # Main PromptOptimizer class
│   └── evaluator.ts     # Evaluation logic
├── utils/               # Utility modules
│   ├── llmClient.ts     # LLM interface and management
│   ├── dataUtils.ts     # Data handling and persistence
│   ├── promptUtils.ts   # Prompt file operations
│   ├── evaluationUtils.ts # Evaluation utilities
│   └── load.ts          # Configuration loading
├── llm/                 # LLM implementations
│   └── asyncLlm.ts      # Async LLM client
├── prompts/             # Prompt templates
│   ├── optimizePrompt.ts
│   └── evaluatePrompt.ts
├── config/            # Configuration files
├── settings/         # Task templates
├── optimize.ts       # CLI interface
└── index.ts          # Main entry point
```

### Available Scripts

```bash
npm run build      # Compile TypeScript
npm run start      # Run compiled application
npm run dev        # Run with ts-node (development)
npm run optimize   # Run CLI optimizer
npm run clean      # Clean build directory
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
