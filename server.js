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
    headless: false,
    slowMo: 200
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
  const jobListPage = [];
  for (i = 1; i < pageResults + 1; i++) {
    jobListPage.push(await page.$eval(
      `.jobs-search-results__list > li:nth-child(${i})  > div.job-card-search > artdeco-entity-lockup > figure > a`,
      (aTag) => {
        aTag.scrollIntoView();
        function wait(aTag) {
          return new Promise((res, rej) => {
            setTimeout(function () {
              res(aTag);
            }, 50)
          })
        }
        return wait(aTag).then(aTag => {
          return aTag.href
        })
      }
    ));
  }
  console.log(jobListPage);

  for (i = 0; i < jobListPage.length; i++) {
    const page2 = await browser.newPage();
    await page2.goto(jobListPage[i]);
    const divApplySelector = "div.justify-space-between.display-flex.align-items-stretch.mb4 > div.display-flex.flex-column.justify-space-between.mb1 > div.jobs-top-card__actions";
    const easyApplyBtnSelector = "button.jobs-apply-button";
    await page2.waitForSelector(divApplySelector);
    const applyButtonBool = await page2.$eval(divApplySelector, (el, easyApplyBtnSelector) => {
      return (el.querySelector(easyApplyBtnSelector) ? true : false);
    }, easyApplyBtnSelector);
    console.log(applyButtonBool);
    if (applyButtonBool) {
      const page3Promise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
      await page2.click(easyApplyBtnSelector);
      const applyButtonSubmit = "footer > div.jobs-easy-apply-footer__actions > button"
      try {
        await page2.$eval(applyButtonSubmit, el => {
          el.click();
        });
      } catch (err) {
        const page3 = await page3Promise;
        //console.log(err)

        await page3.waitForSelector("footer > button");
        Promise.all([page3.click("footer > button")]);
        //, page3.waitForNavigation()
        await page3.waitForSelector("div.question-wrapper");
        const jobQuestionArray = await page3.$$eval("div.question-wrapper > li", el => el);
        console.log(jobQuestionArray);
        for (k = 0; k < jobQuestionArray.length; k++) {
          console.log(jobQuestionArray[k]);
          if (jobQuestionArray[k].innerText === "Are you comfortable commuting to this job's location?") {
            console.log("hi");
            //await page3.$eval()
          }
        }
        await page3.close();



      }
      await page2.close();
    } else await page2.close();
  }
  // (async function () {
  // for (i = 0; i < jobListPage.length; i++) {
  //   //let promiseDone;
  //   //jobIDClickPromises.push(
  //   //new Promise(async (resolve, reject) => {
  //   // const jobID = "#" + jobListPage[i];
  //   console.log(jobListPage[i]);

  //   await page.waitForSelector(jobListPage[i]);
  //   await page.click(jobListPage[i]);
  //   //take out of eval?
  //   const easyApplyBtnSelector = "button.jobs-apply-button";
  //   //not waiting for selector before check, could cause bug
  //   const applyButton = await page.evaluate((easyApplyBtnSelector) => {
  //     //await 
  //     return document.querySelector(easyApplyBtnSelector)
  //   }, easyApplyBtnSelector)
  //   console.log(applyButton);
  //   if (applyButton) {
  //     await page.waitForSelector(easyApplyBtnSelector)
  //     const company = await page.$eval(".jobs-details-top-card__company-url.ember-view", el => el.innerText);
  //     console.log(company);
  //   }
  //   //await page.click(easyApplyBtnSelector);
  //   // if (await document.querySelector(easyApplyBtnSelector)) {
  //   //   console.log( await (document.querySelector(".jobs-details-top-card__company-url.ember-view")).innerText);
  //   //   await (await document.querySelector(easyApplyBtnSelector)).click();
  //   // }
  //   // await page.evaluate(async (jobListPage, i) => {
  //   //   //will cause errors on last page when job list is 25 and results are 13

  //   //   //document.querySelector(jobID).click();

  //   //   const easyApplyBtnSelector = "button.jobs-apply-button";
  //   //   if (await document.querySelector(easyApplyBtnSelector)) {
  //   //     console.log(await (document.querySelector(".jobs-details-top-card__company-url.ember-view")).innerText);
  //   //     await (await document.querySelector(easyApplyBtnSelector)).click();
  //   //   }
  //   //   const applyBtnSelector =
  //   //     "div.jobs-easy-apply-footer__actions.display-flex.justify-flex-end > button";
  //   //   if (await document.querySelector(applyBtnSelector)) {
  //   //     console.log(await (document.querySelector("#jobs-apply-header")).innerText);
  //   //     await (await document.querySelector(applyBtnSelector)).click();
  //   //   }
  //   //   //promiseDone = true;

  //   // }, jobListPage, i);
  //   // if (promiseDone) {
  //   //   resolve();
  //   // }
  //   //})
  //   //)
  // }
  // }())
  // await Promise.all(jobIDClickPromises);


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
