import json
import os
from dataclasses import dataclass, field, replace
from glob import glob
from pathlib import Path
from typing import Any, Dict, List
import tempfile
import subprocess as sp
from iterextras import par_for

import ipywidgets as widgets
import numpy as np
import pandas as pd
from dataclasses_json import dataclass_json
from IPython.display import display

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


class Base:
    def validate(self):
        pass

    def path(self):
        return os.path.join(self.fdir(), self.fname())

    def save(self):
        self.validate()

        p = Path(self.path())
        p.parent.mkdir(parents=True, exist_ok=True)

        with p.open("w") as f:
            f.write(self.to_json())

    def load(self):
        return self.from_json(open(self.path(), "r").read())

    @classmethod
    def _load_all(cls):
        paths = glob(os.path.join(cls.fdir(), "**", "*.json"), recursive=True)
        return [cls.from_json(open(path).read()) for path in paths]

    @classmethod
    def load_all(cls):
        return pd.DataFrame(cls._load_all())


@dataclass_json
@dataclass
class Plan:
    id: str
    description: str


@dataclass_json
@dataclass
class Task(Base):
    id: str
    category: str = ""
    name: str = ""
    description: str = ""
    plan: List[Plan] = field(default_factory=list)
    sample_input: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    sample_output: Any = None

    @staticmethod
    def fdir():
        return os.path.join(DATA_DIR, "tasks")

    def fname(self):
        return f"{self.id}.json"

    def validate(self):
        assert self.sample_input is not None
        assert self.sample_output is not None


@dataclass_json
@dataclass
class Language(Base):
    id: str
    name: str

    @staticmethod
    def fdir():
        return os.path.join(DATA_DIR, "languages")

    def fname(self):
        return f"{self.id}.json"

    def execute(self, program, task, debug=False):
        raise NotImplementedError

    def ntokens(self, program):
        with tempfile.NamedTemporaryFile() as f:
            f.write(program.encode('utf-8'))
            f.flush()

            out = sp.check_output(
                f'node index.js {f.name} {self.id}',
                shell=True,
                cwd=os.path.join(os.path.dirname(__file__), "..", "scripts", "tokenizer"),
                stderr=sp.PIPE)

            return int(out)


@dataclass_json
@dataclass
class SourceRange:
    line: int
    start: int
    end: int

    def slice(self, lines):
        try:
            return lines[self.line][self.start:self.end+1]
        except IndexError:
            return ''


@dataclass_json
@dataclass
class Program(Base):
    task: str
    language: str
    plan: Dict[str, List[SourceRange]] = field(default_factory=dict)
    source: str = ""
    author: str = ""
    implementation: str = ""

    @staticmethod
    def fdir():
        return os.path.join(DATA_DIR, "programs")

    def fname(self):
        return os.path.join(
            self.task,
            f"{self.language}_{self.implementation}_{self.author}.json",
        )

    def language_obj(self):
        return LANGUAGES[self.language]

    @classmethod
    def load_all(cls):
        progs = cls._load_all()
        def compute_tokens(p):
            lang = p.language_obj()
            ntokens = lang.ntokens(p.source)
            lines = p.source.split('\n')
            plan_ntokens = {
                k: [{**json.loads(r.to_json()), 'ntokens': lang.ntokens(r.slice(lines))}
                    for r in ranges]
                for k, ranges in p.plan.items()
            }
            return {
                'ntokens': ntokens,
                'plan': plan_ntokens
            }
        ntokens = pd.DataFrame(par_for(compute_tokens, progs))

        df = pd.DataFrame(progs)
        df['ntokens'] = ntokens.ntokens
        df['plan'] = ntokens.plan

        return df

    def validate(self):
        try:
            Task(id=self.task).load()
        except FileNotFoundError:
            assert False, f"{self.task} is not a valid task"
        assert self.author != "", "Author must not be empty"
        assert self.source != "", "Source must not be empty"
        assert self.language in LANGUAGES, f"{self.language} is not a valid language"

    def load_plan(self):
        try:
            saved_self = self.load()
            return replace(self, plan=saved_self.plan)
        except FileNotFoundError:
            return self

    def widget(self, task):
        from code_widget.example import CodeWidget

        initial_plan = json.dumps(json.loads(self.to_json())["plan"])
        widget = CodeWidget(program=self.to_json(), task=task.to_json())
        output = widgets.Output()
        display(output)

        def save_plan_changes(changes):
            with output:
                if changes["name"] == "plan":
                    new_plan = json.loads(changes["new"])
                    if json.dumps(new_plan) != initial_plan:
                        self.plan = new_plan
                        self.save()
                elif changes["name"] == "source":
                    self.source = changes["new"]
                    # self.save()

        widget.observe(save_plan_changes, names=["plan", "source"])

        return widget

    def to_dataframe(self, value):
        def to_df():
            if isinstance(value, pd.DataFrame):
                return value

            if isinstance(value, (list, tuple, np.ndarray)):
                if len(value) > 0 and isinstance(value[0], dict):
                    return pd.DataFrame(value)
                else:
                    return pd.DataFrame([[el] for el in value])
            else:
                return pd.DataFrame([value])

        df = to_df()
        d = dict.fromkeys(df.select_dtypes(np.number).columns, np.float64)
        df = df.astype(d)
        return df.reindex(sorted(df.columns), axis=1)

    def check_equals(self, target, actual):
        target = self.to_dataframe(target)
        actual = self.to_dataframe(actual)

        try:
            target = target.sort_values(by=target.columns[0], ignore_index=True)
            actual = actual.sort_values(by=target.columns[0], ignore_index=True)

            if not target.equals(actual):
                assert False
        except Exception:
            print("Mismatch between target and actual output.")
            print("Target: ", target)
            print("Actual: ", actual)
            raise

    def execute(self, task, debug=False):
        dataframes = {}
        for table_name, table in task.sample_input.items():
            df = pd.DataFrame(table)
            dataframes[table_name] = df.reindex(sorted(df.columns), axis=1)

        ret = LANGUAGES[self.language].execute(self, task, dataframes, debug)

        self.check_equals(task.sample_output, ret)


from .languages.datalog import LANGUAGES as L3
from .languages.python import LANGUAGES as L1
from .languages.q import LANGUAGES as L5
from .languages.r import LANGUAGES as L4
from .languages.sql import LANGUAGES as L2

LANGUAGES = {l.id: l for l in L1 + L2 + L3 + L4 + L5}


def save_languages():
    for l in LANGUAGES.values():
        l.save()
