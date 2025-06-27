"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataUtils = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class DataUtils {
    constructor(rootPath) {
        this.topScores = [];
        this.rootPath = rootPath;
        this.topScores = [];
    }
    loadResults(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const resultPath = this.getResultsFilePath(dirPath);
            if (yield fs.pathExists(resultPath)) {
                try {
                    const content = yield fs.readFile(resultPath, 'utf8');
                    return JSON.parse(content);
                }
                catch (error) {
                    console.error('Error parsing JSON:', error);
                    return [];
                }
            }
            return [];
        });
    }
    getBestRound() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadScores();
            for (const entry of this.topScores) {
                if (entry.succeed) {
                    return entry;
                }
            }
            return null;
        });
    }
    getResultsFilePath(promptPath) {
        return path.join(promptPath, 'results.json');
    }
    createResultData(round, answers, prompt, succeed, tokens) {
        return {
            round,
            answers,
            prompt,
            succeed,
            tokens,
            time: new Date()
        };
    }
    saveResults(jsonFilePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.writeFile(jsonFilePath, JSON.stringify(data, null, 4), 'utf8');
        });
    }
    loadScores() {
        return __awaiter(this, void 0, void 0, function* () {
            const roundsDir = path.join(this.rootPath, 'prompts');
            const resultFile = path.join(roundsDir, 'results.json');
            this.topScores = [];
            try {
                if (!(yield fs.pathExists(resultFile))) {
                    console.warn(`Results file not found at ${resultFile}`);
                    return;
                }
                const content = yield fs.readFile(resultFile, 'utf8');
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
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes('ENOENT')) {
                        console.error(`Could not find results file: ${resultFile}`);
                    }
                    else if (error.name === 'SyntaxError') {
                        console.error(`Invalid JSON format in file: ${resultFile}`);
                    }
                    else {
                        console.error(`Unexpected error loading scores: ${error.message}`);
                    }
                }
            }
        });
    }
    listToMarkdown(questionsList) {
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
exports.DataUtils = DataUtils;
