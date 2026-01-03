import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workspace directory (user's project files)
const WORKSPACE_DIR = path.join(__dirname, '../../workspace');

// Ensure workspace directory exists
await fs.mkdir(WORKSPACE_DIR, { recursive: true });

/**
 * GET /api/files/tree
 * Get file tree structure
 */
router.get('/tree', async (req, res) => {
  try {
    const tree = await buildFileTree(WORKSPACE_DIR);
    res.json({ tree });
  } catch (error) {
    console.error('Error building file tree:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/files/read
 * Read file content
 */
router.get('/read', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security check: ensure path is within workspace
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const stats = await fs.stat(fullPath);
    
    res.json({ 
      content,
      path: filePath,
      size: stats.size,
      modified: stats.mtime
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/write
 * Write/update file content
 */
router.post('/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }

    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security check
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    await fs.writeFile(fullPath, content, 'utf-8');
    
    res.json({ 
      success: true,
      path: filePath,
      message: 'File saved successfully'
    });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/create
 * Create new file or directory
 */
router.post('/create', async (req, res) => {
  try {
    const { path: filePath, type, content = '' } = req.body;
    
    if (!filePath || !type) {
      return res.status(400).json({ error: 'File path and type are required' });
    }

    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security check
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    }
    
    res.json({ 
      success: true,
      path: filePath,
      type,
      message: `${type === 'directory' ? 'Directory' : 'File'} created successfully`
    });
  } catch (error) {
    console.error('Error creating file/directory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/files/delete
 * Delete file or directory
 */
router.delete('/delete', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security check
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }
    
    res.json({ 
      success: true,
      path: filePath,
      message: 'Deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file/directory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/rename
 * Rename file or directory
 */
router.post('/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Old path and new path are required' });
    }

    const fullOldPath = path.join(WORKSPACE_DIR, oldPath);
    const fullNewPath = path.join(WORKSPACE_DIR, newPath);
    
    // Security check
    if (!fullOldPath.startsWith(WORKSPACE_DIR) || !fullNewPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.rename(fullOldPath, fullNewPath);
    
    res.json({ 
      success: true,
      oldPath,
      newPath,
      message: 'Renamed successfully'
    });
  } catch (error) {
    console.error('Error renaming file/directory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to build file tree
 */
async function buildFileTree(dir, basePath = '') {
  const items = await fs.readdir(dir);
  const tree = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      tree.push({
        name: item,
        path: relativePath,
        type: 'directory',
        children: await buildFileTree(fullPath, relativePath)
      });
    } else {
      tree.push({
        name: item,
        path: relativePath,
        type: 'file',
        size: stats.size,
        modified: stats.mtime
      });
    }
  }

  return tree.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

export { router as fileRouter };
