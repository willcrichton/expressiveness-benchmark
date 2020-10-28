import os
import sqlite3
import subprocess as sp
import tempfile
from dataclasses import dataclass, field
from glob import glob
from typing import Any, Dict, List

import pandas as pd
from dataclasses_json import dataclass_json

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


class Base:
    def save(self):
        with open(self.fname(), "w") as f:
            f.write(self.to_json())

    def load(self):
        return self.from_json(open(self.fname(), "r").read())


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
        return os.path.join(DATA_DIR, "tasks", f"{self.id}.json")


@dataclass_json
@dataclass
class Language(Base):
    id: str
    name: str

    def fname(self):
        return os.path.join(DATA_DIR, "languages", f"{self.id}.json")


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
    source: str = ""
    author: str = ""

    def fname(self):
        return os.path.join(
            DATA_DIR, "programs", f"{self.language}_{self.task}_{self.author}.json"
        )

    def to_dataframe(self, value):
        if isinstance(value, pd.DataFrame):
            return value

        if isinstance(value, list):
            if len(value) > 0 and isinstance(value[0], dict):
                return pd.DataFrame(value)
            else:
                return pd.DataFrame([[el] for el in value])
        else:
            return pd.DataFrame([value])

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

    def execute(self, task):
        dataframes = {}
        for table_name, table in task.sample_input.items():
            df = pd.DataFrame(table)
            dataframes[table_name] = df.reindex(sorted(df.columns), axis=1)

        if self.language == "python":
            globls = {}
            exec(self.source, globls, globls)

            call = f"{task.id}(**{task.sample_input})"
            ret = eval(call, globls, globls)

        elif self.language == "sql":
            conn = sqlite3.connect(":memory:")

            # https://stackoverflow.com/questions/3300464/how-can-i-get-dict-from-sqlite-query
            def dict_factory(cursor, row):
                d = {}
                for idx, col in enumerate(cursor.description):
                    d[col[0]] = row[idx]
                return d

            conn.row_factory = dict_factory

            try:
                for table_name, df in dataframes.items():
                    df.to_sql(table_name, con=conn)
                conn.commit()
                c = conn.cursor()
                c.execute(self.source)

                ret = c.fetchall()
                if len(ret) > 0 and len(ret[0]) == 1:
                    ret = [r[list(r.keys())[0]] for r in ret]

            finally:
                conn.close()

        elif self.language == "datalog":

            def columns_to_relation(df):
                type_map = {"int64": "number", "object": "symbol", "float64": "float"}

                def convert_name(c):
                    try:
                        int(c)
                        return f"x{c}"
                    except ValueError:
                        return c

                return [
                    f"{convert_name(c)}:{type_map[str(df[c].dtype)]}"
                    for c in df.columns
                ]

            prelude = []
            for table_name, df in dataframes.items():
                columns = columns_to_relation(df)
                prelude.append(f'.decl {table_name}({", ".join(columns)})')
                prelude.append(f".input {table_name}")

            output_df = self.to_dataframe(task.sample_output)
            columns = columns_to_relation(output_df)
            prelude.append(f'.decl {task.id}({", ".join(columns)})')
            prelude.append(f".output {task.id}")
            prelude = "\n".join(prelude)

            program = prelude + "\n" + self.source

            with tempfile.TemporaryDirectory() as path:
                with open(f"{path}/program.dl", "w") as f:
                    f.write(program)

                for table_name, df in dataframes.items():
                    df.to_csv(
                        f"{path}/{table_name}.facts",
                        sep="\t",
                        index=False,
                        header=False,
                    )

                try:
                    sp.check_output(
                        "souffle -F. -D. program.dl",
                        cwd=path,
                        shell=True,
                        stderr=sp.PIPE,
                    )
                except sp.CalledProcessError as e:
                    print(e.stderr.decode("utf-8"))
                    raise

                try:
                    ret = pd.read_csv(
                        f"{path}/{task.id}.csv",
                        sep="\t",
                        header=None,
                        names=output_df.columns.tolist(),
                    )
                except pd.errors.EmptyDataError:
                    ret = pd.DataFrame()

        self.check_equals(task.sample_output, ret)


def load_all_programs():
    programs = glob(os.path.join(DATA_DIR, "programs", "*.json"))
    return [Program.from_json(open(p).read()) for p in programs]


LANGUAGES = {
    l.id: l
    for l in [Language(id="python", name="Python"), Language(id="sql", name="SQL")]
}

TASKS = {
    t.id: t
    for t in [
        Task(
            id="youngest_over_35",
            description="Find the name of the youngest person over 35",
            plan=[
                Plan(id="filter", description="Filter >35"),
                Plan(id="min", description="Min by age"),
                Plan(id="name", description="Get the name"),
            ],
            sample_input={
                "people": [
                    {"age": 35, "name": "John"},
                    {"age": 36, "name": "Mary"},
                    {"age": 37, "name": "Jane"},
                ]
            },
            sample_output="Mary",
        ),
        Task(
            id="continent_by_population",
            description="Find the continent with the highest average population",
            plan=[],
            sample_input={
                "countries": [
                    {"name": "USA", "population": 328, "continent": "North America"},
                    {"name": "Canada", "population": 37, "continent": "North America"},
                    {"name": "Ethiopia", "population": 109, "continent": "Africa"},
                    {"name": "Kenya", "population": 51, "continent": "Africa"},
                ]
            },
            sample_output="North America",
        ),
        Task(
            id="continent_median_population",
            description="Get the median population continent for each continent",
            plan=[],
            sample_input={
                "countries": [
                    {"name": "USA", "population": 328, "continent": "North America"},
                    {"name": "Canada", "population": 37, "continent": "North America"},
                    {"name": "Ethiopia", "population": 109, "continent": "Africa"},
                    {"name": "Kenya", "population": 51, "continent": "Africa"},
                ]
            },
            sample_output=[
                {"continent": "North America", "population": 182.5},
                {"continent": "Africa", "population": 80.0},
            ],
        ),
        Task(
            id="unique_beer_drinkers",
            description="Find the people who like a unique set of beer",
            plan=[],
            sample_input={
                "likes": [
                    {"name": "will", "beer": "ipa"},
                    {"name": "will", "beer": "lager"},
                    {"name": "scott", "beer": "ipa"},
                    {"name": "scott", "beer": "stout"},
                    {"name": "gleb", "beer": "ipa"},
                    {"name": "gleb", "beer": "stout"},
                    {"name": "fred", "beer": "ipa"},
                    {"name": "fred", "beer": "lager"},
                    {"name": "fred", "beer": "stout"},
                ]
            },
            sample_output=["will", "fred"],
        ),
    ]
}


def save_languages_and_tasks():
    for l in LANGUAGES.values():
        l.save()

    for t in TASKS.values():
        t.save()
