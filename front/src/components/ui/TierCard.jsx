import React from "react";
import notebook from "../../assets/image/aaaa.png";

function TierCard() {
  console.log(notebook);
  return (
    <div className="flex aspect-[10/2] gap-6  rounded-4xl mr-6">
      <div
        style={{ backgroundImage: `url(${notebook})` }}
        className="aspect-square
        bg-cover 
        bg-center 
        bg-no-repeat 
        rounded-[32px] 
        bg-gray-200 
        
       
        transition-transform 
        cursor-pointer
        shadow-sm"
      ></div>



      <div>rteojtoierj</div>
    </div>
  );
}

export default TierCard;
