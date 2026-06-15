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
  const [addFolder, setAddFolder] = useState(false);
  const [cardName, setCardName] = useState("");

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
    setAddFolder(true);
  };



  return (
    <div className="flex flex-col h-screen w-full">
      <Header />

      <div className="flex-1 overflow-hidden">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto  w-full h-full  p-6 rounded-tl-[32px] content-start">
          {tierFolder.map((elem, index) => (
            <DashboardCard key={index} tierFolder={tierFolder} tierFolderData={elem} setTierFolder={setTierFolder}/>
          ))}

          {addFolder ? (
            <CreateFolderCard
              cardName={cardName}
              setCardName={setCardName}
              tierFolderData={"creating"}
              addFolder={addFolder}
              setAddFolder={setAddFolder}
              setTierFolder={setTierFolder}
            />
          ) : (
            ""
          )}

          <AddCardButton onClick={handleClick} />
        </div>
      </div>
    </div>
  );
}

export default MainContent;
