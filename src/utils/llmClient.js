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
exports.SPO_LLM = exports.RequestType = void 0;
exports.extractContent = extractContent;
const asyncLlm_1 = require("../llm/asyncLlm");
var RequestType;
(function (RequestType) {
    RequestType["OPTIMIZE"] = "optimize";
    RequestType["EVALUATE"] = "evaluate";
    RequestType["EXECUTE"] = "execute";
})(RequestType || (exports.RequestType = RequestType = {}));
class SPO_LLM {
    constructor(optimizeKwargs, evaluateKwargs, executeKwargs, mode = 'base_model') {
        this.evaluateLlm = new asyncLlm_1.AsyncLLM(this.loadLlmConfig(evaluateKwargs));
        this.optimizeLlm = new asyncLlm_1.AsyncLLM(this.loadLlmConfig(optimizeKwargs));
        this.executeLlm = new asyncLlm_1.AsyncLLM(this.loadLlmConfig(executeKwargs), undefined, mode);
    }
    loadLlmConfig(kwargs) {
        const model = kwargs.model;
        if (!model) {
            throw new Error("'model' parameter is required");
        }
        try {
            const modelConfig = asyncLlm_1.LLMsConfig.default().get('gpt-4o-mini');
            if (!modelConfig) {
                throw new Error(`Model gpt-4o-mini not found in configuration`);
            }
            const config = Object.assign({}, modelConfig);
            for (const [key, value] of Object.entries(kwargs)) {
                if (key in config) {
                    config[key] = value;
                }
            }
            return config;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error loading configuration for model '${model}': ${error.message}`);
            }
            throw new Error(`Error loading configuration for model '${model}': Unknown error`);
        }
    }
    responser(requestType, messages) {
        return __awaiter(this, void 0, void 0, function* () {
            const llmMapping = {
                [RequestType.OPTIMIZE]: this.optimizeLlm,
                [RequestType.EVALUATE]: this.evaluateLlm,
                [RequestType.EXECUTE]: this.executeLlm
            };
            const llm = llmMapping[requestType];
            if (!llm) {
                const validTypes = Object.values(RequestType).join(', ');
                throw new Error(`Invalid request type. Valid types: ${validTypes}`);
            }
            const response = yield llm.call(messages);
            return response;
        });
    }
    static initialize(optimizeKwargs, evaluateKwargs, executeKwargs, mode) {
        this._instance = new SPO_LLM(optimizeKwargs, evaluateKwargs, executeKwargs, mode);
    }
    static getInstance() {
        if (this._instance === null) {
            throw new Error('SPO_LLM not initialized. Call initialize() first.');
        }
        return this._instance;
    }
}
exports.SPO_LLM = SPO_LLM;
SPO_LLM._instance = null;
function extractContent(xmlString, tag) {
    const pattern = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const match = xmlString.match(pattern);
    return match ? match[1].trim() : null;
}
