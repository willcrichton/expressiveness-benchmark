import subprocess as sp
import tempfile

import pandas as pd

from ..types import Language


class _Q(Language):
    def execute(self, program, task, dataframes, debug=False):
        with tempfile.TemporaryDirectory() as path:
            if debug:
                path = tempfile.mkdtemp()

            csv_commands = []
            for k, df in dataframes.items():
                df.to_csv(f"{path}/{k}.csv", index=False)
                type_map = {"int64": "I", "object": "*", "float64": "F"}
                types = "".join([type_map[str(c)] for c in df.dtypes])

                # HACK: Q can't seem to open 1-column CSVs?
                if len(df.dtypes) == 1:
                    types += "*"
                csv_commands.append(f'{k}:("{types}"; enlist ",") 0:`:{path}/{k}.csv')

            if isinstance(task.sample_output, list):
                if isinstance(task.sample_output[0], dict):
                    output_convert = "output"
                else:
                    output_convert = "([] c:output)"
            else:
                output_convert = "([] c:enlist[output])"

            query = f"""
output: {task.id}
output: {output_convert}
output: (asc cols output) xcols output
save `:output.csv
"""
            script = "\n".join(csv_commands + [program.source, query])
            with open(f"{path}/prog.q", "w") as f:
                f.write(script)

            if debug:
                print(path)
                print(script)

            try:
                sp.check_output("$QHOME/q prog.q", cwd=path, shell=True, stderr=sp.PIPE)
            except sp.CalledProcessError as e:
                print(e.stderr.decode("utf-8"))
                raise

            output_df = program.to_dataframe(task.sample_output)
            df = pd.read_csv(
                f"{path}/output.csv",
                header=0,
                dtype=dict(zip(output_df.columns, output_df.dtypes)),
            )

            if len(df.columns) == 1:
                return df[df.columns[0]].tolist()
            else:
                return df


LANGUAGES = [
    _Q(id="q", name="Q - kdb+"),
]
