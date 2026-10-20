// Migration and old-backup restore share exactly the same import. Legacy tables
// remain a read-only archive. Work moves once, never once per village.
export const IMECE_TEAM_IMPORT = [
  `INSERT INTO imece_projects(id,group_id,rev,started,completed)
   SELECT p.id,NULL,p.rev,p.started,p.completed FROM imece_project p`,
  `INSERT INTO imece_slots(project_id,slot,member_id,name,avatar,color,seen_minutes)
   SELECT 'bir-tas-da-senden',slot,member_id,name,avatar,color,seen_minutes FROM imece_crew`,
  `INSERT INTO imece_work(id,project_id,slot,phase,minutes,personal,session_end,created)
   SELECT id,'bir-tas-da-senden',slot,phase,minutes,personal,session_end,created FROM imece_contributions`,
  "UPDATE members SET focus_imece_project='bir-tas-da-senden' WHERE focus_imece=1 AND focus_end>0 AND EXISTS(SELECT 1 FROM imece_projects WHERE id='bir-tas-da-senden')",
];
