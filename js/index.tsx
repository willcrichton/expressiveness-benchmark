import React, {useState, useEffect, Fragment} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import _ from 'lodash';
import {Program, Task, Language, CodeViewer, PALETTE} from './editor/editor';
import './editor/main.css';
import '../css/index.scss';
import {HashRouter as Router, Switch, Route, Link, useHistory, useParams} from 'react-router-dom';

let get_color = (i: number, opacity?: number) => `rgba(${PALETTE[i].join(', ')}, ${opacity || 1.})`;

//@ts-ignore
import _TASKS from '../data/tasks/*.json';
//@ts-ignore
import _LANGUAGES from '../data/languages/*.json';
//@ts-ignore
import _PROGRAMS from '../data/programs/**/*.json';

const TASK_GROUP_ORDER = [
  'Basic', 'Joins', 'Aggregation', 'Strings', 'First-order logic',
  'Time Series', 'Graphs'];
const TASKS: Task[] =
  _.sortBy(
    Object.values(_TASKS),
    [t => _.findIndex(TASK_GROUP_ORDER, c => c == t.category),
     'name'])
   .filter(t => !_.includes(['customer_orders', 'unique_product', 'average_adjacent'], t.id))

const PROGRAMS: Program[] =
  _.map(_PROGRAMS, programs => Object.values(programs).map(p => new Program(p))).flat();

const LANG_ORDER = ['python-imperative', 'python-functional', 'python-pandas', 'r', 'sql', 'datalog', 'q'];
const LANGUAGES: Language[] = LANG_ORDER.map(id => _LANGUAGES[id]);

let Code = ({program, ...props}) =>
  <CodeViewer
    task={_.find(TASKS, {id: program.task})}
    program={program}
    {...props}
    editor_props={{
      highlightActiveLine: false,
      readOnly: true,
      showGutter: false,
      tabSize: 2,
      ...props.editor_props
    }}
  />;

let Cell = ({program, task}) =>
   <Code
   program={program}
   task={task}
   width={"160px"}
   height={"100px"}
   editor_props={{
     showGutter: false,
     fontSize: 4
   }} />;

let Output = ({val}) => {
  if (Array.isArray(val)) {
    if (typeof val[0] === 'object') {
      return <JsonTable table={val} />
    } else {
      return <>[{val.map((v, i) => [i > 0 && ", ", <Output key={i} val={v} />])}]</>
    }
  } else {
    return <>{val}</>;
  }
};

let JsonTable = ({table}) => {
  let keys = _.keys(table[0]);
  return <table>
    <thead>
      <tr>
        {keys.map(k => <th key={k}>{k}</th>)}
      </tr>
    </thead>
    <tbody>
      {table.map((row, i) =>
        <tr key={i}>{keys.map(k =>
          <td key={k}><code>{row[k]}</code></td>
        )}</tr>
      )}
    </tbody>
  </table>;
};

let SampleIO = ({task}) =>
  <div className='io'>
    <strong>Example input/output:</strong>
    <div className='data-container'>
      {_.map(task.sample_input, (table, key) =>
        <div key={key}>
          <strong>Input:</strong> <code>{key}</code>
          <JsonTable table={table} />
        </div>)}
      <div>
        <strong>Output:</strong> <code><Output val={task.sample_output} /></code>
      </div>
    </div>
  </div>;

let TaskSpec = ({task, on_selected}) => {
  let [selected, set_selected] = useState(null);
  let [hover, set_hover] = useState(null);

  useEffect(() => on_selected(selected), [selected]);

  let desc = task.description;
  let plans =
    _.chain(task.plan)
     .map((p, index) => [desc.indexOf(p.description), {index, ...p}])
     .fromPairs()
     .value();

  let i = 0;
  let elts = [];
  while (i < desc.length) {
    if (i in plans) {
      let plan = plans[i];
      let cur_plan = selected || hover;
      let alpha = cur_plan ? (cur_plan == plan.id ? 1. : 0.25) : 0.5;
      let background = get_color(plan.index, alpha);
      let border_color = get_color(plan.index, Math.min(1, alpha * 2));
      elts.push(
        <span
          className='goal'
          onClick={() => set_selected(selected && selected == plan.id ? null : plan.id)}
          onMouseEnter={() => {
            if (!selected) { on_selected(plan.id); }
            set_hover(plan.id);
          }}
          onMouseLeave={() => {
              if (!selected) { on_selected(null); }
              set_hover(null);
          }}
          style={{
            background: get_color(plan.index, alpha),
            border: `2px solid ${border_color}`
          }}>
          {plan.description}
        </span>);
    i += plan.description.length;
    } else {
      elts.push(desc[i]);
      i += 1;
    }
  }

  return <div className='task-spec'>
    <strong>Specification: </strong>
    {elts}
  </div>;
};

let PivotView = ({group_key, group_value, pivot_key}) => {

  let programs = PROGRAMS.filter(program => program[group_key] == group_value.id);
  let pivot_values: {id: string}[] =
    pivot_key == 'language' ? LANGUAGES : TASKS;
  let valid_values = pivot_values.filter(v => _.find(programs, {[pivot_key]: v.id}));
  let valid_ids = valid_values.map(v => v.id);

  let [selected, set_selected] = useState(valid_ids);
  let [plan_selected, set_plan_selected] = useState(null);

  let Checkbox = ({pivot}) => {
    let on_click = () => {
      let idx = _.findIndex(selected, id => id == pivot.id);
      if (idx > -1) {
        let s = [...selected];
        s.splice(idx, 1);
        set_selected(s);
      } else {
        set_selected([...selected, pivot.id]);
      }
    };
    return <div onClick={on_click}>
      <input type="checkbox" checked={_.includes(selected, pivot.id)} />
      {pivot.name}
    </div>;
  };

  let Minimap = () =>
    <div className='minimap'>
      <button className='toggle' onClick={() => {
        set_selected(selected.length == 0 ? valid_ids : []);
      }}>Toggle All</button>
      {valid_values.map(val => <Checkbox key={val.id} pivot={val} />)}
    </div>;

  let selected_programs =
    _.chain(selected)
     .sortBy(id => _.findIndex(valid_values, {id}))
     .map(id => _.find(programs, {[pivot_key]: id}))
     .value();

  return <div className='pivot-view'>
    <h2>{_.capitalize(group_key)}: {group_value.name}</h2>
    <div className='column-container'>
      <div className='main-content'>
        <div className='main-sticky'>
          {group_key == "task" ?
            <TaskSpec task={group_value} on_selected={set_plan_selected} /> : null}
        </div>
        <div className='main-scroll'>
          {group_key == "task"
            ? <>
              <SampleIO task={group_value} />
            </>
            : null}
          {_.chunk(selected_programs, 2).map((progs, i) =>
            <div className='program-row' key={i}>
              {progs.map((prog, j) =>
                <div className='program-container' key={`${i}_${j}`}>
                  <h3>{_.find(pivot_values, {id: prog[pivot_key]}).name}</h3>
                  <Code program={prog} width={'100%'} task={_.find(TASKS, {id: prog.task})} plan_focus={plan_selected} />
                </div>)}
            </div>)}
        </div>
      </div>
      <div className='sidebar'>
        <div className='sidebar-sticky'><Minimap /></div>
      </div>
    </div>
  </div>
};

let TaskView = ({task}) =>
  <PivotView group_key={"task"} group_value={task} pivot_key={"language"} />;

let LangView = ({lang}) =>
  <PivotView group_key={"language"} group_value={lang} pivot_key={"task"} />;

let MatrixRoute = () => {
  let [hover, set_hover] = useState(null);
  let history = useHistory();

  let task_groups = _.groupBy(TASKS, 'category');
  let tasks_sorted = TASK_GROUP_ORDER.map(key => [key, task_groups[key]]);

  return <div>
    <table className='matrix code-table'>
      <thead>
        <tr>
          <th className='task-kind'>Task type</th>
          <th className='task-kind'>Task name</th>
          {LANGUAGES.map(lang => {
            let category = {type: "lang", id: lang.id};
            return <th className='hoverable' key={lang.id}
                       onMouseEnter={() => set_hover(category)}
                       onMouseLeave={() => set_hover(null)}
                       onClick={() => history.push(`/lang/${lang.id}`)}>
              {lang.name}
            </th>
          })}
        </tr>
      </thead>

      <tbody>
        {tasks_sorted.map(([group, tasks]) =>
          tasks.map((task, i) => {
            let category = {type: "task", id: task.id};
            return <tr key={task.id}>
              {i == 0 ? <td className='task-type' rowSpan={tasks.length}>{group}</td> : null}
              <td
                className='task-description hoverable'
                onMouseEnter={() => set_hover(category)}
                onMouseLeave={() => set_hover(null)}
                onClick={() => history.push(`/task/${task.id}`)}
              >
                {task.name}
              </td>
              {LANGUAGES.map(lang => {
                let program = _.find(PROGRAMS, {task: task.id, language: lang.id});
                let is_hover = hover
                  ? ((hover.type == 'lang' && hover.id == lang.id)
                    || (hover.type == 'task' && hover.id == task.id))
                  : false;

                return <td className={`task-code ${is_hover ? "hover" : ""}`} key={lang.id}>
                  {program
                    ? <Cell program={program} task={task} />
                    : ''}
                </td>;
              })}
            </tr>
          })
        )}
      </tbody>
    </table>
  </div>
};

let App = () => {
  let BackButton = () => <Link to="/">
    <button className='back-button'>Back</button>
  </Link>;

  let TaskRoute = () => {
    let {id} = useParams();
    return <><BackButton /><TaskView task={_.find(TASKS, {id})} /></>;
  };

  let LangRoute = () => {
    let {id} = useParams();
    return <><BackButton /><LangView lang={_.find(LANGUAGES, {id})} /></>;
  };

  return <div>
    <h1>Expressiveness Benchmark</h1>
    <Router>
      <Switch>
        <Route exact path="/task/:id"><TaskRoute /></Route>
        <Route exact path="/lang/:id"><LangRoute /></Route>
        <Route exact path="/"><MatrixRoute /></Route>
      </Switch>
    </Router>
  </div>;
};

ReactDOM.render(<App />, document.getElementById('container'));
