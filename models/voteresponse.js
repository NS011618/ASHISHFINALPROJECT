'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class voteresponse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static addchoice({ EID, voterID, QID, choice }) {
      return this.create({
        EID,
        voterID,
        QID,
        choice,
      });
    }
    static associate(models) {
      // define association here
      voteresponse.belongsTo(models.Voters, {
        foreignKey: "voterID",
      });
      voteresponse.belongsTo(models.Election, {
        foreignKey: "EID",
      });
      voteresponse.belongsTo(models.EQuestion, {
        foreignKey: "QID",
      });
      voteresponse.belongsTo(models.Choices, {
        foreignKey: "choice",
      });
    }
  }
  voteresponse.init({
    
  }, {
    sequelize,
    modelName: 'voteresponse',
  });
  return voteresponse;
};