const fs = require('fs');
const Papa = require('papaparse');

const csvData = fs.readFileSync('FINAL_PRODUCTS_IMPORT.csv', 'utf8');

Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    console.log("Parsed rows:", results.data.length);
    if(results.errors.length > 0) {
      console.log("Errors:", results.errors);
    }
  }
});
