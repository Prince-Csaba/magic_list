"use client";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface Props {
  label: string;
  today: number;
  week: number;
  allTime?: number;
  gradient: string;
  onAdd: () => void;
  onRemove: () => void;
}

const btn = {
  color: "#fff",
  bgcolor: "rgba(255,255,255,0.22)",
  width: 48,
  height: 48,
  "&:hover": { bgcolor: "rgba(255,255,255,0.35)" },
  "&.Mui-disabled": { color: "rgba(255,255,255,0.4)" },
};

export default function TallyTile({ label, today, week, allTime, gradient, onAdd, onRemove }: Props) {
  const count = allTime ?? today;
  return (
    <Box
      sx={{
        background: gradient,
        color: "#fff",
        borderRadius: 4,
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        boxShadow: 3,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
        {count}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.9, mb: 1 }}>
        {allTime === undefined ? `${week} this week` : "all time"}
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <IconButton aria-label={`remove ${label}`} disabled={count <= 0} onClick={onRemove} sx={btn}>
          <RemoveIcon />
        </IconButton>
        <IconButton aria-label={`add ${label}`} onClick={onAdd} sx={btn}>
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
