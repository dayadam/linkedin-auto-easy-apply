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
  // add in results to URL to loop through
  await page.goto(
    "https://www.linkedin.com/jobs/search/?distance=25&f_LF=f_AL&geoId=100955123&keywords=javascript&location=Sandy%20Springs%2C%20Georgia%2C%20United%20States&sortBy=DD",
    { waitUntil: "networkidle2" }
  );
  //wait if no search results? what if login doesn't work?
  //need to added easy apply to URL.
  const searchResultsQuantity = await page.$eval(
    "div.jobs-search-two-pane__title.display-flex > h1 > small",
    el => el.innerText.split(" ")[0]
  );
  console.log(searchResultsQuantity);
  function getPageResults(searchResultsQuantity) {
    searchResultsQuantity = parseInt(searchResultsQuantity);
    //will cause errors on last page when job list is 25 and results are 13
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
        el.scrollIntoView();
      },
      i
    );
  }
  console.log("scrolled");
  const jobListPage = await page.$$eval(
    ".jobs-search-results__list > li > div.job-card-search",
    el => el.map(e => e.id)
  );
  const jobIDClickPromises = [];
  console.log(jobListPage);
  let j = 0;

  async function loopDownResultsOnPage(jobListPage, j) {
    const jobID = "#" + jobListPage[j];
    console.log(jobID);
    await page.waitForSelector(jobID);
    await page.click(jobID);
    await page.evaluate((jobID) => {
      //will cause errors on last page when job list is 25 and results are 13
      //document.querySelector(jobID).click();
      const easyApplyBtnSelector = "button.jobs-apply-button";
      if (document.querySelector(easyApplyBtnSelector)) {
        console.log(document.querySelector(".jobs-details-top-card__company-url.ember-view").innerText);
        document.querySelector(easyApplyBtnSelector).click();
      }
      const applyBtnSelector =
        "div.jobs-easy-apply-footer__actions.display-flex.justify-flex-end > button";
      if (document.querySelector(applyBtnSelector)) {
        console.log(document.querySelector("#jobs-apply-header").innerText);
        document.querySelector(applyBtnSelector).click();
      }
    }, jobID);

    return new Promise((resolve, reject) => {
      //after lead status has been changed, go back to search page and check to see if there's still leads that need changing
      //checkLead().then(function(record) {
      //if leads need changing, recursively run logic to change lead status again
      if (j < 25) {
        j++;
        resolve(loopDownResultsOnPage(jobListPage, j));
        //else resolve to false and exit crm()
      } else resolve();
      //});
    });
  }

  await loopDownResultsOnPage(jobListPage, j);


  // for (i = 0; i < jobListPage.length; i++) {
  //   //try {
  //   let promiseDone;
  //   jobIDClickPromises.push(
  //     new Promise(async (resolve, reject) => {
  //       const jobID = "#" + jobListPage[i];
  //       console.log(jobID);
  //       await page.waitForSelector(jobID);
  //       await page.click(jobID);
  //       await page.evaluate((jobID, resolve) => {
  //         //will cause errors on last page when job list is 25 and results are 13

  //         //document.querySelector(jobID).click();

  //         const easyApplyBtnSelector = "button.jobs-apply-button";
  //         if (document.querySelector(easyApplyBtnSelector)) {
  //           console.log(document.querySelector(".jobs-details-top-card__company-url.ember-view").innerText);
  //           document.querySelector(easyApplyBtnSelector).click();
  //         }
  //         const applyBtnSelector =
  //           "div.jobs-easy-apply-footer__actions.display-flex.justify-flex-end > button";
  //         if (document.querySelector(applyBtnSelector)) {
  //           console.log(document.querySelector("#jobs-apply-header").innerText);
  //           document.querySelector(applyBtnSelector).click();
  //         }
  //         promiseDone = true;

  //       }, jobID, resolve);
  //       if (promiseDone) {
  //         resolve();
  //       }
  //     })
  //   )
  //   // await page.waitForSelector(easyApplyBtnSelector);
  //   // await Promise.all([page.click(easyApplyBtnSelector)]);
  //   //page.waitForNavigation()
  //   // await page.waitForSelector(applyBtnSelector);
  //   // await Promise.all([page.click(applyBtnSelector)]);
  //   //, page.waitForNavigation()
  //   // } catch (err) {
  //   //   console.log(err);
  //   // }
  // }
  // await Promise.all(jobIDClickPromises);
  // //jobListPage.map())


  //close browser
  await browser.close();
  return new Promise((resolve, reject) => {
    resolve();
  });
}

//res.json(req.body);
//});

app.listen(PORT, function () {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
