---
name: security-audit
description: Run before finalizing features touching authentication, APIs, user inputs, database queries, or dependencies to catch OWASP/CWE vulnerabilities and verify findings before reporting.
---

# Security Audit

Audit touched code for security and data safety:
1. Check for XSS (`innerHTML` with untrusted input), unsafe `eval`/`new Function`, injection, and unguarded storage access.
2. Verify auth/permission boundaries and input validation where applicable.
3. Only report verified findings directly observed in the inspected code.

