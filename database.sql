-- ============================================
-- EventoSport - Base de datos
-- ============================================

CREATE DATABASE IF NOT EXISTS eventosport
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eventosport;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  role         ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  tipo              ENUM('futbol','baloncesto','tenis') NOT NULL,
  fecha             DATETIME     NOT NULL,
  lugar             VARCHAR(200) NOT NULL,
  max_equipos       INT          NOT NULL DEFAULT 20,
  min_equipos       INT          NOT NULL DEFAULT 2,
  imagen            VARCHAR(255),
  estado            ENUM('abierto','en_curso','finalizado') NOT NULL DEFAULT 'abierto',
  creator_id        INT          NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  tipo        ENUM('futbol','baloncesto','tenis') NOT NULL,
  creator_id  INT          NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de inscripciones
-- team_id es nullable: NULL = inscripción individual, valor = equipo inscrito
CREATE TABLE IF NOT EXISTS registrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  evento_id  INT NOT NULL,
  team_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_event (user_id, evento_id),
  CONSTRAINT fk_reg_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_reg_evento FOREIGN KEY (evento_id) REFERENCES events(id)  ON DELETE CASCADE,
  CONSTRAINT fk_reg_team   FOREIGN KEY (team_id)   REFERENCES teams(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de partidos
-- score_team1/score_team2: goles (futbol), puntos (baloncesto) o sets (tenis)
CREATE TABLE IF NOT EXISTS matches (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  evento_id    INT NOT NULL,
  team1_id     INT NOT NULL,
  team2_id     INT NOT NULL,
  score_team1  INT NOT NULL DEFAULT 0,
  score_team2  INT NOT NULL DEFAULT 0,
  fecha        DATETIME,
  estado       ENUM('pendiente','jugado') NOT NULL DEFAULT 'pendiente',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_match_evento FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_match_team1  FOREIGN KEY (team1_id)  REFERENCES teams(id)  ON DELETE CASCADE,
  CONSTRAINT fk_match_team2  FOREIGN KEY (team2_id)  REFERENCES teams(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  evento_id  INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_event_fav (user_id, evento_id),
  CONSTRAINT fk_fav_user   FOREIGN KEY (user_id)   REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_fav_evento FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;




