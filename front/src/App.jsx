import React from "react";
import { Routes, Route, Navigate } from "react-router";
import MainContent from "./components/layout/MainContent";
import Layout from "./components/layout/Layout";
import TierContent from "./components/layout/TierContent";
import Login from "./pages/Login";
import Register from "./pages/Register";

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<MainContent />} />
        <Route path="tier-list/:id" element={<TierContent />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;