"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.AnalysisRoute = void 0;
var react_1 = __importDefault(require("react"));
var lodash_1 = __importDefault(require("lodash"));
var react_router_dom_1 = require("react-router-dom");
var react_vega_1 = require("react-vega");
var vegaThemes = __importStar(require("vega-themes"));
var data_1 = require("./data");
var pivot_1 = require("./pivot");
var LANG_NAME_ORDER = data_1.LANG_ORDER.map(function (id) { return lodash_1["default"].find(data_1.LANGUAGES, { id: id }).name; });
var axis = {
    language_name: {
        field: 'language_name', type: "nominal",
        sort: LANG_NAME_ORDER, title: "Language"
    },
    task: {
        field: 'task_name', type: "nominal", title: "Task",
        sort: data_1.TASKS.map(function (t) { return t.name; })
    },
    category: {
        field: 'category', type: "nominal", title: "Task Category",
        sort: data_1.TASK_GROUP_ORDER
    },
    ntokens: {
        field: 'ntokens', type: "quantitative", title: "Number of tokens"
    },
    token_zscore: {
        field: 'token_zscore', type: "quantitative", title: "Token Z-score"
    }
};
var Chart = function (_a) {
    var spec = _a.spec;
    var final_spec = __assign(__assign({ data: { name: 'data' } }, spec), { config: __assign(__assign(__assign({}, vegaThemes.vox), { title: { fontSize: 22 }, header: { titleFontSize: 22, labelFontSize: 20 }, axis: { labelFontSize: 16, titleFontSize: 16, labelLimit: 500, maxExtent: 500 }, legend: { labelFontSize: 16, titleFontSize: 16 } }), spec.config) });
    return react_1["default"].createElement(react_vega_1.VegaLite, { spec: final_spec, data: { data: data_1.PROGRAM_DATA } });
};
var median = function (l) {
    l = lodash_1["default"].sortBy(l);
    var middle = Math.round((l.length - 1) / 2);
    if (l.length % 2 == 1) {
        return l[middle];
    }
    else {
        return (l[middle - 1] + l[middle]) / 2;
    }
};
var sort_by_median = function (group, measure) {
    return lodash_1["default"].chain(data_1.PROGRAM_DATA)
        .groupBy(group)
        .mapValues(function (t) { return median(t.map(function (r) { return r[measure]; })); })
        .toPairs()
        .sortBy(1)
        .map(function (t) { return t[0]; })
        .value();
};
var ZscoreChart = function (_a) {
    var outer_group = _a.outer_group, inner_group = _a.inner_group;
    var extremum = function (max, min, neither) { return ({
        field: "extremum",
        scale: { domain: ["Worst", "Best", "In-between"], range: [max, min, neither] }
    }); };
    return react_1["default"].createElement(Chart, { spec: {
            mark: {
                type: "point",
                filled: true
            },
            transform: [
                { joinaggregate: [{ op: "mean", field: "token_zscore", as: "zscore_mean" }],
                    groupby: [outer_group, inner_group] },
                { joinaggregate: [
                        { op: "max", field: "zscore_mean", as: "zscore_max" },
                        { op: "min", field: "zscore_mean", as: "zscore_min" }
                    ], groupby: [outer_group] },
                { calculate: "datum.zscore_mean == datum.zscore_min ? 'Best' : (datum.zscore_mean == datum.zscore_max ? 'Worst' : 'In-between')",
                    as: "extremum" },
            ],
            encoding: {
                x: { field: "zscore_mean", type: "quantitative", title: "Average z-score" },
                y: axis[inner_group],
                facet: __assign(__assign({}, axis[outer_group]), { columns: 4 }),
                color: extremum("#e41a1c", "#7fc97f", "steelblue"),
                angle: extremum(45, 135, 0),
                size: extremum(150, 40, 0),
                shape: extremum("cross", "diamond", "circle")
            }
        } });
};
var task_category = lodash_1["default"].fromPairs(data_1.TASKS.map(function (t) { return [t.id, t.category]; }));
var Programs = function (_a) {
    var language = _a.language, category = _a.category;
    return react_1["default"].createElement("div", { className: 'program-row' }, data_1.PROGRAMS
        .filter(function (p) { return p.language == language && task_category[p.task] == category; })
        .map(function (program) {
        var task = lodash_1["default"].find(data_1.TASKS, { id: program.task });
        return react_1["default"].createElement("div", { className: 'program-container' },
            react_1["default"].createElement("strong", null,
                react_1["default"].createElement(react_router_dom_1.Link, { to: "/task/" + task.id }, task.name)),
            react_1["default"].createElement(pivot_1.Code, { program: program, width: '100%', task: task, show_plan: false }));
    }));
};
exports.AnalysisRoute = function () {
    return react_1["default"].createElement("div", { className: 'analysis' },
        react_1["default"].createElement("h2", null, "Dataset analysis"),
        react_1["default"].createElement("h3", null, "1. Overall, how concise are programs in each language and category?"),
        react_1["default"].createElement("p", null,
            "Our goal is to use quantitative metrics to compare the conciseness of programs in each language. We use ",
            react_1["default"].createElement("strong", null, "number of tokens"),
            " to measure program length. For example, the program \"",
            react_1["default"].createElement("code", null, "(var_name + 1) * 2"),
            "\" has the tokens \"",
            react_1["default"].createElement("code", null, "[(, var_name, +, 1, ), *, 2]"),
            "\" for a length of 7. Using tokens instead of lines-of-code or number of characters helps control for stylistic differences in indentation, and it does not penalize e.g. longer variable names. The boxplots below show the distribution of the number of tokens in programs for each category, sorted by median."),
        react_1["default"].createElement(Chart, { spec: {
                mark: "boxplot",
                height: 220,
                title: "Tokens per language",
                encoding: {
                    x: axis.ntokens,
                    y: __assign(__assign({}, axis.language_name), { sort: sort_by_median('language_name', 'ntokens') })
                }
            } }),
        react_1["default"].createElement(Chart, { spec: {
                mark: "boxplot",
                height: 220,
                title: "Tokens per task category",
                encoding: {
                    x: axis.ntokens,
                    y: __assign(__assign({}, axis.category), { sort: sort_by_median('category', 'ntokens') })
                }
            } }),
        react_1["default"].createElement("h3", null, "2. For a given language, what are its most and least concise tasks?"),
        react_1["default"].createElement("p", null,
            "To compare languages within categories, we take each task and assign its programs a ",
            react_1["default"].createElement("a", { href: "https://en.wikipedia.org/wiki/Standard_score" }, "z-score"),
            " based on length. The z-score tells us: for a given task (e.g. ",
            react_1["default"].createElement(react_router_dom_1.Link, { to: "/task/youngest_over_35" }, "Youngest over 35"),
            "), how does program's size in one language compare to other languages? A high z-score means a larger program than normal, and low z-score is smaller. Because the z-score is normalized, we can compare z-scores across multiple tasks. A language's highest z-score is its worst category, and lowest z-score is its best category. Below we plot the z-scores for each language and category (z-scores within a given category/language pair are averaged)."),
        react_1["default"].createElement(ZscoreChart, { outer_group: "language_name", inner_group: "category" }),
        react_1["default"].createElement("p", null,
            "To understand these statistics, let's dig into an example. For ",
            react_1["default"].createElement("strong", null, "Datalog"),
            ", its best category is ",
            react_1["default"].createElement("strong", null, "Joins"),
            " and worst category is ",
            react_1["default"].createElement("strong", null, "Strings"),
            ". Here are the two Datalog join programs:"),
        react_1["default"].createElement(Programs, { language: 'datalog', category: 'Joins' }),
        react_1["default"].createElement("p", null,
            "Datalog has more concise programs for joins because relationships between tables are implicitly expressed by sharing variables across tables. By contrast, languages like SQL require explicit ",
            react_1["default"].createElement("code", null, "JOIN"),
            " clauses. But if we look to ",
            react_1["default"].createElement("strong", null, "Strings"),
            ", we can see when Datalog gets verbose:"),
        react_1["default"].createElement(Programs, { language: 'datalog', category: 'Strings' }),
        react_1["default"].createElement("p", null, "The main issue is that Datalog (i.e. Souffle) does not have many built-in primitives for string process like splitting or removing characters, so re-implementing those primitives requires a lot of code."),
        react_1["default"].createElement("h3", null, "3. For a given task, what are its most and least concise languages?"),
        react_1["default"].createElement("p", null, "To answer this question, we can transpose the previous analysis. For each category, we can compare the z-scores for different languages, shown below."),
        react_1["default"].createElement(ZscoreChart, { outer_group: "category", inner_group: "language_name" }),
        react_1["default"].createElement("p", null,
            react_1["default"].createElement("strong", null, "Python - Imperative"),
            " has the most verbose programs for every category except ",
            react_1["default"].createElement("strong", null, "Strings"),
            ". The most concise programs vary mostly between ",
            react_1["default"].createElement("strong", null, "SQL"),
            ", ",
            react_1["default"].createElement("strong", null, "R"),
            ", and ",
            react_1["default"].createElement("strong", null, "Q"),
            "."));
};
