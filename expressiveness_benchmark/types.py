from dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import List, Dict

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
    plan: Dict[str, List[SourceRange]]
    source: str

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
