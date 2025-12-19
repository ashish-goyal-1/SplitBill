import { Typography } from "@mui/material"

export const WelcomeMessage = () => {
    const profile = JSON.parse(localStorage.getItem("profile"));
    const userName = profile?.firstName || profile?.emailId?.split('@')[0] || 'User';

    return (
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome back, {userName}! 👋
        </Typography>
    )
}
