import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const severities = new Set(['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const blockingSeverities = new Set(['HIGH', 'CRITICAL']);

function identifier(value) {
  return typeof value === 'string' && /^[@a-zA-Z0-9_.:/+-]{1,200}$/.test(value)
    ? value
    : 'UNKNOWN';
}

function version(value) {
  return typeof value === 'string' &&
    /^[a-zA-Z0-9.+_~^<>=*, |/-]{1,200}$/.test(value)
    ? value
    : 'UNKNOWN';
}

function line(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

// Never copy Match, Code, Message, Title, Description or arbitrary SDK metadata.
export function sanitizeReport(raw) {
  if (
    !raw ||
    !Number.isInteger(raw.SchemaVersion) ||
    !Array.isArray(raw.Results)
  ) {
    throw new Error('Unsupported security report');
  }
  const findings = [];
  for (const result of raw.Results) {
    if (!result || typeof result.Target !== 'string')
      throw new Error('Invalid scan target');
    const file = result.Target.replace(/[\u0000-\u001f\u007f]/g, '').slice(
      0,
      500,
    );
    for (const [key, type] of [
      ['Vulnerabilities', 'vulnerability'],
      ['Misconfigurations', 'misconfiguration'],
      ['Secrets', 'secret'],
    ]) {
      const entries = result[key] ?? [];
      if (!Array.isArray(entries)) throw new Error('Invalid finding list');
      for (const entry of entries) {
        if (!entry || !severities.has(entry.Severity))
          throw new Error('Invalid severity');
        if (
          type === 'misconfiguration' &&
          ['PASS', 'EXCEPTION'].includes(entry.Status)
        )
          continue;
        findings.push({
          type,
          file,
          id: identifier(entry.VulnerabilityID ?? entry.ID ?? entry.RuleID),
          severity: entry.Severity,
          ...(type === 'vulnerability'
            ? {
                package: identifier(entry.PkgName),
                installedVersion: version(entry.InstalledVersion),
                fixedVersion: entry.FixedVersion
                  ? version(entry.FixedVersion)
                  : null,
              }
            : {
                startLine: line(
                  entry.StartLine ?? entry.CauseMetadata?.StartLine,
                ),
                endLine: line(entry.EndLine ?? entry.CauseMetadata?.EndLine),
              }),
        });
      }
    }
  }
  const counts = Object.fromEntries(
    ['vulnerability', 'misconfiguration', 'secret'].map((type) => [
      type,
      findings.filter((finding) => finding.type === type).length,
    ]),
  );
  const blockingCount = findings.filter(
    (finding) =>
      finding.type === 'secret' || blockingSeverities.has(finding.severity),
  ).length;
  return { schemaVersion: 1, counts, blockingCount, findings };
}

export function renderSummary(report) {
  const escapeCell = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('|', '&#124;')
      .replaceAll('`', '&#96;')
      .replaceAll('[', '&#91;')
      .replaceAll(']', '&#93;');
  const rows = report.findings
    .slice(0, 100)
    .map(
      (finding) =>
        `| ${finding.type} | ${finding.severity} | ${escapeCell(finding.id)} | ${escapeCell(finding.file)}${finding.startLine ? `:${finding.startLine}` : ''} |`,
    );
  return [
    '## Security - Trivy',
    '',
    '| Scanner | Findings |',
    '| --- | ---: |',
    `| Vulnerabilities | ${report.counts.vulnerability} |`,
    `| Misconfigurations | ${report.counts.misconfiguration} |`,
    `| Secrets | ${report.counts.secret} |`,
    '',
    `**Policy: ${report.blockingCount ? 'FAIL' : 'PASS'}** (${report.blockingCount} blocking findings).`,
    'HIGH/CRITICAL vulnerabilities or misconfigurations and every detected secret block this job.',
    'Unfixed vulnerabilities are included. No dependency changes are applied automatically.',
    '',
    '| Type | Severity | Rule / CVE | Location |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    'Only the first 100 findings are listed here. Download trivy-security-report for all sanitized findings.',
    'Secret values and source snippets are omitted. This scans the checked-out tree, not Git history.',
    '',
  ].join('\n');
}

function main() {
  const rawPath = process.env.TRIVY_RAW_REPORT;
  try {
    if (
      !rawPath ||
      !process.env.TRIVY_SAFE_REPORT ||
      !process.env.GITHUB_STEP_SUMMARY
    ) {
      throw new Error('Missing report paths');
    }
    const report = sanitizeReport(JSON.parse(readFileSync(rawPath, 'utf8')));
    mkdirSync(dirname(process.env.TRIVY_SAFE_REPORT), { recursive: true });
    writeFileSync(
      process.env.TRIVY_SAFE_REPORT,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, 'report-ready=true\n');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, renderSummary(report));
    console.log(
      `Security report published: ${report.blockingCount} blocking findings.`,
    );
    process.exitCode = report.blockingCount ? 1 : 0;
  } catch {
    // Parser errors can include input fragments: emit only a fixed message.
    console.error(
      'Security scan report is missing or invalid; refusing to pass the security job.',
    );
    process.exitCode = 1;
  } finally {
    if (rawPath) rmSync(rawPath, { force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main();
