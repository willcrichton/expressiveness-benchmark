from dataclasses import dataclass, field
from dataclasses_json import dataclass_json
from typing import List, Dict
import os
from glob import glob

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
    prelude: str = ''
    source: str = ''

    def fname(self):
        return os.path.join(DATA_DIR, 'programs', f'{self.language}_{self.task}.json')

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
        ])
]}

def save_languages_and_tasks():
    for l in LANGUAGES.values():
        l.save()

    for t in TASKS.values():
        t.save()
