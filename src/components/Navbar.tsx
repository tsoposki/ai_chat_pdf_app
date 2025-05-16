"use client";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

const Navbar = () => {
  const { isSignedIn } = useAuth();
  return (
    <header className="sticky left-0 top-0 z-50 bg-[#f8f5ee] w-full backdrop-blur border-slate-500/10">
      <div className="mx-auto h-[60px] max-w-7xl px-8 md:px-6">
        <div className="flex items-center justify-between h-full">
          <div className="flex">
            <BookOpenCheck className="text-black w-7 h-7 mr-3" />
            <span className="text-lg font-medium text-black">PDF.wisdom </span>
          </div>
          <Link href={isSignedIn ? "/documents" : "/sign-in"}>
            <Button variant="link">
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
