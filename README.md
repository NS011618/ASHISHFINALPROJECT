# Hello Guys ,This is Ashish

**The Project i have done is **
# Online Voting System
This is a Online Voting Platform built using Node.js ,Postgresql,Tailwincss,Express.js which allows election administrators to sign up and 
create multiple elections. You can create ballots of multiple questions,add options to question,add voters for particular election,reset 
password feature is available for both election admin and voter,create a custom public URL for the election... etc..



[![MIT License](https://img.shields.io/badge/Platform-Deployed-green.svg)](https://choosealicense.com/licenses/mit/)

Deployed App link: 

https://final-project-wd-11.onrender.com

## Demo link


## Features


- Fully Responsive platform
- reset password feature for both admin and voter
- Uses CSRF tokens to prevent attacks 
- Admin will be able to signup,Login
- Admin can create the elections
- Admin can edit election and if election is launched and ended admin cannot edit election
- Admin can create a ballot of questions in an election
- Admin can add options and delete options for a question in the election
- Admin can delete the elections,questions,voters
- Admin can register voters
- Admin can launch election
- Admin can Preview results while election is running
- Elections administrator can set custom path to election
- Voter can login to voting page and submit his response
- Ending the election
- We cannot delete election after ending election
- We cannot edit questions after launching election
- We cannot edit questions,voters,options etc... after ending an election




## Technologies used to build the website

**Client:** EJS(Embedded Javascript Templates), TailwindCSS,CSS

**Server:** Node.js, Express.js

**Database:** Postgres


## Installation

Don't forget to create the databse with corresponding name as mentioned in `config.json`



Go to the project directory

```bash
  cd ASHISHFINALPROJECT
```

Install dependencies

```bash
  npm install
```
or
```bash
  npm i
```
start server to run the website in localhost

```bash
  npm start
```
## To create database

To create database,run the following command

```bash
npx sequelize-cli db:create
```
## To migrate database

To migrate database,run the following command

```bash
npx sequelize-cli db:migrate
```

## Running Tests

To run tests,run the following command

```bash
  npm test
```
