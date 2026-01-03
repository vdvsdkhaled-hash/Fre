import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AIContext = createContext();

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}

export function AIProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat'); // chat, deep-think, tdd, agent, review
  const [streamingMessage, setStreamingMessage] = useState('');

  // Standard chat
  const chat = async (userMessage, context = {}) => {
    try {
      setLoading(true);
      
      const newMessages = [
        ...messages,
        { role: 'user', content: userMessage, timestamp: Date.now() }
      ];
      setMessages(newMessages);

      const response = await axios.post('/api/ai/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt: `You are an expert coding assistant. Context: ${JSON.stringify(context)}`
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: Date.now(),
        model: response.data.model
      };

      setMessages([...newMessages, aiMessage]);
      return aiMessage;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Deep thinking mode
  const deepThink = async (prompt, context = {}) => {
    try {
      setLoading(true);
      
      const userMessage = { role: 'user', content: prompt, timestamp: Date.now(), mode: 'deep-think' };
      setMessages(prev => [...prev, userMessage]);

      const response = await axios.post('/api/ai/deep-think', {
        prompt,
        context
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: Date.now(),
        mode: 'deep-think'
      };

      setMessages(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (error) {
      console.error('Deep think error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // TDD mode
  const generateWithTests = async (prompt, context = {}) => {
    try {
      setLoading(true);
      
      const userMessage = { role: 'user', content: prompt, timestamp: Date.now(), mode: 'tdd' };
      setMessages(prev => [...prev, userMessage]);

      const response = await axios.post('/api/ai/tdd', {
        prompt,
        context
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: Date.now(),
        mode: 'tdd'
      };

      setMessages(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (error) {
      console.error('TDD error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Agentic workflow
  const runAgent = async (task, fileSystem = {}) => {
    try {
      setLoading(true);
      
      const userMessage = { role: 'user', content: task, timestamp: Date.now(), mode: 'agent' };
      setMessages(prev => [...prev, userMessage]);

      const response = await axios.post('/api/ai/agent', {
        task,
        fileSystem
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: Date.now(),
        mode: 'agent'
      };

      setMessages(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (error) {
      console.error('Agent error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Code review
  const reviewCode = async (code, language, context = {}) => {
    try {
      setLoading(true);
      
      const userMessage = { 
        role: 'user', 
        content: `Review this ${language} code`, 
        timestamp: Date.now(), 
        mode: 'review' 
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await axios.post('/api/ai/review', {
        code,
        language,
        context
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: Date.now(),
        mode: 'review'
      };

      setMessages(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (error) {
      console.error('Review error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Streaming chat
  const streamChat = async (prompt, context = {}, onChunk) => {
    try {
      setLoading(true);
      setStreamingMessage('');
      
      const userMessage = { role: 'user', content: prompt, timestamp: Date.now() };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, context }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              fullMessage += parsed.chunk;
              setStreamingMessage(fullMessage);
              if (onChunk) onChunk(parsed.chunk);
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      const aiMessage = {
        role: 'assistant',
        content: fullMessage,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingMessage('');
      return aiMessage;
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear messages
  const clearMessages = () => {
    setMessages([]);
    setStreamingMessage('');
  };

  const value = {
    messages,
    loading,
    mode,
    streamingMessage,
    setMode,
    chat,
    deepThink,
    generateWithTests,
    runAgent,
    reviewCode,
    streamChat,
    clearMessages
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}
