const http = require("http");
const { sendCreditNotification } = require("./mail.js");

async function checkAndNotifySmsCreditTescom() {
  let oCreditResult = await getSmsCreditTescom().catch((err) => {
    res.status(400).send(err);
  });

  if (oCreditResult.credit < 1000) {
    let oEmailServiceResult = await sendCreditNotification(
      oCreditResult.credit
    ).catch((err) => {
      res.status(400).send(err);
    });
    return oEmailServiceResult;
  } else {
    return oCreditResult;
  }
}

async function getSmsCreditTescom() {
  const options = {
    hostname: "api.tescom.com.tr",
    port: 8080,
    path: `/api/credit/v1?username=${process.env.TESCOM_USERNAME}&password=${process.env.TESCOM_PASSWORD}`,
    method: "GET",
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let statusCode = res.statusCode;
      let restCredit = -1;
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        restCredit = chunk;
      });
      res.on("end", () => {
        let returnCode = restCredit.substr(0, 2);
        if (returnCode === "00") {
          let credit = parseInt(
            restCredit.substr(3, restCredit.length - 3),
            10
          );
          resolve({
            statusCode: 200,
            credit: credit,
          });
        } else {
          resolve({
            statusCode: statusCode,
            credit: -1,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

async function sendSmsUsingTescom(sTo, sSmsText) {
  let xmlBody =
    `<sms>` +
    `<username>${process.env.TESCOM_USERNAME}</username>` +
    `<password>${process.env.TESCOM_PASSWORD}</password>` +
    `<header>${process.env.TESCOM_ORIGIN}</header>` +
    `<validity>2880</validity>` +
    `<message>` +
    `<gsm>` +
    `<no>${sTo}</no>` +
    `</gsm>` +
    `<msg><![CDATA[${sSmsText}]]></msg>` +
    `</message>` +
    `</sms>`;

  const options = {
    hostname: "api.tescom.com.tr",
    port: 8080,
    path: "/api/smspost/v1",
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=UTF-8",
      "Content-Encoding": "UTF-8",
      "Content-Length": Buffer.byteLength(xmlBody),
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let statusCode = res.statusCode;
      let smsId = null;
      //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        smsId = chunk;
      });
      res.on("end", () => {
        resolve({
          smsStatusCode: statusCode,
          smsId: smsId,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    // Write data to request body
    req.write(xmlBody);
    req.end();
  });
}

module.exports = {
  sendSmsUsingTescom,
  getSmsCreditTescom,
  checkAndNotifySmsCreditTescom,
};
