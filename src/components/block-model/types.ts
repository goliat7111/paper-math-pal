export type BlockModelObject =
  | {
      id: string;
      type: "block";
      x: number;
      y: number;
      segmentWidth: number;
      height: number;
      parts: number;
      label: string;
      color: string;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
    }
  | {
      id: string;
      type: "unknown";
      x: number;
      y: number;
      symbol: string;
    };

export type DrawingStroke = {
  id: string;
  points: Array<{ x: number; y: number }>;
};

export type WorkspaceSnapshot = {
  objects: BlockModelObject[];
  strokes: DrawingStroke[];
};

export type WorkspaceHistory = {
  past: WorkspaceSnapshot[];
  present: WorkspaceSnapshot;
  future: WorkspaceSnapshot[];
};

export type WorkspaceAction =
  | { type: "change"; snapshot: WorkspaceSnapshot }
  | { type: "preview"; snapshot: WorkspaceSnapshot }
  | { type: "commit"; before: WorkspaceSnapshot }
  | { type: "undo" }
  | { type: "redo" };

const HISTORY_LIMIT = 100;

export function createWorkspaceHistory(): WorkspaceHistory {
  return {
    past: [],
    present: { objects: [], strokes: [] },
    future: [],
  };
}

export function workspaceHistoryReducer(
  state: WorkspaceHistory,
  action: WorkspaceAction,
): WorkspaceHistory {
  switch (action.type) {
    case "change":
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.snapshot,
        future: [],
      };
    case "preview":
      return { ...state, present: action.snapshot };
    case "commit":
      return {
        past: [...state.past, action.before].slice(-HISTORY_LIMIT),
        present: state.present,
        future: [],
      };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: next,
        future: state.future.slice(1),
      };
    }
  }
}
