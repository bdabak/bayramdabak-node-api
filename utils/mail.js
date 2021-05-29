const mj = require("node-mailjet");
const { v4: uuidv4 } = require("uuid");

async function sendEmailUsingMailJetHTML(
  oFrom,
  aTo,
  sSubject,
  sBodyText,
  sBodyHtml,
  aAttachment,
  sCustomId
) {
  const mailjet = mj.connect(
    process.env.MAILJET_USERNAME,
    process.env.MAILJET_SECRET
  );

  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: oFrom,
        To: aTo,
        Subject: sSubject,
        TextPart: sBodyText,
        HTMLPart: sBodyHtml,
        Attachments: aAttachment,
        CustomId: sCustomId,
      },
    ],
  });

  try {
    const result = await request;
    return result.body;
  } catch (err) {
    return err;
  }
}

async function sendEmailUsingMailJetTemplate(
  aTo,
  aCc,
  aBcc,
  sTemplateId,
  oVariables,
  aAttachment,
  sCustomId,
  sCampaignId
) {
  const mailjet = mj.connect(
    process.env.MAILJET_USERNAME,
    process.env.MAILJET_SECRET
  );

  try {
    const request = mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          To: aTo,
          Cc: aCc,
          Bcc: aBcc,
          TemplateID: sTemplateId,
          TemplateLanguage: true,
          Variables: oVariables,
          Attachments: aAttachment,
          CustomId: sCustomId,
          CustomCampaign: sCampaignId,
        },
      ],
    });
    const result = await request;
    return result.body;
  } catch (err) {
    return err;
  }
}

async function sendCreditNotification(sCredit) {
  //Prepare for email sending
  let aTo = [
    {
      Email: "bayram.dabak@smod.com.tr",
      Name: "[Bayram DABAK]",
    },
  ];

  let oResponseObject = {};

  let aAttachment = [];
  let oEmailServiceResult = null;
  let sTemplateId = 1022430;
  let oVariables = {
    smsCredit: sCredit,
  };
  let sCampaignId = "SMOD_TESCOM_REPORT";
  let sCustomId = uuidv4(); //Generate a custom GUID

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

  try {
    if (oEmailServiceResult.Messages[0].Status === "success") {
      oResponseObject.statusCode = 200;
      oResponseObject.emailSend = "Success";
      oResponseObject.emailId = oEmailServiceResult.Messages[0].To[0].MessageID;
      oResponseObject.emailUid =
        oEmailServiceResult.Messages[0].To[0].MessageUUID;
      oResponseObject.credit = sCredit;
      return oResponseObject;
    } else {
      oResponseObject.statusCode = 200;
      oResponseObject.emailSend = "Failed";
      oResponseObject.credit = sCredit;
      return oResponseObject;
    }
  } catch (oEx) {
    oResponseObject.statusCode = 200;
    oResponseObject.emailSend = "Failed";
    oResponseObject.credit = sCredit;
    return oResponseObject;
  }
}

module.exports = {
  sendEmailUsingMailJetHTML,
  sendEmailUsingMailJetTemplate,
  sendCreditNotification,
};
