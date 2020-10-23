"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var react_1 = __importStar(require("react"));
var react_dom_1 = __importDefault(require("react-dom"));
//@ts-ignore
var __json_1 = __importDefault(require("../data/tasks/*.json"));
//@ts-ignore
var __json_2 = __importDefault(require("../data/languages/*.json"));
//@ts-ignore
var __json_3 = __importDefault(require("../data/programs/*.json"));
var TASKS = Object.values(__json_1["default"]);
var LANGUAGES = Object.values(__json_2["default"]);
var PROGRAMS = Object.values(__json_3["default"]);
var TaskView = function (_a) {
    var task = _a.task;
    var programs = PROGRAMS.filter(function (program) { return program.task == task.id; });
    return react_1["default"].createElement("div", null,
        react_1["default"].createElement("h2", null,
            "Task: ",
            task.description),
        programs.map(function (program, i) {
            return react_1["default"].createElement("div", { key: i },
                react_1["default"].createElement("div", null,
                    react_1["default"].createElement("strong", null, "Language:"),
                    " ",
                    program.language),
                react_1["default"].createElement("pre", null, program.source));
        }));
};
var App = function () {
    var _a = react_1.useState(null), task = _a[0], set_task = _a[1];
    return react_1["default"].createElement("div", null,
        react_1["default"].createElement("h1", null, "Expressiveness Benchmark"),
        react_1["default"].createElement("div", { className: 'tasks' }, Object.values(TASKS).map(function (task) {
            return react_1["default"].createElement("button", { key: task.id, onClick: function () {
                    set_task(task);
                } }, task.description);
        })),
        task !== null
            ? react_1["default"].createElement(TaskView, { task: task })
            : null);
};
react_dom_1["default"].render(react_1["default"].createElement(App, null), document.getElementById('container'));
