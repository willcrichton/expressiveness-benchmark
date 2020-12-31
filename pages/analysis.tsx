import React, {useState, useEffect} from 'react';
import _ from 'lodash';
import Link from 'next/link'

import {VegaLite} from 'react-vega';
import * as vegaThemes from 'vega-themes';

import {PROGRAM_DATA, LANG_ORDER, LANGUAGES, TASK_GROUP_ORDER, TASKS, PROGRAMS} from '../components/data';
import {TaskSpec, ProgramsView, run_query} from '../components/pivot';

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
  },
  plan_overlap: {
    field: 'plan_overlap', type: 'quantitative', title: 'Number of overlapping plans'
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
   .mapValues(t => {
     let vals = t.map(r => r[measure]);
     return [median(vals), _.mean(vals)];
   })
   .toPairs()
   .sortBy([t => t[1][0], t => t[1][1]])
   .map(t => t[0])
   .value();

let task_category = _.fromPairs(TASKS.map(t => [t.id, t.category]));

let ProgramsSimple = (props) =>
  <ProgramsView
    query={props}
    headers={['task']}
    show_plan={false}
  />;

let MiniTask = ({task_id, languages}) => {
  let [plan_selected, set_plan_selected] = useState(null);
  let task = _.find(TASKS, {id: task_id});
  return <>
    <TaskSpec task={task} on_selected={set_plan_selected} />
    <ProgramsView
      programs={languages.map(language => _.find(PROGRAMS, {task: task_id, language}))}
      headers={['language']}
      plan_focus={plan_selected} />
  </>;
};

let ZscoreChart = ({outer_group, inner_group, columns}) => {
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
      x: {field: "zscore_mean", type: "quantitative", title: "Average z-score",
          scale: {domain: [-2.2, 2.2]}},
      y: axis[inner_group],
      facet: {...axis[outer_group], columns},
      color: extremum("#e41a1c", "#7fc97f", "steelblue"),
      angle: extremum(45, 135, 0), // TODO: values don't map onto max/min/neither ??
      size: extremum(150, 40, 0),
      shape: extremum("cross", "diamond", "circle")
    }
  }} />};


let questions = [
  {title: "Overall, how concise are programs in each language and category?",
   body: <>
     <p>
       Our goal is to use quantitative metrics to compare the conciseness of programs in each language. We use <strong>number of tokens</strong> to measure program length. For example, the program "<code>(var_name + 1) * 2</code>" has the tokens "<code>[(, var_name, +, 1, ), *, 2]</code>" for a length of 7. Using tokens instead of lines-of-code or number of characters helps control for stylistic differences in indentation, and it does not penalize e.g. longer variable names. The boxplots below show the distribution of the number of tokens in programs for each category, sorted by median.
     </p>

     <center>
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
     </center>
   </>},

  {title: "For a given language, what are its most and least concise tasks?",
   body: <>
     <p>To compare languages within categories, we take each task and assign its programs a <a href="https://en.wikipedia.org/wiki/Standard_score">z-score</a> based on length. The z-score tells us: for a given task (e.g. <Link href="/task/youngest_over_35">Youngest over 35</Link>), how does program's size in one language compare to other languages? A high z-score means a larger program than normal, and low z-score is smaller. Because the z-score is normalized, we can compare z-scores across multiple tasks. A language's highest z-score is its worst category, and lowest z-score is its best category. Below we plot the z-scores for each language and category (z-scores within a given category/language pair are averaged).
     </p>

     <center>
       <ZscoreChart outer_group="language_name" inner_group="category" columns={4} />
     </center>

     <p>To understand these statistics, let's dig into an example. For <strong>Datalog</strong>, its best category is <strong>Joins</strong> and worst category is <strong>Strings</strong>. Here are the two Datalog join programs:
     </p>

     <ProgramsSimple language='datalog' category='Joins' />

     <p>Datalog has more concise programs for joins because relationships between tables are implicitly expressed by sharing variables across tables. By contrast, languages like SQL require explicit <code>JOIN</code> clauses. But if we look to <strong>Strings</strong>, we can see when Datalog gets verbose:</p>

     <ProgramsSimple language='datalog' category='Strings' />

     <p>The main issue is that Datalog (i.e. Souffle) does not have many built-in primitives for string process like splitting or removing characters, so re-implementing those primitives requires a lot of code.</p>
   </>},

  {title: "For a given task, what are its most and least concise languages?",
   body: <>
     <p>To answer this question, we can transpose the previous analysis. For each category, we can compare the z-scores for different languages, shown below.</p>

     <center>
       <ZscoreChart outer_group="category" inner_group="language_name" columns={3} />
     </center>

     <p><strong>Python - Imperative</strong> has the most verbose programs for every category except <strong>Strings</strong>. The most concise programs vary mostly between <strong>SQL</strong>, <strong>R</strong>, and <strong>Q</strong>.</p>

   </>},

  {title: "How much do plans overlap in each language?",
   body: <>
     <p>
       Each program is annotated by which pieces of the code implement which sub-goals of a task. For example, the <Link href="/task/continent_by_population">Continent with highest average population</Link> task:
     </p>

     <MiniTask
       task_id={"continent_by_population"}
       languages={["python-imperative", "python-functional"]} />

     <p>
       For a given sub-goal, e.g. "average population", the set of corresponding highlighted regions is collectively its <strong>plan</strong>. Plans can tell us how hard or easy a program may be to write or read. For example, Elliot Soloway <a href="https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.11.6583&rep=rep1&type=pdf">found in the 1980s</a> that merging two plans together is hard for programmers. In the <strong>Python - Imperative</strong> solution, the "highest" and "average population" plans are merged together into a single for-loop, whereas in the <strong>Python - Functional</strong> solution the "highest" plan is separated by use of a higher-order function <code>max</code>.
     </p>

     <p>
       Based on this observation, <a href="http://rodrigoduran.net/papers/analysis-program-complexity.pdf">Duran et al.</a> proposed that the number of overlapping plans in a program could be used as a metric of cognitive complexity. Using this dataset's plan annotations, we can actually compute this metric. Specifically, for each program, we count the number of pairs of plans that overlap. For example, above the <strong>Python - Functional</strong> program has the "name" and "highest" plans overlapping, but does not have the "average" and "highest" plans overlapping. Below we plot the distribution of plan overlaps in each language, sorted by median:
     </p>

     <center>
       <Chart spec={{
         mark: "boxplot",
         height: 220,
         title: "Plan overlap per language",
         encoding: {
           y: {...axis.language_name, sort: sort_by_median('language_name', 'plan_overlap')},
           x: axis.plan_overlap
         }
       }} />
     </center>

     <p>On average, the languages <strong>Q, SQL, Python - Pandas</strong>, and <strong>R</strong> had fewer overlapping plans (median 1) while the languages <strong>Python - Functional, Python - Imperative,</strong> and <strong>Datalog</strong> had a median 3 overlapping plans. For example, here are examples with 0 overlapping plans (left) and 10 overlapping plans (right).</p>

     {(() => {
       let min = _.find(PROGRAM_DATA, {language: 'r', plan_overlap: 0});
       let max = _.find(PROGRAM_DATA, {language: 'datalog', plan_overlap: 10});
       let programs = [min, max].map(p => PROGRAMS.filter(p2 =>
         p2.language == p.language && p2.task == p.task)[0])
       return <ProgramsView
                programs={programs}
                headers={['task', 'language']}
       />;
     })()}

     <p>
       The R program has a clean separation of each row for its task. The Datalog program has every plan overlapping with every other plan, for a total of 5 choose 2 = 10 overlaps.
     </p>
   </>}
].map((q, i) => ({
  index: i + 1,
  id: `#question-${i+1}`,
  href: `question-${i+1}`,
  ...q
}));

let TOC = () => {
  const [active_id, set_active_id] = useState(null);
  let ids = questions.map(q => q.href);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        let es = entries.filter(entry => entry.isIntersecting);
        if (es.length > 0) {
          set_active_id(es[es.length-1].target.id);
        }
      },
      { rootMargin: `0% 0% -50% 0%` }
    );

    ids.forEach(id => observer.observe(document.getElementById(id)));
    return () => {
      if (document.getElementById(ids[0])) {
        ids.forEach(id => observer.unobserve(document.getElementById(id)));
      }
    }
  });

  return <>
    <strong>Table of contents</strong>
    <ol>
      {questions.map(q =>
        <li><a href={q.id} className={active_id == q.href ? 'hl' : null}>{q.title}</a></li>
      )}
    </ol>
  </>;
}

export default function Analysis() {
  return <div className='analysis'>
    <h2>Dataset analysis</h2>

    <div className='column-container big'>
      <div className='sidebar'>
        <div className='sidebar-sticky'>
          <TOC />
        </div>
      </div>

      <div className='main-content'>
        {questions.map(q =>
          <div className='question'>
            <h3><a id={q.href} name={q.href}>{q.index}. {q.title}</a></h3>
            <div className='question-body'>{q.body}</div>
          </div>)}
      </div>
    </div>
  </div>;
};
