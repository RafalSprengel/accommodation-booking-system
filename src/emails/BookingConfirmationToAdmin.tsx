import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { ISiteSettings } from '../db/models/SiteSettings';

interface BookingConfirmationToAdminProps {
  customerName: string;
  orderNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  paidAmount?: number;
  siteSettings: Partial<ISiteSettings>;
  guestPhone?: string;
  guestEmail?: string;
  guestAddress?: string;
  adults?: number;
  propertyName?: string;
  children?: number;
  extraBeds?: number;
  orderDate?: string;
  invoiceRequested?: boolean;
  companyName?: string;
  nip?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  cabinsCount?: number;
  adminNotes?: string;
}

export default function BookingConfirmationToAdmin({
  customerName,
  orderNumber,
  checkIn,
  checkOut,
  totalPrice,
  paidAmount,
  siteSettings,
  guestPhone,
  guestEmail,
  guestAddress,
  propertyName,
  adults,
  children,
  extraBeds,
  orderDate,
  invoiceRequested,
  companyName,
  nip,
  street,
  city,
  postalCode,
  cabinsCount,
  adminNotes,
}: BookingConfirmationToAdminProps) {
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

  const badgeStyle = {
    display: 'inline-block' as const,
    backgroundColor: '#22c55e',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    padding: '4px 12px',
    borderRadius: '4px',
    marginBottom: '20px',
  };

  const textStyle = {
    fontSize: '16px',
    color: '#4d4d4d',
    lineHeight: '1.5',
  };

  const sectionStyle = {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '4px',
    margin: '20px 0',
  };

  const sectionTextStyle = {
    fontSize: '14px',
    margin: '8px 0',
    color: '#333',
  };

  const hrStyle = {
    borderColor: '#e6ebf1',
    margin: '15px 0',
  };

  const sumStyle = {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
  };

  const footerTextStyle = {
    fontSize: '12px',
    color: '#8898aa',
    lineHeight: '1.4',
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Text style={badgeStyle}>New online booking</Text>
          <Heading style={headingStyle}>
            Accommodation Booking System - admin panel
          </Heading>
          <Text style={textStyle}>
            A new booking has been registered and successfully paid online.
          </Text>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}><strong>Guest:</strong> {customerName}</Text>
            {guestPhone && (
              <Text style={sectionTextStyle}><strong>Guest phone:</strong> {guestPhone}</Text>
            )}
            {guestEmail && (
              <Text style={sectionTextStyle}><strong>Guest email:</strong> {guestEmail}</Text>
            )}
            {guestAddress && (
              <Text style={sectionTextStyle}><strong>Guest address:</strong> {guestAddress}</Text>
            )}
            {propertyName && (
              <Text style={sectionTextStyle}><strong>Property:</strong> {propertyName}</Text>
            )}
            {(typeof cabinsCount !== 'undefined' && cabinsCount > 1) && (
              <Text style={sectionTextStyle}><strong>Number of cottages:</strong> {cabinsCount}</Text>
            )}
            {(typeof adults !== 'undefined') && (
              <Text style={sectionTextStyle}><strong>Adults:</strong> {adults}</Text>
            )}
            {(typeof children !== 'undefined') && (
              <Text style={sectionTextStyle}><strong>Children (free):</strong> {children}</Text>
            )}
            {(typeof extraBeds !== 'undefined') && (
              <Text style={sectionTextStyle}><strong>Extra beds:</strong> {extraBeds}</Text>
            )}
            {orderDate && (
              <Text style={sectionTextStyle}><strong>Order date:</strong> {orderDate}</Text>
            )}
            <Text style={sectionTextStyle}><strong>Order No:</strong> {orderNumber}</Text>

            <Text style={sectionTextStyle}><strong>Check-in:</strong> {checkIn}</Text>
            <Text style={sectionTextStyle}><strong>Check-out:</strong> {checkOut}</Text>
            {adminNotes && (
              <Text style={sectionTextStyle}><strong>Internal notes:</strong> {adminNotes}</Text>
            )}

            <Text style={sectionTextStyle}><strong>VAT Invoice:</strong>{!invoiceRequested && ' No'}</Text>
            {invoiceRequested && (<>
              <Section style={{ padding: '10px', backgroundColor: '#fff' }}>
                {companyName && <Text style={sectionTextStyle}><strong>Company name:</strong> {companyName}</Text>}
                {nip && <Text style={sectionTextStyle}><strong>Tax ID (NIP):</strong> {nip}</Text>}
                {street && <Text style={sectionTextStyle}><strong>Street:</strong> {street}</Text>}
                {postalCode && <Text style={sectionTextStyle}><strong>Postal code:</strong> {postalCode}</Text>}
                {city && <Text style={sectionTextStyle}><strong>City:</strong> {city}</Text>}
              </Section>
            </>)}

            <Hr style={hrStyle} />
            {typeof paidAmount === 'number' && paidAmount !== totalPrice ? (
              <>
                <Text style={sumStyle}>Paid: {Number(paidAmount).toFixed(2)} zł</Text>
                <Text style={sectionTextStyle}>Remaining to pay: {Number(totalPrice - paidAmount).toFixed(2)} zł</Text>
              </>
            ) : (
              <Text style={sumStyle}>Amount: {Number(totalPrice).toFixed(2)} PLN</Text>
            )}

            <Hr style={hrStyle} />
          </Section>

          <Text style={footerTextStyle}>
            This message was automatically generated by the Accommodation Booking System.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}