# Next Phase: Handoff Guide

## 1. Current Branch
`phase-11-persistence-pipeline`

## 2. Last Completed Phase
Phase 11: Persistence Pipeline

## 3. Last Successful Commit
`HEAD` of `phase-11-persistence-pipeline`

## 4. Current Project Status
The worker pipeline is fundamentally complete. It executes budgeted search waves, fetches DOM payloads, deterministically extracts candidates via Cheerio, deduplicates them using a canonical hashing engine, and safely persists the unified records natively into the Supabase database using strictly constrained PostgreSQL upserts.

## 5. Outstanding Hotfixes
**Critical:** `application_url` is silently dropped during `DatabaseMappingLayer.toInternshipRow`. The property exists on the `CanonicalInternship` model but is missing from both the `InternshipRow` typescript type and the database insertion schema logic.

## 6. Technical Debt
- The UI relies on bare CSS Modules and needs a full visual pass.
- The system still heavily relies on mocked deterministic "Brain" components instead of true Google Gemini prompts.
- The `tags` array overwrite in the Persistence layer is highly destructive and should be handled dynamically in the future.

## 7. Immediate Next Objective
**Hotfix:** Persist `application_url` through the entire persistence pipeline.

## 8. Exact Next Prompt to Run
```text
Execute the application_url persistence hotfix. Ensure that application_url safely survives DatabaseMappingLayer.toInternshipRow() and is successfully written to the internships table alongside the other core payload data. Update any typescript interfaces as needed.
```

## 9. Recommended Model
Gemini 2.5 Pro 

## 10. Recommended Antigravity Mode
Standard Auto-Execution
