import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fill every autopilot channel's upcoming slots with videos.
crons.interval("plan autopilot", { minutes: 15 }, internal.autopilot.planAll, {});
// Poll the render provider for videos whose webhook is late.
crons.interval("poll renders", { minutes: 5 }, internal.pipeline.pollRenders, {});
// Publish anything due that the scheduler did not pick up.
crons.interval("dispatch due posts", { minutes: 5 }, internal.posting.dispatchDue, {});
// Snapshot metrics for recently published posts.
crons.interval("refresh metrics", { hours: 1 }, internal.metrics.refreshDue, {});

export default crons;
