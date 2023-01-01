'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EQuestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      EQuestion.belongsTo(models.Election, {
        foreignKey: "EID",
      });
      EQuestion.hasMany(models.Choices, {
        foreignKey: "QID",
      });
      EQuestion.hasMany(models.voteresponse, {
        foreignKey: "QID",
      });
    }

    static async CountQuestions(EID) {
      return await this.count({
        where: {
          EID,
        },
      });
    }

    static updateQuestion({ QuestionName, Description, id }) {
      return this.update(
        {
          QuestionName,
          Description,
        },
        {
          returning: true,
          where: {
            id,
          },
        }
      );
    }

    static addQuestion({QuestionName, Description, EID }) {
      return this.create({
        QuestionName,
        Description,
        EID,
      });
    }

    static async GetQuestion(id) {
      return await this.findOne({
        where: {
          id,
        },
      });
    }

    static deleteQuestion(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static async GetQuestions(EID) {
      return await this.findAll({
        where: {
          EID,
        },
        order: [["id", "ASC"]],
      });
    }
  }
  EQuestion.init({
    QuestionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EQuestion',
  });
  return EQuestion;
};