import Script from "next/script";
import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-pricing-table": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PricingTableProps {
  pricingTableId: string;
  publishableKey: string;
  clientReferenceId: string;
  customerEmail: string;
}

function PricingPage({ pricingTableId, publishableKey, clientReferenceId, customerEmail }: PricingTableProps) {
  return (
    <>
      <Script
        async
        strategy="lazyOnload"
        src="https://js.stripe.com/v3/pricing-table.js"
      />
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        client-reference-id={clientReferenceId}
        customer-email={customerEmail}
      />
    </>
  );
}

export default PricingPage;
