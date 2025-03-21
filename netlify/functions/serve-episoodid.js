const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Read the content of the episoodid.js file
    // Adjust the path as needed to point to your actual episoodid.js file
    const filePath = path.resolve(__dirname, '../../src/_scripts/episoodid.js');
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600'
      },
      body: content
    };
  } catch (error) {
    console.error('Error serving episoodid.js:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to serve episoodid.js' })
    };
  }
};
