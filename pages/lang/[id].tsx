import {LangView} from '../../components/pivot';
import {LANGUAGES} from '../../components/data';
import _ from 'lodash';

export default LangView;

export async function getStaticPaths() {
  let paths = LANGUAGES.map(t => `/lang/${t.id}`);
  return { paths, fallback: false };
}

export async function getStaticProps({params}) {
  return {
    props: {
      lang: _.find(LANGUAGES, params)
    }
  }
}
