'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voteresponses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static addchoice({ VID,EID, QID, voterchoice }) {
      return this.create({        
        VID,
        EID,
        QID,
        voterchoice,
      });
    }

    static async totalvoted({ EID, voterchoice, QID }) {
      return await this.count({
        where: {
          EID,
          voterchoice,
          QID,
        },
      });
    }

    static async getresponse(EID) {
      return await this.findAll({
        where: {
          EID,
        },
      });
    }    

    static associate(models) {
      // define association here
      Voteresponses.belongsTo(models.Voters, {
        foreignKey: "VID",
      });
      Voteresponses.belongsTo(models.Election, {
        foreignKey: "EID",
      });
      Voteresponses.belongsTo(models.EQuestion, {
        foreignKey: "QID",
      });
      Voteresponses.belongsTo(models.Choices, {
        foreignKey: "voterchoice",
      });
    }
  }
  Voteresponses.init({
    
  }, {
    sequelize,
    modelName: 'Voteresponses',
  });
  return Voteresponses;
};