/**
 * seed.js — Crea el usuario admin inicial.
 * Uso: node seed.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const db     = require('./src/db/connection');

async function seed() {
  console.log('🌱 Ejecutando seed...');
  try {
    const hash = await bcrypt.hash('admin123', 10);

    // Upsert admin
    await db.query(`
      INSERT INTO users (nombre, email, password, role)
      VALUES ('Administrador', 'admin@eventosport.com', ?, 'admin')
      ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin'
    `, [hash]);
    console.log('✅ Admin creado → admin@eventosport.com / admin123');

    // Evento de ejemplo
    const [existing] = await db.query("SELECT id FROM events WHERE titulo = 'Torneo de Fútbol Primavera'");
    if (!existing.length) {
      const [[admin]] = await db.query("SELECT id FROM users WHERE email = 'admin@eventosport.com'");
      await db.query(`
        INSERT INTO events (titulo, descripcion, tipo, fecha, lugar, max_equipos, creator_id)
        VALUES (?, ?, 'futbol', DATE_ADD(NOW(), INTERVAL 30 DAY), 'Polideportivo Central', 20, ?)
      `, [
        'Torneo de Fútbol Primavera',
        'Torneo de fútbol sala con fase de grupos y eliminatorias. Se disputarán partidos de 10 minutos. ¡Inscríbete con tu equipo!',
        admin.id,
      ]);
      console.log('✅ Evento de ejemplo creado');
    }

    console.log('🎉 Seed completado');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  }
}

seed();
