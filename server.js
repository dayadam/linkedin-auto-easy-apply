require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "production") {
  var username = process.env.USER;
  var password = process.env.PASS;
}
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

apply();
//app.post("/api/apply", function(req, res) {
async function apply() {
  console.log("inside apply");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });
  const page = await browser.newPage();
  //page.on("console", consoleObj => console.log(consoleObj.text()));
  await page.goto(
    `https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin`
  );
  await page.setViewport({ width: 900, height: 821 });
  //===log in===
  await page.evaluate(
    (username, password) => {
      document.querySelector("#username").value = username;
      document.querySelector("#password").value = password;
      document
        .querySelector(
          "#app__container > main > div > form > div.login__form_action_container > button"
        )
        .click();
    },
    username,
    password
  );
  //===log in finished===
  await page.waitForNavigation();
  // const applyBtnSelector = "#jobs-nav-item > a";
  // await page.waitForSelector(applyBtnSelector);
  // //const applyBtn =
  // await page.evaluate(applyBtnSelector => {
  //   return document.querySelector(applyBtnSelector).click();
  // }, applyBtnSelector);
  // await page.waitForNavigation();
  // console.log(applyBtn);
  await page.goto(
    "https://www.linkedin.com/jobs/search/?distance=25&f_LF=f_AL&geoId=100955123&keywords=javascript&location=Sandy%20Springs%2C%20Georgia%2C%20United%20States&sortBy=DD"
  );
  await page.waitForNavigation();
  // await page.$eval("button.jobs-apply-button", applyBtn => {
  //   console.log(applyBtn);
  //   applyBtn.click();
  // });
  const applyBtnSelector = "button.jobs-apply-button";
  const applyBtn = await page.evaluate(applyBtnSelector => {
    return document.querySelector(applyBtnSelector).innerHTML;
    //.click();
  }, applyBtnSelector);
  console.log(applyBtn);
  //close browser
  await browser.close();
  return new Promise((resolve, reject) => {
    resolve();
  });
}

//res.json(req.body);
//});

app.listen(PORT, function() {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
