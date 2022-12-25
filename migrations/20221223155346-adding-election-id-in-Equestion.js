'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //adding the electionid column to questions
    await queryInterface.addColumn("EQuestions", "EID", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("EQuestions", {
      fields: ["EID"],
      type: "foreign key",
      references: { 
        table: "Elections", 
        field: "id"
       },
    });
  },

  async down (queryInterface, Sequelize) {
    //removing the electionid column from questions
    await queryInterface.removeColumn("EQuestions", "EID");
  }
};
