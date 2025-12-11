import { Avatar, Button, Grid, Modal, Stack, Typography, IconButton, Tooltip, Snackbar, Alert } from "@mui/material"
import { Box } from "@mui/system"
import Iconify from "../../Iconify"
import useResponsive from '../../../theme/hooks/useResponsive';
import { convertToCurrency, currencyFind } from '../../../utils/helper';
import BalanceSettlement from "./balanceSettlement";
import React from 'react'
import { useState, useEffect } from "react";
import configData from '../../../config.json'
import gravatarUrl from 'gravatar-url';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getUserNamesService } from '../../../services/userServices';



const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    boxShadow: 2,
    p: 4,
    borderRadius: 1
};

const SettlementCard = ({ mySettle, currencyType }) => {
    const xsUp = useResponsive('up', 'sm');
    const params = useParams();
    const [reload, setReload] = useState(false)
    const [open, setOpen] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [snackSeverity, setSnackSeverity] = useState('success');
    const [nudgeLoading, setNudgeLoading] = useState(false);
    const [names, setNames] = useState({});

    // Fetch display names
    useEffect(() => {
        const fetchNames = async () => {
            const nameMap = await getUserNamesService([mySettle[0], mySettle[1]]);
            setNames(nameMap);
        };
        fetchNames();
    }, [mySettle[0], mySettle[1]]);

    const getDisplayName = (email) => names[email]?.displayName || email.split('@')[0];

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        if (reload)
            window.location.reload()
        else {
            setOpen(false)
        }

    };

    const handleNudge = async () => {
        setNudgeLoading(true);
        try {
            const response = await axios.post(
                configData.GROUP_NUDGE,
                {
                    groupId: params.groupId,
                    fromEmail: mySettle[1], // Person who is owed
                    toEmail: mySettle[0],   // Person who owes
                    amount: mySettle[2]
                },
                { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('profile'))?.accessToken}` } }
            );
            setSnackMessage(response.data.message);
            setSnackSeverity(response.data.status === 'Success' ? 'success' : 'warning');
        } catch (error) {
            setSnackMessage('Failed to send reminder');
            setSnackSeverity('error');
        }
        setNudgeLoading(false);
        setSnackOpen(true);
    };

    return (
        <>
            <Stack direction="row" spacing={1} justifyContent="space-evenly"
                alignItems="center"
                sx={{
                    bgcolor: (theme) => theme.palette['warning'].lighter,
                    p: 3,
                    borderRadius: 2,
                    boxShadow: 4,
                }}
            >
                <Avatar src={gravatarUrl(mySettle[0], { size: 200, default: configData.USER_DEFAULT_LOGO_URL })} alt="photoURL" sx={{ width: 56, height: 56 }} />
                <Stack spacing={0}>
                    <Tooltip title={mySettle[0]} arrow>
                        <Typography variant='body' noWrap sx={{ fontWeight: 600, cursor: 'help', ...(!xsUp && { fontSize: 12 }) }}>
                            {getDisplayName(mySettle[0])}
                        </Typography>
                    </Tooltip>

                    <Typography variant='body' noWrap sx={{ ...(!xsUp && { fontSize: 12 }) }}>
                        to <Tooltip title={mySettle[1]} arrow><Typography component="span" variant='subtitle' sx={{ fontWeight: 600, cursor: 'help' }}>{getDisplayName(mySettle[1])}</Typography></Tooltip>
                    </Typography>

                    {!xsUp &&
                        <>
                            <Typography variant='body2' sx={{ fontSize: 10, mt: '3px', color: (theme) => theme.palette['error'].dark }}>
                                Settlement Amount
                            </Typography>
                            <Typography variant='body2' noWrap
                                sx={{
                                    fontWeight: 900,
                                    color: (theme) => theme.palette['error'].dark,
                                }}
                            >
                                {currencyFind(currencyType)} {convertToCurrency(mySettle[2])}
                            </Typography>
                        </>
                    }
                </Stack>
                {xsUp &&
                    <Stack spacing={0} alignItems="center">
                        <Typography variant='body2' sx={{ fontSize: 10, color: (theme) => theme.palette['error'].dark }}>
                            Settlement Amount
                        </Typography>
                        <Typography variant='body2' noWrap
                            sx={{
                                fontWeight: 900,
                                color: (theme) => theme.palette['error'].dark,
                            }}
                        >
                            {currencyFind(currencyType)} {convertToCurrency(mySettle[2])}
                        </Typography>
                    </Stack>}

                <Stack direction="row" spacing={1}>
                    <Tooltip title="Send Reminder">
                        <IconButton
                            onClick={handleNudge}
                            disabled={nudgeLoading}
                            sx={{
                                bgcolor: 'primary.light',
                                '&:hover': { bgcolor: 'primary.main', color: 'white' }
                            }}
                        >
                            <Iconify icon="mdi:bell-ring" />
                        </IconButton>
                    </Tooltip>
                    <Button onClick={handleOpen}>Settle</Button>
                </Stack>

                <Modal
                    open={open}
                    onClose={handleClose}
                >
                    <Box sx={style} width={xsUp ? '50%' : '90%'}>
                        <BalanceSettlement currencyType={currencyType} settleTo={mySettle[1]} settleFrom={mySettle[0]} amount={mySettle[2]} handleClose={handleClose} setReload={setReload} />
                    </Box>
                </Modal>
            </Stack>

            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
                <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </>
    )
}

export default SettlementCard