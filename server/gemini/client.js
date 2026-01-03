import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = process.env.GEMINI_MODEL || 'gemini-3-flash';
    this.enableDeepThinking = process.env.ENABLE_DEEP_THINKING === 'true';
    this.enableTDD = process.env.ENABLE_TDD === 'true';
  }

  /**
   * Get the Gemini model instance with custom configuration
   */
  getModel(config = {}) {
    const defaultConfig = {
      model: this.model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };

    const mergedConfig = { ...defaultConfig, ...config };
    return this.genAI.getGenerativeModel(mergedConfig);
  }

  /**
   * Deep Thinking Mode - Chain of Thought reasoning
   */
  async deepThink(prompt, context = {}) {
    const thinkingPrompt = `
🧠 DEEP THINKING MODE ACTIVATED

Before providing any code or solution, you must:
1. Analyze the problem structure thoroughly
2. Identify potential conflicts and dependencies
3. Consider edge cases and error scenarios
4. Verify library compatibility with 2026 standards
5. Plan the modular architecture

Context:
${JSON.stringify(context, null, 2)}

User Request:
${prompt}

Provide your thinking trace first, then the solution.
`;

    const model = this.getModel();
    const result = await model.generateContent(thinkingPrompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Test-Driven Development Mode
   */
  async generateWithTests(prompt, context = {}) {
    const tddPrompt = `
🧪 TEST-DRIVEN DEVELOPMENT MODE

You must follow TDD principles:
1. Write tests FIRST before implementation
2. Ensure tests cover all edge cases
3. Implement code to pass the tests
4. Refactor while keeping tests green

Context:
${JSON.stringify(context, null, 2)}

User Request:
${prompt}

Provide:
1. Test cases (using Node.js test runner)
2. Implementation code
3. Test results verification
`;

    const model = this.getModel();
    const result = await model.generateContent(tddPrompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Agentic Workflow - Multi-step reasoning with file operations
   */
  async agenticWorkflow(task, fileSystem = {}) {
    const agentPrompt = `
🤖 AGENTIC WORKFLOW ACTIVATED

You are an autonomous coding agent with file system access.

Current File System:
${JSON.stringify(fileSystem, null, 2)}

Task:
${task}

Execute the following workflow:
1. INDEX: Analyze the codebase structure
2. PLAN: Create a detailed implementation plan
3. IMPLEMENT: Write/modify files directly
4. TEST: Verify the implementation
5. DEBUG: Fix any issues found
6. OPTIMIZE: Improve performance and code quality

Provide your response in JSON format:
{
  "thinking": "Your reasoning process",
  "plan": ["step1", "step2", ...],
  "fileOperations": [
    {
      "operation": "create|update|delete",
      "path": "file/path",
      "content": "file content",
      "reason": "why this change"
    }
  ],
  "tests": ["test1", "test2", ...],
  "verification": "How to verify the changes"
}
`;

    const model = this.getModel({
      generationConfig: {
        temperature: 0.4, // Lower temperature for more deterministic code
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent(agentPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
    }
    
    return { raw: text };
  }

  /**
   * Code Review and Analysis
   */
  async reviewCode(code, language, context = {}) {
    const reviewPrompt = `
🔍 CODE REVIEW MODE

Language: ${language}
Context: ${JSON.stringify(context, null, 2)}

Code to Review:
\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive review covering:
1. Code quality and best practices
2. Potential bugs and security issues
3. Performance optimizations
4. Maintainability improvements
5. Test coverage suggestions

Format your response as JSON:
{
  "quality": "score 1-10",
  "issues": [{"severity": "high|medium|low", "description": "...", "line": number}],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "security": ["security concern 1", ...],
  "performance": ["optimization 1", ...]
}
`;

    const model = this.getModel();
    const result = await model.generateContent(reviewPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse review JSON:', e);
    }
    
    return { raw: text };
  }

  /**
   * Standard chat completion
   */
  async chat(messages, systemPrompt = '') {
    const model = this.getModel();
    
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
      : messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Streaming response for real-time feedback
   */
  async *streamChat(prompt, context = {}) {
    const model = this.getModel();
    
    const fullPrompt = `
Context: ${JSON.stringify(context, null, 2)}

${prompt}
`;

    const result = await model.generateContentStream(fullPrompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  }
}

export default new GeminiClient();
