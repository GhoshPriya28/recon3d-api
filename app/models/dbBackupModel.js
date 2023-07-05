module.exports = (sequelize, Sequelize) => {
    const DbBackupModel = sequelize.define("db_backups", {
        // id: {
        //     type: Sequelize.INTEGER,
        //     allowNull: false,
        //     primaryKey: true,
        //     autoIncrement: true
        // },
        file_name: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        file_url: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    });
    DbBackupModel.removeAttribute('id');
    return DbBackupModel;
};