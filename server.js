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
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list"
    ],
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
  await page.goto(
    "https://www.linkedin.com/jobs/search/?distance=25&f_LF=f_AL&geoId=100955123&keywords=javascript&location=Sandy%20Springs%2C%20Georgia%2C%20United%20States&sortBy=DD",
    { waitUntil: "networkidle2" }
  );
  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.querySelector(
            ".jobs-search-results__list"
          ).scrollHeight;
          console.log(scrollHeight);
          document
            .querySelector(".jobs-search-results__list")
            .scrollBy(0, distance);
          //window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
  //await autoScroll(page);
  // const firstJobListPage =
  //   ".jobs-search-results__list > li:nth-child(1) > div.job-card-search";
  // await page.waitForSelector(firstJobListPage);
  // await page.click(firstJobListPage);
  const searchResultsQuantity = await page.$eval(
    "div.jobs-search-two-pane__title.display-flex > h1 > small",
    el => el.innerText.split(" ")[0]
  );
  console.log(searchResultsQuantity);
  function getPageResults(searchResultsQuantity) {
    searchResultsQuantity = parseInt(searchResultsQuantity);
    if (searchResultsQuantity >= 25) {
      return 25;
    } else return searchResultsQuantity;
  }
  const pageResults = getPageResults(searchResultsQuantity);
  console.log(pageResults);
  for (i = 1; i < pageResults + 1; i++) {
    await page.$eval(
      `.jobs-search-results__list > li:nth-child(${i})`,
      el => {
        //el.focus();
        //el.scrollTop = 3000;
        //el.scrollTo(0, el.scrollHeight);
        //el.scrollBy(0, 3000);
        el.scrollIntoView();
      },
      i
    );
  }

  console.log("scrolled");
  await page.waitFor(1000);
  // let el = await page.$x("//div[@data-job-id]");
  // console.log(el);
  // for (i = 0; i < 500; i++) {
  //   await page.$eval(".jobs-search-results__list", el => el.focus());
  //   await page.keyboard.press("ArrowDown");
  //   console.log(i);
  // }
  // get length => scroll to length => get length => scroll
  // await Promise.all([page.waitFor(4000), page.keyboard.down("ArrowDown")]);
  // await page.keyboard.up("ArrowDown");
  const jobListPage = await page.$$eval(
    ".jobs-search-results__list > li > div.job-card-search",
    el => el.length
    //.map(e => e.id)
  );

  console.log(jobListPage);
  const easyApplyBtnSelector = "button.jobs-apply-button";
  await page.waitForSelector(easyApplyBtnSelector);
  await Promise.all([page.click(easyApplyBtnSelector)]);
  //page.waitForNavigation()
  const applyBtnSelector =
    "div.jobs-easy-apply-footer__actions.display-flex.justify-flex-end > button";
  await page.waitForSelector(applyBtnSelector);
  await Promise.all([page.click(applyBtnSelector)]);
  //, page.waitForNavigation()
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
