import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { FactorResult, Verdict } from "@/lib/rules/status";

/**
 * Server-rendered Employment Status Determination PDF (FR-1.4).
 * A determination follows fixed legal rules, so it carries a rules-engine
 * version — NOT a VerificationSeal (determinations are deterministic, not
 * examined; CLAUDE.md Rule 1). Uses react-pdf's built-in Helvetica to avoid a
 * woff2/ttf font dependency; brand colours match the design system.
 */

export interface DeterminationPdfData {
  reference: string;
  dateStr: string;
  businessName: string;
  subjectName: string;
  verdict: Verdict;
  verdictLabel: string;
  confidence: string;
  reasoning: string;
  factors: FactorResult[];
  rulesVersion: string;
  ambiguousAcknowledged: boolean;
}

const INK = "#0E1B2C";
const GREEN = "#178055";
const AMBER = "#96540A";
const NEUTRAL = "#5A626C";
const HAIRLINE = "#D8D3C8";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: INK, backgroundColor: "#FFFDF8" },
  kicker: { fontSize: 8, letterSpacing: 1.5, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 },
  subject: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  company: { fontSize: 11, color: NEUTRAL, marginBottom: 18 },
  metaRow: { flexDirection: "row", borderTop: `1pt solid ${HAIRLINE}`, borderBottom: `1pt solid ${HAIRLINE}`, paddingVertical: 10, marginBottom: 18 },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 8, letterSpacing: 1, color: NEUTRAL, textTransform: "uppercase", marginBottom: 3 },
  metaValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  verdictBox: { padding: 14, borderRadius: 6, marginBottom: 16 },
  verdictLabelSm: { fontSize: 8, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  verdictValue: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  sectionHead: { fontSize: 8, letterSpacing: 1.2, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6, marginTop: 6 },
  reasoning: { fontSize: 10.5, lineHeight: 1.5, marginBottom: 18 },
  factorRow: { borderBottom: `0.5pt solid ${HAIRLINE}`, paddingVertical: 7 },
  factorTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  factorName: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  factorAnswer: { fontSize: 9, color: NEUTRAL },
  factorIndicates: { fontSize: 9, color: NEUTRAL, lineHeight: 1.4, marginTop: 2 },
  factorRef: { fontSize: 8, color: NEUTRAL, marginTop: 2, fontFamily: "Helvetica-Oblique" },
  chip: { marginTop: 18, padding: 10, backgroundColor: "rgba(14,27,44,0.05)", borderRadius: 6, fontSize: 8.5, color: NEUTRAL, lineHeight: 1.4 },
  disclaimer: { marginTop: 12, fontSize: 8, color: NEUTRAL, lineHeight: 1.4 },
  ackNote: { marginTop: 8, fontSize: 9, color: AMBER, fontFamily: "Helvetica-Bold" },
});

function DeterminationDoc({ d }: { d: DeterminationPdfData }) {
  const isAmbiguous = d.confidence === "ambiguous";
  const accent = isAmbiguous ? AMBER : GREEN;
  return (
    <Document title={`Employment status determination — ${d.subjectName}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Employment status determination</Text>
        <Text style={s.subject}>{d.subjectName}</Text>
        <Text style={s.company}>{d.businessName}</Text>

        <View style={s.metaRow}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Reference</Text>
            <Text style={s.metaValue}>{d.reference}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaValue}>{d.dateStr}</Text>
          </View>
        </View>

        <View style={[s.verdictBox, { backgroundColor: isAmbiguous ? "#FAEEDC" : "#E4F3EC" }]}>
          <Text style={[s.verdictLabelSm, { color: accent }]}>Determination</Text>
          <Text style={[s.verdictValue, { color: accent }]}>
            {isAmbiguous ? "Uncertain — advice recommended" : d.verdictLabel}
          </Text>
        </View>

        <Text style={s.sectionHead}>In plain English</Text>
        <Text style={s.reasoning}>{d.reasoning}</Text>

        {d.ambiguousAcknowledged && (
          <Text style={s.ackNote}>
            You were advised to seek professional advice and chose to proceed. This choice is recorded with the determination.
          </Text>
        )}

        <Text style={s.sectionHead}>How we reached this</Text>
        <View>
          {d.factors.map((f) => (
            <View key={f.id} style={s.factorRow} wrap={false}>
              <View style={s.factorTop}>
                <Text style={s.factorName}>{f.factor}</Text>
                <Text style={s.factorAnswer}>Your answer: {f.answerLabel}</Text>
              </View>
              <Text style={s.factorIndicates}>{f.indicates}</Text>
              <Text style={s.factorRef}>{f.reference.reference}</Text>
            </View>
          ))}
        </View>

        <Text style={s.chip}>
          Generated by the FirstEmployer status rules engine {d.rulesVersion}. A determination follows fixed legal
          rules, so it is calculated — not examined — and will be byte-identical for the same answers.
        </Text>
        <Text style={s.disclaimer}>
          This determination is guidance based on the answers you gave and the leading tests for employment status. It
          is not legal advice. If your working arrangement changes, re-run the check. For contentious or borderline
          cases, seek advice from Acas or an employment solicitor.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderDeterminationPdf(d: DeterminationPdfData): Promise<Buffer> {
  return renderToBuffer(<DeterminationDoc d={d} />);
}
