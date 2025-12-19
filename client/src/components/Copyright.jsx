import { Link, Stack, Typography, IconButton, Tooltip } from "@mui/material";
import Iconify from "./Iconify";

export default function Copyright() {
  const developer = {
    name: "Ashish Goyal",
    github: "https://github.com/ashish-goyal-1/SplitBill",
    linkedin: "https://www.linkedin.com/in/ashish-goyal-66422b257/"
  };

  return (
    <Stack spacing={1} alignItems="center" sx={{ py: 2 }}>
      <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
        Built with ❤️ by
      </Typography>
      <Typography variant="subtitle2" align="center" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {developer.name}
      </Typography>
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="GitHub">
          <IconButton
            component="a"
            href={developer.github}
            target="_blank"
            size="small"
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <Iconify icon="mdi:github" width={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="LinkedIn">
          <IconButton
            component="a"
            href={developer.linkedin}
            target="_blank"
            size="small"
            sx={{ color: 'text.secondary', '&:hover': { color: '#0077B5' } }}
          >
            <Iconify icon="mdi:linkedin" width={18} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        © {new Date().getFullYear()} SplitBill
      </Typography>
    </Stack>
  );
}
