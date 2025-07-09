NLD 0013 - Data Serialization and Formatting Conventions.md
Directive ID: NLD 0013

Timestamp: 20250707123700-EDT

Directive Type: SYSTEM_STANDARD_DEFINITION

Title: Data Serialization and Formatting Conventions

1. Purpose
To establish clear, system-wide rules for data formatting to ensure consistency, sortability, and interoperability between all modules of MyOS.

2. Conventions
Sequential IDs: All sequential identifiers (e.g., database primary keys) must be formatted with leading zeros when displayed or used in a text-based context. The standard padding shall be 7 digits.

Example: 1 becomes 0000001. 987 becomes 0000987.

Reason: To ensure correct alphanumeric sorting and prevent logical errors in systems that might interpret the IDs as text.

Timestamps: All timestamps will be stored and transmitted in the YYYYMMDDHHMMSS format for machine readability and sortability.

Example: 20250707123700

Reason: This represents a "Base24/Base60" snapshot and provides a standard, unambiguous point-in-time reference.

Data Interchange Format: JSON is the default universal language for data structures passed between all MyOS services.

The archives are now up to date with our new architectural understanding.