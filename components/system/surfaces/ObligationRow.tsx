"use client";

import * as React from "react";
import { StatusPill, type Status } from "../status/StatusPill";
import { DeadlineChip, type DeadlineGrade } from "../status/DeadlineChip";

export interface ObligationRowProps {
  name: React.ReactNode;
  status?: Status;
  grade?: DeadlineGrade;
  deadline?: React.ReactNode;
  onClick?: () => void;
}

/** Dashboard list row: obligation name + StatusPill + DeadlineChip + chevron. */
export function ObligationRow({ name, status = "not-started", grade, deadline, onClick }: ObligationRowProps) {
  return (
    <button type="button" className="fe-obligation-row" onClick={onClick}>
      <span style={{ flex: "1 1 130px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      <StatusPill status={status} />
      {deadline && <DeadlineChip grade={grade}>{deadline}</DeadlineChip>}
      <span className="fe-icon" style={{ fontSize: 22, color: "var(--neutral-400)" }} aria-hidden="true">
        chevron_right
      </span>
    </button>
  );
}
