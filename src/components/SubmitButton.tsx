"use client";

import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";
interface SubmitButtonProps {
  isButtonEnabled: boolean;
  title: string;
}

const SubmitButton = ({ isButtonEnabled, title }: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="orange"
      disabled={!isButtonEnabled || pending}
    >
      {pending ? (
        <Loader2
          className="w-5 h-5 text-white/80 animate-spin"
          style={{ strokeWidth: "3" }}
        />
      ) : title
      }
    </Button>
  );
};

export default SubmitButton;