import express from "express";
import * as fs from "fs-extra";
import * as path from "path";
import * as yaml from "js-yaml";
import { PromptOptimizer } from "./components/optimizer";
import { SPO_LLM, RequestType } from "./utils/llmClient";
import { QAPair } from "./utils/dataUtils";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

interface TemplateData {
  prompt: string;
  requirements: string;
  count: number | null;
  qa: QAPair[];
}

async function loadYamlTemplate(templatePath: string): Promise<TemplateData> {
  if (await fs.pathExists(templatePath)) {
    const content = await fs.readFile(templatePath, "utf8");
    return yaml.load(content) as TemplateData;
  }

  return {
    prompt: "",
    requirements: "",
    count: null,
    qa: [{ question: "", answer: "" }],
  };
}

async function saveYamlTemplate(
  templatePath: string,
  data: TemplateData
): Promise<void> {
  const templateFormat = {
    prompt: data.prompt || "",
    requirements: data.requirements || "",
    count: data.count,
    qa: data.qa.map((qa) => ({
      question: qa.question.trim(),
      answer: qa.answer.trim(),
    })),
  };

  await fs.ensureDir(path.dirname(templatePath));
  await fs.writeFile(
    templatePath,
    yaml.dump(templateFormat, {
      sortKeys: false,
      indent: 2,
    }),
    "utf8"
  );
}

// API Routes

app.get("/api/templates", async (req, res) => {
  try {
    const settingsPath = path.join(__dirname, "settings");
    const files = await fs.readdir(settingsPath);
    const templates = files
      .filter((file) => file.endsWith(".yaml"))
      .map((file) => path.basename(file, ".yaml"));

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to load templates" });
  }
});

app.get("/api/templates/:name", async (req, res) => {
  try {
    const templatePath = path.join(
      __dirname,
      "settings",
      `${req.params.name}.yaml`
    );
    const template = await loadYamlTemplate(templatePath);
    res.json(template);
  } catch (error) {
    res.status(404).json({ error: "Template not found" });
  }
});

app.post("/api/templates/:name", async (req, res) => {
  try {
    const templatePath = path.join(
      __dirname,
      "settings",
      `${req.params.name}.yaml`
    );
    await saveYamlTemplate(templatePath, req.body);
    res.json({ message: "Template saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save template" });
  }
});

app.post("/api/optimize", async (req, res) => {
  try {
    const {
      optModel = "gpt-4o-mini",
      optTemp = 0.7,
      evalModel = "gpt-4o-mini",
      evalTemp = 0.3,
      execModel = "gpt-4o-mini",
      execTemp = 0,
      initialRound = 1,
      maxRounds = 10,
      templateName,
      projectName,
      mode = "base_model",
    } = req.body;

    // Initialize LLM
    SPO_LLM.initialize(
      { model: optModel, temperature: optTemp },
      { model: evalModel, temperature: evalTemp },
      { model: execModel, temperature: execTemp },
      mode
    );

    // Create optimizer
    const optimizer = new PromptOptimizer(
      "workspace",
      initialRound,
      maxRounds,
      projectName,
      `${templateName}.yaml`
    );

    // Run optimization in background
    optimizer.optimize().catch(console.error);

    res.json({ message: "Optimization started" });
  } catch (error) {
    res.status(500).json({ error: "Failed to start optimization" });
  }
});

app.post("/api/test-prompt", async (req, res) => {
  try {
    const {
      prompt,
      question,
      model = "gpt-4o-mini",
      temperature = 0.3,
    } = req.body;

    SPO_LLM.initialize(
      { model, temperature },
      { model, temperature },
      { model, temperature },
      "base_model"
    );

    const llm = SPO_LLM.getInstance();
    const messages = [
      { role: "user" as const, content: `${prompt}\n\n${question}` },
    ];

    const response = await llm.responser(RequestType.EXECUTE, messages);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// Serve basic HTML page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SPO | Self-Supervised Prompt Optimization</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          .section { margin: 20px 0; }
          textarea { width: 100%; height: 100px; }
          button { padding: 10px 20px; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 SPO | Self-Supervised Prompt Optimization</h1>
          <p>Welcome to the TypeScript implementation of SPO!</p>

          <div class="section">
            <h2>Quick Start</h2>
            <p>Use the API endpoints to interact with the optimizer:</p>
            <ul>
              <li><code>GET /api/templates</code> - List available templates</li>
              <li><code>GET /api/templates/:name</code> - Get template details</li>
              <li><code>POST /api/templates/:name</code> - Save template</li>
              <li><code>POST /api/optimize</code> - Start optimization</li>
              <li><code>POST /api/test-prompt</code> - Test a prompt</li>
            </ul>
          </div>

          <div class="section">
            <h2>Command Line Usage</h2>
            <pre><code>npm run optimize -- --template Poem.yaml --name project-1 --max-rounds 5</code></pre>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 sspo server running on http://localhost:${PORT}`);
});
