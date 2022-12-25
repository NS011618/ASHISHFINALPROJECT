'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //adding the responses column to voters
    await queryInterface.addColumn("Voters", "values", {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.INTEGER),
    });
  },

  async down (queryInterface, Sequelize) {
    //removing the responses column from voters
    await queryInterface.removeColumn("Voters", "values");
  }
};
