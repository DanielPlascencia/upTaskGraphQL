const mongoose = require("mongoose");
require("dotenv").config({ path: "variables.env" });

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO);

    console.log("DB CONECTADA");
  } catch (error) {
    console.log(`Hubo un error: ${error.message}`);
    process.exit(1); // Detener la app
  }
};

module.exports = conectarDB;
