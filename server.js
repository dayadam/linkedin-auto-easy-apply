require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV === "development") {
  const username = process.env.USER;
  const password = process.env.PASS;
}

// Define middleware here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/api/apply", function(req, res) {
  async function apply() {
    //=====***** CRM() LOGIC START *****=====
    console.log("inside crm");
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: false
    });
    const page = await browser.newPage();
    await page.goto(`https://ema.agentcrmlogin.com/index.php`);
    await page.setViewport({ width: 1000, height: 821 });
    //===log in===
    //placeholders need to be deleted before username and password input
    //username
    const userInputForm =
      "#loginFormDiv > form > div:nth-child(4) > div > .form-control";
    const userInputPlaceholder = await page.$eval(
      userInputForm,
      el => el.value
    );
    await page.waitForSelector(userInputForm);
    await page.click(userInputForm);
    await page.keyboard.type(process.env.EMA_USERNAME);
    //password
    const passwInputForm =
      "#loginFormDiv > form > div:nth-child(5) > div > .form-control";
    const passwInputPlaceholder = await page.$eval(
      passwInputForm,
      el => el.value
    );
    await page.waitForSelector(passwInputForm);
    await page.click(passwInputForm);
    for (let i = 0; i < passwInputPlaceholder.length; i++) {
      await page.keyboard.press("Backspace");
    }
    await page.keyboard.type(process.env.EMA_PASSWORD);
    //submit login
    const submitLogIn = "#loginFormDiv > form > div:nth-child(6) > button";
    await page.waitForSelector(submitLogIn);
    await Promise.all([page.click(submitLogIn), page.waitForNavigation()]);
    //===log in finished===
    //else close browser
    await browser.close();
    return new Promise((resolve, reject) => {
      resolve(true);
    });
    //=====***** CRM() LOGIC END *****=====
  }

  res.json("got");
});

app.listen(PORT, function() {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
