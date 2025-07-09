NLD 0013-0001-0000 - Amended Naming and Versioning Convention.md

Directive ID: NLD 0013-0001-0000

Timestamp: 2025-07-07T13:21:38-04:00

Directive Type: SYSTEM_STANDARD_AMENDMENT

Parent Directive: NLD 0013-0000-0000

Title: Amended Naming and Versioning Convention

1. Purpose
To refine and formally establish the official naming convention for all documents within the MyOS project. This standard ensures perfect sort integrity, infinite expandability, and creates a self-documenting file system, which is critical for the MyServer orchestrator to navigate the architecture.

2. The Dewey Matrix Coordinate System
All canonical NLDs and their related documents will adhere to a 3-part coordinate system.

Format: NLD <XXXX>-<YYYY>-<ZZZZ> - <Descriptive Title>.md

<XXXX>: The Primary Pillar/Scroll. This four-digit, zero-padded number represents the main document or core concept (e.g., 0013).

<YYYY>: The Chapter/Sub-Directive. This second block allows for logically grouping related documents under a single primary pillar without breaking the sort order.

<ZZZZ>: The Line/Version. This third block provides the finest level of granularity for tracking revisions, user operations, or specific data instances related to a sub-directive.

3. Procedural Rules
Self-Referential Header: The full, compliant filename must be the absolute first line within the document itself. This allows any system process to parse the file's content to confirm its identity and location within the matrix, enabling more robust error-checking and recursive analysis.

Backward Compatibility: Legacy files created before the adoption of this standard will not be renamed, to preserve potential hardcoded dependencies.

Deprecation of Decimal System: The prior ad-hoc use of decimals (e.g., NLD 00.1) is now deprecated for all future file creation in favor of this more robust system.