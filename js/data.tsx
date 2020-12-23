import _ from 'lodash';
import {Program, Task, Language} from './editor/editor';

//@ts-ignore
import _TASKS from '../data/tasks/*.json';
//@ts-ignore
import _LANGUAGES from '../data/languages/*.json';
//@ts-ignore
import _PROGRAMS from '../data/programs/**/*.json';

//@ts-ignore
export {default as PROGRAM_DATA} from '../data/analysis/programs.json';

export const TASK_GROUP_ORDER = [
  'Basic', 'Joins', 'Aggregation', 'Strings', 'First-order logic',
  'Time Series', 'Graphs'];
export const TASK_BLACKLIST = ['customer_orders', 'unique_product', 'average_adjacent'];
export const TASKS: Task[] =
  _.sortBy(
    Object.values(_TASKS),
    [t => _.findIndex(TASK_GROUP_ORDER, c => c == t.category),
     'name'])
   .filter(t => !_.includes(TASK_BLACKLIST, t.id))

export const PROGRAMS: Program[] =
  _.map(_PROGRAMS, programs => Object.values(programs).map(p => new Program(p)))
   .flat();

export const LANG_ORDER = ['python-imperative', 'python-functional', 'python-pandas', 'r', 'sql', 'datalog', 'q'];
export const LANGUAGES: Language[] = LANG_ORDER.map(id => _LANGUAGES[id]);
