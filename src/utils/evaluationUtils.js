"use strict";
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
exports.EvaluationUtils = void 0;
const evaluator_1 = require("../components/evaluator");
const EVALUATION_REPETITION = 4;
function countTokens(sample) {
    if (!sample) {
        return 0;
    }
    // Simple token count approximation (in a real implementation, you'd use tiktoken equivalent)
    const text = JSON.stringify(sample.answers);
    return Math.ceil(text.length / 4); // Rough approximation: 1 token ≈ 4 characters
}
class EvaluationUtils {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    executePrompt(optimizer, promptPath) {
        return __awaiter(this, void 0, void 0, function* () {
            optimizer.prompt = yield optimizer.promptUtils.loadPrompt(optimizer.round, promptPath);
            const executor = new evaluator_1.QuickExecute(optimizer.prompt);
            const answers = yield executor.promptExecute();
            const curRound = optimizer.round;
            const newData = {
                round: curRound,
                answers,
                prompt: optimizer.prompt
            };
            return newData;
        });
    }
    evaluatePrompt(optimizer_1, samples_1, newSamples_1, path_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (optimizer, samples, newSamples, path, data, initial = false) {
            const evaluator = new evaluator_1.QuickEvaluate();
            const newToken = countTokens(newSamples);
            let succeed;
            if (initial === true) {
                succeed = true;
            }
            else {
                const evaluationResults = [];
                for (let i = 0; i < EVALUATION_REPETITION; i++) {
                    const result = yield evaluator.promptEvaluate(samples, newSamples);
                    evaluationResults.push(result);
                }
                console.log(`Evaluation Results: ${evaluationResults}`);
                const trueCount = evaluationResults.filter(result => result === true).length;
                const falseCount = evaluationResults.filter(result => result === false).length;
                succeed = trueCount > falseCount;
            }
            const newData = optimizer.dataUtils.createResultData(newSamples.round, newSamples.answers, newSamples.prompt, succeed, newToken);
            data.push(newData);
            const resultPath = optimizer.dataUtils.getResultsFilePath(path);
            yield optimizer.dataUtils.saveResults(resultPath, data);
            const answers = newSamples.answers;
            return [succeed, answers];
        });
    }
}
exports.EvaluationUtils = EvaluationUtils;
