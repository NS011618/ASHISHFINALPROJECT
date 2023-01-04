'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Choices extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Choices.belongsTo(models.EQuestion, {
        foreignKey: "QID",
      });
      Choices.hasMany(models.Voteresponses, {
        foreignKey: "voterchoice",
      });
    }
    static Getoptions(QID) {
      return this.findAll({
        where: {
          QID,
        },
        order: [["id", "ASC"]],
      });
    }

    static Getoption(id) {
      return this.findOne({
        where: {
          id,
        },
      });
    }

    static addoption({ option, QID }) {
      return this.create({
        option,
        QID,
      });
    }

    static editoption({ option, id }) {
      return this.update(
        {
          option,
        },
        {
          where: {
            id,
          },
        }
      );
    }

    static removeoption(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
  }
  Choices.init({
    option: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Choices',
  });
  return Choices;
};