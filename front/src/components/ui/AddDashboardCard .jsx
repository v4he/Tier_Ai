import React from 'react'
import { DiamondPlus } from 'lucide-react'

function AddDashboardCard ({onClick}) {
  return (
    
    <div onClick={onClick} className='aspect-square w-full flex justify-center items-center bg-white
        rounded-[30px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] 
        hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]
        hover:-translate-y-1
        transition-all duration-300 ease-out
        cursor-pointer flex flex-col overflow-hidden 
        border border-black/[0.02]'>

        <DiamondPlus size={130} className='text-[#d3d3d2]' /></div>
    
  )
}

export default AddDashboardCard 