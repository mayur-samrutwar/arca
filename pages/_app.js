import "@/styles/globals.css";
import '@coinbase/onchainkit/styles.css';
import { OnchainKitWrapper } from '@/providers/OnchainKitProvider';

export default function App({ Component, pageProps }) {
  return (
    <OnchainKitWrapper>
      <Component {...pageProps} />
    </OnchainKitWrapper>
  );
}
