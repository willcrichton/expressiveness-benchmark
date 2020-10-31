#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Will Crichton.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode
from ._frontend import module_name, module_version


class CodeWidget(DOMWidget):
    """TODO: Add docstring here
    """
    _model_name = Unicode('CodeModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('CodeView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    program = Unicode('{}').tag(sync=True)
    task = Unicode('{}').tag(sync=True)
    source = Unicode('').tag(sync=True)
    plan = Unicode('{}').tag(sync=True)
