import * as ace from 'ace-builds';
import _ from 'lodash';

// Import the CSS
import '../css/widget.css';

import React, {useState, useEffect} from "react";
import AceEditor from "react-ace";

import "ace-builds/src-min-noconflict/theme-github";
import "ace-builds/src-min-noconflict/mode-python";
import "ace-builds/src-min-noconflict/mode-sql";

// [[round(r*255), round(g*255), round(b*255)] for (r, g, b) in seaborn.color_palette('pastel')]
export const PALETTE = [[161, 201, 244], [255, 180, 130], [141, 229, 161], [255, 159, 155], [208, 187, 255], [222, 187, 155], [250, 176, 228], [207, 207, 207], [255, 254, 163], [185, 242, 240]]

export interface Task {
  id: string
  description: string
  plan: {id: string, description: string}[]
}

export type Plans = {[id: string]: {line: number, start: number, end: number}[]};

export interface Program {
  task: string
  language: string
  source: string
  prelude: string
  plan: Plans
  author: string
}

export interface Language {
  id: string
  name: string
}

export interface CodeViewerProps {
  task: Task,
  program: Program,
  on_load?: (editor: any) => void,
  width?: string,
  height?: string
}

export let CodeViewer = ({task, program, on_load, width, height}: CodeViewerProps) => {
  let plan_index: {[key: string]: number} = {};
  task.plan.forEach((plan: any, i: any) => {
    plan_index[plan.id] = i;
  });

  let plans = program.plan;

  let markers =
    Object.keys(plans).map((plan) =>
      plans[plan].map((range) => ({
        startRow: range.line,
        startCol: range.start,
        endRow: range.line,
        endCol: range.end,
        className: `plan-marker color-${plan_index[plan]}`,
        type: ("text" as any)
      }))
    ).flat();

  return (<div className='code-viewer'>
    <AceEditor
      mode={program.language}
      defaultValue={program.source}
      onLoad={on_load}
      markers={markers}
      width={width || '100%'}
      height={height || '300px'}
      theme='github'
    />
  </div>);
};

export interface EditorProps {
  task: Task
  program: Program
  on_update?: (plans: Plans) => void
}

export let Editor = ({task, program, on_update}: EditorProps) => {
  let [plans, set_plans] = useState(program.plan);
  let [editor, set_editor] = useState<any|null>(null);

  if (on_update) {
    useEffect(() => on_update(plans));
  }

  program.plan = plans;

  return <div className='code-widget'>
    <div>
      <button onClick={() => {
        let range = editor!.getSelectionRange();
        Object.keys(plans).forEach((key) => {
          plans[key] = plans[key].filter((plan) => {
            return !(plan.line == range.start.row &&
              plan.start <= range.start.column &&
              plan.end >= range.end.column);
          });
        });
        set_plans(_.cloneDeep(plans));
      }}>Delete</button>
      {task.plan.map((plan: any, i: any) => {
        let background = `rgb(${PALETTE[i].join(', ')})`;
        let on_click = () => {
          if (!(plan.id in plans)) {
            plans[plan.id] = [];
          }
          let range = editor!.getSelectionRange();
          plans[plan.id].push({
            line: range.start.row,
            start: range.start.column,
            end: range.end.column
          });
          set_plans(_.cloneDeep(plans));
        };
        return <button key={plan.id}
                       style={{background}}
                       onClick={on_click}>
          {plan.description}
        </button>;
      })}
    </div>
    <div>
      <CodeViewer program={program} task={task} on_load={set_editor} />
    </div>
  </div>
};
