import React from 'react'
import { Input } from './ui/input'
import { Send } from 'lucide-react'
import { Button } from './ui/button'

export const Chat = () => {
  return (
    <div className="w-1/2 h-[calc(100vh-60px)]">
      <div className="h-full flex flex-col justify-between">
        <div className="overflow-auto bg-white">

        </div>

        <div className="bg-[#faf9f6]">
          <form className='m-4 p-2 flex items-center justify-between rounded-md border-[#e5e3da] border bg-white'>
            <Input placeholder='Enter your question' className='border-none outline-none focus-visible:ring-0 focus-visible:ring-transparent' />
            <Button type='submit' variant='orange'>
              <Send className='w-4 h-4' />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
