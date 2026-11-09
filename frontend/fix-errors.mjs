
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const G = "\x1b[32m", Y = "\x1b[33m", R = "\x1b[31m", C = "\x1b[36m", X = "\x1b[0m";
const log = (m) => console.log(`${C}▶${X} ${m}`);
const ok  = (m) => console.log(`${G}  ✓${X} ${m}`);
const wrn = (m) => console.log(`${Y}  ⚠${X} ${m}`);

const read  = (p) => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
const write = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, "utf8"); };
const exists = (p) => fs.existsSync(p);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

function walk(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(full);
  }
  return out;
}

function edit(p, pairs) {
  const before = read(p);
  if (before === null) return false;
  let after = before;
  for (const [from, to] of pairs) after = after.replace(from, to);
  if (after !== before) { write(p, after); return true; }
  return false;
}

let FIXED = 0;
const fixed = () => FIXED++;

console.log("");
console.log(`${C}════════════════════════════════════════${X}`);
console.log(`${C}   LABTRACK AUTO-FIXER — Starting${X}`);
console.log(`${C}════════════════════════════════════════${X}`);
console.log("");


log("1 → Rename JSX .ts files to .tsx");
const RENAMES = [
  ["src/hooks/use-auth.ts",          "src/hooks/use-auth.tsx"],
  ["src/hooks/use-campus.ts",        "src/hooks/use-campus.tsx"],
  ["src/hooks/use-signalr.ts",       "src/hooks/use-signalr.tsx"],
  ["src/context/auth-context.ts",    "src/context/auth-context.tsx"],
];
for (const [a, b] of RENAMES) {
  const ap = path.join(ROOT, a), bp = path.join(ROOT, b);
  if (exists(ap)) { fs.renameSync(ap, bp); ok(`renamed ${a} → ${b}`); fixed(); }
  else if (exists(bp)) wrn(`already renamed: ${b}`);
  else wrn(`missing: ${a}`);
}


log("2 → App.tsx imports");
if (edit(path.join(SRC, "App.tsx"), [
  [/from\s+["']\.\/router["']/g, 'from "@/providers/router-provider"'],
  [/from\s+["']\.\/components\/ui\/toaster["']/g, 'from "@/components/ui/toaster"'],
  [/from\s+["']\.\/components\/ui\/tooltip["']/g, 'from "@/components/ui/tooltip"'],
])) { ok("App.tsx fixed"); fixed(); }


log("3 → Create src/hooks/use-toast.ts");
{
  const p = path.join(SRC, "hooks/use-toast.ts");
  write(p, `import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;
  const t = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, t);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST":
      return { ...state, toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) addToRemoveQueue(toastId);
      else state.toasts.forEach((t) => addToRemoveQueue(t.id));
      return { ...state, toasts: state.toasts.map((t) => t.id === toastId || toastId === undefined ? { ...t, open: false } : t) };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
  }
};

const listeners: Array<(s: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();
  const update = (p: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...p, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } },
  });
  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
`);
  ok("created src/hooks/use-toast.ts"); fixed();
}


log("4 → signalr.config.ts");
if (edit(path.join(SRC, "config/signalr.config.ts"), [
  [/\.withAutomaticReconnect\(\s*retryDelays\s*\)/g, ".withAutomaticReconnect(retryDelays ?? [0, 2000, 5000, 10000])"],
])) { ok("signalr fixed"); fixed(); }


log("5 → AssetCategory.DesktopPC");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  const c = read(f);
  if (c && /AssetCategory\.DesktopPC/.test(c)) {
    if (edit(f, [[/AssetCategory\.DesktopPC/g, "AssetCategory.Desktop"]])) { ok(`fixed: ${rel(f)}`); fixed(); }
  }
}

log("6 → IdCard → CreditCard");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  const c = read(f);
  if (c && /\bIdCard\b/.test(c)) {
    if (edit(f, [[/\bIdCard\b/g, "CreditCard"]])) { ok(`fixed: ${rel(f)}`); fixed(); }
  }
}


log("7 → use-ui-store");
if (edit(path.join(SRC, "stores/use-ui-store.ts"), [
  [/modalData\s*:\s*null/g, "modalData: undefined"],
])) { ok("use-ui-store fixed"); fixed(); }


log("8 → JRMSUCampus keys");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  const c = read(f);
  if (!c || !c.includes("JRMSUCampus.")) continue;
  if (edit(f, [
    [/JRMSUCampus\.MAIN_CAMPUS/g, "JRMSUCampus.Main"],
    [/JRMSUCampus\.KATIPUNAN/g,  "JRMSUCampus.Katipunan"],
    [/JRMSUCampus\.TAMPILISAN/g, "JRMSUCampus.Tampilisan"],
    [/JRMSUCampus\.SIOCON/g,     "JRMSUCampus.Siocon"],
  ])) { ok(`fixed: ${rel(f)}`); fixed(); }
}


log("9 → CampusOption key/value");
for (const relPath of [
  "src/layouts/admin-layout.tsx",
  "src/layouts/instructor-layout.tsx",
  "src/pages/admin/system-settings-page.tsx",
  "src/pages/auth/register-page.tsx",
]) {
  const p = path.join(ROOT, relPath);
  const c = read(p);
  if (!c) continue;
  let n = c
    .replace(/<SelectItem\s+key=\{([a-zA-Z_$][\w$]*)\}\s+value=\{\1\}/g, "<SelectItem key={$1.value} value={$1.value}")
    .replace(/\{([a-zA-Z_$][\w$]*)\.replace\([^)]*\)\}/g, "{$1.label}");
  if (n !== c) { write(p, n); ok(`fixed: ${relPath}`); fixed(); }
}


log("10 → Bulk import path rewrites");
const MAP = [
  ["@/features/dashboard/components/metric-cards-grid",          "@/features/admin-dashboard/components/metric-cards-grid"],
  ["@/features/dashboard/components/quick-action-buttons",       "@/features/student-portal/components/quick-action-buttons"],
  ["@/features/dashboard/",                                      "@/features/admin-dashboard/"],
  ["@/features/maintenance/components/predictive-maintenance-card","@/features/admin-dashboard/components/predictive-maintenance-card"],
  ["@/features/maintenance/components/repair-ticket-table",      "@/features/maintenance-control/components/repair-ticket-table"],
  ["@/features/maintenance/components/maintenance-calendar-setup","@/features/maintenance-control/components/maintenance-calendar-setup"],
  ["@/features/maintenance/components/dispatch-notice-modal",    "@/features/maintenance-control/components/dispatch-notice-modal"],
  ["@/features/maintenance/",                                    "@/features/maintenance-control/"],
  ["@/features/workstations/components/workstation-grid-matrix", "@/features/instructor-hub/components/workstation-grid-matrix"],
  ["@/features/workstations/components/station-info-card",       "@/features/student-portal/components/station-info-card"],
  ["@/features/workstations/",                                   "@/features/instructor-hub/"],
  ["@/features/attendance/components/live-qr-sessions-table",    "@/features/admin-dashboard/components/live-qr-sessions-table"],
  ["@/features/attendance/components/live-attendance-table",     "@/features/instructor-hub/components/live-attendance-table"],
  ["@/features/attendance/components/zero-login-scanner-view",   "@/features/student-portal/components/zero-login-scanner-view"],
  ["@/features/attendance/",                                     "@/features/admin-dashboard/"],
  ["@/features/inventory/components/asset-inventory-table",      "@/features/assets-management/components/asset-inventory-table"],
  ["@/features/inventory/",                                      "@/features/assets-management/"],
  ["@/features/security/components/security-pin-modal",          "@/features/auth/components/security-pin-modal"],
  ["@/features/security/",                                       "@/features/auth/"],
  ["@/features/custody/components/pc-chain-of-custody-modal",    "@/features/damage-attribution/components/pc-chain-of-custody-modal"],
  ["@/features/custody/",                                        "@/features/damage-attribution/"],
  ["@/features/trust-score/components/student-trust-score-badge","@/features/damage-attribution/components/student-trust-score-badge"],
  ["@/features/trust-score/",                                    "@/features/damage-attribution/"],
  ["@/features/telemetry/components/telemetry-event-logs",       "@/features/damage-attribution/components/telemetry-event-logs"],
  ["@/features/alerts/components/disruption-alerts-panel",       "@/features/instructor-hub/components/disruption-alerts-panel"],
  ["@/features/alerts/",                                         "@/features/instructor-hub/"],
  ["@/features/seat-assignment/components/fixed-seat-assignment-modal","@/features/instructor-hub/components/fixed-seat-assignment-modal"],
  ["@/features/seat-assignment/",                                "@/features/instructor-hub/"],
  ["@/features/reservations/components/lab-reservation-modal",   "@/features/instructor-hub/components/lab-reservation-modal"],
  ["@/features/reservations/",                                   "@/features/instructor-hub/"],
  ["@/features/reports/components/problem-report-modal",         "@/features/student-portal/components/problem-report-modal"],
  ["@/features/reports/",                                        "@/features/student-portal/"],
  ["@/features/inspection/components/pre-check-inspection-modal","@/features/student-portal/components/pre-check-inspection-modal"],
  ["@/features/inspection/",                                     "@/features/student-portal/"],
  ["@/features/session/components/active-session-timer",         "@/features/student-portal/components/active-session-timer"],
  ["@/features/session/",                                        "@/features/student-portal/"],
  ["@/features/ai/components/floating-ai-widget",                "@/features/ai-assistant/components/floating-ai-widget"],
  ["@/features/ai/",                                             "@/features/ai-assistant/"],
  ["@/features/audit/components/immutable-audit-trail-table",    "@/features/admin-dashboard/components/immutable-audit-trail-table"],
  ["@/features/audit/",                                          "@/features/admin-dashboard/"],
  ["@/features/cost-tracking/components/auto-cost-tracking-table","@/features/admin-dashboard/components/auto-cost-tracking-table"],
  ["@/features/cost-tracking/components/cost-override-modal",    "@/features/admin-dashboard/components/cost-override-modal"],
  ["@/features/cost-tracking/",                                  "@/features/admin-dashboard/"],
  ["@/features/instructor-logs/components/instructor-logins-table","@/features/admin-dashboard/components/instructor-logins-table"],
  ["@/features/instructor-logs/",                                "@/features/admin-dashboard/"],
  ["@/features/analytics/components/analytics-charts",           "@/features/admin-dashboard/components/analytics-charts"],
  ["@/pages/admin/lab-reservations-page",                        "@/pages/instructor/lab-reservations-page"],
  ["../api/use-problem-reports",                                 "@/features/maintenance-control/api/use-problem-reports"],
];

let importFixCount = 0;
for (const f of walk(SRC, [".ts", ".tsx"])) {
  const c = read(f);
  if (!c) continue;
  let n = c;
  for (const [from, to] of MAP) {
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    n = n.replace(new RegExp(esc, "g"), to);
  }
  if (n !== c) { write(f, n); ok(`imports: ${rel(f)}`); fixed(); importFixCount++; }
}
if (importFixCount === 0) wrn("no import paths changed");


log("11 → API_ENDPOINTS REPAIRS + SUBMIT_ISSUE");
{
  const p = path.join(SRC, "config/constants.ts");
  const c = read(p);
  if (c) {
    let n = c;
    if (!n.includes("REPAIRS:")) {
      n = n.replace(/(TICKETS\s*:\s*["'][^"']+["']\s*,)/, `$1\n    REPAIRS: "/api/v1/maintenance/repairs",`);
    }
    if (!n.includes("SUBMIT_ISSUE:")) {
      n = n.replace(/(ISSUE_REPORT\s*:\s*["'][^"']+["']\s*,)/, `$1\n    SUBMIT_ISSUE: "/api/v1/student/submit-issue",`);
    }
    if (n !== c) { write(p, n); ok("constants.ts updated"); fixed(); }
    else wrn("constants.ts — check REPAIRS/SUBMIT_ISSUE manually");
  }
}


log("12 → authService.setSecurityPin");
{
  const p = path.join(SRC, "services/authService.ts");
  write(p, `import { api } from "@/lib/api";

export const authService = {
  updateProfile: async (data: Record<string, unknown>) => {
    const response = await api.patch("/api/v1/auth/profile", data);
    return response.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.post("/api/v1/auth/change-password", data);
    return response.data;
  },
  setSecurityPin: async (data: { pin: string; currentPassword?: string }) => {
    const response = await api.post("/api/v1/auth/security-pin", data);
    return response.data;
  },
};
`);
  ok("authService.ts written"); fixed();
}


log("13 → resetError");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  if (!/use-lab-reservations\.tsx?$/.test(f)) continue;
  const c = read(f);
  if (!c || c.includes("resetError")) continue;
  const n = c.replace(
    /(return\s*\{)([\s\S]*?)(\}\s*;?\s*\}\s*;?\s*$|\}\s*;?\s*$)/m,
    (m, open, body, close) => `${open}${body}\n    resetError: () => setError(null),${close}`
  );
  if (n !== c) { write(f, n); ok(`fixed: ${rel(f)}`); fixed(); }
  else wrn(`manual resetError: ${rel(f)}`);
}


log("14 → onNotificationReceived");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  if (!/use-signalr\.tsx?$/.test(f)) continue;
  const c = read(f);
  if (!c || c.includes("onNotificationReceived")) continue;
  const n = c.replace(
    /(return\s*\{)([\s\S]*?)(\}\s*;?\s*\}\s*;?\s*$|\}\s*;?\s*$)/m,
    (m, open, body, close) => `${open}${body}
    onNotificationReceived: (cb: (n: unknown) => void) => {
      connection?.on("NotificationReceived", cb);
      return () => connection?.off("NotificationReceived", cb);
    },${close}`
  );
  if (n !== c) { write(f, n); ok(`fixed: ${rel(f)}`); fixed(); }
  else wrn(`manual onNotificationReceived: ${rel(f)}`);
}


log("15 → photoUrls prop");
{
  const p = path.join(SRC, "features/damage-attribution/components/photo-evidence-uploader.tsx");
  const c = read(p);
  if (c && !/photoUrls\s*\?/.test(c)) {
    let n = c
      .replace(/(interface\s+PhotoEvidenceUploaderProps\s*\{)/, `$1\n  photoUrls?: string[];`)
      .replace(/(type\s+PhotoEvidenceUploaderProps\s*=\s*\{)/, `$1\n  photoUrls?: string[];`);
    if (n !== c) { write(p, n); ok("photoUrls added"); fixed(); }
    else wrn("photo-evidence-uploader — props interface not found");
  } else if (c) wrn("photoUrls already declared");
}


log("16 → LoginResponse.idNumber");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  const c = read(f);
  if (!c) continue;
  if (/interface\s+LoginResponse\b/.test(c) && !/idNumber/.test(c)) {
    const n = c.replace(/(interface\s+LoginResponse\s*\{)/, `$1\n  idNumber?: string;`);
    if (n !== c) { write(f, n); ok(`fixed: ${rel(f)}`); fixed(); }
  }
}


log("17 → login(token, user)");
for (const f of walk(SRC, [".ts", ".tsx"])) {
  if (!/use-(login|register)\.tsx?$/.test(f)) continue;
  const c = read(f);
  if (!c) continue;
  const n = c.replace(/login\(\s*([\w.]+)\s*\)(?!\s*,)/g, "login($1, user)");
  if (n !== c) { write(f, n); ok(`fixed: ${rel(f)}`); fixed(); }
}


log("18 → Dialog onOpenChange");
{
  const p = path.join(SRC, "features/damage-attribution/components/HardwareDamageAttributionModal.tsx");
  const c = read(p);
  if (c) {
    const n = c
      .replace(/onOpenChange=\{\(open\)\s*=>/g, "onOpenChange={(value: boolean) =>")
      .replace(/onOpenChange=\{\(open:\s*any\)\s*=>/g, "onOpenChange={(value: boolean) =>");
    if (n !== c) { write(p, n); ok("Dialog fixed"); fixed(); }
  }
}


log("19 → context/auth-context.tsx");
write(path.join(SRC, "context/auth-context.tsx"), `export {
  AuthProvider,
  AuthContext,
  useAuth,
  type UserProfile,
  type UserRole,
  type AuthState,
  type AuthContextType,
  type LoginCredentials,
} from "@/hooks/use-auth";

export { AuthContext as default } from "@/hooks/use-auth";
`);
ok("auth-context.tsx rewritten"); fixed();


console.log("");
console.log(`${G}════════════════════════════════════════${X}`);
console.log(`${G}   ✅ DONE — ${FIXED} fixes applied${X}`);
console.log(`${G}════════════════════════════════════════${X}`);
console.log("");
console.log(`${C}Next:${X}`);
console.log("   npx tsc --noEmit");
console.log("");