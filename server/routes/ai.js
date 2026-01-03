import express from 'express';
import geminiClient from '../gemini/client.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Standard chat completion
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await geminiClient.chat(messages, systemPrompt);
    
    res.json({ 
      response,
      model: geminiClient.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/deep-think
 * Deep thinking mode with chain of thought
 */
router.post('/deep-think', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await geminiClient.deepThink(prompt, context || {});
    
    res.json({ 
      response,
      mode: 'deep-thinking',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deep think error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/tdd
 * Test-driven development mode
 */
router.post('/tdd', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await geminiClient.generateWithTests(prompt, context || {});
    
    res.json({ 
      response,
      mode: 'tdd',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TDD error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/agent
 * Agentic workflow with file operations
 */
router.post('/agent', async (req, res) => {
  try {
    const { task, fileSystem } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    const response = await geminiClient.agenticWorkflow(task, fileSystem || {});
    
    res.json({ 
      response,
      mode: 'agentic',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/review
 * Code review and analysis
 */
router.post('/review', async (req, res) => {
  try {
    const { code, language, context } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const response = await geminiClient.reviewCode(code, language, context || {});
    
    res.json({ 
      response,
      mode: 'review',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/stream
 * Streaming chat for real-time responses
 */
router.post('/stream', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of geminiClient.streamChat(prompt, context || {})) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as aiRouter };
