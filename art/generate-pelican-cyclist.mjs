/**
 * 生成 art/pelican-cyclist.svg —— 一只骑自行车的鹈鹕。
 *
 * 风格沿用本仓库头像素材：256 系扁平色块 + #241a27 墨线描边（这里画布放大到 512×512）。
 * 动画全部用 SMIL（浏览器直接播放，静态渲染器会退化成初始帧）：
 *   · 车轮 / 牙盘 / 脚踏：16 帧 IK 蹬踏循环
 *   · 链条、路面虚线、速度线：位移循环
 *
 * 运行：node art/generate-pelican-cyclist.mjs
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const outFile = join(dirname(fileURLToPath(import.meta.url)), "pelican-cyclist.svg");

/* ---------------------------------------------------------------- 调色板 */
const INK = "#241a27";
const CREAM = "#fdf7ee"; // 鹈鹕身体
const CREAM_SH = "#ece0cd"; // 身体暗部
const BEAK = "#f2a13c"; // 上喙
const POUCH = "#f9c67c"; // 喉囊
const LEG = "#e8892b"; // 近侧腿
const LEG_FAR = "#c9762a"; // 远侧腿（更深，做前后关系）
const FRAME = "#2e8b84"; // 车架
const METAL = "#a9b8c4"; // 把立 / 曲柄 / 花鼓
const RUBBER = "#33323f"; // 外胎
const RIM = "#f2f6f9"; // 轮圈
const SPOKE = "#c6d1da"; // 辐条
const SCARF = "#e8615a"; // 围巾
const SCARF_SH = "#cf4b46";

/* ---------------------------------------------------------------- 几何 */
const REAR = { x: 150, y: 372 }; // 后轮轴
const FRONT = { x: 392, y: 372 }; // 前轮轴
const BB = { x: 256, y: 378 }; // 中轴
const CR = 32; // 曲柄长
const TIRE_R = 71; // 胎面中心半径（外缘 78 → 地面 y=450）
const RIM_R = 60;
const COG_R = 15;
const RING_R = 20;

const CRANK_DUR = "1.2s";
const PH = Number(process.env.PHASE || 0); // 校验用：初始蹬踏相位
const WHEEL_DUR = "0.6s"; // 齿比 2:1（牙盘 30 / 飞轮 15）
const STEPS = 16; // 蹬踏循环分段数

const rad = (deg) => (deg * Math.PI) / 180;
const r1 = (n) => Math.round(n * 10) / 10;
const pedal = (deg) => ({ x: BB.x + CR * Math.cos(rad(deg)), y: BB.y + CR * Math.sin(rad(deg)) });
const P0 = pedal(0); // 初始帧踏板位置
const ankle = (deg) => {
  const p = pedal(deg);
  return { x: p.x + 1, y: p.y - 12 };
};

/** 两骨 IK：给定髋、踝与大小腿长，求膝盖（默认朝前顶） */
function knee(hip, ank, l1, l2) {
  const dx = ank.x - hip.x;
  const dy = ank.y - hip.y;
  const raw = Math.hypot(dx, dy) || 0.001;
  const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.5);
  const ux = dx / raw;
  const uy = dy / raw;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const px = hip.x + a * ux;
  const py = hip.y + a * uy;
  const k1 = { x: px - h * uy, y: py + h * ux };
  const k2 = { x: px + h * uy, y: py - h * ux };
  return k1.x > k2.x ? k1 : k2;
}

const NEAR_HIP = { x: 234, y: 205 };
const FAR_HIP = { x: 224, y: 201 };
const NEAR_BONES = [104, 112];
const FAR_BONES = [102, 110];

/** 一圈蹬踏的 path d 值（首尾同帧，便于循环） */
function legCycle(phase, hip, [l1, l2]) {
  const vals = [];
  for (let i = 0; i <= STEPS; i++) {
    const a = ankle(phase + (360 * i) / STEPS);
    const k = knee(hip, a, l1, l2);
    vals.push(`M${r1(hip.x)} ${r1(hip.y)}L${r1(k.x)} ${r1(k.y)}L${r1(a.x)} ${r1(a.y)}`);
  }
  return vals;
}

const NEAR_LEG = legCycle(PH, NEAR_HIP, NEAR_BONES);
const FAR_LEG = legCycle(PH + 180, FAR_HIP, FAR_BONES);
const KEY_TIMES = Array.from({ length: STEPS + 1 }, (_, i) => r1(i / STEPS)).join(";");

const morph = (values) =>
  `    <animate attributeName="d" dur="${CRANK_DUR}" repeatCount="indefinite" calcMode="linear"\n` +
  `      keyTimes="${KEY_TIMES}"\n      values="${values.join(";")}"/>`;

/* ---------------------------------------------------------------- 零件 */

// 车轮（定义在原点，用 <use> 摆到前后轴心）
const spokes = Array.from({ length: 12 }, (_, i) => {
  const a = rad(i * 30);
  return `    <line x1="${r1(11 * Math.cos(a))}" y1="${r1(11 * Math.sin(a))}" x2="${r1(
    (RIM_R - 3) * Math.cos(a),
  )}" y2="${r1((RIM_R - 3) * Math.sin(a))}"/>`;
}).join("\n");

const wheelDef = `  <g id="wheel">
    <circle r="${TIRE_R}" fill="none" stroke="${RUBBER}" stroke-width="14"/>
    <circle r="${TIRE_R}" fill="none" stroke="#4c4b60" stroke-width="13" stroke-dasharray="5 26" opacity=".9"/>
    <circle r="${RIM_R}" fill="none" stroke="${INK}" stroke-width="8"/>
    <circle r="${RIM_R}" fill="none" stroke="${RIM}" stroke-width="5"/>
    <g stroke="${SPOKE}" stroke-width="3" stroke-linecap="round">
${spokes}
    </g>
    <circle r="10" fill="${METAL}" stroke="${INK}" stroke-width="3"/>
  </g>`;

/** 绕局部原点旋转（用于已 translate 到轴心的分组） */
const spin = (dur, from = 0, to = 360) =>
  `<animateTransform attributeName="transform" attributeType="XML" type="rotate" from="${from}" to="${to}" dur="${dur}" repeatCount="indefinite"/>`;
/** 绕绝对坐标 (cx,cy) 旋转 */
const spinAt = (c, dur, from = PH, to = PH + 360) =>
  `<animateTransform attributeName="transform" attributeType="XML" type="rotate" from="${from} ${c.x} ${c.y}" to="${to} ${c.x} ${c.y}" dur="${dur}" repeatCount="indefinite"/>`;

const wheel = (c, label) => `  <!-- ${label} -->
  <g transform="translate(${c.x},${c.y})">
    <g>${spin(WHEEL_DUR)}
      <use href="#wheel" xlink:href="#wheel"/>
    </g>
  </g>`;

// 车架管材：先铺墨线，再压一层颜色，得到「描边管」效果
const TUBES = {
  seatTube: `M${BB.x} ${BB.y - 4}L222 214`,
  topTube: `M226 216L350 226`,
  downTube: `M${BB.x} ${BB.y - 4}L358 258`,
  chainStay: `M${REAR.x} ${REAR.y}L${BB.x} ${BB.y}`,
  seatStay: `M${REAR.x} ${REAR.y}L224 228`,
  fork: `M362 264L${FRONT.x} ${FRONT.y}`,
  headTube: `M350 222L363 266`,
};
const tubePass = (color, width, extra = "") =>
  `    <g stroke="${color}" stroke-width="${width}"${extra}>\n` +
  Object.values(TUBES)
    .map((d) => `      <path d="${d}"/>`)
    .join("\n") +
  "\n    </g>";

/* ---------------------------------------------------------------- 组装 */
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 骑自行车的鹈鹕 · 扁平描边风 · 512×512 · 含 SMIL 蹬踏动画 -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 512 512" width="512" height="512" fill="none" role="img"
  aria-labelledby="pelicanTitle pelicanDesc">
  <title id="pelicanTitle">骑自行车的鹈鹕</title>
  <desc id="pelicanDesc">一只白羽橙喙的鹈鹕系着红围巾，蹬着一辆青绿色自行车向前行驶，喉囊里还兜着一条鱼。</desc>

  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d9eefb"/>
      <stop offset="1" stop-color="#f8fdff"/>
    </linearGradient>
    <clipPath id="card">
      <rect width="512" height="512" rx="48"/>
    </clipPath>
${wheelDef}

    <!-- 腿部：一条 path 定义 + 动画，用 <use> 分别描墨线与上色 -->
    <path id="legNear" d="${NEAR_LEG[0]}" stroke-linecap="round" stroke-linejoin="round">
${morph(NEAR_LEG)}
    </path>
    <path id="legFar" d="${FAR_LEG[0]}" stroke-linecap="round" stroke-linejoin="round">
${morph(FAR_LEG)}
    </path>
  </defs>

  <g clip-path="url(#card)">
    <!-- ===================== 背景 ===================== -->
    <rect width="512" height="512" fill="url(#sky)"/>
    <circle cx="86" cy="82" r="46" fill="#ffdc93" opacity=".35"/>
    <circle cx="86" cy="82" r="29" fill="#ffdc93"/>
    <g fill="#ffffff" opacity=".9">
      <ellipse cx="182" cy="62" rx="30" ry="15"/>
      <ellipse cx="208" cy="56" rx="20" ry="12"/>
      <ellipse cx="300" cy="46" rx="34" ry="15"/>
      <ellipse cx="330" cy="40" rx="22" ry="12"/>
      <ellipse cx="470" cy="222" rx="28" ry="13"/>
      <ellipse cx="492" cy="216" rx="18" ry="10"/>
    </g>
    <!-- 远山 -->
    <path d="M-10 452 C40 402 96 394 152 418 C208 442 238 402 300 402 C360 402 402 432 452 422 C490 414 508 428 522 440 L522 466 L-10 466Z" fill="#c3e4d4"/>
    <path d="M-10 456 C60 428 122 446 190 452 C260 458 322 438 400 446 C452 452 492 446 522 454 L522 470 L-10 470Z" fill="#a2d4bd"/>

    <!-- 速度线 -->
    <g stroke="#9fd0e6" stroke-width="7" stroke-linecap="round">
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;-78,0" dur="0.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.9;0" dur="0.7s" repeatCount="indefinite"/>
        <path d="M96 208h62"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;-92,0" dur="0.9s" begin="-0.35s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.85;0" dur="0.9s" begin="-0.35s" repeatCount="indefinite"/>
        <path d="M118 258h80"/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;-70,0" dur="0.8s" begin="-0.55s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.8;0" dur="0.8s" begin="-0.55s" repeatCount="indefinite"/>
        <path d="M78 312h54"/>
      </g>
    </g>

    <!-- 地面投影 -->
    <ellipse cx="${REAR.x}" cy="452" rx="66" ry="9" fill="${INK}" opacity=".16"/>
    <ellipse cx="${FRONT.x}" cy="452" rx="66" ry="9" fill="${INK}" opacity=".16"/>
    <ellipse cx="272" cy="452" rx="120" ry="10" fill="${INK}" opacity=".1"/>

    <!-- 路面 -->
    <rect x="-10" y="450" width="532" height="72" fill="#c8cfd7"/>
    <rect x="-10" y="450" width="532" height="5" fill="#a8b1bb"/>
    <path d="M-10 490H522" stroke="#f1f5f8" stroke-width="9" stroke-dasharray="46 42">
      <animate attributeName="stroke-dashoffset" values="0;88" dur="0.45s" repeatCount="indefinite"/>
    </path>

    <!-- ===================== 远侧腿（车后） ===================== -->
    <use href="#legFar" xlink:href="#legFar" stroke="${INK}" stroke-width="25"/>
    <use href="#legFar" xlink:href="#legFar" stroke="${LEG_FAR}" stroke-width="18"/>
    <!-- 远侧曲柄 + 踏板 + 蹼足 -->
    <g transform="rotate(${PH + 180} ${BB.x} ${BB.y})">
      ${spinAt(BB, CRANK_DUR, PH + 180, PH + 540)}
      <line x1="${BB.x}" y1="${BB.y}" x2="${r1(P0.x)}" y2="${r1(P0.y)}" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
      <line x1="${BB.x}" y1="${BB.y}" x2="${r1(P0.x)}" y2="${r1(P0.y)}" stroke="#8b98a5" stroke-width="9" stroke-linecap="round"/>
      <g transform="translate(${r1(P0.x)},${r1(P0.y)})">
        <g transform="rotate(${-PH - 180})">${spin(CRANK_DUR, -PH - 180, -PH - 540)}
          <rect x="-17" y="-5" width="34" height="10" rx="4" fill="#4b4a5c" stroke="${INK}" stroke-width="3"/>
          <g transform="translate(1,-14)" stroke="${INK}" stroke-width="3" stroke-linejoin="round">
            <path d="M-6 -1C2 -8 18 -9 27 -4L30 3C22 6 16 2 10 6C4 2 -2 6 -9 4Z" fill="${LEG_FAR}"/>
          </g>
        </g>
      </g>
    </g>

    <!-- ===================== 车轮 ===================== -->
${wheel(REAR, "后轮")}
${wheel(FRONT, "前轮")}
    <!-- 飞轮 -->
    <g transform="translate(${REAR.x},${REAR.y})">
      <g>${spin(WHEEL_DUR)}
        <circle r="${COG_R}" fill="${METAL}" stroke="${INK}" stroke-width="3"/>
        <circle r="${COG_R - 4}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 5" opacity=".55"/>
      </g>
    </g>

    <!-- ===================== 车架 ===================== -->
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
${tubePass(INK, 16)}
${tubePass(FRAME, 9)}
${tubePass("#ffffff", 3, ` opacity=".22"`)}
    </g>

    <!-- 链条 -->
    <path d="M${REAR.x} ${REAR.y - COG_R}L${BB.x} ${BB.y - RING_R}A${RING_R} ${RING_R} 0 0 1 ${BB.x} ${
      BB.y + RING_R
    }L${REAR.x} ${REAR.y + COG_R}A${COG_R} ${COG_R} 0 0 0 ${REAR.x} ${REAR.y - COG_R}Z"
      stroke="#4b4a5c" stroke-width="6"/>
    <path d="M${REAR.x} ${REAR.y - COG_R}L${BB.x} ${BB.y - RING_R}A${RING_R} ${RING_R} 0 0 1 ${BB.x} ${
      BB.y + RING_R
    }L${REAR.x} ${REAR.y + COG_R}A${COG_R} ${COG_R} 0 0 0 ${REAR.x} ${REAR.y - COG_R}Z"
      stroke="#98a3af" stroke-width="3" stroke-dasharray="4 6">
      <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.2s" repeatCount="indefinite"/>
    </path>

    <!-- 牙盘 -->
    <g transform="rotate(${PH} ${BB.x} ${BB.y})">
      ${spinAt(BB, CRANK_DUR)}
      <circle cx="${BB.x}" cy="${BB.y}" r="${RING_R}" fill="${METAL}" stroke="${INK}" stroke-width="3"/>
      <circle cx="${BB.x}" cy="${BB.y}" r="${RING_R + 2}" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="4 7"/>
      <circle cx="${BB.x}" cy="${BB.y}" r="${RING_R - 9}" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".45"/>
    </g>

    <!-- 座管 + 座垫 -->
    <path d="M222 214L212 192" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <path d="M222 214L212 192" stroke="${METAL}" stroke-width="8" stroke-linecap="round"/>
    <path d="M154 190C164 176 226 174 248 186C242 200 172 206 154 190Z" fill="#3f3e50" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M164 187C178 181 216 180 238 185" stroke="#6d6c80" stroke-width="3" stroke-linecap="round" opacity=".8"/>

    <!-- 把立 + 车把 -->
    <path d="M351 223L372 205" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
    <path d="M351 223L372 205" stroke="${METAL}" stroke-width="9" stroke-linecap="round"/>
    <path d="M372 205Q398 192 418 202" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <path d="M372 205Q398 192 418 202" stroke="${METAL}" stroke-width="8" stroke-linecap="round"/>
    <path d="M404 197L421 203" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
    <path d="M404 197L421 203" stroke="#3f3e50" stroke-width="10" stroke-linecap="round"/>

    <!-- ===================== 鹈鹕 ===================== -->
    <!-- 尾羽（水平后掠） -->
    <path d="M190 142C156 136 124 144 110 162C136 172 172 168 196 158Z" fill="${CREAM_SH}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M180 148C160 148 142 152 130 158M184 156C166 157 150 161 140 165" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>

    <!-- 身体 -->
    <path d="M176 146C176 106 208 82 246 84C288 86 312 116 306 152C300 186 272 208 234 208C198 208 176 180 176 146Z"
      fill="${CREAM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M188 172C204 196 240 210 270 200C248 212 206 208 188 172Z" fill="${CREAM_SH}" opacity=".9"/>

    <!-- 脖子 -->
    <path d="M248 104C286 84 316 78 344 76L354 106C326 112 296 132 272 152Z"
      fill="${CREAM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M266 138C292 120 320 108 348 104L354 106C326 112 296 132 272 152Z" fill="${CREAM_SH}" opacity=".7"/>

    <!-- 围巾：飘带 + 横过颈根的一圈 -->
    <g>
      <animateTransform attributeName="transform" type="rotate" values="0 256 116;-5 256 116;3 256 116;0 256 116" dur="${CRANK_DUR}" repeatCount="indefinite"/>
      <path d="M252 102C220 94 186 98 158 112C186 110 218 110 248 116Z" fill="${SCARF_SH}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M250 112C222 114 194 124 174 140C198 132 226 126 250 126Z" fill="${SCARF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    </g>
    <path d="M252 92Q266 114 258 144" stroke="${INK}" stroke-width="25" stroke-linecap="round"/>
    <path d="M252 92Q266 114 258 144" stroke="${SCARF}" stroke-width="18" stroke-linecap="round"/>
    <path d="M255 98Q265 114 261 136" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".28"/>

    <!-- 冠羽 -->
    <path d="M344 62C332 50 316 44 304 48C316 55 328 64 336 76Z" fill="${CREAM_SH}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M340 76C328 68 312 64 300 68C312 73 324 82 332 92Z" fill="${CREAM}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>

    <!-- 头 -->
    <ellipse cx="366" cy="82" rx="32" ry="28" transform="rotate(-8 366 82)" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
    <path d="M352 100C366 108 384 106 394 96" stroke="${CREAM_SH}" stroke-width="4" stroke-linecap="round" opacity=".8"/>

    <!-- 喉囊（兜着一条鱼） -->
    <path d="M384 88C390 130 424 152 462 148C490 144 500 118 502 98C468 102 420 94 384 88Z"
      fill="${POUCH}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <g opacity=".55" fill="#c07f34">
      <ellipse cx="446" cy="126" rx="19" ry="9" transform="rotate(-10 446 126)"/>
      <path d="M428 128L412 120L416 134Z"/>
      <circle cx="455" cy="123" r="1.8" fill="${INK}"/>
    </g>
    <path d="M400 104C410 124 432 138 456 138" stroke="#e0a35a" stroke-width="3" stroke-linecap="round" opacity=".8"/>

    <!-- 上喙 -->
    <path d="M384 64C430 62 470 76 504 92C508 95 506 99 501 99C466 96 420 90 386 88Z"
      fill="${BEAK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M392 70C428 70 462 80 492 92" stroke="#ffd08a" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>
    <path d="M400 78q7 -2 12 0" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" opacity=".65"/>

    <!-- 眼睛 -->
    <path d="M360 58q12 -6 22 -1" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" opacity=".55"/>
    <circle cx="373" cy="72" r="9.5" fill="#fffaf8" stroke="${INK}" stroke-width="3"/>
    <circle cx="375" cy="73" r="5" fill="#3b2a20"/>
    <circle cx="377" cy="70.5" r="1.8" fill="#ffffff"/>

    <!-- 近侧翅膀（伸向车把） -->
    <path d="M246 130C296 134 340 154 374 170C386 178 398 188 410 194C400 204 382 202 366 194C330 178 288 162 248 156Z"
      fill="${CREAM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M264 148C300 154 336 170 366 190" stroke="${CREAM_SH}" stroke-width="4" stroke-linecap="round"/>
    <path d="M374 176q16 7 30 13M368 185q15 6 29 10M360 192q13 4 25 7" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>

    <!-- ===================== 近侧曲柄 / 腿 / 踏板 ===================== -->
    <g transform="rotate(${PH} ${BB.x} ${BB.y})">
      ${spinAt(BB, CRANK_DUR)}
      <line x1="${BB.x}" y1="${BB.y}" x2="${r1(P0.x)}" y2="${r1(P0.y)}" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
      <line x1="${BB.x}" y1="${BB.y}" x2="${r1(P0.x)}" y2="${r1(P0.y)}" stroke="${METAL}" stroke-width="10" stroke-linecap="round"/>
    </g>
    <use href="#legNear" xlink:href="#legNear" stroke="${INK}" stroke-width="26"/>
    <use href="#legNear" xlink:href="#legNear" stroke="${LEG}" stroke-width="19"/>
    <g transform="rotate(${PH} ${BB.x} ${BB.y})">
      ${spinAt(BB, CRANK_DUR)}
      <g transform="translate(${r1(P0.x)},${r1(P0.y)})">
        <g transform="rotate(${-PH})">${spin(CRANK_DUR, -PH, -PH - 360)}
          <rect x="-18" y="-5" width="36" height="11" rx="4" fill="#3f3e50" stroke="${INK}" stroke-width="3"/>
          <rect x="-14" y="-3" width="28" height="3" rx="1.5" fill="#6d6c80" opacity=".8"/>
          <!-- 蹼足 -->
          <g transform="translate(1,-15)" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round">
            <path d="M-7 -1C1 -9 19 -10 29 -5L33 3C24 7 17 2 11 7C5 2 -2 7 -10 4Z" fill="${LEG}"/>
            <path d="M6 -2L10 4M18 -3L21 4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>
          </g>
        </g>
      </g>
    </g>
    <circle cx="${BB.x}" cy="${BB.y}" r="8" fill="${METAL}" stroke="${INK}" stroke-width="3"/>
  </g>

  <!-- 卡片描边 -->
  <rect width="512" height="512" rx="48" fill="none" stroke="${INK}" stroke-width="5" opacity=".12"/>
</svg>
`;

writeFileSync(outFile, svg, "utf8");
console.log("wrote", outFile, `(${svg.length} bytes)`);
