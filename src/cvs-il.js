const Http = require("./http");
const beep = require("beepbeep");

const headers = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
  accept: "*/*",
  referer: "https://www.cvs.com/immunizations/covid-19-vaccine",
  "accept-language": "en-US",
  cookie:
    "akavpau_www_cvs_com_general=161673249~id=8cafa9266d349c13fa274e23735ed8",
};

async function main() {
  try {
    // setup http client with a cookie jar
    const http = new Http({
      useCookieJar: true,
      // debug: true, // Show request/response headers
      // proxy: { host: "localhost", port: 9090 },  // Route through local proxy for further debugging
    });

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check availability
    let response = await http.fetch(
      "https://www.cvs.com/immunizations/covid-19-vaccine.vaccine-status.IL.json?vaccineinfo",
      "GET",
      {
        headers,
      }
    );

    let data = response.data;

    const currentTime = data.responsePayloadData.currentTime;

    if (
      !data.responsePayloadData.data.IL.some((i) => i.status !== "Fully Booked")
    ) {
      console.log(
        `No appointments...(last updated ${currentTime}), ${new Date().toLocaleString()}`
      );
      return;
    }

    console.log(
      `🏆🏆🏆 Appointment available...(last updated ${currentTime}), ${new Date().toLocaleString()}`
    );
    console.log(JSON.stringify(data, null, 2));
    beep(10);

    process.exit(1);
  } catch (e) {
    beep(3);
    console.error("Error...");
    console.error(e);
    console.error(e.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  try {
    main(process.argv[2], process.argv[3]);
  } catch (e) {
    beep(3);
    console.error(e);
    console.error(e.stack);
    process.exit(1);
  }
}

module.exports = {
  main,
};
