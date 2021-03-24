const axios = require("axios").default;
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
const { CookieJar } = require("tough-cookie");
const tunnel = require("tunnel");

// Http client with cookie persistance
module.exports = class Http {
  useCookieJar = true;
  cookieJar = new CookieJar();
  debug = false;
  proxy = { host: "localhost", port: 9090 };

  // axios instance
  http = null;

  constructor(options = { useCookieJar: true, debug: false, proxy: null }) {
    this.useCookieJar = options.useCookieJar;
    this.debug = options.debug;
    this.proxy = options.proxy;

    let agent;

    // hack when proxy is http
    if (this.proxy) {
      agent = tunnel.httpsOverHttp({
        proxy: this.proxy,
      });
    }

    // Setup HTTP client
    if (this.useCookieJar) {
      axios.defaults.withCredentials = true;

      this.http = axios.create({
        jar: this.cookieJar,
        withCredentials: true,
        agent,
      });

      axiosCookieJarSupport(this.http);
    } else {
      this.http = axios.create({ agent });
    }

    // Setup debug logging
    if (this.debug) {
      this.setupIntercepts();
    }
  }

  setupIntercepts() {
    this.http.interceptors.request.use((request) => {
      console.log(
        "Request Log: ",
        JSON.stringify({ url: request.url, headers: request.headers }, null, 2)
      );
      return request;
    });

    this.http.interceptors.response.use((response) => {
      console.log(
        "Response Log: ",
        JSON.stringify(
          { data: response.data, status: response.status },
          null,
          2
        )
      );
      return response;
    });
  }

  async fetch(url, method, options) {
    return await this.http({
      method,
      url,
      ...options,
    });
  }
};
