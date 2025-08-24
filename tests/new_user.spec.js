import {chromium} from 'playwright';


(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000");
  await page.click("#sign-up");
  await page.fill("#firstName", "John");
  await page.fill("#LastName", "Doe");
  await page.fill("#username", "doe123");
  await page.fill("#academyName", "morales");
  await page.fill("#address", "23 E Correll Rd");
  await page.selectOption("#state", "California");
  await page.fill("#academyName", "morales");
  await page.fill("#city", "Heber");
  await page.fill("#zip", "92249");
  await page.fill("#academyName", "morales");
  await page.fill("#email", "jdoe@gmail.com");
  await page.selectOption("#belt", "blue");
  await page.setInputFiles("#formFile", "./pictures/profile_pic.jpg");
  await page.getByLabel("Drill New Moves").setChecked(true);
  await page.getByLabel("Flow Roll").setChecked(true);
  await page.check("#flexRadioDefault2");
  await page.click("#next-btn");
  await page.fill("#inputPassword6", "pikapika1.");
  //await page.fill("#u_uhD_123744", "This is a test message.");
  await page.click("#submit-btn");

  //await page.screenshot({ path: "file-demo.png" });
  //await browser.close();
})();