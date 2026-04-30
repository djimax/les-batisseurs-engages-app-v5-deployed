CREATE TABLE `project_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`memberId` int NOT NULL,
	`role` varchar(100),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in-progress','completed') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`assignedTo` int,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','pending','completed','archived') NOT NULL DEFAULT 'active',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`budget` decimal(12,2),
	`spent` decimal(12,2) DEFAULT '0',
	`startDate` timestamp,
	`endDate` timestamp,
	`leaderId` int,
	`progress` int DEFAULT 0,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isArchived` boolean DEFAULT false,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
