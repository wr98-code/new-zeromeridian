/**
 * Portfolio.tsx — ZERØ MERIDIAN 2026 push82
 * push82: Coming Soon — requires user auth + wallet connect.
 */
import React from 'react';
import ComingSoon from '@/components/shared/ComingSoon';

const Portfolio: React.FC = () => (
  <ComingSoon
    title="Portfolio Tracker"
    description="Track your holdings, PnL, and performance. Requires wallet connection or manual entry — coming with auth system."
    icon="💼"
    eta="push86"
  />
);

Portfolio.displayName = 'Portfolio';
export default React.memo(Portfolio);
