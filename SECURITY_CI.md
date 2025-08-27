# Security CI/CD Pipeline Documentation

This document outlines the security measures implemented in our Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Clean Pods project.

## 🔒 Security Workflows Overview

Our security pipeline consists of multiple automated workflows that run on every push and pull request:

### 1. Security Audit Workflow (`security-audit.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Daily scheduled runs at 2 AM UTC

**Components:**

#### NPM Security Audit

- Runs `npm audit` with moderate severity threshold
- Generates detailed audit reports (JSON and text)
- Fails build on critical vulnerabilities
- Warns on high vulnerabilities
- Uploads audit reports as artifacts (30-day retention)

#### Dependency Review (PR only)

- Reviews new dependencies in pull requests
- Checks for known vulnerabilities
- Validates license compatibility
- Fails on moderate+ severity issues

#### Software Composition Analysis (SCA)

- License compliance checking
- Identifies problematic licenses (GPL, AGPL, etc.)
- Generates Software Bill of Materials (SBOM)
- Package integrity verification
- Outdated package detection

### 2. Secret Scanning Workflow (`secret-scanning.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Daily scheduled runs at 3 AM UTC

**Components:**

#### GitLeaks Secret Detection

- Scans entire repository history
- Uses custom configuration (`.gitleaks.toml`)
- Detects API keys, tokens, passwords, and other secrets
- Supports custom patterns for project-specific secrets

#### TruffleHog Secret Scanning

- Advanced entropy-based detection
- Verified secrets only mode
- Comprehensive pattern matching
- Historical commit scanning

#### Semgrep Security Analysis

- OWASP Top 10 vulnerability detection
- JavaScript/TypeScript/React/Next.js specific rules
- Security audit patterns
- Custom rule configurations

#### Custom Secret Pattern Detection

- Project-specific secret patterns
- API key detection (AWS, Google, GitHub, Slack)
- Database connection string detection
- JWT token identification
- Environment variable security audit

### 3. Comprehensive CI Workflow (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Security Integration:**

- Combines all security checks with standard CI
- Ensures security gates before deployment
- Provides comprehensive security reporting
- Fails fast on critical security issues

## 🛡️ Security Configurations

### GitLeaks Configuration (`.gitleaks.toml`)

**Custom Rules:**

- Razorpay API keys detection
- Clerk authentication keys
- Upstash Redis credentials
- Vercel tokens
- Slack webhook URLs
- Database connection strings

**Allowlist:**

- Example files (`.env.example`)
- Documentation files
- Build artifacts
- Test patterns
- Common false positives

### Supported Secret Types

| Secret Type     | Pattern                                             | Risk Level |
| --------------- | --------------------------------------------------- | ---------- |
| Razorpay Keys   | `rzp_(test\|live)_[A-Za-z0-9]{14}`                  | High       |
| Clerk Secrets   | `sk_(test\|live)_[A-Za-z0-9]{48}`                   | High       |
| AWS Keys        | `AKIA[0-9A-Z]{16}`                                  | Critical   |
| Google API Keys | `AIza[0-9A-Za-z_-]{35}`                             | High       |
| GitHub Tokens   | `gh[pousr]_[A-Za-z0-9_]{36}`                        | High       |
| Slack Tokens    | `xox[baprs]-[0-9a-zA-Z]{10,48}`                     | Medium     |
| JWT Tokens      | `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` | Medium     |
| Database URLs   | `(mongodb\|mysql\|postgres)://[^\s]+`               | Critical   |

## 📊 Security Reporting

### Artifacts Generated

1. **NPM Audit Reports**
   - `audit-report.json` - Detailed vulnerability data
   - `audit-summary.txt` - Human-readable summary
   - Retention: 30 days

2. **License Reports**
   - `license-summary.txt` - License distribution
   - `license-report.json` - Detailed license data
   - Retention: 30 days

3. **Software Bill of Materials (SBOM)**
   - `sbom.json` - CycloneDX format SBOM
   - Retention: 90 days

### Security Summary Dashboard

Each workflow run generates a security summary in the GitHub Actions summary, including:

- Status of each security tool
- Vulnerability counts
- License compliance status
- Secret scanning results
- Recommendations for remediation

## 🚨 Security Thresholds

### Vulnerability Severity Actions

| Severity | Action                      | Build Impact         |
| -------- | --------------------------- | -------------------- |
| Critical | Fail build immediately      | ❌ Blocks deployment |
| High     | Warn (configurable to fail) | ⚠️ Requires review   |
| Moderate | Report only                 | ✅ Continues         |
| Low      | Report only                 | ✅ Continues         |

### License Compliance

**Allowed Licenses:**

- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- ISC
- Unlicense

**Flagged Licenses:**

- GPL (all versions)
- AGPL
- LGPL
- CDDL
- EPL

## 🔧 Configuration and Customization

### Environment Variables

```bash
# Optional: GitLeaks Pro license
GITLEAKS_LICENSE=your_license_key

# Optional: Semgrep App token for enhanced features
SEMGREP_APP_TOKEN=your_semgrep_token

# Required: GitHub token (automatically provided)
GITHUB_TOKEN=github_token
```

### Customizing Security Rules

1. **GitLeaks Rules**: Edit `.gitleaks.toml`
2. **Semgrep Rules**: Modify the `config` section in workflows
3. **Custom Patterns**: Update the custom pattern search scripts
4. **Severity Thresholds**: Adjust `--audit-level` parameters

## 📋 Security Checklist

### Before Each Release

- [ ] All security workflows pass
- [ ] No critical or high vulnerabilities
- [ ] License compliance verified
- [ ] No secrets detected in code
- [ ] SBOM generated and reviewed
- [ ] Security artifacts archived

### Monthly Security Review

- [ ] Review flagged licenses
- [ ] Update security tool versions
- [ ] Review and update secret patterns
- [ ] Audit environment variable usage
- [ ] Review security workflow performance

## 🛠️ Troubleshooting

### Common Issues

1. **False Positive Secrets**
   - Add patterns to `.gitleaks.toml` allowlist
   - Use stopwords for common false positives
   - Exclude specific file paths

2. **License Compliance Failures**
   - Review flagged packages
   - Find alternative packages with compatible licenses
   - Document business justification for exceptions

3. **Audit Failures**
   - Run `npm audit fix` locally
   - Update vulnerable dependencies
   - Use `npm audit --force` for breaking changes

### Getting Help

- Check workflow logs in GitHub Actions
- Review security artifacts for detailed information
- Consult tool documentation:
  - [GitLeaks](https://github.com/gitleaks/gitleaks)
  - [TruffleHog](https://github.com/trufflesecurity/trufflehog)
  - [Semgrep](https://semgrep.dev/)
  - [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## 🔄 Continuous Improvement

Our security pipeline is continuously evolving. We regularly:

- Update security tool versions
- Add new detection patterns
- Refine false positive filters
- Enhance reporting capabilities
- Integrate new security tools

## 📞 Security Contact

For security-related questions or to report vulnerabilities:

- Create an issue in the repository
- Follow responsible disclosure practices
- Include detailed reproduction steps
- Provide impact assessment

---

**Last Updated:** January 2024
**Next Review:** Monthly
**Maintained By:** Development Team
