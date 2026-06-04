import React, { useRef } from "react";
import { Search, ArrowLeft } from "lucide-react";
import DashboardCard from "../ui/DashboardCard";
import Header from "./Header";
import { useState } from "react";
import { useEffect } from "react";
import AddCardButton from "../ui/AddCardButton";
import CreateFolderCard from "../ui/CreateFolderCard";

function MainContent() {
  const [tierFolder, setTierFolder] = useState([]);
  const [addFolder, setAddFolder] = useState(false)
  const [cardName, setCardName] = useState("")

console.log(cardName)

  



  useEffect(() => {
    fetch("http://localhost:5000/api/tierFolders")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTierFolder(data);
          console.log(data);
        } else {
          setTierFolder([]);
        }
      })
      .catch((error) => console.log(error));
  }, []);



const handleClick = () => {
  if(addFolder === false){
     setAddFolder(true)
     
      
  }
  else if(addFolder === true){
    setAddFolder(false)
  
  }
}

  return (
    <div className="flex flex-col h-screen w-full">
      <Header />

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-4 gap-6 overflow-y-auto  w-full h-full bg-amber-50 p-6 rounded-tl-[32px] content-start">

          {
            tierFolder.map((elem) => (
              <DashboardCard key={elem.id} tierFolderData={elem}/>
            ))

             
          }

          {
            addFolder ? tierFolder.map((elem) => (
              <CreateFolderCard key={elem.id} cardName={cardName} setCardName={setCardName} tierFolderData={"creating"}
              addFolder={addFolder}
              setAddFolder={setAddFolder}
              />
            )) : ""
          }
          
           
            
          

          <AddCardButton onClick={handleClick}/>
          
          


        </div>
      </div>
    </div>
  );
}

export default MainContent;
