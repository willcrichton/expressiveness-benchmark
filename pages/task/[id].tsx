import {TaskView} from '../../components/pivot';
import {TASKS} from '../../components/data';
import _ from 'lodash';

export default TaskView;

export async function getStaticPaths() {
  let paths = TASKS.map(t => `/task/${t.id}`);
  return { paths, fallback: false };
}

export async function getStaticProps({params}) {
  return {
    props: {
      task: _.find(TASKS, params)
    }
  }
}
