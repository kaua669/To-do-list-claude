const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tags
router.get('/', authenticateToken, (req, res) => {
  const tags = db.prepare(`
    SELECT t.*, COUNT(tt.task_id) as task_count
    FROM tags t
    LEFT JOIN task_tags tt ON t.id = tt.tag_id
    LEFT JOIN tasks tk ON tt.task_id = tk.id AND tk.status != 'archived'
    WHERE t.user_id = ?
    GROUP BY t.id
    ORDER BY t.is_favorite DESC, t.usage_count DESC, t.name ASC
  `).all(req.user.id);
  res.json(tags);
});

// Create tag
router.post('/', authenticateToken, (req, res) => {
  const { name, color, icon } = req.body;

  if (!name || !color) {
    return res.status(400).json({ error: 'Name and color are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(req.user.id, name);
    if (existing) {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }

    const tagId = uuidv4();
    db.prepare('INSERT INTO tags (id, user_id, name, color, icon) VALUES (?, ?, ?, ?, ?)').run(tagId, req.user.id, name, color, icon || '🏷️');

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
    res.status(201).json(tag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
router.put('/:id', authenticateToken, (req, res) => {
  const { name, color, icon, is_favorite } = req.body;

  try {
    const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    db.prepare(`
      UPDATE tags SET name = ?, color = ?, icon = ?, is_favorite = ? WHERE id = ?
    `).run(
      name ?? tag.name,
      color ?? tag.color,
      icon ?? tag.icon,
      is_favorite !== undefined ? (is_favorite ? 1 : 0) : tag.is_favorite,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', authenticateToken, (req, res) => {
  const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tag) return res.status(404).json({ error: 'Tag not found' });

  db.prepare('UPDATE tags SET is_favorite = ? WHERE id = ?').run(tag.is_favorite ? 0 : 1, req.params.id);
  const updated = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete tag
router.delete('/:id', authenticateToken, (req, res) => {
  const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tag) return res.status(404).json({ error: 'Tag not found' });

  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tag deleted successfully' });
});

module.exports = router;
