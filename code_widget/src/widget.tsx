// Copyright (c) Will Crichton
// Distributed under the terms of the Modified BSD License.

import React from "react";
import { render } from "react-dom";
import {Editor, Plans} from './editor';

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
