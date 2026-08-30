const fs = require('fs');
const path = require('path');

const brands = {
  "La Coppera": 200,          // Base SKU prefix for La Coppera
  "Mashakh Woodcraft": 300,   // Base SKU prefix for Mashakh Woodcraft
  "TRIVANTAGE PRO": 400       // Base SKU prefix for Trivantage
};

const outputDir = path.join(__dirname, 'Ready_For_Upload');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

let totalProcessed = 0;

for (const [brandName, baseId] of Object.entries(brands)) {
  const brandPath = path.join(__dirname, brandName);
  
  if (!fs.existsSync(brandPath)) {
    console.log(`Skipping ${brandName} - folder not found.`);
    continue;
  }

  const subDirs = fs.readdirSync(brandPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const dirName of subDirs) {
    // Match the number at the beginning of the folder name (e.g. "1. 2019-T2-01" -> "1")
    const match = dirName.match(/^(\d+)/);
    if (!match) continue;

    const num = parseInt(match[1]);
    const skuId = baseId + num; // e.g. 200 + 1 = 201

    const subDirPath = path.join(brandPath, dirName);
    const files = fs.readdirSync(subDirPath);
    
    const imageFiles = files.filter(file => /\.(png|jpe?g|webp)$/i.test(file));

    if (imageFiles.length > 0) {
      imageFiles.forEach((imageFile, index) => {
        const sourcePath = path.join(subDirPath, imageFile);
        // Remove any weird double extensions like .png.webp and just keep .webp
        const cleanName = imageFile.replace(/\.png\.webp$/i, '.webp').replace(/\.jpg\.webp$/i, '.webp');
        const extension = path.extname(cleanName);
        
        // Name it sequentially: e.g. 201_1.webp, 201_2.webp
        // If it's the first image, maybe we just want to ensure it works well with the backend
        const targetFileName = `${skuId}_${index + 1}${extension}`;
        const targetPath = path.join(outputDir, targetFileName);
        
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${brandName}/${dirName}/${imageFile} -> Ready_For_Upload/${targetFileName}`);
        totalProcessed++;
      });
    }
  }
}

console.log(`\n✅ Success! Extracted and renamed ${totalProcessed} images into the 'Ready_For_Upload' folder.`);
console.log(`You can now go to the Admin Panel, click Bulk Import, and select ALL images from the 'Ready_For_Upload' folder at once.`);
