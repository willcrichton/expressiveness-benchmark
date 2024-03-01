import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import {CodeViewer, PALETTE} from './editor/editor';
import {PROGRAMS, TASKS, LANGUAGES, TASK_GROUP_ORDER} from './data';
import Link from 'next/link'

let get_color = (i: number, opacity?: number) => `rgba(${PALETTE[i].join(', ')}, ${opacity || 1.})`;

export let Code = ({program, ...props}) =>
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
    <strong className='header'>Example input/output:</strong>
    <div className='data-container'>
      {_.map(task.sample_input, (table, key) =>
        <div className='input' key={key}>
          <strong>Input:</strong> <code>{key}</code>
          <JsonTable table={table} />
        </div>)}
      <div className='output'>
        <strong>Output:</strong> <code><Output val={task.sample_output} /></code>
      </div>
    </div>
  </div>;

export let ProgramView = ({program, headers, ...props}) => {
  let task = _.find(TASKS, {id: program.task});
  return <div className='program-container'>
    <h3>{headers.map(k => {
        let val = _.find(k == 'task' ? TASKS : LANGUAGES, {id: program[k]});
        return <Link href={`/${k}/${val.id}`}>{val.name}</Link>
    }).reduce((l, r) => [l, ' / ', r])}</h3>
    <Code program={program} width={'100%'} task={task}
          {...props} />
  </div>;
};

let run_query = query => {
  PROGRAMS.filter(p => {
    let task = _.find(TASKS, {id: p.task});
    if (!task) { return false; }
    return _.toPairs(query).map(([k, v]) =>
      (p.hasOwnProperty(k) ? p[k] : task[k]) == v
    ).reduce((a, b) => a && b)}
  )
}

export let ProgramsView = ({programs, query, ...props}) =>
  _.chunk(programs || run_query(query), 2).map((row, i) =>
    <div className='program-row' key={i}>
      {row.map((program, j) => <ProgramView program={program} key={j} {...props} />)}
    </div>);

export let TaskSpec = ({task, on_selected}) => {
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
          onClick={e => {
            set_selected(selected && selected == plan.id ? null : plan.id);
            e.stopPropagation();
          }}
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

  return <div className='task-spec' onClick={() => set_selected(null)}>
    <strong>Specification: </strong>
    {elts}
  </div>;
};

let PivotView = ({group_key, group_value, pivot_key, show_plan}) => {
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
        {group_key == "task"
          ? <div className='main-sticky'>
            <TaskSpec task={group_value} on_selected={set_plan_selected} />
          </div>
          : null}
        <div className='main-scroll'>
          {group_key == "task" ? <SampleIO task={group_value} /> : null}
          <ProgramsView
            programs={selected_programs}
            headers={[pivot_key]}
            plan_focus={plan_selected} />
        </div>
      </div>
      <div className='sidebar'>
        <div className='sidebar-sticky'><Minimap /></div>
      </div>
    </div>
  </div>
};

export let TaskView = ({task}) =>
  <PivotView group_key={"task"} group_value={task} pivot_key={"language"} show_plan={true} />;

export let LangView = ({lang}) =>
  <PivotView group_key={"language"} group_value={lang} pivot_key={"task"} show_plan={false} />;
