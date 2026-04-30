import React from "react";

import MainContent from "./components/layout/MainContent";
import Layout from "./components/layout/Layout";
import { Routes, Route } from "react-router";
import TierContent from "./components/layout/TierContent";

function App() {

  return (
    
      <Routes>
        
        <Route path="/" element={<Layout />}>
          <Route index element={<MainContent />}/>
          <Route path="tier-list" element={<TierContent />} />
        </Route>
      </Routes>
    
  );
}

export default App;
