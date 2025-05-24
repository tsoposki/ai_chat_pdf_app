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
          pricingTableId="prctbl_1RQp8ePRjEovzfugqIFi3p5Q"
          publishableKey="pk_test_51RQkMPPRjEovzfugEDkiGN33rMo1ast3zaRz4APqs6Xw7HzibmHBxACCOHpYRPNrBhQNhLVdOf7NHXIr4dM2r0kw00nDndu2yb"
        />

      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
