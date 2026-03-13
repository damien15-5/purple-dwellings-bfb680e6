import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  type?: string;
  noIndex?: boolean;
  image?: string;
}

const SITE_NAME = 'Xavorian';
const BASE_URL = 'https://www.xavorian.xyz';
const DEFAULT_DESCRIPTION = "Find trusted agents and verified property listings in Benin City, Edo State. Rent, buy or sell scam-free on Xavorian – Nigeria's trust-first real estate marketplace.";
const DEFAULT_IMAGE = `${BASE_URL}/favicon.ico`;

export const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  type = 'website',
  noIndex = false,
  image,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Verified Real Estate in Benin City, Edo State | Buy, Rent & Sell`;
  const url = `${BASE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

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
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};
