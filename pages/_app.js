import Link from 'next/link'
import NProgress from 'nprogress';
import Router from 'next/router';
import Head from 'next/head'

import '../components/editor/main.css';
import '../css/index.scss';
import '../node_modules/nprogress/nprogress.css';

NProgress.configure({showSpinner: false});
Router.onRouteChangeStart = () => NProgress.start();
Router.onRouteChangeComplete = () => NProgress.done();
Router.onRouteChangeError = () => NProgress.done();

export default function App({Component, pageProps}) {
  return <div id='container'>
    <Head>
      <title>Expressiveness Benchmark</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <script async src="https://www.googletagmanager.com/gtag/js?id=UA-16662292-3"></script>
      <script>{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'UA-16662292-3');
        `}</script>
    </Head>
    <div className='title'>
      <h1>
        <Link href="/">Expressiveness Benchmark</Link>
      </h1>
      <nav>
        <span className="desktop-inline"><Link href="/">Task matrix</Link></span>
        <span className="mobile-inline"><Link href="/">Benchmark</Link></span>
        <Link href="/analysis">Dataset analysis</Link>
      </nav>
    </div>
    <Component {...pageProps} />
    <footer>
      Project by <a href="https://twitter.com/wcrichton">Will Crichton</a>, <a href="https://github.com/kovach">Scott Kovach</a>, and <a href="http://gleb.fyi/">Gleb Shevchuk</a>.
    </footer>
  </div>;
}
