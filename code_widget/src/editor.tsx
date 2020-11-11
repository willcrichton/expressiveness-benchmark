import * as ace from 'ace-builds';
import _ from 'lodash';
import {observer} from 'mobx-react';
import {observable, ObservableMap, toJS, extendObservable} from 'mobx';

let _window = window as any;
if (_window.ace && _window.ace.acequire) {
  _window.ace.require = _window.ace.acequire;
}

// Import the CSS
import '../css/widget.css';

import React, {useState, useEffect} from "react";
import AceEditor from "react-ace";

import "ace-builds/src-min-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/mode-python";
import "ace-builds/src-min-noconflict/mode-sql";
import "ace-builds/src-min-noconflict/mode-prolog";

// [[round(r*255), round(g*255), round(b*255)] for (r, g, b) in seaborn.color_palette('pastel')]
export const PALETTE = [[161, 201, 244], [255, 180, 130], [141, 229, 161], [255, 159, 155], [208, 187, 255], [222, 187, 155], [250, 176, 228], [207, 207, 207], [255, 254, 163], [185, 242, 240]]

export interface Task {
  id: string
  category: string
  name: string
  description: string
  plan: {id: string, description: string}[]
  sample_input: {[key:string]: any[]}
  sample_output: any
}

export type SourceRange = {line: number, start: number, end: number};

export class Program {
  @observable source: string;
  @observable plan: ObservableMap<string, SourceRange[]>;
  task: string;
  language: string;
  author: string;

  constructor(json: any) {
    extendObservable(this, json);
    this.plan = observable.map(json.plan);
  }
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
  height?: string,
  editor_props?: any
}

let compute_markers = (task: Task, program: Program) => {
  let plan = program.plan;
  let plan_index: {[key: string]: number} = {};
  task.plan.forEach((plan: any, i: any) => {
    plan_index[plan.id] = i;
  });

  return program.source.split('\n').map((contents, line) => {
    let max_col = contents.length;
    let ranges =
      Array.from(plan.entries())
           .map(([key, ranges]) =>
             ranges.filter((range: SourceRange) => range.line == line)
                   .map((range: SourceRange) => ({elt: key, range})))
           .flat();
    ranges = _.sortBy(ranges, ({range}) => range.start);

    let markers: any[] = [];
    let current_range: number | null = null;
    let active: {[key:string]: number} = {};

    let flush = (i:number) => {
      let indices =
        _.sortBy(Object.keys(active))
         .map((key) => plan_index[key])
         .join("-");
      markers.push({
        startRow: line,
        startCol: current_range,
        endRow: line,
        endCol: i,
        className: `plan-marker color-${indices}`,
        type: ("text" as any)
      });
    };

    for (let i = 0; i < max_col; ++i) {
      let starting_ranges = ranges.filter(({range}) => range.start == i);
      if (starting_ranges.length > 0) {
        if (current_range !== null) {
          flush(i);
        }

        starting_ranges.forEach(({elt, range}) => {
          active[elt] = range.end;
        });

        current_range = i;
      }

      let finished_ranges = Object.keys(active).filter((key) => active[key] == i);
      if (finished_ranges.length > 0) {
        flush(i);
      }
      finished_ranges.forEach((key) => { delete active[key]; });

      if (Object.keys(active).length == 0) {
        current_range = null;
      }
    }

    if (Object.keys(active).length > 0) {
      flush(max_col);
    }

    return markers;
  }).flat();

}

export let CodeViewer = observer(({task, program, on_load, width, height, editor_props}: CodeViewerProps) => {
  let mode =
    program.language == "sql" ? "sql"
      : program.language == "datalog" ? "prolog"
      : "python";

  let markers = compute_markers(task, program);

  let on_change = (source: string) => {
    program.source = source;
  };

  let num_lines = program.source.split('\n').length;
  let line_height = 23;

  return (<div className='code-viewer'>
    <AceEditor
      mode={mode}
      defaultValue={program.source}
      markers={markers}
      width={width || '100%'}
      height={height || line_height * num_lines}
      theme='textmate'
      onLoad={on_load}
      onChange={on_change}
      showPrintMargin={false}
      fontSize={16}
      {...editor_props}
    />
  </div>);
});

export interface EditorProps {
  task: Task
  program: Program
}

export let Editor = observer(({task, program}: EditorProps) => {
  let [editor, set_editor] = useState<any|null>(null);
  let plan = program.plan;
  let lines = program.source.split('\n');

  let line_start = (line:number) => {
    let s = lines[line];
    return s.indexOf(s.trim());
  };

  return <div className='code-widget'>
    <div>
      <button onClick={() => {
        let range = editor!.getSelectionRange();
        plan.forEach((elt, key) => {
          plan.set(key, elt.filter((other_range: SourceRange) => {
            return !(other_range.line == range.start.row &&
              other_range.start <= range.start.column &&
              other_range.end >= range.end.column);
          }));
        });
      }}>Delete</button> &nbsp;

      {task.plan.map((elt: any, i: any) => {
        let background = `rgb(${PALETTE[i].join(', ')})`;
        let on_click = () => {
          let range = editor!.getSelectionRange();
          let [start_row, end_row] = [range.start.row, range.end.row];

          // If selecting multiple rows, then break up each line
          // Three cases: top line, middle lines, bottom line
          if (!plan.has(elt.id)) { plan.set(elt.id, []); }
          let entry = plan.get(elt.id)!;
          if (start_row != end_row) {
            entry.push({
              line: start_row,
              start: range.start.column,
              end: lines[start_row].length
            });

            _.range(start_row+1, end_row).forEach((row) => {
              entry.push({
                line: row,
                start: line_start(row),
                end: lines[row].length
              });
            });

            // If a person highlights an entire line, then the cursor might
            // move to the start of the next line. But we don't want to include
            // that empty line
            if (range.end.column > 0) {
              entry.push({
                line: end_row,
                start: line_start(end_row),
                end: range.end.column
              });
            }
          } else {
            entry.push({
              line: range.start.row,
              start: range.start.column,
              end: range.end.column
            });
          }
        };

        return <button key={elt.id}
                       style={{background}}
                       onClick={on_click}>
          {elt.description}
        </button>;
      })}
    </div>
    <div>
      <CodeViewer program={program} task={task} on_load={set_editor} />
    </div>
  </div>
});
