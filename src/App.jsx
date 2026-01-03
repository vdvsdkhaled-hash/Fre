import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import AIPanel from './components/AIPanel';
import Terminal from './components/Terminal';
import Header from './components/Header';
import { FileProvider } from './context/FileContext';
import { AIProvider } from './context/AIContext';
import './App.css';

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [aiPanelWidth, setAiPanelWidth] = useState(400);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);

  return (
    <FileProvider>
      <AIProvider>
        <div className="app">
          <Header 
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
            onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
            showTerminal={showTerminal}
            showAIPanel={showAIPanel}
          />
          
          <div className="app-body">
            <Sidebar width={sidebarWidth} />
            
            <div className="main-content">
              <div className="editor-container" style={{ 
                height: showTerminal ? `calc(100% - ${terminalHeight}px)` : '100%' 
              }}>
                <Editor />
              </div>
              
              {showTerminal && (
                <Terminal height={terminalHeight} onResize={setTerminalHeight} />
              )}
            </div>
            
            {showAIPanel && (
              <AIPanel width={aiPanelWidth} />
            )}
          </div>
        </div>
      </AIProvider>
    </FileProvider>
  );
}

export default App;
