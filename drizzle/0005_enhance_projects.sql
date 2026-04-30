-- Créer la table projects enrichie si elle n'existe pas
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` enum('active','pending','completed','archived') NOT NULL DEFAULT 'active',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `budget` decimal(12,2),
  `spent` decimal(12,2) DEFAULT 0,
  `startDate` datetime,
  `endDate` datetime,
  `leaderId` int,
  `teamMembers` json,
  `progress` int DEFAULT 0,
  `createdBy` int,
  `updatedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isArchived` boolean DEFAULT false,
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_leaderId` (`leaderId`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Créer la table project_tasks
CREATE TABLE IF NOT EXISTS `project_tasks` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('pending','in-progress','completed') NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `assignedTo` int,
  `dueDate` datetime,
  `completedAt` datetime,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  KEY `idx_projectId` (`projectId`),
  KEY `idx_status` (`status`),
  KEY `idx_assignedTo` (`assignedTo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Créer la table project_members
CREATE TABLE IF NOT EXISTS `project_members` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `memberId` int NOT NULL,
  `role` varchar(100),
  `joinedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_project_member` (`projectId`, `memberId`),
  KEY `idx_projectId` (`projectId`),
  KEY `idx_memberId` (`memberId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --> statement-breakpoint
