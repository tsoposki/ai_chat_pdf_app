"use client";
import React from 'react'
import { Button } from './ui/button';
import { BookOpenCheck, Facebook, Twitter, Youtube } from 'lucide-react';
import TypewriterComponent from 'typewriter-effect';

const LandingPage = () => {
  return (
        <>
        {/* Hero */}
            <section className='bg-[#062427]'>
                <div className='section-container flex flex-col text-white md:flex-row items-center'>
                    {/* Left */}
                    <div className='flex flex-col mb-32 space-y-12 text-center md:w-1/2 md:text-left'>
                        {/* Header */}
                        <h1 className='max-w-md text-4xl md:text-5xl md:leading-tight'>
                            Chat With Any PDF Document
                        </h1>
                        <div className='text-3xl font-light text-orange-400'>
                            <TypewriterComponent
                                options={{
                                    strings:[
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
                        <p className='max-w-md md:max-w-sm text-white/80 font-light leading-7'>
                        From legal agreements to financial reports, PDF.ai brings your documents to life. You can ask questions, get summaries, find information, and more.
                        </p>

                        {/* CTA */}
                        <div>
                            {/* Button */}
                            <div className='flex justify-center md:justify-start'>
                                <Button variant={'orange'}>Get Started For Free</Button>
                            </div>
                            {/* Cuttomers */}
                            <div className='flex justify-start mt-6'>
                                <img className='h-6 w-6 my-auto object-cover rounded-full ring-2 ring-green-950' src="user_1.jpeg" alt="" />
                                <img className='h-6 w-6 my-auto object-cover rounded-full ring-2 ring-green-950' src="user_2.jpeg" alt="" />
                                <img className='h-6 w-6 my-auto object-cover rounded-full ring-2 ring-green-950' src="user_3.jpeg" alt="" />
                                <img className='h-6 w-6 my-auto object-cover rounded-full ring-2 ring-green-950' src="user_4.jpeg" alt="" />
                                <img className='h-6 w-6 my-auto object-cover rounded-full ring-2 ring-green-950' src="user_5.jpeg" alt="" />
                                <p className='ml-2 my-auto text-sm text-slate-400'>
                                    Loved by 100,000+ users
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div className='md:w-1/2'>
                        <img src="hero.svg" alt="" />

                    </div>
                    

                </div>

            </section>
            {/* Features*/}
            <section className='section-container'>
                <h1 className='text-center text-4xl font-semibold mb-5 sm:mb-10'>
                    How It Works
                </h1>
                <div className='text-black grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:gap-10'>
                    {/* feature 1*/}
                    <div className='rounded-b-xl px-5 pb-5 pt-3 shadow-lg'>
                        <div className='flex-col'>
                            <div className='flex items-center justify-center'>
                                <img src="feature_1.svg" alt="" />
                            </div>
                            <p className='text-xl font-mediunm'>Upload Documents</p>
                            <span className='block text-sm text-gray-500 mt-3'>Easily Upload The PDF Documents You Would Like To Chat With.
                            </span>
                        </div>

                    </div>
                     {/* feature 2*/}
                    <div className='rounded-b-xl px-5 pb-5 pt-3 shadow-lg'>
                    <div className='flex-col'>
                        <div className='flex items-center justify-center'>
                            <img src="feature_2.svg" alt="" />
                        </div>
                        <p className='text-xl font-mediunm'>Instant Answers</p>
                        <span className='block text-sm text-gray-500 mt-3'>Ask Question, Extract Information, and Summarize Documents with AI
                        </span>
                    </div>

                     </div>  
                {/* feature 3*/}
                    <div className='rounded-b-xl px-5 pb-5 pt-3 shadow-lg'>
                    <div className='flex-col'>
                        <div className='flex items-center justify-center'>
                            <img src="feature_3.svg" alt="" />
                        </div>
                        <p className='text-xl font-mediunm'>Sources Included</p>
                        <span className='block text-sm text-gray-500 mt-3'> Every Response is Backed By Sources Extracted From The Uploaded Document
                        </span>
                    </div>

                    </div>

                </div>

            </section>

            {/* CTA */}
            <section className='section-container text-center '>
                <h1 className='font-semibold text-4xl'>Get Started</h1>
                <p className='mt-6 mb-6 text-gray-500'>
                    Upload a document and start chating with it today
                     <br />
                    No credit card required
                </p>

                <div className='w-full max-w-sm mx-auto px-4'>
                    <Button variant="orange">
                        Sign Up For Free
                    </Button>
                </div>
            </section>
            <footer className='bg-[#f8f5ee] py-10'>
                <div className='mx-auto mx-w-7xl px-8 md:px-6'>
                    {/* Row 1 */}
                    <div className='md:flex md:justify-between'>
                        {/* Logo */}
                        <div className='flex items-start mb-6'>
                            <BookOpenCheck className='w-8 h-8 mr-3' />
                            <span className='text-xl font-medium'>PDF.wisdom</span>
                        </div>
                        {/* Links */}
                        <div className='grid grid-cols-3 gap-x-20'>
                            {/* Col 1 */}
                            <div>
                                <h2 className='mb-4 text-sm font-medium'>Products</h2>
                                <div className='flex flex-col text-sm text-gray-400 space-y-2'>
                                <a href="#" className='hover:underline'>
                                    User cases 
                                </a>
                                <a href="#" className='hover:underline'>
                                    Chrome extension 
                                </a>
                                <a href="#" className='hover:underline'>
                                    Blog
                                </a>
                                <a href="#" className='hover:underline'>
                                    FAQ
                                </a>
                                </div>
                            </div>
                             {/* Col 2 */}
                            <div>
                                <h2 className='mb-4 text-sm font-medium'>Resources</h2>
                                <div className='flex flex-col text-sm text-gray-400 space-y-2'>
                                <a href="#" className='hover:underline'>
                                    Learn
                                </a>
                                <a href="#" className='hover:underline'>
                                    Docs
                                </a>
                                <a href="#" className='hover:underline'>
                                    Community
                                </a>
                                </div>
                            </div>
                             {/* Col 3 */}
                            <div>
                                <h2 className='mb-4 text-sm font-medium'>Company</h2>
                                <div className='flex flex-col text-sm text-gray-400 space-y-2'>
                                <a href="#" className='hover:underline'>
                                    About
                                </a>
                                <a href="#" className='hover:underline'>
                                    Team
                                </a>
                                </div>
                            </div>


                        </div>
                        <hr className='my-6 border-gray-300 lg:my-8' />
                    </div>
                    {/* Row 2 */}
                    <div className='text-sm text-gray-500 sm:flex sm:items-center sm:justify-between'>
                        <span> Copyright &copy; 2023, All Rights Reserved</span>
                        <div className='flex text-2xl space-x-6 sm:justify-center'>
                            <a href="#">
                                <Twitter className='w-5 h-5' />
                            </a>
                            <a href="#">
                                <Facebook className='w-5 h-5' />
                            </a>
                            <a href="#">
                                <Youtube className='w-5 h-5' />

                            </a>

                        </div>

                    </div>
                     
                </div>
            </footer>
        </>
  )
};

export default LandingPage                                          
