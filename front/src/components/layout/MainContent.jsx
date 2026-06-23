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
        <div className="w-full  h-full  overflow-y-auto rounded-tl-[32px]">
          <div className="grid  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4  pt-2 pr-3 gap-2 w-full content-start">
            <AddCardButton onClick={handleClick} addFolder={addFolder} />

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

            {tierFolder.map((elem, index) => (
              <DashboardCard
                key={index}
                tierFolder={tierFolder}
                tierFolderData={elem}
                setTierFolder={setTierFolder}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainContent;