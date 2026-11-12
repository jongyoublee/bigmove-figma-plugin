import React from 'react';
import { Composition } from 'remotion';
import { BeVsPhase1, TOTAL } from './BeVsPhase1';
import { Phase1Pk, PK_TOTAL } from './Phase1Pk';
import { SfxTest, SFX_TEST_TOTAL } from './SfxTest';

export const Root: React.FC = () => (
  <>
    <Composition id="Phase1Pk" component={Phase1Pk} durationInFrames={PK_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="BeVsPhase1" component={BeVsPhase1} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="SfxTest" component={SfxTest} durationInFrames={SFX_TEST_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
