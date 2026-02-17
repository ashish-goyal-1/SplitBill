import { Box, CircularProgress } from '@mui/material';

export default function LoadingScreen() {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100%',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
                backgroundColor: 'background.default'
            }}
        >
            <CircularProgress size={40} />
        </Box>
    );
}
