import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  // Default endpoint, can be overridden by the environment variable at build time
  const brazeEndpoint = process.env.NEXT_PUBLIC_BRAZE_SDK_ENDPOINT || 'sdk.fra-02.braze.eu';

  return (
    <Html lang="en">
      <Head>
        {/* Braze Web SDK Script */}
        <Script
          id="braze-web-sdk"
          strategy="beforeInteractive"
          src={`https://${brazeEndpoint}/api/v3/sdk/js/sdk.min.js`}
          onLoad={() => {
            // This will run on the client side after the script loads
            console.log('Braze SDK loaded successfully from _document.tsx');
          }}
          onError={(e) => {
            // This will run on the client side if the script fails to load
            console.error('Error loading Braze SDK from _document.tsx:', e);
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
