import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import './editor/main.css';
import '../css/index.scss';
import {HashRouter as Router, Switch, Route, Link, useHistory, useParams} from 'react-router-dom';
import {PROGRAMS, TASKS, LANGUAGES, TASK_GROUP_ORDER} from './data';
import {Cell, LangView, TaskView} from './pivot';
import {AnalysisRoute} from './analysis';

let MatrixRoute = () => {
  let [hover, set_hover] = useState(null);
  let history = useHistory();

  let task_groups = _.groupBy(TASKS, 'category');
  let tasks_sorted = TASK_GROUP_ORDER.map(key => [key, task_groups[key]]);

  return <div>
    <p>
      This benchmark is a collection of programs implementing tabular data analytics tasks, similar to <a href="https://rosettacode.org/">Rosetta Code</a> or <a href="https://eugenkiss.github.io/7guis/">7GUIs</a>. This benchmark has two goals:
    </p>
    <ol>
      <li>
        <strong>Assist in cross-language learning.</strong>
        {" A common problem in learning to program is tutorials assume a different background than yours. The task/language matrix can provide insight for many pairs of background/learning goal. For example, if you know Python and want to learn R, then you can look at correspondences between many examples."}
      </li>
      <li>
        <strong>Quantify the relationship between programs and tasks.</strong>
        {" The dream of declarative programming is for a program to be as close as possible to its specification. Is it possible to quantify the conceptual distance between a program and task?"}
      </li>
    </ol>
    <p>Click on a task name below (like <Link to="/task/youngest_over_35">Youngest over 35</Link>) to see its specification and implementations.<br /> Click on <Link to="/analysis">Dataset analysis</Link> to see a statistical comparison of languages based on conciseness.</p>
    <table className='matrix code-table'>
      <thead>
        <tr>
          <th className='task-kind'>Category</th>
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
  let TaskRoute = () => {
    let {id} = useParams();
    return <TaskView task={_.find(TASKS, {id})} />
  };

  let LangRoute = () => {
    let {id} = useParams();
    return <LangView lang={_.find(LANGUAGES, {id})} />;
  };

  return <div>
    <Router>
      <div className='title'>
        <h1>
          Expressiveness Benchmark
        </h1>
        <nav>
          <Link to="/">Task matrix</Link>
          <Link to="/analysis">Dataset analysis</Link>
        </nav>
      </div>
      <Switch>
        <Route exact path="/task/:id"><TaskRoute /></Route>
        <Route exact path="/lang/:id"><LangRoute /></Route>
        <Route exact path="/analysis"><AnalysisRoute /></Route>
        <Route exact path="/"><MatrixRoute /></Route>
      </Switch>
    </Router>
  </div>;
};

ReactDOM.render(<App />, document.getElementById('container'));
