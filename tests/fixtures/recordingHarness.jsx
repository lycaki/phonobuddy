/* eslint-disable react-refresh/only-export-components -- Test-only imperative hook harness, not an application view. */
import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useRecordings } from '../../src/hooks/useRecordings';

function Harness() {
  const api = useRecordings(null);
  useEffect(() => { window.recordingApi = api; }, [api]);
  return null;
}

export function mountRecordingHarness() {
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  root.render(createElement(Harness));
  return root;
}
