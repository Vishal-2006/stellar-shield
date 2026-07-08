from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hashlib
import time

app = FastAPI(title="StellarShield AI Auditor Engine")

# CORS enable panrom - appo thaan Next.js frontend-la irundhu indha backend API-ai call panna mudiyum
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Production-la specific domain mattum allow pannanum
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for contract input code
class AuditRequest(BaseModel):
    contract_code: str
    developer_address: str

# Response structure mock data blueprint
class AuditResponse(BaseModel):
    contract_hash: str
    security_score: int
    critical_bugs: int
    report_markdown: str
    status: str

@app.get("/")
def read_root():
    return {"message": "StellarShield AI Auditor Engine is running live!"}

@app.post("/api/audit", response_model=AuditResponse)
def perform_smart_contract_audit(request: AuditRequest):
    if not request.contract_code.strip():
        raise HTTPException(status_code=400, detail="Contract code cannot be empty")

    # Generate a real 32-byte SHA256 hash of the submitted contract code
    code_bytes = request.contract_code.encode('utf-8')
    generated_hash = hashlib.sha256(code_bytes).hexdigest()

    # Rule-based simple parsing algorithms (Temporary mock logic before wire up Qwen model api parameters)
    code_lower = request.contract_code.lower()
    critical_bugs = 0
    issues_list = []

    # Check 1: Missing requirement auth macro pattern check
    if "require_auth" not in code_lower:
        critical_bugs += 1
        issues_list.append("- **CRITICAL**: Missing dynamic `.require_auth()` verification on state entry handlers.")
    
    # Check 2: Raw mathematical calculations without checked arithmetic macros
    if "+" in code_lower or "-" in code_lower:
        if "checked_" not in code_lower:
            critical_bugs += 1
            issues_list.append("- **HIGH**: Detected unsafe raw arithmetic operators. Use `checked_add` or `checked_sub` to mitigate overflows.")

    # Check 3: Basic state storage strategy detection
    if "extend_ttl" not in code_lower:
        issues_list.append("- **MEDIUM**: Missing active Persistent Storage TTL extension macro handlers.")

    # Calculate basic dynamic score parameters matrix
    security_score = max(100 - (critical_bugs * 35), 30)

    # Compile a clear markdown format analysis report
    vulnerabilities_summary = "\n".join(issues_list) if issues_list else "No prominent code flaws identified."
    
    report_md = f"""# StellarShield Security Audit Report
**Target Developer Account:** {request.developer_address}
**Cryptographic Code SHA256 Hash:** 0x{generated_hash}

## Summary Metrics
- **Overall Safety Score:** {security_score}/100
- **Identified Critical/High Flaws:** {critical_bugs}

## Detailed Analysis Breakdown
{vulnerabilities_summary}

---
*Disclaimer: This automated initial scan is completed via StellarShield open-source vector heuristics frameworks.*
"""

    return AuditResponse(
        contract_hash=generated_hash,
        security_score=security_score,
        critical_bugs=critical_bugs,
        report_markdown=report_md,
        status="Success"
    )