CREATE TABLE `captures` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`url` text NOT NULL,
	`status` text NOT NULL,
	`data` text NOT NULL,
	`at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `history` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`, `revision`)
);
--> statement-breakpoint
CREATE TABLE `records` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`updated` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
