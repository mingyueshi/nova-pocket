<script>
import { account } from './state.js'
export default { onLaunch() { account.restoreSession() } }
</script>
<style>
page,body{margin:0;background:#f4f6fa;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;color:#23283a}
/* Scope the reset above UniApp's element defaults, including lazy-loaded H5 styles. */
.surface view,.surface text,.surface button,.surface input,.surface textarea,.surface image,.surface scroll-view,.surface picker,.surface form,.surface label,.surface checkbox-group{box-sizing:border-box}
.surface view,.surface form,.surface picker{min-width:0}
.surface button{margin:0;min-width:0;max-width:100%;line-height:1.4;font-size:14px;font-family:inherit;border:0;color:inherit}
.surface button::after{display:none;border:0}
.surface button:focus-visible,.surface input:focus-within,.surface textarea:focus-within{outline:2px solid #6288fa;outline-offset:2px}
.surface{--brand:#1d4ed8;--brand-on:#fff;--soft:#eef3fb;--canvas:#f4f6fa;--card:#fff;--ink:#23283a;--muted:#5a667c;--line:#e7eaf2;--control:#7d8a9f;--error:#b1223c;--hero:#243b76;color:var(--ink);background:var(--canvas)}
.surface.teal{--brand:#106552;--soft:#e2f2eb;--canvas:#f1f7f4;--line:#deeae4;--hero:#194d45}
.surface.dark{--brand:#aec4ff;--brand-on:#1b2f62;--soft:#303d60;--canvas:#171c2b;--card:#232a3d;--ink:#f4f5ff;--muted:#bac4da;--line:#37425a;--control:#8c9ab9;--error:#ff9db0;--hero:#293f75}
.surface .btn{display:flex;justify-content:center;align-items:center;gap:7px;min-height:44px;padding:0 14px;border-radius:11px;font-weight:720;background:var(--soft);color:var(--brand)}
.surface .btn.primary{background:var(--brand);color:var(--brand-on)}
.surface .btn.outline{background:var(--card);border:1px solid var(--line);color:var(--ink)}
.surface .btn[disabled]{opacity:.58;background:var(--soft);color:var(--muted)}.surface .link{padding:0 5px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;color:var(--brand);background:transparent;font-weight:680}
.surface .icon-button{height:44px;width:44px;min-height:44px;min-width:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:0}
.eyebrow{font-size:12px;letter-spacing:.11em;font-weight:750;color:var(--brand)}
.title{display:block;overflow-wrap:anywhere;font-size:26px;font-weight:800;line-height:1.22;letter-spacing:-.025em}
.note{display:block;overflow-wrap:anywhere;font-size:14px;line-height:1.55;color:var(--muted)}
.surface .panel{min-width:0;width:100%;border:1px solid var(--line);border-radius:16px;background:var(--card);padding:15px}
.badge{display:inline-flex;border-radius:7px;background:var(--soft);color:var(--brand);padding:3px 7px;font-size:12px;font-weight:750}
.np-stack{display:flex;flex-direction:column;gap:11px}
.np-grow{min-width:0;flex:1}
</style>
