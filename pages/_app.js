import Link from 'next/link'

import '../components/editor/main.css';
import '../css/index.scss';

export default function App({Component, pageProps}) {
  return <div>
    <div className='title'>
      <h1>
        <Link href="/">Expressiveness Benchmark</Link>
      </h1>
      <nav>
        <a href="/">Task matrix</a>
        <a href="/analysis">Dataset analysis</a>
      </nav>
    </div>
    <Component {...pageProps} />
  </div>;
}
