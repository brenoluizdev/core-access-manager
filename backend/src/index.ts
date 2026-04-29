import "dotenv/config";
import app from "./app";
import sequelize from "./config/database";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log("🚀 Iniciando servidor...");

    await sequelize.authenticate();
    console.log("✅ Database connected");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`🌐 Server running on http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar aplicação:", error);
    process.exit(1);
  }
}

startServer();
