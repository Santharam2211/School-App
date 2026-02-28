const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Serve PDF files
router.get('/homework-pdfs/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/homework-pdfs', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
