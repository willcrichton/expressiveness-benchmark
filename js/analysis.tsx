import React from 'react';
import _ from 'lodash';
import {Link} from 'react-router-dom';

import {VegaLite} from 'react-vega';
import * as vegaThemes from 'vega-themes';

import {PROGRAM_DATA, LANG_ORDER, LANGUAGES, TASK_GROUP_ORDER, TASKS, PROGRAMS} from './data';
import {Code} from './pivot';

const LANG_NAME_ORDER = LANG_ORDER.map(id => _.find(LANGUAGES, {id}).name);

let axis = {
  language_name: {
    field: 'language_name', type: "nominal",
    sort: LANG_NAME_ORDER, title: "Language"
  },
  task: {
    field: 'task_name', type: "nominal", title: "Task",
    sort: TASKS.map(t => t.name)
  },
  category: {
    field: 'category', type: "nominal", title: "Task Category",
    sort: TASK_GROUP_ORDER,
  },
  ntokens: {
    field: 'ntokens', type: "quantitative", title: "Number of tokens"
  },
  token_zscore: {
    field: 'token_zscore', type: "quantitative", title: "Token Z-score"
  }
};

let Chart = ({spec}) => {
  let final_spec = {
    data: {name: 'data'},
    ...spec,
    config: {
      ...(vegaThemes.vox as any),
      title: {fontSize: 22},
      header: {titleFontSize: 22, labelFontSize: 20},
      axis: {labelFontSize: 16, titleFontSize: 16, labelLimit: 500, maxExtent: 500},
      legend: {labelFontSize: 16, titleFontSize: 16},
      ...spec.config,
    }
  };

  return <VegaLite
           spec={final_spec}
           data={{data: PROGRAM_DATA}}
  />;
};

let median = l => {
  l = _.sortBy(l);
  let middle = Math.round((l.length-1)/2);
  if (l.length % 2 == 1) {
    return l[middle];
  } else {
    return (l[middle-1] + l[middle]) / 2;
  }
};

let sort_by_median = (group, measure) =>
  _.chain(PROGRAM_DATA)
   .groupBy(group)
   .mapValues(t => median(t.map(r => r[measure])))
   .toPairs()
   .sortBy(1)
   .map(t => t[0])
   .value();


let ZscoreChart = ({outer_group, inner_group}) => {
  let extremum = (max, min, neither) => ({
    field: "extremum",
    scale: {domain: ["Worst", "Best", "In-between"], range: [max, min, neither]}
  });

  return <Chart spec={{
    mark: {
      type: "point",
      filled: true,
    },
    transform: [
      {joinaggregate: [{op: "mean", field: "token_zscore", as: "zscore_mean"}],
       groupby: [outer_group, inner_group]},
      {joinaggregate: [
        {op: "max", field: "zscore_mean", as: "zscore_max"},
        {op: "min", field: "zscore_mean", as: "zscore_min"}
      ], groupby: [outer_group]},
      {calculate: "datum.zscore_mean == datum.zscore_min ? 'Best' : (datum.zscore_mean == datum.zscore_max ? 'Worst' : 'In-between')",
       as: "extremum"},
    ],
    encoding: {
      x: {field: "zscore_mean", type: "quantitative", title: "Average z-score"},
      y: axis[inner_group],
      facet: {...axis[outer_group], columns: 4},
      color: extremum("#e41a1c", "#7fc97f", "steelblue"),
      angle: extremum(45, 135, 0), // TODO: values don't map onto max/min/neither ??
      size: extremum(150, 40, 0),
      shape: extremum("cross", "diamond", "circle")
    }
  }} />};


let task_category = _.fromPairs(TASKS.map(t => [t.id, t.category]));
let Programs = ({language, category}) =>
  <div className='program-row'>
    {PROGRAMS
      .filter(p => p.language == language && task_category[p.task] == category)
      .map(program => {
        let task = _.find(TASKS, {id: program.task});
        return <div className='program-container'>
          <strong><Link to={`/task/${task.id}`}>{task.name}</Link></strong>
          <Code program={program} width={'100%'} task={task} show_plan={false} />
        </div>;
      })}
  </div>;

export let AnalysisRoute = () => {
  return <div className='analysis'>
    <h2>Dataset analysis</h2>

    <h3>1. Overall, how concise are programs in each language and category?</h3>

    <p>
      Our goal is to use quantitative metrics to compare the conciseness of programs in each language. We use <strong>number of tokens</strong> to measure program length. For example, the program "<code>(var_name + 1) * 2</code>" has the tokens "<code>[(, var_name, +, 1, ), *, 2]</code>" for a length of 7. Using tokens instead of lines-of-code or number of characters helps control for stylistic differences in indentation, and it does not penalize e.g. longer variable names. The boxplots below show the distribution of the number of tokens in programs for each category, sorted by median.
    </p>

    <Chart spec={{
      mark: "boxplot",
      height: 220,
      title: "Tokens per language",
      encoding: {
        x: axis.ntokens,
        y: {...axis.language_name, sort: sort_by_median('language_name', 'ntokens')}
      }
    }} />

    <Chart spec={{
      mark: "boxplot",
      height: 220,
      title: "Tokens per task category",
      encoding: {
        x: axis.ntokens,
        y: {...axis.category, sort: sort_by_median('category', 'ntokens')}
      }
    }} />

    <h3>2. For a given language, what are its most and least concise tasks?</h3>

    <p>To compare languages within categories, we take each task and assign its programs a <a href="https://en.wikipedia.org/wiki/Standard_score">z-score</a> based on length. The z-score tells us: for a given task (e.g. <Link to="/task/youngest_over_35">Youngest over 35</Link>), how does program's size in one language compare to other languages? A high z-score means a larger program than normal, and low z-score is smaller. Because the z-score is normalized, we can compare z-scores across multiple tasks. A language's highest z-score is its worst category, and lowest z-score is its best category. Below we plot the z-scores for each language and category (z-scores within a given category/language pair are averaged).
    </p>

    <ZscoreChart outer_group="language_name" inner_group="category" />

    {/* <ZscoreChart group="task" /> */}

    <p>To understand these statistics, let's dig into an example. For <strong>Datalog</strong>, its best category is <strong>Joins</strong> and worst category is <strong>Strings</strong>. Here are the two Datalog join programs:
    </p>

    <Programs language='datalog' category='Joins' />

    <p>Datalog has more concise programs for joins because relationships between tables are implicitly expressed by sharing variables across tables. By contrast, languages like SQL require explicit <code>JOIN</code> clauses. But if we look to <strong>Strings</strong>, we can see when Datalog gets verbose:</p>

    <Programs language='datalog' category='Strings' />

    <p>The main issue is that Datalog (i.e. Souffle) does not have many built-in primitives for string process like splitting or removing characters, so re-implementing those primitives requires a lot of code.</p>

    <h3>3. For a given task, what are its most and least concise languages?</h3>

    <p>To answer this question, we can transpose the previous analysis. For each category, we can compare the z-scores for different languages, shown below.</p>

    <ZscoreChart outer_group="category" inner_group="language_name" />

    <p><strong>Python - Imperative</strong> has the most verbose programs for every category except <strong>Strings</strong>. The most concise programs vary mostly between <strong>SQL</strong>, <strong>R</strong>, and <strong>Q</strong>.</p>

  </div>
};
