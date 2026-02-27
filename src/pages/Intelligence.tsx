/**
 * Intelligence.tsx — ZERØ MERIDIAN 2026 push82
 * push82: Coming Soon — Messari + Santiment paid API keys required.
 */
import React from 'react';
import ComingSoon from '@/components/shared/ComingSoon';

const Intelligence: React.FC = () => (
  <ComingSoon
    title="Market Intelligence"
    description="Deep fundamental analysis, social sentiment, and narrative tracking via Messari & Santiment. Requires Pro tier API keys."
    icon="🧠"
    eta="push85"
  />
);

Intelligence.displayName = 'Intelligence';
export default React.memo(Intelligence);
