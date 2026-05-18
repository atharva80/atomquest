import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface EscalationAlertEmailProps {
  recipientName: string;
  escalationType: string;
  targetEmployee: string;
  daysPending: number;
  cycleName?: string;
  escalationLevel: number;
  appUrl: string;
  actionLink: string;
}

const escalationTypeMessages: Record<string, string> = {
  goal_not_submitted: 'has not submitted their goal sheet',
  goal_not_approved: 'goals have not been approved',
  checkin_not_completed: 'has not completed their quarterly check-in'
};

export function EscalationAlertEmail({
  recipientName,
  escalationType,
  targetEmployee,
  daysPending,
  cycleName,
  escalationLevel,
  appUrl,
  actionLink
}: EscalationAlertEmailProps) {
  const levelLabel = escalationLevel === 1 ? 'First Escalation' : escalationLevel === 2 ? 'Second Escalation' : 'Final Escalation';
  const typeMessage = escalationTypeMessages[escalationType] || 'requires attention';

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#dc2626', fontSize: '20px', marginBottom: '8px' }}>
            ⚠️ Escalation Alert - {levelLabel}
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {recipientName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            <strong>{targetEmployee}</strong> {typeMessage} for <strong>{daysPending} days</strong>.
            {cycleName && <> Cycle: <strong>{cycleName}</strong></>}
          </Text>
          <Text style={{ color: '#71717a', marginTop: '8px' }}>
            This is escalation level {escalationLevel}. Please take immediate action.
          </Text>
          <Button href={actionLink} style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Take Action →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}