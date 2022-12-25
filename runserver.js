const app = require("./app");

const port = 3000

//running the server  at  port  number 3000 or any hosted website
app.listen(process.env.PORT || port, () => {
  console.log("The server started at port",port);
});