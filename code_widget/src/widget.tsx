// Copyright (c) Will Crichton
// Distributed under the terms of the Modified BSD License.

// Temporary hack for this issue: https://github.com/securingsincity/react-ace/issues/954
import * as ace from 'ace-builds';
import _ from 'lodash';

window.ace.require = (window.ace as any).acequire;

import React, {useState, useEffect} from "react";
import { render } from "react-dom";
import AceEditor from "react-ace";


import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

export class CodeModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: CodeModel.model_name,
      _model_module: CodeModel.model_module,
      _model_module_version: CodeModel.model_module_version,
      _view_name: CodeModel.view_name,
      _view_module: CodeModel.view_module,
      _view_module_version: CodeModel.view_module_version,
      data: '{}',
      task: '{}',
      plans: '{}'
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'CodeModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'CodeView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

// [[round(r*255), round(g*255), round(b*255)] for (r, g, b) in seaborn.color_palette('pastel')]
const PALETTE = [[161, 201, 244], [255, 180, 130], [141, 229, 161], [255, 159, 155], [208, 187, 255], [222, 187, 155], [250, 176, 228], [207, 207, 207], [255, 254, 163], [185, 242, 240]]

interface Task {
  id: string
  description: string
  plan: {id: string, description: string}[]
}

type Plans = {[id: string]: {line: number, start: number, end: number}[]};

interface Program {
  language: string
  source: string
  plan: Plans
}

let Editor = ({task, program, on_update}: {task: Task, program: Program, on_update: (plans: Plans) => void}) => {
  let [plans, set_plans] = useState(program.plan);
  let [editor, set_editor] = useState<any|null>(null);

  useEffect(() => on_update(plans));

  let plan_index: {[key: string]: number} = {};
  task.plan.forEach((plan: any, i: any) => {
    plan_index[plan.id] = i;
  });

  let compute_markers = () =>
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
        return <button style={{background}} onClick={on_click}>{plan.description}</button>;
      })}
    </div>
    <div>
      <AceEditor
        mode="python"
        defaultValue={program.source}
        onLoad={(editor) => set_editor(editor)}
        markers={compute_markers()}
        width={'100%'}
        height={'300px'}
      />
    </div>
  </div>
};


export class CodeView extends DOMWidgetView {
  render() {
    let task = JSON.parse(this.model.get('task'));
    let program = JSON.parse(this.model.get('program'));
    let on_update = (plans: Plans) => {
      this.model.set('plans', JSON.stringify(plans));
      this.model.save_changes();
    };

    render(<Editor task={task} program={program} on_update={on_update} />, this.el);
  }
}
