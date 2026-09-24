import React from "react";

const CONE_FILL = {
  vermelho: "#ef4444",
  azul: "#3b82f6",
  verde: "#22c55e",
  amarelo: "#eab308",
  branco: "#ffffff",
  preto: "#1e293b",
};

export default function ConeIcon({ color, size = 30 }) {
  const fill = CONE_FILL[color] || "#64748b";
  const isWhite = color === "branco";
  const stroke = isWhite ? "#94a3b8" : "none";
  const strokeWidth = isWhite ? 1 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corpo do cone */}
      <path
        d="M16 3 L26 27 L6 27 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Faixa branca inferior */}
      <path d="M12.5 14 L19.5 14 L20.5 17.5 L11.5 17.5 Z" fill="#ffffff" />
      {/* Faixa branca superior */}
      <path d="M14 8 L18 8 L18.8 10.5 L13.2 10.5 Z" fill="#ffffff" />
      {/* Base */}
      <rect
        x="4"
        y="27"
        width="24"
        height="3.5"
        rx="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}