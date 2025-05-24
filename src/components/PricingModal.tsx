import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import PricingTable from "./PricingTable";
import { currentUser } from "@clerk/nextjs/server";


const PricingModal = async () => {
  const user = await currentUser();

  if (!user) return null;

  const email = user.emailAddresses[0].emailAddress;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link">🎁 Upgrade</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-[#f8f5ee]"> 
        <DialogHeader>
          <DialogTitle className="text-center mb-6">Upgrade your account</DialogTitle>
        </DialogHeader>

        <PricingTable
          clientReferenceId={user.id}
          customerEmail={email}
          pricingTableId={process.env.STRIPE_PRICING_TABLE_ID!}
          publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        />

      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
