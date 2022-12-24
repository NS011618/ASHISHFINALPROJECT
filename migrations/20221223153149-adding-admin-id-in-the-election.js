'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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
    await queryInterface.removeColumn("Election", "AID");
  }
};
