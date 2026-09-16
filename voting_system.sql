-- ================================================================
--  VoteSecure — Complete Database Schema
--  Run this in MySQL Workbench / phpMyAdmin / XAMPP
--  Database: online-voting-system
-- ================================================================

CREATE DATABASE IF NOT EXISTS `online-voting-system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `online-voting-system`;

-- ── users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `mobile`      VARCHAR(10)  NOT NULL,
  `email`       VARCHAR(150)          DEFAULT NULL,
  `password`    VARCHAR(255) NOT NULL,
  `address`     VARCHAR(255) NOT NULL,
  `photo`       VARCHAR(255) NOT NULL DEFAULT 'default.png',
  `role`        TINYINT      NOT NULL DEFAULT 1  COMMENT '1=voter, 2=admin',
  `status`      TINYINT      NOT NULL DEFAULT 0  COMMENT '0=not_voted, 1=voted, 2=blocked',
  `is_verified` TINYINT      NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── candidates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `candidates` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(100) NOT NULL,
  `party`     VARCHAR(100) NOT NULL,
  `mobile`    VARCHAR(15)           DEFAULT NULL,
  `email`     VARCHAR(150)          DEFAULT NULL,
  `photo`     VARCHAR(255) NOT NULL DEFAULT 'default.png',
  `manifesto` TEXT                  DEFAULT NULL,
  `status`    TINYINT      NOT NULL DEFAULT 1  COMMENT '1=active, 0=inactive',
  `votes`     INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── votes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `votes` (
  `id`           INT         NOT NULL AUTO_INCREMENT,
  `user_id`      INT         NOT NULL,
  `candidate_id` INT         NOT NULL,
  `ip_address`   VARCHAR(50)          DEFAULT NULL,
  `voted_at`     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_vote` (`user_id`),
  KEY `fk_votes_candidate` (`candidate_id`),
  CONSTRAINT `fk_votes_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_votes_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── election_settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `election_settings` (
  `id`                  INT          NOT NULL DEFAULT 1,
  `election_name`       VARCHAR(200) NOT NULL DEFAULT 'General Election 2025',
  `election_status`     VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending|active|ended',
  `start_date`          DATETIME              DEFAULT NULL,
  `end_date`            DATETIME              DEFAULT NULL,
  `allow_registration`  TINYINT      NOT NULL DEFAULT 1,
  `winner_declared`     TINYINT      NOT NULL DEFAULT 0,
  `winner_candidate_id` INT                   DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── activity_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `user_id`     INT                   DEFAULT NULL,
  `action`      VARCHAR(100) NOT NULL,
  `description` TEXT                  DEFAULT NULL,
  `ip_address`  VARCHAR(50)           DEFAULT NULL,
  `user_agent`  TEXT                  DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_logs_user` (`user_id`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── notifications ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(200) NOT NULL,
  `message`    TEXT                  DEFAULT NULL,
  `type`       VARCHAR(20)           DEFAULT 'info',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
--  SEED DATA
-- ================================================================

-- Single election settings row (always id=1)
INSERT IGNORE INTO `election_settings` (`id`, `election_name`, `election_status`, `allow_registration`)
VALUES (1, 'General Election 2025', 'pending', 1);

-- ── Default admin account ────────────────────────────────────────
--  Mobile : 9999999999
--  Password: Admin@123   (bcrypt hash below)
INSERT IGNORE INTO `users`
  (`name`, `mobile`, `email`, `password`, `address`, `role`, `status`, `is_verified`)
VALUES (
  'Super Admin',
  '9999999999',
  'admin@votesecure.com',
  '$2a$12$KIUfg5BiELrGqvbrkPNygeI3tHNhiZnBiJiIwW3B6Eq5tnO3tCpZy',
  'Admin Office, VoteSecure HQ',
  2,
  0,
  1
);

-- ── Sample candidates ────────────────────────────────────────────
INSERT IGNORE INTO `candidates` (`name`, `party`, `manifesto`, `status`) VALUES
  ('Rajesh Kumar',  'National Progress Party', 'Committed to economic growth and education reform.', 1),
  ('Priya Sharma',  'People\'s Democratic Front', 'Focused on healthcare, women empowerment and rural development.', 1),
  ('Arjun Mehta',   'United Citizens Alliance', 'Driving infrastructure development and digital India initiatives.', 1);
