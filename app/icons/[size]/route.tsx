import { ImageResponse } from "next/og";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }, { size: "180" }];
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ size: string }> }
) {
  const size = Number((await ctx.params).size) || 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6750a4",
          color: "white",
          fontSize: size * 0.55,
          fontWeight: 700,
        }}
      >
        M
      </div>
    ),
    { width: size, height: size }
  );
}
