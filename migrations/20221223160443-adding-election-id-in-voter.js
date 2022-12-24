'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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
    await queryInterface.removeColumn("Voters", "EID");
  }
};
