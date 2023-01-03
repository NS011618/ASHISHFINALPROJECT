const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

//importing all the required models
const { Electionadmin, Election, EQuestion, Choices, Voters,voteresponse } = require("./models");

const bcrypt = require("bcrypt");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");

const saltRounds = 10;

app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Some secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-2837428907583420",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});
app.use(passport.initialize());
app.use(passport.session());

//creating a passport session for admin
passport.use(
    "userlocal",
    new LocalStrategy(
      {
        usernameField: "Email",
        passwordField: "Password",
      },
      (username, password, done) => {
        Electionadmin.findOne({ where: { Email: username } })
        .then(async (user) => {
            const result = await bcrypt.compare(password, user.Password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Enter a valid password" });
            }
        })
        .catch((error) => {
            console.log(error);
            return done(null, false, {
              message: "Please signup if you are a new User",
            });
        });
        }
    )
);
  
//creating a passport session for voter
passport.use(
    "voterlocal",
    new LocalStrategy(
      {
        usernameField: "votername",
        passwordField: "Password",
        passReqToCallback: true,        
      },
      async (request, username, password, done) => {
        const election = await Election.GetUrl(request.params.customurl);
        Voters.findOne({
          where: { votername: username ,EID:election.id },
        })
        .then(async (user) => {
            const result = await bcrypt.compare(password, user.Password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Enter a valid password" });
            }
        })
        .catch(() => {            
            return done(null, false, {
              message: "This voter is not registered",
            });
        });
      }
    )
);
  
passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user.role });
});
  
passport.deserializeUser((id, done) => {
  if (id.role === "admin") {
    Electionadmin.findByPk(id.id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  } else if (id.role === "voter") {
    Voters.findByPk(id.id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  }
});




//setting up viewengine as ejs and using dirname
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

//The Online Voting System Code starts Now

//Home Page
app.get("/", (request, response) => {
  if (request.user) {
    console.log(request.user);
    if (request.user.role === "admin") {
      return response.redirect("/elections");
    } else if (request.user.role === "voter") {
      request.logout((err) => {
        if (err) {
          return response.json(err);
        }
        response.redirect("/");
      });
    }
  } else {
      response.render("index", {
        title: "voting system",
        csrfToken: request.csrfToken(),
      });
    }
});

//Elections Home Page
//Home Page for Elections
app.get(
    "/elections",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      if (request.user.role === "admin") {
      let Electionuser = request.user.FirstName + " " + request.user.LastName;
      try {
        const elections = await Election.GetElections(request.user.id);
        if (request.accepts("html")) {
          response.render("elections", {
            title: "Online Voting System",
            csrfToken: request.csrfToken(),
            Electionuser: Electionuser,
            elections,
          });
        } else {
          return response.json({
            elections,            
          });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);
  
//Signup page for admin
app.get("/signup", (request, response) => {
    response.render("signup", {
      title: "Create Admin Account",
      csrfToken: request.csrfToken(),
    });
});
  
//Creating the Election admin account
app.post("/admin", async (request, response) => {
  if (!request.body.FirstName) {
    request.flash("error", "Enter The First Name");
    return response.redirect("/signup");
  }
  if (!request.body.Email) {
    request.flash("error", "Enter The Email");
    return response.redirect("/signup");
  }
  if (!request.body.Password) {
    request.flash("error", "Enter The Password");
    return response.redirect("/signup");
  }
  if (request.body.Password < 5) {
    request.flash("error", "Please choose length of password atleast 5 characters");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.Password, saltRounds);
  try {
    const user = await Electionadmin.addAdmin({
      FirstName: request.body.FirstName,
      LastName: request.body.LastName,
      Email: request.body.Email,
      Password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/");
      } else {
        response.redirect("/elections");
      }
    });
  } catch (error) {
    request.flash("error", "email is already in use");
    return response.redirect("/signup");
  }
});
 
//login page for admin
app.get("/login", (request, response) => {
  if (request.user) {
    return response.redirect("/elections");
  }
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});


//voter login page
app.get("/election/:customurl/voter", async (request, response) => {
  try {
    if (request.user) {
      return response.redirect(`/election/${request.params.customurl}`);
    }
    const election = Election.GetUrl(request.params.customurl);
    if (election.launched && !election.stopped) {
      return response.render("voterlogin", {
        title: "Voter login",
        customurl: request.params.customurl,
        EID: election.id,
        csrfToken: request.csrfToken(),
      });
    } else {
      request.flash("Election Ended");
      return response.render("result");
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//login as admin
app.post(
  "/session",
  passport.authenticate("userlocal", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/elections");
  }
);

//login voter
app.post(
  "/election/:customurl/voter",
  passport.authenticate("voterlocal", {
    failureFlash: true,
    failureRedirect: "back",
  }),
  async (request, response) => {
    return response.redirect(`/election/${request.params.customurl}`);
  }
);

//signout as admin
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

//password reset page
app.get(
  "/reset-password",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    if (request.user.role === "admin") {
      response.render("resetadminpass", {
        title: "reset admin password",
        csrfToken: request.csrfToken(),
      });
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//reset user password
app.post(
  "/reset-password",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      if (!request.body.old_password) {
        request.flash("error", "Please enter your old password");
        return response.redirect("/reset-password");
      }
      if (!request.body.new_password) {
        request.flash("error", "Please enter a new password");
        return response.redirect("/reset-password");
      }
      if (request.body.new_password.length < 5) {
        request.flash("error", "Password length should be atleast 8");
        return response.redirect("/reset-password");
      }
      const hashedNewPwd = await bcrypt.hash(
        request.body.new_password,
        saltRounds
      );
      const result = await bcrypt.compare(
        request.body.old_password,
        request.user.Password
      );
      if (result) {
        try {
          Electionadmin.findOne({ where: { Email: request.user.Email } }).then(
            (user) => {
              user.passwordreset(hashedNewPwd);
            }
          );
          request.flash("success", "password changed successfully");
          return response.redirect("/elections");
        } catch (error) {
          console.log(error);
          return response.status(422).json(error);
        }
      } else {
        request.flash("error", "old password did not match");
        return response.redirect("/reset-password");
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//creating a new election
app.get(
  "/elections/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      return response.render("Create-Election", {
        title: "Create-Election",
        csrfToken: request.csrfToken(),
      });
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }    
);

//posting the contents to elections page
app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      if (request.body.ElectionName.length < 5) {
        request.flash("error", "The length of the Electionname must be atleast 3");
        return response.redirect("/elections/new");
      }
      if (request.body.customurl.length < 3) {
        request.flash("error", "The length of the customurl must be atleast 3");
        return response.redirect("/elections/new");
      }
      if (
        request.body.customurl.includes(" ") ||
        request.body.customurl.includes("\t") ||
        request.body.customurl.includes("\n")
      ) {
        request.flash("error", "Please don't give space for custom url");
        return response.redirect("/elections/new");
      }
      try {
        await Election.createElection({        
          ElectionName: request.body.ElectionName,
          customurl: request.body.customurl,
          AID: request.user.id,
        });
        return response.redirect("/elections");
      } catch (error) {
        request.flash("error", "Email is already in used");
        return response.redirect("/elections/new");
      } 
    }else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);



//Manage Elections Home Page
app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.id);
        if (election.stopped) {
          return response.render("result");
        }
        const TotalQuestions = await EQuestion.CountQuestions(
          request.params.id
        );
        const TotalVoters = await Voters.CountVoters(request.params.id);
        return response.render("manageelection", {
          id: request.params.id,
          title: election.ElectionName,
          customurl: election.customurl,
          launched: election.launched,          
          TQ: TotalQuestions,
          NV: TotalVoters,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//Deleting the election
app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {    
    const election = await Election.findByPk(request.params.id);    
    if (election.launched) {
      return response.json("Election is running you cannot edit now");
    }
    if (election.stopped) {
      return response.json("Election ended");
    }    
    const questions = await EQuestion.findAll({
      where: { EID: request.params.id },
    });

    // deleting the  questions annd  options  in election
    questions.forEach(async (Question) => {
      const options = await Choices.findAll({
        where: { QID: Question.id },
      });
      options.forEach(async (option) => {
        await Choices.destroy({ where: { id: option.id } });
      });
      await EQuestion.destroy({ where: { id: Question.id } });
    });

    //deleting all voters from  the  election
    const voters = await Voters.findAll({
      where: { EID: request.params.id },
    });
    voters.forEach(async (voter) => {
      await Voters.destroy({ where: { id: voter.id } });
    });

    try {
      await Election.destroy({ where: { id: request.params.id } });
      return response.json({ ok: true });
    } catch (error) {
      console.log(error);
      response.send(error);
    }
  }
);

//Manage Questions Home page
app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.id);
        const questions = await EQuestion.GetQuestions(request.params.id);
        if (!election.launched && !election.stopped) {
          if (request.accepts("html")) {
            return response.render("Question-homepage", {
              title: election.ElectionName,
              id: request.params.id,
              questions: questions,
              csrfToken: request.csrfToken(),
            });
          } else {
            return response.json({
              questions,
            });
          }
        } else {
          if (election.stopped) {
            request.flash("error", "Election ended");
          } else if (election.launched) {
            request.flash("error", "Election is running");
          }
          return response.redirect(`/elections/${request.params.id}/`);
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);


//Adding the question for the Election
app.get(
  "/elections/:id/questions/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.id);
        if (!election.launched) {
          return response.render("Create-Question", {
            id: request.params.id,
            csrfToken: request.csrfToken(),
          });
        } else {
          if (election.stopped) {
            request.flash("error", "Election ended");
            return response.redirect(`/elections/${request.params.id}/`);
          }
          request.flash("error", "Cannot edit while election is running");
          return response.redirect(`/elections/${request.params.id}/`);
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//posting the question 
app.post(
  "/elections/:id/questions/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      if (request.body.QuestionName.length < 5) {
        request.flash("error", "question length should be atleast 5");
        return response.redirect(
          `/elections/${request.params.id}/questions/create`
        );
      }
      try {
        const election = await Election.GetElection(request.params.id);
        if (election.launched) {
          request.flash("error", "Election is running you cannot edit now");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        const question = await EQuestion.addQuestion({
         QuestionName: request.body.QuestionName,
          Description: request.body.Description,
          EID: request.params.id,
        });
        return response.redirect(
          `/elections/${request.params.id}/questions/${question.id}`
        );
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//Modifying the question
app.get(
  "/elections/:EID/questions/:QID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") { 
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.launched) {
          request.flash("error", "Election is running you cannot edit now");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        const question = await EQuestion.GetQuestion(request.params.QID);
        return response.render("edit-questions", {
          EID: request.params.EID,
          QID: request.params.QID,
          QuestionName: question.QuestionName,
          Description: question.Description,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//edit question
app.put(
  "/elections/:EID/questions/:QID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      if (request.body.QuestionName.length < 5) {
        request.flash("error", "Question length should be atleast 5");
        return response.json({
          error: "Question length should be atleast 5",
        });
      }
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.launched) {
          return response.json("Election is running you cannot edit now");
        }
        if (election.stopped) {
          return response.json("Election ended");
        }
        const editquestion = await EQuestion.updateQuestion({
          QuestionName: request.body.QuestionName,
          Description: request.body.Description,
          id: request.params.QID,
        });
        return response.json(editquestion);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//Deleting the question
app.delete(
  "/elections/:EID/questions/:QID",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.launched) {
          return response.json("Election is running you cannot edit now");
        }
        if (election.stopped) {
          return response.json("Election ended");
        }
        const TQ = await EQuestion.CountQuestions(
          request.params.EID
        );
        if (TQ > 1) {
        const res = await EQuestion.deleteQuestion(request.params.QID);
        return response.json({ success: res === 1 });
        } else {
          return response.json({ success: false });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);


//question page
app.get(
  "/elections/:id/questions/:QID",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") { 
      try {
        const question = await EQuestion.GetQuestion(request.params.QID);
        const options = await Choices.getOptions(request.params.QID);
        const election = await Election.GetElection(request.params.id);
        if (election.launched) {
          request.flash("error", "Election is running you cannot edit now");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        if (request.accepts("html")) {
          response.render("options-page", {
            title: question.QuestionName,
            description: question.Description,
            id: request.params.id,
            QID: request.params.QID,
            options,
            csrfToken: request.csrfToken(),
          });
        } else {
          return response.json({
            options,
          });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//Adding Options to Questions
app.post(
  "/elections/:id/questions/:QID",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      if (!request.body.option) {
        request.flash("error", "Please enter option");
        return response.redirect(
          `/elections/${request.params.id}/questions/${request.params.QID}`
        );
      }
      try {
        const election = await Election.GetElection(request.params.id);
        if (election.launched) {
          request.flash("error", "Election is running you cannot edit now");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        await Choices.addOption({
          option: request.body.option,
          QID: request.params.QID,
        });
        return response.redirect(
          `/elections/${request.params.id}/questions/${request.params.QID}`
        );
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//Deleting Options
app.delete(
  "/elections/:EID/questions/:QID/options/:optionID",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") { 
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.launched) {
          return response.json("Election is running you cannot edit now");
        }
        if (election.stopped) {
          return response.json("Election ended");
        }
        const res = await Choices.deleteOption(request.params.optionID);
        return response.json({ success: res === 1 });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
  
);

//Edit the options
app.get(
  "/elections/:EID/questions/:QID/options/:optionID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.launched) {
          request.flash("error", "Election is running you cannot edit now");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.id}/`);
        }
        const option = await Choices.getOption(request.params.optionID);
        return response.render("edit-options", {
          option: option.option,
          csrfToken: request.csrfToken(),
          EID: request.params.EID,
          QID: request.params.QID,
          optionID: request.params.optionID,
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//update the edited options for a question in the election
app.put(
  "/elections/:EID/questions/:QID/options/:optionID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      if (!request.body.option) {
        request.flash("error", "Please enter the option");
        return response.json({
          error: "Please enter the option",
        });
      }
      try {
        const election = await Election.GetElection(request.params.EID);
        if (request.user.id !== election.AID) {
          request.flash("error", "Invalid election ID");
          return response.redirect("/elections");
        }
        if (election.launched) {
          return response.json("Election is running you cannot edit now");
        }
        if (election.stopped) {
          return response.json("Election ended");
        }
        const updatedOption = await Choices.updateOption({
          id: request.params.optionID,
          option: request.body.option,
        });
        return response.json(updatedOption);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//Voters Page
app.get(
  "/elections/:EID/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const voters = await Voters.getVoters(request.params.EID);
        const election = await Election.GetElection(request.params.EID);
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.EID}/`);
        }        
        if (request.accepts("html")) {
          return response.render("voters", {
            title: election.ElectionName,
            id: request.params.EID,
            voters,
            csrfToken: request.csrfToken(),
          });
        } else {
          return response.json({
            voters,
          });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//Show Voter into voter Page
app.get(
  "/elections/:EID/voters/create",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    if (request.user.role === "admin") {  
      try {
        const election = Election.GetElection(request.params.EID);        
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.EID}/`);
        }
        response.render("Create-Voter", {
          title: "add voter to the election",
          EID: request.params.EID,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//Post the Voter to voter page
app.post(
  "/elections/:EID/voters/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {  
      if (!request.body.votername) {
        request.flash("error", "Please enter voterID");
        return response.redirect(
          `/elections/${request.params.EID}/voters/create`
        );
      }
      if (!request.body.Password) {
        request.flash("error", "Please enter correct password");
        return response.redirect(
          `/elections/${request.params.EID}/voters/create`
        );
      }
      if (request.body.Password.length < 5) {
        request.flash("error", "The length of password should be atleast 5");
        return response.redirect(
          `/elections/${request.params.EID}/voters/create`
        );
      }
      const hashedPwd = await bcrypt.hash(request.body.Password, saltRounds);
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.EID}/`);
        }
        await Voters.createVoter({
          votername: request.body.votername,
          Password: hashedPwd,
          EID: request.params.EID,
        });
        return response.redirect(
          `/elections/${request.params.EID}/voters`
        );
      } catch (error) {
        request.flash("error", "Voter id is already created");
        return response.redirect(
          `/elections/${request.params.EID}/voters/create`
        );
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//Delete the voter
app.delete(
  "/elections/:EID/voters/:voterID",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.stopped) {
          return response.json("Election ended");
        }
        const NV = await Voters.CountVoters(request.params.EID);
        if (NV > 1) {
          const voter = await Voters.getVoter(request.params.voterID);
          if (voter.Voted) {
            return response.json("Already voted,cannot delete now");
          }
          const res = await Voters.deleteVoter(request.params.voterID);
          return response.json({ success: res === 1 });
        } else {
          return response.json({ success: false });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//voter password reset page
app.get(
  "/elections/:EID/voters/:voterID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        const voter = await Voters.getVoter(request.params.voterID);
        if (voter.Voted) {
          request.flash("error", "Already vote submitted");
          return response.redirect(
            `/elections/${request.params.EID}/voters`
          );
        }
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.EID}/`);
        }
        response.render("resetpass-voter", {
          title: "reset voter password",
          EID: request.params.EID,
          voterID: request.params.voterID,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//reset voter password
app.post(
  "/elections/:EID/voters/:voterID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") { 
      if (!request.body.new_password) {
        request.flash("error", "Please Enter New Password");
        return response.redirect("/reset-password");
      }
      if (request.body.new_password.length < 5) {
        request.flash("error", "Password length should be atleast 5");
        return response.redirect("/reset-password");
      }
      const hashedNewPwd = await bcrypt.hash(
        request.body.new_password,
        saltRounds
      );
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.stopped) {
          request.flash("error", "Election ended");
         return response.redirect(`/elections/${request.params.EID}/`);
        }
        Voters.findOne({ where: { id: request.params.voterID } }).then(
          (user) => {
            user.passwordreset(hashedNewPwd);
          }
        );
        request.flash("success", "Successfully changed the password");
        return response.redirect(
          `/elections/${request.params.EID}/voters`
        );
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//election preview
app.get(
  "/elections/:EID/checkbeforelaunch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.stopped) {
          request.flash("error", "Election ended");
          return response.redirect(`/elections/${request.params.EID}/`);
        }
        const NV = await Voters.CountVoters(
          request.params.EID
        );
        const questions = await EQuestion.GetQuestions(request.params.EID);
        let options = [];
        for (let question in questions) {
          const question_options = await Choices.getOptions(
            questions[question].id
          );
          if (question_options.length < 2) {
            request.flash(
              "error",
              "There should be atleast 2 options for the question"
            );
            request.flash(
              "error",
              "Please add atleast two choices to the question "
            );
            return response.redirect(
              `/elections/${request.params.EID}/questions/${questions[question].id}`
            );
          }
          options.push(question_options);
        }

        if (questions.length < 1) {
          request.flash("error", "Please add atleast one question in the election ballot");
          return response.redirect(
            `/elections/${request.params.EID}/questions`
          );
        }

        if (NV < 1) {
          request.flash(
            "error",
            "please add atleast one voter to election"
          );
          return response.redirect(
            `/elections/${request.params.EID}/voters`
          );
        }

        return response.render("ChecktoLaunch", {
          title: election.ElectionName,
          EID: request.params.EID,
          questions,
          options,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
  
);

//launch an election
app.put(
  "/elections/:EID/launch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        if (election.stopped) {
          return response.json("Election ended");
        }
        const launchedElection = await Election.Launchelection(
          request.params.EID
        );
        return response.json(launchedElection);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  } 
);

//Ending a particular election
app.put(
  "/elections/:EID/end",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "admin") {
      try {
        const election = await Election.GetElection(request.params.EID);
        if (!election.launched) {
          return response.json("cannot end election since election not launched");
        }
        const endElection = await Election.EndElection(
          request.params.EID          
        );
        return response.json(endElection);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    } else if (request.user.role === "voter") {
      return response.redirect("/");
    }
  }
);

//going to voter page
app.get("/election/:customurl/", async (request, response) => {
  if (!request.user) {
    request.flash("error", "Please login before trying to Vote");
    return response.redirect(`/election/${request.params.customurl}/voter`);
  }
  if (request.user.Voted) {
    request.flash("error", "successfully voted");
    return response.redirect(`/election/${request.params.customurl}/results`);
  }
  try {
    const election = await Election.GetUrl(request.params.customurl);
    if (election.stopped) {
      return response.redirect(`/elections/${request.params.id}/result`);
    }
    if (request.user.role === "voter") {
      if (election.launched) {
        const questions = await EQuestion.GetQuestions(election.id);
        let options = [];
        for (let question in questions) {
          options.push(await Choices.getOptions(questions[question].id));
        }
        return response.render("votingpage", {
          title: election.ElectionName,
          EID: election.id,
          questions,
          options,
          customurl: request.params.customurl,
          csrfToken: request.csrfToken(),
        });
      } else {
        return response.render("error");
      }
    } else if (request.user.role === "admin") {
      request.flash("error", "sorry you cannot vote as admin");      
      return response.redirect(`/elections/${election.id}`);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/election/:customurl", async (request, response) => {
  if (!request.user) {
    request.flash("error", "Please login before trying to Vote");
    return response.redirect(`/election/${request.params.customurl}/voter`);
  }
  if (request.user.Voted) {
    request.flash("error", "successfully voted");
    return response.redirect(`/election/${request.params.customurl}/results`);
  }
  try {
    let election = await Election.GetUrl(request.params.customurl);
    if (election.stopped) {
      request.flash("error", "Election ended");
      return response.redirect(`/elections/${request.params.id}/results`);
    }
    let questions = await EQuestion.GetQuestions(election.id);
    for (let question of questions) {
      let qid = `q-${question.id}`;
      let choice = request.body[qid];
      await voteresponse.addchoice({
        voterID: request.user.id,
        EID: election.id,
        QID: question.id,
        choice: choice,
      });
      await Voters.markasvoted(request.user.id);
      return response.redirect(`/election/${request.params.customurl}/results`);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/election/:customurl/results", async (request, response) => {
  if (!request.user) {
    request.flash("error", "Please login before viewing results");
    return response.redirect(`/election/${request.params.customurl}/voter`);
  }
  try {
    const election = await Election.GetUrl(request.params.customurl);
    if (request.user.role === "voter") {
      if (!election.stopped) {
        return response.render("feedback");
      }
      if (!request.user.Voted) {
        request.flash("error", "You have not completed your vote");
        request.flash("error", "Please vote to view results");
        return response.redirect(`/election/${request.params.customurl}`);
      }
      return response.render("result");
    } else if (request.user.role === "admin") {      
      return response.render("result");
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.use(function (request, response) {
  response.status(404).render("error");
});
module.exports = app;

