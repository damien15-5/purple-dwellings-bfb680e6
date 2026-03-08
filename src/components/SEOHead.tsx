import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  type?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'Xavorian';
const BASE_URL = 'https://www.xavorian.xyz';
const DEFAULT_DESCRIPTION = "Nigeria's trusted property marketplace. Buy, sell, and rent verified properties with secure transactions.";

export const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  type = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Nigeria's Secure Property Marketplace`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
