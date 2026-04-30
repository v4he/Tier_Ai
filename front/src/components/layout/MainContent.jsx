import React from 'react'
import {Search, ArrowLeft} from 'lucide-react'
import DashboardCard from '../ui/DashboardCard'
import Header from './Header'

function MainContent() {
  return (
    <div className='flex flex-col h-screen w-full'>
        <Header />
        




        <div className='flex-1 overflow-hidden'>

          <div className='grid grid-cols-4 gap-6 overflow-y-auto  w-full h-full bg-amber-50 p-6 rounded-tl-[32px] content-start'>
              <DashboardCard />
              <DashboardCard />
              <DashboardCard />
              <DashboardCard />
               <DashboardCard />
              <DashboardCard />
              <DashboardCard />
              <DashboardCard />
                <DashboardCard />
              <DashboardCard />
              <DashboardCard />
              <DashboardCard />
                <DashboardCard />
              <DashboardCard />
              <DashboardCard />
              <DashboardCard />
          </div>
          
        </div>



    </div>
  )
}

export default MainContent