import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { ISiteSettings } from "../db/models/SiteSettings";
import { siteSettingsDefaults } from "../lib/siteSettingsDefaults";

interface ContactAdminNotificationProps {
  senderName: string;
  senderEmail: string;
  message: string;
  siteSettings?: Partial<ISiteSettings>;
}

export const ContactAdminNotification = ({
  senderName,
  senderEmail,
  message,
  siteSettings,
}: ContactAdminNotificationProps) => {
  const contactEmail = siteSettings?.email || siteSettingsDefaults.email;
  const contactPhone = siteSettings?.phone || siteSettingsDefaults.phone;

  const mainStyle = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  };

  const containerStyle = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 20px",
    borderRadius: "8px",
    border: "1px solid #e6ebf1",
    maxWidth: "600px",
  };

  const headingStyle = {
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "bold" as const,
    lineHeight: "1.2",
  };

  const sectionStyle = {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "4px",
    margin: "20px 0",
  };

  const sectionTextStyle = {
    fontSize: "14px",
    margin: "8px 0",
    color: "#333",
  };

  const messageStyle = {
    ...sectionTextStyle,
    whiteSpace: "pre-wrap" as const,
  };

  const footerTextStyle = {
    fontSize: "12px",
    color: "#8898aa",
    lineHeight: "1.4",
  };

  const footerHrStyle = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
  };

  const footerLinkStyle = {
    color: "#0070f3",
    fontSize: "12px",
    textDecoration: "none",
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>
            New message from the contact form
          </Heading>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}>
              <strong>Name:</strong> {senderName}
            </Text>
            <Text style={sectionTextStyle}>
              <strong>Email:</strong> {senderEmail}
            </Text>
            <Text style={sectionTextStyle}>
              <strong>Message:</strong>
            </Text>
            <Text style={messageStyle}>{message}</Text>
          </Section>

          <Text style={footerTextStyle}>
            Reply directly to this message or contact us via{" "}
            {contactEmail} / {contactPhone}.
          </Text>
          <Hr style={footerHrStyle} />
          <Link href="http://accommodation.rafalsprengel.com/" style={footerLinkStyle}>
            wolflodges.pl
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactAdminNotification;