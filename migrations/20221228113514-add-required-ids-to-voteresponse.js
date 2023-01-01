'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     //adding the election id to voteresponses table
    await queryInterface.addColumn("voteresponses", "EID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("voteresponses", {
      fields: ["EID"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id",
      },
    });
     //adding the voter id to voteresponses table
    await queryInterface.addColumn("voteresponses", "voterID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("voteresponses", {
      fields: ["voterID"],
      type: "foreign key",
      references: {
        table: "Voters",
        field: "id",
      },
    });

    //adding the question id to voteresponses table
    await queryInterface.addColumn("voteresponses", "QID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("voteresponses", {
      fields: ["QID"],
      type: "foreign key",
      references: {
        table: "EQuestions",
        field: "id",
      },
    });
   //adding the choice column to voteresponses table
    await queryInterface.addColumn("voteresponses", "choice", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("voteresponses", {
      fields: ["choice"],
      type: "foreign key",
      references: {
        table: "Choices",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    //removing the election id column from voteresponses table
    await queryInterface.removeColumn("voteresponses", "EID");
    //removing the voter id column from voteresponses table
    await queryInterface.removeColumn("voteresponses", "voterID");
    //removing the question id column from voteresponses table
    await queryInterface.removeColumn("voteresponses", "QID");
    //removing the choice column from voteresponses table
    await queryInterface.removeColumn("voteresponses", "choice");
  }
};
