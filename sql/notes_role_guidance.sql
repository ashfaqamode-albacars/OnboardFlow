-- sql/notes_role_guidance.sql
-- Note: JWT claim 'role' must be present in user's token for admin checks above.
-- You can add custom claims to user JWTs via your auth system (e.g., during signup or via an admin-only process).

-- Example to test auth.jwt() claim in SQL:
SELECT current_setting('request.jwt.claims', true)::json ->> 'role' AS role_claim;
