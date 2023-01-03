const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    Email: username,
    Password: password,
    _csrf: csrfToken,
  });
};

describe("Online voting application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/admin").send({
      FirstName: "nani",
      LastName: "golla",
      Email: "test@gmail.com",
      Password: "ashish",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign in", async () => {
    const agent = request.agent(server);
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
    await login(agent, "test@gmail.com", "ashish");
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
  });

  test("Sign out", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });

  test("create a new election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");
    const res = await agent.get("/elections/new");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "vote",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Adding a question to election ballot", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test2",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    let response = await agent
      .post(`/elections/${newelection.id}/questions/create`)
      .send({
        QuestionName: "who is cr",
        Description: "choose from option",
        _csrf: csrfToken,
      });
    expect(response.statusCode).toBe(302);
  });

  test("Deleting a question from the election ballot", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test3",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const totalelection = parsedGroupedElectionsResponse.elections.length;
    const newelection =
      parsedGroupedElectionsResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who  is   cr",
      Description: "choose from option 1",
      _csrf: csrfToken,
    });

    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who is cr2",
      Description: "choose from option 2",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    res = await agent.get(`/elections/${newelection.id}/questions`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(`/elections/${newelection.id}/questions`);
    csrfToken = extractCsrfToken(res);

    const deleteResponse2 = await agent
      .delete(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });

  test("updating a question based on the id", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test4",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const totalelection = parsedGroupedElectionsResponse.elections.length;
    const newelection =
      parsedGroupedElectionsResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who  is   cr",
      Description: "choose from option 1",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}/edit`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent.put(`/elections/${newelection.id}/questions/${newquestion.id}/edit`).send({
      _csrf: csrfToken,
      QuestionName: "123",
      Description: "456",
    });
    expect(res.statusCode).toBe(200);
  });

  test("adding a options to question", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test5",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who is cr",
      Description: "choose from option",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });
    expect(res.statusCode).toBe(302);
  });

  test("deleting option from the question based on question id and election id", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test6",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const totalelection = parsedGroupedElectionsResponse.elections.length;
    const newelection =
      parsedGroupedElectionsResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who  is   cr",
      Description: "choose from option 1",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    const groupedOptionsResponse = await agent
      .get(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .set("Accept", "application/json");
    const parsedOptionsGroupedResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    const optionsCount = parsedOptionsGroupedResponse.options.length;
    const newoption = parsedOptionsGroupedResponse.options[optionsCount - 1];

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${newelection.id}/questions/${newquestion.id}/options/${newoption.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/elections/${newelection.id}/questions/${newquestion.id}/options/${newoption.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });

  test("updating a option based on the election, question id", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test7",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const totalelection = parsedGroupedElectionsResponse.elections.length;
    const newelection =
      parsedGroupedElectionsResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who  is   cr",
      Description: "choose from option 1",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    const groupedOptionsResponse = await agent
      .get(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .set("Accept", "application/json");
    const parsedOptionsGroupedResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    const optionsCount = parsedOptionsGroupedResponse.options.length;
    const newoption = parsedOptionsGroupedResponse.options[optionsCount - 1];

    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}/options/${newoption.id}/edit`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent.put(`/elections/${newelection.id}/questions/${newquestion.id}/options/${newoption.id}/edit`).send({
      _csrf: csrfToken,
      option: "testoption",
    });
    expect(res.statusCode).toBe(200);
  });

  test("Adding a voter to the election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test8",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/voters/create`)
      .send({
        votername: "nani",
        Password: "12345678",
        _csrf: csrfToken,
      });
    expect(res.statusCode).toBe(302);
  });

  test("Deleting a voter from the election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "test9",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

     //add a voter
     res = await agent.get(`/elections/${newelection.id}/voters/create`);
     csrfToken = extractCsrfToken(res);
     res = await agent
       .post(`/elections/${newelection.id}/voters/create`)
       .send({
         votername: "nani1",
         Password: "12345678",
         _csrf: csrfToken,
       });
    //add a voter
    res = await agent.get(`/elections/${newelection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/voters/create`)
      .send({
        votername: "nani2",
        Password: "12345678",
        _csrf: csrfToken,
      });

    const groupedVotersResponse = await agent
      .get(`/elections/${newelection.id}/voters`)
      .set("Accept", "application/json");
    const parsedVotersGroupedResponse = JSON.parse(groupedVotersResponse.text);
    const totalvoters = parsedVotersGroupedResponse.voters.length;
    const latestVoter = parsedVotersGroupedResponse.voters[totalvoters - 1];

    res = await agent.get(`/elections/${newelection.id}/voters/`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${newelection.id}/voters/${latestVoter.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(`/elections/${newelection.id}/voters/`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/elections/${newelection.id}/voters/${latestVoter.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });

  test("check the election then Launch election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "vote0",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

    res = await agent.get(`/elections/${newelection.id}/checkbeforelaunch`);
    csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(302);
  });

  test("Launching the election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "vote1",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who is cr",
      Description: "choose from option",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    //adding options 1 to the question
    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    //adding  a voter
    res = await agent.get(`/elections/${newelection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/voters/create`)
      .send({
        votername: "nani8",
        Password: "12345678",
        _csrf: csrfToken,
      });

    //adding options 2 to the question
    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    res = await agent.get(`/elections/${newelection.id}/checkbeforelaunch`);
    csrfToken = extractCsrfToken(res);

    //election is not launched by default
    expect(newelection.launched).toBe(false);
    res = await agent.put(`/elections/${newelection.id}/launch`).send({
      _csrf: csrfToken,
    });
    const Electionres = JSON.parse(res.text);
    expect(Electionres[1][0].launched).toBe(true);
  });

  test("Cannot edit questions after launching election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "select cr",
      customurl: "vote2",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const totalelection = parsedGroupedResponse.elections.length;
    const newelection = parsedGroupedResponse.elections[totalelection - 1];

    //adding question to elections
    res = await agent.get(`/elections/${newelection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${newelection.id}/questions/create`).send({
      QuestionName: "who is cr",
      Description: "choose from option",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${newelection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const countquestion = parsedQuestionsGroupedResponse.questions.length;
    const newquestion =
      parsedQuestionsGroupedResponse.questions[countquestion - 1];

    //adding options 1 to the question
    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    //adding options 2 to the question
    res = await agent.get(
      `/elections/${newelection.id}/questions/${newquestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/questions/${newquestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    //adding a voter
    res = await agent.get(`/elections/${newelection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${newelection.id}/voters/create`)
      .send({
        votername: "nani2",
        Password: "12345678",
        _csrf: csrfToken,
      });

    //You can edit questions while election is running
    res = await agent.get(`/elections/${newelection.id}/questions`);
    expect(res.statusCode).toBe(200);

    res = await agent.get(`/elections/${newelection.id}/checkbeforelaunch`);
    csrfToken = extractCsrfToken(res);
    res = await agent.put(`/elections/${newelection.id}/launch`).send({
      _csrf: csrfToken,
    });
    const Electionres = JSON.parse(res.text);
    expect(Electionres[1][0].launched).toBe(true);

    //cannot edit questions while election is launched
    res = await agent.get(`/elections/${newelection.id}/questions`);
    expect(res.statusCode).toBe(302);
  });
});
