'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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
    await queryInterface.removeColumn("EQuestions", "EID");
  }
};
