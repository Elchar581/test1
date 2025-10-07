/*
  # Eco Project Admin Panel Schema

  ## Overview
  This migration creates the database schema for an ecological project admin panel that tracks users, system logs, and trash locations on a map.

  ## New Tables

  ### 1. `admin_users`
  - `id` (uuid, primary key) - Unique identifier linked to auth.users
  - `email` (text, unique) - Admin email address
  - `full_name` (text) - Admin's full name
  - `role` (text) - Admin role (admin, moderator, viewer)
  - `is_active` (boolean) - Whether the admin account is active
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last login timestamp

  ### 2. `project_users`
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email
  - `full_name` (text) - User's full name
  - `phone` (text) - User's phone number
  - `is_active` (boolean) - User account status
  - `reports_count` (integer) - Number of trash reports submitted
  - `created_at` (timestamptz) - Registration date
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `trash_locations`
  - `id` (uuid, primary key) - Unique location identifier
  - `user_id` (uuid, foreign key) - User who reported the trash
  - `latitude` (numeric) - Latitude coordinate
  - `longitude` (numeric) - Longitude coordinate
  - `description` (text) - Description of the trash
  - `trash_type` (text) - Type of trash (plastic, metal, organic, etc.)
  - `status` (text) - Current status (reported, in_progress, cleaned, rejected)
  - `priority` (text) - Priority level (low, medium, high)
  - `image_url` (text) - URL to trash photo
  - `created_at` (timestamptz) - Report timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `cleaned_at` (timestamptz) - Cleaning completion timestamp

  ### 4. `system_logs`
  - `id` (uuid, primary key) - Unique log identifier
  - `log_level` (text) - Log level (info, warning, error, critical)
  - `action` (text) - Action performed
  - `user_id` (uuid) - User who performed the action
  - `entity_type` (text) - Type of entity affected
  - `entity_id` (uuid) - ID of affected entity
  - `details` (jsonb) - Additional log details
  - `ip_address` (text) - IP address of the request
  - `created_at` (timestamptz) - Log timestamp

  ## Security
  
  ### Row Level Security
  All tables have RLS enabled with restrictive policies:
  
  1. **admin_users**: Only authenticated admins can view all admin users
  2. **project_users**: Admins can view and manage all project users
  3. **trash_locations**: Admins can view and update all trash locations
  4. **system_logs**: Admins can view all logs (read-only)

  ## Indexes
  Created indexes for frequently queried columns to optimize performance:
  - Trash locations by status and created date
  - System logs by level and created date
  - Project users by active status
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'moderator', 'viewer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create project_users table
CREATE TABLE IF NOT EXISTS project_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  reports_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trash_locations table
CREATE TABLE IF NOT EXISTS trash_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES project_users(id) ON DELETE SET NULL,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  description text NOT NULL,
  trash_type text NOT NULL CHECK (trash_type IN ('plastic', 'metal', 'glass', 'organic', 'electronic', 'mixed', 'other')),
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'cleaned', 'rejected')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cleaned_at timestamptz
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_level text NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'critical')),
  action text NOT NULL,
  user_id uuid,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trash_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'admin'
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'admin'
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for project_users
CREATE POLICY "Admins can view all project users"
  ON project_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update project users"
  ON project_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert project users"
  ON project_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete project users"
  ON project_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'admin'
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for trash_locations
CREATE POLICY "Admins can view all trash locations"
  ON trash_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update trash locations"
  ON trash_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- RLS Policies for system_logs
CREATE POLICY "Admins can view all logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trash_locations_status ON trash_locations(status);
CREATE INDEX IF NOT EXISTS idx_trash_locations_created_at ON trash_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_locations_user_id ON trash_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_users_active ON project_users(is_active);

-- Insert some sample data for testing
INSERT INTO admin_users (id, email, full_name, role, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@eco-project.ru', 'Главный Администратор', 'admin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO project_users (email, full_name, phone, reports_count) VALUES
  ('user1@example.com', 'Иван Петров', '+7 999 123-45-67', 5),
  ('user2@example.com', 'Мария Сидорова', '+7 999 234-56-78', 3),
  ('user3@example.com', 'Алексей Козлов', '+7 999 345-67-89', 8)
ON CONFLICT (email) DO NOTHING;

INSERT INTO trash_locations (user_id, latitude, longitude, description, trash_type, status, priority) 
SELECT 
  pu.id,
  55.7558 + (random() * 0.1 - 0.05),
  37.6173 + (random() * 0.1 - 0.05),
  CASE (random() * 3)::int
    WHEN 0 THEN 'Большая куча пластиковых бутылок'
    WHEN 1 THEN 'Строительный мусор на обочине'
    WHEN 2 THEN 'Несанкционированная свалка'
    ELSE 'Мусор в лесополосе'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'plastic'
    WHEN 1 THEN 'metal'
    WHEN 2 THEN 'mixed'
    ELSE 'other'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'reported'
    WHEN 1 THEN 'in_progress'
    ELSE 'cleaned'
  END,
  CASE (random() * 2)::int
    WHEN 0 THEN 'medium'
    ELSE 'high'
  END
FROM project_users pu
LIMIT 10;

INSERT INTO system_logs (log_level, action, user_id, entity_type, details) VALUES
  ('info', 'user_login', '00000000-0000-0000-0000-000000000001', 'admin_users', '{"message": "Успешный вход в систему"}'::jsonb),
  ('info', 'trash_location_created', NULL, 'trash_locations', '{"message": "Создана новая метка мусора"}'::jsonb),
  ('warning', 'failed_login_attempt', NULL, 'admin_users', '{"message": "Неудачная попытка входа"}'::jsonb),
  ('info', 'user_updated', '00000000-0000-0000-0000-000000000001', 'project_users', '{"message": "Обновлены данные пользователя"}'::jsonb),
  ('error', 'database_connection_error', NULL, 'system', '{"message": "Ошибка подключения к базе данных"}'::jsonb);