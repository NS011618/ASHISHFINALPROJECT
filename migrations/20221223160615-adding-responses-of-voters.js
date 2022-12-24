'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Voters", "values", {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.INTEGER),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Voters", "values");
  }
};
