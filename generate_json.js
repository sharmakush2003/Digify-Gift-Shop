const fs = require('fs');
const path = require('path');

const rawLaCoppera = `
1 La Coppera Ayurship Bottle Camel Mirage LH-2019-T2-01 1700/- (00011304) 74181010 5%
2 La Coppera Ayurship Noor - e - Gul Set LG-8054 2800/- (00011302) 74181010 5%
3 La Coppera Luna Carafe Rustic LH-2015-R1-01 74181010 5%
4 La Coppera Ayurship Jaali Set LG-8053 2800/- (00011301) 74181010 5%
5 La Coppera Bronze Thali Set (6Piece) LH-6001-K1 (00011263) 74181010 5%
6 La Coppera Olea Can 700ml LH-1015-D1 1775/- (00011343) 74181010 5%
7 La Coppera Brass Sundara Ghee Pot 400ml LH-1017-P1 1075/- (00011309) 74181010 5%
8 La Coppera Infusio Tea Strainer Brass LH-1016-D1 74181010 5%
9 La Coppera Brass Flower Bowl w/ Spoon Set of 4 LG-8049 74181010 5%
10 La Coppera Jalbindu Carafe Set LG-8056 3175/- (00011311) 74181010 5%
11 La Coppera Brass Mor Dabba Round 600ml LH-1005-E1 1350/- (00011335) 74181010 5%
12 La Coppera Brass Mor Dabba Round 1400ml LH-1005-E2 2125/- (00011336) 74181010 5%
13 La Coppera Brass Mor Dabba Round 2600ml LH-1005-E3 2825/- (00011337) 74181010 5%
14 La Coppera Brass Mor Dabba Square 1250ml LH-1003-E1 1900/- (00011338) 74181010 5%
15 La Coppera Brass Mor Dabba Square 2000ml LH-1003-E2 2275/- (00011339) 74181010 5%
16 La Coppera Brass Mughlai Handi 2000ml LH-1010-H1 4450/- (00011360) 74181010 5%
17 La Coppera Brass Mughlai Handi 4000ml LH-1010-H2 5675/- (00011342) 74181010 5%
18 La Coppera Copper Mughlai Handi 2000ml LH-1011-H1 (00011433) 74181010 5%
19 La Coppera Copper Mughlai Handi 4000ml LH-1011-H2 (00011434) 74181010 5%
20 La Coppera Sanjeevani Matka 7000 ml LH-5008-H3 (00011402) 74181010 5%
21 La Coppera Brass Masala Box Dome LH-1020-D1 74181010 5%
22 La Coppera Brass Masala Box Lotus Harmony 5" LH-1021-E1 (00011411) 74181010 5%
23 La Coppera Brass Masala Box Mandala Radiance 7" LH-1021-E2 74181010 5%
24 La Coppera Brass Masala Box Lotus Harmony 8" LH-1021-E3 (00011361) 74181010 5%
25 La Coppera Brass Masala Box Mandala Radiance 9" LH-1021-E4 (00011412) 74181010 5%
`;

const rawMashakh = `
1 Mashakh Woodcraft Akhand Dutta Natural - Acacia 295/- (00011395) 69111011 5%
2 Mashakh Woodcraft Ash Tray Big 10x10x3.5cm 399/- (000010339) 69111011 5%
3 Mashakh Woodcraft Belan Natural - Acacia 289/- (00011377) 69111011 5% Belan
4 Mashakh Woodcraft Belly Belan Natural - Acacia 389/- (00011526) 69111011 5% Belan
5 Mashakh Woodcraft Casserole Big 1500 ml - PU Insulated 2950/- (00011396) 69111011 5%
6 Mashakh Woodcraft Cutting Board Rectangle 31x21x1.25 - Acacia (00011455) 69111011 5%
7 Mashakh Woodcraft Cutting Board Rectangle 36x25x1.25cm - Acacia (00011405) 69111011 5%
8 Mashakh Woodcraft French Round Board 10" 810/- (000010377) 69111011 5% Pizza Bat
9 Mashakh Woodcraft French Round Board 12" 920/- (000010376) 69111011 5% Pizza Bat
10 Mashakh Woodcraft Ice Bucket - PU Insulated 2950/- (00011397) 69111011 5%
11 Mashakh Woodcraft Ice Tong Natural - Acacia 299/- (00011444) 69111011 5%
12 Mashakh Woodcraft Jack Stand Walnut Brown (00011443) 69111011 5%
13 Mashakh Woodcraft Kaden Dinner Plate Acacia 1350/- (000010590) 69111011 5% Plate
14 Mashakh Woodcraft Kaden Quarter Plate Acacia 990/- (000010591) 69111011 5% Plate
15 Mashakh Woodcraft Niche Rectangle Platter 30x15.5cm (00010520) 69111011 5%
16 Mashakh Woodcraft Reserved Sign Prism Natural 325/- (000010559) 69111011 5%
17 Mashakh Woodcraft Rubberwood Napkin Holder Hexa 325/- (00011384) 69111011 5% Napkin Stand
18 Mashakh Woodcraft Rubberwood Napkin Holder Round 325/- (00011385) 69111011 5% Napkin Stand
19 Mashakh Woodcraft Serving Bowl 110x65mm - 280 ml Acacia (00011382) 69111011 5% Serving Bowl
20 Mashakh Woodcraft Serving Bowl 144x69mm - 600 ml Acacia (000010567) 69111011 5% Serving Bowl
21 Mashakh Woodcraft Serving Bowl 195x70mm - 1250ml Acacia (000010566) 69111011 5% Serving Bowl
22 Mashakh Woodcraft Tavetha Natural - Acacia 189/- (00011378) 69111011 5%
23 Mashakh Woodcraft Teakwood Spice Box 4 SP Comp 1190/- (00011438) 69111011 5% Spice Box
24 Mashakh Woodcraft Teakwood Spice Box 6 SP Comp 1450/- (00011437) 69111011 5% Spice Box
25 Mashakh Woodcraft Teakwood Spice Box 9 SP Comp 1980/- (00011436) 69111011 5% Spice Box
26 Shri Woodcraft Teak Tea Cup with Handle S06 2049/- (00011400) 69111011 5%
27 Shri Woodcraft Teakwood Beer Mug Groove S02 SW/TBMG-46 2085/- (00011323) 69111011 5% Beer Mug
28 Shri Woodcraft Teakwood Beer Mug S02 Ring SW/TBMR-47 1825/- (00011328) 69111011 5% Beer Mug
29 Shri Woodcraft Teakwood Champagne Glass S02 SW/TCG-65 1720/- (00011325) 69111011 5%
30 Shri Woodcraft Teak Wood Coffee Mug 400ml S02 SW/TM400/49 1660/- (00011401) 69111011 5%
31 Shri Woodcraft Teakwood -Copper Bottle 500ml SW/TM-16 2399/- (00011330) 69111011 5% Copper Bottle
32 Shri Woodcraft Teakwood -Copper Bottle 600ml SW/TIP-13 2499/- (00011332) 69111011 5% Copper Bottle
33 Shri Woodcraft Teakwood -Copper Bottle 950ml SW/TM-54 2999/- (00011331) 69111011 5% Copper Bottle
34 Shri Woodcraft Teakwood Corporate Gift Set 3449/- (00011326) 69111011 5%
35 Shri Woodcraft Teakwood Kullhad Cup S06 SW/TTC-39 2249/- (00011324) 69111011 5%
36 Shri Woodcraft Teakwood Groove Glass S06 SW/TG-33 2849/- (00011496) 69111011 5% Glass
37 Shri Woodcraft Teakwood Plain Glass S06 SW/TP-27 2849/- (00011495) 69111011 5% Glass
38 Shri Woodcraft Teakwood Radius Glass S06 SW/TR-30 2849/- (00011327) 69111011 5% Glass
39 Shri Woodcraft Teakwood Soap Dish Curve SW/CSD-43 249/- (00011329) 69111011 5%
40 Shri Woodcraft Teakwood Wine Glass S02 SW/TWG-37 1549/- (00011322) 69111011 5%
`;

function parseLines(raw, baseId, dept, cat, defaultImg) {
  const lines = raw.trim().split('\n');
  const products = [];
  let currentId = baseId;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Extract price
    let price = 999;
    const priceMatch = line.match(/(\d+)\/-/);
    if (priceMatch) {
      price = parseInt(priceMatch[1]);
    }

    // Extract barcode
    let barcode = `000${currentId}`;
    const barcodeMatch = line.match(/\((\d{8})\)/);
    if (barcodeMatch) {
      barcode = barcodeMatch[1];
    }

    // Extract HSN and GST
    let hsn = "74181010";
    let gst = 5;
    const gstMatch = line.match(/(\d{8})\s+(\d+)%/);
    if (gstMatch) {
      hsn = gstMatch[1];
      gst = parseInt(gstMatch[2]);
    }

    // Extract name
    let name = line;
    name = name.replace(/^\d+\s+/, ''); // remove S.No
    name = name.replace(/(\d+)\/-\s*/, ''); // remove price
    name = name.replace(/\(\d{8}\)\s*/, ''); // remove barcode
    name = name.replace(/\d{8}\s+\d+%/, ''); // remove HSN and GST
    name = name.replace(/(Belan|Pizza Bat|Plate|Napkin Stand|Serving Bowl|Spice Box|Beer Mug|Copper Bottle|Glass)$/i, ''); // remove suffixes
    name = name.trim();

    products.push({
      id: currentId++,
      name: name,
      price: price,
      stock: Math.floor(Math.random() * 40) + 10, // random stock 10-50
      image: defaultImg,
      images: [],
      department: dept,
      category: cat,
      subCategory: "Premium",
      fragile: name.includes('Glass') || name.includes('Brass') || name.includes('Copper'),
      microwave: false,
      barcode: barcode,
      hsn: hsn,
      gst: gst,
      soldCount: Math.floor(Math.random() * 100),
      description: "Authentic premium product from Orient Crockeries catalog.",
      rating: 5,
      reviewCount: Math.floor(Math.random() * 20) + 1,
      reviews: []
    });
  }
  return products;
}

const copperaProducts = parseLines(rawLaCoppera, 201, "Crockery & Dining", "Serveware", "/images/stahl_hybrid_kadai.png");
const mashakhProducts = parseLines(rawMashakh, 301, "Woodcraft", "Acacia Wood", "/images/acacia_wood_casserole.png");

const allProducts = [...copperaProducts, ...mashakhProducts];

// Add image arrays from public folder
const productsImageDir = path.join(__dirname, 'public', 'images', 'products');
let availableImages = [];
if (fs.existsSync(productsImageDir)) {
  availableImages = fs.readdirSync(productsImageDir);
}

allProducts.forEach(product => {
  const productIdStr = product.id.toString();
  const matchingImages = availableImages.filter(img => img.startsWith(productIdStr + '_'));
  
  if (matchingImages.length > 0) {
    matchingImages.sort((a, b) => {
      const numA = parseInt(a.split('_')[1].split('.')[0]);
      const numB = parseInt(b.split('_')[1].split('.')[0]);
      return numA - numB;
    });
    
    product.images = matchingImages.map(img => `/images/products/${img}`);
    product.image = product.images[0];
  }
});

fs.writeFileSync('src/app/parsed_products.json', JSON.stringify(allProducts, null, 2));
console.log("Written to src/app/parsed_products.json");
