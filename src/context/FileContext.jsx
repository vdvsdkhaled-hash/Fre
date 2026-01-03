import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const FileContext = createContext();

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within FileProvider');
  }
  return context;
}

export function FileProvider({ children }) {
  const [fileTree, setFileTree] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState(null);

  // Initialize WebSocket
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'file:changed':
          // Reload file if it's open
          if (fileContents[data.path]) {
            loadFile(data.path);
          }
          break;
        case 'file:added':
        case 'file:deleted':
          // Refresh file tree
          loadFileTree();
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  // Load file tree
  const loadFileTree = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/files/tree');
      setFileTree(response.data.tree);
    } catch (error) {
      console.error('Error loading file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load file content
  const loadFile = async (filePath) => {
    try {
      const response = await axios.get('/api/files/read', {
        params: { path: filePath }
      });
      
      setFileContents(prev => ({
        ...prev,
        [filePath]: response.data.content
      }));

      return response.data.content;
    } catch (error) {
      console.error('Error loading file:', error);
      throw error;
    }
  };

  // Save file
  const saveFile = async (filePath, content) => {
    try {
      await axios.post('/api/files/write', {
        path: filePath,
        content
      });

      setFileContents(prev => ({
        ...prev,
        [filePath]: content
      }));

      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  // Create file or directory
  const createFile = async (filePath, type = 'file', content = '') => {
    try {
      await axios.post('/api/files/create', {
        path: filePath,
        type,
        content
      });

      await loadFileTree();
      return true;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  };

  // Delete file or directory
  const deleteFile = async (filePath) => {
    try {
      await axios.delete('/api/files/delete', {
        params: { path: filePath }
      });

      // Remove from open files
      setOpenFiles(prev => prev.filter(f => f !== filePath));
      
      // Remove from file contents
      setFileContents(prev => {
        const newContents = { ...prev };
        delete newContents[filePath];
        return newContents;
      });

      // Update active file if needed
      if (activeFile === filePath) {
        setActiveFile(openFiles[0] || null);
      }

      await loadFileTree();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  // Rename file or directory
  const renameFile = async (oldPath, newPath) => {
    try {
      await axios.post('/api/files/rename', {
        oldPath,
        newPath
      });

      // Update open files
      setOpenFiles(prev => prev.map(f => f === oldPath ? newPath : f));
      
      // Update file contents
      if (fileContents[oldPath]) {
        setFileContents(prev => {
          const newContents = { ...prev };
          newContents[newPath] = newContents[oldPath];
          delete newContents[oldPath];
          return newContents;
        });
      }

      // Update active file
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }

      await loadFileTree();
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  };

  // Open file
  const openFile = async (filePath) => {
    if (!openFiles.includes(filePath)) {
      setOpenFiles(prev => [...prev, filePath]);
    }
    
    setActiveFile(filePath);

    if (!fileContents[filePath]) {
      await loadFile(filePath);
    }
  };

  // Close file
  const closeFile = (filePath) => {
    setOpenFiles(prev => prev.filter(f => f !== filePath));
    
    if (activeFile === filePath) {
      const index = openFiles.indexOf(filePath);
      const newActive = openFiles[index - 1] || openFiles[index + 1] || null;
      setActiveFile(newActive);
    }
  };

  // Update file content (in memory)
  const updateFileContent = (filePath, content) => {
    setFileContents(prev => ({
      ...prev,
      [filePath]: content
    }));
  };

  // Load file tree on mount
  useEffect(() => {
    loadFileTree();
  }, []);

  const value = {
    fileTree,
    openFiles,
    activeFile,
    fileContents,
    loading,
    loadFileTree,
    loadFile,
    saveFile,
    createFile,
    deleteFile,
    renameFile,
    openFile,
    closeFile,
    updateFileContent,
    setActiveFile
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
}
