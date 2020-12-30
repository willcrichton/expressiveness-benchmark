import Link from 'next/link'
import NProgress from 'nprogress';
import Router from 'next/router';

import '../components/editor/main.css';
import '../css/index.scss';
import '../node_modules/nprogress/nprogress.css';

NProgress.configure({showSpinner: false});
Router.onRouteChangeStart = () => NProgress.start();
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

export default function App({Component, pageProps}) {
  return <div id='container'>
    <div className='title'>
      <h1>
        <Link href="/">Expressiveness Benchmark</Link>
      </h1>
      <nav>
        <Link href="/">Task matrix</Link>
        <Link href="/analysis">Dataset analysis</Link>
      </nav>
    </div>
    <Component {...pageProps} />
  </div>;
}
