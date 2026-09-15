import {
  AVATAR_LAYER_ORDER,
  avatarBeardLayerStyle,
  avatarConfigFromDriver,
  avatarHairLayerStyle,
  avatarPartSrc,
  isHatAccessory,
  normalizeAvatarConfig,
  type AvatarConfig,
} from "@1lap/avatar-core";

export type AvatarProps = {
  name: string;
  config?: Partial<AvatarConfig> | null;
  /** Optional 1lap-style Driver column adapter */
  driver?: {
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
  } | null;
  size?: number;
  className?: string;
  /** CDN / public prefix passed to avatarPartSrc. Default `/avatars`. */
  assetBasePath?: string;
};

/** Layered SVG avatar. Prefer `Avatar`; `DriverAvatar` is kept as a 1lap alias. */
export function Avatar({
  name,
  config,
  driver,
  size = 64,
  className = "",
  assetBasePath,
}: AvatarProps) {
  const layers = normalizeLayers(config, driver);

  return (
    <span
      className={`lap-avatar ${className}`.trim()}
      style={{
        position: "relative",
        display: "inline-block",
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 12,
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 38%, rgba(99,102,241,.22), transparent 52%), linear-gradient(145deg, #1e293b, #090e18)",
      }}
      role="img"
      aria-label={`${name} 的头像`}
    >
      {AVATAR_LAYER_ORDER.filter(
        (cat) => !(cat === "hair" && isHatAccessory(layers.accessory)),
      ).map((cat) => (
        <img
          key={cat}
          src={avatarPartSrc(cat, layers[cat], layers, assetBasePath)}
          alt=""
          width={size}
          height={size}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            ...(cat === "hair"
              ? avatarHairLayerStyle(layers.face, layers.gender)
              : cat === "beard"
                ? avatarBeardLayerStyle(layers.face, layers.gender)
                : {}),
          }}
          draggable={false}
        />
      ))}
    </span>
  );
}

/** @deprecated Prefer `Avatar`. Alias for 1lap / GT7 host apps. */
export const DriverAvatar = Avatar;

function normalizeLayers(
  config?: Partial<AvatarConfig> | null,
  driver?: AvatarProps["driver"],
): AvatarConfig {
  if (config) {
    return normalizeAvatarConfig(config);
  }
  if (driver) return avatarConfigFromDriver(driver);
  return normalizeAvatarConfig({});
}
