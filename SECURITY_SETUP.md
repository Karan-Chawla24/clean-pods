# Security CI/CD Setup Guide

This guide explains how to set up and use the security CI/CD pipeline for the Clean Pods project.

## 🚀 Quick Start

### 1. Local Security Checks

Run security checks locally before committing:

```bash
# Run all security checks
npm run security:check-all

# Individual security checks
npm run security:audit          # NPM vulnerability audit
npm run security:licenses       # License compliance check
npm run security:secrets        # Basic secret scanning

# Generate detailed reports
npm run security:audit-report    # Generate audit JSON/text reports
npm run security:licenses-report # Generate license JSON/text reports

# Fix vulnerabilities automatically
npm run security:audit-fix       # Auto-fix npm vulnerabilities

# Pre-commit checks (recommended before every commit)
npm run security:pre-commit      # Lint + Security + TypeScript check
```

### 2. Pre-commit Hooks (Recommended)

Install pre-commit hooks to automatically run security checks:

```bash
# Install pre-commit (requires Python)
pip install pre-commit

# Install the hooks
pre-commit install

# Test the hooks
pre-commit run --all-files
```

## 🔒 CI/CD Workflows

### Automated Workflows

Three main workflows run automatically:

1. **Security Audit** (`security-audit.yml`)
   - NPM vulnerability scanning
   - Dependency review (PR only)
   - Software composition analysis
   - License compliance checking
   - SBOM generation

2. **Secret Scanning** (`secret-scanning.yml`)
   - GitLeaks secret detection
   - TruffleHog entropy analysis
   - Semgrep security patterns
   - Custom secret pattern matching
   - Environment variable auditing

3. **Comprehensive CI** (`ci.yml`)
   - Combines all security checks
   - Code quality and linting
   - Build and test verification
   - Integrated security gates

### Workflow Triggers

- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop` branches
- **Daily Schedule** (2 AM UTC for audit, 3 AM UTC for secrets)

## 🛡️ Security Tools Configuration

### GitLeaks Configuration

Custom secret detection patterns in `.gitleaks.toml`:

- Razorpay API keys
- Clerk authentication tokens
- Upstash Redis credentials
- AWS, Google, GitHub, Slack tokens
- Database connection strings
- Custom allowlist for false positives

### Supported Secret Patterns

| Service  | Pattern Example             | Risk Level |
| -------- | --------------------------- | ---------- |
| Razorpay | `rzp_test_1234567890123456` | High       |
| Clerk    | `sk_test_...`               | High       |
| AWS      | `AKIA1234567890123456`      | Critical   |
| Google   | `AIza...`                   | High       |
| GitHub   | `ghp_...`                   | High       |
| Slack    | `xoxb-...`                  | Medium     |

## 📊 Security Reports

### Artifacts Generated

Each workflow run generates downloadable artifacts:

1. **NPM Audit Reports** (30 days retention)
   - `audit-report.json` - Machine-readable vulnerability data
   - `audit-summary.txt` - Human-readable summary

2. **License Reports** (30 days retention)
   - `license-report.json` - Detailed license information
   - `license-summary.txt` - License distribution summary

3. **SBOM** (90 days retention)
   - `sbom.json` - Software Bill of Materials in CycloneDX format

### Security Dashboard

View security status in GitHub Actions:

- Go to **Actions** tab in GitHub
- Select any workflow run
- Check the **Summary** for security overview
- Download artifacts for detailed analysis

## ⚙️ Configuration

### Environment Variables

Optional environment variables for enhanced features:

```bash
# GitHub Secrets (configure in repository settings)
GITLEAKS_LICENSE=your_gitleaks_pro_license    # Optional: GitLeaks Pro
SEMGREP_APP_TOKEN=your_semgrep_token          # Optional: Semgrep enhanced features
```

### Customizing Security Rules

1. **GitLeaks Patterns**: Edit `.gitleaks.toml`
2. **Semgrep Rules**: Modify workflow YAML files
3. **NPM Audit Levels**: Adjust `--audit-level` in scripts
4. **License Allowlist**: Update workflow configurations

## 🚨 Security Thresholds

### Build Failure Conditions

| Condition                | Action              | Impact               |
| ------------------------ | ------------------- | -------------------- |
| Critical vulnerabilities | Fail immediately    | ❌ Blocks deployment |
| Secrets detected         | Fail immediately    | ❌ Blocks deployment |
| High vulnerabilities     | Warn (configurable) | ⚠️ Requires review   |
| Problematic licenses     | Warn                | ⚠️ Requires review   |

### Vulnerability Severity Levels

- **Critical**: Immediate security risk, blocks deployment
- **High**: Significant risk, requires prompt attention
- **Moderate**: Should be addressed in next release
- **Low**: Nice to fix, informational

## 🔧 Troubleshooting

### Common Issues

1. **False Positive Secrets**

   ```bash
   # Add to .gitleaks.toml allowlist
   [allowlist]
   regexes = [
     "your_false_positive_pattern"
   ]
   ```

2. **License Compliance Failures**

   ```bash
   # Check problematic licenses
   npm run security:licenses

   # Find alternative packages
   npm search alternative-package-name
   ```

3. **Audit Failures**

   ```bash
   # Fix automatically
   npm run security:audit-fix

   # Manual review
   npm audit
   npm update package-name
   ```

### Getting Help

- Check GitHub Actions logs for detailed error messages
- Review security artifacts for comprehensive analysis
- Consult tool documentation:
  - [GitLeaks Documentation](https://github.com/gitleaks/gitleaks)
  - [NPM Audit Guide](https://docs.npmjs.com/cli/v8/commands/npm-audit)
  - [Semgrep Rules](https://semgrep.dev/explore)

## 📋 Security Checklist

### Before Each Commit

- [ ] Run `npm run security:pre-commit`
- [ ] Review any security warnings
- [ ] Ensure no secrets in code
- [ ] Verify license compliance

### Before Each Release

- [ ] All CI workflows pass
- [ ] No critical/high vulnerabilities
- [ ] Security artifacts reviewed
- [ ] SBOM generated and archived
- [ ] Security documentation updated

### Monthly Security Review

- [ ] Update security tool versions
- [ ] Review and update secret patterns
- [ ] Audit dependency licenses
- [ ] Review security workflow performance
- [ ] Update security documentation

## 🆘 Reporting Security Issues

Use the GitHub issue template for security vulnerabilities:

1. Go to **Issues** → **New Issue**
2. Select **Security Vulnerability Report**
3. Fill out the template completely
4. For critical issues, contact maintainers privately first

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [NPM Security Best Practices](https://docs.npmjs.com/security)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Last Updated:** January 2024  
**Maintained By:** Development Team  
**Next Review:** Monthly
