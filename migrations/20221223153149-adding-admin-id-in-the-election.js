'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //adding the adminid column to questions
    await queryInterface.addColumn("Elections", "AID", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Elections", {
      fields: ["AID"],
      type: "foreign key",
      references: {
        table: "Electionadmins",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    //removing the adminid column from elections
    await queryInterface.removeColumn("Election", "AID");
  }
};
