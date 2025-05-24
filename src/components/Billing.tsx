import { generateBillingPortalLink } from "@/lib/subscription";
import { Button } from "./ui/button";

const Billing = async () => {
  const billingPortalLink = await generateBillingPortalLink();

  return (
    <>
      {billingPortalLink && (
        <a href={billingPortalLink}>
          <Button variant="link">🧲 Billing</Button>
        </a>
      )}
    </>
  );
}

export default Billing;