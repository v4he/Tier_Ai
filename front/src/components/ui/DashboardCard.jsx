import React from "react";
import notebook from "../../assets/image/aaaa.png";

function DashboardCard() {
  console.log(notebook);
  return (
    <div
      style={{ backgroundImage: `url(${notebook})` }}
      className="aspect-square 
        bg-cover 
        bg-center 
        bg-no-repeat 
        rounded-[32px] 
        bg-gray-200 
        
        hover:scale-105 
        transition-transform 
        cursor-pointer
        shadow-sm"
    ></div>
  );
}

export default DashboardCard;
