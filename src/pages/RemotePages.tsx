import { Component, lazy, Suspense, type ReactNode } from 'react';
import { coreApi, ingestApi, matchApi } from '../lib/api';
import { EmptyState, Spinner } from '../ui';

const JobsFeed = lazy(() => import('jobsFeed/JobsFeed'));
const Insights = lazy(() => import('insights/Insights'));

/** A micro frontend that is down must not take the shell with it. */
class RemoteBoundary extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <EmptyState title={`${this.props.name} is unavailable`} hint="The micro frontend could not be loaded. Is it running?" />;
    }
    return this.props.children;
  }
}

export function JobsPage() {
  return (
    <RemoteBoundary name="Jobs feed">
      <Suspense fallback={<Spinner label="Loading jobs feed" />}>
        <JobsFeed http={matchApi} />
      </Suspense>
    </RemoteBoundary>
  );
}

export function InsightsPage() {
  return (
    <RemoteBoundary name="Insights">
      <Suspense fallback={<Spinner label="Loading insights" />}>
        <Insights core={coreApi} ingest={ingestApi} match={matchApi} />
      </Suspense>
    </RemoteBoundary>
  );
}
