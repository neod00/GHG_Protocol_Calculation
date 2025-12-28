-- Project Versions Table for Version Management (Feature 6)
-- Run this SQL in Supabase SQL Editor

-- Create project_versions table
CREATE TABLE IF NOT EXISTS project_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_name VARCHAR(255), -- Optional user-provided name
    data_snapshot JSONB NOT NULL, -- Complete snapshot of sources and facilities
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique version numbers per project
    UNIQUE(project_id, version_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_created_at ON project_versions(created_at DESC);

-- Enable RLS
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access versions of projects they have access to
CREATE POLICY "Users can view versions of their projects" ON project_versions
    FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN organization_members om ON om.organization_id = p.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create versions for their projects" ON project_versions
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN organization_members om ON om.organization_id = p.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete versions of their projects" ON project_versions
    FOR DELETE
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN organization_members om ON om.organization_id = p.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Function to automatically clean up old versions (keep only 10 most recent)
CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete versions beyond the 10 most recent for this project
    DELETE FROM project_versions
    WHERE id IN (
        SELECT id FROM project_versions
        WHERE project_id = NEW.project_id
        ORDER BY version_number DESC
        OFFSET 10
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_old_versions ON project_versions;
CREATE TRIGGER trigger_cleanup_old_versions
    AFTER INSERT ON project_versions
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_versions();

-- Comment for documentation
COMMENT ON TABLE project_versions IS 'Stores version snapshots of projects. Only manual saves create versions. Max 10 versions per project.';
