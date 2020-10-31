// Copyright (c) Will Crichton
// Distributed under the terms of the Modified BSD License.

import React from "react";
import ReactDOM from "react-dom";
import {Editor, Program} from './editor';
import * as mobx from 'mobx';

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

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
      source: '',
      plan: '{}'
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

export class CodeView extends DOMWidgetView {
  render() {
    let task = JSON.parse(this.model.get('task'));
    let program = JSON.parse(this.model.get('program'));

    let model = new Program();
    mobx.extendObservable(model, program);
    model.plan = mobx.observable.map(program.plan);

    mobx.autorun(() => {
      let source = model.source;
      let plan = model.plan;

      // https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
      let replacer = function(this: any, key: string, value: any) {
        let obj = this[key];
        if (obj instanceof Map) {
          let dict: any = {};
          obj.forEach((value, key) => {
            dict[key] = value;
          });
          return dict;
        } else {
          return value;
        }
      };

      this.model.set('source', source);
      this.model.set('plan', JSON.stringify(mobx.toJS(plan), replacer));
      this.model.save_changes();
    });

    ReactDOM.render(<Editor task={task} program={model} />, this.el);
  }
}
