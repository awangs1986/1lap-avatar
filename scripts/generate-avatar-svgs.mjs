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
const skins = [
  ["#f8d8c7", "#e8ad9c", "#d88986"],
  ["#efc2a7", "#d99a7d", "#ce7d76"],
  ["#dda77f", "#bd765c", "#b86662"],
  ["#bd7d55", "#96543f", "#984e4c"],
  ["#925b3d", "#70402f", "#7d3f40"],
  ["#633d2f", "#43281f", "#603336"],
];
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

const facePaths = [
  "M72 96 Q78 57 128 55 Q178 57 184 96 L181 151 Q177 193 128 218 Q79 193 75 151Z",
  "M67 103 Q69 53 128 50 Q187 53 189 103 L184 160 Q177 207 128 219 Q79 207 72 160Z",
  "M77 90 Q84 53 128 52 Q172 53 179 90 L174 153 Q164 198 128 226 Q92 198 82 153Z",
  "M61 103 Q65 55 128 52 Q191 55 195 103 L190 169 L166 207 Q128 220 90 207 L66 169Z",
  "M80 87 Q84 45 128 43 Q172 45 176 87 L174 165 Q164 216 128 232 Q92 216 82 165Z",
  "M65 105 Q67 60 128 57 Q189 60 191 105 L185 158 Q174 198 128 207 Q82 198 71 158Z",
  "M68 96 Q74 54 128 52 Q182 54 188 96 L185 170 L163 211 L128 218 L93 211 L71 170Z",
  "M72 96 Q77 55 128 53 Q179 55 184 96 L181 153 Q175 191 151 210 Q128 226 105 210 Q81 191 75 153Z",
  "M62 103 Q66 55 128 52 Q190 55 194 103 L188 165 Q181 203 153 216 Q128 228 103 216 Q75 203 68 165Z",
  "M74 91 Q83 53 128 51 Q173 53 182 91 L177 151 Q168 192 128 229 Q88 192 79 151Z",
];

// 男性对应编号使用更宽、更硬朗的轮廓；尖瘦下巴只存在于女性素材中。
const maleFacePaths = [...facePaths];
maleFacePaths[2] = "M69 94 Q76 53 128 51 Q180 53 187 94 L184 166 L164 210 L128 220 L92 210 L72 166Z";
maleFacePaths[4] = "M72 89 Q77 45 128 43 Q179 45 184 89 L181 174 L161 222 L128 229 L95 222 L75 174Z";
maleFacePaths[9] = "M65 94 Q72 53 128 51 Q184 53 191 94 L185 161 L164 211 L128 222 L92 211 L71 161Z";

// 太阳穴外侧 X：须与 packages/core/src/avatar-parts.ts 的 FACE_TEMPLE_LEFT 保持同步（发型运行时 scaleX 用）
// female: [72, 67, 77, 61, 80, 65, 68, 72, 62, 74]
// male:   [72, 67, 69, 61, 72, 65, 68, 72, 62, 65]

const faceExtras = [
  "", "", "",
  `<path d="M88 203 Q128 214 168 203" stroke="${ink}" stroke-width="2" opacity=".22"/>`,
  "", "",
  `<path d="M94 208 L112 215 M162 208 L144 215" stroke="${ink}" stroke-width="2" opacity=".25"/>`,
  "",
  `<path d="M98 205 Q128 219 158 205 M106 216 Q128 226 150 216" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" opacity=".42"/>`,
  "",
];

for (const gender of genders) {
  for (let skinIndex = 0; skinIndex < skins.length; skinIndex += 1) {
    const [base, shade, blush] = skins[skinIndex];
    for (let i = 0; i < 10; i += 1) {
      const feminine = gender === "female";
      const face = feminine ? facePaths[i] : maleFacePaths[i];
      const blushDetail = feminine
        ? `<ellipse cx="92" cy="158" rx="16" ry="7" fill="${blush}" opacity=".34"/>
  <ellipse cx="164" cy="158" rx="16" ry="7" fill="${blush}" opacity=".34"/>
  <path d="M82 157 l7 -4 M91 160 l7 -4 M154 156 l7 4 M163 153 l7 4" stroke="${blush}" stroke-width="2" stroke-linecap="round" opacity=".48"/>`
        : "";
      write(
        [gender, "face", String(skinIndex), `${i}.svg`],
        `  <path d="M103 190 L99 237 L157 237 L153 190Z" fill="${base}" stroke="${ink}" stroke-width="3"/>
  <ellipse cx="72" cy="130" rx="13" ry="20" fill="${base}" stroke="${ink}" stroke-width="3"/>
  <ellipse cx="184" cy="130" rx="13" ry="20" fill="${base}" stroke="${ink}" stroke-width="3"/>
  <path d="${face}" fill="${base}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M166 73 Q185 104 177 158 Q169 194 131 216 Q158 188 158 158 Q177 123 166 73Z" fill="${shade}" opacity=".24"/>
  <path d="M81 130 Q74 126 77 139 M175 130 Q182 126 179 139" stroke="${shade}" stroke-width="2" stroke-linecap="round"/>
  ${blushDetail}
  ${faceExtras[i]}`,
      );
    }
  }
}

function eyeStyle(index, feminine) {
  const iris = ["#49342d", "#335f8d", "#476c52", "#714d8e", "#67402d", "#2d5064", "#7d454c", "#426c77", "#6b5a9b", "#8d693e"][index];
  const lash = feminine ? `<path d="M78 120 l-8 -5 M80 116 l-5 -8" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>` : "";
  const pupil = (cx, cy, r = feminine ? 7.5 : 6.5) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${iris}" stroke="${ink}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy + 1}" r="${Math.max(2.5, r * 0.42)}" fill="#17111a"/>
    <circle cx="${cx - 2.5}" cy="${cy - 2.5}" r="2.3" fill="white"/>`;
  const styles = [
    `<path d="M78 126 Q96 113 114 126 Q96 140 78 126Z" fill="${white}" stroke="${ink}" stroke-width="2.8"/>${pupil(96, 127)}${lash}`,
    `<ellipse cx="96" cy="126" rx="16" ry="14" fill="${white}" stroke="${ink}" stroke-width="3"/>${pupil(96, 127, feminine ? 9 : 8)}<circle cx="100" cy="132" r="1.5" fill="white"/>${lash}`,
    `<path d="M78 121 Q96 115 114 124 Q101 145 82 134 Q78 130 78 121Z" fill="${white}" stroke="${ink}" stroke-width="2.8"/>${pupil(97, 130)}${lash}`,
    `<path d="M76 130 Q95 116 116 114 Q104 136 82 137Z" fill="${white}" stroke="${ink}" stroke-width="3"/>${pupil(98, 127)}<path d="M79 125 L72 121" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>${lash}`,
    `<path d="M77 130 Q96 112 115 130" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><path d="M84 128 l-4 -7 M91 122 l-1 -7 M108 126 l4 -7" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M75 130 Q96 111 116 124 Q103 140 81 137Z" fill="${white}" stroke="${ink}" stroke-width="3.2"/>${pupil(98, 127)}<path d="M78 126 L68 120" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>${lash}`,
    `<path d="M78 124 Q96 116 114 124 Q104 143 80 139Z" fill="${white}" stroke="${ink}" stroke-width="3"/>${pupil(96, 122, 5)}<path d="M84 136 Q96 140 108 136" stroke="${ink}" stroke-width="1.5" opacity=".5"/>`,
    `<ellipse cx="96" cy="126" rx="18" ry="15" fill="${white}" stroke="${ink}" stroke-width="3"/><circle cx="96" cy="127" r="10" fill="${iris}" stroke="${ink}" stroke-width="2"/><path d="M96 118 l2.4 5 5.6.8 -4 4 .9 5.7 -4.9 -2.7 -4.9 2.7 .9 -5.7 -4 -4 5.6-.8Z" fill="white"/>${lash}`,
    `<path d="M76 128 Q96 120 116 126 Q98 136 79 133Z" fill="${white}" stroke="${ink}" stroke-width="3.2"/>${pupil(97, 128, 5)}`,
    `<path d="M73 131 Q93 116 119 118 Q104 134 80 136Z" fill="${white}" stroke="${ink}" stroke-width="3"/>${pupil(98, 126, 6)}<path d="M76 127 L67 125" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>${lash}`,
  ];
  return styles[index];
}

for (const gender of genders) {
  const feminine = gender === "female";
  const dy = feminine ? -2 : 0;
  for (let i = 0; i < 10; i += 1) {
    const left = eyeStyle(i, feminine);
    write(
      [gender, "eyes", `${i}.svg`],
      `  <g transform="translate(0 ${dy})">${left}<g transform="translate(256 0) scale(-1 1)">${left}</g></g>`,
    );
  }
}

function baseballCap({ name, crown, side, brim, piping, logo }) {
  return `<!-- ${name}：日漫风六片式棒球帽 -->
  <path d="M69 82 C72 48 93 27 128 25 C163 27 184 48 187 82 C168 76 148 73 128 73 C108 73 88 76 69 82Z" fill="${crown}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M69 82 C73 54 87 36 108 29 C98 43 94 60 94 76 C85 77 77 79 69 82Z" fill="${side}" opacity=".78"/>
  <path d="M187 82 C183 54 169 36 148 29 C158 43 162 60 162 76 C171 77 179 79 187 82Z" fill="${side}" opacity=".78"/>
  <path d="M128 27 V73 M108 30 Q95 49 94 76 M148 30 Q161 49 162 76" stroke="${piping}" stroke-width="2.5" opacity=".72"/>
  <circle cx="128" cy="25" r="4.5" fill="${piping}" stroke="${ink}" stroke-width="2"/>
  <path d="M70 80 Q128 67 186 80" stroke="${piping}" stroke-width="4" opacity=".9"/>
  ${logo}
  <path d="M68 80 C90 75 110 74 129 76 C153 76 176 80 194 88 C176 97 151 100 126 98 C102 97 81 92 67 85Z" fill="${brim}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M78 84 C107 80 142 81 180 90" stroke="${piping}" stroke-width="2.5" opacity=".48" stroke-linecap="round"/>`;
}

const amgCap = baseballCap({
  name: "AMG 车队帽",
  crown: "#30343a",
  side: "#181b20",
  brim: "#15181c",
  piping: "#b9c2cc",
  logo: `<g transform="translate(107 43)" fill="#eef2f6"><path d="M0 18 L12 0 H18 L7 18Z"/><path d="M18 18 L30 0 H35 L25 18Z"/><path d="M37 3 H44 L35 18 H29Z"/></g><path d="M101 65 H155" stroke="#00a19c" stroke-width="3"/>`,
});

const mclarenCap = baseballCap({
  name: "迈凯轮车队帽",
  crown: "#ff8000",
  side: "#d95f00",
  brim: "#151515",
  piping: "#ffb15a",
  logo: `<path d="M103 48 C118 38 139 37 154 43 C144 44 135 48 128 53 C139 51 150 53 157 59 C143 57 128 58 112 63 C117 57 122 53 103 48Z" fill="#171717"/>`,
});

const ferrariCap = baseballCap({
  name: "法拉利车队帽",
  crown: "#d91520",
  side: "#a60912",
  brim: "#8f0710",
  piping: "#ff5961",
  logo: `<path d="M113 38 H143 L141 61 Q128 70 115 61Z" fill="#ffd928" stroke="${ink}" stroke-width="2.5"/><path d="M121 57 C119 50 123 43 128 44 C133 42 136 47 134 51 L139 48 L136 56 L132 55 L134 62 H128 L127 56 L122 62Z" fill="#171717"/><path d="M115 38 H141" stroke="#1f9b4b" stroke-width="3"/>`,
});

const redBullCap = baseballCap({
  name: "红牛车队帽",
  crown: "#10295a",
  side: "#071737",
  brim: "#d71920",
  piping: "#f2c500",
  logo: `<circle cx="128" cy="51" r="13" fill="#f6cc19"/><path d="M126 49 C119 43 111 44 108 51 C114 49 120 52 126 56Z M130 49 C137 43 145 44 148 51 C142 49 136 52 130 56Z" fill="#d71920"/><path d="M128 42 V59" stroke="#10295a" stroke-width="2"/>`,
});

for (const gender of genders) {
  for (let i = 0; i < 10; i += 1) {
    const y = gender === "female" ? 101 : 100;
    const thick = (gender === "female" ? 3 : 4) + (i % 3) * 0.7;
    const arch = 2 + (i % 5) * 2;
    const tilt = i % 2 ? 4 : -2;
    write(
      [gender, "brows", `${i}.svg`],
      `  <path d="M78 ${y + tilt} Q96 ${y - arch} 113 ${y + 1}" stroke="${ink}" stroke-width="${thick}" stroke-linecap="round"/>
  <path d="M143 ${y + 1} Q160 ${y - arch} 178 ${y + tilt}" stroke="${ink}" stroke-width="${thick}" stroke-linecap="round"/>`,
    );
  }
}

for (const gender of genders) {
  for (let i = 0; i < 10; i += 1) {
    const y = gender === "female" ? 147 : 149;
    const h = 7 + (i % 5) * 2;
    const w = 4 + (i % 4) * 2;
    const body = i % 3 === 0
      ? `<path d="M128 ${y - h} Q${128 - w} ${y} 124 ${y + 3} Q128 ${y + 6} 133 ${y + 2}" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`
      : i % 3 === 1
        ? `<path d="M131 ${y - h} L125 ${y + 3} Q128 ${y + 6} 134 ${y + 2}" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
        : `<path d="M120 ${y + 2} Q128 ${y + 7} 136 ${y + 2}" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M128 ${y - h} l-3 9" stroke="${ink}" stroke-width="1.8"/>`;
    write([gender, "nose", `${i}.svg`], `  ${body}`);
  }
}

for (const gender of genders) {
  for (let i = 0; i < 10; i += 1) {
    const y = gender === "female" ? 177 : 180;
    const w = 14 + (i % 4) * 3;
    const lip = gender === "female" ? "#b95570" : "#7f3f49";
    const mouths = [
      `<path d="M${128 - w} ${y} Q128 ${y + 4} ${128 + w} ${y}" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`,
      `<path d="M${128 - w} ${y - 2} Q128 ${y + 10} ${128 + w} ${y - 2}" fill="${white}" stroke="${ink}" stroke-width="2.6"/>`,
      `<path d="M${128 - w} ${y + 3} Q128 ${y - 7} ${128 + w} ${y + 3}" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`,
      `<ellipse cx="128" cy="${y + 2}" rx="${w - 4}" ry="8" fill="#3b2029" stroke="${ink}" stroke-width="2.4"/><path d="M119 ${y + 6} Q128 ${y + 1} 137 ${y + 6}" stroke="${lip}" stroke-width="4"/>`,
      `<path d="M${128 - w} ${y} Q119 ${y - 5} 128 ${y} Q137 ${y - 5} ${128 + w} ${y}" fill="${lip}" stroke="${ink}" stroke-width="2"/>`,
      `<path d="M${128 - w} ${y} Q128 ${y + 13} ${128 + w} ${y}" fill="${lip}" stroke="${ink}" stroke-width="2.4"/><path d="M119 ${y + 3}h18" stroke="white" stroke-width="3"/>`,
      `<path d="M${128 - w} ${y} Q128 ${y + 7} ${128 + w} ${y}" stroke="${ink}" stroke-width="3"/><path d="M128 ${y + 2}l4 5" stroke="${ink}" stroke-width="2"/>`,
      `<path d="M${128 - w} ${y + 2} Q128 ${y - 6} ${128 + w} ${y + 2}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
      `<path d="M${128 - w} ${y} Q128 ${y + 5} ${128 + w} ${y}" stroke="${ink}" stroke-width="2"/><path d="M119 ${y + 5} Q128 ${y + 10} 137 ${y + 5}" stroke="${lip}" stroke-width="2"/>`,
      `<circle cx="128" cy="${y + 1}" r="7" fill="#3b2029" stroke="${ink}" stroke-width="2.5"/>`,
    ];
    const lipstick = gender === "female"
      ? `<path d="M116 ${y + 2} Q128 ${y + 7} 140 ${y + 2}" stroke="#a94f68" stroke-width="2.4" stroke-linecap="round" opacity=".58"/>`
      : "";
    write([gender, "mouth", `${i}.svg`], `  ${mouths[i]}${lipstick}`);
  }
}

const beardGeometry = [
  { side: 75, jaw: 99, chin: 218 },
  { side: 72, jaw: 93, chin: 219 },
  { side: 72, jaw: 92, chin: 220 },
  { side: 66, jaw: 90, chin: 220 },
  { side: 75, jaw: 95, chin: 229 },
  { side: 71, jaw: 95, chin: 207 },
  { side: 71, jaw: 93, chin: 218 },
  { side: 75, jaw: 105, chin: 226 },
  { side: 68, jaw: 103, chin: 228 },
  { side: 71, jaw: 92, chin: 222 },
];

for (const gender of genders) {
  for (let faceIndex = 0; faceIndex < beardGeometry.length; faceIndex += 1) {
    const g = beardGeometry[faceIndex];
    const moustacheWidth = Math.round(13 + (128 - g.jaw) * 0.12);
    const jawPath = `M${g.side + 10} 150 Q${g.side + 7} ${g.chin - 30} 128 ${g.chin - 3} Q${256 - g.side - 7} ${g.chin - 30} ${246 - g.side} 150`;
    const beardOuter = g.side - 11;
    const bigBeardPath = `M${beardOuter} 148 C${beardOuter - 13} 163 ${beardOuter - 7} 184 ${g.jaw - 10} ${g.chin - 15} L110 ${g.chin - 3} L120 ${g.chin + 5} L128 ${g.chin + 13} L136 ${g.chin + 5} L146 ${g.chin - 3} L${266 - g.jaw} ${g.chin - 15} C${263 - beardOuter} 184 ${269 - beardOuter} 163 ${256 - beardOuter} 148 Q161 157 148 170 Q138 160 128 171 Q118 160 108 170 Q95 157 ${beardOuter} 148Z`;
    const fullBeardOuter = `M${g.side + 5} 147 C${g.side - 2} 171 ${g.side + 2} 194 ${g.jaw - 5} ${g.chin - 16} L111 ${g.chin - 4} L128 ${g.chin + 7} L145 ${g.chin - 4} L${261 - g.jaw} ${g.chin - 16} C${258 - g.side} 194 ${258 - g.side} 171 ${251 - g.side} 147 Q158 158 148 166 Q138 158 128 168 Q118 158 108 166 Q98 158 ${g.side + 5} 147Z`;
    const mouthCutout = `M108 168 Q128 157 148 168 Q146 187 128 192 Q110 187 108 168Z`;
    for (let i = 0; i < 10; i += 1) {
      if (i === 0) {
        write([gender, "beard", String(faceIndex), "0.svg"], "  <!-- clean shaven -->");
        continue;
      }
      const goateeEnd = g.chin - 5;
      const styles = [
        `<path d="M127 166 C119 162 110 163 ${125 - moustacheWidth} 168 C110 172 119 173 127 170Z M129 166 C137 162 146 163 ${131 + moustacheWidth} 168 C146 172 137 173 129 170Z" fill="${ink}"/><path d="M128 165 V171" stroke="#4a354b" stroke-width="2"/>`,
        `<path d="M127 168 Q117 158 ${124 - moustacheWidth} 168 L112 177 Q120 172 127 172Z M129 168 Q139 158 ${132 + moustacheWidth} 168 L144 177 Q136 172 129 172Z" fill="${ink}"/><path d="M128 165 V173" stroke="#4a354b" stroke-width="2.5"/>`,
        `<path d="M127 169 C118 161 108 162 103 169 C99 174 94 172 94 166 M129 169 C138 161 148 162 153 169 C157 174 162 172 162 166" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/><path d="M98 164 l-5 -4 M158 164 l5 -4" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
        `<path d="M${128 - moustacheWidth} 168 Q120 162 128 171 Q136 162 ${128 + moustacheWidth} 168" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M121 185 Q128 191 135 185 L134 ${goateeEnd - 2} L128 ${goateeEnd + 5} L122 ${goateeEnd - 2}Z" fill="${ink}"/><path d="M125 178 Q128 181 131 178" stroke="${ink}" stroke-width="3"/>`,
        `<path d="${bigBeardPath}" fill="${ink}" stroke="#4a354b" stroke-width="3" stroke-linejoin="round"/><path d="M${128 - moustacheWidth - 2} 165 Q118 158 128 171 Q138 158 ${130 + moustacheWidth} 165" stroke="#4a354b" stroke-width="5" stroke-linecap="round"/><path d="M88 181 Q96 190 101 202 M168 181 Q160 190 155 202 M113 ${g.chin - 8} L121 ${g.chin} M143 ${g.chin - 8} L135 ${g.chin}" stroke="#5a425b" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
        `<path d="M${128 - moustacheWidth} 168 Q128 175 ${128 + moustacheWidth} 168" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M111 171 C104 184 109 ${g.chin - 14} 128 ${g.chin - 7} C147 ${g.chin - 14} 152 184 145 171" stroke="${ink}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M118 ${g.chin - 8} Q128 ${g.chin} 138 ${g.chin - 8}" stroke="#4a354b" stroke-width="3"/>`,
        `<path d="${jawPath}" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M${g.side + 8} 148 L${g.side + 5} 166 M${248 - g.side} 148 L${251 - g.side} 166" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><path d="M103 ${g.chin - 18} l8 6 M153 ${g.chin - 18} l-8 6" stroke="#4a354b" stroke-width="2.5"/>`,
        `<path d="${jawPath}" stroke="${ink}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M${g.side + 7} 149 Q${g.side + 2} 169 ${g.jaw} 187 M${249 - g.side} 149 Q${254 - g.side} 169 ${256 - g.jaw} 187" stroke="${ink}" stroke-width="9" stroke-linecap="round"/><path d="M${128 - moustacheWidth} 168 Q128 175 ${128 + moustacheWidth} 168" stroke="${ink}" stroke-width="4.5"/><path d="M103 ${g.chin - 18} Q128 ${g.chin - 5} 153 ${g.chin - 18}" stroke="#4a354b" stroke-width="3" opacity=".75"/>`,
        `<path d="${fullBeardOuter} ${mouthCutout}" fill="${ink}" fill-rule="evenodd" stroke="#4a354b" stroke-width="3" stroke-linejoin="round"/><path d="M${128 - moustacheWidth - 2} 166 Q118 158 128 171 Q138 158 ${130 + moustacheWidth} 166" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M88 178 Q98 189 105 202 M168 178 Q158 189 151 202 M108 ${g.chin - 12} Q128 ${g.chin} 148 ${g.chin - 12}" stroke="#5a425b" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
      ];
      write(
        [gender, "beard", String(faceIndex), `${i}.svg`],
        `  <g opacity="${gender === "female" ? 0.82 : 0.94}">${styles[i - 1]}</g>`,
      );
    }
  }
}

const hairColors = ["#17131d", "#35242a", "#6a3d2d", "#b34d63", "#d5a53f", "#355f91", "#72528f", "#18131d", "#b85c2e", "#37695b"];
const maleHair = (c) => [
  `<path d="M70 111 Q65 54 104 43 L111 22 L126 41 L143 17 L151 44 L184 35 L172 62 Q190 76 181 112 L162 82 L146 98 L132 69 L113 98 L97 74Z" fill="${c}"/>`,
  `<path d="M68 118 Q58 60 99 45 Q145 20 188 64 L173 113 L158 79 Q129 104 92 95 L81 126Z" fill="${c}"/><path d="M94 55 Q131 38 166 53" stroke="white" stroke-opacity=".18" stroke-width="7"/>`,
  `<!-- bald -->`,
  `<path d="M66 117 Q62 58 108 43 Q159 27 188 71 L181 120 L164 91 L150 105 L135 77 L116 104 L100 80 L80 123Z" fill="${c}"/>`,
  `<path d="M68 124 Q56 69 94 45 Q135 21 174 48 Q199 65 184 126 L169 91 Q149 70 132 108 L118 78 Q92 91 82 130Z" fill="${c}"/>`,
  `<path d="M101 93 C104 70 109 44 118 20 L128 -8 L139 20 C148 44 153 70 157 93 Q129 70 101 93Z" fill="#111015"/>`,
  `<path d="M64 127 Q59 63 104 42 Q159 22 193 70 L182 139 L166 100 L151 122 L136 88 L118 117 L99 92 L80 142Z" fill="${c}"/>`,
  `<path d="M57 123 C38 113 40 88 53 76 C42 55 55 35 76 31 C82 11 103 2 120 10 C135 -4 158 3 166 21 C188 17 205 36 201 58 C218 70 219 96 204 109 C204 130 181 142 161 126 Q128 105 95 126 C78 142 57 138 57 123Z" fill="#17131d" stroke="#4b394d" stroke-width="5"/><g stroke="#57435a" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M55 79 q10 -15 21 0 t21 0 M80 43 q10 -15 21 0 t21 0 M113 20 q10 -13 20 0 t20 0 M151 37 q10 -14 20 0 t20 0 M166 73 q10 -15 21 0 t18 0 M70 111 q9 -13 18 0 t18 0 M112 101 q9 -13 18 0 t18 0 M151 108 q9 -13 18 0"/></g>`,
  `<path d="M72 120 Q62 62 106 42 Q163 20 187 74 L177 128 L160 89 Q127 109 91 88 L80 130Z" fill="${c}"/><circle cx="162" cy="48" r="23" fill="${c}"/>`,
  `<path d="M63 126 Q54 61 92 38 Q128 14 164 38 Q202 61 193 126 L177 102 L162 119 L146 91 L128 114 L110 91 L94 119 L79 102Z" fill="${c}"/>`,
];
const femaleHair = (c) => [
  `<path d="M64 153 Q53 65 96 40 Q136 16 176 47 Q204 70 188 181 L169 157 L164 87 Q128 105 91 83 L86 168Z" fill="${c}"/>`,
  `<path d="M60 174 Q51 67 94 39 Q145 9 191 62 L186 190 L166 166 L164 83 Q134 105 91 91 L84 182Z" fill="${c}"/>`,
  `<path d="M65 164 Q51 72 94 42 Q137 16 185 55 L190 173 L167 153 L161 86 L131 111 L118 78 Q100 96 87 102 L84 172Z" fill="${c}"/>`,
  `<path d="M65 137 Q57 69 101 41 Q146 14 188 65 L180 151 L164 101 L148 119 L132 84 L113 116 L96 92 L81 149Z" fill="${c}"/>`,
  `<path d="M57 190 Q48 69 93 37 Q142 5 193 62 L198 200 L174 181 L165 86 Q130 110 89 88 L80 184Z" fill="${c}"/><path d="M104 45 Q145 28 178 58" stroke="white" stroke-opacity=".17" stroke-width="7"/>`,
  `<path d="M65 165 Q50 78 91 45 Q137 8 190 62 L187 178 L165 153 L160 86 Q126 105 91 87 L84 174Z" fill="${c}"/><circle cx="128" cy="31" r="26" fill="${c}"/>`,
  `<path d="M60 183 Q48 72 94 38 Q145 2 196 65 L192 194 L170 168 L162 88 L143 112 L126 78 L106 110 L90 90 L83 191Z" fill="${c}"/>`,
  `<path d="M62 174 Q50 73 92 43 Q128 18 164 43 Q206 73 194 174 L172 151 L164 92 Q128 110 92 92 L84 151Z" fill="${c}"/><ellipse cx="128" cy="36" rx="36" ry="22" fill="${c}"/><circle cx="103" cy="39" r="20" fill="${c}"/><circle cx="153" cy="39" r="20" fill="${c}"/><path d="M91 35 H174" stroke="#d9b85f" stroke-width="5" stroke-linecap="round"/><path d="M166 27 l13 -10" stroke="#d9b85f" stroke-width="4"/><path d="M179 17 l8 -8 2 12Z" fill="#d75b7b"/><path d="M82 103 Q73 149 82 184 M174 103 Q183 149 174 184" stroke="${c}" stroke-width="13" stroke-linecap="round"/>`,
  `<path d="M63 158 Q50 70 96 40 Q146 8 192 65 L184 169 L164 144 L161 88 Q132 108 91 88 L84 169Z" fill="${c}"/><circle cx="174" cy="43" r="24" fill="${c}"/><path d="M187 38 l17 -12 -5 20 14 7 -20 5Z" fill="#d75b7b"/>`,
  `<path d="M54 198 Q43 75 91 35 Q145 -7 201 62 L202 207 L177 184 L165 85 Q130 108 88 88 L79 203Z" fill="${c}"/>`,
];

for (const gender of genders) {
  for (let i = 0; i < 10; i += 1) {
    const color = hairColors[i];
    const shape = (gender === "female" ? femaleHair(color) : maleHair(color))[i];
    const highlight = gender === "male" && (i === 2 || i === 5)
      ? ""
      : `<path d="M92 57 Q123 37 158 48" stroke="white" stroke-opacity=".16" stroke-width="6" stroke-linecap="round"/>`;
    write(
      [gender, "hair", `${i}.svg`],
      `  <g stroke="${ink}" stroke-width="4" stroke-linejoin="round">${shape}</g>
  ${highlight}`,
    );
  }
}

for (const gender of genders) {
  const eyeY = gender === "female" ? 122 : 124;
  const accessories = [
    "  <!-- no accessory -->",
    `<g stroke="${ink}" stroke-width="4"><path d="M75 ${eyeY - 7} Q95 ${eyeY - 12} 115 ${eyeY - 5} L110 ${eyeY + 10} Q94 ${eyeY + 18} 79 ${eyeY + 7}Z" fill="#171923"/><path d="M181 ${eyeY - 7} Q161 ${eyeY - 12} 141 ${eyeY - 5} L146 ${eyeY + 10} Q162 ${eyeY + 18} 177 ${eyeY + 7}Z" fill="#171923"/><path d="M114 ${eyeY - 3} Q128 ${eyeY - 8} 142 ${eyeY - 3}"/><path d="M79 ${eyeY - 4} l-13 -5 M177 ${eyeY - 4} l13 -5"/></g><path d="M82 ${eyeY - 5} l20 -3" stroke="white" stroke-width="3" opacity=".35"/>`,
    `<g stroke="${ink}" stroke-width="4"><circle cx="96" cy="${eyeY}" r="18" fill="white" fill-opacity=".08"/><circle cx="160" cy="${eyeY}" r="18" fill="white" fill-opacity=".08"/><path d="M114 ${eyeY} Q128 ${eyeY - 5} 142 ${eyeY} M78 ${eyeY - 3} l-12 -5 M178 ${eyeY - 3} l12 -5"/></g>`,
    `<g stroke="${ink}" stroke-width="4" stroke-linejoin="round"><rect x="77" y="${eyeY - 15}" width="38" height="30" rx="5" fill="white" fill-opacity=".06"/><rect x="141" y="${eyeY - 15}" width="38" height="30" rx="5" fill="white" fill-opacity=".06"/><path d="M115 ${eyeY - 2} Q128 ${eyeY - 7} 141 ${eyeY - 2} M77 ${eyeY - 5} l-11 -4 M179 ${eyeY - 5} l11 -4"/></g>`,
    amgCap,
    `<path d="M69 ${eyeY - 14} Q128 ${eyeY - 34} 187 ${eyeY - 14} L177 ${eyeY + 13} Q128 ${eyeY + 24} 79 ${eyeY + 13}Z" fill="#253347" fill-opacity=".78" stroke="${ink}" stroke-width="5"/><path d="M82 ${eyeY - 10} Q105 ${eyeY - 17} 120 ${eyeY - 11} M136 ${eyeY - 11} Q151 ${eyeY - 17} 174 ${eyeY - 10}" stroke="#66d9ef" stroke-width="4" opacity=".7"/><path d="M128 ${eyeY - 20} V${eyeY + 13}" stroke="${ink}" stroke-width="3"/>`,
    mclarenCap,
    ferrariCap,
    `<path d="M59 80 Q71 30 128 29 Q185 30 197 80 L187 94 Q128 82 69 94Z" fill="#b58a52" stroke="${ink}" stroke-width="5"/><path d="M54 92 Q128 74 202 92 Q182 108 128 101 Q74 108 54 92Z" fill="#9c713f" stroke="${ink}" stroke-width="4"/><path d="M69 77 Q128 65 187 77" stroke="#d1aa72" stroke-width="5"/>`,
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
