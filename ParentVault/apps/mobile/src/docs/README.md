# ParentVault Source Docs

Welcome to the ParentVault source documentation. This folder holds human-readable guides for contributors, reviewers, and future maintainers.

## Quick Table of Contents

- [Product Overview](../../docs/PRODUCT_OVERVIEW.md) - What ParentVault does and why it exists
- [Beginner Start Here](../../docs/BEGINNER_START_HERE.md) - First steps if you're new to the project
- [Mobile MVP UX Audit](../../docs/MOBILE_MVP_UX_AUDIT.md) - Current UX gaps and recommended next slices
- [Guided Import UX Notes](../../docs/GUIDED_IMPORT_UX_NOTES.md) - Design principles for the import flow
- [Developer Workflow](../../docs/DEVELOPER_WORKFLOW.md) - How to set up, commit, and share your changes
- [Architecture](../../docs/ARCHITECTURE.md) - High-level system design and data model
- [Code Organization](../../docs/CODE_ORGANIZATION.md) - Where files live and how they relate
- [Troubleshooting](../../docs/TROUBLESHOOTING.md) - Common issues and how to fix them

## This Folder

The `src/docs` folder is for inline documentation that lives right next to the code it explains:

- **Onboarding helpers** → See `../screens/onboarding/`
- **Tabs registry** → See `../navigation/tabs.tsx`
- **Theme tokens** → See `../theme.tsx`
- **Type definitions** → Scattered across `../types/`, `../store/`, and screen files

## Contributing

1. Read the [Beginner Start Here](../../docs/BEGINNER_START_HERE.md) guide first
2. Pick a small slice from the [UX Audit](../../docs/MOBILE_MVP_UX_AUDIT.md)
3. Follow the [Developer Workflow](../../docs/DEVELOPER_WORKFLOW.md) for setup and commits
4. Share your changes for review via the project's GitHub link

## Privacy & Security Notes

- All code comments explain product intent, privacy boundaries, and why flows exist
- If code and comments disagree, fix both together (stale security comments are dangerous)
- Never commit sensitive data: SSNs, medical records, custody documents, or school info
- Prototype features behind `FEATURE_` flags should never reach production without review

---
*Last updated: 2026-05-18*
