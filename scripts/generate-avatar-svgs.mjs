/**
 * 生成日漫风分层头像：2 套性别主题、6 种肤色、7 类部件各 10 款。
 * 所有部件共用 256×256 画布与面部锚点。
 * 运行：npm run generate:avatars  （或 node scripts/generate-avatar-svgs.mjs）
 */
import { copyFileSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "assets", "avatars");
const genders = ["male", "female"];
/** 调色工具：所有明暗/高光由基色派生，保证 6 档肤色光感统一 */
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) =>
  "#" + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
const light = (c, t = 0.38) => mix(c, "#ffffff", t);
const dark = (c, t = 0.3) => mix(c, "#1a1016", t);

/** [基色, 阴影, 腮红, 深色(耳窝/颈影)] —— 阴影偏暖、高光偏冷，统一左上光源 */
const skins = [
  ["#f8d8c7", "#e2a58e", "#ef938c", "#cf8c74"],
  ["#efc2a7", "#d69577", "#e5837b", "#bd7a5e"],
  ["#dda77f", "#bd7756", "#d4746b", "#a26144"],
  ["#bd7d55", "#9a5a3a", "#bb615a", "#834c31"],
  ["#925b3d", "#71412a", "#9c544d", "#5f3522"],
  ["#633d2f", "#472a1e", "#7e4642", "#3a221a"],
].map(([base, shade, blush, deep]) => ({ base, shade, blush, deep }));
const ink = "#241a27";
const white = "#fffaf8";

function svg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" fill="none">
${body}
</svg>
`;
}

function write(parts, body) {
  const file = join(root, ...parts);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg(body), "utf8");
}

/**
 * 参数化脸型：L=太阳穴外侧 X（与 core 的 FACE_TEMPLE_LEFT 同步），C=下巴底 Y，
 * jaw=下颌拐角 X，chin=下巴半宽。曲线全部用 C/Q 平滑过渡，避免折线感。
 */
/** 左侧 X 坐标：L 太阳穴、J 下颌角、K 颏侧点（K>J，右侧镜像 256-x）。曲线切线连续，颏底切线水平 */
const FACE_PARAMS = [
  { L: 72, C: 218, J: 97, K: 108 },  // 0 鹅蛋 / 自然长圆
  { L: 67, C: 219, J: 92, K: 106 },  // 1 圆脸
  { L: 77, C: 226, J: 97, K: 115 },  // 2 小 V / 棱角
  { L: 61, C: 216, J: 87, K: 99 },   // 3 柔和方 / 宽方
  { L: 80, C: 232, J: 99, K: 110 },  // 4 纤长 / 长方
  { L: 65, C: 207, J: 92, K: 106 },  // 5 短圆
  { L: 68, C: 214, J: 88, K: 99 },   // 6 利落方 / 硬朗方下巴
  { L: 72, C: 226, J: 100, K: 109 }, // 7 柔和圆下巴 / 厚实圆下巴
  { L: 62, C: 228, J: 96, K: 106 },  // 8 双下巴
  { L: 74, C: 229, J: 91, K: 117 },  // 9 倒三角 / 宽颧方颌
];

function facePath(pr, masculine) {
  const L = pr.L;
  const R = 256 - L;
  const C = pr.C + (masculine ? 2 : 0);
  const J = pr.J - (masculine ? 4 : 0);   // 左下颌角
  const K = pr.K - (masculine ? 4 : 0);   // 左颏侧点
  const RJ = 256 - J;
  const RK = 256 - K;
  return [
    `M${L} 100`,
    `C${L - 2} 72 ${L + 16} 55 128 54`,
    `C${240 - L} 55 ${R + 2} 72 ${R} 100`,
    `C${R + 2} 138 ${R - 1} 160 ${R - 9} 177`,
    `C${R - 18} 196 ${RJ + 16} ${C - 44} ${RJ} ${C - 26}`,
    `C${RK + 14} ${C - 15} 140 ${C} 128 ${C}`,
    `C116 ${C} ${K - 14} ${C - 15} ${J} ${C - 26}`,
    `C${J - 16} ${C - 44} ${L + 18} 196 ${L + 9} 177`,
    `C${L + 1} 160 ${L - 2} 138 ${L} 100Z`,
  ].join("");
}

// 太阳穴外侧 X：须与 packages/core/src/avatar-parts.ts 的 FACE_TEMPLE_LEFT 保持同步（发型运行时 scaleX 用）
// female: [72, 67, 77, 61, 80, 65, 68, 72, 62, 74]
// male:   [72, 67, 69, 61, 72, 65, 68, 72, 62, 65]
const maleTemple = [72, 67, 69, 61, 72, 65, 68, 72, 62, 65];

/** 脸型个性化补笔：下颌角/双下巴/下巴高光等 */
function faceExtras(i, skin, masculine) {
  const pr = FACE_PARAMS[i];
  const C = pr.C + (masculine ? 2 : 0);
  const jaw = pr.J - (masculine ? 4 : 0);
  const d = skin.deep;
  if (i === 3 || i === 6) {
    return `<path d="M${jaw - 2} ${C - 52} Q${jaw + 4} ${C - 34} ${jaw + 12} ${C - 22} M${256 - jaw + 2} ${C - 52} Q${250 - jaw + 6} ${C - 34} ${244 - jaw + 12} ${C - 22}" stroke="${d}" stroke-width="2.4" stroke-linecap="round" opacity=".38" fill="none"/>`;
  }
  if (i === 8) {
    return `<path d="M98 ${C - 22} Q128 ${C - 8} 158 ${C - 22}" stroke="${d}" stroke-width="2.6" stroke-linecap="round" opacity=".4" fill="none"/><path d="M104 ${C - 12} Q128 ${C - 1} 152 ${C - 12}" stroke="${d}" stroke-width="2.2" stroke-linecap="round" opacity=".3" fill="none"/>`;
  }
  if (i === 2 || i === 9) {
    return `<path d="M118 ${C - 12} Q128 ${C - 7} 138 ${C - 12}" stroke="${light(skin.base, 0.5)}" stroke-width="3" stroke-linecap="round" opacity=".5" fill="none"/>`;
  }
  return "";
}

for (const gender of genders) {
  const masculine = gender === "male";
  for (let skinIndex = 0; skinIndex < skins.length; skinIndex += 1) {
    const skin = skins[skinIndex];
    for (let i = 0; i < 10; i += 1) {
      const pr = { ...FACE_PARAMS[i] };
      if (masculine) pr.L = maleTemple[i];
      const fp = facePath(pr, masculine);
      const L = pr.L;
      const R = 256 - L;
      const C = pr.C + (masculine ? 2 : 0);
      const jaw = pr.J - (masculine ? 4 : 0);
      const kj = pr.K - (masculine ? 4 : 0);
      const RJ = 256 - jaw;
      const nh = Math.round((128 - jaw) * 0.62 + 14);  // 颈半宽
      const earX = L + 1;
      const blush = masculine
        ? ""
        : `<ellipse cx="95" cy="157" rx="16" ry="8.5" fill="url(#bl)"/>
  <ellipse cx="161" cy="157" rx="16" ry="8.5" fill="url(#bl)"/>`;
      write(
        [gender, "face", String(skinIndex), `${i}.svg`],
        `  <defs>
    <radialGradient id="bl"><stop offset="0" stop-color="${skin.blush}" stop-opacity=".5"/><stop offset="1" stop-color="${skin.blush}" stop-opacity="0"/></radialGradient>
    <radialGradient id="hl"><stop offset="0" stop-color="#ffffff" stop-opacity=".12"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <clipPath id="fc"><path d="${fp}"/></clipPath>
  </defs>
  <!-- 颈 + 下颌投影 -->
  <path d="M${128 - nh + 5} 182 C${128 - nh} 200 ${128 - nh} 220 ${128 - nh + 2} 236 Q128 244 ${128 + nh - 2} 236 C${128 + nh} 220 ${128 + nh} 200 ${128 + nh - 5} 182Z" fill="${skin.base}" stroke="${ink}" stroke-width="3"/>
  <path d="M${128 - nh + 3} 198 Q128 222 ${128 + nh - 3} 198 L${128 + nh - 3} 210 Q128 234 ${128 - nh + 3} 210Z" fill="${skin.deep}" opacity=".45"/>
  <!-- 耳 -->
  <ellipse cx="${earX}" cy="140" rx="11" ry="17" fill="${skin.base}" stroke="${ink}" stroke-width="3"/>
  <ellipse cx="${256 - earX}" cy="140" rx="11" ry="17" fill="${skin.base}" stroke="${ink}" stroke-width="3"/>
  <path d="M${earX - 3} 133 Q${earX + 3} 139 ${earX} 148 M${259 - earX} 133 Q${253 - earX} 139 ${256 - earX} 148" stroke="${skin.deep}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/>
  <!-- 脸 -->
  <path d="${fp}" fill="${skin.base}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <!-- 统一左上光源：右侧落影 + 左侧柔光（裁剪在脸内） -->
  <g clip-path="url(#fc)">
    <path d="M${R - 15} 108 C${R - 17} 148 ${R - 25} 172 ${256 - jaw - 14} ${C - 32} C${256 - kj - 12} ${C - 14} 146 ${C - 2} 142 ${C + 4} L156 ${C + 14} L262 ${C + 14} L262 40 L${R + 8} 40 C${R + 2} 78 ${R - 8} 94 ${R - 15} 108Z" fill="${skin.shade}" opacity=".25"/>
    <path d="M92 ${C - 10} Q128 ${C + 6} 164 ${C - 10} Q128 ${C - 2} 92 ${C - 10}Z" fill="${skin.shade}" opacity=".35"/>
    <ellipse cx="100" cy="106" rx="48" ry="32" fill="url(#hl)"/>
  </g>
  ${blush}
  ${faceExtras(i, skin, masculine)}`,
      );
    }
  }
}

/** 虹膜色相：10 款各自和谐的高饱和低明度色 */
const IRIS = ["#6d4a2c", "#3e6d9c", "#4c7a52", "#7b529b", "#7c4a32", "#31607e", "#8a4f57", "#3e7d84", "#7d6a45", "#5a6e8c"];

/** 每款眼：sc=眼白轮廓, ir=虹膜半径, dx/dy=虹膜偏移, lash=上睫毛(锥形填充), lower=下睫线, lid=双眼皮褶, spark=星光 */
const EYES = [
  { sc: "M-18 2 Q-10 -12 2 -12 Q14 -10 18 0 Q10 10 -2 10 Q-12 8 -18 2Z", ir: 8.6, dx: 1, dy: 0,
    lash: "M-19.5 1 C-14 -10 -4 -14.5 6 -13.5 C13 -12.6 18 -8 20.5 -1.5 C17.5 -6 11 -9.4 4 -9.8 C-5 -10.2 -14 -6 -19.5 1Z",
    lower: "M-14 8 Q-2 12 12 8", lid: "M-15 -8 Q0 -16 15 -7" },
  { sc: "M-15 0 Q-15 -13 0 -13 Q15 -13 15 0 Q15 12 0 12 Q-15 12 -15 0Z", ir: 10, dx: 0, dy: 0.5,
    lash: "M-16 -1 C-12 -12 -4 -16 3 -15.5 C10 -15 15 -10 16.5 -2 C13 -7.5 8 -11 1 -11.4 C-6 -11.8 -12 -8 -16 -1Z",
    lower: "M-12 9.5 Q0 13 12 9.5", lid: "M-13 -9 Q0 -17 13 -9" },
  { sc: "M-18 -2 Q-8 -12 4 -10 Q16 -6 18 4 Q8 12 -4 10 Q-14 6 -18 -2Z", ir: 8.4, dx: 0, dy: 1,
    lash: "M-19 -3 C-13 -11 -3 -13.5 6 -11.5 C13 -10 18 -5 19.5 2 C16.5 -3 11 -6.8 4 -7.6 C-5 -8.6 -14 -6 -19 -3Z",
    lower: "M-14 6 Q-2 11 13 7", lid: "M-15 -8 Q0 -14 15 -4" },
  { sc: "M-18 4 Q-8 -10 4 -12 Q15 -12 19 -6 Q12 6 0 8 Q-10 8 -18 4Z", ir: 8, dx: 1, dy: -1,
    lash: "M-19 3 C-13 -8 -3 -13.5 7 -13 C14 -12.6 19 -9 22 -4.5 C18 -7.5 12 -9.6 5 -9.8 C-4 -10 -13 -5 -19 3Z",
    lower: "M-14 7 Q-2 10 12 6", lid: "M-15 -6 Q0 -15 16 -8" },
  { closed: true,
    lash: "M-16 7 C-10 -5 -2 -9.5 4 -9 C11 -8.4 15 -3 17 4 C13.5 -1.5 9 -4.8 3 -5 C-4 -5.2 -11 -1 -16 7Z",
    lower: "M-11 9 Q0 12.5 11 9" },
  { sc: "M-18 0 Q-6 -12 6 -10 Q16 -8 19 -3 Q9 8 -3 8 Q-12 6 -18 0Z", ir: 8.2, dx: 1, dy: 0,
    lash: "M-19 -1 C-13 -11 -3 -14 6 -12.5 C14 -11.2 19 -7 23 -3.5 C18.5 -6.5 12 -8.6 5 -8.9 C-4 -9.2 -13 -5.5 -19 -1Z",
    lower: "M-14 6.5 Q-2 10 13 5.5", lid: "M-15 -7 Q0 -15 16 -7" },
  { sc: "M-14 0 Q-13 -12 0 -12 Q13 -12 14 0 Q13 12 0 12 Q-13 12 -14 0Z", ir: 7, dx: 0, dy: -2,
    lash: "M-15 -2 C-11 -11 -4 -14 2 -13.6 C9 -13.2 14 -9 15.5 -3 C12.5 -7.5 8 -10.4 1 -10.6 C-6 -10.8 -11 -7.5 -15 -2Z",
    lower: "M-11 9.5 Q0 12.5 11 9.5", lid: "M-12 -8.5 Q0 -16 12 -8.5" },
  { sc: "M-16 0 Q-16 -14 0 -14 Q16 -14 16 0 Q16 13 0 13 Q-16 13 -16 0Z", ir: 11, dx: 0, dy: 0.5,
    lash: "M-17.5 -1 C-13 -13 -4 -17 3 -16.5 C11 -16 16 -11 18 -2.5 C14 -8.5 8.5 -12 1.5 -12.4 C-6 -12.8 -13 -8.5 -17.5 -1Z",
    lower: "M-13 10 Q0 13.5 13 10", lid: "M-14 -10 Q0 -18 14 -10",
    spark: `<path d="M6 -6 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6Z" fill="#ffffff" opacity=".9"/>` },
  { sc: "M-17 0 Q-6 -8 6 -8 Q15 -6 17 0 Q8 6 -4 6 Q-12 4 -17 0Z", ir: 6.6, dx: 1, dy: 0,
    lash: "M-18 0 C-12 -7.5 -3 -10.5 6 -9.8 C13 -9.2 17 -6 19.5 -1.5 C16 -4.8 10.5 -6.8 4 -7 C-5 -7.2 -13 -4 -18 0Z",
    lower: "M-13 4.5 Q-2 7.5 12 4", lid: "M-14 -5.5 Q0 -12 15 -5" },
  { sc: "M-18 2 Q-4 -10 8 -8 Q17 -6 18 -1 Q6 6 -6 6 Q-14 5 -18 2Z", ir: 7.6, dx: 1, dy: -0.5,
    lash: "M-19 1.5 C-12 -8 -2 -11.5 8 -10 C15 -9 19 -5.5 22.5 -1 C18 -4.6 12 -6.8 5 -7 C-4 -7.2 -13 -3.5 -19 1.5Z",
    lower: "M-14 5 Q-3 8 13 3.5", lid: "M-15 -5 Q0 -13 16 -6" },
];

function eyeInner(i, feminine) {
  const E = EYES[i];
  if (E.closed) {
    return `<path d="${E.lash}" fill="${ink}"/>
  <path d="M17 4 l4 3 M-16 7 l-3.5 3" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="${E.lower}" stroke="${ink}" stroke-width="2" opacity=".45" fill="none" stroke-linecap="round"/>`;
  }
  const ir = E.ir + (feminine ? 0.9 : 0);
  const c = IRIS[i];
  const { dx, dy } = E;
  return `<path d="${E.sc}" fill="#fffaf6"/>
  <g clip-path="url(#el)">
    <path d="M-20 5 Q0 -17 20 5 L20 -22 L-20 -22Z" fill="${ink}" opacity=".15"/>
    <circle cx="${dx}" cy="${dy}" r="${ir}" fill="${c}"/>
    <circle cx="${dx}" cy="${dy}" r="${ir}" fill="none" stroke="${dark(c, 0.45)}" stroke-width="2"/>
    <path d="M${dx - ir + 1.5} ${dy + 1} Q${dx} ${dy + ir - 0.5} ${dx + ir - 1.5} ${dy + 1} Q${dx} ${dy + ir - 5} ${dx - ir + 1.5} ${dy + 1}Z" fill="${light(c, 0.55)}" opacity=".85"/>
    <circle cx="${dx}" cy="${dy + 0.6}" r="${(ir * 0.42).toFixed(1)}" fill="#1d1218"/>
    <circle cx="${(dx - ir * 0.34).toFixed(1)}" cy="${(dy - ir * 0.36).toFixed(1)}" r="${(ir * 0.3).toFixed(1)}" fill="#ffffff" opacity=".95"/>
    <circle cx="${(dx + ir * 0.34).toFixed(1)}" cy="${(dy + ir * 0.34).toFixed(1)}" r="${(ir * 0.16).toFixed(1)}" fill="#ffffff" opacity=".5"/>
    ${E.spark || ""}
  </g>
  <path d="${E.sc}" fill="none" stroke="${ink}" stroke-width="2.2" opacity=".5"/>
  <path d="${E.lash}" fill="${ink}"/>
  ${feminine ? `<path d="M18 -6 l6 -4 M19 -2 l6.5 -1.5" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>` : ""}
  <path d="${E.lower}" stroke="${ink}" stroke-width="2" opacity=".45" fill="none" stroke-linecap="round"/>
  ${E.lid ? `<path d="${E.lid}" stroke="${ink}" stroke-width="2" opacity=".3" fill="none" stroke-linecap="round"/>` : ""}`;
}

for (const gender of genders) {
  const feminine = gender === "female";
  const eyeY = feminine ? 122 : 124;
  for (let i = 0; i < 10; i += 1) {
    const e = eyeInner(i, feminine);
    write(
      [gender, "eyes", `${i}.svg`],
      `  <defs><clipPath id="el"><path d="${EYES[i].sc || "M0 0"}"/></clipPath></defs>
  <g transform="translate(96 ${eyeY})">${e}</g>
  <g transform="translate(160 ${eyeY}) scale(-1 1)">${e}</g>`,
    );
  }
}

/** 眉毛：内粗外细的锥形色块（取代等宽描边） */
const BROWS = [
  { len: 20, th: 4.6, arch: 6, tilt: 1 },
  { len: 21, th: 6.2, arch: 3, tilt: 2 },
  { len: 19, th: 4, arch: 9, tilt: 0 },
  { len: 20, th: 5.2, arch: 5, tilt: -2 },
  { len: 16, th: 3.4, arch: 6, tilt: 1 },
  { len: 23, th: 4.2, arch: 7, tilt: 2 },
  { len: 19, th: 4.4, arch: 11, tilt: -3 },
  { len: 20, th: 5.2, arch: 2, tilt: 3 },
  { len: 21, th: 3.2, arch: 8, tilt: 0 },
  { len: 21, th: 6.6, arch: 8, tilt: -1 },
];

function browPath(b) {
  const { len, th, arch, tilt } = b;
  return `M${-len} ${tilt} C${-len * 0.45} ${-arch - th} ${len * 0.25} ${-arch - th} ${len} ${tilt - 2} C${len * 0.3} ${-arch + th * 0.25} ${-len * 0.4} ${-arch + th * 0.35} ${-len} ${tilt + th * 0.8}Z`;
}

for (const gender of genders) {
  const feminine = gender === "female";
  const y = feminine ? 99 : 101;
  const col = feminine ? "#3a2a30" : "#33242c";
  for (let i = 0; i < 10; i += 1) {
    const b = { ...BROWS[i] };
    if (feminine) { b.th *= 0.72; b.len += 1; }
    const d = browPath(b);
    write(
      [gender, "brows", `${i}.svg`],
      `  <g fill="${col}">
    <g transform="translate(96 ${y})"><path d="${d}"/></g>
    <g transform="translate(160 ${y}) scale(-1 1)"><path d="${d}"/></g>
  </g>`,
    );
  }
}

/** 鼻子：弱化墨线，改用半透明影 + 高光点，10 款形态 */
for (const gender of genders) {
  const feminine = gender === "female";
  const dy = feminine ? -2 : 0;
  const o = feminine ? 0.45 : 0.55;
  const noses = [
    `<path d="M127 ${148 + dy} q-4 6 1 9" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" opacity="${o}" fill="none"/><circle cx="123" cy="${145 + dy}" r="2" fill="#ffffff" opacity=".4"/>`,
    `<path d="M122 ${154 + dy} q4 4 7 2 M134 ${154 + dy} q-4 4 -7 2" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity="${o}" fill="none"/><path d="M128 ${142 + dy} v8" stroke="${ink}" stroke-width="2" opacity="${o * 0.6}" stroke-linecap="round"/>`,
    `<path d="M124 ${140 + dy} q-4 10 0 17" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity="${o}" fill="none"/><path d="M121 ${157 + dy} q4 3 8 1" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" opacity="${o}" fill="none"/>`,
    `<path d="M121 ${155 + dy} q7 6 14 0" stroke="${ink}" stroke-width="3" stroke-linecap="round" opacity="${o}" fill="none"/><circle cx="124" cy="${147 + dy}" r="2" fill="#ffffff" opacity=".35"/>`,
    `<circle cx="128" cy="${154 + dy}" r="2.6" fill="${ink}" opacity="${o}"/><path d="M120 ${156 + dy} q3 3 6 2 M136 ${156 + dy} q-3 3 -6 2" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity="${o * 0.7}" fill="none"/>`,
    `<path d="M125 ${138 + dy} q-5 12 -1 19 q3 3 7 1" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity="${o}" fill="none"/>`,
    `<path d="M117 ${153 + dy} q4 6 10 4 M139 ${153 + dy} q-4 6 -10 4" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" opacity="${o}" fill="none"/><path d="M128 ${145 + dy} v7" stroke="${ink}" stroke-width="2" opacity="${o * 0.6}" stroke-linecap="round"/>`,
    `<path d="M123 ${152 + dy} q5 -5 10 0 q-5 7 -10 0Z" fill="${ink}" opacity="${o * 0.8}"/><path d="M120 ${156 + dy} q4 3 8 2 M136 ${156 + dy} q-4 3 -8 2" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity="${o * 0.7}" fill="none"/>`,
    `<path d="M128 ${141 + dy} l-5 15 q5 4 10 0Z" fill="${ink}" opacity=".3"/><path d="M123 ${156 + dy} q5 4 10 0" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity="${o}" fill="none"/>`,
    `<path d="M126 ${143 + dy} q-5 9 -1 14 q3 3 8 1" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity="${o}" fill="none"/><circle cx="122" cy="${141 + dy}" r="1.8" fill="#ffffff" opacity=".4"/>`,
  ];
  for (let i = 0; i < 10; i += 1) {
    write([gender, "nose", `${i}.svg`], `  ${noses[i]}`);
  }
}

/** 嘴：口腔/牙齿/舌头/唇色分层，取代单色描边 */
const M_IN = "#5e2836";
const M_TONGUE = "#d76d7e";
const M_TEETH = "#fffaf6";
for (const gender of genders) {
  const feminine = gender === "female";
  const y = feminine ? 177 : 180;
  const lip = feminine ? "#c25368" : "#96525a";
  const mouths = [
    `<path d="M110 ${y} C118 ${y + 6} 138 ${y + 6} 146 ${y}" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".85"/><path d="M112 ${y + 1} l-4 -3 M144 ${y + 1} l4 -3" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/><path d="M119 ${y + 9} Q128 ${y + 13} 137 ${y + 9}" stroke="${lip}" stroke-width="3" stroke-linecap="round" opacity=".55" fill="none"/>`,
    `<path d="M110 ${y - 2} Q128 ${y - 6} 146 ${y - 2} Q144 ${y + 16} 128 ${y + 18} Q112 ${y + 16} 110 ${y - 2}Z" fill="${M_IN}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="M113 ${y - 1} Q128 ${y - 4} 143 ${y - 1} L141 ${y + 5} Q128 ${y + 2} 115 ${y + 5}Z" fill="${M_TEETH}"/><path d="M119 ${y + 12} Q128 ${y + 6} 137 ${y + 12} Q128 ${y + 17} 119 ${y + 12}Z" fill="${M_TONGUE}"/>`,
    `<path d="M112 ${y + 2} Q128 ${y + 8} 144 ${y - 2}" stroke="${ink}" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".85"/><path d="M144 ${y - 2} l5 -4" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/><path d="M120 ${y + 10} Q129 ${y + 13} 138 ${y + 8}" stroke="${lip}" stroke-width="2.8" stroke-linecap="round" opacity=".5" fill="none"/>`,
    `<ellipse cx="128" cy="${y + 6}" rx="8" ry="10.5" fill="${M_IN}" stroke="${ink}" stroke-width="2.4"/><path d="M122 ${y + 11} Q128 ${y + 6} 134 ${y + 11} Q128 ${y + 15} 122 ${y + 11}Z" fill="${M_TONGUE}"/>`,
    `<path d="M112 ${y} Q120 ${y - 6} 128 ${y - 1} Q136 ${y - 6} 144 ${y} Q136 ${y + 8} 128 ${y + 8} Q120 ${y + 8} 112 ${y}Z" fill="${lip}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M120 ${y - 2} q4 -2 7 0" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".45" fill="none"/><path d="M120 ${y + 11} Q128 ${y + 14} 136 ${y + 11}" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity=".3" fill="none"/>`,
    `<path d="M108 ${y - 3} Q128 ${y - 7} 148 ${y - 3} Q146 ${y + 18} 128 ${y + 20} Q110 ${y + 18} 108 ${y - 3}Z" fill="${M_IN}" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/><path d="M111 ${y - 2} Q128 ${y - 5} 145 ${y - 2} L144 ${y + 6} Q128 ${y + 2} 112 ${y + 6}Z" fill="${M_TEETH}"/><path d="M106 ${y - 4} l-4 -3 M150 ${y - 4} l4 -3" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
    `<path d="M114 ${y} Q128 ${y + 6} 142 ${y}" stroke="${ink}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".85"/><path d="M119 ${y + 8} Q128 ${y + 12} 137 ${y + 8}" stroke="${lip}" stroke-width="3.2" stroke-linecap="round" opacity=".6" fill="none"/>`,
    `<path d="M114 ${y + 1} Q128 ${y + 4} 142 ${y + 1}" stroke="${ink}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"/><path d="M120 ${y + 8} Q128 ${y + 11} 136 ${y + 8}" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity=".25" fill="none"/>`,
    `<path d="M116 ${y - 2} Q128 ${y - 6} 140 ${y - 2} Q138 ${y + 12} 128 ${y + 13} Q118 ${y + 12} 116 ${y - 2}Z" fill="${M_IN}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M119 ${y - 1} Q128 ${y - 3.5} 137 ${y - 1} L136 ${y + 4} Q128 ${y + 1.5} 120 ${y + 4}Z" fill="${M_TEETH}"/>`,
    `<circle cx="128" cy="${y + 5}" r="6.5" fill="${M_IN}" stroke="${ink}" stroke-width="2.4"/><path d="M124 ${y + 3} Q128 ${y + 0.5} 132 ${y + 3}" stroke="${ink}" stroke-width="1.8" opacity=".5" fill="none"/>`,
  ];
  for (let i = 0; i < 10; i += 1) {
    write([gender, "mouth", `${i}.svg`], `  ${mouths[i]}`);
  }
}

/** 胡须：暖深棕发色 + 发丝高光；轮廓贴合各脸型下颌（FACE_PARAMS 派生） */
const B_BASE = "#3b2c31";
const B_LIGHT = "#6f565c";

function beardStyles(i, g) {
  const pr = FACE_PARAMS[i];
  const masc = g === "male";
  const J = pr.J - (masc ? 4 : 0);
  const K = pr.K - (masc ? 4 : 0);
  const C = pr.C + (masc ? 2 : 0);
  const RJ = 256 - J;
  const RK = 256 - K;
  const mw = Math.round(13 + (128 - J) * 0.14);      // 髭半宽
  const mous = (w, y, th) =>
    `<path d="M127 ${y} C120 ${y - 4} 112 ${y - 3} ${128 - w} ${y + 2} C112 ${y + 6} 120 ${y + 7} 127 ${y + 4}Z M129 ${y} C136 ${y - 4} 144 ${y - 3} ${128 + w} ${y + 2} C144 ${y + 6} 136 ${y + 7} 129 ${y + 4}Z" fill="${B_BASE}"/><path d="M128 ${y - 1} V${y + 5}" stroke="${B_LIGHT}" stroke-width="2" opacity=".7"/>`;
  const massOuter = (off, drop) =>
    `M${J - off + 6} 148 C${J - off} 170 ${K - off + 2} ${C - 30} ${K + 2} ${C - 14 + drop * 0.4} Q128 ${C + drop} ${RK - 2} ${C - 14 + drop * 4 * 0.1} C${RK + off - 2} ${C - 30} ${RJ + off} 170 ${RJ + off - 6} 148`;
  const mass = (off, drop) =>
    `<path d="${massOuter(off, drop)} Q${RJ - 10} 152 ${RK - 10} 162 Q138 154 128 166 Q118 154 ${K + 10} 162 Q${J + 10} 152 ${J - off + 6} 148Z M110 168 Q128 159 146 168 Q144 187 128 191 Q112 187 110 168Z" fill="${B_BASE}" fill-rule="evenodd" stroke="${B_LIGHT}" stroke-width="2.5" stroke-linejoin="round" opacity=".98"/>`;
  const massStrands = (drop) =>
    `<path d="M${J + 2} 168 Q${J + 8} 182 ${K + 4} ${C - 18} M${RJ - 2} 168 Q${RJ - 8} 182 ${RK - 4} ${C - 18} M116 ${C - 16 + drop * 0.4} Q128 ${C - 8 + drop * 0.4} 140 ${C - 16 + drop * 0.4}" stroke="${B_LIGHT}" stroke-width="2.6" fill="none" opacity=".65" stroke-linecap="round"/>`;
  const styles = [
    mous(mw, 166, 4),
    `${mous(mw + 2, 167, 5)}<path d="M${128 - mw - 4} 170 l-6 8 M${132 + mw} 170 l6 8" stroke="${B_BASE}" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="M127 167 C118 161 108 162 102 168 C98 173 92 171 92 164 M129 167 C138 161 148 162 154 168 C158 173 164 171 164 164" stroke="${B_BASE}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M96 162 l-5 -5 M160 162 l5 -5" stroke="${B_BASE}" stroke-width="3.4" stroke-linecap="round"/>`,
    `${mous(mw, 166, 4)}<path d="M118 180 C112 192 116 ${C - 10} 128 ${C - 4} C140 ${C - 10} 144 192 138 180 Q128 176 118 180Z" fill="${B_BASE}"/><path d="M124 186 Q128 190 132 186" stroke="${B_LIGHT}" stroke-width="2.2" fill="none" opacity=".7"/>`,
    `${mass(8, 10)}${mous(mw + 2, 165, 5)}${massStrands(10)}`,
    `${mous(mw, 167, 5)}<path d="M112 172 C104 186 110 ${C - 14} 128 ${C - 7} C146 ${C - 14} 152 186 144 172" stroke="${B_BASE}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M118 ${C - 10} Q128 ${C - 2} 138 ${C - 10}" stroke="${B_LIGHT}" stroke-width="2.6" fill="none" opacity=".7"/>`,
    `<path d="M${J + 2} 152 Q${J - 2} ${C - 40} ${K + 2} ${C - 16} Q128 ${C - 4} ${RK - 2} ${C - 16} Q${RJ + 2} ${C - 40} ${RJ - 2} 152" stroke="${B_BASE}" stroke-width="8" stroke-linecap="round" fill="none" opacity=".9"/><path d="M${J + 4} 150 l-2 10 M${RJ - 4} 150 l2 10" stroke="${B_BASE}" stroke-width="6" stroke-linecap="round"/><path d="M${K + 12} ${C - 24} l6 6 M${RK - 12} ${C - 24} l-6 6" stroke="${B_LIGHT}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
    `${mass(5, 4)}${mous(mw, 166, 4)}${massStrands(4)}`,
    `${mass(13, 22)}${mous(mw + 3, 164, 6)}${massStrands(22)}<path d="M${J - 4} 156 q-6 14 0 26 M${RJ + 4} 156 q6 14 0 26" stroke="${B_BASE}" stroke-width="6" stroke-linecap="round" opacity=".9"/>`,
  ];
  return styles[i - 1];
}

for (const gender of genders) {
  for (let faceIndex = 0; faceIndex < 10; faceIndex += 1) {
    for (let i = 0; i < 10; i += 1) {
      if (i === 0) {
        write([gender, "beard", String(faceIndex), "0.svg"], "  <!-- clean shaven -->");
        continue;
      }
      write(
        [gender, "beard", String(faceIndex), `${i}.svg`],
        `  <g opacity="${gender === "female" ? 0.8 : 0.96}">${beardStyles(i, gender)}</g>`,
      );
    }
  }
}

const hairColors = ["#2b2331", "#4a3138", "#7a4a33", "#c05a72", "#e0b04f", "#4a76a8", "#8465a8", "#23202b", "#c96f3b", "#4a8571"];

/** 发丝语法：base 轮廓 + under 内层暗发束 + sheen 高光带 + rim 左上轮廓光 */
const under = (d, c) => `<path d="${d}" fill="${dark(c, 0.3)}" opacity=".85" stroke="none"/>`;
const sheen = (d, c) => `<path d="${d}" fill="${light(c, 0.55)}" opacity=".4" stroke="none"/>`;
const rim = (d, c) => `<path d="${d}" fill="none" stroke="${light(c, 0.62)}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
const strand = (d, c) => `<path d="${d}" fill="none" stroke="${dark(c, 0.35)}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;

const maleHair = (c) => [
  // 0 尖刺短发：刘海为深 V 发齿
  `<path d="M66 122 C62 60 96 34 128 33 C160 34 194 60 190 122 L184 106 L178 114 L172 96 L164 108 L156 88 L146 102 L138 82 L128 98 L118 80 L108 100 L98 86 L90 106 L82 94 L76 112 L70 102Z" fill="${c}"/>
  ${under("M90 106 L98 86 L108 100 L118 80 L128 98 L138 82 L146 102 Q128 92 108 96 Q96 100 90 106Z", c)}
  ${sheen("M88 52 Q120 36 156 48 L148 58 Q122 48 96 60Z", c)}
  ${rim("M70 100 C72 60 100 38 128 36", c)}
  <path d="M67 120 q1 10 5 16 M189 120 q-1 10 -5 16" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  // 1 侧分短发：分线在左，刘海扫向右
  `<path d="M66 120 C62 60 98 34 130 34 C164 36 192 62 190 118 L184 118 Q176 112 166 108 Q138 98 106 96 Q86 96 72 112Z" fill="${c}"/>
  <path d="M106 96 Q138 98 166 108 L158 120 L150 109 L138 118 L128 107 L116 116 L108 105Z" fill="${c}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
  ${under("M106 96 Q140 98 168 108 Q142 104 112 102 Q96 100 106 96Z", c)}
  ${strand("M104 92 Q100 66 106 44", c)}
  ${sheen("M96 50 Q126 34 158 46 L150 56 Q124 46 102 58Z", c)}
  ${rim("M68 104 C70 58 100 36 130 36", c)}
  <path d="M66 118 q1 10 5 16 M189 116 q-1 10 -5 16" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  // 2 光头
  ``,
  // 3 凌乱短发
  `<path d="M64 124 C60 60 96 32 128 32 C162 34 194 62 191 122 L186 104 L180 116 L172 94 L164 110 L154 86 L146 104 L136 80 L126 100 L116 78 L106 102 L96 84 L88 108 L80 92 L74 114 L68 100Z" fill="${c}"/>
  ${under("M88 108 L96 84 L106 102 L116 78 L126 100 L136 80 Q116 88 100 96 Q92 102 88 108Z", c)}
  ${sheen("M90 48 Q122 32 154 44 L146 54 Q120 44 96 56Z", c)}
  ${rim("M66 104 C66 56 98 34 128 34", c)}
  <path d="M120 30 q-6 -12 4 -18 M142 32 q8 -10 2 -18" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M65 122 q1 10 5 16 M190 120 q-1 10 -5 16" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  // 4 侧扫长发：右分，长刘海扫过左额
  `<path d="M64 128 C58 62 96 32 130 32 C166 34 194 62 192 126 L186 116 Q170 102 148 106 Q116 112 92 124 Q78 130 70 136Z" fill="${c}"/>
  <path d="M148 106 Q170 102 186 116 L178 126 L170 115 L158 124 L148 113 L136 122 L126 113Z" fill="${c}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
  ${under("M148 106 Q170 102 186 116 Q168 110 146 110 Q120 114 96 124 Q120 110 148 106Z", c)}
  ${strand("M158 44 Q128 62 96 92 M172 58 Q142 76 110 104", c)}
  ${sheen("M94 46 Q126 30 158 42 L150 52 Q124 42 100 54Z", c)}
  ${rim("M64 108 C64 56 98 34 130 34", c)}
  <path d="M64 126 q-1 20 5 34 M191 124 q0 18 -4 30" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`,
  // 5 莫西干
  `<path d="M102 94 C104 66 110 40 118 18 L124 34 L128 6 L134 32 L140 14 C146 40 152 66 154 94 Q128 76 102 94Z" fill="${c}"/>
  ${under("M112 86 Q128 74 144 86 Q128 82 112 86Z", c)}
  ${rim("M112 60 C116 36 122 18 127 4", c)}
  <path d="M80 100 C84 88 92 80 100 78 L98 98 Q89 99 80 100Z M176 100 C172 88 164 80 156 78 L158 98 Q167 99 176 100Z" fill="${dark(c, 0.45)}" opacity=".3"/>`,
  // 6 狼尾：软刘海底 + 颈后发束
  `<path d="M64 126 C58 62 96 34 128 32 C162 34 196 62 192 126 L196 150 L186 142 L188 162 L176 148 L172 130 L166 112 L158 100 L148 108 L140 96 L130 106 L120 94 L110 106 L100 96 L90 108 L84 122 L80 140 L76 152 L66 164 L68 144 L60 152Z" fill="${c}"/>
  ${under("M90 108 L100 96 L110 106 L120 94 L130 106 L140 96 L148 108 Q128 98 108 102 Q96 104 90 108Z", c)}
  ${sheen("M92 50 Q124 34 156 46 L148 56 Q122 46 98 58Z", c)}
  ${rim("M64 108 C64 56 98 36 128 34", c)}`,
  // 7 Afro 爆炸头
  `<path d="M60 118 C42 108 42 86 56 74 C46 52 60 32 80 28 C86 8 108 0 124 8 C140 -6 162 2 170 20 C192 16 208 36 204 56 C220 68 220 94 206 106 C208 124 186 136 168 124 Q128 100 88 124 C72 136 58 132 60 118Z" fill="${c}"/>
  ${under("M88 124 Q128 100 168 124 Q150 114 128 114 Q106 114 88 124Z", c)}
  <g fill="none" stroke="${light(c, 0.4)}" stroke-width="3.4" stroke-linecap="round" opacity=".55">
    <path d="M62 82 q8 -12 18 -2 M84 46 q10 -10 20 0 M116 24 q10 -8 20 2 M152 32 q10 -8 18 4 M180 60 q10 -6 16 6 M188 94 q8 -4 12 8 M64 104 q6 -8 14 -4"/>
  </g>
  ${rim("M62 98 C58 60 84 32 112 26", c)}`,
  // 8 丸子头：发丝向丸子收拢
  `<path d="M70 116 C66 62 98 36 128 34 C158 36 190 62 186 116 Q160 96 128 96 Q96 96 70 116Z" fill="${c}"/>
  <circle cx="152" cy="28" r="16" fill="${c}" stroke="${ink}" stroke-width="4"/>
  <path d="M140 38 q12 7 24 0" stroke="${dark(c, 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>
  ${strand("M92 62 Q118 46 138 36 M84 86 Q114 62 140 44", c)}
  ${sheen("M92 52 Q122 36 152 48 L145 57 Q120 47 98 59Z", c)}
  ${rim("M72 100 C72 58 100 36 128 36", c)}
  <path d="M70 110 q1 9 4 14 M186 110 q-1 9 -4 14" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  // 9 蓬松卷发
  `<path d="M62 120 C50 112 50 94 62 86 C54 68 66 50 84 48 C88 30 108 22 124 28 C138 16 160 22 168 38 C186 38 198 54 194 72 C206 80 206 100 196 108 C200 118 188 128 176 124 Q128 92 82 124 C70 130 60 126 62 116Z" fill="${c}"/>
  ${under("M82 124 Q128 92 176 124 Q152 112 128 112 Q104 112 82 124Z", c)}
  <g fill="none" stroke="${light(c, 0.42)}" stroke-width="3.2" stroke-linecap="round" opacity=".5">
    <path d="M70 92 q6 -10 16 -4 M92 56 q10 -8 18 2 M124 36 q10 -6 18 4 M156 48 q10 -6 16 6 M182 78 q8 -4 12 8"/>
  </g>
  ${rim("M64 100 C60 62 88 36 116 32", c)}
  <path d="M64 118 q1 9 5 14 M194 106 q-1 10 -5 16" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`,
];

const femaleHair = (c) => [
  // 0 短层次波波：帘式刘海 + 内扣发尾
  `<path d="M62 148 C52 64 94 34 128 34 C162 34 204 64 194 148 C192 162 184 174 174 172 C179 154 178 134 174 120 Q160 100 144 96 Q136 94 128 96 Q120 94 112 96 Q96 100 82 120 C78 134 77 154 83 172 C73 174 64 162 62 148Z" fill="${c}"/>
  ${under("M82 120 Q96 100 112 96 Q120 94 128 96 Q136 94 144 96 Q160 100 174 120 Q152 106 128 106 Q104 106 82 120Z", c)}
  <path d="M112 96 Q120 94 128 96 Q136 94 144 96 L140 114 L132 103 L124 114 L116 103Z" fill="${c}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
  ${strand("M96 44 Q88 74 84 104 M160 44 Q168 74 172 104", c)}
  ${sheen("M92 50 Q126 32 160 48 L152 58 Q124 44 100 58Z", c)}
  ${rim("M64 116 C60 60 96 36 128 36", c)}
  <path d="M128 96 q-9 10 -13 24 M128 96 q9 10 13 24" stroke="${dark(c, 0.35)}" stroke-width="2.6" fill="none" opacity=".7"/>`,
  // 1 柔顺长发（姬发）：齐刘海底 + 宽侧板
  `<path d="M60 176 C50 66 94 34 128 34 C162 34 206 66 196 176 L188 198 L180 180 L176 124 L170 104 L162 112 L154 100 L146 110 L138 99 L128 108 L118 99 L110 110 L102 100 L94 112 L86 104 L80 124 L76 180 L68 198Z" fill="${c}"/>
  ${under("M80 124 L86 104 L94 112 L102 100 L110 110 L118 99 L128 108 L138 99 L146 110 L154 100 L162 112 L170 104 Q150 96 128 96 Q106 96 80 124Z", c)}
  ${under("M62 150 q4 26 6 44 l8 -16 q-4 -16 -4 -30Z M194 150 q-4 26 -6 44 l-8 -16 q4 -16 4 -30Z", c)}
  ${strand("M70 124 Q68 156 66 188 M186 124 Q188 156 190 188", c)}
  ${sheen("M92 48 Q126 30 160 46 L152 56 Q124 42 100 56Z", c)}
  ${rim("M62 120 C58 58 96 36 128 36", c)}`,
  // 2 侧分长卷：左分，右侧波浪长绺
  `<path d="M62 168 C50 66 96 32 130 32 C166 34 206 68 194 168 C190 156 186 146 188 134 C180 144 174 140 176 126 Q162 102 134 100 Q106 98 84 118 C82 134 78 150 72 158 C68 148 66 138 68 128Z" fill="${c}"/>
  <path d="M134 100 Q160 102 176 128 L168 130 L162 116 L152 122 L144 108 L134 114Z" fill="${c}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
  ${under("M84 118 Q106 98 134 100 Q160 102 176 128 Q154 108 130 108 Q106 108 84 118Z", c)}
  <path d="M62 128 C54 150 66 168 58 190 C56 202 64 210 72 206 C68 190 72 170 70 150Z" fill="${c}" stroke="${ink}" stroke-width="3.5"/>
  <path d="M194 132 C202 154 190 172 198 194 C200 206 192 214 184 210 C188 194 184 174 186 154Z" fill="${c}" stroke="${ink}" stroke-width="3.5"/>
  ${strand("M104 40 Q96 70 88 100 M150 42 Q166 74 172 108", c)}
  ${sheen("M94 46 Q128 30 160 46 L152 56 Q126 42 102 56Z", c)}
  ${rim("M64 116 C60 56 98 34 130 34", c)}`,
  // 3 凌乱精灵短
  `<path d="M64 142 C56 62 96 32 128 32 C162 34 198 62 192 142 L186 124 L180 134 L172 112 L164 126 L154 104 L146 120 L136 100 L126 118 L116 98 L106 120 L96 104 L88 126 L80 110 L74 128 L68 114Z" fill="${c}"/>
  ${under("M88 126 L96 104 L106 120 L116 98 L126 118 L136 100 Q116 106 100 112 Q92 118 88 126Z", c)}
  ${sheen("M92 48 Q124 32 156 46 L148 56 Q122 44 98 58Z", c)}
  ${rim("M66 112 C64 56 98 34 128 34", c)}
  <path d="M118 30 q-4 -10 4 -14 M142 32 q6 -8 0 -14" stroke="${c}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
  <path d="M65 140 q1 9 5 14 M191 140 q-1 9 -5 14" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  // 4 超长直发：中分 + 宽侧板
  `<path d="M56 200 C46 66 92 32 128 32 C164 32 210 66 200 200 L192 218 L184 198 L180 124 Q156 102 132 100 L128 98 L124 100 Q100 102 76 124 L72 198 L64 218Z" fill="${c}"/>
  ${under("M76 124 Q100 102 124 100 L128 98 L132 100 Q156 102 180 124 Q152 110 128 110 Q104 110 76 124Z", c)}
  ${under("M58 160 q3 32 6 52 l8 -18 q-4 -20 -4 -36Z M198 160 q-3 32 -6 52 l-8 -18 q4 -20 4 -36Z", c)}
  ${strand("M66 128 Q63 168 62 204 M190 128 Q193 168 194 204", c)}
  ${sheen("M92 46 Q126 28 160 44 L152 54 Q124 40 100 54Z", c)}
  ${rim("M58 122 C54 56 94 34 128 34", c)}
  <path d="M78 122 q-5 30 -3 56 M178 122 q5 30 3 56" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
  <path d="M128 98 V76" stroke="${dark(c, 0.4)}" stroke-width="2.6" opacity=".8"/>`,
  // 5 高丸子头：发际线下移 + 碎发
  `<path d="M66 142 C58 66 96 36 128 34 C160 36 198 66 190 142 Q180 122 170 114 Q148 100 128 100 Q108 100 86 114 Q76 122 66 142Z" fill="${c}"/>
  <circle cx="128" cy="22" r="19" fill="${c}" stroke="${ink}" stroke-width="4"/>
  <path d="M112 32 q16 8 32 0" stroke="${dark(c, 0.4)}" stroke-width="5" stroke-linecap="round" fill="none"/>
  ${strand("M100 46 Q112 64 118 88 M156 46 Q144 64 138 88", c)}
  ${sheen("M94 52 Q126 36 158 50 L150 60 Q124 48 102 60Z", c)}
  ${rim("M68 116 C64 60 98 38 128 36", c)}
  <path d="M74 118 q4 6 6 12 M182 118 q-4 6 -6 12" stroke="${c}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M70 126 q-4 14 -2 26 M186 126 q4 14 2 26" stroke="${c}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`,
  // 6 狼尾长发
  `<path d="M60 186 C48 66 94 32 128 32 C162 32 208 66 196 186 L188 170 L184 190 L176 166 L172 122 L164 106 L156 114 L148 102 L138 112 L128 102 L118 112 L108 102 L100 114 L92 106 L84 122 L80 166 L72 190 L68 170Z" fill="${c}"/>
  ${under("M84 122 L92 106 L100 114 L108 102 L118 112 L128 102 L138 112 L148 102 L156 114 L164 106 Q146 96 128 96 Q110 96 84 122Z", c)}
  ${strand("M66 130 Q62 160 64 182 M190 130 Q194 160 192 182", c)}
  ${sheen("M92 46 Q126 30 160 46 L152 56 Q124 42 100 56Z", c)}
  ${rim("M62 118 C58 56 96 34 128 34", c)}`,
  // 7 中式古典：低双环髻 + 簪
  `<path d="M64 158 C54 66 96 34 128 34 C160 34 202 66 192 158 Q184 140 178 128 Q152 104 128 104 Q104 104 78 128 Q72 140 64 158Z" fill="${c}"/>
  <path d="M104 104 q-14 10 -22 24 M152 104 q14 10 22 24" stroke="${dark(c, 0.35)}" stroke-width="2.6" fill="none" opacity=".7"/>
  <circle cx="58" cy="152" r="12" fill="${c}" stroke="${ink}" stroke-width="4"/>
  <circle cx="198" cy="152" r="12" fill="${c}" stroke="${ink}" stroke-width="4"/>
  <path d="M51 146 q7 -5 14 0 M191 146 q7 -5 14 0" stroke="${dark(c, 0.4)}" stroke-width="3.2" fill="none"/>
  ${strand("M104 42 Q96 72 86 100 M152 42 Q160 72 170 100", c)}
  ${sheen("M94 48 Q126 32 158 48 L150 58 Q124 44 102 58Z", c)}
  ${rim("M66 116 C62 58 98 36 128 36", c)}
  <path d="M186 142 l24 -12" stroke="#d9b85f" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="212" cy="129" r="4.5" fill="#d75b7b" stroke="${ink}" stroke-width="2"/>`,
  // 8 侧丸子头 + 蝴蝶结
  `<path d="M64 154 C54 66 96 34 128 34 C162 34 202 66 192 154 Q182 132 174 122 Q150 102 126 102 Q102 102 80 120 Q72 132 64 154Z" fill="${c}"/>
  <circle cx="178" cy="42" r="16" fill="${c}" stroke="${ink}" stroke-width="4"/>
  <path d="M166 50 q12 6 24 0" stroke="${dark(c, 0.4)}" stroke-width="4.5" fill="none"/>
  <path d="M190 34 l16 -11 -4 18 13 6 -19 4Z" fill="#d75b7b" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
  ${strand("M100 42 Q92 72 84 102 M148 40 Q160 60 168 84", c)}
  ${sheen("M92 48 Q124 32 156 46 L148 56 Q122 44 100 58Z", c)}
  ${rim("M66 116 C62 58 98 36 128 36", c)}`,
  // 9 公主长发（齐刘海）
  `<path d="M58 206 C48 66 92 32 128 32 C164 32 208 66 198 206 L190 222 L184 202 L180 126 L172 106 L164 114 L156 102 L148 112 L140 101 L128 110 L116 101 L108 112 L100 102 L92 114 L84 106 L76 126 L72 202 L66 222Z" fill="${c}"/>
  ${under("M76 126 L84 106 L92 114 L100 102 L108 112 L116 101 L128 110 L140 101 L148 112 L156 102 L164 114 L172 106 Q150 96 128 96 Q106 96 76 126Z", c)}
  ${under("M60 164 q3 30 6 50 l8 -18 q-4 -18 -4 -34Z M196 164 q-3 30 -6 50 l-8 -18 q4 -18 4 -34Z", c)}
  ${strand("M68 130 Q65 170 64 208 M188 130 Q191 170 192 208", c)}
  ${sheen("M92 46 Q126 28 160 44 L152 54 Q124 40 100 54Z", c)}
  ${rim("M60 122 C56 56 94 34 128 34", c)}`,
];

for (const gender of genders) {
  for (let i = 0; i < 10; i += 1) {
    const color = hairColors[i];
    const shape = (gender === "female" ? femaleHair(color) : maleHair(color))[i];
    write(
      [gender, "hair", `${i}.svg`],
      shape ? `  <g stroke="${ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${shape}</g>` : "  <!-- bald -->",
    );
  }
}

/** 日漫风六片式棒球帽：冠部带侧板阴影/顶部高光/缝线，帽檐带 underside 厚度 */
function baseballCap({ crown, side, brim, piping, logo }) {
  return `<!-- team cap -->
  <path d="M69 84 C72 46 94 26 128 24 C162 26 184 46 187 84 C168 77 148 74 128 74 C108 74 88 77 69 84Z" fill="${crown}" stroke="${ink}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M69 84 C73 54 87 35 108 28 C98 42 94 60 94 77 C85 78 77 81 69 84Z" fill="${side}" opacity=".85"/>
  <path d="M187 84 C183 54 169 35 148 28 C158 42 162 60 162 77 C171 78 179 81 187 84Z" fill="${side}" opacity=".85"/>
  <path d="M128 26 V74 M108 29 Q96 48 95 77 M148 29 Q160 48 159 77" stroke="${piping}" stroke-width="2" opacity=".55" fill="none"/>
  <path d="M92 42 C104 31 119 27 133 28" stroke="${light(crown, 0.45)}" stroke-width="4" stroke-linecap="round" opacity=".8" fill="none"/>
  <circle cx="128" cy="24" r="4" fill="${piping}" stroke="${ink}" stroke-width="2"/>
  ${logo}
  <path d="M66 82 C90 76 110 75 129 77 C153 77 176 81 196 90 C178 100 152 103 126 101 C102 100 80 94 64 87Z" fill="${brim}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M78 86 C107 81 142 82 182 91" stroke="${light(brim, 0.3)}" stroke-width="2.5" stroke-linecap="round" opacity=".6" fill="none"/>`;
}

const amgCap = baseballCap({
  crown: "#30343a", side: "#181b20", brim: "#15181c", piping: "#b9c2cc",
  logo: `<g transform="translate(107 43)" fill="#eef2f6"><path d="M0 18 L12 0 H18 L7 18Z"/><path d="M18 18 L30 0 H35 L25 18Z"/><path d="M37 3 H44 L35 18 H29Z"/></g><path d="M101 65 H155" stroke="#00a19c" stroke-width="3"/>`,
});
const mclarenCap = baseballCap({
  crown: "#ff8000", side: "#d95f00", brim: "#151515", piping: "#ffb15a",
  logo: `<path d="M103 48 C118 38 139 37 154 43 C144 44 135 48 128 53 C139 51 150 53 157 59 C143 57 128 58 112 63 C117 57 122 53 103 48Z" fill="#171717"/>`,
});
const ferrariCap = baseballCap({
  crown: "#d91520", side: "#a60912", brim: "#8f0710", piping: "#ff5961",
  logo: `<path d="M113 38 H143 L141 61 Q128 70 115 61Z" fill="#ffd928" stroke="${ink}" stroke-width="2.5"/><path d="M121 57 C119 50 123 43 128 44 C133 42 136 47 134 51 L139 48 L136 56 L132 55 L134 62 H128 L127 56 L122 62Z" fill="#171717"/><path d="M115 38 H141" stroke="#1f9b4b" stroke-width="3"/>`,
});
const redBullCap = baseballCap({
  crown: "#10295a", side: "#071737", brim: "#d71920", piping: "#f2c500",
  logo: `<circle cx="128" cy="51" r="13" fill="#f6cc19"/><path d="M126 49 C119 43 111 44 108 51 C114 49 120 52 126 56Z M130 49 C137 43 145 44 148 51 C142 49 136 52 130 56Z" fill="#d71920"/><path d="M128 42 V59" stroke="#10295a" stroke-width="2"/>`,
});

for (const gender of genders) {
  const eyeY = gender === "female" ? 122 : 124;
  const accessories = [
    "  <!-- no accessory -->",
    `<g stroke="${ink}" stroke-width="4" stroke-linejoin="round"><path d="M75 ${eyeY - 8} Q95 ${eyeY - 14} 115 ${eyeY - 7} L111 ${eyeY + 11} Q94 ${eyeY + 18} 79 ${eyeY + 8}Z" fill="#1b1e2a"/><path d="M181 ${eyeY - 8} Q161 ${eyeY - 14} 141 ${eyeY - 7} L145 ${eyeY + 11} Q162 ${eyeY + 18} 177 ${eyeY + 8}Z" fill="#1b1e2a"/><path d="M114 ${eyeY - 4} Q128 ${eyeY - 9} 142 ${eyeY - 4}" fill="none"/><path d="M78 ${eyeY - 5} l-14 -4 M178 ${eyeY - 5} l14 -4" fill="none"/></g><path d="M83 ${eyeY - 4} l16 -4 M149 ${eyeY - 4} l16 -4" stroke="white" stroke-width="3" stroke-linecap="round" opacity=".3"/>`,
    `<g fill="white" fill-opacity=".09" stroke="${ink}" stroke-width="3.6"><circle cx="96" cy="${eyeY}" r="17.5"/><circle cx="160" cy="${eyeY}" r="17.5"/></g><g stroke="${ink}" stroke-width="3.6" fill="none"><path d="M113 ${eyeY - 2} Q128 ${eyeY - 8} 143 ${eyeY - 2} M79 ${eyeY - 4} l-13 -4 M177 ${eyeY - 4} l13 -4"/></g><path d="M86 ${eyeY - 8} a12 12 0 0 1 10 -5 M150 ${eyeY - 8} a12 12 0 0 1 10 -5" stroke="white" stroke-width="2.6" fill="none" opacity=".4"/>`,
    `<g fill="white" fill-opacity=".07" stroke="${ink}" stroke-width="3.6" stroke-linejoin="round"><rect x="77" y="${eyeY - 15}" width="38" height="29" rx="6"/><rect x="141" y="${eyeY - 15}" width="38" height="29" rx="6"/></g><g stroke="${ink}" stroke-width="3.6" fill="none"><path d="M115 ${eyeY - 4} Q128 ${eyeY - 9} 141 ${eyeY - 4} M77 ${eyeY - 6} l-12 -4 M179 ${eyeY - 6} l12 -4"/></g><path d="M84 ${eyeY - 9} l12 -3 M148 ${eyeY - 9} l12 -3" stroke="white" stroke-width="2.6" stroke-linecap="round" opacity=".35"/>`,
    amgCap,
    `<path d="M66 ${eyeY - 12} Q128 ${eyeY - 20} 190 ${eyeY - 12} L188 ${eyeY + 2} Q128 ${eyeY - 6} 68 ${eyeY + 2}Z" fill="#2a2f3d" stroke="${ink}" stroke-width="4"/><path d="M69 ${eyeY - 14} Q128 ${eyeY - 34} 187 ${eyeY - 14} L179 ${eyeY + 13} Q128 ${eyeY + 24} 77 ${eyeY + 13}Z" fill="#253347" fill-opacity=".82" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/><path d="M82 ${eyeY - 10} Q105 ${eyeY - 17} 120 ${eyeY - 11} M136 ${eyeY - 11} Q151 ${eyeY - 17} 174 ${eyeY - 10}" stroke="#66d9ef" stroke-width="4" opacity=".7" fill="none"/><path d="M96 ${eyeY - 14} l-14 20 M160 ${eyeY - 14} l-14 20" stroke="white" stroke-width="3" opacity=".22"/>`,
    mclarenCap,
    ferrariCap,
    `<path d="M62 82 Q70 32 128 30 Q186 32 194 82 Q128 68 62 82Z" fill="#b58a52" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/><path d="M96 36 Q92 58 90 76 M160 36 Q164 58 166 76" stroke="#9c713f" stroke-width="3" opacity=".7" fill="none"/><path d="M54 92 Q128 72 202 92 Q184 110 128 103 Q72 110 54 92Z" fill="#9c713f" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><path d="M60 93 Q128 77 196 93" stroke="#d1aa72" stroke-width="4" opacity=".8" fill="none"/><path d="M70 100 Q128 88 186 100" stroke="${dark("#9c713f", 0.3)}" stroke-width="3" opacity=".6" fill="none"/>`,
    redBullCap,
  ];
  for (let i = 0; i < accessories.length; i += 1) {
    write([gender, "accessory", `${i}.svg`], accessories[i]);
  }
}

// 同步覆盖旧路径，避免缓存页面或旧调用仍加载到上一版素材。
for (const category of ["face", "eyes", "brows", "nose", "mouth", "beard", "hair", "accessory"]) {
  const legacyDir = join(root, category);
  mkdirSync(legacyDir, { recursive: true });
  for (let i = 0; i < 10; i += 1) {
    const source = category === "face"
      ? join(root, "male", "face", "1", `${i}.svg`)
      : category === "beard"
        ? join(root, "male", "beard", "0", `${i}.svg`)
        : join(root, "male", category, `${i}.svg`);
    copyFileSync(source, join(legacyDir, `${i}.svg`));
  }
}

console.log("Generated Japanese manga avatar SVGs under packages/assets/avatars/{male,female}/");
