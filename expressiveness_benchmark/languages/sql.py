import sqlite3

from ..types import Language


class _Sql(Language):
    def execute(self, program, task, dataframes, debug=False):
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

            commands = program.source.split(";")
            for cmd in commands:
                c.execute(cmd)

            ret = c.fetchall()
            if len(ret) > 0 and len(ret[0]) == 1:
                return [r[list(r.keys())[0]] for r in ret]
            return None

        finally:
            conn.close()


LANGUAGES = [_Sql(id="sql", name="SQL (SQLite)")]
