from ..types import Language


class _Python(Language):
    def execute(self, program, task, dataframes, debug=False):
        globls = {}
        imports = [
            "import pandas as pd",
            "import numpy as np",
            "from collections import defaultdict",
            "import math",
        ]

        exec(
            "\n".join(imports) + "\n" + program.source,
            globls,
            globls,
        )

        args = [
            f"{k}=pd.DataFrame({v})" if "pandas" in self.id else f"{k}={v}"
            for k, v in task.sample_input.items()
        ]

        call = f"{task.id}({', '.join(args)})"
        return eval(call, globls, globls)


LANGUAGES = [
    _Python(id="python-imperative", name="Python (Imperative)"),
    _Python(id="python-functional", name="Python (Functional)"),
    _Python(id="python-pandas", name="Python (Pandas)"),
]
