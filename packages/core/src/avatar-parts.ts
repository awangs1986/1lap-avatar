/** 日漫风捏脸部件清单：2 套性别主题 × 7 类 × 10 款 */

export const AVATAR_SIZE = 256;

export const AVATAR_CATEGORIES = [
  "face",
  "eyes",
  "brows",
  "nose",
  "mouth",
  "beard",
  "hair",
  "accessory",
] as const;

export type AvatarCategory = (typeof AVATAR_CATEGORIES)[number];

export const AVATAR_GENDERS = ["male", "female"] as const;
export type AvatarGender = (typeof AVATAR_GENDERS)[number];

export const AVATAR_GENDER_LABEL: Record<AvatarGender, string> = {
  male: "男性",
  female: "女性",
};

export const AVATAR_SKIN_TONES = [
  { label: "瓷白", color: "#f8d8c7" },
  { label: "自然白", color: "#efc2a7" },
  { label: "暖杏", color: "#dda77f" },
  { label: "小麦", color: "#bd7d55" },
  { label: "古铜", color: "#925b3d" },
  { label: "深棕", color: "#633d2f" },
] as const;

/** 叠层从底到顶的绘制顺序 */
export const AVATAR_LAYER_ORDER: AvatarCategory[] = [
  "face",
  "eyes",
  "brows",
  "nose",
  "mouth",
  "beard",
  "hair",
  "accessory",
];

export const AVATAR_CATEGORY_LABEL: Record<AvatarCategory, string> = {
  face: "脸型",
  hair: "发型",
  brows: "眉毛",
  eyes: "眼睛",
  nose: "鼻子",
  mouth: "嘴巴",
  beard: "胡须",
  accessory: "饰品",
};

export const AVATAR_OPTION_COUNT = 10;
/** 帽子类饰品（遮挡发型）；含车队帽与渔夫帽 */
export const AVATAR_HAT_INDICES = new Set([4, 6, 7, 8, 9]);

export function isHatAccessory(index: number): boolean {
  return AVATAR_HAT_INDICES.has(clampPartIndex(index));
}

/** 默认捏脸组合 */
export const DEFAULT_AVATAR_CONFIG = {
  gender: "male",
  skin: 1,
  face: 0,
  hair: 1,
  brows: 0,
  eyes: 0,
  nose: 0,
  mouth: 0,
  beard: 0,
  accessory: 0,
} as const satisfies AvatarConfig;

export type AvatarConfig = {
  gender: AvatarGender;
  skin: number;
  face: number;
  hair: number;
  brows: number;
  eyes: number;
  nose: number;
  mouth: number;
  beard: number;
  accessory: number;
};

/** Optional host-app field names (e.g. 1lap Driver columns) → category */
export const AVATAR_FIELD_MAP = {
  avatarFace: "face",
  avatarHair: "hair",
  avatarBrows: "brows",
  avatarEyes: "eyes",
  avatarNose: "nose",
  avatarMouth: "mouth",
  avatarBeard: "beard",
  avatarAccessory: "accessory",
} as const;

export type AvatarField = keyof typeof AVATAR_FIELD_MAP;

/**
 * 各脸型太阳穴外侧 X（与 generate-avatar-svgs.mjs 中 face 路径一致）。
 * 数值越小脸越宽；基准脸型 0 为 72。
 */
const FACE_TEMPLE_LEFT: Record<AvatarGender, readonly number[]> = {
  female: [72, 67, 77, 61, 80, 65, 68, 72, 62, 74],
  male: [72, 67, 69, 61, 72, 65, 68, 72, 62, 65],
};

const FACE_WIDTH_BASE_HALF = 128 - FACE_TEMPLE_LEFT.male[0]; // 基准半宽 56

/** 脸宽相对基准脸型的水平缩放（发型/贴合脸侧的部件用） */
export function faceWidthScale(
  faceIndex: number,
  gender: AvatarGender | string | null | undefined = DEFAULT_AVATAR_CONFIG.gender,
): number {
  const g = normalizeAvatarGender(gender);
  const left = FACE_TEMPLE_LEFT[g][clampPartIndex(faceIndex)] ?? FACE_TEMPLE_LEFT[g][0];
  const half = 128 - left;
  // 限制幅度，避免极端脸型把发型拉得太夸张
  return Math.min(1.28, Math.max(0.84, half / FACE_WIDTH_BASE_HALF));
}

/** 发型层 CSS：绕画布中心水平拉伸，贴合当前脸宽 */
export function avatarHairLayerStyle(
  faceIndex: number,
  gender: AvatarGender | string | null | undefined = DEFAULT_AVATAR_CONFIG.gender,
): { transform: string; transformOrigin: string } {
  const sx = faceWidthScale(faceIndex, gender);
  return {
    transform: `scaleX(${sx.toFixed(4)})`,
    transformOrigin: "50% 42%", // 以头顶发根附近为原点，两侧鬓发随脸展开
  };
}

/**
 * 胡须层 CSS：轻胡等跨脸复用款叠加脸宽缩放；重胡已按脸型分目录绘制时
 * 缩放系数接近 1 的脸不受影响，宽脸仍可兜底。
 * 原点取下颌，避免把胡须往上拧。
 */
export function avatarBeardLayerStyle(
  faceIndex: number,
  gender: AvatarGender | string | null | undefined = DEFAULT_AVATAR_CONFIG.gender,
): { transform: string; transformOrigin: string } {
  // 分目录素材已含加宽时，只做温和补偿（相对发型系数的一半）以免双重拉宽
  const sx = 1 + (faceWidthScale(faceIndex, gender) - 1) * 0.35;
  return {
    transform: `scaleX(${sx.toFixed(4)})`,
    transformOrigin: "50% 72%",
  };
}

/** 静态资源版本：改 SVG 后递增，避免 CDN/浏览器长缓存看不到更新 */
const AVATAR_ASSET_VER = "20260803c";

export const DEFAULT_AVATAR_BASE_PATH = "/avatars";

export type AvatarPartSrcOptions = {
  /** CDN / public prefix. Default `/avatars` keeps host-app URLs identical. */
  basePath?: string;
};

function resolveAvatarBasePath(
  basePathOrOptions?: string | AvatarPartSrcOptions,
): string {
  const raw =
    typeof basePathOrOptions === "string"
      ? basePathOrOptions
      : (basePathOrOptions?.basePath ?? DEFAULT_AVATAR_BASE_PATH);
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : DEFAULT_AVATAR_BASE_PATH;
}

export function avatarPartSrc(
  category: AvatarCategory,
  index: number,
  appearance: Pick<AvatarConfig, "gender" | "skin" | "face"> = DEFAULT_AVATAR_CONFIG,
  basePathOrOptions: string | AvatarPartSrcOptions = DEFAULT_AVATAR_BASE_PATH,
): string {
  const i = clampPartIndex(index);
  const gender = normalizeAvatarGender(appearance.gender);
  const q = `v=${AVATAR_ASSET_VER}`;
  const base = resolveAvatarBasePath(basePathOrOptions);
  if (category === "face") {
    return `${base}/${gender}/face/${clampSkinIndex(appearance.skin)}/${i}.svg?${q}`;
  }
  if (category === "beard") {
    return `${base}/${gender}/beard/${clampPartIndex(appearance.face)}/${i}.svg?${q}`;
  }
  return `${base}/${gender}/${category}/${i}.svg?${q}`;
}

export function clampPartIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  const n = Math.trunc(index);
  if (n < 0) return 0;
  if (n >= AVATAR_OPTION_COUNT) return AVATAR_OPTION_COUNT - 1;
  return n;
}

export function clampSkinIndex(index: number): number {
  if (!Number.isFinite(index)) return DEFAULT_AVATAR_CONFIG.skin;
  return Math.min(AVATAR_SKIN_TONES.length - 1, Math.max(0, Math.trunc(index)));
}

export function normalizeAvatarGender(value?: string | null): AvatarGender {
  return value === "female" ? "female" : "male";
}

export function normalizeAvatarConfig(
  partial?: Partial<AvatarConfig> | null,
): AvatarConfig {
  const gender = normalizeAvatarGender(partial?.gender);
  return {
    gender,
    skin: clampSkinIndex(partial?.skin ?? DEFAULT_AVATAR_CONFIG.skin),
    face: clampPartIndex(partial?.face ?? DEFAULT_AVATAR_CONFIG.face),
    hair: clampPartIndex(partial?.hair ?? DEFAULT_AVATAR_CONFIG.hair),
    brows: clampPartIndex(partial?.brows ?? DEFAULT_AVATAR_CONFIG.brows),
    eyes: clampPartIndex(partial?.eyes ?? DEFAULT_AVATAR_CONFIG.eyes),
    nose: clampPartIndex(partial?.nose ?? DEFAULT_AVATAR_CONFIG.nose),
    mouth: clampPartIndex(partial?.mouth ?? DEFAULT_AVATAR_CONFIG.mouth),
    beard:
      gender === "female"
        ? 0
        : clampPartIndex(partial?.beard ?? DEFAULT_AVATAR_CONFIG.beard),
    accessory: clampPartIndex(
      partial?.accessory ?? DEFAULT_AVATAR_CONFIG.accessory,
    ),
  };
}

/** Optional adapter: map 1lap-style Driver columns onto AvatarConfig. Host apps may persist config however they like. */
export function avatarConfigFromDriver(driver: {
  avatarGender?: string | null;
  avatarSkin?: number | null;
  avatarFace?: number | null;
  avatarHair?: number | null;
  avatarBrows?: number | null;
  avatarEyes?: number | null;
  avatarNose?: number | null;
  avatarMouth?: number | null;
  avatarBeard?: number | null;
  avatarAccessory?: number | null;
}): AvatarConfig {
  return normalizeAvatarConfig({
    gender: normalizeAvatarGender(driver.avatarGender),
    skin: driver.avatarSkin ?? undefined,
    face: driver.avatarFace ?? undefined,
    hair: driver.avatarHair ?? undefined,
    brows: driver.avatarBrows ?? undefined,
    eyes: driver.avatarEyes ?? undefined,
    nose: driver.avatarNose ?? undefined,
    mouth: driver.avatarMouth ?? undefined,
    beard: driver.avatarBeard ?? undefined,
    accessory: driver.avatarAccessory ?? undefined,
  });
}

export function partLabels(
  category: AvatarCategory,
  gender: AvatarGender = DEFAULT_AVATAR_CONFIG.gender,
): string[] {
  if (category === "face") {
    return gender === "female"
      ? [
          "鹅蛋脸",
          "圆脸",
          "小 V 尖脸",
          "柔和方脸",
          "纤长尖脸",
          "短圆脸",
          "利落方脸",
          "柔和圆下巴",
          "双下巴",
          "倒三角尖脸",
        ]
      : [
          "自然长圆脸",
          "圆脸",
          "棱角脸",
          "宽方脸",
          "长方脸",
          "短圆脸",
          "硬朗方下巴",
          "厚实圆下巴",
          "双下巴",
          "宽颧方颌",
        ];
  }
  if (category === "eyes") {
    return [
      "经典杏眼",
      "圆润大眼",
      "温柔垂眼",
      "锐利上挑眼",
      "笑眯眼",
      "猫系眼",
      "三白眼",
      "星光漫画眼",
      "细长冷眼",
      "古典丹凤眼",
    ];
  }
  if (category === "hair") {
    return gender === "male"
      ? [
          "尖刺短发",
          "侧分短发",
          "光头",
          "凌乱短发",
          "侧扫长发",
          "莫西干",
          "狼尾发型",
          "经典 Afro 爆炸头",
          "丸子头",
          "蓬松卷发",
        ]
      : [
          "短层次",
          "柔顺长发",
          "侧分长发",
          "凌乱短发",
          "超长直发",
          "高丸子头",
          "狼尾长发",
          "中式古典",
          "侧丸子头",
          "公主长发",
        ];
  }
  if (category === "accessory") {
    return [
      "无饰品",
      "黑色墨镜",
      "圆框眼镜",
      "方框眼镜",
      "AMG 车队帽",
      "赛车护目镜",
      "迈凯轮车队帽",
      "法拉利车队帽",
      "渔夫帽",
      "红牛车队帽",
    ];
  }
  if (category === "beard") {
    return [
      "无",
      "八字细胡",
      "山形短胡",
      "翘角胡",
      "山羊胡",
      "宽大胡子",
      "环嘴胡",
      "下巴带",
      "短络腮",
      "浓密络腮",
    ];
  }
  return Array.from({ length: AVATAR_OPTION_COUNT }, (_, i) => `款式 ${i + 1}`);
}
