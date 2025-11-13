const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Simple health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Example CV endpoint (returns a sample CV object)
app.get('/api/cv/sample', (req, res) => {
  res.json({
    name: 'Chalaka Ccb',
    title: 'Frontend Developer',
    email: 'example@example.com',
    skills: ['React', 'Next.js', 'Node.js']
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
