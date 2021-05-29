const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config({ path: __dirname + "/.env" });
const https = require("https");
const http = require("http");
const fs = require("fs");

const sendMail = require("./routes/send-mail");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/sendMail", sendMail);

const port = process.env.PORT || 3025;

if (!port) {
  console.error("FATAL ERROR: Port number is not configured");
  process.exit(1);
}

if (app.get("env") === "development") {
  http.createServer(app).listen(process.env.PORT_HTTP, () => {
    console.log(`Listening on port ${process.env.PORT_HTTP}...`);
  });
} else {
  const options = {
    key: fs.readFileSync(
      path.join(
        __dirname,
        "../../../etc/letsencrypt/live/www.bayramdabak.com/fullchain.pem"
      )
    ),
    cert: fs.readFileSync(
      path.join(
        __dirname,
        "../../../etc/letsencrypt/live/www.bayramdabak.com/privkey.pem"
      )
    ),
  };

  https.createServer(options, app).listen(process.env.PORT_HTTPS, () => {
    console.log(`Listening on port ${process.env.PORT_HTTPS}...`);
  });
  // ssl_certificate         /etc/letsencrypt/live/www.bayramdabak.com/fullchain.pem;
  // ssl_certificate_key     /etc/letsencrypt/live/www.bayramdabak.com/privkey.pem;
}
// app.listen(port, () => {
//   console.log(`Listening on port ${port}...`);

//   //Get application environment
//   console.log(`App is running in ${app.get("env")} environment`);
// });
