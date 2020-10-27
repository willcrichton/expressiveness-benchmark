from dataclasses import dataclass, field
from dataclasses_json import dataclass_json
from typing import List, Dict, Any
import os
from glob import glob
import sqlite3
import pandas as pd
import tempfile
import subprocess as sp

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

class Base:
    def save(self):
        with open(self.fname(), 'w') as f:
            f.write(self.to_json())

    def load(self):
        return self.from_json(open(self.fname(), 'r').read())


@dataclass_json
@dataclass
class Plan:
    id: str
    description: str

@dataclass_json
@dataclass
class Task(Base):
    id: str
    description: str
    plan: List[Plan]
    sample_input: Dict[str, List[Dict[str, Any]]]
    sample_output: Any

    def fname(self):
        return os.path.join(DATA_DIR, 'tasks', f'{self.id}.json')

@dataclass_json
@dataclass
class Language(Base):
    id: str
    name: str

    def fname(self):
        return os.path.join(DATA_DIR, 'languages', f'{self.id}.json')

@dataclass_json
@dataclass
class SourceRange:
    line: int
    start: int
    end: int

@dataclass_json
@dataclass
class Program(Base):
    task: str
    language: str
    plan: Dict[str, List[SourceRange]] = field(default_factory=dict)
    source: str = ''
    author: str = ''

    def fname(self):
        return os.path.join(DATA_DIR, 'programs', f'{self.language}_{self.task}_{self.author}.json')

    def execute(self, task):
        dataframes = {}
        for table_name, table in task.sample_input.items():
            df = pd.DataFrame(table)
            dataframes[table_name] = df.reindex(sorted(df.columns), axis=1)

        if self.language == 'python':
            globls = {}
            exec(self.source, globls, globls)

            call = f'{task.id}(**{task.sample_input})'
            ret = eval(call, globls, globls)
            assert ret == task.sample_output

        elif self.language == 'sql':
            conn = sqlite3.connect(':memory:')
            try:
                for table_name, df in dataframes.items():
                    df.to_sql(table_name, con=conn)
                conn.commit()
                c = conn.cursor()
                c.execute(self.source)
                ret = c.fetchone()
                assert ret[0] == task.sample_output
            finally:
                conn.close()

        elif self.language == 'datalog':
            type_map = {
                'int64': 'number',
                'object': 'symbol'
            }

            prelude = []
            for table_name, df in dataframes.items():
                columns = [f'{c}:{type_map[str(df[c].dtype)]}' for c in df.columns]
                prelude.append(f'.decl {table_name}({", ".join(columns)})')
                prelude.append(f'.input {table_name}')

            columns = ['name:symbol']
            prelude.append(f'.decl {task.id}({", ".join(columns)})')
            prelude.append(f'.output {task.id}')
            prelude = '\n'.join(prelude)

            program = prelude + '\n' + self.source

            with tempfile.TemporaryDirectory() as path:
                with open(f'{path}/program.dl', 'w') as f:
                    f.write(program)

                for table_name, df in dataframes.items():
                    df.to_csv(f'{path}/{table_name}.facts', sep='\t',
                              index=False, header=False)

                sp.check_call('souffle -F. -D. program.dl', cwd=path, shell=True)

                output = pd.read_csv(f'{path}/{task.id}.csv', header=None)
                assert output[0][0] == task.sample_output

def load_all_programs():
    programs = glob(os.path.join(DATA_DIR, 'programs', '*.json'))
    return [Program.from_json(open(p).read()) for p in programs]

LANGUAGES = {l.id: l for l in [
    Language(id='python', name='Python'),
    Language(id='sql', name='SQL')
]}

TASKS = {t.id: t for t in [
    Task(
        id='youngest_over_35',
        description='Find the name of the youngest person over 35',
        plan=[
            Plan(id='filter', description='Filter >35'),
            Plan(id='min', description='Min by age'),
            Plan(id='name', description='Get the name')
        ],
        sample_input={
            'people': [
                {'age': 35, 'name': 'John'}, {'age': 36, 'name': 'Mary'}, {'age': 37, 'name': 'Jane'}
            ]
        },
        sample_output="Mary"
    )
]}

def save_languages_and_tasks():
    for l in LANGUAGES.values():
        l.save()

    for t in TASKS.values():
        t.save()
