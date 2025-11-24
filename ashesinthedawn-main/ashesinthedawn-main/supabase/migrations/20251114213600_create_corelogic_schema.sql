/*
  # CoreLogic Studio Database Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `sample_rate` (integer, default 48000)
      - `bit_depth` (integer, default 24)
      - `bpm` (numeric, default 120)
      - `time_signature` (text, default '4/4')
      - `session_data` (jsonb) - stores tracks, routing, automation
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `project_versions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `version_number` (integer)
      - `session_data` (jsonb)
      - `created_at` (timestamptz)
    
    - `templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `template_data` (jsonb)
      - `is_public` (boolean, default false)
      - `created_at` (timestamptz)
    
    - `ai_patterns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `pattern_type` (text) - 'routing', 'naming', 'effects_chain', etc.
      - `pattern_data` (jsonb)
      - `usage_count` (integer, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sample_rate integer DEFAULT 48000,
  bit_depth integer DEFAULT 24,
  bpm numeric DEFAULT 120,
  time_signature text DEFAULT '4/4',
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Project versions table
CREATE TABLE IF NOT EXISTS project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own projects"
  ON project_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions of own projects"
  ON project_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'custom',
  template_data jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Patterns table
CREATE TABLE IF NOT EXISTS ai_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type text NOT NULL,
  pattern_data jsonb DEFAULT '{}'::jsonb,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai patterns"
  ON ai_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ai patterns"
  ON ai_patterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai patterns"
  ON ai_patterns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS project_versions_project_id_idx ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
CREATE INDEX IF NOT EXISTS templates_is_public_idx ON templates(is_public);
CREATE INDEX IF NOT EXISTS ai_patterns_user_id_idx ON ai_patterns(user_id);
CREATE INDEX IF NOT EXISTS ai_patterns_pattern_type_idx ON ai_patterns(pattern_type);