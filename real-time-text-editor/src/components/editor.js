import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { QuillBinding } from "y-quill";
import QuillCursors from "quill-cursors";
import { openDB } from "idb";
import QuillToolbar, { modules, formats } from "./editortoolbar";
import "./app.css";

const DB_NAME = "TextEditorDB";
const STORE_NAME = "documents";

const initDB = async () => {
  console.log("Initializing IndexedDB...");
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
    console.log("IndexedDB initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    throw error;
  }
};

const saveToDB = async (docId, title, content) => {
  console.log("Saving document to DB:", { docId, title, content });
  try {
    const db = await initDB();
    

    const normalizedContent = Array.isArray(content) 
      ? { ops: content } 
      : content;
    
    const docToSave = {
      id: docId,
      title,
      content: normalizedContent
    };
    
    await db.put(STORE_NAME, docToSave);
    
    const username = localStorage.getItem("username");
    if (username) {
      const savedDocs = JSON.parse(localStorage.getItem(username)) || {};
      savedDocs[docId] = { docId, title };
      localStorage.setItem(username, JSON.stringify(savedDocs));
    }
    
    console.log("Document saved successfully. Content:", normalizedContent);
    return true;
  } catch (error) {
    console.error("Error saving document:", error);
    return false;
  }
};

const getFromDB = async (docId) => {
  console.log(`Loading document ${docId} from DB...`);
  try {
    const db = await initDB();
    const data = await db.get(STORE_NAME, docId);
    console.log("Document loaded from DB:", data);
    return data;
  } catch (error) {
    console.error("Error loading document:", error);
    return null;
  }
};

function Editor() {
  const editorRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [username, setUsername] = useState("");
  const [docId, setDocId] = useState(null);
  const [docName, setDocName] = useState("Untitled Document");
  const navigate = useNavigate();
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);


  const customModules = {
    ...modules, 
    cursors: {
      transformOnTextChange: true,
      hideDelay: 1000,
      hideSpeed: 400,
      selectionChangeSource: "api"
    }
  };

  const cleanupYjs = () => {
    console.log("Cleaning up Yjs resources...");
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    console.log("Yjs cleanup complete");
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      navigate("/login");
    } else {
      setUsername(storedUsername);
    }
  }, [navigate]);

  useEffect(() => {
    if (!editorRef.current) return;

    Quill.register("modules/cursors", QuillCursors);

    const editor = new Quill(editorRef.current, {
      modules: customModules, 
      formats: formats,       
      placeholder: "Start collaborating...",
      theme: "snow"
    });

    setQuill(editor);

    return () => {
      if (editor) {
        editor.disable();
      }
    };
  }, []);

  useEffect(() => {
    if (!quill || !username) return;

    const params = new URLSearchParams(window.location.search);
    const docParam = params.get("doc");

    const initializeDocument = async (docId) => {
      cleanupYjs();

      const ydoc = new Y.Doc();
      const provider = new WebrtcProvider(docId, ydoc);
      const ytext = ydoc.getText("quill");
      const binding = new QuillBinding(ytext, quill, provider.awareness);

      provider.awareness.setLocalStateField("user", {
        name: username,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      });

      const dbData = await getFromDB(docId);
      if (dbData) {
        setDocName(dbData.title || "Untitled Document");
        if (dbData.content?.ops) {
          try {
            ytext.delete(0, ytext.length);
            ytext.applyDelta(dbData.content.ops);
          } catch (error) {
            console.error("Error applying content:", error);
          }
        }
      }

      providerRef.current = provider;
      ydocRef.current = ydoc;
      bindingRef.current = binding;
      setDocId(docId);
    };

    if (docParam) {
      initializeDocument(docParam);
    } else {
      cleanupYjs();
    }

    return () => {
      cleanupYjs();
    };
  }, [quill, username]);

  const saveDocument = async () => {
    console.log("Save document triggered");
    if (!docId || !ydocRef.current) {
      console.error("Cannot save - missing docId or ydoc");
      return;
    }
  
    try {
      const ytext = ydocRef.current.getText("quill");
      const delta = ytext.toDelta();
      console.log("Raw Delta content:", delta);
      

      await saveToDB(docId, docName, delta);
      
      alert("Document saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed!");
    }
  };

  const createDocument = async () => {
    console.log("Create document triggered");
    const newDocId = Date.now().toString();
    const newDocName = prompt("Enter document name:", "New Document");

    if (newDocName) {
      try {
        console.log("Creating new document:", newDocId);
        const success = await saveToDB(newDocId, newDocName, { ops: [] });
        if (success) {
          console.log("Document created, navigating to it");
          navigate(`/?doc=${newDocId}`);
        } else {
          throw new Error("Create operation failed");
        }
      } catch (error) {
        console.error("Error creating document:", error);
        alert("Failed to create document");
      }
    }
  };

  const logout = () => {
    console.log("Logout triggered");
    cleanupYjs();
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="editor-wrapper">

      <div className="toolbar-container">
        <div className="editor-header">
          <h2>Real-Time Collaborative Editor</h2>
            <br></br>

          {username && (
            <span className="user-info">
              <i className="user-icon">👤</i> {username}
            </span>
          )}
  
  
          {docId && (
            <div className="document-info">
              <span className="doc-name">
                <i className="doc-icon">📄</i> {docName || "Untitled Document"}
              </span>
            </div>
          )}
  
       
          <div className="action-buttons">
            <button onClick={createDocument} className="primary">New Doc</button>
            {docId && <button onClick={saveDocument} className="primary">Save</button>}
            {docId && (
              <button
                onClick={() => {
                  const shareLink = `${window.location.origin}/?doc=${docId}`;
                  navigator.clipboard.writeText(shareLink);
                  alert("Share link copied to clipboard!");
                }}
              >
                Share
              </button>
            )}
            <button onClick={() => navigate("/documents")}>All Documents</button>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
  
       
        <QuillToolbar />
      </div>
  

      <div className="editor-container">
        <div ref={editorRef} className="quill-editor" />
      </div>
    </div>
  );
  
}

export default Editor;