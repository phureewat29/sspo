# SSPO | Self-Supervised Prompt Optimization

A **Self-Supervised Prompt Optimization (SSPO)** system written in TypeScript. Achieves state-of-the-art performance with 17.8-90.9× higher cost efficiency than conventional methods.

## ✨ Features

- 💸 **Ultra-Low Cost** - $0.15 per task optimization
- 🏷️ **Zero Supervision** - No ground truth/human feedback required
- ⚡ **Universal Adaptation** - Closed & open-ended tasks supported
- 🔄 **Self-Evolving** - Auto-optimization via LLM-as-judge mechanism

## 🚀 Quick Start

**Note: The web interface has been deprecated. This project is now CLI-only for streamlined optimization workflows.**

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

### 2. Define Your Template 📝

Create a template file in `src/settings/task_name.yaml`:

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
  --template task-1.yaml \
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
  'workspace',    // Output directory
  1,             // Starting round
  10,            // Maximum optimization rounds
  'project-1',   // Project name
  'Poem.yaml'    // Template file
);

await optimizer.optimize();
```

### 4. View Results 📊

```
workspace/
  └── project-1/
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
├── utils/              # Utility modules
│   ├── llmClient.ts    # LLM interface and management
│   ├── dataUtils.ts    # Data handling and persistence
│   ├── promptUtils.ts  # Prompt file operations
│   ├── evaluationUtils.ts # Evaluation utilities
│   └── load.ts         # Configuration loading
├── llm/               # LLM implementations
│   └── asyncLlm.ts    # Async LLM client
├── prompts/           # Prompt templates
│   ├── optimizePrompt.ts
│   └── evaluatePrompt.ts
├── config/            # Configuration files
├── settings/          # Task templates
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

### Type Safety

The TypeScript implementation provides full type safety for:
- LLM configurations and responses
- Template data structures
- Optimization parameters
- API interfaces


## 🎯 Key Differences from Python Version

- **Type Safety**: Full TypeScript implementation with strong typing
- **Modern CLI**: Streamlined command-line interface for optimization workflows
- **Async/Await**: Native Promise-based async handling
- **Modular Design**: Clean separation of concerns with ES6 modules
- **Package Management**: npm/yarn ecosystem integration
- **Performance**: Node.js event loop for concurrent operations

## 📈 Performance & Cost Efficiency

self-supervised-prompt maintains the same ultra-low cost optimization as the original:
- **$0.15 per task optimization**
- **17.8-90.9× higher cost efficiency** than conventional methods
- **Zero supervision required**
- **Universal domain adaptation**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Original SPO (Python)](https://github.com/original-spo-repo) - Original Python implementation
- [SPO Paper](https://arxiv.org/pdf/2502.06855) - Research paper

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the [documentation](./docs)
- Review the [examples](./examples)

---

**self-supervised-prompt**: Bringing Self-Supervised Prompt Optimization to the modern TypeScript ecosystem! 🚀
