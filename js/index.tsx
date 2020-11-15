import React, {useState, Fragment} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import _ from 'lodash';
import {Program, Task, Language, CodeViewer, PALETTE} from './editor/editor';
import './editor/main.css';
import '../css/index.scss';
import {BrowserRouter as Router, Switch, Route, Link, useHistory, useParams} from 'react-router-dom';

//@ts-ignore
import _TASKS from '../data/tasks/*.json';
//@ts-ignore
import _LANGUAGES from '../data/languages/*.json';
//@ts-ignore
import _PROGRAMS from '../data/programs/**/*.json';

const TASK_GROUP_ORDER = [
  'Basic', 'Aggregation', 'Strings', 'First-order logic', 'Method Chaining',
  'Graph Reachability', 'Time Series'];
const TASKS: Task[] = _.sortBy(
  Object.values(_TASKS),
  [t => _.findIndex(TASK_GROUP_ORDER, c => c == t.category),
   'description']);

const PROGRAMS: Program[] =
  _.map(_PROGRAMS, programs => Object.values(programs).map(p => new Program(p))).flat();

const LANG_ORDER = ['python-imperative', 'python-functional', 'python-pandas', 'sql', 'datalog'];
const LANGUAGES: Language[] = LANG_ORDER.map(id => _LANGUAGES[id]);

let Code = ({program, ...props}) =>
  <CodeViewer
    task={_.find(TASKS, {id: program.task})}
    program={program}
    {...props}
    editor_props={{
      highlightActiveLine: false,
      readOnly: true,
      ...props.editor_props
    }}
  />;

/* TODO: performance bug. Ace is regenerating on every render despite props
 * not changing. Seems like fontSize or something is invoking a render func?

let Cell = ({program, task}) =>
  <Code
    program={program}
    task={task}
    width={"160px"}
    height={"100px"}
    editor_props={{
      showGutter: false,
      fontSize: 4
    }}
  />; */

let Cell = ({program, task}) =>
  <pre style={{width: 160, height: 100, fontSize: 4}}>{program.source}</pre>;

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

let PlanDescription = ({plan}) =>
  <div className='plan-desc'>
    <strong>Task Goals:</strong>
    {plan.map((p, i) => {
      let background = `rgb(${PALETTE[i].join(', ')})`;
      return <span key={p.id}
                   className='goal'
                   style={{background}}>
        {p.description}
      </span>
    })}
  </div>;

let SampleIO = ({task}) =>
  <div className='io'>
    {_.map(task.sample_input, (table, key) =>
      <div key={key}>
        <strong>Input: {key}</strong>
        <JsonTable table={table} />
      </div>)}
    <div>
      <strong>Output:</strong> <code><Output val={task.sample_output} /></code>
    </div>
  </div>;

let PivotView = ({group_key, group_value, pivot_key}) => {
  let programs = PROGRAMS.filter(program => program[group_key] == group_value.id);
  let pivot_values: {id: string}[] =
    pivot_key == 'language' ? LANGUAGES : TASKS;
  let valid_values = pivot_values.filter(v => _.find(programs, {[pivot_key]: v.id}));
  let valid_ids = valid_values.map(v => v.id);

  let [selected, set_selected] = useState(valid_ids);
  let [hover, set_hover] = useState(null);

  let MinimapCell = ({pivot, children}) =>
    <td
      className={classNames({
        header: true,
        hover: hover && hover == pivot,
        selected: _.includes(selected, pivot)
      })}
      onMouseEnter={() => set_hover(pivot)}
      onMouseLeave={() => set_hover(null)}
      onClick={() => {
        let idx = _.findIndex(selected, id => id == pivot);
        if (idx > -1) {
          let s = [...selected];
          s.splice(idx, 1);
          set_selected(s);
        } else {
          set_selected([...selected, pivot]);
        }
      }}
    >{children}</td>;

  let Minimap = () =>
    <div>
      <button onClick={() => {
        set_selected(selected.length == 0 ? valid_ids : []);
      }}>Toggle All</button>
      <table className='minimap code-table'>
        <tbody>
          {
            _.chunk(valid_values, 8).map((vals, i) =>
              <Fragment key={i}>
                <tr>
                  {vals.map(v =>
                    <MinimapCell key={v.id} pivot={v.id}>
                      {v.name}
                    </MinimapCell>)}
                </tr>
                <tr>
                  {vals.map(v => {
                    let program = _.find(programs, {[pivot_key]: v.id});
                    let task = _.find(TASKS, {id: program.task});
                    return <MinimapCell key={v.id} pivot={v.id}>
                      {program
                        ? <Cell program={program} task={task} />
                        : <>Not implemented</>
                      }</MinimapCell>;
                  })}
                </tr>
              </Fragment>
            )
          }
        </tbody>
      </table>
    </div>;

  let selected_programs =
    _.chain(selected)
     .sortBy(id => _.findIndex(valid_values, {id}))
     .map(id => _.find(programs, {[pivot_key]: id}))
     .value();

  return <div className='pivot-view'>
    <h2>{_.capitalize(group_key)}: {group_value.name}</h2>
    <div className='description'>
      <strong>Description:</strong> {group_value.description}
    </div>
    {group_key == "task"
      ? <>
        <SampleIO task={group_value} />
        <PlanDescription plan={group_value.plan} />
      </>
      : null}

    <Minimap />

    {_.chunk(selected_programs, 2).map((progs, i) =>
      <div className='program-row' key={i}>
        {progs.map((prog, j) =>
          <div className='program-container' key={`${i}_${j}`}>
            <h3>{_.find(pivot_values, {id: prog[pivot_key]}).name}</h3>
            <Code program={prog} task={_.find(TASKS, {id: prog.task})} />
          </div>)}
      </div>)}
  </div>
};

let TaskView = ({task}) =>
  <PivotView group_key={"task"} group_value={task} pivot_key={"language"} />;

let LangView = ({lang}) =>
  <PivotView group_key={"language"} group_value={lang} pivot_key={"task"} />;

let Matrix = () => {
  let [hover, set_hover] = useState(null);
  let history = useHistory();

  let task_groups = _.groupBy(TASKS, 'category');
  let tasks_sorted = TASK_GROUP_ORDER.map(key => [key, task_groups[key]]);

  return <table className='matrix code-table'>
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

    <Router basename="/expressiveness-benchmark">
      <Switch>
        <Route path="/task/:id"><TaskRoute /></Route>
        <Route path="/lang/:id"><LangRoute /></Route>
        <Route path="/">
          <Matrix />
        </Route>
      </Switch>
    </Router>
  </div>;
};

ReactDOM.render(<App />, document.getElementById('container'));
