import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Link,
  Button
} from '@react-email/components';
import * as React from 'react';
import { ISiteSettings } from '../db/models/SiteSettings';

interface PasswordResetEmailProps {
  url: string;
  siteSettings: Partial<ISiteSettings>;
}

export const PasswordReset = ({
  url,
  siteSettings,
}: PasswordResetEmailProps) => {
  const mainStyle = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  };

  const containerStyle = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
    maxWidth: '600px',
  };

  const headingStyle = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    lineHeight: '1.2',
  };

  const textStyle = {
    fontSize: '16px',
    color: '#4d4d4d',
    lineHeight: '1.5',
  };

  const buttonStyle = {
    backgroundColor: '#222',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: 'fit-content',
    margin: '30px auto',
    padding: '12px 24px',
  };

  const footerTextStyle = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '1.4',
  };

  const footerHrStyle = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
  };

  const footerLinkStyle = {
    color: '#0070f3',
    fontSize: '12px',
    textDecoration: 'none',
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            Reset your password – Wolf Lodges
          </Heading>
          <Text style={textStyle}>
            Hello,
          </Text>
          <Text style={textStyle}>
            we received a request to reset the password for your account. Click the button below to set a new password:
          </Text>

          <Section style={{ textAlign: 'center' }}>
            <Button style={buttonStyle} href={url}>
              Set new password
            </Button>
          </Section>

          <Text style={textStyle}>
            The link is valid for a limited time. If you did not request a password reset, please ignore this message.
          </Text>

          <Hr style={footerHrStyle} />
          <Text style={footerTextStyle}>
            If you have any questions, please contact us at {siteSettings.email} or by phone at {siteSettings.phone}.
          </Text>
          <Link href="https://rafalsprengel.com" style={footerLinkStyle}>
            rafalsprengel.com
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordReset;