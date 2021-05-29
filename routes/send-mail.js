const express = require("express");
const router = express.Router();
const Joi = require("@hapi/joi");
const _ = require("lodash");
const {
  sendEmailUsingMailJetHTML,
  sendEmailUsingMailJetTemplate,
} = require("../utils/mail.js");

//Only post is supported
router.post("/", async (req, res) => {
  let data = req.body?.data || req.body;

  const { error } = validateRequest(data);

  if (error) return res.status(400).send(error.details[0].message);

  const oMailOptions = {
    ...data,
    fromEmail: "bayram.dabak@smod.com.tr",
    fromName: "Bayram DABAK - Website",
    toEmail: "bayram.dabak@smod.com.tr",
    toName: "Bayram DABAK",
  };

  let result = await sendMail(oMailOptions).catch((err) => {
    console.log(err);
    res.status(400).send(err);
  });
  res.status(200).json(result);
});

//Not supported return 405
router.get("/", async (req, res) => {
  return res.status(405).send("GET not supported!");
});

router.get("/:id", async (req, res) => {
  return res.status(405).send("GET not supported!");
});

router.put("/:id", async (req, res) => {
  return res.status(405).send("PUT not supported!");
});

async function sendMail(oOptions) {
  let responseObject = {
    emailSend: null,
    emailId: null,
    emailUid: null,
    error: null,
  };

  //Prepare for email sending
  let aTo = [
    {
      Email: oOptions.toEmail,
      Name: oOptions.toName,
    },
  ];

  let aCc = [];
  if (oOptions.ccEmail) {
    aCc.push({
      Email: oOptions.ccEmail,
    });
  }
  let aBcc = [];
  if (oOptions.bccEmail) {
    aBcc.push({
      Email: oReq.bccEmail,
    });
  }

  let aAttachment = [];

  let sCustomId = oOptions.customId;

  let oEmailServiceResult = null;

  if (oOptions.sendMethod === "HTML") {
    /* HTML Specific Variables*/
    let oFrom = {
      Email: oOptions.fromEmail,
      Name: oOptions.fromName,
    };

    let sSubject = oOptions.emailSubject;
    let sBodyText = oOptions.emailBodyText;
    let sBodyHtml = oOptions.emailBodyHtml;

    //Send email HTML
    oEmailServiceResult = await sendEmailUsingMailJetHTML(
      oFrom,
      aTo,
      sSubject,
      sBodyText,
      sBodyHtml,
      aAttachment,
      sCustomId
    );
  } else {
    let sTemplateId = oOptions.emailTemplateId;
    let oVariables = oOptions.emailVariables;
    let sCampaignId = oOptions.campaignId;

    //Send email Template
    oEmailServiceResult = await sendEmailUsingMailJetTemplate(
      aTo,
      [],
      [],
      sTemplateId,
      oVariables,
      aAttachment,
      sCustomId,
      sCampaignId
    );
  }

  try {
    if (oEmailServiceResult.Messages[0].Status === "success") {
      responseObject.emailSend = "Success";
      responseObject.emailId = oEmailServiceResult.Messages[0].To[0].MessageID;
      responseObject.emailUid =
        oEmailServiceResult.Messages[0].To[0].MessageUUID;
    } else {
      responseObject.emailSend = "Failed";
      return responseObject;
    }
  } catch (oEx) {
    responseObject.emailSend = "Failed";
    return responseObject;
  }

  return responseObject;
}

function validateRequest(request) {
  //Main schema
  let schema = Joi.object({
    sendMethod: Joi.string().valid("HTML", "TEMPLATE").uppercase().required(),
    fromName: Joi.when("sendMethod", {
      is: "HTML",
      then: Joi.string().required(),
      otherwise: Joi.string().allow("").allow(null),
    }),
    fromEmail: Joi.when("sendMethod", {
      is: "HTML",
      then: Joi.string().required().email(),
      otherwise: Joi.string().allow("").allow(null),
    }),
    emailSubject: Joi.when("sendMethod", {
      is: "HTML",
      then: Joi.string().required(),
      otherwise: Joi.string().allow("").allow(null),
    }),
    emailBodyText: Joi.when("sendMethod", {
      is: "HTML",
      then: Joi.string().required(),
      otherwise: Joi.string().allow("").allow(null),
    }),
    emailBodyHtml: Joi.when("sendMethod", {
      is: "HTML",
      then: Joi.string().required(),
      otherwise: Joi.string().allow("").allow(null),
    }),
    emailTemplateId: Joi.when("sendMethod", {
      is: "TEMPLATE",
      then: Joi.number().required(),
      otherwise: Joi.string().allow("").allow(null),
    }),
    emailVariables: Joi.when("sendMethod", {
      is: "TEMPLATE",
      then: Joi.object().required(),
      otherwise: Joi.any().allow("").allow(null),
    }),
    customId: Joi.string().required(),
    campaignId: Joi.when("sendMethod", {
      is: "TEMPLATE",
      then: Joi.string().required(),
      otherwise: Joi.any().allow("").allow(null),
    }),
  });

  return schema.validate(request, (err, data) => {
    if (err) {
      // Joi Error
      const JoiError = {
        status: "failed",
        error: {
          original: err._object,

          // fetch only message and type from each error
          details: _.map(err.details, ({ message, type }) => ({
            message: message.replace(/['"]/g, ""),
            type,
          })),
        },
      };

      // Send back the JSON error response
      return JoiError;
    } else {
      // Replace req.body with the data after Joi validation
      request = data;
      return request;
    }
  });
}

module.exports = router;
