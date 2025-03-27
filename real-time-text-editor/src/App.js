import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Editor from "./components/editor";
import Login from "./components/login";
import Signup from "./components/signup";
import DocumentList from "./components/documentlist";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/documents" element={<DocumentList />} />
      </Routes>
    </Router>
  );
}

export default App;
