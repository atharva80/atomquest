import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface EscalationResolvedEmailProps {
  recipientName: string;
  escalationType: string;
  targetEmployee: string;
  resolvedBy: string;
  appUrl: string;
}

const escalationTypeMessages: Record<string, string> = {
  goal_not_submitted: 'goal submission',
  goal_not_approved: 'goal approval',
  checkin_not_completed: 'check-in completion'
};

export function EscalationResolvedEmail({
  recipientName,
  escalationType,
  targetEmployee,
  resolvedBy,
  appUrl
}: EscalationResolvedEmailProps) {
  const typeMessage = escalationTypeMessages[escalationType] || 'issue';

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#16a34a', fontSize: '20px', marginBottom: '8px' }}>
            ✅ Escalation Resolved
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {recipientName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            The escalation for <strong>{targetEmployee}</strong> regarding {typeMessage} has been resolved by <strong>{resolvedBy}</strong>.
          </Text>
          <Text style={{ color: '#71717a', marginTop: '8px' }}>
            No further action is required on your part.
          </Text>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}