// Parents before children. Shared by the Worker backup and Node restore tool.
export const BACKUP_TABLES = [
  "groups", "members", "districts", "buildings", "building_likes", "build_deliveries", "build_push_events", "focus_log",
  "messages", "reactions", "plans", "attendees", "plan_skips", "plan_push_events", "feedback", "feedback_events",
  "achievements", "bricks_log", "activity", "unlocks", "blueprint_progress", "weekly", "imece_project", "imece_crew", "imece_contributions", "imece_projects", "imece_slots", "imece_work",
  // n46 C
  "focus_runs", "request_receipts", "village_changes", "village_layouts", "village_regions", "village_nodes", "village_roads", "village_neighborhoods", "village_plots", "village_placements",
];
