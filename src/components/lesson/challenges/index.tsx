"use client";

import * as React from "react";
import type { Challenge } from "@/content/types";
import type { ChallengeHandle, ChallengeViewProps } from "../types";

import { QueryChallengeView } from "./query-challenge";
import { ChoiceChallengeView } from "./choice-challenge";
import { FillBlankChallengeView } from "./fill-blank-challenge";
import { OrderChallengeView } from "./order-challenge";
import { DebugChallengeView } from "./debug-challenge";

/**
 * Dispatches to the right challenge view and forwards the imperative handle
 * the player uses to trigger checking.
 */
export const ChallengeRenderer = React.forwardRef<
  ChallengeHandle,
  ChallengeViewProps<Challenge>
>(function ChallengeRenderer(props, ref) {
  const { challenge } = props;

  switch (challenge.type) {
    case "query":
      return <QueryChallengeView {...props} challenge={challenge} ref={ref} />;
    case "choice":
    case "predict":
      return <ChoiceChallengeView {...props} challenge={challenge} ref={ref} />;
    case "fill-blank":
      return <FillBlankChallengeView {...props} challenge={challenge} ref={ref} />;
    case "order":
      return <OrderChallengeView {...props} challenge={challenge} ref={ref} />;
    case "debug":
      return <DebugChallengeView {...props} challenge={challenge} ref={ref} />;
  }
});

export const CHALLENGE_TYPE_LABEL: Record<Challenge["type"], string> = {
  query: "Write a query",
  choice: "Multiple choice",
  predict: "Predict the output",
  "fill-blank": "Fill the blanks",
  order: "Put it in order",
  debug: "Find the bug",
};
