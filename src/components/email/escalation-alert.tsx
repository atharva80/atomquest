import { Html, Head, Body, Container, Text, Button, Preview, Section, Heading, Hr } from '@react-email/components';

interface EscalationAlertProps {
  recipientName: string;
  escalationType: string;
  targetEmployee: string;
  daysPending: number;
  dashboardUrl: string;
}

export function EscalationAlertEmail({ recipientName, escalationType, targetEmployee, daysPending, dashboardUrl }: EscalationAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>⚠️ Escalation Alert: Pending Action Required</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AtomQuest</Heading>
          <Hr style={hr} />
          <Section style={section}>
            <Heading style={h2}>Escalation Alert</Heading>
            <Text style={text}>
              Hi {recipientName},
            </Text>
            <Text style={text}>
              This is an automated escalation alert. <strong>{targetEmployee}</strong> has not completed their <strong>{escalationType}</strong>.
            </Text>
            <div style={alertBox}>
              <Text style={{ ...text, color: '#991b1b', margin: 0, fontWeight: 'bold' }}>
                Pending for: {daysPending} days
              </Text>
            </div>
            <Text style={text}>
              Please review the pending actions in your dashboard and follow up with the employee.
            </Text>
            <Button style={btn} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>
          <Text style={footer}>
            This is an automated message from the AtomQuest Goal Portal.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' };
const container = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '40px auto', padding: '20px 0 40px', maxWidth: '600px' };
const section = { padding: '0 40px' };
const h1 = { color: '#4f46e5', fontSize: '24px', fontWeight: 'bold', padding: '0 40px', margin: '20px 0 10px' };
const h2 = { color: '#dc2626', fontSize: '20px', fontWeight: '600', margin: '16px 0' };
const text = { color: '#475569', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const alertBox = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '16px', margin: '20px 0' };
const btn = { backgroundColor: '#dc2626', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 24px', marginTop: '16px' };
const hr = { borderColor: '#f1f5f9', margin: '20px 0' };
const footer = { color: '#94a3b8', fontSize: '12px', padding: '0 40px', marginTop: '30px' };
