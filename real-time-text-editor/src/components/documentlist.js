import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("DocumentList component mounted");
    const username = localStorage.getItem("username");
    console.log("Current username:", username);

    if (!username) {
      console.log("No username found, redirecting to login");
      alert("Please log in first.");
      navigate("/login");
      return;
    }

    const savedDocs = JSON.parse(localStorage.getItem(username)) || {};
    console.log("Documents from localStorage:", savedDocs);


    const docList = Object.entries(savedDocs)
      .map(([docId, docData]) => ({
        docId,
        title: docData.title || "Untitled Document",
        createdAt: docData.createdAt || Date.now()
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    console.log("Processed document list:", docList);
    setDocuments(docList);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("username");
    navigate("/login");
  };

  const createDocument = () => {
    navigate("/");
  };

  return (
    <div className="document-list-container">
      <div className="toolbar-container">
        <div className="editor-header">
          <h2 className="editor-title">My Documents</h2>
          <div className="action-buttons">
            <button onClick={logout}>Logout</button>
            <button onClick={createDocument} className="primary">
              New Document
            </button>
          </div>
        </div>
      </div>

      <div className="documents-grid">
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>No documents found!</p>
            <button onClick={createDocument} className="primary">
              Create your first document
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <div 
              key={doc.docId} 
              className="document-card"
              onClick={() => navigate(`/?doc=${doc.docId}`)}
            >
              <div className="document-card-content">
                <h3>{doc.title}</h3>
                <p className="document-meta">
                  Last edited: {new Date(doc.createdAt).toLocaleDateString()}
                </p>
                <button type="submit">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocumentList;