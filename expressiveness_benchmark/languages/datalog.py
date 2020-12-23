import subprocess as sp
import tempfile

import pandas as pd

from ..types import Language


class _Datalog(Language):
    def execute(self, program, task, dataframes, debug=False):
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
                for c in sorted(df.columns)
            ]

        prelude = []
        for table_name, df in dataframes.items():
            columns = columns_to_relation(df)
            prelude.append(f'.decl {table_name}({", ".join(columns)})')
            prelude.append(f".input {table_name}")

        output_df = program.to_dataframe(task.sample_output)
        columns = columns_to_relation(output_df)
        prelude.append(f'.decl {task.id}({", ".join(columns)})')
        prelude.append(f".output {task.id}")
        prelude = "\n".join(prelude)

        program = prelude + "\n" + program.source

        with tempfile.TemporaryDirectory() as path:
            if debug:
                path = tempfile.mkdtemp()
                print("Path:", path)

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
                return pd.read_csv(
                    f"{path}/{task.id}.csv",
                    sep="\t",
                    header=None,
                    names=sorted(output_df.columns.tolist()),
                    dtype=dict(zip(output_df.columns, output_df.dtypes)),
                )
            except pd.errors.EmptyDataError:
                return None


LANGUAGES = [_Datalog(id="datalog", name="Datalog - Souffle")]
