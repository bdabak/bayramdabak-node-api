const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config({ path: __dirname + "/.env" });

const sendMail = require("./routes/send-mail");
const { conformsTo } = require("lodash");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/sendMail", sendMail);

const port = process.env.PORT || 3025;

if (!port) {
  console.error("FATAL ERROR: Port number is not configured");
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);

  //Get application environment
  console.log(`App is running in ${app.get("env")} environment`);
});
