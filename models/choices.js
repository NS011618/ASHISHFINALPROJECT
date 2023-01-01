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
      Choices.hasMany(models.voteresponse, {
        foreignKey: "choice",
      });
    }
    static getOptions(QID) {
      return this.findAll({
        where: {
          QID,
        },
        order: [["id", "ASC"]],
      });
    }

    static getOption(id) {
      return this.findOne({
        where: {
          id,
        },
      });
    }

    static addOption({ option, QID }) {
      return this.create({
        option,
        QID,
      });
    }

    static updateOption({ option, id }) {
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

    static deleteOption(id) {
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