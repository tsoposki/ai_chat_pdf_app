"use client";
import React from "react";
import { Button } from "./ui/button";
import TypewriterComponent from "typewriter-effect";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const LandingPage = () => {
  const { isSignedIn } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className="bg-[#062427]">
        <div className="section-container flex flex-col text-white md:flex-row items-center">
          {/* Left */}
          <div className="flex flex-col mb-32 space-y-12 text-center md:w-1/2 md:text-left">
            {/* Header */}
            <h1 className="max-w-md text-4xl md:text-5xl md:leading-tight">
              Chat With Any PDF Document
            </h1>
            <div className="text-3xl font-light text-orange-400">
              <TypewriterComponent
                options={{
                  strings: [
                    "Books",
                    "Scientific papers",
                    "Financial reports",
                    "User manuals",
                    "Legal documents",
                  ],
                  autoStart: true,
                  loop: true,
                }}
              />
            </div>
            {/*Description */}
            <p className="max-w-md md:max-w-sm text-white/80 font-light leading-7">
              From legal agreements to financial reports, we bring your
              documents to life. You can ask questions, get summaries, find
              information, and more.
            </p>

            {/* CTA */}
            <div>
              {/* Button */}
              <div className="flex justify-center md:justify-start">
                <Link href={isSignedIn ? `/documents` : `/sign-up`}>
                  <Button variant="orange">Get Started For Free</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="md:w-1/2">
            <img src="hero.svg" alt="" />
          </div>
        </div>
      </section>
      {/* Features*/}
      <section className="section-container">
        <h1 className="text-center text-4xl font-semibold mb-5 sm:mb-10">
          How It Works
        </h1>
        <div className="flex text-black gap-6 sm:grid-cols-2 md:grid-cols-3 lg:gap-10">
          {/* feature 1*/}
          <div className="rounded-b-xl px-5 pb-5 pt-3 shadow-lg">
            <div className="flex-col">
              <div className="flex items-center justify-center">
                <img src="feature_1.svg" alt="" />
              </div>
              <p className="text-xl font-mediunm">Upload Documents</p>
              <span className="block text-sm text-gray-500 mt-3">
                Easily Upload The PDF Documents You Would Like To Chat With.
              </span>
            </div>
          </div>
          {/* feature 2*/}
          <div className="rounded-b-xl px-5 pb-5 pt-3 shadow-lg">
            <div className="flex-col">
              <div className="flex items-center justify-center">
                <img src="feature_2.svg" alt="" />
              </div>
              <p className="text-xl font-mediunm">Instant Answers</p>
              <span className="block text-sm text-gray-500 mt-3">
                Ask Question, Extract Information, and Summarize Documents with
                AI
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-container text-center ">
        <h1 className="font-semibold text-4xl">Get Started</h1>
        <p className="mt-6 mb-6 text-gray-500">
          Upload a document and start chating with it today
          <br />
          No credit card required
        </p>

        <div className="w-full max-w-sm mx-auto px-4">
          <Link href={isSignedIn ? `/documents` : `/sign-up`}>
            <Button variant="orange">Sign Up For Free</Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
