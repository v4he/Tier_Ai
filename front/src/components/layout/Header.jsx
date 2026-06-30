import React from 'react';
import { Search, ArrowLeft, Menu, Feather } from 'lucide-react';
import { useOutletContext } from 'react-router';

function Header() {
  const context = useOutletContext();
  const setIsMobileSidebarOpen = context?.setIsMobileSidebarOpen;

  return (
    <div className='flex flex-col w-full pt-4 md:pt-6 px-4 md:px-6 gap-3 md:gap-4 shrink-0'>
      <div className='flex w-full items-center justify-between gap-4'>
        <div className='flex sm:hidden items-center gap-2 text-amber-50 font-bold text-xl'>
          <Feather size={24} />
          <span>TierAI</span>
        </div>

        <div className='hidden sm:flex flex-1 max-w-xl items-center rounded-full bg-white px-6 py-2 gap-4'>
          <input
            className='w-full outline-none bg-transparent text-sm'
            type="text"
            placeholder="Search..."
            aria-label="Rechercher"
          />
          <Search size={20} className="text-gray-500" aria-hidden="true" />
        </div>

        <button 
          onClick={() => setIsMobileSidebarOpen?.(true)}
          className='sm:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors'
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className='sm:hidden w-full flex items-center rounded-full bg-white px-4 py-2 gap-3'>
        <input
          className='w-full outline-none bg-transparent text-sm'
          type="text"
          placeholder="Search..."
          aria-label="Rechercher"
        />
        <Search size={18} className="text-gray-500" aria-hidden="true" />
      </div>

      <div className='flex items-center text-sm h-8 md:h-10 gap-2 text-white'>
        <ArrowLeft size={18} aria-hidden="true" />
        <h2 className='tracking-[1px] uppercase text-[10px] md:text-xs'>dashboard / new tier list</h2>
      </div>
    </div>
  );
}

export default Header;