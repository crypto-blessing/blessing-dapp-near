// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import{ viewMethodOnContract } from 'src/@core/configs/utils'
import {getWalletConnection, getNearConfig, getCurrentUser} from 'src/@core/configs/wallet'


import {transBlesingsFromWalletBlessings} from 'src/@core/utils/blessing.js'


import { useEffect, useState } from "react"


const columns = [
    { id: 'blessing', label: 'Blessing', minWidth: 100, type: 'image' },
    { id: 'time', label: 'Time', minWidth: 100 },
    { id: 'amount', label: 'Send Amount', minWidth: 100, type: 'amount' },
    { id: 'quantity', label: 'Claime Quantity', minWidth: 100, type: 'quantity' },
    { id: 'type', label: 'Claim Way', minWidth: 100 },
    { id: 'progress', label: 'Claim Progress', minWidth: 100, type: 'progress' }
]

const BlessingSended = () => {

    // ** States
    const [page, setPage] = useState(0)
    const [blessings, setBlessings] = useState([])
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const [nearConfig, setNearConfig] = useState(null)
    const [currentUser, setCurrentUser] = useState('')

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(+event.target.value)
        setPage(0)
    }


    useEffect(() => {
        const connectWalletOnPageLoad = async () => {
            try {
                setNearConfig(await getNearConfig())
                setCurrentUser(await getCurrentUser())
                if (currentUser) {
                    const chainData = await viewMethodOnContract(nearConfig, 'my_sended_blessings', '{"sender": "' + currentUser + '"}');
                    setBlessings(transBlesingsFromWalletBlessings(currentUser, chainData))
                }
            } catch (err) {
                console.log("Error: ", err)
            }
        }
        connectWalletOnPageLoad()
    }, [currentUser])

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h5'>
                Blessing Sended History
                </Typography>
                <Typography variant='body2'>Do you need help? You can join our telegram group: 
                    <Link target='_blank' href="https://t.me/crypto_blessing_eng" underline="always">Find admin in telegram</Link>
                </Typography>
            </Grid>

            <Grid item xs={12}>
                {blessings.length > 0 ?
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 800 }}>
                        <Table stickyHeader aria-label='sticky table'>
                        <TableHead>
                            <TableRow>
                            {columns.map(column => (
                                <TableCell key={column.id} align={column.align} sx={{ minWidth: column.minWidth }}>
                                {column.label}
                                </TableCell>
                            ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {blessings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                            return (
                                <TableRow hover role='checkbox' tabIndex={-1} key={row.code}>
                                {columns.map(column => {
                                    const value = row[column.id]
                                    const revoked = row.revoked

                                    return (
                                    <TableCell key={column.id} align={column.align}>
                                        {column.type === 'image' && !revoked ? 
                                        <img width={80} alt='CryptoBlessing' src={process.env.vultr_cdn_path + value} />
                                        : 
                                        ''}

                                        {column.type === 'image' && revoked ? 
                                        <Badge badgeContent='revoked' color="secondary">
                                            <img width={80} alt='CryptoBlessing' src={process.env.vultr_cdn_path + value} />
                                        </Badge>
                                        : 
                                        ''}

                                        {column.type === undefined ? value : ''}

                                        {column.type === 'amount' ?
                                        <Chip variant="outlined" avatar={<Avatar sx={{ width: 24, height: 24 }}>Ⓝ</Avatar>} color="secondary" label={value} />
                                        : ''}

                                        {column.type == 'quantity' ?
                                         <Chip variant="outlined" color="primary" label={value} icon={<AccountCircleIcon />} />
                                       : ''    
                                        }

                                        {column.type === 'progress' ?
                                            <Link target='_blank' href={value}  underline="always">
                                                Check Progress
                                            </Link>
                                        :
                                        ''}
                                    </TableCell>
                                    )
                                })}
                                </TableRow>
                            )
                            })}
                        </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100]}
                        component='div'
                        count={blessings.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
                :
                <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Typography  variant="overline" display="block" gutterBottom>
                        You don't have sended any blessings yet!
                    </Typography>
                </Box>
                }
                
            </Grid>
        </Grid>
    )
}

export default BlessingSended
