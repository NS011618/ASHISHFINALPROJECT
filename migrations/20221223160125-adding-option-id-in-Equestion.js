'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //adding the questionid column to choices
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
    //removing the questionid column from choices
    await queryInterface.removeColumn("Choices", "QID");
  }
};
