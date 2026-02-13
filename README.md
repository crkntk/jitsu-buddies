# JITSU BUDDIES
Website Hosted in Render hosting service. Using a Docker image.

Websit URL: https://jitsu-buddies.onrender.com/

Postgres Database hosted in Aiven service

Basic functionality works for going to the main page for general information creating users with prefrences for training. You can log in and when you click on
search a modal form pops up so you can change the parameters by which to search for partners. The default parameters for search are the users preferences.
Once partners are found the map zooms out to show all the user icons for the users found along with their belt colors. 
User persistence is implemented using sessions in the back end and can be cleared by signing out. 
Main takes to to the main jitus buddies page and home takes you to your home page if you are logged in for the current session.
The nav bar changes on wether the user is signed in or not.
Any other functionality like updated preferences and setting meet ups among users is still a working progress. A chat feature for quests and meetups is also being
implemented.

Signing in credentials for basic functionlity of the website can be used and are

email: John1@gmail.com
username: CoolBelt1
password: pikapika1

Disclaimer: This is for portfolio and prototyping purposes only. The render service goes into downtime when there are no requests for 15 minutes. 
  It may take some time for the services to come up again when recieve a request after 15 minutes. The free service for render is being used.
  The limit to the amount of users that can be created is 10 minus the 4 default ones located in Imperial Valley. So currently a person can create up to 6 new users.
  This users will be delted at the end of the week keeping only the 4 default ones.

This website is to give users the ability to find jujitsu partners in their current area based on their prefrences
In the front end we use JQUERY and some ajax calls to the back end
in the back end we use node.js and API calls to Location API service to get locations based on IP addresses. We can also find locations using only the address given by user.
We use Leaflet in order to show the locations of the found partners on the map
Feature currentlya vailable is the search for partners which shows a predifined amount of users on the map
The icons have informations on the users.
In the future a good decision algorithm will be implemented

click sign in in the home page without any input data.
currently working on the sign up with preferences page as well
We have some predefined data in index.js

Currently Postgres database is hosted in Aiven service. It can also be ran locally with the schema available upon request.
Still working on changing some things for hosting.
This currently works to add users sign in and find users in a 10 km distance but working on addimg them based on prefrences.
Playwrite scripts were added to automate the signing and population of database

#TO RUN LOCALLY
npm run dev

#TO RUN USING DOCKER
npx kill-port 3000
docker compose build --no-cache
docker compose up --force-recreate



