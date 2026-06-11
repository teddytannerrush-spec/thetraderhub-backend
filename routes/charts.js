const express = require('express');
const router = express.Router();
const db = require('../utils/chartsDb');

// Helper to generate a unique random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// 1. GET /1.1/charts - List layouts for a client and user
router.get('/1.1/charts', (req, res) => {
  const { client, user } = req.query;
  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  const data = db.readDb();
  const userCharts = data.charts
    .filter(c => c.client === client && c.user === user)
    .map(c => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      resolution: c.resolution,
      timestamp: c.timestamp
    }));

  res.json({
    status: 'ok',
    data: userCharts
  });
});

// 2. POST /1.1/charts - Save a new chart layout
router.post('/1.1/charts', (req, res) => {
  const { client, user } = req.query;
  const { name, symbol, resolution, content } = req.body;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  if (!name || !symbol || !resolution || !content) {
    return res.status(400).json({ status: 'error', error: 'Missing required chart fields (name, symbol, resolution, content).' });
  }

  const data = db.readDb();
  const newChartId = generateId();
  const timestamp = Math.floor(Date.now() / 1000);

  const newChart = {
    id: newChartId,
    client,
    user,
    name,
    symbol,
    resolution,
    timestamp,
    content
  };

  data.charts.push(newChart);
  db.writeDb(data);

  console.log(`[TradingView Storage] Created new chart layout: ${name} (ID: ${newChartId}) for user: ${user}`);

  res.json({
    status: 'ok',
    id: newChartId
  });
});

// 3. POST /1.1/charts/:id - Update an existing chart layout
router.post('/1.1/charts/:id', (req, res) => {
  const { id } = req.params;
  const { client, user } = req.query;
  const { name, symbol, resolution, content } = req.body;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  if (!name || !symbol || !resolution || !content) {
    return res.status(400).json({ status: 'error', error: 'Missing required chart fields (name, symbol, resolution, content).' });
  }

  const data = db.readDb();
  const chartIdx = data.charts.findIndex(c => c.id === id && c.client === client && c.user === user);

  if (chartIdx === -1) {
    return res.status(404).json({ status: 'error', error: 'Chart layout not found.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  data.charts[chartIdx] = {
    ...data.charts[chartIdx],
    name,
    symbol,
    resolution,
    timestamp,
    content
  };

  db.writeDb(data);

  console.log(`[TradingView Storage] Updated chart layout: ${name} (ID: ${id}) for user: ${user}`);

  res.json({
    status: 'ok'
  });
});

// 4. GET /1.1/charts/:id - Load layout details
router.get('/1.1/charts/:id', (req, res) => {
  const { id } = req.params;
  const { client, user } = req.query;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  const data = db.readDb();
  const chart = data.charts.find(c => c.id === id && c.client === client && c.user === user);

  if (!chart) {
    return res.status(404).json({ status: 'error', error: 'Chart layout not found.' });
  }

  res.json({
    status: 'ok',
    data: {
      id: chart.id,
      name: chart.name,
      symbol: chart.symbol,
      resolution: chart.resolution,
      timestamp: chart.timestamp,
      content: chart.content
    }
  });
});

// 5. DELETE /1.1/charts/:id - Delete chart layout
router.delete('/1.1/charts/:id', (req, res) => {
  const { id } = req.params;
  const { client, user } = req.query;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  const data = db.readDb();
  const initialLength = data.charts.length;
  data.charts = data.charts.filter(c => !(c.id === id && c.client === client && c.user === user));

  if (data.charts.length === initialLength) {
    return res.status(404).json({ status: 'error', error: 'Chart layout not found.' });
  }

  db.writeDb(data);

  console.log(`[TradingView Storage] Deleted chart layout ID: ${id} for user: ${user}`);

  res.json({
    status: 'ok'
  });
});

// 6. GET /1.1/study_templates - List study templates
router.get('/1.1/study_templates', (req, res) => {
  const { client, user } = req.query;
  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  const data = db.readDb();
  const templates = data.studyTemplates
    .filter(t => t.client === client && t.user === user)
    .map(t => ({ name: t.name }));

  res.json({
    status: 'ok',
    data: templates
  });
});

// 7. POST /1.1/study_templates - Save a new study template
router.post('/1.1/study_templates', (req, res) => {
  const { client, user } = req.query;
  const { name, content } = req.body;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  if (!name || !content) {
    return res.status(400).json({ status: 'error', error: 'Missing required template fields (name, content).' });
  }

  const data = db.readDb();
  const existingIdx = data.studyTemplates.findIndex(
    t => t.name === name && t.client === client && t.user === user
  );

  const newTemplate = {
    client,
    user,
    name,
    content
  };

  if (existingIdx > -1) {
    data.studyTemplates[existingIdx] = newTemplate;
  } else {
    data.studyTemplates.push(newTemplate);
  }

  db.writeDb(data);

  console.log(`[TradingView Storage] Saved study template: ${name} for user: ${user}`);

  res.json({
    status: 'ok'
  });
});

// 8. GET /1.1/study_templates/:name - Load a study template
router.get('/1.1/study_templates/:name', (req, res) => {
  const { name } = req.params;
  const { client, user } = req.query;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  const data = db.readDb();
  const template = data.studyTemplates.find(
    t => t.name === name && t.client === client && t.user === user
  );

  if (!template) {
    return res.status(404).json({ status: 'error', error: 'Study template not found.' });
  }

  res.json({
    status: 'ok',
    data: {
      name: template.name,
      content: template.content
    }
  });
});

// 9. DELETE /1.1/study_templates/:name - Delete a study template
router.delete('/1.1/study_templates/:name', (req, res) => {
  const { name } = req.params;
  const { client, user } = req.query;

  if (!client || !user) {
    return res.status(400).json({ status: 'error', error: 'Missing client or user query parameter.' });
  }

  const data = db.readDb();
  const initialLength = data.studyTemplates.length;
  data.studyTemplates = data.studyTemplates.filter(
    t => !(t.name === name && t.client === client && t.user === user)
  );

  if (data.studyTemplates.length === initialLength) {
    return res.status(404).json({ status: 'error', error: 'Study template not found.' });
  }

  db.writeDb(data);

  console.log(`[TradingView Storage] Deleted study template: ${name} for user: ${user}`);

  res.json({
    status: 'ok'
  });
});

module.exports = router;
