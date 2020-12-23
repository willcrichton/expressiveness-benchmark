"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.LANGUAGES = exports.LANG_ORDER = exports.PROGRAMS = exports.TASKS = exports.TASK_BLACKLIST = exports.TASK_GROUP_ORDER = exports.PROGRAM_DATA = void 0;
var lodash_1 = __importDefault(require("lodash"));
var editor_1 = require("./editor/editor");
//@ts-ignore
var __json_1 = __importDefault(require("../data/tasks/*.json"));
//@ts-ignore
var __json_2 = __importDefault(require("../data/languages/*.json"));
//@ts-ignore
var __json_3 = __importDefault(require("../data/programs/**/*.json"));
//@ts-ignore
var programs_json_1 = require("../data/analysis/programs.json");
__createBinding(exports, programs_json_1, "default", "PROGRAM_DATA");
exports.TASK_GROUP_ORDER = [
    'Basic', 'Joins', 'Aggregation', 'Strings', 'First-order logic',
    'Time Series', 'Graphs'
];
exports.TASK_BLACKLIST = ['customer_orders', 'unique_product', 'average_adjacent'];
exports.TASKS = lodash_1["default"].sortBy(Object.values(__json_1["default"]), [function (t) { return lodash_1["default"].findIndex(exports.TASK_GROUP_ORDER, function (c) { return c == t.category; }); }, 'name'])
    .filter(function (t) { return !lodash_1["default"].includes(exports.TASK_BLACKLIST, t.id); });
exports.PROGRAMS = lodash_1["default"].map(__json_3["default"], function (programs) { return Object.values(programs).map(function (p) { return new editor_1.Program(p); }); })
    .flat();
exports.LANG_ORDER = ['python-imperative', 'python-functional', 'python-pandas', 'r', 'sql', 'datalog', 'q'];
exports.LANGUAGES = exports.LANG_ORDER.map(function (id) { return __json_2["default"][id]; });
