import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Program, Task, Language, CodeViewer} from './editor/editor';
import './editor/main.css';

//@ts-ignore
import _TASKS from '../data/tasks/*.json';
//@ts-ignore
import _LANGUAGES from '../data/languages/*.json';
//@ts-ignore
import _PROGRAMS from '../data/programs/*.json';

const TASKS: Task[] = Object.values(_TASKS);
const LANGUAGES: Language[] = Object.values(_LANGUAGES);
const PROGRAMS: Program[] = Object.values(_PROGRAMS);

let TaskView = ({task}: {task: Task}) => {
  let programs = PROGRAMS.filter((program) => program.task == task.id);
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
  return <div>
    <h1>Expressiveness Benchmark</h1>
    <div className='tasks'>
      {Object.values(TASKS).map((task) =>
        <button key={task.id} onClick={() => {
          set_task(task);
        }}>{task.description}</button>)}
    </div>
    {
      task !== null
      ? <TaskView task={task} />
      : null
    }
  </div>;
};

ReactDOM.render(<App />, document.getElementById('container'));
