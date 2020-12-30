import _ from 'lodash';
import {Program, Task, Language} from './editor/editor';

import _TASKS from '../data/tasks.json';
import _LANGUAGES from '../data/languages.json';
import _PROGRAMS from '../data/programs.json';

//@ts-ignore
export {default as PROGRAM_DATA} from '../data/analysis/programs.json';

export const TASK_GROUP_ORDER = [
  'Aggregation', 'Joins', 'Strings', 'First-order logic',
  'Time Series', 'Graphs'];
export const TASK_BLACKLIST = ['customer_orders', 'unique_product', 'average_adjacent'];
export const TASKS: Task[] =
  _.sortBy(
    _TASKS,
    [t => _.findIndex(TASK_GROUP_ORDER, c => c == t.category),
     'name'])
   .filter(t => !_.includes(TASK_BLACKLIST, t.id))

export const PROGRAMS: Program[] = _PROGRAMS.map(p => new Program(p));

export const LANG_ORDER = ['python-imperative', 'python-functional', 'python-pandas', 'r', 'sql', 'datalog', 'q'];
export const LANGUAGES: Language[] =
  _.sortBy(_LANGUAGES, t => _.findIndex(LANG_ORDER, i => i == t.id));
