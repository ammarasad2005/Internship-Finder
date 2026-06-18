# Next Phase: Handoff Guide

## 1. Current Branch
`hotfix-persistence-application-url`

## 2. Last Completed Phase
Hotfix: Application URL Persistence

## 3. Last Successful Commit
`HEAD` of `hotfix-persistence-application-url`

## 4. Current Project Status
The worker pipeline is fully complete and hardened. It executes budgeted search waves, parses DOM payloads, securely deduplicates candidates via canonical hashing, and natively persists the unified records (now securely including `application_url`) directly into Supabase via constrained upserts.

## 5. Outstanding Hotfixes
None. The critical `application_url` data loss bug has been successfully resolved.

## 6. Technical Debt
- The UI relies on bare CSS Modules and needs a full visual pass.
- The system heavily relies on mocked deterministic "Brain" components instead of true Google Gemini prompts.
- The `tags` array overwrite in the Persistence layer is highly destructive to manual updates and should be handled dynamically in the future.
- The database schema was modified directly in `initial_schema.sql`, so the developer must run `supabase db reset` locally to reflect the new `application_url` column.

## 7. Immediate Next Objective
**Phase 12: True AI Integration**

## 8. Exact Next Prompt to Run
```text
Begin Phase 12. Integrate the Google Gemini API. Replace the deterministic mock dictionaries in `DomainExpansionService` and `QueryGenerationService` with real LLM prompts, and implement a Gemini-powered fallback extractor for low-confidence HTML payloads.
```

## 9. Recommended Model
Gemini 2.5 Pro 

## 10. Recommended Antigravity Mode
Standard Auto-Execution
