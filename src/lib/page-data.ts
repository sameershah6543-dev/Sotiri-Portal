import { cache } from "react";
import { getMergedState } from "@/db/queries";

// Dedupes to a single DB round trip per request — every page on a route calls
// this independently, but React's cache() collapses repeats within one render.
export const getPageData = cache(getMergedState);
