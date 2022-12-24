**Hello Guys ,This is Ashish**

**The Project i have done is **
# Online Voting System
This is a Online Voting Platform built using Node.js ,Postgresql,Tailwincss,Express.js which allows election administrators to sign up and create multiple elections. You can create ballots of multiple questions,add voters for particular election,reset password feature is available for both election admin and voter,create a custom public URL for the election... etc..



[![MIT License](https://img.shields.io/badge/Platform-Deployed-green.svg)](https://choosealicense.com/licenses/mit/)

Deployed App link: 

## Demo link


## Features

- Live result preview
- Fully Responsive platform
-reset password feature for both admin and voter
- Uses CSRF tokens to prevent attacks 
- Result automatically visible to voters when election ended

## Tech Stack

**Client:** EJS, TailwindCSS

**Server:** Node, Express

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
