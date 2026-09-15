import { describe, expect, it } from "vitest";
import {
  avatarBeardLayerStyle,
  avatarPartSrc,
  DEFAULT_AVATAR_CONFIG,
  faceWidthScale,
} from "./avatar-parts";

describe("faceWidthScale", () => {
  it("基准脸型缩放为 1", () => {
    expect(faceWidthScale(0, "male")).toBeCloseTo(1, 4);
  });

  it("宽脸（宽方脸 index 3）明显大于 1", () => {
    expect(faceWidthScale(3, "male")).toBeGreaterThan(1.15);
  });

  it("尖脸（小 V / 棱角）小于 1", () => {
    // 女性 tip face index 2 太阳穴更靠内 → 更窄
    expect(faceWidthScale(2, "female")).toBeLessThan(1);
  });

  it("男女宽脸系数可不同", () => {
    // male face 9 比 female face 9 更宽
    expect(faceWidthScale(9, "male")).toBeGreaterThan(faceWidthScale(9, "female"));
  });
});

describe("胡须跟脸宽", () => {
  it("按当前脸型选择胡须目录", () => {
    expect(
      avatarPartSrc("beard", 5, { gender: "male", skin: 1, face: 3 }),
    ).toContain("/beard/3/5.svg");
  });

  it("宽脸胡须层有水平缩放", () => {
    const style = avatarBeardLayerStyle(3, "male");
    expect(style.transform).toMatch(/^scaleX\(1\./);
    expect(style.transformOrigin).toBe("50% 72%");
  });
});

describe("avatarPartSrc basePath", () => {
  it("defaults to /avatars (identical to 1lap host URLs)", () => {
    expect(
      avatarPartSrc("eyes", 0, DEFAULT_AVATAR_CONFIG),
    ).toMatch(/^\/avatars\/male\/eyes\/0\.svg\?v=/);
  });

  it("accepts a string 4th argument as basePath", () => {
    expect(
      avatarPartSrc("eyes", 0, DEFAULT_AVATAR_CONFIG, "/cdn/avatars"),
    ).toContain("/cdn/avatars/male/eyes/0.svg");
  });

  it("accepts an options object", () => {
    expect(
      avatarPartSrc("face", 1, DEFAULT_AVATAR_CONFIG, {
        basePath: "https://cdn.example/avatars",
      }),
    ).toContain("https://cdn.example/avatars/male/face/1/1.svg");
  });

  it("strips trailing slashes on basePath", () => {
    expect(
      avatarPartSrc("hair", 2, DEFAULT_AVATAR_CONFIG, "/avatars/"),
    ).toContain("/avatars/male/hair/2.svg");
  });
});
