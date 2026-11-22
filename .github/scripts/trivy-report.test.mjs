import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { sanitizeReport, renderSummary } from './trivy-report.mjs';

const reportWith = (fields) => ({
  SchemaVersion: 2,
  Results: [{ Target: 'app/config.ts', ...fields }],
});
const sentinel = 'SYNTHETIC_PRIVATE_VALUE_MUST_NEVER_BE_PUBLISHED';

test('preserves scoped package names and multiple safe fixed versions', () => {
  const report = sanitizeReport(
    reportWith({
      Vulnerabilities: [
        {
          VulnerabilityID: 'CVE-2026-1234',
          PkgName: '@example/package',
          InstalledVersion: '1.0.0-beta.1',
          FixedVersion: '1.2.3, 2.0.1',
          Severity: 'HIGH',
        },
      ],
    }),
  );
  assert.equal(report.findings[0].package, '@example/package');
  assert.equal(report.findings[0].fixedVersion, '1.2.3, 2.0.1');
});

test('keeps secret locations while removing matched values, snippets and arbitrary metadata', () => {
  const report = sanitizeReport(
    reportWith({
      Secrets: [
        {
          RuleID: 'test-rule',
          Severity: 'LOW',
          StartLine: 7,
          EndLine: 8,
          Match: sentinel,
          Title: sentinel,
          Code: { Lines: [{ Content: sentinel }] },
          Nested: { secret: sentinel },
        },
      ],
      Metadata: { secret: sentinel },
    }),
  );
  assert.deepEqual(report.findings, [
    {
      type: 'secret',
      file: 'app/config.ts',
      id: 'test-rule',
      severity: 'LOW',
      startLine: 7,
      endLine: 8,
    },
  ]);
  assert.equal(report.blockingCount, 1);
  assert.ok(!JSON.stringify(report).includes(sentinel));
  assert.ok(!renderSummary(report).includes(sentinel));
});

for (const severity of ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
  test(`enforces severity policy for ${severity} without dropping unfixed findings`, () => {
    const report = sanitizeReport(
      reportWith({
        Vulnerabilities: [
          {
            VulnerabilityID: 'CVE-2026-1234',
            PkgName: 'example',
            InstalledVersion: '1.0.0',
            Severity: severity,
          },
        ],
        Misconfigurations: [
          { ID: 'AVD-TEST-0001', Severity: severity, Status: 'FAIL' },
        ],
        Secrets: [{ RuleID: 'test-secret', Severity: severity }],
      }),
    );
    assert.deepEqual(report.counts, {
      vulnerability: 1,
      misconfiguration: 1,
      secret: 1,
    });
    assert.equal(report.findings[0].fixedVersion, null);
    assert.equal(
      report.blockingCount,
      ['HIGH', 'CRITICAL'].includes(severity) ? 3 : 1,
    );
  });
}

test('passes clean reports and nonblocking findings, excluding passed configuration checks', () => {
  assert.equal(
    sanitizeReport({ SchemaVersion: 2, Results: [] }).blockingCount,
    0,
  );
  const report = sanitizeReport(
    reportWith({
      Vulnerabilities: [
        { VulnerabilityID: 'CVE-2026-1234', Severity: 'MEDIUM' },
      ],
      Misconfigurations: [
        { ID: 'AVD-TEST-0001', Severity: 'HIGH', Status: 'PASS' },
      ],
    }),
  );
  assert.equal(report.blockingCount, 0);
  assert.equal(report.findings.length, 1);
});

test('rejects malformed reports and unknown severity instead of silently passing', () => {
  for (const raw of [
    null,
    {},
    { SchemaVersion: 2 },
    reportWith({ Secrets: {} }),
    reportWith({ Secrets: [{ Severity: 'UNEXPECTED' }] }),
  ]) {
    assert.throws(() => sanitizeReport(raw));
  }
});

test('escapes Markdown locations and limits summary rows without truncating the artifact', () => {
  const report = sanitizeReport({
    SchemaVersion: 2,
    Results: [
      {
        Target: '<img>|[link]`\n',
        Secrets: Array.from({ length: 101 }, () => ({
          RuleID: 'test-rule',
          Severity: 'HIGH',
        })),
      },
    ],
  });
  const summary = renderSummary(report);
  assert.equal(report.findings.length, 101);
  assert.equal(summary.split('| secret |').length - 1, 100);
  assert.ok(!summary.includes('<img>'));
  assert.ok(summary.includes('&lt;img&gt;&#124;&#91;link&#93;&#96;'));
});

for (const scenario of ['clean', 'blocking', 'invalid', 'missing']) {
  test(`CLI ${scenario}: publishes only sanitized data, removes raw report and returns the right status`, (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'trivy-report-test-'));
    const paths = Object.fromEntries(
      ['raw', 'safe', 'summary', 'output'].map((name) => [
        name,
        join(directory, name),
      ]),
    );
    t.after(() => {
      for (const file of Object.values(paths)) rmSync(file, { force: true });
      rmdirSync(directory);
    });
    if (scenario !== 'missing') {
      const raw =
        scenario === 'clean'
          ? { SchemaVersion: 2, Results: [] }
          : reportWith({
              Secrets: [
                {
                  RuleID: 'test-rule',
                  Severity: 'LOW',
                  Match: sentinel,
                  Code: { content: sentinel },
                },
              ],
            });
      writeFileSync(
        paths.raw,
        scenario === 'invalid' ? `{ invalid ${sentinel}` : JSON.stringify(raw),
      );
    }
    const child = spawnSync(
      process.execPath,
      [resolve('.github/scripts/trivy-report.mjs')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          TRIVY_RAW_REPORT: paths.raw,
          TRIVY_SAFE_REPORT: paths.safe,
          GITHUB_STEP_SUMMARY: paths.summary,
          GITHUB_OUTPUT: paths.output,
        },
      },
    );
    assert.equal(child.status, scenario === 'clean' ? 0 : 1);
    assert.ok(!existsSync(paths.raw));
    let publicOutput = child.stdout + child.stderr;
    for (const file of [paths.safe, paths.summary, paths.output]) {
      if (existsSync(file)) publicOutput += readFileSync(file, 'utf8');
    }
    assert.ok(!publicOutput.includes(sentinel));
    if (['clean', 'blocking'].includes(scenario)) {
      assert.ok(existsSync(paths.safe));
      assert.match(readFileSync(paths.output, 'utf8'), /report-ready=true/);
    } else {
      assert.ok(!existsSync(paths.safe));
    }
  });
}
