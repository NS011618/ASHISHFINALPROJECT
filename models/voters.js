'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voters.belongsTo(models.Election, {
        foreignKey: "EID",
      });
    }
    
    passwordreset(Password) {
      return this.update({ Password });
    }

    static async createVoter({ votername, Password, EID }) {
      return await this.create({
        votername,
        Password,
        EID,
        voted: false,
        values: [],
      });
    }

    static async CountVoters(EID) {
      return await this.count({
        where: {
          EID,
        },
      });
    }

    static async getVoters(EID) {
      return await this.findAll({
        where: {
          EID,
        },
        order: [["id", "ASC"]],
      });
    }

    static async getVoter(id) {
      return await this.findOne({
        where: {
          id,
        },
      });
    }

    static async deleteVoter(id) {
      return await this.destroy({
        where: {
          id,
        },
      });
    }

    static async markasvoted(id) {
      return await this.update(
        {
          Voted: true,
        },
        {
          where: {
            id: id,
          },
        }
      );
      
    }

    static async addvoterresp(id, values) {
        return await this.update(
        {
          values: values,
        },
        {
          where: {
            id: id,
          },
        });
      
    }
  }
  Voters.init({
    votername: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },     
    Password:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "voter",
    },
    Voted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }, 
     
    values: DataTypes.ARRAY(DataTypes.INTEGER),
  }, {
    sequelize,
    modelName: 'Voters',
  });
  return Voters;
};