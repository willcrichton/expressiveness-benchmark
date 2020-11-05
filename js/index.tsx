import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import _ from 'lodash';
import {Program, Task, Language, CodeViewer} from './editor/editor';
import './editor/main.css';
import '../css/index.scss';
import {BrowserRouter as Router, Switch, Route, Link, useHistory, useParams} from 'react-router-dom';

//@ts-ignore
import _TASKS from '../data/tasks/*.json';
//@ts-ignore
import _LANGUAGES from '../data/languages/*.json';
//@ts-ignore
import _PROGRAMS from '../data/programs/**/*.json';

const TASKS: Task[] = Object.values(_TASKS);
const PROGRAMS: {[task_id:string]: Program[]} =
  _.mapValues(_PROGRAMS, (programs) => Object.values(programs).map((p) => new Program(p)));

const LANG_ORDER = ['python-imperative', 'python-functional', 'python-pandas', 'sql', 'datalog'];
const LANGUAGES: Language[] = LANG_ORDER.map((id) => _LANGUAGES[id]);


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

let TaskView = ({task}: {task: Task}) => {
  let [selected, set_selected] = useState([]);
  let [hover, set_hover] = useState(null);

  let programs = PROGRAMS[task.id].filter((program) => program.task == task.id);

  let MinimapCell = ({Tag, lang, children}) =>
    <Tag
      className={classNames({
        hover: hover && hover == lang.id,
        selected: _.includes(selected, lang.id)
      })}
      onMouseEnter={() => set_hover(lang.id)}
      onMouseLeave={() => set_hover(null)}
      onClick={() => {
        let idx = _.findIndex(selected, (id) => id == lang.id);
        if (idx > -1) {
          let s = [...selected];
          s.splice(idx);
          set_selected(s);
        } else {
          set_selected([...selected, lang.id]);
        }
      }}
    >{children}</Tag>;

  let Minimap = () =>
    <div>
      <button onClick={() => {
        if (selected.length == 0) {
          set_selected(LANGUAGES
            .filter(lang => _.find(programs, {language: lang.id}))
            .map(lang => lang.id));
        } else {
          set_selected([]);
        }
      }}>Toggle All</button>
      <table className='minimap'>
        <thead>
          <tr>{LANGUAGES.map(lang =>
            <MinimapCell Tag={props => <th {...props} />} lang={lang}>
              {lang.name}
            </MinimapCell>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            {LANGUAGES.map(lang => {
              let program = _.find(programs, {language: lang.id});
              return <MinimapCell Tag={props => <td {...props} />} lang={lang}>
                {program
                  ? <Cell program={program} task={task} />
                  : <>Not implemented</>
                }</MinimapCell>;
            })}
          </tr>
        </tbody>
      </table>
    </div>;

  let selected_programs = selected.map(language => _.find(programs, {language}));

  return <div>
    <h2>Task: {task.description}</h2>
    <Minimap />

    {_.chunk(selected_programs, 2).map(progs =>
      <div className='program-row'>
        {progs.map(prog =>
          <div className='program-container'>
            <h3>{_.find(LANGUAGES, {id: prog.language}).name}</h3>
            <Code program={prog} task={task} />
          </div>)}
      </div>)}
    </div>
};

let LangView = ({lang}) => {
  let programs =
    _.chain(PROGRAMS)
     .values()
     .flatten()
     .filter((program) => program.language == lang.id)
     .value();

  return <div>
    <h2>Language: {lang.name}</h2>
    {programs.map((program, i) => {
      let task = _.find(TASKS, {id: program.task});
      return <div key={i} className='program-container'>
        <div><strong>Task:</strong> {task.description}</div>
        <div><strong>Author:</strong> {program.author}</div>
        <Code program={program} />
      </div>;
    })}
  </div>;
};

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
  />;

let Matrix = () => {
  let [hover, set_hover] = useState(null);
  let history = useHistory();

  let task_order = ['Basic', 'Aggregation', 'Strings', 'First-order logic', 'Method Chaining', 'Graph Reachability', 'Time Series'];

  let task_groups = _.groupBy(TASKS, 'category');
  let tasks_sorted = task_order.map((key) => [key, task_groups[key]]);

  return <table className='matrix'>
    <thead>
      <tr>
        <th className='task-kind'>Task type</th>
        <th className='task-kind'>Task name</th>
        {LANGUAGES.map((lang) => {
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
              {task.description}
            </td>
            {LANGUAGES.map((lang) => {
              let program = _.find(PROGRAMS[task.id], {language: lang.id});
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
