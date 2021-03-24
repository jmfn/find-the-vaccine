// This appears to be working well....
// Important to persist cookies if you're going to reuse an IP.
// They appear to be capping the # of new sessions per IP timeframe.
//
// Not clear how many requests a give session can invoke per timeframe

async function main() {
  // puppeteer-extra is a drop-in replacement for puppeteer,
  // it augments the installed puppeteer with plugin functionality
  const puppeteer = require("puppeteer-extra");
  const fs = require("fs");

  // add stealth plugin and use defaults (all evasion techniques)
  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  puppeteer.use(StealthPlugin());

  // puppeteer usage as normal
  const args = []; //["--proxy-server=127.0.0.1:9090"];
  puppeteer.launch({ headless: false, args }).then(async (browser) => {
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on("request", (request) => {
      request.continue();
    });

    // if (fs.existsSync("./cookies.json")) {
    //   console.log("setting cookies....");
    //   const cookiesString = fs.readFileSync("./cookies.json");
    //   const cookies = JSON.parse(cookiesString);
    //   await page.setCookie(...cookies);
    // }

    // Setup Intercept
    page.on("response", async (response) => {
      const request = response.request();
      const url = request.url();

      // console.log(`< ${url}`);

      if (
        url ===
        "https://www.walgreens.com/hcschedulersvc/svc/v1/immunizationLocations/availability"
      ) {
        console.log("Received availability");
        const body = await response.json();

        await handleAvailability(body);
      }
    });

    // Visit
    await page.goto("https://www.walgreens.com/", {
      waitUntil: "networkidle2",
    });
    await page.goto(
      "https://www.walgreens.com/findcare/vaccination/covid-19/location-screening",
      {
        waitUntil: "networkidle2",
      }
    );

    // Do Search
    await page.$eval("#inputLocation", (el) => (el.value = "60616"));
    await page.$eval(".LocationSearch_container .btn", (btn) => btn.click());

    await page.waitForTimeout(4000);

    await page.close();
    await browser.close();
  });
}

async function handleAvailability(availability) {
  if (!availability.appointmentsAvailable) {
    console.log("No availability 🙁");
    return;
  }

  console.log(`🏆 Availability detected`);
  console.log(JSON.stringify(availability, null, 2));

  process.exit(1);
}

main();
