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
var lodash_1 = __importDefault(require("lodash"));
require("./editor/main.css");
require("../css/index.scss");
var react_router_dom_1 = require("react-router-dom");
var data_1 = require("./data");
var pivot_1 = require("./pivot");
var analysis_1 = require("./analysis");
var MatrixRoute = function () {
    var _a = react_1.useState(null), hover = _a[0], set_hover = _a[1];
    var history = react_router_dom_1.useHistory();
    var task_groups = lodash_1["default"].groupBy(data_1.TASKS, 'category');
    var tasks_sorted = data_1.TASK_GROUP_ORDER.map(function (key) { return [key, task_groups[key]]; });
    return react_1["default"].createElement("div", null,
        react_1["default"].createElement("p", null,
            "This benchmark is a collection of programs implementing tabular data analytics tasks, similar to ",
            react_1["default"].createElement("a", { href: "https://rosettacode.org/" }, "Rosetta Code"),
            " or ",
            react_1["default"].createElement("a", { href: "https://eugenkiss.github.io/7guis/" }, "7GUIs"),
            ". This benchmark has two goals:"),
        react_1["default"].createElement("ol", null,
            react_1["default"].createElement("li", null,
                react_1["default"].createElement("strong", null, "Assist in cross-language learning."),
                " A common problem in learning to program is tutorials assume a different background than yours. The task/language matrix can provide insight for many pairs of background/learning goal. For example, if you know Python and want to learn R, then you can look at correspondences between many examples."),
            react_1["default"].createElement("li", null,
                react_1["default"].createElement("strong", null, "Quantify the relationship between programs and tasks."),
                " The dream of declarative programming is for a program to be as close as possible to its specification. Is it possible to quantify the conceptual distance between a program and task?")),
        react_1["default"].createElement("p", null,
            "Click on a task name below (like ",
            react_1["default"].createElement(react_router_dom_1.Link, { to: "/task/youngest_over_35" }, "Youngest over 35"),
            ") to see its specification and implementations.",
            react_1["default"].createElement("br", null),
            " Click on ",
            react_1["default"].createElement(react_router_dom_1.Link, { to: "/analysis" }, "Dataset analysis"),
            " to see a statistical comparison of languages based on conciseness."),
        react_1["default"].createElement("table", { className: 'matrix code-table' },
            react_1["default"].createElement("thead", null,
                react_1["default"].createElement("tr", null,
                    react_1["default"].createElement("th", { className: 'task-kind' }, "Category"),
                    react_1["default"].createElement("th", { className: 'task-kind' }, "Task name"),
                    data_1.LANGUAGES.map(function (lang) {
                        var category = { type: "lang", id: lang.id };
                        return react_1["default"].createElement("th", { className: 'hoverable', key: lang.id, onMouseEnter: function () { return set_hover(category); }, onMouseLeave: function () { return set_hover(null); }, onClick: function () { return history.push("/lang/" + lang.id); } }, lang.name);
                    }))),
            react_1["default"].createElement("tbody", null, tasks_sorted.map(function (_a) {
                var group = _a[0], tasks = _a[1];
                return tasks.map(function (task, i) {
                    var category = { type: "task", id: task.id };
                    return react_1["default"].createElement("tr", { key: task.id },
                        i == 0 ? react_1["default"].createElement("td", { className: 'task-type', rowSpan: tasks.length }, group) : null,
                        react_1["default"].createElement("td", { className: 'task-description hoverable', onMouseEnter: function () { return set_hover(category); }, onMouseLeave: function () { return set_hover(null); }, onClick: function () { return history.push("/task/" + task.id); } }, task.name),
                        data_1.LANGUAGES.map(function (lang) {
                            var program = lodash_1["default"].find(data_1.PROGRAMS, { task: task.id, language: lang.id });
                            var is_hover = hover
                                ? ((hover.type == 'lang' && hover.id == lang.id)
                                    || (hover.type == 'task' && hover.id == task.id))
                                : false;
                            return react_1["default"].createElement("td", { className: "task-code " + (is_hover ? "hover" : ""), key: lang.id }, program
                                ? react_1["default"].createElement(pivot_1.Cell, { program: program, task: task })
                                : '');
                        }));
                });
            }))));
};
var App = function () {
    var BackButton = function () { return react_1["default"].createElement(react_router_dom_1.Link, { to: "/" },
        react_1["default"].createElement("button", { className: 'back-button' }, "Back")); };
    var TaskRoute = function () {
        var id = react_router_dom_1.useParams().id;
        return react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement(BackButton, null),
            react_1["default"].createElement(pivot_1.TaskView, { task: lodash_1["default"].find(data_1.TASKS, { id: id }) }));
    };
    var LangRoute = function () {
        var id = react_router_dom_1.useParams().id;
        return react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement(BackButton, null),
            react_1["default"].createElement(pivot_1.LangView, { lang: lodash_1["default"].find(data_1.LANGUAGES, { id: id }) }));
    };
    return react_1["default"].createElement("div", null,
        react_1["default"].createElement(react_router_dom_1.HashRouter, null,
            react_1["default"].createElement("div", { className: 'title' },
                react_1["default"].createElement("h1", null, "Expressiveness Benchmark"),
                react_1["default"].createElement("nav", null,
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "/" }, "Task matrix"),
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "/analysis" }, "Dataset analysis"))),
            react_1["default"].createElement(react_router_dom_1.Switch, null,
                react_1["default"].createElement(react_router_dom_1.Route, { exact: true, path: "/task/:id" },
                    react_1["default"].createElement(TaskRoute, null)),
                react_1["default"].createElement(react_router_dom_1.Route, { exact: true, path: "/lang/:id" },
                    react_1["default"].createElement(LangRoute, null)),
                react_1["default"].createElement(react_router_dom_1.Route, { exact: true, path: "/analysis" },
                    react_1["default"].createElement(analysis_1.AnalysisRoute, null)),
                react_1["default"].createElement(react_router_dom_1.Route, { exact: true, path: "/" },
                    react_1["default"].createElement(MatrixRoute, null)))));
};
react_dom_1["default"].render(react_1["default"].createElement(App, null), document.getElementById('container'));
