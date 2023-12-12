"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateIdentifier = void 0;
function GenerateIdentifier() { return global.crypto.randomUUID(); }
exports.GenerateIdentifier = GenerateIdentifier;
