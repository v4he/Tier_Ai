import React from "react";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("http://localhost:5000/api/tierFolders", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTierFolder(data);
        } else {
          setTierFolder([]);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  }, []);

  const handleClick = () => {
    setAddFolder(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full">
        <Header />
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full overflow-y-auto rounded-tl-[32px]">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 pt-2 pr-3 gap-2 w-full content-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square w-full bg-white/5 rounded-[30px] animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full">
      <Header />
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full overflow-y-auto sm:rounded-tl-[30px] no-scrollbar">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 pt-2 px-3 sm:px-0 sm:pr-2 gap-2 w-full content-start rounded-t-[30px]">
            <AddCardButton onClick={handleClick} addFolder={addFolder} />
            {addFolder && (
              <CreateFolderCard
                cardName={cardName}
                setCardName={setCardName}
                tierFolderData={"creating"}
                addFolder={addFolder}
                setAddFolder={setAddFolder}
                setTierFolder={setTierFolder}
              />
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