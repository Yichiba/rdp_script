const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { time } = require('console');

const ychiba = [];
(async () => {
  try {
    // Launch a Chromium browser
    const browser = await puppeteer.launch({ headless: false }); // Set headless: false for debugging
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 720 });

    // Navigate to the webpage
    await page.goto('https://1xbet.com/games-frame/games/371?co=125&cu=135&lg=en&wh=50&tzo=1'); // Replace with your URL
    page.setDefaultNavigationTimeout(0); // Disable navigation timeout

    // Wait for the game to potentially load
    await page.waitForSelector('.crash-game__wrap');
    
    // Function to sleep for a given number of milliseconds
    async function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Function to continuously monitor the crash-game__counter value
    async function monitorCrashCounter() {
      let lastValue = 'x';
      let revenue = 0;

      while (true) {
        try {
          const counterElement = await page.$('.crash-game__counter');
          const counterElement1 = await page.$('.crash-total__value--bets');
          if (counterElement) {
            const value = await page.evaluate(el => el.textContent.trim(), counterElement);
      
            if (value === 'x') {
              if (lastValue != 'x') {
                // const currentTime = new Date();
                const value1 = await page.evaluate(el => el.textContent.trim(), counterElement1);
                const prizer = await page.$('.crash-total__value--prize');
                const prize = await page.evaluate(el => el.textContent.trim(), prizer);
      
                // Format date and remove "MAD" from bets and wins
                const formattedDate = new Date()
                  .toLocaleString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                  .replace(',', '')
                  .replace('AM', '')
                  .replace('PM', '');
                const betsWithoutMad = value1.replace(/MAD/g, ''); // Remove "MAD" using regex
                const prizeWithoutMad = prize.replace(/MAD/g, ''); // Remove "MAD" using regex
                lastValue = lastValue.replace(/x/g, ''); // Remove "x" from value

      
                // Write data to file with double-quoted date and formatted bets/wins
                revenue = betsWithoutMad - prizeWithoutMad;
                  ychiba.push({ "value": lastValue, "date": formattedDate, "bets": betsWithoutMad, "wins": prizeWithoutMad, 'revenue' : revenue });
                  const jsonData = JSON.stringify(ychiba); // Convert data to JSON format

                  const filePath = path.join(__dirname, '.','crash_logs.js');
                  fs.writeFile(filePath, `const data = ${jsonData};\n\nexport default data;`, (err) => {
                    if (err) {
                      console.error('Error writing file:', err);
                      return;
                    }
                  });
                // console.log(`{ "value": ${lastValue}, "date": "${formattedDate}", "bets": ${betsWithoutMad}, "wins": ${prizeWithoutMad}},`);
              }
            }
            lastValue = value;
          } 
        } catch (error) {
          console.error('Error while monitoring counter:', error);
        }
        sleep(100);
      }

      return lastValue;
    }

    // Start monitoring the crash-game__counter value
    const finalValue = await monitorCrashCounter();

    // Save the final value to a file
    fs.writeFileSync('final_value.txt', `Final value before crash: ${finalValue}`);

    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
