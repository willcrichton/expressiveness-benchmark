from dataclasses import dataclass, field
from dataclasses_json import dataclass_json
from typing import List, Dict
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

@dataclass_json
@dataclass
class Plan:
    id: str
    description: str

@dataclass_json
@dataclass
class Task:
    id: str
    description: str
    plan: List[Plan]

@dataclass_json
@dataclass
class Language:
    id: str
    name: str

@dataclass_json
@dataclass
class SourceRange:
    line: int
    start: int
    end: int

@dataclass_json
@dataclass
class Program:
    task: str
    language: str
    plan: Dict[str, List[SourceRange]] = field(default_factory=dict)
    prelude: str = ''
    source: str = ''

    def fname(self):
        return os.path.join(DATA_DIR, f'{self.language}_{self.task}.json')

    def save(self):
        with open(self.fname(), 'w') as f:
            f.write(self.to_json())

    def load(self):
        return self.from_json(open(self.fname(), 'r').read())

LANGUAGES = [
    Language(id='python', name='Python')
]

TASKS = [
    Task(
        id='youngest_over_35',
        description='Find the name of the youngest person over 35',
        plan=[
            Plan(id='filter', description='Filter >35'),
            Plan(id='min', description='Min by age'),
            Plan(id='name', description='Get the name')
        ])
]
