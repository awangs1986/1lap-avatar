import { useCallback, useState, type CSSProperties } from "react";
import {
  AVATAR_CATEGORIES,
  AVATAR_CATEGORY_LABEL,
  AVATAR_GENDERS,
  AVATAR_GENDER_LABEL,
  AVATAR_OPTION_COUNT,
  AVATAR_SKIN_TONES,
  avatarBeardLayerStyle,
  avatarHairLayerStyle,
  avatarPartSrc,
  isHatAccessory,
  normalizeAvatarConfig,
  partLabels,
  type AvatarCategory,
  type AvatarConfig,
  type AvatarGender,
} from "@1lap/avatar-core";
import { Avatar } from "./avatar";
import "./avatar-builder.css";

export type AvatarBuilderProps = {
  initial: AvatarConfig;
  /** Display name for preview aria-label */
  name?: string;
  className?: string;
  onChange?: (config: AvatarConfig) => void;
  onSave?: (config: AvatarConfig) => void | Promise<void>;
  saveLabel?: string;
  /** CDN / public prefix for SVG layers. Default `/avatars`. */
  assetBasePath?: string;
};

export function AvatarBuilder({
  initial,
  name = "Avatar",
  className = "",
  onChange,
  onSave,
  saveLabel = "保存捏脸",
  assetBasePath,
}: AvatarBuilderProps) {
  const [config, setConfig] = useState(() => normalizeAvatarConfig(initial));
  const [tab, setTab] = useState<AvatarCategory>("face");
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const labels = partLabels(tab, config.gender);
  const visibleCategories =
    config.gender === "female"
      ? AVATAR_CATEGORIES.filter((category) => category !== "beard")
      : AVATAR_CATEGORIES;

  const update = useCallback(
    (next: AvatarConfig) => {
      setConfig(next);
      onChange?.(next);
      setHint(null);
    },
    [onChange],
  );

  function pick(category: AvatarCategory, index: number) {
    update({ ...config, [category]: index });
  }

  function pickGender(gender: AvatarGender) {
    const next = normalizeAvatarConfig({
      ...config,
      gender,
      beard: gender === "female" ? 0 : config.beard,
    });
    update(next);
    if (gender === "female" && tab === "beard") setTab("face");
  }

  async function handleSave() {
    if (!onSave) {
      setHint("已更新本地预览");
      return;
    }
    setSaving(true);
    try {
      await onSave(config);
      setHint("已保存");
    } catch (err) {
      setHint(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const partSrc = (
    category: AvatarCategory,
    index: number,
    appearance: AvatarConfig = config,
  ) => avatarPartSrc(category, index, appearance, assetBasePath);

  return (
    <div className={`lap-avatar-builder ${className}`.trim()}>
      <div className="lap-ab-header">
        <h2 className="lap-ab-title">捏脸头像</h2>
        <p className="lap-ab-sub">日漫风格 · 八组部件各 10 款（含饰品）。</p>
      </div>

      <div className="lap-ab-body">
        <div className="lap-ab-layout">
          <div className="lap-ab-preview">
            <div className="lap-ab-preview-ring">
              <Avatar
                name={name}
                config={config}
                size={180}
                className="rounded-2xl"
                assetBasePath={assetBasePath}
              />
            </div>
            <span className="lap-ab-live">LIVE PREVIEW</span>
          </div>

          <div className="lap-ab-controls">
            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend className="lap-ab-legend">性别主题</legend>
              <div className="lap-ab-gender">
                {AVATAR_GENDERS.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    aria-pressed={config.gender === gender}
                    onClick={() => pickGender(gender)}
                    className="lap-ab-btn"
                  >
                    {gender === "male" ? "少年漫" : "少女漫"} ·{" "}
                    {AVATAR_GENDER_LABEL[gender]}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend className="lap-ab-legend">肤色</legend>
              <div className="lap-ab-skins">
                {AVATAR_SKIN_TONES.map((tone, index) => (
                  <button
                    key={tone.label}
                    type="button"
                    title={tone.label}
                    aria-label={`肤色：${tone.label}`}
                    aria-pressed={config.skin === index}
                    onClick={() => update({ ...config, skin: index })}
                    className="lap-ab-skin"
                    style={{ backgroundColor: tone.color }}
                  />
                ))}
              </div>
            </fieldset>

            <div className="lap-ab-divider" />

            <div className="lap-ab-tabs">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={tab === cat}
                  onClick={() => setTab(cat)}
                  className="lap-ab-tab"
                >
                  {AVATAR_CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>

            <div className="lap-ab-grid">
              {Array.from({ length: AVATAR_OPTION_COUNT }, (_, i) => {
                const active = config[tab] === i;
                let overlayStyle: CSSProperties | undefined;
                if (tab === "hair") {
                  overlayStyle = avatarHairLayerStyle(config.face, config.gender);
                } else if (tab === "beard") {
                  overlayStyle = avatarBeardLayerStyle(config.face, config.gender);
                }
                return (
                  <button
                    key={i}
                    type="button"
                    title={labels[i]}
                    aria-pressed={active}
                    onClick={() => pick(tab, i)}
                    className="lap-ab-part"
                  >
                    <img
                      src={partSrc("face", tab === "face" ? i : config.face)}
                      alt=""
                      draggable={false}
                    />
                    {tab === "accessory" ? (
                      <>
                        <img
                          src={partSrc("eyes", config.eyes)}
                          alt=""
                          draggable={false}
                        />
                        {!isHatAccessory(i) ? (
                          <img
                            src={partSrc("hair", config.hair)}
                            alt=""
                            draggable={false}
                            style={avatarHairLayerStyle(
                              config.face,
                              config.gender,
                            )}
                          />
                        ) : null}
                      </>
                    ) : null}
                    {tab !== "face" ? (
                      <img
                        src={partSrc(tab, i)}
                        alt=""
                        draggable={false}
                        style={overlayStyle}
                      />
                    ) : null}
                    <span className="lap-ab-part-label">{labels[i]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lap-ab-footer">
          <button
            type="button"
            className="lap-ab-save"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "保存中…" : saveLabel}
          </button>
          {hint ? <span className="lap-ab-hint">{hint}</span> : null}
        </div>
      </div>
    </div>
  );
}
