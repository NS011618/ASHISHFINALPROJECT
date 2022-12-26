'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Election.belongsTo(models.Electionadmin, {
        foreignKey: "AID",
      });
      Election.hasMany(models.EQuestion, {
        foreignKey: "EID",
      });
      Election.hasMany(models.Voters, {
        foreignKey: "EID",
      });
    }
    static createElection({ ElectionName, AID,customurl }) {
      return this.create({
          ElectionName,        
          AID,
          customurl
      });
    }
    
   
    static GetElections(AID) {
      return this.findAll({
        where: {
          AID,
        },
        order: [["id", "ASC"]],
      });
    }
  
    static GetElection(id) {
      return this.findOne({
        where: {
          id,
        },
      });
    }
      
    static deleteElection(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static GetUrl(customurl) {
      return this.findOne({
        where: {
          customurl,
        },
      });
    }
  
    static Launchelection(id) {
      return this.update(
        {
          launched: true,
        },
        {
          returning: true,
          where: {
            id,
          },
        }
      );
    }
      
    static EndElection(id) {
      return this.update(
        { stopped: true },
        {
          returning: true,
          where: {
            id: id,
          },
        }
      );
    }
    
  }
  Election.init({
    ElectionName:{
      type: DataTypes.STRING,
      allowNull:false
    },
    customurl:{
      type: DataTypes.STRING,
      allowNull:false,
      unique:true
    },
    launched: {
      type:DataTypes.BOOLEAN,
      defaultValue:false
    },
    stopped: {
      type:DataTypes.BOOLEAN,
      defaultValue:false
    }
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};