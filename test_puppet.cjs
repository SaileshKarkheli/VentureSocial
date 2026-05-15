const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  console.log("Navigating to localhost:5000/my-trips ...");
  await page.goto('http://localhost:5000/my-trips', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  const hasSpinner = html.includes('animate-spin') && html.includes('border-orange-500');
  console.log("Has orange spinner?", hasSpinner);
  
  await browser.close();
  console.log("Done.");
})();
