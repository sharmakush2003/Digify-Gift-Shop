const fs = require('fs');
const pdf = require('pdf-parse');

const fileNames = ['La Coppera Upload.pdf', 'Mashakh Woodcraft Upload.pdf', 'Orient Products.pdf'];

async function parsePdfs() {
  for (const fileName of fileNames) {
    let dataBuffer = fs.readFileSync(fileName);
    try {
      const data = await pdf(dataBuffer);
      console.log(`--- ${fileName} ---`);
      console.log(data.text.substring(0, 1000)); // Print first 1000 chars to analyze structure
    } catch (err) {
      console.error(`Error parsing ${fileName}:`, err);
    }
  }
}

parsePdfs();
