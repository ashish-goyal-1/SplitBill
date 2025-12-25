import PropTypes from 'prop-types';
// @mui
import { Box } from '@mui/material';

// ----------------------------------------------------------------------

Scrollbar.propTypes = {
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};

export default function Scrollbar({ children, sx, ...other }) {
  return (
    <Box
      sx={{
        overflow: 'auto',
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}
