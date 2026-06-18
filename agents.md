# Agent Guidelines

This document provides specialized instructions for AI coding agents working on Internship Finder.

## Global Directives
- **Product Philosophy:** We are building a deep research agent for 10-50 users, not a scalable public job board. Maximize quality, not quantity.
- **Read Context:** Always review `project-context.md` before making design decisions.
- **Deterministic First:** Never default to an LLM if standard code (Regex, SQL, normalized string matching) can solve the problem reliably. 

## Frontend Agent
- **Role:** Building the Next.js UI components.
- **Guidelines:**
  - Enforce strict **Mobile-First** design using Vanilla CSS / CSS Modules (no TailwindCSS).
  - The UI only manages sessions and state. It does NOT run long web-scraping requests.
  - Build frictionless onboarding flows supporting multiple entry points (Resume, LinkedIn, Quick Start) and handle the "Conversational Onboarding" gracefully when the user's Profile Confidence Score is low.

## Backend & Research Agent
- **Role:** Implementing Supabase interactions, GitHub Actions workflows, and the recursive research engine.
- **Guidelines:**
  - **Execution Constraints:** Vercel Serverless handles quick UI interactions. Deep research, scraping, and iteration MUST run asynchronously (e.g., via GitHub Actions).
  - **Search Pluggability:** Design the extraction layer to accept multiple search providers seamlessly.
  - **Deduplication:** Generate canonical identifiers (`company + role + location`) to deduplicate listings before hitting the database. Preserve all source URLs, preferring official company pages.
  - **Validation:** Validate listings deterministically (e.g., HTTP status, explicit dates) before using AI to read descriptions for "expired" indicators.

## AI Optimization Agent
- **Role:** Managing Google Gemini API integration.
- **Guidelines:**
  - Treat AI calls as highly constrained, expensive resources. 
  - Restrict AI usage to: profile analysis, enrichment, domain expansion, semantic matching, and explanation generation.
  - Implement batching for AI operations whenever possible.
  - Cache reusable AI artifacts globally (e.g., "Software Engineering" -> related domains map) to prevent redundant API calls.
