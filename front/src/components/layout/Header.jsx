import React from 'react'
import {Search, ArrowLeft} from 'lucide-react'

function Header() {
  return (
    <div className='flex flex-col w-full pt-6 px-6 gap-4'>

      <div className='flex w-full items-center justify-between'>
         <div className='flex flex-1 max-w-xl items-center rounded-full bg-amber-50 px-6 py-2 gap-4'>
            <input className='w-full outline-none bg-transparent' type="text" placeholder="Search..." />
            <Search size={20} className="text-gray-500" />
         </div>
    
      </div>
      

      <div className='flex items-center text-sm h-10 gap-2 text-white'>
        <ArrowLeft size={18}/>
        <h2 className='tracking-[1px] uppercase text-xs'>dashboard / new tier list</h2>
      </div>
    </div>
  )
}

export default Header