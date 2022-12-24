'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Electionadmin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Electionadmin.hasMany(models.Election, {
        foreignKey: "AID",
      });
    }
    
    passwordreset(Password) {
      return this.update({ Password });
    }

    static addAdmin({ FirstName, LastName, Email, Password }) {
      return this.create({
        FirstName,
        LastName,
        Email,
        Password,
      });
    }
  }
  Electionadmin.init({
    FirstName: DataTypes.STRING,
    LastName: DataTypes.STRING,
    Email:  {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "admin",
    },
    Password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Electionadmin',
  });
  return Electionadmin;
};