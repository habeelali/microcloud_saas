import mysql from 'mysql2/promise';

export async function createConnection() {
  try {
    return await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw new Error('Failed to connect to database');
  }
}

export async function getPlans() {
  try {
    const conn = await createConnection();
    const [rows] = await conn.execute('SELECT * FROM plans WHERE availability = 1 ORDER BY price');
    await conn.end();
    return rows;
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
}

export async function getRegions() {
    try {
        const conn = await createConnection();
        const [rows] = await conn.execute('SELECT * FROM regions');
        await conn.end();
        return rows;
    } catch (error) {
        console.error('Error fetching regions: ', error);
        return [];
    }
}
