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
      ElectionName: "Test election",
      customurl: "test1",
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
      ElectionName: "Test election",
      customurl: "test2",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    let response = await agent
      .post(`/elections/${latestElection.id}/questions/create`)
      .send({
        QuestionName: "Test question",
        Description: "Test description",
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
      ElectionName: "Test election",
      customurl: "test3",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question 1",
      Description: "Test description 1",
      _csrf: csrfToken,
    });

    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question 2",
      Description: "Test description 2",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(`/elections/${latestElection.id}/questions`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(`/elections/${latestElection.id}/questions`);
    csrfToken = extractCsrfToken(res);

    const deleteResponse2 = await agent
      .delete(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
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
      ElectionName: "Test election",
      customurl: "test4",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question 1",
      Description: "Test description 1",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}/edit`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent.put(`/questions/${latestQuestion.id}/edit`).send({
      _csrf: csrfToken,
      QuestionName: "123",
      Description: "456",
    });
    expect(res.statusCode).toBe(200);
  });

  test("Adding a option", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "Test election",
      customurl: "test5",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question",
      Description: "Test description",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
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
      ElectionName: "Test election",
      customurl: "test6",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question 1",
      Description: "Test description 1",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    const groupedOptionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .set("Accept", "application/json");
    const parsedOptionsGroupedResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    const optionsCount = parsedOptionsGroupedResponse.options.length;
    const latestOption = parsedOptionsGroupedResponse.options[optionsCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/options/${latestOption.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/options/${latestOption.id}`)
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
      ElectionName: "Test election",
      customurl: "test7",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question 1",
      Description: "Test description 1",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    const groupedOptionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .set("Accept", "application/json");
    const parsedOptionsGroupedResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    const optionsCount = parsedOptionsGroupedResponse.options.length;
    const latestOption = parsedOptionsGroupedResponse.options[optionsCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}/options/${latestOption.id}/edit`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent.put(`/options/${latestOption.id}/edit`).send({
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
      ElectionName: "Test election",
      customurl: "test8",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/voters/create`)
      .send({
        votername: "Test voter",
        Password: "Test password",
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
      ElectionName: "Test election",
      customurl: "test9",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/voters/create`)
      .send({
        votername: "Test voter1",
        Password: "Test password",
        _csrf: csrfToken,
      });

    const groupedVotersResponse = await agent
      .get(`/elections/${latestElection.id}/voters`)
      .set("Accept", "application/json");
    const parsedVotersGroupedResponse = JSON.parse(groupedVotersResponse.text);
    const votersCount = parsedVotersGroupedResponse.voters.length;
    const latestVoter = parsedVotersGroupedResponse.voters[votersCount - 1];

    res = await agent.get(`/elections/${latestElection.id}/voters/`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${latestElection.id}/voters/${latestVoter.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(`/elections/${latestElection.id}/voters/`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/elections/${latestElection.id}/voters/${latestVoter.id}`)
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
      ElectionName: "Test election",
      customurl: "test10",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    res = await agent.get(`/elections/${latestElection.id}/checkbeforelaunch`);
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
      ElectionName: "Test election",
      customurl: "test11",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question",
      Description: "Test description",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    //adding options 1 to the question
    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    //adding options 2 to the question
    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    res = await agent.get(`/elections/${latestElection.id}/checkbeforelaunch`);
    csrfToken = extractCsrfToken(res);

    //election is not launched by default
    expect(latestElection.launched).toBe(false);
    res = await agent.put(`/elections/${latestElection.id}/launch`).send({
      _csrf: csrfToken,
    });
    const launchedElectionRes = JSON.parse(res.text);
    expect(launchedElectionRes[1][0].launched).toBe(true);
  });

  test("Cannot edit questions after launching election", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "ashish");

    //creating a new election
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      ElectionName: "Test election",
      customurl: "test12",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //adding question to elections
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      QuestionName: "Test question",
      Description: "Test description",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    //adding options 1 to the question
    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    //adding options 2 to the question
    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });

    //You can edit questions while election is running
    res = await agent.get(`/elections/${latestElection.id}/questions`);
    expect(res.statusCode).toBe(200);

    res = await agent.get(`/elections/${latestElection.id}/checkbeforelaunch`);
    csrfToken = extractCsrfToken(res);
    res = await agent.put(`/elections/${latestElection.id}/launch`).send({
      _csrf: csrfToken,
    });
    const launchedElectionRes = JSON.parse(res.text);
    expect(launchedElectionRes[1][0].launched).toBe(true);

    //cannot edit questions while election is launched
    res = await agent.get(`/elections/${latestElection.id}/questions`);
    expect(res.statusCode).toBe(302);
  });
});
