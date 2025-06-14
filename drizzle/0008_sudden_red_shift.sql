CREATE TABLE "exercise_performance" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"user_exercise_id" text NOT NULL,
	"order_in_session" integer NOT NULL,
	"planned_sets" integer NOT NULL,
	"completed_sets" integer DEFAULT 0 NOT NULL,
	"planned_reps" integer,
	"planned_weight" integer,
	"planned_duration" integer,
	"actual_sets" jsonb,
	"difficulty_rating" integer NOT NULL,
	"form_rating" integer,
	"enjoyment_rating" integer,
	"exercise_notes" text,
	"total_volume" integer,
	"average_rest_time" integer,
	"time_to_complete" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"subcategory" varchar(50),
	"muscle_groups" text[] NOT NULL,
	"equipment" text[] NOT NULL,
	"difficulty_level" integer NOT NULL,
	"base_time_per_set" integer NOT NULL,
	"base_rest_time" integer NOT NULL,
	"default_sets" integer DEFAULT 3 NOT NULL,
	"default_reps" integer,
	"default_duration" integer,
	"exercise_type" varchar(30) NOT NULL,
	"movement_pattern" varchar(30),
	"progression_type" varchar(30) NOT NULL,
	"scaling_factors" jsonb,
	"image_url" text,
	"video_url" text,
	"thumbnail_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"current_weight" integer,
	"current_reps" integer,
	"current_sets" integer DEFAULT 3 NOT NULL,
	"current_duration" integer,
	"last_performed" timestamp,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"best_performance" jsonb,
	"preferred_rest_time" integer,
	"notes" text,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	"recommendation_type" varchar(30) DEFAULT 'daily' NOT NULL,
	"target_duration" integer NOT NULL,
	"user_input" text,
	"ai_reasoning" text NOT NULL,
	"context_factors" jsonb,
	"recommended_exercises" jsonb NOT NULL,
	"alternative_exercises" jsonb,
	"confidence_score" integer NOT NULL,
	"expected_difficulty" integer NOT NULL,
	"focus_areas" text[] NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"user_feedback" text,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_type" varchar(30) DEFAULT 'ai_recommended' NOT NULL,
	"target_duration" integer,
	"actual_duration" integer,
	"user_input" text,
	"energy_level" integer,
	"available_time" integer NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"recommendation_context" jsonb,
	"total_exercises" integer DEFAULT 0,
	"completed_exercises" integer DEFAULT 0,
	"overall_rating" integer,
	"session_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_performance" ADD CONSTRAINT "exercise_performance_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_performance" ADD CONSTRAINT "exercise_performance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_performance" ADD CONSTRAINT "exercise_performance_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_performance" ADD CONSTRAINT "exercise_performance_user_exercise_id_user_exercises_id_fk" FOREIGN KEY ("user_exercise_id") REFERENCES "public"."user_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_recommendations" ADD CONSTRAINT "workout_recommendations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_recommendations" ADD CONSTRAINT "workout_recommendations_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;