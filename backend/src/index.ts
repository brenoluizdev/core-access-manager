import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3000;

console.log("Iniciando servidor...");

if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error('Variáveis de ambiente do banco não definidas');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});