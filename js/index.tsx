import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Program, Task, Language, CodeViewer} from './editor/editor';
import './editor/main.css';
import '../css/index.scss';

//@ts-ignore
import _TASKS from '../data/tasks/*.json';
//@ts-ignore
import _LANGUAGES from '../data/languages/*.json';
//@ts-ignore
import _PROGRAMS from '../data/programs/**/*.json';

const TASKS: Task[] = Object.values(_TASKS);
const LANGUAGES: Language[] = Object.values(_LANGUAGES);
const PROGRAMS: {[task_id:string]: Program[]} =
  _.mapValues(_PROGRAMS, (programs) => Object.values(programs).map((p) => new Program(p)));

let TaskView = ({task}: {task: Task}) => {
  let programs = PROGRAMS[task.id].filter((program) => program.task == task.id);
  return <div>
    <h2>Task: {task.description}</h2>
    {programs.map((program, i) =>
      <div key={i}>
        <div><strong>Language:</strong> {program.language}</div>
        <div><strong>Author:</strong> {program.author}</div>
        <CodeViewer task={task} program={program} />
      </div>
    )}
  </div>
};

let App = () => {
  let [task, set_task] = useState(null);
  let lang_order = ['python-imperative', 'python-functional', 'python-pandas', 'sql', 'datalog'];
  let langs_sorted = lang_order.map((id) => _.find(LANGUAGES, {id}));
  let task_order = ['Basic', 'Aggregation', 'Strings', 'First-order logic'];
  let task_groups = _.groupBy(TASKS, 'category');
  let tasks_sorted = task_order.map((key) => [key, task_groups[key]]);

  let Cell = ({program, task}) =>
    <CodeViewer
      program={program}
      task={task}
      width={"140px"}
      height={"100px"}
      editor_props={{
        showGutter: false,
        fontSize: 4,
        highlightActiveLine: false,
        readOnly: true,
      }}
    />;

  return <div>
    <h1>Expressiveness Benchmark</h1>

    <table className='matrix'>
      <thead>
        <tr>
          <th className='task-kind'>Task type</th>
          <th className='task-kind'>Task name</th>
          {langs_sorted.map((lang) => <th key={lang.id}>{lang.name}</th>)}
        </tr>
      </thead>

      <tbody>
        {tasks_sorted.map(([group, tasks]) =>
          tasks.map((task, i) =>
            <tr key={task.id}>
              {i == 0 ? <td className='task-type' rowSpan={tasks.length}>{group}</td> : null}
              <td className='task-description'>{task.description}</td>
              {langs_sorted.map((lang) => {
                let program = _.find(PROGRAMS[task.id], {language: lang.id});
                return <td className='task-code' key={lang.id}>
                  {program
                    ? <Cell program={program} task={task} />
                    : ''}
                </td>;
              })}
            </tr>)
        )}
      </tbody>
    </table>

    {/* <div className='tasks'>
        {Object.values(TASKS).map((task) =>
        <button key={task.id} onClick={() => {
        set_task(task);
        }}>{task.description}</button>)}
        </div>
        {
        task !== null
        ? <TaskView task={task} />
        : null
        } */}
  </div>;
};

ReactDOM.render(<App />, document.getElementById('container'));
