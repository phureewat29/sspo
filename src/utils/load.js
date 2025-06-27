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
exports.setFileName = setFileName;
exports.loadMetaData = loadMetaData;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
let FILE_NAME = '';
const SAMPLE_K = 3;
function setFileName(name) {
    FILE_NAME = name;
}
function loadMetaData() {
    return __awaiter(this, arguments, void 0, function* (k = SAMPLE_K) {
        // Load yaml file
        const configPath = path.join(__dirname, '..', 'settings', FILE_NAME);
        if (!(yield fs.pathExists(configPath))) {
            throw new Error(`Configuration file '${FILE_NAME}' not found in settings directory`);
        }
        let data;
        try {
            const fileContent = yield fs.readFile(configPath, 'utf8');
            data = yaml.load(fileContent);
        }
        catch (error) {
            if (error instanceof yaml.YAMLException) {
                throw new Error(`Error parsing YAML file '${FILE_NAME}': ${error.message}`);
            }
            throw new Error(`Error reading file '${FILE_NAME}': ${error}`);
        }
        const qa = [];
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
        }
        else {
            count = '';
        }
        // Random sample from qa
        const randomQa = qa.length <= k ? qa : qa.sort(() => 0.5 - Math.random()).slice(0, k);
        return [prompt, requirements, randomQa, count];
    });
}
