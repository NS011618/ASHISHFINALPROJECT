'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //adding the electionid column to voters
    await queryInterface.addColumn("Voters", "EID", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Voters", {
      fields: ["EID"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    //removing the electionid column from voters
    await queryInterface.removeColumn("Voters", "EID");
  }
};
