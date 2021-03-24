const Http = require("./http");
const beep = require("beepbeep");

const username = process.env.WALGREENS_USERNAME;
const password = process.env.WALGREENS_PASSWORD;

if (!username) {
  console.error("Missing env, `WALGREENS_USERNAME`");
  process.exit(1);
}

if (!password) {
  console.error("Missing env, `WALGREENS_PASSWORD`");
  process.exit(1);
}

const headers = {
  "User-Agent": "Walgreens/12.0 CFNetwork/1220.1 Darwin/20.3.0",
  "Accept-Language": "en-us",
  Accept: "*/*",
  Connection: "keep-alive",
  "Content-Type": "application/json; charset=UTF-8",
  Host: "services.walgreens.com",
  "x-gateway-apikey": "98a9586b-814e-4ab6-a1ca-6d4a606c2615",
};

const loginHeaders = {
  appversion: "33.1",
  "Content-Type": "application/json",
  Host: "services.walgreens.com",
  apiKey: "d12ddc87a36f1cfb422dccb4ff0a7184",
  Connection: "keep-alive",
  "Content-Length": "60",
  devicename: "iPhone",
  id: "17DAB72C-305E-4C8A-BB31-C9A1F336CB19",
  os: "iOS 14.4",
  Accept: "*/*",
  "Accept-Language": "en-US;q=1",
  model: "iPhone 8 Plus",
  "X-Akamai-Native": "YES",
  brandName: "WAG",
  "User-Agent": "Sparkle/33.1 (iPhone; iOS 14.4; Scale/3.00)",
  CINT: "0.000000",
};

async function main(zipcode) {
  try {
    // setup http client with a cookie jar
    const http = new Http({
      useCookieJar: true,
      // debug: true, // Show request/response headers
      // proxy: { host: "localhost", port: 9090 },  // Route through local proxy for further debugging
    });

    // Login
    await http.fetch(
      "https://services.walgreens.com/api/profile/v1/login",
      "POST",
      {
        headers: loginHeaders,
        data: { username, password },
      }
    );

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check availability
    let response = await http.fetch(
      "https://services.walgreens.com/sag/MobileAppSchedulerService/1.0/immunizationLocations/availability",
      "POST",
      {
        headers,
        data: {
          serviceId: "99",
          zipCode: `${zipcode}`,
          appointmentAvailability: {
            startDateTime: today.toISOString().split("T")[0],
          },
          radius: 25,
        },
      }
    );

    let data = response.data;

    if (!data.appointmentsAvailable) {
      console.log(
        `No appointments for ${zipcode}...${new Date().toLocaleString()}`
      );
      return;
    }

    // Walgreens has a second-level availability/timeslots check. TODO: fetch this.
    response = await http.fetch(
      "https://services.walgreens.com/sag/MobileAppSchedulerService/2.0/immunizationLocations/timeslots",
      "POST",
      {
        headers,
        data: {
          vaccine: {
            productId: "",
          },
          appointmentAvailability: {
            startDateTime: tomorrow.toISOString().split("T")[0],
          },
          radius: "25",
          size: "25",
          serviceId: "99",
          zipCode: zipcode,
        },
      }
    );

    data = response.data;

    if (data.errors && data.errors.length) {
      if (data.errors[0].FC_904_NoData) {
        console.log(
          `No timeslots for appointments for ${zipcode}...${new Date().toLocaleString()}`
        );
      } else {
        console.log(
          `Unknown error for appointments for ${zipcode}...${new Date().toLocaleString()}`
        );
      }
      return;
    }

    console.log(
      `🏆🏆🏆 Appointment available for ${zipcode}, ${new Date().toLocaleString()}`
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
