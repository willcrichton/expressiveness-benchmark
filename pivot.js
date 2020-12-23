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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.LangView = exports.TaskView = exports.Cell = exports.Code = void 0;
var react_1 = __importStar(require("react"));
var lodash_1 = __importDefault(require("lodash"));
var editor_1 = require("./editor/editor");
var data_1 = require("./data");
var get_color = function (i, opacity) { return "rgba(" + editor_1.PALETTE[i].join(', ') + ", " + (opacity || 1.) + ")"; };
exports.Code = function (_a) {
    var program = _a.program, props = __rest(_a, ["program"]);
    return react_1["default"].createElement(editor_1.CodeViewer, __assign({ task: lodash_1["default"].find(data_1.TASKS, { id: program.task }), program: program }, props, { editor_props: __assign({ highlightActiveLine: false, readOnly: true, showGutter: false, tabSize: 2 }, props.editor_props) }));
};
exports.Cell = function (_a) {
    var program = _a.program, task = _a.task;
    return react_1["default"].createElement(exports.Code, { program: program, task: task, width: "160px", height: "100px", editor_props: {
            showGutter: false,
            fontSize: 4
        } });
};
var Output = function (_a) {
    var val = _a.val;
    if (Array.isArray(val)) {
        if (typeof val[0] === 'object') {
            return react_1["default"].createElement(JsonTable, { table: val });
        }
        else {
            return react_1["default"].createElement(react_1["default"].Fragment, null,
                "[",
                val.map(function (v, i) { return [i > 0 && ", ", react_1["default"].createElement(Output, { key: i, val: v })]; }),
                "]");
        }
    }
    else {
        return react_1["default"].createElement(react_1["default"].Fragment, null, val);
    }
};
var JsonTable = function (_a) {
    var table = _a.table;
    var keys = lodash_1["default"].keys(table[0]);
    return react_1["default"].createElement("table", null,
        react_1["default"].createElement("thead", null,
            react_1["default"].createElement("tr", null, keys.map(function (k) { return react_1["default"].createElement("th", { key: k }, k); }))),
        react_1["default"].createElement("tbody", null, table.map(function (row, i) {
            return react_1["default"].createElement("tr", { key: i }, keys.map(function (k) {
                return react_1["default"].createElement("td", { key: k },
                    react_1["default"].createElement("code", null, row[k]));
            }));
        })));
};
var SampleIO = function (_a) {
    var task = _a.task;
    return react_1["default"].createElement("div", { className: 'io' },
        react_1["default"].createElement("strong", null, "Example input/output:"),
        react_1["default"].createElement("div", { className: 'data-container' },
            lodash_1["default"].map(task.sample_input, function (table, key) {
                return react_1["default"].createElement("div", { key: key },
                    react_1["default"].createElement("strong", null, "Input:"),
                    " ",
                    react_1["default"].createElement("code", null, key),
                    react_1["default"].createElement(JsonTable, { table: table }));
            }),
            react_1["default"].createElement("div", null,
                react_1["default"].createElement("strong", null, "Output:"),
                " ",
                react_1["default"].createElement("code", null,
                    react_1["default"].createElement(Output, { val: task.sample_output })))));
};
var TaskSpec = function (_a) {
    var task = _a.task, on_selected = _a.on_selected;
    var _b = react_1.useState(null), selected = _b[0], set_selected = _b[1];
    var _c = react_1.useState(null), hover = _c[0], set_hover = _c[1];
    react_1.useEffect(function () { return on_selected(selected); }, [selected]);
    var desc = task.description;
    var plans = lodash_1["default"].chain(task.plan)
        .map(function (p, index) { return [desc.indexOf(p.description), __assign({ index: index }, p)]; })
        .fromPairs()
        .value();
    var i = 0;
    var elts = [];
    var _loop_1 = function () {
        if (i in plans) {
            var plan_1 = plans[i];
            var cur_plan = selected || hover;
            var alpha = cur_plan ? (cur_plan == plan_1.id ? 1. : 0.25) : 0.5;
            var background = get_color(plan_1.index, alpha);
            var border_color = get_color(plan_1.index, Math.min(1, alpha * 2));
            elts.push(react_1["default"].createElement("span", { className: 'goal', onClick: function () { return set_selected(selected && selected == plan_1.id ? null : plan_1.id); }, onMouseEnter: function () {
                    if (!selected) {
                        on_selected(plan_1.id);
                    }
                    set_hover(plan_1.id);
                }, onMouseLeave: function () {
                    if (!selected) {
                        on_selected(null);
                    }
                    set_hover(null);
                }, style: {
                    background: get_color(plan_1.index, alpha),
                    border: "2px solid " + border_color
                } }, plan_1.description));
            i += plan_1.description.length;
        }
        else {
            elts.push(desc[i]);
            i += 1;
        }
    };
    while (i < desc.length) {
        _loop_1();
    }
    return react_1["default"].createElement("div", { className: 'task-spec' },
        react_1["default"].createElement("strong", null, "Specification: "),
        elts);
};
var PivotView = function (_a) {
    var group_key = _a.group_key, group_value = _a.group_value, pivot_key = _a.pivot_key, show_plan = _a.show_plan;
    var programs = data_1.PROGRAMS.filter(function (program) { return program[group_key] == group_value.id; });
    var pivot_values = pivot_key == 'language' ? data_1.LANGUAGES : data_1.TASKS;
    var valid_values = pivot_values.filter(function (v) {
        var _a;
        return lodash_1["default"].find(programs, (_a = {}, _a[pivot_key] = v.id, _a));
    });
    var valid_ids = valid_values.map(function (v) { return v.id; });
    var _b = react_1.useState(valid_ids), selected = _b[0], set_selected = _b[1];
    var _c = react_1.useState(null), plan_selected = _c[0], set_plan_selected = _c[1];
    var Checkbox = function (_a) {
        var pivot = _a.pivot;
        var on_click = function () {
            var idx = lodash_1["default"].findIndex(selected, function (id) { return id == pivot.id; });
            if (idx > -1) {
                var s = __spreadArrays(selected);
                s.splice(idx, 1);
                set_selected(s);
            }
            else {
                set_selected(__spreadArrays(selected, [pivot.id]));
            }
        };
        return react_1["default"].createElement("div", { onClick: on_click },
            react_1["default"].createElement("input", { type: "checkbox", checked: lodash_1["default"].includes(selected, pivot.id) }),
            pivot.name);
    };
    var Minimap = function () {
        return react_1["default"].createElement("div", { className: 'minimap' },
            react_1["default"].createElement("button", { className: 'toggle', onClick: function () {
                    set_selected(selected.length == 0 ? valid_ids : []);
                } }, "Toggle All"),
            valid_values.map(function (val) { return react_1["default"].createElement(Checkbox, { key: val.id, pivot: val }); }));
    };
    var selected_programs = lodash_1["default"].chain(selected)
        .sortBy(function (id) { return lodash_1["default"].findIndex(valid_values, { id: id }); })
        .map(function (id) {
        var _a;
        return lodash_1["default"].find(programs, (_a = {}, _a[pivot_key] = id, _a));
    })
        .value();
    return react_1["default"].createElement("div", { className: 'pivot-view' },
        react_1["default"].createElement("h2", null,
            lodash_1["default"].capitalize(group_key),
            ": ",
            group_value.name),
        react_1["default"].createElement("div", { className: 'column-container' },
            react_1["default"].createElement("div", { className: 'main-content' },
                react_1["default"].createElement("div", { className: 'main-sticky' }, group_key == "task" ?
                    react_1["default"].createElement(TaskSpec, { task: group_value, on_selected: set_plan_selected }) : null),
                react_1["default"].createElement("div", { className: 'main-scroll' },
                    group_key == "task"
                        ? react_1["default"].createElement(react_1["default"].Fragment, null,
                            react_1["default"].createElement(SampleIO, { task: group_value }))
                        : null,
                    lodash_1["default"].chunk(selected_programs, 2).map(function (progs, i) {
                        return react_1["default"].createElement("div", { className: 'program-row', key: i }, progs.map(function (prog, j) {
                            return react_1["default"].createElement("div", { className: 'program-container', key: i + "_" + j },
                                react_1["default"].createElement("h3", null, lodash_1["default"].find(pivot_values, { id: prog[pivot_key] }).name),
                                react_1["default"].createElement(exports.Code, { program: prog, width: '100%', task: lodash_1["default"].find(data_1.TASKS, { id: prog.task }), plan_focus: plan_selected, show_plan: show_plan }));
                        }));
                    }))),
            react_1["default"].createElement("div", { className: 'sidebar' },
                react_1["default"].createElement("div", { className: 'sidebar-sticky' },
                    react_1["default"].createElement(Minimap, null)))));
};
exports.TaskView = function (_a) {
    var task = _a.task;
    return react_1["default"].createElement(PivotView, { group_key: "task", group_value: task, pivot_key: "language", show_plan: true });
};
exports.LangView = function (_a) {
    var lang = _a.lang;
    return react_1["default"].createElement(PivotView, { group_key: "language", group_value: lang, pivot_key: "task", show_plan: false });
};
