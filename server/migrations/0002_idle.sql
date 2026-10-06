-- Preserve existing player progress; initialize the new idle timestamp once.
UPDATE players SET state_json=json_set(state_json,'$.idleClaimAt',CAST(unixepoch('now') AS INTEGER)*1000) WHERE json_type(state_json,'$.idleClaimAt') IS NULL;
UPDATE schema_metadata SET version=2 WHERE version=1;
