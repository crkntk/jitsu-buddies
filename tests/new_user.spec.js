import {chromium} from 'playwright';
import { test, expect } from '@playwright/test';

let User1 = {
     address: '23 E Correll Rd',
    city: 'Heber',
    state: 'CA',
    zip: '92249',
    country: 'USA',
    firstname: 'John1',
    lastName: 'Doe',
    lat: 32.836110,
    lon: -115.586950,
    username: 'CoolBelt1',
    experience:
    {
        belt: "blue",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    }
    ,
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    }
    ,
    weight: 150
    ,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
let User2 = {
    address: '672 Las Villas Street',
    city: 'Imperial',
    state: 'CA',
    zip: '92251',
    country: 'USA',
    firstname: 'John2',
    lastName: 'Doe',
    lat: 32.836110,
    lon: -115.586950,
    username: 'CoolBelt2',
    experience:
    {
        belt: "blue",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    }
    ,
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    }
    ,
    weight: 150
    ,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
let User3 = {
    address: '2806 Parkway Street',
    city: 'El Centro',
    state: 'CA',
    zip: '92243',
    country: 'USA',
    firstname: 'John3',
    lastName: 'Doe',
    lat: 32.682480,
    lon: -115.634949,
    username: 'CoolBelt3',
    experience:
    {
        belt: "purple",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    }
    ,
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    },
    weight: 150,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
let User4 = {
    address: '853 Parkway Street',
    city: 'El Centro',
    state: 'CA',
    zip: '92243',
    country: 'USA',
    firstname: 'John4',
    lastName: 'Doe',
    lat: 32.868767,
    lon: -115.575333,
    username: 'CoolBelt4',
    experience:
    {
        belt: "black",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    },
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    },
    weight: 150,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
const TempUsers = [User1, User2,User3, User4]


  test.beforeEach(async () => {
  });
  
  test('should allow me to add users', async () => {
    test.setTimeout(120_000);
  for(let i=0; i < TempUsers.length; i++){
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("http://localhost:3000");
    await page.click("#sign-up");
    let currTempUser = TempUsers[i];  
    await page.fill("#firstName", currTempUser.firstname);
    await page.fill("#LastName", currTempUser.lastName);
    await page.fill("#username", currTempUser.username);
    await page.fill("#academyName", currTempUser.experience.academy);
    await page.fill("#address", currTempUser.address);
    await page.selectOption("#state", currTempUser.state);
    await page.fill("#academyName",currTempUser.experience.academy );
    await page.fill("#city", currTempUser.city);
    await page.fill("#zip", currTempUser.zip);
    await page.fill("#email",  currTempUser.firstname + "@gmail.com");
    await page.selectOption("#belt",  currTempUser.experience.belt);
    await page.setInputFiles("#formFile", "./pictures/profile_pic.jpg");
    await page.getByLabel("Drill New Moves").setChecked(true);
    await page.getByLabel("Flow Roll").setChecked(true);
    await page.getByLabel("Brazilian Jujitsu").setChecked(true);
    await page.getByLabel("Kung Fu").setChecked(true);
    await page.check("#flexRadioDefault2");
    await page.click("#next-btn");
    await page.fill("#inputPassword6", "pikapika1");
      //await page.fill("#u_uhD_123744", "This is a test message.");
    await page.click("#submit-btn");
    await page.waitForTimeout(2000);
    
  }
  await browser.close();
  });

  //await page.screenshot({ path: "file-demo.png" });
  //await browser.close();
