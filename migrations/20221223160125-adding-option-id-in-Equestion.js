'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Choices", "QID", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Choices", {
      fields: ["QID"],
      type: "foreign key",
      references: {
        table: "EQuestions",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Choices", "QID");
  }
};
