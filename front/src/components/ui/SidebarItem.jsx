import React from 'react'

function SidebarItem({icon}) {

  return (
    <div className='flex w-full gap-1 p-3 rounded-lg bg-white/20 '><div className='text-white'>{icon}</div></div>
  )
}

export default SidebarItem