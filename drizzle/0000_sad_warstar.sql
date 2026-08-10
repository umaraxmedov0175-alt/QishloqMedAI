CREATE TABLE `ai_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`request_id` text NOT NULL,
	`assessment_version` text NOT NULL,
	`provider_model` text NOT NULL,
	`generated_at` text,
	`processing_duration_ms` integer,
	`case_summary` text,
	`triage_level` text,
	`red_flags_json` text,
	`abnormal_observations_json` text,
	`imaging_observations_json` text,
	`differential_considerations_json` text,
	`suggested_next_steps_json` text,
	`questions_for_clinician_json` text,
	`limitations_json` text,
	`confidence` real,
	`requires_human_review` integer DEFAULT true NOT NULL,
	`generation_status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_assessments_request` ON `ai_assessments` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_assessments_queue` ON `ai_assessments` (`generation_status`,`created_at`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`metadata_json` text,
	FOREIGN KEY (`actor_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_resource` ON `audit_events` (`resource_type`,`resource_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `clinician_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`ai_assessment_id` text NOT NULL,
	`clinician_id` text NOT NULL,
	`decision` text NOT NULL,
	`final_clinician_summary` text NOT NULL,
	`recommendations` text NOT NULL,
	`reviewed_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`ai_assessment_id`) REFERENCES `ai_assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clinician_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`region` text NOT NULL,
	`district` text,
	`clinic_type` text NOT NULL,
	`operational_status` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_clinics_org_region` ON `clinics` (`organization_id`,`region`);--> statement-breakpoint
CREATE TABLE `diagnostic_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`storage_path` text NOT NULL,
	`mime_type` text NOT NULL,
	`original_filename` text NOT NULL,
	`file_size_bytes` integer NOT NULL,
	`upload_status` text NOT NULL,
	`checksum` text,
	`image_quality_status` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`clinic_id` text NOT NULL,
	`nurse_id` text NOT NULL,
	`chief_complaint` text NOT NULL,
	`symptom_summary` text NOT NULL,
	`onset_information` text NOT NULL,
	`clinician_notes` text,
	`encounter_status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`nurse_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_encounters_queue` ON `encounters` (`clinic_id`,`encounter_status`,`created_at`);--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`follow_up_date` text NOT NULL,
	`instructions` text NOT NULL,
	`outcome` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_results` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`test_name` text NOT NULL,
	`standardized_code` text,
	`result_value` text NOT NULL,
	`result_unit` text NOT NULL,
	`reference_low` real,
	`reference_high` real,
	`collected_at` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_code` text NOT NULL,
	`full_name` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`sex` text,
	`village` text NOT NULL,
	`district` text NOT NULL,
	`region` text NOT NULL,
	`phone` text,
	`consent_status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_patients_code` ON `patients` (`patient_code`);--> statement-breakpoint
CREATE INDEX `idx_patients_region` ON `patients` (`region`,`district`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`organization_id` text NOT NULL,
	`clinic_id` text,
	`preferred_language` text DEFAULT 'uz' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`clinician_review_id` text,
	`destination_facility` text NOT NULL,
	`specialty` text NOT NULL,
	`urgency` text NOT NULL,
	`referral_reason` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clinician_review_id`) REFERENCES `clinician_reviews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_referrals_status` ON `referrals` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `vitals` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`temperature_c` real,
	`heart_rate_bpm` integer,
	`respiratory_rate_per_min` integer,
	`systolic_bp_mmhg` integer,
	`diastolic_bp_mmhg` integer,
	`oxygen_saturation_percent` real,
	`weight_kg` real,
	`height_cm` real,
	`glucose_value` real,
	`glucose_unit` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
