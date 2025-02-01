import "@/styles/globals.css";
import '@coinbase/onchainkit/styles.css';
import { OnchainKitWrapper } from '@/providers/OnchainKitProvider';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <OnchainKitWrapper>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </OnchainKitWrapper>)
}
