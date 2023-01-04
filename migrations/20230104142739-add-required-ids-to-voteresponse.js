'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
 //adding the voter id to Voteresponses table
    await queryInterface.addColumn("Voteresponses", "VID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Voteresponses", {
      fields: ["VID"],
      type: "foreign key",
      references: {
        table: "Voters",
        field: "id",
      },
    });
    
    //adding the election id to Voteresponses table
    await queryInterface.addColumn("Voteresponses", "EID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Voteresponses", {
      fields: ["EID"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id",
      },
    });
    

    //adding the question id to Voteresponses table
    await queryInterface.addColumn("Voteresponses", "QID", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Voteresponses", {
      fields: ["QID"],
      type: "foreign key",
      references: {
        table: "EQuestions",
        field: "id",
      },
    });
   //adding the choice column to Voteresponses table
    await queryInterface.addColumn("Voteresponses", "voterchoice", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Voteresponses", {
      fields: ["voterchoice"],
      type: "foreign key",
      references: {
        table: "Choices",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    //removing the voter id column from Voteresponses table
    await queryInterface.removeColumn("Voteresponses", "VID");
    //removing the election id column from Voteresponses table
    await queryInterface.removeColumn("Voteresponses", "EID");    
    //removing the question id column from Voteresponses table
    await queryInterface.removeColumn("Voteresponses", "QID");
    //removing the choice column from Voteresponses table
    await queryInterface.removeColumn("Voteresponses", "voterchoice");
  }
};
