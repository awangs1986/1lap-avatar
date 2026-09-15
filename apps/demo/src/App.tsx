import { useState } from "react";
import {
  DEFAULT_AVATAR_CONFIG,
  type AvatarConfig,
} from "@1lap/avatar-core";
import { AvatarBuilder } from "@1lap/avatar-react";

export default function App() {
  const [config, setConfig] = useState<AvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });

  return (
    <>
      <header className="demo-header">
        <h1>1lap Avatar Demo</h1>
        <p>
          Decoupled layered SVG avatar (glasses / accessories included). Host apps
          persist <code>AvatarConfig</code> themselves — this demo only keeps
          local React state. 「保存」打印 / 弹出当前 JSON。
        </p>
      </header>

      <AvatarBuilder
        initial={DEFAULT_AVATAR_CONFIG}
        name="Demo Driver"
        onChange={setConfig}
        onSave={(next) => {
          console.log("AvatarConfig", next);
          alert(JSON.stringify(next, null, 2));
        }}
        saveLabel="保存"
      />

      <pre className="demo-json">{JSON.stringify(config, null, 2)}</pre>
    </>
  );
}
