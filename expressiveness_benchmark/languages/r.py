import rpy2.robjects as ro
from rpy2.robjects import pandas2ri
from rpy2.robjects.conversion import localconverter

from ..types import Language


class _R(Language):
    def execute(self, program, task, dataframes, debug=False):
        with localconverter(ro.default_converter + pandas2ri.converter):
            r_dfs_in = {key: ro.conversion.py2rpy(df) for key, df in dataframes.items()}

            ro.r("library(tidyverse)")
            ro.r(program.source)
            r_df_out = ro.r[task.id](**r_dfs_in)

            return ro.conversion.rpy2py(r_df_out)


LANGUAGES = [_R(id="r", name="R (Tidyverse)")]
